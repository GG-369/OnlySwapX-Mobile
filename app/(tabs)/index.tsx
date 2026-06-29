import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, RefreshControl, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Brain, Filter, LocateFixed, Search, Sparkles } from 'lucide-react-native';
import { useAuth } from '@/context/AuthContext';
import { skillService } from '@/services/skillService';
import { matchService } from '@/services/matchService';
import { exchangeService } from '@/services/exchangeService';
import { DiscoverBatchResponse, MatchSuggestedResponse, PageResponse, SkillDetailResponse } from '@/types';
import { Badge, Button, Card, EmptyState, LoadingState, ScreenHeader, colors } from '@/components/ui';
import { SkillItem } from '@/components/SkillItem';
import { useDeviceLocation } from '@/hooks/useDeviceLocation';
import { campusFromUniversity, distanceInMeters } from '@/utils/location';
import { formatDistance, readableError } from '@/utils/format';

const CATEGORIES = ['TECNOLOGIA', 'CIENCIAS', 'HUMANIDADES', 'ARTE', 'IDIOMAS', 'NEGOCIOS', 'OTRO'];

export default function DiscoverScreen() {
  const { user } = useAuth();
  const location = useDeviceLocation();
  const [pageData, setPageData] = useState<PageResponse<SkillDetailResponse> | null>(null);
  const [suggested, setSuggested] = useState<MatchSuggestedResponse[]>([]);
  const [batchData, setBatchData] = useState<DiscoverBatchResponse>({});
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const currentCampus = useMemo(() => campusFromUniversity(user?.university), [user?.university]);

  const getDistance = useCallback((skill: SkillDetailResponse) => {
    const ownerCoordinates = skill.ownerLatitude && skill.ownerLongitude
      ? { latitude: skill.ownerLatitude, longitude: skill.ownerLongitude }
      : currentCampus?.coordinates;

    const from = location.coordinates;
    if (!from || !ownerCoordinates) return null;
    return distanceInMeters(from, ownerCoordinates);
  }, [currentCampus, location.coordinates]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [skillsRes, suggestedRes] = await Promise.allSettled([
        skillService.search(search, page, 12, category || undefined, user?.id),
        matchService.getSuggested(),
      ]);

      if (skillsRes.status === 'fulfilled') setPageData(skillsRes.value);
      if (suggestedRes.status === 'fulfilled') setSuggested(suggestedRes.value);
    } catch (error) {
      Alert.alert('No se pudo cargar Discover', readableError(error, 'Intenta refrescar la pantalla.'));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [category, page, search, user?.id]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    const skills = pageData?.content || [];
    if (skills.length === 0) {
      setBatchData({});
      return;
    }
    skillService.getDiscoverBatch(skills.map((skill) => skill.id)).then(setBatchData).catch(() => {});
  }, [pageData]);

  const proposeExchange = async (skill: SkillDetailResponse) => {
    if (skill.userId === user?.id) {
      Alert.alert('Intercambio inválido', 'No puedes proponerte un intercambio a ti mismo.');
      return;
    }

    try {
      const check = await exchangeService.checkExisting(skill.userId, skill.id);
      if (check.exists) {
        Alert.alert('Intercambio existente', check.status ? `Ya tienes un intercambio ${check.status} con esta persona.` : 'Ya existe una propuesta activa.');
        return;
      }

      await exchangeService.create({
        receiverId: skill.userId,
        skillId: skill.id,
        message: `Me interesa intercambiar por ${skill.name}.`,
      });
      Alert.alert('Propuesta enviada', 'Tu intercambio fue creado correctamente.');
      load();
    } catch (error) {
      Alert.alert('No se pudo proponer', readableError(error, 'Inténtalo nuevamente.'));
    }
  };

  const skills = useMemo(() => {
    const list = pageData?.content || [];
    return [...list].sort((a, b) => {
      const distanceA = getDistance(a) ?? Number.POSITIVE_INFINITY;
      const distanceB = getDistance(b) ?? Number.POSITIVE_INFINITY;
      return distanceA - distanceB;
    });
  }, [getDistance, pageData]);

  if (loading && !refreshing) return <LoadingState />;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); location.requestLocation(); }} tintColor={colors.accent} />}
      showsVerticalScrollIndicator={false}
    >
      <ScreenHeader
        title="Discover"
        subtitle="Skills cercanos y recomendaciones para intercambiar"
        right={<Badge tone="accent">{user?.creditsBalance ?? 0} créditos</Badge>}
      />

      <Card style={styles.locationCard}>
        <View style={styles.locationTop}>
          <View style={styles.locationIcon}>
            <LocateFixed size={20} color={colors.accent} />
          </View>
          <View style={styles.locationText}>
            <Text style={styles.locationTitle}>Proximidad activa</Text>
            <Text style={styles.locationSubtitle}>{location.label}</Text>
          </View>
        </View>
        <Text style={styles.locationHint}>
          {location.permission === 'denied'
            ? 'Activa permisos para ordenar resultados por cercanía real.'
            : `Campus base: ${currentCampus?.name || 'se estimará cuando el backend devuelva campus'}.`}
        </Text>
        <Button label={location.loading ? 'Ubicando...' : 'Actualizar GPS'} variant="secondary" onPress={location.requestLocation} loading={location.loading} />
      </Card>

      {suggested.length > 0 ? (
        <View style={styles.section}>
          <View style={styles.sectionTitleRow}>
            <Brain size={18} color={colors.accent} />
            <Text style={styles.sectionTitle}>Sugerido para ti</Text>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.suggestedRow}>
            {suggested.slice(0, 6).map((item) => (
              <Card key={item.skillId} style={styles.suggestedCard}>
                <Text style={styles.suggestedScore}>{Math.round(item.score * 100)}%</Text>
                <Text style={styles.suggestedName} numberOfLines={2}>{item.skillName}</Text>
                <Text style={styles.suggestedOwner} numberOfLines={1}>{item.ownerName}</Text>
                <Badge>{item.category || 'Skill'}</Badge>
              </Card>
            ))}
          </ScrollView>
        </View>
      ) : null}

      <View style={styles.searchBox}>
        <Search size={18} color={colors.muted} />
        <TextInput
          value={search}
          onChangeText={(value) => { setSearch(value); setPage(0); }}
          placeholder="Buscar skills..."
          placeholderTextColor="#64748b"
          style={styles.searchInput}
        />
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filters}>
        <TouchableOpacity style={[styles.filterChip, !category && styles.filterActive]} onPress={() => { setCategory(''); setPage(0); }}>
          <Filter size={13} color={!category ? colors.background : colors.muted} />
          <Text style={[styles.filterText, !category && styles.filterTextActive]}>Todo</Text>
        </TouchableOpacity>
        {CATEGORIES.map((item) => (
          <TouchableOpacity key={item} style={[styles.filterChip, category === item && styles.filterActive]} onPress={() => { setCategory(item); setPage(0); }}>
            <Text style={[styles.filterText, category === item && styles.filterTextActive]}>{item}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {skills.length === 0 ? (
        <EmptyState icon={Sparkles} title="No hay skills disponibles" subtitle="Prueba otra búsqueda o agrega tus propios intereses." />
      ) : (
        <View style={styles.list}>
          {skills.map((skill) => {
            const distance = getDistance(skill);
            return (
              <SkillItem
                key={skill.id}
                skill={skill}
                ownerName={skill.userName}
                rating={batchData[skill.id]?.ownerRating?.average ?? null}
                distanceMeters={distance}
                campusName={skill.ownerCampusName || (distance !== null ? formatDistance(distance) : currentCampus?.name)}
                onPropose={() => proposeExchange(skill)}
              />
            );
          })}
        </View>
      )}

      {pageData && pageData.totalPages > 1 ? (
        <View style={styles.pagination}>
          <Button label="Anterior" variant="secondary" disabled={page === 0} onPress={() => setPage((value) => Math.max(0, value - 1))} />
          <Text style={styles.pageText}>Página {page + 1} de {pageData.totalPages}</Text>
          <Button label="Siguiente" variant="secondary" disabled={page >= pageData.totalPages - 1} onPress={() => setPage((value) => value + 1)} />
        </View>
      ) : null}
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
  locationCard: {
    gap: 12,
    marginBottom: 20,
  },
  locationTop: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 12,
  },
  locationIcon: {
    alignItems: 'center',
    backgroundColor: 'rgba(250, 204, 21, 0.12)',
    borderRadius: 13,
    height: 44,
    justifyContent: 'center',
    width: 44,
  },
  locationText: {
    flex: 1,
  },
  locationTitle: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '900',
  },
  locationSubtitle: {
    color: colors.muted,
    fontSize: 12,
    marginTop: 3,
  },
  locationHint: {
    color: '#cbd5e1',
    fontSize: 12,
    lineHeight: 17,
  },
  section: {
    marginBottom: 18,
  },
  sectionTitleRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
    marginBottom: 10,
  },
  sectionTitle: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '900',
  },
  suggestedRow: {
    gap: 12,
  },
  suggestedCard: {
    gap: 8,
    width: 170,
  },
  suggestedScore: {
    color: colors.accent,
    fontSize: 22,
    fontWeight: '900',
  },
  suggestedName: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '800',
    minHeight: 38,
  },
  suggestedOwner: {
    color: colors.muted,
    fontSize: 12,
  },
  searchBox: {
    alignItems: 'center',
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 10,
    marginBottom: 12,
    paddingHorizontal: 14,
  },
  searchInput: {
    color: colors.text,
    flex: 1,
    fontSize: 15,
    paddingVertical: 13,
  },
  filters: {
    gap: 8,
    paddingBottom: 16,
  },
  filterChip: {
    alignItems: 'center',
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderRadius: 999,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  filterActive: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
  },
  filterText: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: '800',
  },
  filterTextActive: {
    color: colors.background,
  },
  list: {
    gap: 12,
  },
  pagination: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'center',
    marginTop: 18,
  },
  pageText: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: '700',
  },
});
