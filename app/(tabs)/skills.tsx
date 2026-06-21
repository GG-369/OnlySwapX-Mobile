import React, { useEffect, useState, useCallback } from "react";
import { View, Text, StyleSheet, TouchableOpacity, TextInput, FlatList, Alert, ScrollView } from "react-native";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Plus, Lightbulb } from "lucide-react-native";
import { SkillCard } from "../../src/components/features/SkillCard";
import { Modal } from "../../src/components/ui/Modal";
import { EmptyState } from "../../src/components/ui/EmptyState";
import { Spinner } from "../../src/components/ui/Spinner";
import { skillApi } from "../../src/lib/api";
import { SkillResponse, SkillType, SkillCategory, SkillLevel } from "../../src/types";
import { useAuth } from "../../src/lib/auth-context";
import { sanitizeString } from "../../src/lib/utils";

const schema = z.object({
  name: z
    .string()
    .min(2, "Mínimo 2 caracteres")
    .max(80, "Máximo 80 caracteres")
    .regex(/^[^<>"';&]+$/, "Caracteres no permitidos"),
  description: z.string().max(400, "Máximo 400 caracteres").optional(),
  skillType: z.enum(["OFFER", "WANT"]),
  category: z.enum([
    "TECNOLOGIA",
    "CIENCIAS",
    "HUMANIDADES",
    "ARTE",
    "IDIOMAS",
    "NEGOCIOS",
    "OTRO",
  ]),
  level: z.enum(["Básico", "Intermedio", "Avanzado"]),
});

type FormData = z.infer<typeof schema>;

const CATEGORIES: { value: SkillCategory; label: string; icon: string }[] = [
  { value: "TECNOLOGIA", label: "Tecnología", icon: "💻" },
  { value: "CIENCIAS", label: "Ciencias", icon: "🔬" },
  { value: "HUMANIDADES", label: "Humanidades", icon: "📚" },
  { value: "ARTE", label: "Arte", icon: "🎨" },
  { value: "IDIOMAS", label: "Idiomas", icon: "🗣️" },
  { value: "NEGOCIOS", label: "Negocios", icon: "📊" },
  { value: "OTRO", label: "Otro", icon: "✦" },
];

export default function SkillsScreen() {
  const { user } = useAuth();
  const [skills, setSkills] = useState<SkillResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<"ALL" | "OFFER" | "WANT">("ALL");

  const { control, handleSubmit, reset, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      skillType: "OFFER",
      category: "TECNOLOGIA",
      level: "Intermedio",
    },
  });

  const fetchSkills = useCallback(async () => {
    try {
      const res = await skillApi.getMine();
      setSkills(res.data);
    } catch {
      Alert.alert("Error", "Error al cargar habilidades");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSkills();
  }, [fetchSkills]);

  const onSubmit = async (data: FormData) => {
    setSaving(true);
    try {
      await skillApi.create({
        name: sanitizeString(data.name, 80),
        description: data.description ? sanitizeString(data.description, 400) : undefined,
        skillType: data.skillType,
        category: data.category,
        level: data.level,
      });
      Alert.alert("Éxito", `"${data.name}" agregada ✓`);
      setModalOpen(false);
      reset();
      fetchSkills();
    } catch (err: any) {
      Alert.alert("Error", err.message || "Error al guardar");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    Alert.alert(
      "Eliminar Habilidad",
      "¿Estás seguro que deseas eliminar esta habilidad?",
      [
        { text: "Cancelar", style: "cancel" },
        { 
          text: "Eliminar", 
          style: "destructive",
          onPress: async () => {
            setDeleting(id);
            try {
              await skillApi.delete(id);
              setSkills((prev) => prev.filter((s) => s.id !== id));
            } catch (err: any) {
              Alert.alert("Error", err.message || "Error al eliminar");
            } finally {
              setDeleting(null);
            }
          }
        }
      ]
    );
  };

  const filtered = activeTab === "ALL" ? skills : skills.filter((s) => s.skillType === activeTab);
  const offers = skills.filter((s) => s.skillType === "OFFER");
  const wants = skills.filter((s) => s.skillType === "WANT");

  return (
    <View style={styles.container}>
      {/* HEADER */}
      <View style={styles.header}>
        <View>
          <Text style={styles.pageTitle}>Mis Habilidades</Text>
          <Text style={styles.pageSubtitle}>{offers.length} ofrezco · {wants.length} busco</Text>
        </View>
        <TouchableOpacity 
          style={styles.btnAdd} 
          onPress={() => { reset(); setModalOpen(true); }}
        >
          <Plus size={16} color="#fff" />
          <Text style={styles.btnAddText}>Agregar</Text>
        </TouchableOpacity>
      </View>

      {/* STATS */}
      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Text style={[styles.statValue, { color: '#f8fafc' }]}>{skills.length}</Text>
          <Text style={styles.statLabel}>Total</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={[styles.statValue, { color: '#84cc16' }]}>{offers.length}</Text>
          <Text style={styles.statLabel}>Ofrezco 🎓</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={[styles.statValue, { color: '#06b6d4' }]}>{wants.length}</Text>
          <Text style={styles.statLabel}>Busco 🔍</Text>
        </View>
      </View>

      {/* TABS */}
      <View style={styles.tabsContainer}>
        {(["ALL", "OFFER", "WANT"] as const).map((t) => (
          <TouchableOpacity
            key={t}
            onPress={() => setActiveTab(t)}
            style={[styles.tabBtn, activeTab === t && styles.tabBtnActive]}
          >
            <Text style={[styles.tabText, activeTab === t && styles.tabTextActive]}>
              {t === "ALL" ? "Todas" : t === "OFFER" ? "🎓 Ofrezco" : "🔍 Busco"}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* LISTA */}
      {loading ? (
        <View style={styles.centerLoad}>
          <Spinner size="large" />
        </View>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon="🎯"
          title="Sin habilidades aquí"
          description={
            activeTab === "ALL"
              ? "Agrega tus primeras habilidades para aparecer en el feed"
              : activeTab === "OFFER"
              ? "Agrega lo que puedes enseñar"
              : "Agrega lo que quieres aprender"
          }
        />
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={{ paddingBottom: 20 }}
          renderItem={({ item }) => (
            <SkillCard
              skill={item}
              currentUserId={user?.id}
              onDelete={deleting === null ? handleDelete : undefined}
            />
          )}
        />
      )}

      {/* MODAL CREAR HABILIDAD */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Agregar habilidad"
        description="Describe lo que sabes o lo que quieres aprender."
      >
        <ScrollView style={{ maxHeight: 500 }} showsVerticalScrollIndicator={false}>
          
          {/* TIPO */}
          <Text style={styles.label}>Tipo</Text>
          <Controller
            control={control}
            name="skillType"
            render={({ field: { onChange, value } }) => (
              <View style={styles.row}>
                {(["OFFER", "WANT"] as SkillType[]).map((t) => (
                  <TouchableOpacity
                    key={t}
                    style={[styles.radioBtn, value === t && styles.radioBtnActive]}
                    onPress={() => onChange(t)}
                  >
                    <Text style={[styles.radioText, value === t && styles.radioTextActive]}>
                      {t === "OFFER" ? "🎓 Ofrezco" : "🔍 Busco"}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          />

          {/* NOMBRE */}
          <Text style={styles.label}>Nombre *</Text>
          <Controller
            control={control}
            name="name"
            render={({ field: { onChange, value } }) => (
              <TextInput
                style={styles.input}
                placeholder="ej. Guitarra clásica, Python..."
                placeholderTextColor="#64748b"
                value={value}
                onChangeText={onChange}
              />
            )}
          />
          {errors.name && <Text style={styles.errorText}>{errors.name.message}</Text>}

          {/* DESCRIPCION */}
          <Text style={styles.label}>Descripción</Text>
          <Controller
            control={control}
            name="description"
            render={({ field: { onChange, value } }) => (
              <TextInput
                style={[styles.input, { minHeight: 80, textAlignVertical: 'top' }]}
                placeholder="Cuéntanos tu experiencia..."
                placeholderTextColor="#64748b"
                multiline
                numberOfLines={3}
                value={value}
                onChangeText={onChange}
              />
            )}
          />
          {errors.description && <Text style={styles.errorText}>{errors.description.message}</Text>}

          {/* CATEGORIA */}
          <Text style={styles.label}>Categoría</Text>
          <Controller
            control={control}
            name="category"
            render={({ field: { onChange, value } }) => (
              <View style={styles.gridCat}>
                {CATEGORIES.map((cat) => (
                  <TouchableOpacity
                    key={cat.value}
                    style={[styles.catBtn, value === cat.value && styles.catBtnActive]}
                    onPress={() => onChange(cat.value)}
                  >
                    <Text style={{ fontSize: 20 }}>{cat.icon}</Text>
                    <Text style={styles.catLabel}>{cat.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          />

          {/* NIVEL */}
          <Text style={styles.label}>Nivel</Text>
          <Controller
            control={control}
            name="level"
            render={({ field: { onChange, value } }) => (
              <View style={styles.row}>
                {(["Básico", "Intermedio", "Avanzado"] as SkillLevel[]).map((l) => (
                  <TouchableOpacity
                    key={l}
                    style={[styles.radioBtn, value === l && styles.radioLevelActive]}
                    onPress={() => onChange(l)}
                  >
                    <Text style={[styles.radioText, value === l && styles.radioLevelTextActive]}>{l}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          />

          {/* BOTONES */}
          <View style={styles.modalActions}>
            <TouchableOpacity style={styles.btnGhost} onPress={() => setModalOpen(false)}>
              <Text style={styles.btnGhostText}>Cancelar</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.btnSave} onPress={handleSubmit(onSubmit)} disabled={saving}>
              {saving ? <Spinner size="small" /> : (
                <>
                  <Lightbulb size={16} color="#fff" />
                  <Text style={styles.btnSaveText}>Guardar</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a', padding: 16, paddingTop: 50 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  pageTitle: { color: '#f8fafc', fontSize: 24, fontWeight: 'bold' },
  pageSubtitle: { color: '#94a3b8', fontSize: 12, marginTop: 4 },
  btnAdd: { backgroundColor: '#2563eb', flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, gap: 5 },
  btnAddText: { color: '#fff', fontWeight: 'bold', fontSize: 12 },
  
  statsRow: { flexDirection: 'row', gap: 10, marginBottom: 20 },
  statCard: { flex: 1, backgroundColor: '#1e293b', padding: 15, borderRadius: 12, alignItems: 'center', borderWidth: 1, borderColor: '#334155' },
  statValue: { fontSize: 24, fontWeight: 'bold' },
  statLabel: { color: '#94a3b8', fontSize: 10, marginTop: 4 },

  tabsContainer: { flexDirection: 'row', backgroundColor: '#1e293b', borderRadius: 12, padding: 4, marginBottom: 20, alignSelf: 'flex-start' },
  tabBtn: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8 },
  tabBtnActive: { backgroundColor: '#0f172a' },
  tabText: { color: '#94a3b8', fontSize: 12, fontWeight: 'bold' },
  tabTextActive: { color: '#f8fafc' },

  centerLoad: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  // Formularios (Modal)
  label: { color: '#cbd5e1', fontSize: 12, fontWeight: 'bold', marginBottom: 8, marginTop: 15 },
  input: { backgroundColor: '#0f172a', borderWidth: 1, borderColor: '#334155', borderRadius: 8, padding: 12, color: '#f8fafc' },
  errorText: { color: '#ef4444', fontSize: 10, marginTop: 4 },

  row: { flexDirection: 'row', gap: 10 },
  radioBtn: { flex: 1, paddingVertical: 10, borderWidth: 1, borderColor: '#334155', borderRadius: 8, alignItems: 'center' },
  radioText: { color: '#94a3b8', fontSize: 12, fontWeight: 'bold' },
  radioBtnActive: { borderColor: '#2563eb', backgroundColor: 'rgba(37, 99, 235, 0.1)' },
  radioTextActive: { color: '#3b82f6' },
  
  radioLevelActive: { borderColor: '#84cc16', backgroundColor: 'rgba(132, 204, 22, 0.1)' },
  radioLevelTextActive: { color: '#84cc16' },

  gridCat: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  catBtn: { width: '23%', aspectRatio: 1, borderWidth: 1, borderColor: '#334155', borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  catBtnActive: { borderColor: '#06b6d4', backgroundColor: 'rgba(6, 182, 212, 0.1)' },
  catLabel: { color: '#94a3b8', fontSize: 8, marginTop: 4 },

  modalActions: { flexDirection: 'row', gap: 10, marginTop: 20, marginBottom: 10 },
  btnGhost: { flex: 1, padding: 12, alignItems: 'center' },
  btnGhostText: { color: '#cbd5e1' },
  btnSave: { flex: 1, backgroundColor: '#2563eb', flexDirection: 'row', padding: 12, borderRadius: 8, alignItems: 'center', justifyContent: 'center', gap: 8 },
  btnSaveText: { color: '#fff', fontWeight: 'bold' }
});