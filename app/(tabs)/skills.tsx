import React, { useCallback, useEffect, useState } from 'react';
import { Alert, Modal, RefreshControl, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Plus, Target, X } from 'lucide-react-native';
import { skillService } from '@/services/skillService';
import { SkillSummaryResponse } from '@/types';
import { Button, Card, EmptyState, LoadingState, ScreenHeader, colors } from '@/components/ui';
import { SkillItem } from '@/components/SkillItem';
import { categoryLabel, readableError } from '@/utils/format';

// Values are kept in Spanish to match the backend enum contract; only the
// displayed labels are translated (see categoryLabel/LEVELS below).
const CATEGORIES = ['TECNOLOGIA', 'CIENCIAS', 'HUMANIDADES', 'ARTE', 'IDIOMAS', 'NEGOCIOS', 'OTRO'];
const LEVELS = [
  { label: 'Beginner', value: 'BEGINNER' },
  { label: 'Intermediate', value: 'INTERMEDIATE' },
  { label: 'Advanced', value: 'ADVANCED' },
] as const;

const normalizeLevel = (value?: string) => {
  if (!value) return 'INTERMEDIATE';
  const upper = value.toUpperCase();
  const map: Record<string, string> = {
    BASICO: 'BEGINNER',
    BEGINNER: 'BEGINNER',
    INTERMEDIO: 'INTERMEDIATE',
    INTERMEDIATE: 'INTERMEDIATE',
    AVANZADO: 'ADVANCED',
    ADVANCED: 'ADVANCED',
  };
  return map[upper] || 'INTERMEDIATE';
};

export default function SkillsScreen() {
  const [skills, setSkills] = useState<SkillSummaryResponse[]>([]);
  const [editingSkill, setEditingSkill] = useState<SkillSummaryResponse | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setSkills(await skillService.getMySkills());
    } catch (error) {
      Alert.alert('Could not load your skills', readableError(error, 'Try again.'));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const openCreate = () => {
    setEditingSkill(null);
    setModalVisible(true);
  };

  const openEdit = (skill: SkillSummaryResponse) => {
    setEditingSkill(skill);
    setModalVisible(true);
  };

  const remove = (skill: SkillSummaryResponse) => {
    Alert.alert('Delete skill', `Delete "${skill.name}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await skillService.delete(skill.id);
            load();
          } catch (error) {
            Alert.alert('Could not delete', readableError(error, 'Try again.'));
          }
        },
      },
    ]);
  };

  if (loading && !refreshing) return <LoadingState />;

  return (
    <View style={styles.screen}>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor={colors.accent} />}
        showsVerticalScrollIndicator={false}
      >
        <ScreenHeader
          title="My Skills"
          subtitle="Manage what you teach and want to learn"
          right={<Button label="New" icon={Plus} onPress={openCreate} />}
        />

        {skills.length === 0 ? (
          <EmptyState icon={Target} title="You don't have any skills yet" subtitle="Add an offered or wanted skill to activate matches." action={<Button label="Add skill" icon={Plus} onPress={openCreate} />} />
        ) : (
          <View style={styles.list}>
            {skills.map((skill) => (
              <SkillItem key={skill.id} skill={skill} isOwner onEdit={() => openEdit(skill)} onDelete={() => remove(skill)} />
            ))}
          </View>
        )}
      </ScrollView>

      <SkillFormModal
        visible={modalVisible}
        initialData={editingSkill}
        onClose={() => setModalVisible(false)}
        onSaved={() => {
          setModalVisible(false);
          load();
        }}
      />
    </View>
  );
}

function SkillFormModal({ visible, initialData, onClose, onSaved }: { visible: boolean; initialData: SkillSummaryResponse | null; onClose: () => void; onSaved: () => void }) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [level, setLevel] = useState('INTERMEDIATE');
  const [skillType, setSkillType] = useState<'OFFER' | 'WANT'>('OFFER');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    setName(initialData?.name || '');
    setDescription(initialData?.description || '');
    setCategory(initialData?.category || CATEGORIES[0]);
    setLevel(normalizeLevel(initialData?.level));
    setSkillType(initialData?.skillType === 'WANT' ? 'WANT' : 'OFFER');
  }, [initialData, visible]);

  const save = async () => {
    if (!name.trim()) {
      Alert.alert('Name required', 'Write the name of the skill.');
      return;
    }

    const basePayload = {
      name: name.trim(),
      description: description.trim() || undefined,
      category,
      level,
    };

    setSubmitting(true);
    try {
      if (initialData) {
        await skillService.update(initialData.id, basePayload);
      } else {
        await skillService.create({
          ...basePayload,
          skillType,
        });
      }
      onSaved();
    } catch (error) {
      Alert.alert('Could not save', readableError(error, 'Try again.'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <ScrollView style={styles.modalScreen} contentContainerStyle={styles.modalContent}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>{initialData ? 'Edit skill' : 'New skill'}</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <X size={20} color={colors.text} />
          </TouchableOpacity>
        </View>

        <Card style={styles.formCard}>
          <Text style={styles.label}>Type</Text>
          <View style={styles.segment}>
            {(['OFFER', 'WANT'] as const).map((type) => (
              <TouchableOpacity key={type} style={[styles.segmentItem, skillType === type && styles.segmentActive]} onPress={() => setSkillType(type)}>
                <Text style={[styles.segmentText, skillType === type && styles.segmentTextActive]}>{type === 'OFFER' ? 'I offer' : 'I want'}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.label}>Name</Text>
          <TextInput value={name} onChangeText={setName} style={styles.input} placeholder="Python, Calculus, English..." placeholderTextColor="#64748b" />

          <Text style={styles.label}>Description</Text>
          <TextInput value={description} onChangeText={setDescription} style={[styles.input, styles.textArea]} multiline placeholder="Explain what you can teach or what you need to learn" placeholderTextColor="#64748b" />

          <Text style={styles.label}>Category</Text>
          <View style={styles.wrap}>
            {CATEGORIES.map((item) => (
              <TouchableOpacity key={item} style={[styles.chip, category === item && styles.chipActive]} onPress={() => setCategory(item)}>
                <Text style={[styles.chipText, category === item && styles.chipTextActive]}>{categoryLabel(item)}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.label}>Level</Text>
          <View style={styles.wrap}>
            {LEVELS.map((item) => (
              <TouchableOpacity key={item.value} style={[styles.chip, level === item.value && styles.chipActive]} onPress={() => setLevel(item.value)}>
                <Text style={[styles.chipText, level === item.value && styles.chipTextActive]}>{item.label}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <Button label={initialData ? 'Save changes' : 'Create skill'} onPress={save} loading={submitting} />
        </Card>
      </ScrollView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  screen: {
    backgroundColor: colors.background,
    flex: 1,
  },
  content: {
    padding: 20,
    paddingBottom: 96,
    paddingTop: 58,
  },
  list: {
    gap: 12,
  },
  modalScreen: {
    backgroundColor: colors.background,
  },
  modalContent: {
    padding: 20,
    paddingTop: 58,
  },
  modalHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 18,
  },
  modalTitle: {
    color: colors.text,
    fontSize: 24,
    fontWeight: '900',
  },
  closeButton: {
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: 12,
    height: 42,
    justifyContent: 'center',
    width: 42,
  },
  formCard: {
    gap: 12,
  },
  label: {
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
    fontSize: 15,
    padding: 13,
  },
  textArea: {
    minHeight: 92,
    textAlignVertical: 'top',
  },
  segment: {
    backgroundColor: colors.background,
    borderRadius: 12,
    flexDirection: 'row',
    padding: 4,
  },
  segmentItem: {
    alignItems: 'center',
    borderRadius: 9,
    flex: 1,
    paddingVertical: 10,
  },
  segmentActive: {
    backgroundColor: colors.accent,
  },
  segmentText: {
    color: colors.muted,
    fontWeight: '900',
  },
  segmentTextActive: {
    color: colors.background,
  },
  wrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    backgroundColor: colors.background,
    borderColor: colors.border,
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 11,
    paddingVertical: 8,
  },
  chipActive: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
  },
  chipText: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: '800',
  },
  chipTextActive: {
    color: colors.background,
  },
});
