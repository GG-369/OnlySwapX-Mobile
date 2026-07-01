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
      Alert.alert('Could not load exchanges', readableError(error, 'Try again.'));
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
      Alert.alert('Could not accept', readableError(error, 'Try again.'));
    }
  };

  const reject = (id: number) => {
    Alert.alert('Reject exchange', 'Are you sure you want to reject this proposal?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Reject',
        style: 'destructive',
        onPress: async () => {
          try {
            await exchangeService.reject(id);
            load();
          } catch (error) {
            Alert.alert('Could not reject', readableError(error, 'Try again.'));
          }
        },
      },
    ]);
  };

  const end = (id: number) => {
    Alert.alert('End exchange', 'Existing sessions and reviews will remain visible.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'End',
        style: 'destructive',
        onPress: async () => {
          try {
            await exchangeService.end(id);
            load();
          } catch (error) {
            Alert.alert('Could not end', readableError(error, 'Try again.'));
          }
        },
      },
    ]);
  };

  const openSchedule = (exchange: ExchangeSummaryResponse) => {
    const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000);
    setScheduleExchange(exchange);
    setTopic('');
    setScheduledAt(toDateInput(tomorrow));
    setCreditsAmount('');
    setDurationMinutes('');
  };

  const createSession = async () => {
    if (!scheduleExchange || creatingSession) return;
    const credits = Number(creditsAmount);
    const duration = Number(durationMinutes);
    const when = sanitizeDateTime(scheduledAt);

    if (!topic.trim()) {
      Alert.alert('Topic required', 'Write the topic of the session.');
      return;
    }
    if (!when || Number.isNaN(Date.parse(when))) {
      Alert.alert('Invalid date', 'Use the format YYYY-MM-DDTHH:mm, e.g. 2026-06-30T18:00.');
      return;
    }
    if (!Number.isFinite(credits) || credits < 1) {
      Alert.alert('Invalid credits', 'The session must cost at least 1 credit.');
      return;
    }
    if (!Number.isFinite(duration) || duration < 15) {
      Alert.alert('Invalid duration', 'The minimum recommended duration is 15 minutes.');
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
      Alert.alert('Session proposed', 'The session was sent for approval.');
    } catch (error) {
      Alert.alert('Could not create session', readableError(error, 'Try again.'));
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
      <ScreenHeader title="Exchanges" subtitle="Accept proposals, schedule sessions, and open chats" />

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filters}>
        {FILTERS.map((item) => (
          <TouchableOpacity key={item} style={[styles.filter, filter === item && styles.filterActive]} onPress={() => setFilter(item)}>
            <Text style={[styles.filterText, filter === item && styles.filterTextActive]}>{item === 'ALL' ? 'All' : statusLabel(item)}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {filtered.length === 0 ? (
        <EmptyState icon={ArrowLeftRight} title="No exchanges" subtitle="Propose an exchange from Discover to start a conversation." />
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
                    <Text style={styles.meta}>{exchange.skillName || `Exchange #${exchange.id}`}</Text>
                  </View>
                  <Badge tone={exchange.status === 'ACCEPTED' ? 'success' : exchange.status === 'REJECTED' ? 'danger' : 'neutral'}>
                    {statusLabel(exchange.status)}
                  </Badge>
                </View>

                <Text style={styles.date}>Created: {formatDate(exchange.createdAt)}</Text>

                <View style={styles.actions}>
                  <Button label="Chat" icon={MessageCircle} variant="secondary" onPress={() => router.push({ pathname: '/exchanges/[id]/chat', params: { id: String(exchange.id) } })} />
                  {exchange.status === 'PENDING' && isReceiver ? (
                    <>
                      <Button label="Accept" onPress={() => accept(exchange.id)} />
                      <Button label="Reject" icon={XCircle} variant="danger" onPress={() => reject(exchange.id)} />
                    </>
                  ) : null}
                  {exchange.status === 'ACCEPTED' ? (
                    <>
                      <Button label="Schedule" icon={CalendarPlus} onPress={() => openSchedule(exchange)} />
                      <Button label="End" variant="danger" onPress={() => end(exchange.id)} />
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
            <Text style={styles.modalTitle}>Schedule session</Text>
            <Text style={styles.modalSubtitle}>{scheduleExchange?.skillName || `Exchange #${scheduleExchange?.id}`}</Text>

            <Text style={styles.inputLabel}>Topic</Text>
            <TextInput value={topic} onChangeText={setTopic} style={styles.input} placeholder="Session topic" placeholderTextColor="#64748b" />

            <Text style={styles.inputLabel}>Date and time</Text>
            <TextInput value={scheduledAt} onChangeText={setScheduledAt} style={styles.input} placeholder="2026-06-30T18:00" placeholderTextColor="#64748b" autoCapitalize="none" />

            <View style={styles.inputRow}>
              <View style={styles.inputHalf}>
                <Text style={styles.inputLabel}>Credits</Text>
                <TextInput value={creditsAmount} onChangeText={setCreditsAmount} style={styles.input} keyboardType="number-pad" placeholder="e.g. 1" placeholderTextColor="#64748b" />
              </View>
              <View style={styles.inputHalf}>
                <Text style={styles.inputLabel}>Minutes</Text>
                <TextInput value={durationMinutes} onChangeText={setDurationMinutes} style={styles.input} keyboardType="number-pad" placeholder="e.g. 45" placeholderTextColor="#64748b" />
              </View>
            </View>

            <View style={styles.modalActions}>
              <Button label="Cancel" variant="secondary" onPress={() => setScheduleExchange(null)} disabled={creatingSession} />
              <Button label="Propose session" onPress={createSession} loading={creatingSession} />
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
