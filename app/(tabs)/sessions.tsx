import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, Modal, RefreshControl, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Calendar, CheckCircle2, Clock, Coins, Star, XCircle } from 'lucide-react-native';
import { useAuth } from '@/context/AuthContext';
import { creditService } from '@/services/creditService';
import { reviewService } from '@/services/reviewService';
import { sessionService } from '@/services/sessionService';
import { RoleRatingsResponse, SessionSummaryResponse } from '@/types';
import { Badge, Button, Card, EmptyState, LoadingState, ScreenHeader, colors } from '@/components/ui';
import { formatDate, readableError, statusLabel } from '@/utils/format';

const FILTERS = ['ALL', 'PROPOSED', 'SCHEDULED', 'COMPLETED', 'CANCELLED'];

export default function SessionsScreen() {
  const { user, refreshUser } = useAuth();
  const [sessions, setSessions] = useState<SessionSummaryResponse[]>([]);
  const [filter, setFilter] = useState('ALL');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [reviewSession, setReviewSession] = useState<SessionSummaryResponse | null>(null);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [reviewing, setReviewing] = useState(false);
  const [myRatings, setMyRatings] = useState<RoleRatingsResponse | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [sessionsResult, ratingsResult] = await Promise.allSettled([
        sessionService.getMySessions(),
        user?.id ? reviewService.getRoleRatings(user.id) : Promise.resolve(null),
      ]);
      if (sessionsResult.status === 'fulfilled') setSessions(sessionsResult.value);
      if (ratingsResult.status === 'fulfilled') setMyRatings(ratingsResult.value);
    } catch (error) {
      Alert.alert('Could not load sessions', readableError(error, 'Try again.'));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user?.id]);

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
      Alert.alert('Could not accept', readableError(error, 'Try again.'));
    }
  };

  const reject = async (id: number) => {
    try {
      await sessionService.reject(id);
      load();
    } catch (error) {
      Alert.alert('Could not reject', readableError(error, 'Try again.'));
    }
  };

  const confirm = async (id: number) => {
    try {
      await creditService.confirmSession(id);
      await refreshUser();
      load();
    } catch (error) {
      Alert.alert('Could not confirm', readableError(error, 'Try again.'));
    }
  };

  const cancel = (id: number) => {
    Alert.alert('Cancel session', 'Held credits will be refunded if applicable.', [
      { text: 'No', style: 'cancel' },
      {
        text: 'Cancel session',
        style: 'destructive',
        onPress: async () => {
          try {
            await sessionService.cancel(id);
            await refreshUser();
            load();
          } catch (error) {
            Alert.alert('Could not cancel', readableError(error, 'Try again.'));
          }
        },
      },
    ]);
  };

  const openReview = (session: SessionSummaryResponse) => {
    setReviewSession(session);
    setRating(0);
    setComment('');
  };

  const submitReview = async () => {
    if (!reviewSession || reviewing) return;
    if (rating === 0) {
      Alert.alert('Rating required', 'Please select a score before submitting.');
      return;
    }
    const reviewedId = reviewSession.teacherId === user?.id ? reviewSession.studentId : reviewSession.teacherId;

    setReviewing(true);
    try {
      await reviewService.create({
        sessionId: reviewSession.id,
        reviewedId,
        rating,
        comment: comment.trim() || undefined,
      });
      setReviewSession(null);
      load();
    } catch (error) {
      Alert.alert('Could not create review', readableError(error, 'Try again.'));
    } finally {
      setReviewing(false);
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
      <ScreenHeader title="Sessions" subtitle="Track classes, credits, and confirmations" />

      {/* Score summary */}
      <View style={styles.scoreRow}>
        <Card style={styles.scoreCard}>
          <Coins size={18} color={colors.accent} />
          <Text style={styles.scoreValue}>{user?.creditsBalance ?? 0}</Text>
          <Text style={styles.scoreLabel}>Credits</Text>
        </Card>
        <Card style={styles.scoreCard}>
          <Star size={18} color={colors.accent} fill={colors.accent} />
          <Text style={styles.scoreValue}>{(myRatings?.asTeacher?.average ?? 0).toFixed(1)}</Text>
          <Text style={styles.scoreLabel}>Teacher score</Text>
          <Text style={styles.scoreCount}>({myRatings?.asTeacher?.count ?? 0} reviews)</Text>
        </Card>
        <Card style={styles.scoreCard}>
          <Star size={18} color={colors.accent} fill={colors.accent} />
          <Text style={styles.scoreValue}>{(myRatings?.asStudent?.average ?? 0).toFixed(1)}</Text>
          <Text style={styles.scoreLabel}>Student score</Text>
          <Text style={styles.scoreCount}>({myRatings?.asStudent?.count ?? 0} reviews)</Text>
        </Card>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filters}>
        {FILTERS.map((item) => (
          <TouchableOpacity key={item} style={[styles.filter, filter === item && styles.filterActive]} onPress={() => setFilter(item)}>
            <Text style={[styles.filterText, filter === item && styles.filterTextActive]}>{item === 'ALL' ? 'All' : statusLabel(item)}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {filtered.length === 0 ? (
        <EmptyState icon={Calendar} title="No sessions" subtitle="Accept an exchange and schedule a session to get started." />
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
                  <Text style={styles.infoText}>{formatDate(session.scheduledAt)} · {session.creditsAmount} credit(s)</Text>
                </View>

                <Text style={styles.people}>Teacher: {session.teacherName}</Text>
                <Text style={styles.people}>Student: {session.studentName}</Text>

                <View style={styles.actions}>
                  {isPendingForMe ? (
                    <>
                      <Button label="Accept" icon={CheckCircle2} onPress={() => accept(session.id)} />
                      <Button label="Reject" icon={XCircle} variant="danger" onPress={() => reject(session.id)} />
                    </>
                  ) : null}
                  {canConfirm ? <Button label="Confirm attendance" icon={CheckCircle2} onPress={() => confirm(session.id)} /> : null}
                  {canReview ? <Button label="Review" icon={Star} variant="secondary" onPress={() => openReview(session)} /> : null}
                  {session.status !== 'COMPLETED' && session.status !== 'CANCELLED' ? <Button label="Cancel" variant="danger" onPress={() => cancel(session.id)} /> : null}
                </View>
              </Card>
            );
          })}
        </View>
      )}

      <Modal visible={!!reviewSession} transparent animationType="fade" onRequestClose={() => setReviewSession(null)}>
        <View style={styles.modalBackdrop}>
          <Card style={styles.modalCard}>
            <Text style={styles.modalTitle}>Rate experience</Text>
            <Text style={styles.modalSubtitle}>{reviewSession?.topic}</Text>

            <Text style={styles.inputLabel}>Score</Text>
            <View style={styles.starsRow}>
              {[1, 2, 3, 4, 5].map((value) => (
                <TouchableOpacity key={value} onPress={() => setRating(value)} style={styles.starButton}>
                  <Star size={28} color={colors.accent} fill={value <= rating ? colors.accent : 'transparent'} />
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.inputLabel}>Optional comment</Text>
            <TextInput
              value={comment}
              onChangeText={setComment}
              multiline
              style={[styles.input, styles.commentInput]}
              placeholder="Tell us how the exchange went..."
              placeholderTextColor="#64748b"
            />

            <View style={styles.modalActions}>
              <Button label="Cancel" variant="secondary" onPress={() => setReviewSession(null)} disabled={reviewing} />
              <Button label="Submit review" onPress={submitReview} loading={reviewing} />
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
  scoreRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 18,
  },
  scoreCard: {
    alignItems: 'center',
    flex: 1,
    gap: 4,
    padding: 12,
  },
  scoreValue: {
    color: colors.text,
    fontSize: 20,
    fontWeight: '900',
  },
  scoreLabel: {
    color: colors.muted,
    fontSize: 10,
    fontWeight: '800',
    textAlign: 'center',
    textTransform: 'uppercase',
  },
  scoreCount: {
    color: colors.muted,
    fontSize: 10,
    textAlign: 'center',
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
  commentInput: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  starsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  starButton: {
    padding: 4,
  },
  modalActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    justifyContent: 'flex-end',
  },
});
