import React, { useEffect, useState, useCallback } from "react";
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput, Alert, ScrollView } from "react-native";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Sparkles, ArrowLeftRight } from "lucide-react-native";
import { Spinner } from "../../src/components/ui/Spinner";
import { EmptyState } from "../../src/components/ui/EmptyState";
import { Modal } from "../../src/components/ui/Modal";
import { Avatar } from "../../src/components/ui/Avatar";
import { Badge } from "../../src/components/ui/Badge";
import { skillApi, userApi, exchangeApi } from "../../src/lib/api";
import { SkillResponse, UserResponse, SkillWithUser, SkillCategory } from "../../src/types";
import { useAuth } from "../../src/lib/auth-context";
import { sanitizeString } from "../../src/lib/utils";

// ── Algoritmo de Matching (Idéntico a web) ──────────────────────────
interface Match {
  user: UserResponse;
  theirOffers: SkillWithUser[];
  theirWants: SkillWithUser[];
  score: number;
}

function computeMatches(mySkills: SkillResponse[], allSkills: SkillWithUser[], myUserId: number): Match[] {
  const myOfferCats = new Set(mySkills.filter((s) => s.skillType === "OFFER").map((s) => s.category));
  const myWantCats = new Set(mySkills.filter((s) => s.skillType === "WANT").map((s) => s.category));
  const byUser = new Map<number, SkillWithUser[]>();
  for (const sk of allSkills) {
    if (sk.userId === myUserId) continue;
    if (!byUser.has(sk.userId)) byUser.set(sk.userId, []);
    byUser.get(sk.userId)!.push(sk);
  }
  const matches: Match[] = [];
  for (const [, userSkills] of byUser) {
    const user = userSkills[0]?.user;
    if (!user) continue;
    const theirOffers = userSkills.filter((s) => s.skillType === "OFFER");
    const theirWants = userSkills.filter((s) => s.skillType === "WANT");
    const theirOfferCats = new Set(theirOffers.map((s) => s.category as SkillCategory));
    const theirWantCats = new Set(theirWants.map((s) => s.category as SkillCategory));
    const iWantTheyOffer = [...myWantCats].filter((c) => theirOfferCats.has(c as SkillCategory)).length;
    const theyWantIOffer = [...theirWantCats].filter((c) => myOfferCats.has(c as SkillCategory)).length;
    const totalPossible = Math.max(myWantCats.size + theirWantCats.size, 1);
    const score = Math.round(((iWantTheyOffer + theyWantIOffer) / totalPossible) * 100);
    if (score > 0 || theirOffers.length > 0) matches.push({ user, theirOffers, theirWants, score });
  }
  return matches.sort((a, b) => b.score - a.score);
}

const proposeSchema = z.object({
  message: z.string().min(10, "Mínimo 10 caracteres").max(500, "Máximo 500 caracteres"),
});

export default function MatchesScreen() {
  const { user } = useAuth();
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [proposeModal, setProposeModal] = useState(false);
  const [target, setTarget] = useState<{ id: number; name: string } | null>(null);
  const [proposing, setProposing] = useState(false);

  const { control, handleSubmit, reset, formState: { errors } } = useForm<{ message: string }>({ 
    resolver: zodResolver(proposeSchema) 
  });

  const loadMatches = useCallback(async () => {
    try {
      const [myRes, allRes] = await Promise.all([skillApi.getMine(), skillApi.getAll()]);
      const mySkills: SkillResponse[] = myRes.data;
      const allSkills: SkillResponse[] = allRes.data;
      const userIds = [...new Set(allSkills.map((s) => s.userId))];
      const userMap: Record<number, UserResponse> = {};
      await Promise.allSettled(userIds.map(async (id) => {
        const r = await userApi.getById(id);
        userMap[id] = r.data;
      }));
      const enriched: SkillWithUser[] = allSkills.map((s) => ({ ...s, user: userMap[s.userId] }));
      setMatches(computeMatches(mySkills, enriched, user?.id ?? 0));
    } catch {
      Alert.alert("Error", "Error al cargar matches");
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => { loadMatches(); }, [loadMatches]);

  const onPropose = async (data: { message: string }) => {
    if (!target) return;
    setProposing(true);
    try {
      await exchangeApi.create(target.id, sanitizeString(data.message, 500));
      Alert.alert("Éxito", `¡Propuesta enviada a ${target.name}! 🚀`);
      setProposeModal(false);
    } catch (err: any) {
      Alert.alert("Error", err.message || "Error al enviar");
    } finally {
      setProposing(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Mis Matches</Text>
      
      {loading ? <Spinner size="large" /> : matches.length === 0 ? (
        <EmptyState icon="✨" title="Sin matches aún" description="Agrega habilidades para encontrar gente compatible" />
      ) : (
        <FlatList
          data={matches}
          keyExtractor={(item) => item.user.id!.toString()}
          renderItem={({ item: match }) => (
            <View style={styles.card}>
              <View style={styles.cardTop}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                  <Avatar name={match.user.fullName} size="lg" />
                  <View>
                    <Text style={styles.name}>{match.user.fullName}</Text>
                    <Text style={styles.uni}>{match.user.university || match.user.career}</Text>
                  </View>
                </View>
                <View style={[styles.scoreBadge, { backgroundColor: match.score > 70 ? '#dcfce7' : '#cffafe' }]}>
                    <Text style={styles.scoreText}>{match.score}%</Text>
                </View>
              </View>

              <View style={styles.skillsRow}>
                 {match.theirOffers.slice(0, 2).map(s => <Badge key={s.id} variant="success">{s.name}</Badge>)}
                 {match.theirWants.slice(0, 2).map(s => <Badge key={s.id} variant="accent">{s.name}</Badge>)}
              </View>

              <TouchableOpacity 
                style={styles.btnPropose} 
                onPress={() => { setTarget({ id: match.user.id!, name: match.user.fullName }); reset(); setProposeModal(true); }}
              >
                <ArrowLeftRight size={16} color="#fff" />
                <Text style={styles.btnText}>Proponer intercambio</Text>
              </TouchableOpacity>
            </View>
          )}
        />
      )}

      {/* MODAL */}
      <Modal open={proposeModal} onClose={() => setProposeModal(false)} title={`Proponer a ${target?.name}`}>
        <Text style={styles.label}>Mensaje</Text>
        <Controller
          control={control}
          name="message"
          render={({ field: { onChange, value } }) => (
            <TextInput
              style={styles.input}
              multiline
              numberOfLines={4}
              placeholder="Hola, me gustaría intercambiar..."
              value={value}
              onChangeText={onChange}
            />
          )}
        />
        {errors.message && <Text style={styles.error}>{errors.message.message}</Text>}
        <TouchableOpacity style={styles.btnSave} onPress={handleSubmit(onPropose)} disabled={proposing}>
            <Text style={styles.btnSaveText}>{proposing ? "Enviando..." : "Enviar propuesta"}</Text>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a', padding: 16, paddingTop: 50 },
  title: { color: '#fff', fontSize: 24, fontWeight: 'bold', marginBottom: 20 },
  card: { backgroundColor: '#1e293b', padding: 15, borderRadius: 12, marginBottom: 15 },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between' },
  name: { color: '#fff', fontWeight: 'bold' },
  uni: { color: '#94a3b8', fontSize: 12 },
  scoreBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12 },
  scoreText: { fontWeight: 'bold', fontSize: 14 },
  skillsRow: { flexDirection: 'row', gap: 5, marginTop: 10, marginBottom: 10 },
  btnPropose: { backgroundColor: '#2563eb', padding: 10, borderRadius: 8, flexDirection: 'row', justifyContent: 'center', gap: 5 },
  btnText: { color: '#fff', fontWeight: 'bold' },
  label: { color: '#cbd5e1', marginBottom: 5, marginTop: 10 },
  input: { backgroundColor: '#0f172a', borderWidth: 1, borderColor: '#334155', borderRadius: 8, padding: 10, color: '#fff', height: 100, textAlignVertical: 'top' },
  error: { color: '#ef4444', fontSize: 10 },
  btnSave: { backgroundColor: '#2563eb', padding: 15, borderRadius: 8, marginTop: 15, alignItems: 'center' },
  btnSaveText: { color: '#fff', fontWeight: 'bold' }
});