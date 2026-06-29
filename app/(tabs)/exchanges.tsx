import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, Modal, RefreshControl, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowLeftRight, CalendarPlus, MessageCircle, XCircle } from 'lucide-react-native';
import { useAuth } from '@/context/AuthContext';
import { exchangeService } from '@/services/exchangeService';
import { sessionService } from '@/services/sessionService';
import { ExchangeSummaryResponse } from '@/types';
import { Badge, Button, Card, EmptyState, LoadingState, ScreenHeader, colors } from '@/components/ui';
import { formatDate, readableError, statusLabel } from '@/utils/format';

const FILTERS = ['ALL', 'PENDING', 'ACCEPTED', 'REJECTED', 'ENDED'];

const toDateInput = (date: Date) => {
  const pad = (value: number) => String(value).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
};

const sanitizeDateTime = (value: string) => {
  const trimmed = value.trim();
  if (!trimmed) return '';
  return trimmed.length === 16 ? `${trimmed}:00` : trimmed;
};

export default function ExchangesScreen() {
  const router = useRouter();
  const { user, refreshUser } = useAuth();
  const [exchanges, setExchanges] = useState<ExchangeSummaryResponse[]>([]);
  const [filter, setFilter] = useState('ALL');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [scheduleExchange, setScheduleExchange] = useState<ExchangeSummaryResponse | null>(null);
  const [topic, setTopic] = useState('');
  const [scheduledAt, setScheduledAt] = useState('');
  const [creditsAmount, setCreditsAmount] = useState('1');
  const [durationMinutes, setDurationMinutes] = useState('45');
  const [creatingSession, setCreatingSession] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setExchanges(await exchangeService.getMyExchanges());
    } catch (error) {
      Alert.alert('No se cargaron los intercambios', readableError(error, 'Intenta nuevamente.'));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = useMemo(() => (
    filter === 'ALL' ? exchanges : exchanges.filter((exchange) => exchange.status === filter)
  ), [exchanges, filter]);

  const accept = async (id: number) => {
    try {
      await exchangeService.accept(id);
      load();
    } catch (error) {
      Alert.alert('No se pudo aceptar', readableError(error, 'Intenta nuevamente.'));
    }
  };

  const reject = (id: number) => {
    Alert.alert('Rechazar intercambio', '¿Seguro que quieres rechazar esta propuesta?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Rechazar',
        style: 'destructive',
        onPress: async () => {
          try {
            await exchangeService.reject(id);
            load();
          } catch (error) {
            Alert.alert('No se pudo rechazar', readableError(error, 'Intenta nuevamente.'));
          }
        },
      },
    ]);
  };

  const end = (id: number) => {
    Alert.alert('Finalizar intercambio', 'Las sesiones y reseñas existentes se mantendrán visibles.', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Finalizar',
        style: 'destructive',
        onPress: async () => {
          try {
            await exchangeService.end(id);
            load();
          } catch (error) {
            Alert.alert('No se pudo finalizar', readableError(error, 'Intenta nuevamente.'));
          }
        },
      },
    ]);
  };

  const openSchedule = (exchange: ExchangeSummaryResponse) => {
    const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000);
    setScheduleExchange(exchange);
    setTopic(exchange.skillName || `Intercambio #${exchange.id}`);
    setScheduledAt(toDateInput(tomorrow));
    setCreditsAmount('1');
    setDurationMinutes('45');
  };

  const createSession = async () => {
    if (!scheduleExchange || creatingSession) return;
    const credits = Number(creditsAmount);
    const duration = Number(durationMinutes);
    const when = sanitizeDateTime(scheduledAt);

    if (!topic.trim()) {
      Alert.alert('Tema requerido', 'Escribe el tema de la sesión.');
      return;
    }
    if (!when || Number.isNaN(Date.parse(when))) {
      Alert.alert('Fecha inválida', 'Usa el formato YYYY-MM-DDTHH:mm, por ejemplo 2026-06-30T18:00.');
      return;
    }
    if (!Number.isFinite(credits) || credits < 1) {
      Alert.alert('Créditos inválidos', 'La sesión debe costar al menos 1 crédito.');
      return;
    }
    if (!Number.isFinite(duration) || duration < 15) {
      Alert.alert('Duración inválida', 'La duración mínima recomendada es 15 minutos.');
      return;
    }

    setCreatingSession(true);
    try {
      await sessionService.create({
        exchangeId: scheduleExchange.id,
        topic: topic.trim(),
        scheduledAt: when,
        creditsAmount: credits,
        durationMinutes: duration,
      });
      await refreshUser();
      setScheduleExchange(null);
      Alert.alert('Sesión propuesta', 'La sesión fue enviada para aprobación.');
    } catch (error) {
      Alert.alert('No se pudo crear sesión', readableError(error, 'Intenta nuevamente.'));
    } finally {
      setCreatingSession(false);
    }
  };

  if (loading && !refreshing) return <LoadingState />;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor={colors.accent} />}
      showsVerticalScrollIndicator={false}
    >
      <ScreenHeader title="Intercambios" subtitle="Acepta propuestas, agenda sesiones y abre chats" />

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filters}>
        {FILTERS.map((item) => (
          <TouchableOpacity key={item} style={[styles.filter, filter === item && styles.filterActive]} onPress={() => setFilter(item)}>
            <Text style={[styles.filterText, filter === item && styles.filterTextActive]}>{item === 'ALL' ? 'Todo' : statusLabel(item)}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {filtered.length === 0 ? (
        <EmptyState icon={ArrowLeftRight} title="Sin intercambios" subtitle="Propón un intercambio desde Discover para iniciar una conversación." />
      ) : (
        <View style={styles.list}>
          {filtered.map((exchange) => {
            const isReceiver = exchange.receiverId === user?.id;
            const otherName = isReceiver ? exchange.requesterName : exchange.receiverName;
            return (
              <Card key={exchange.id} style={styles.card}>
                <View style={styles.cardTop}>
                  <View style={styles.cardTitleArea}>
                    <Text style={styles.name} numberOfLines={1}>{otherName}</Text>
                    <Text style={styles.meta}>{exchange.skillName || `Intercambio #${exchange.id}`}</Text>
                  </View>
                  <Badge tone={exchange.status === 'ACCEPTED' ? 'success' : exchange.status === 'REJECTED' ? 'danger' : 'neutral'}>
                    {statusLabel(exchange.status)}
                  </Badge>
                </View>

                <Text style={styles.date}>Creado: {formatDate(exchange.createdAt)}</Text>

                <View style={styles.actions}>
                  <Button label="Chat" icon={MessageCircle} variant="secondary" onPress={() => router.push({ pathname: '/exchanges/[id]/chat', params: { id: String(exchange.id) } })} />
                  {exchange.status === 'PENDING' && isReceiver ? (
                    <>
                      <Button label="Aceptar" onPress={() => accept(exchange.id)} />
                      <Button label="Rechazar" icon={XCircle} variant="danger" onPress={() => reject(exchange.id)} />
                    </>
                  ) : null}
                  {exchange.status === 'ACCEPTED' ? (
                    <>
                      <Button label="Agendar" icon={CalendarPlus} onPress={() => openSchedule(exchange)} />
                      <Button label="Finalizar" variant="danger" onPress={() => end(exchange.id)} />
                    </>
                  ) : null}
                </View>
              </Card>
            );
          })}
        </View>
      )}

      <Modal visible={!!scheduleExchange} transparent animationType="fade" onRequestClose={() => setScheduleExchange(null)}>
        <View style={styles.modalBackdrop}>
          <Card style={styles.modalCard}>
            <Text style={styles.modalTitle}>Agendar sesión</Text>
            <Text style={styles.modalSubtitle}>{scheduleExchange?.skillName || `Intercambio #${scheduleExchange?.id}`}</Text>

            <Text style={styles.inputLabel}>Tema</Text>
            <TextInput value={topic} onChangeText={setTopic} style={styles.input} placeholder="Tema de la sesión" placeholderTextColor="#64748b" />

            <Text style={styles.inputLabel}>Fecha y hora</Text>
            <TextInput value={scheduledAt} onChangeText={setScheduledAt} style={styles.input} placeholder="2026-06-30T18:00" placeholderTextColor="#64748b" autoCapitalize="none" />

            <View style={styles.inputRow}>
              <View style={styles.inputHalf}>
                <Text style={styles.inputLabel}>Créditos</Text>
                <TextInput value={creditsAmount} onChangeText={setCreditsAmount} style={styles.input} keyboardType="number-pad" />
              </View>
              <View style={styles.inputHalf}>
                <Text style={styles.inputLabel}>Minutos</Text>
                <TextInput value={durationMinutes} onChangeText={setDurationMinutes} style={styles.input} keyboardType="number-pad" />
              </View>
            </View>

            <View style={styles.modalActions}>
              <Button label="Cancelar" variant="secondary" onPress={() => setScheduleExchange(null)} disabled={creatingSession} />
              <Button label="Proponer sesión" onPress={createSession} loading={creatingSession} />
            </View>
          </Card>
        </View>
      </Modal>
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
    gap: 12,
  },
  cardTop: {
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'space-between',
  },
  cardTitleArea: {
    flex: 1,
  },
  name: {
    color: colors.text,
    fontSize: 17,
    fontWeight: '900',
  },
  meta: {
    color: colors.muted,
    fontSize: 12,
    marginTop: 3,
  },
  date: {
    color: '#cbd5e1',
    fontSize: 12,
  },
  actions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  modalBackdrop: {
    alignItems: 'center',
    backgroundColor: 'rgba(2, 6, 23, 0.72)',
    flex: 1,
    justifyContent: 'center',
    padding: 20,
  },
  modalCard: {
    gap: 12,
    width: '100%',
  },
  modalTitle: {
    color: colors.text,
    fontSize: 20,
    fontWeight: '900',
  },
  modalSubtitle: {
    color: colors.muted,
    fontSize: 13,
  },
  inputLabel: {
    color: '#cbd5e1',
    fontSize: 12,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  input: {
    backgroundColor: colors.background,
    borderColor: colors.border,
    borderRadius: 10,
    borderWidth: 1,
    color: colors.text,
    fontSize: 14,
    padding: 12,
  },
  inputRow: {
    flexDirection: 'row',
    gap: 10,
  },
  inputHalf: {
    flex: 1,
    gap: 8,
  },
  modalActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    justifyContent: 'flex-end',
  },
});
