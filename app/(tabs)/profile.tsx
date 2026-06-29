import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, Image, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { BookOpen, Briefcase, Camera, Coins, GraduationCap, Image as ImageIcon, LogOut, Mail, ShieldCheck, Star } from 'lucide-react-native';
import type { LucideIcon } from 'lucide-react-native';
import { useAuth } from '@/context/AuthContext';
import { creditService } from '@/services/creditService';
import { skillService } from '@/services/skillService';
import { reviewService } from '@/services/reviewService';
import { CreditTransactionResponse, RoleRatingsResponse, SkillSummaryResponse } from '@/types';
import { Badge, Button, Card, LoadingState, ScreenHeader, colors } from '@/components/ui';
import { useProfilePhoto } from '@/hooks/useProfilePhoto';
import { formatDate, initialsOf, readableError } from '@/utils/format';

export default function ProfileScreen() {
  const { user, logout } = useAuth();
  const photo = useProfilePhoto(user?.id, user?.avatarUrl);
  const [skills, setSkills] = useState<SkillSummaryResponse[]>([]);
  const [history, setHistory] = useState<CreditTransactionResponse[]>([]);
  const [ratings, setRatings] = useState<RoleRatingsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [skillsRes, historyRes, ratingsRes] = await Promise.allSettled([
        skillService.getMySkills(),
        creditService.getHistory(),
        user?.id ? reviewService.getRoleRatings(user.id) : Promise.resolve(null),
      ]);
      if (skillsRes.status === 'fulfilled') setSkills(skillsRes.value);
      if (historyRes.status === 'fulfilled') setHistory(historyRes.value);
      if (ratingsRes.status === 'fulfilled') setRatings(ratingsRes.value);
    } catch (error) {
      Alert.alert('No se cargó tu perfil', readableError(error, 'Intenta nuevamente.'));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user?.id]);

  useEffect(() => {
    load();
  }, [load]);

  const offerCount = useMemo(() => skills.filter((skill) => skill.skillType === 'OFFER').length, [skills]);
  const wantCount = useMemo(() => skills.filter((skill) => skill.skillType === 'WANT').length, [skills]);

  const runPhotoAction = async (action: () => Promise<void>) => {
    try {
      await action();
    } catch (error) {
      Alert.alert('No se pudo actualizar la foto', error instanceof Error ? error.message : 'Intenta nuevamente.');
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
      <ScreenHeader title="Perfil" subtitle="Identidad, créditos y actividad" right={<Button label="Salir" icon={LogOut} variant="secondary" onPress={logout} />} />

      <Card style={styles.profileCard}>
        <View style={styles.avatarWrap}>
          {photo.photoUri ? (
            <Image source={{ uri: photo.photoUri }} style={styles.avatarImage} />
          ) : (
            <View style={styles.avatarFallback}>
              <Text style={styles.avatarText}>{initialsOf(user?.fullName)}</Text>
            </View>
          )}
          <Badge tone="accent">Verificado</Badge>
        </View>

        <Text style={styles.name}>{user?.fullName}</Text>
        <Text style={styles.email}>{user?.email}</Text>

        <View style={styles.photoActions}>
          <Button label="Cámara" icon={Camera} variant="secondary" onPress={() => runPhotoAction(photo.takePhoto)} loading={photo.loading} />
          <Button label="Galería" icon={ImageIcon} variant="secondary" onPress={() => runPhotoAction(photo.pickFromGallery)} loading={photo.loading} />
        </View>
      </Card>

      <View style={styles.infoGrid}>
        <Card style={styles.metric}>
          <Coins size={20} color={colors.accent} />
          <Text style={styles.metricValue}>{user?.creditsBalance ?? 0}</Text>
          <Text style={styles.metricLabel}>Créditos</Text>
        </Card>
        <Card style={styles.metric}>
          <BookOpen size={20} color={colors.accent} />
          <Text style={styles.metricValue}>{offerCount}</Text>
          <Text style={styles.metricLabel}>Ofrezco</Text>
        </Card>
        <Card style={styles.metric}>
          <ShieldCheck size={20} color={colors.accent} />
          <Text style={styles.metricValue}>{wantCount}</Text>
          <Text style={styles.metricLabel}>Busco</Text>
        </Card>
      </View>

      <Card style={styles.detailsCard}>
        {user?.university ? <InfoRow icon={GraduationCap} text={user.university} /> : null}
        {user?.career ? <InfoRow icon={Briefcase} text={user.career} /> : null}
        <InfoRow icon={Mail} text={user?.email || 'Sin correo'} />
      </Card>

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Puntaje de reseñas</Text>
        <Text style={styles.sectionSubtitle}>Promedio recibido como teacher y student</Text>
      </View>

      <View style={styles.ratingGrid}>
        <Card style={styles.ratingCard}>
          <Star size={20} color={colors.accent} fill={colors.accent} />
          <Text style={styles.ratingValue}>{(ratings?.asTeacher?.average ?? 0).toFixed(1)}</Text>
          <Text style={styles.ratingLabel}>Como teacher · {ratings?.asTeacher?.count ?? 0} reseña(s)</Text>
        </Card>
        <Card style={styles.ratingCard}>
          <Star size={20} color={colors.accent} fill={colors.accent} />
          <Text style={styles.ratingValue}>{(ratings?.asStudent?.average ?? 0).toFixed(1)}</Text>
          <Text style={styles.ratingLabel}>Como student · {ratings?.asStudent?.count ?? 0} reseña(s)</Text>
        </Card>
      </View>

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Actividad de créditos</Text>
        <Text style={styles.sectionSubtitle}>Últimas transacciones</Text>
      </View>

      <View style={styles.historyList}>
        {history.length === 0 ? (
          <Card>
            <Text style={styles.emptyText}>Aún no tienes movimientos de créditos.</Text>
          </Card>
        ) : history.slice(0, 8).map((tx) => (
          <Card key={tx.id} style={styles.transaction}>
            <View style={styles.transactionText}>
              <Text style={styles.transactionTitle}>{tx.description || tx.type}</Text>
              <Text style={styles.transactionDate}>{formatDate(tx.createdAt)}</Text>
            </View>
            <Text style={[styles.amount, tx.amount >= 0 ? styles.amountPositive : styles.amountNegative]}>
              {tx.amount >= 0 ? '+' : ''}{tx.amount}
            </Text>
          </Card>
        ))}
      </View>
    </ScrollView>
  );
}

function InfoRow({ icon: Icon, text }: { icon: LucideIcon; text: string }) {
  return (
    <View style={styles.infoRow}>
      <Icon size={17} color={colors.accent} />
      <Text style={styles.infoText}>{text}</Text>
    </View>
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
  profileCard: {
    alignItems: 'center',
    gap: 12,
  },
  avatarWrap: {
    alignItems: 'center',
    gap: 10,
  },
  avatarImage: {
    borderColor: 'rgba(250, 204, 21, 0.45)',
    borderRadius: 52,
    borderWidth: 2,
    height: 104,
    width: 104,
  },
  avatarFallback: {
    alignItems: 'center',
    backgroundColor: 'rgba(250, 204, 21, 0.12)',
    borderColor: 'rgba(250, 204, 21, 0.45)',
    borderRadius: 52,
    borderWidth: 2,
    height: 104,
    justifyContent: 'center',
    width: 104,
  },
  avatarText: {
    color: colors.accent,
    fontSize: 31,
    fontWeight: '900',
  },
  name: {
    color: colors.text,
    fontSize: 21,
    fontWeight: '900',
    textAlign: 'center',
  },
  email: {
    color: colors.muted,
    fontSize: 13,
  },
  photoActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    justifyContent: 'center',
  },
  infoGrid: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 14,
  },
  metric: {
    alignItems: 'center',
    flex: 1,
    gap: 6,
    padding: 12,
  },
  metricValue: {
    color: colors.text,
    fontSize: 21,
    fontWeight: '900',
  },
  metricLabel: {
    color: colors.muted,
    fontSize: 11,
    fontWeight: '800',
  },
  detailsCard: {
    gap: 12,
    marginTop: 14,
  },
  infoRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 10,
  },
  infoText: {
    color: '#cbd5e1',
    flex: 1,
    fontSize: 13,
  },
  sectionHeader: {
    marginTop: 22,
    marginBottom: 10,
  },
  sectionTitle: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '900',
  },
  sectionSubtitle: {
    color: colors.muted,
    fontSize: 12,
    marginTop: 2,
  },

  ratingGrid: {
    flexDirection: 'row',
    gap: 10,
  },
  ratingCard: {
    alignItems: 'center',
    flex: 1,
    gap: 6,
  },
  ratingValue: {
    color: colors.text,
    fontSize: 24,
    fontWeight: '900',
  },
  ratingLabel: {
    color: colors.muted,
    fontSize: 11,
    fontWeight: '800',
    textAlign: 'center',
  },
  historyList: {
    gap: 10,
  },
  transaction: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'space-between',
  },
  transactionText: {
    flex: 1,
  },
  transactionTitle: {
    color: colors.text,
    fontSize: 13,
    fontWeight: '800',
  },
  transactionDate: {
    color: colors.muted,
    fontSize: 11,
    marginTop: 3,
  },
  amount: {
    fontSize: 15,
    fontWeight: '900',
  },
  amountPositive: {
    color: colors.success,
  },
  amountNegative: {
    color: '#fb7185',
  },
  emptyText: {
    color: colors.muted,
    textAlign: 'center',
  },
});
