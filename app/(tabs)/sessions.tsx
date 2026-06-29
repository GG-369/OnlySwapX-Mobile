import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Calendar, CheckCircle2, Clock, Star, XCircle } from 'lucide-react-native';
import { useAuth } from '@/context/AuthContext';
import { creditService } from '@/services/creditService';
import { reviewService } from '@/services/reviewService';
import { sessionService } from '@/services/sessionService';
import { SessionSummaryResponse } from '@/types';
import { Badge, Button, Card, EmptyState, LoadingState, ScreenHeader, colors } from '@/components/ui';
import { formatDate, readableError, statusLabel } from '@/utils/format';

const FILTERS = ['ALL', 'PROPOSED', 'SCHEDULED', 'COMPLETED', 'CANCELLED'];

export default function SessionsScreen() {
  const { user, refreshUser } = useAuth();
  const [sessions, setSessions] = useState<SessionSummaryResponse[]>([]);
  const [filter, setFilter] = useState('ALL');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setSessions(await sessionService.getMySessions());
    } catch (error) {
      Alert.alert('No se cargaron las sesiones', readableError(error, 'Intenta nuevamente.'));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = useMemo(() => (
    filter === 'ALL' ? sessions : sessions.filter((session) => session.status === filter)
  ), [filter, sessions]);

  const accept = async (id: number) => {
    try {
      await sessionService.accept(id);
      await refreshUser();
      load();
    } catch (error) {
      Alert.alert('No se pudo aceptar', readableError(error, 'Intenta nuevamente.'));
    }
  };

  const reject = async (id: number) => {
    try {
      await sessionService.reject(id);
      load();
    } catch (error) {
      Alert.alert('No se pudo rechazar', readableError(error, 'Intenta nuevamente.'));
    }
  };

  const confirm = async (id: number) => {
    try {
      await creditService.confirmSession(id);
      await refreshUser();
      load();
    } catch (error) {
      Alert.alert('No se pudo confirmar', readableError(error, 'Intenta nuevamente.'));
    }
  };

  const cancel = (id: number) => {
    Alert.alert('Cancelar sesión', 'Los créditos retenidos se devolverán si aplica.', [
      { text: 'No', style: 'cancel' },
      {
        text: 'Cancelar sesión',
        style: 'destructive',
        onPress: async () => {
          try {
            await sessionService.cancel(id);
            await refreshUser();
            load();
          } catch (error) {
            Alert.alert('No se pudo cancelar', readableError(error, 'Intenta nuevamente.'));
          }
        },
      },
    ]);
  };

  const review = (session: SessionSummaryResponse) => {
    const reviewedId = session.teacherId === user?.id ? session.studentId : session.teacherId;
    Alert.alert('Reseña rápida', '¿Registrar una reseña positiva de 5 estrellas?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Registrar',
        onPress: async () => {
          try {
            await reviewService.create({
              sessionId: session.id,
              reviewedId,
              rating: 5,
              comment: 'Buen intercambio académico.',
            });
            load();
          } catch (error) {
            Alert.alert('No se pudo crear reseña', readableError(error, 'Intenta desde la vista web si necesitas más detalle.'));
          }
        },
      },
    ]);
  };

  if (loading && !refreshing) return <LoadingState />;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor={colors.accent} />}
      showsVerticalScrollIndicator={false}
    >
      <ScreenHeader title="Sesiones" subtitle="Seguimiento de clases, créditos y confirmaciones" />

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filters}>
        {FILTERS.map((item) => (
          <TouchableOpacity key={item} style={[styles.filter, filter === item && styles.filterActive]} onPress={() => setFilter(item)}>
            <Text style={[styles.filterText, filter === item && styles.filterTextActive]}>{item === 'ALL' ? 'Todo' : statusLabel(item)}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {filtered.length === 0 ? (
        <EmptyState icon={Calendar} title="Sin sesiones" subtitle="Acepta un intercambio y agenda una sesión para empezar." />
      ) : (
        <View style={styles.list}>
          {filtered.map((session) => {
            const isPendingForMe = session.status === 'PROPOSED' && session.createdByUserId !== user?.id;
            const canConfirm = ['SCHEDULED', 'TEACHER_CONFIRMED', 'STUDENT_CONFIRMED'].includes(session.status) && !session.confirmedByCurrentUser;
            const canReview = session.status === 'COMPLETED' && !session.hasReviewedByCurrentUser;

            return (
              <Card key={session.id} style={styles.card}>
                <View style={styles.top}>
                  <View style={styles.titleArea}>
                    <Text style={styles.topic} numberOfLines={1}>{session.topic}</Text>
                    <Text style={styles.skill} numberOfLines={1}>{session.skillName}</Text>
                  </View>
                  <Badge tone={session.status === 'COMPLETED' ? 'success' : session.status === 'CANCELLED' ? 'danger' : 'neutral'}>
                    {statusLabel(session.status)}
                  </Badge>
                </View>

                <View style={styles.infoRow}>
                  <Clock size={15} color={colors.accent} />
                  <Text style={styles.infoText}>{formatDate(session.scheduledAt)} · {session.creditsAmount} crédito(s)</Text>
                </View>

                <Text style={styles.people}>Teacher: {session.teacherName}</Text>
                <Text style={styles.people}>Student: {session.studentName}</Text>

                <View style={styles.actions}>
                  {isPendingForMe ? (
                    <>
                      <Button label="Aceptar" icon={CheckCircle2} onPress={() => accept(session.id)} />
                      <Button label="Rechazar" icon={XCircle} variant="danger" onPress={() => reject(session.id)} />
                    </>
                  ) : null}
                  {canConfirm ? <Button label="Confirmar asistencia" icon={CheckCircle2} onPress={() => confirm(session.id)} /> : null}
                  {canReview ? <Button label="Reseñar" icon={Star} variant="secondary" onPress={() => review(session)} /> : null}
                  {session.status !== 'COMPLETED' && session.status !== 'CANCELLED' ? <Button label="Cancelar" variant="danger" onPress={() => cancel(session.id)} /> : null}
                </View>
              </Card>
            );
          })}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.background,
    flex: 1,
  },
  content: {
    padding: 20,
    paddingBottom: 96,
    paddingTop: 58,
  },
  filters: {
    gap: 8,
    paddingBottom: 16,
  },
  filter: {
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 13,
    paddingVertical: 8,
  },
  filterActive: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
  },
  filterText: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: '900',
  },
  filterTextActive: {
    color: colors.background,
  },
  list: {
    gap: 12,
  },
  card: {
    gap: 10,
  },
  top: {
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'space-between',
  },
  titleArea: {
    flex: 1,
  },
  topic: {
    color: colors.text,
    fontSize: 17,
    fontWeight: '900',
  },
  skill: {
    color: colors.muted,
    fontSize: 12,
    marginTop: 3,
  },
  infoRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  infoText: {
    color: '#cbd5e1',
    fontSize: 12,
    fontWeight: '700',
  },
  people: {
    color: colors.muted,
    fontSize: 12,
  },
  actions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
});
