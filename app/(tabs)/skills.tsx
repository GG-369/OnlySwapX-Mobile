import React, { useCallback, useEffect, useState } from 'react';
import { Alert, Modal, RefreshControl, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Plus, Target, X } from 'lucide-react-native';
import { skillService } from '@/services/skillService';
import { SkillCreateRequest, SkillDetailResponse, SkillSummaryResponse } from '@/types';
import { Button, Card, EmptyState, LoadingState, ScreenHeader, colors } from '@/components/ui';
import { SkillItem } from '@/components/SkillItem';
import { readableError } from '@/utils/format';

const CATEGORIES = ['TECNOLOGIA', 'CIENCIAS', 'HUMANIDADES', 'ARTE', 'IDIOMAS', 'NEGOCIOS', 'OTRO'];
const LEVELS = ['BASICO', 'INTERMEDIO', 'AVANZADO'];

export default function SkillsScreen() {
  const [skills, setSkills] = useState<SkillSummaryResponse[]>([]);
  const [editingSkill, setEditingSkill] = useState<SkillDetailResponse | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setSkills(await skillService.getMySkills());
    } catch (error) {
      Alert.alert('No se pudieron cargar tus skills', readableError(error, 'Intenta nuevamente.'));
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

  const openEdit = async (skill: SkillSummaryResponse) => {
    try {
      setEditingSkill(await skillService.getById(skill.id));
      setModalVisible(true);
    } catch (error) {
      Alert.alert('No se pudo abrir el skill', readableError(error, 'Intenta nuevamente.'));
    }
  };

  const remove = (skill: SkillSummaryResponse) => {
    Alert.alert('Eliminar skill', `¿Eliminar "${skill.name}"?`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Eliminar',
        style: 'destructive',
        onPress: async () => {
          try {
            await skillService.delete(skill.id);
            load();
          } catch (error) {
            Alert.alert('No se pudo eliminar', readableError(error, 'Intenta nuevamente.'));
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
          subtitle="Administra lo que enseñas y quieres aprender"
          right={<Button label="Nuevo" icon={Plus} onPress={openCreate} />}
        />

        {skills.length === 0 ? (
          <EmptyState icon={Target} title="Aún no tienes skills" subtitle="Agrega una habilidad ofrecida o buscada para activar matches." action={<Button label="Agregar skill" icon={Plus} onPress={openCreate} />} />
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

function SkillFormModal({ visible, initialData, onClose, onSaved }: { visible: boolean; initialData: SkillDetailResponse | null; onClose: () => void; onSaved: () => void }) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [level, setLevel] = useState(LEVELS[1]);
  const [skillType, setSkillType] = useState<'OFFER' | 'WANT'>('OFFER');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    setName(initialData?.name || '');
    setDescription(initialData?.description || '');
    setCategory(initialData?.category || CATEGORIES[0]);
    setLevel(initialData?.level || LEVELS[1]);
    setSkillType(initialData?.skillType === 'WANT' ? 'WANT' : 'OFFER');
  }, [initialData, visible]);

  const save = async () => {
    if (!name.trim()) {
      Alert.alert('Nombre requerido', 'Escribe el nombre de la habilidad.');
      return;
    }

    const payload: SkillCreateRequest = {
      name: name.trim(),
      description: description.trim() || undefined,
      category,
      level,
      skillType,
    };

    setSubmitting(true);
    try {
      if (initialData) {
        await skillService.update(initialData.id, payload);
      } else {
        await skillService.create(payload);
      }
      onSaved();
    } catch (error) {
      Alert.alert('No se pudo guardar', readableError(error, 'Intenta nuevamente.'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <ScrollView style={styles.modalScreen} contentContainerStyle={styles.modalContent}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>{initialData ? 'Editar skill' : 'Nuevo skill'}</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <X size={20} color={colors.text} />
          </TouchableOpacity>
        </View>

        <Card style={styles.formCard}>
          <Text style={styles.label}>Tipo</Text>
          <View style={styles.segment}>
            {(['OFFER', 'WANT'] as const).map((type) => (
              <TouchableOpacity key={type} style={[styles.segmentItem, skillType === type && styles.segmentActive]} onPress={() => setSkillType(type)}>
                <Text style={[styles.segmentText, skillType === type && styles.segmentTextActive]}>{type === 'OFFER' ? 'Ofrezco' : 'Busco'}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.label}>Nombre</Text>
          <TextInput value={name} onChangeText={setName} style={styles.input} placeholder="Python, Cálculo, Inglés..." placeholderTextColor="#64748b" />

          <Text style={styles.label}>Descripción</Text>
          <TextInput value={description} onChangeText={setDescription} style={[styles.input, styles.textArea]} multiline placeholder="Explica qué puedes enseñar o qué necesitas aprender" placeholderTextColor="#64748b" />

          <Text style={styles.label}>Categoría</Text>
          <View style={styles.wrap}>
            {CATEGORIES.map((item) => (
              <TouchableOpacity key={item} style={[styles.chip, category === item && styles.chipActive]} onPress={() => setCategory(item)}>
                <Text style={[styles.chipText, category === item && styles.chipTextActive]}>{item}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.label}>Nivel</Text>
          <View style={styles.wrap}>
            {LEVELS.map((item) => (
              <TouchableOpacity key={item} style={[styles.chip, level === item && styles.chipActive]} onPress={() => setLevel(item)}>
                <Text style={[styles.chipText, level === item && styles.chipTextActive]}>{item}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <Button label={initialData ? 'Guardar cambios' : 'Crear skill'} onPress={save} loading={submitting} />
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
