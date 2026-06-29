import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { ArrowLeftRight, MapPin, Star } from 'lucide-react-native';
import { Badge, Button, Card, colors } from './ui';
import { SkillDetailResponse, SkillSummaryResponse } from '@/types';
import { formatDistance } from '@/utils/format';

const skillLevelLabel = (level?: string) => {
  const labels: Record<string, string> = {
    BEGINNER: 'Básico',
    BASICO: 'Básico',
    INTERMEDIATE: 'Intermedio',
    INTERMEDIO: 'Intermedio',
    ADVANCED: 'Avanzado',
    AVANZADO: 'Avanzado',
  };
  return labels[level || ''] || level;
};

interface Props {
  skill: SkillDetailResponse | SkillSummaryResponse;
  ownerName?: string;
  rating?: number | null;
  distanceMeters?: number | null;
  campusName?: string | null;
  isOwner?: boolean;
  onPress?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  onPropose?: () => void;
}

export function SkillItem({ skill, ownerName, rating, distanceMeters, campusName, isOwner, onPress, onEdit, onDelete, onPropose }: Props) {
  return (
    <TouchableOpacity activeOpacity={onPress ? 0.85 : 1} onPress={onPress}>
      <Card style={styles.card}>
        <View style={styles.topRow}>
          <View style={styles.titleArea}>
            <Text style={styles.name} numberOfLines={1}>{skill.name}</Text>
            {ownerName ? <Text style={styles.owner} numberOfLines={1}>{ownerName}</Text> : null}
          </View>
          <Badge tone={skill.skillType === 'OFFER' ? 'accent' : 'blue'}>
            {skill.skillType === 'OFFER' ? 'Ofrece' : 'Busca'}
          </Badge>
        </View>

        {'description' in skill && skill.description ? (
          <Text style={styles.description} numberOfLines={2}>{skill.description}</Text>
        ) : null}

        <View style={styles.metaRow}>
          {skill.category ? <Badge>{skill.category}</Badge> : null}
          {skill.level ? <Badge>{skillLevelLabel(skill.level)}</Badge> : null}
        </View>

        <View style={styles.sensorRow}>
          {rating !== null && rating !== undefined ? (
            <View style={styles.sensorPill}>
              <Star size={13} color={colors.accent} />
              <Text style={styles.sensorText}>{rating.toFixed(1)}</Text>
            </View>
          ) : null}
          <View style={styles.sensorPill}>
            <MapPin size={13} color={colors.accent} />
            <Text style={styles.sensorText}>{campusName || formatDistance(distanceMeters)}</Text>
          </View>
        </View>

        {isOwner ? (
          <View style={styles.actions}>
            {onEdit ? <Button label="Editar" variant="secondary" onPress={onEdit} /> : null}
            {onDelete ? <Button label="Eliminar" variant="danger" onPress={onDelete} /> : null}
          </View>
        ) : onPropose ? (
          <Button label="Proponer intercambio" icon={ArrowLeftRight} onPress={onPropose} />
        ) : null}
      </Card>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: 12,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  titleArea: {
    flex: 1,
  },
  name: {
    color: colors.text,
    fontSize: 17,
    fontWeight: '800',
  },
  owner: {
    color: colors.muted,
    fontSize: 12,
    marginTop: 3,
  },
  description: {
    color: '#cbd5e1',
    fontSize: 13,
    lineHeight: 18,
  },
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  sensorRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  sensorPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#0f172a',
    borderColor: colors.border,
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  sensorText: {
    color: colors.muted,
    fontSize: 11,
    fontWeight: '700',
  },
  actions: {
    flexDirection: 'row',
    gap: 10,
  },
});
