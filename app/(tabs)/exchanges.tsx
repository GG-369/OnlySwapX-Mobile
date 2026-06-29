import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowLeftRight, CalendarPlus, MessageCircle, XCircle } from 'lucide-react-native';
import { useAuth } from '@/context/AuthContext';
import { exchangeService } from '@/services/exchangeService';
import { sessionService } from '@/services/sessionService';
import { ExchangeSummaryResponse } from '@/types';
import { Badge, Button, Card, EmptyState, LoadingState, ScreenHeader, colors } from '@/components/ui';
import { formatDate, readableError, statusLabel } from '@/utils/format';

const FILTERS = ['ALL', 'PENDING', 'ACCEPTED', 'REJECTED', 'ENDED'];

export default function ExchangesScreen() {
  const router = useRouter();
  const { user, refreshUser } = useAuth();
  const [exchanges, setExchanges] = useState<ExchangeSummaryResponse[]>([]);
  const [filter, setFilter] = useState('ALL');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

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

  const schedule = async (exchange: ExchangeSummaryResponse) => {
    try {
      await sessionService.create({
        exchangeId: exchange.id,
        topic: exchange.skillName || `Intercambio #${exchange.id}`,
        scheduledAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        creditsAmount: 1,
        durationMinutes: 45,
      });
      await refreshUser();
      Alert.alert('Sesión propuesta', 'Se creó una sesión sugerida para mañana.');
    } catch (error) {
      Alert.alert('No se pudo crear sesión', readableError(error, 'Intenta desde la pestaña Sesiones.'));
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
                      <Button label="Agendar" icon={CalendarPlus} onPress={() => schedule(exchange)} />
                      <Button label="Finalizar" variant="danger" onPress={() => end(exchange.id)} />
                    </>
                  ) : null}
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
});
