import React, { useEffect, useState, useCallback } from "react";
import { View, Text, StyleSheet, TouchableOpacity, FlatList, Alert } from "react-native";
import { Calendar, Clock, Zap, CheckCircle } from "lucide-react-native";
import { Spinner } from "../../src/components/ui/Spinner";
import { EmptyState } from "../../src/components/ui/EmptyState";
import { SessionStatusBadge } from "../../src/components/ui/Badge";
import { sessionApi } from "../../src/lib/api";
import { SessionResponse } from "../../src/types";
import { useAuth } from "../../src/lib/auth-context";
import { formatDateTime } from "../../src/lib/utils";
import { Avatar } from "../../src/components/ui/Avatar";

type Tab = "UPCOMING" | "COMPLETED" | "ALL";

export default function SessionsScreen() {
  const { user, updateCredits } = useAuth();
  const [sessions, setSessions] = useState<SessionResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>("UPCOMING");
  const [actioning, setActioning] = useState<number | null>(null);

  const fetchSessions = useCallback(async () => {
    try {
      const res = await sessionApi.getMine();
      setSessions(res.data);
    } catch {
      Alert.alert("Error", "Error al cargar las sesiones");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

  const filtered = sessions.filter((s) => {
    if (tab === "UPCOMING")
      return ["SCHEDULED", "TEACHER_CONFIRMED", "STUDENT_CONFIRMED"].includes(s.status);
    if (tab === "COMPLETED") return s.status === "COMPLETED";
    return true;
  });

  const confirm = async (id: number) => {
    setActioning(id);
    try {
      await sessionApi.confirm(id);
      Alert.alert("Éxito", "Asistencia confirmada ✓");
      await fetchSessions();
      
      // Actualizar créditos si la sesión se completó
      const s = sessions.find((x) => x.id === id);
      if (s && user) {
        const isTeacher = s.teacherId === user.id;
        if (isTeacher && s.studentConfirmed) {
          updateCredits((user.creditsBalance ?? 0) + s.creditsAmount);
        }
      }
    } catch (err: any) {
      Alert.alert("Error", err.message || "No se pudo confirmar");
    } finally {
      setActioning(null);
    }
  };

  const cancel = (id: number) => {
    Alert.alert(
      "Cancelar Sesión",
      "¿Estás seguro de cancelar esta sesión? Los créditos serán devueltos.",
      [
        { text: "No, mantener", style: "cancel" },
        { 
          text: "Sí, cancelar", 
          style: "destructive",
          onPress: async () => {
            setActioning(id);
            try {
              await sessionApi.cancel(id);
              Alert.alert("Cancelada", "Sesión cancelada. Créditos reembolsados.");
              fetchSessions();
            } catch (err: any) {
              Alert.alert("Error", err.message || "No se pudo cancelar");
            } finally {
              setActioning(null);
            }
          }
        }
      ]
    );
  };

  const renderSession = ({ item: s }: { item: SessionResponse }) => {
    const isTeacher = s.teacherId === user?.id;
    const myConfirmed = isTeacher ? s.teacherConfirmed : s.studentConfirmed;
    const canConfirm = ["SCHEDULED", "TEACHER_CONFIRMED", "STUDENT_CONFIRMED"].includes(s.status) && !myConfirmed;
    const canCancel = s.status === "SCHEDULED";

    return (
      <View style={styles.card}>
        {/* Cabecera del Card */}
        <View style={styles.cardHeader}>
          <View style={styles.cardHeaderLeft}>
            <Text style={styles.topicTitle}>{s.topic}</Text>
            
            <View style={styles.detailsRow}>
              <View style={styles.detailBadge}>
                <Calendar size={12} color="#94a3b8" />
                <Text style={styles.detailText}>{formatDateTime(s.scheduledAt)}</Text>
              </View>
              <View style={styles.detailBadge}>
                <Clock size={12} color="#94a3b8" />
                <Text style={styles.detailText}>{s.durationMinutes} min</Text>
              </View>
              <View style={styles.detailBadge}>
                <Zap size={12} color="#eab308" />
                <Text style={styles.detailText}>{s.creditsAmount} cred</Text>
              </View>
            </View>
          </View>
          <View style={styles.badgeContainer}>
            <SessionStatusBadge status={s.status} />
          </View>
        </View>

        {/* Participantes */}
        <View style={styles.participantsContainer}>
          <View style={styles.participant}>
            <Avatar name={s.teacherName} size="sm" />
            <View style={styles.participantInfo}>
              <Text style={styles.participantName}>{s.teacherName}</Text>
              <Text style={styles.participantRole}>Profesor {s.teacherConfirmed ? "✓" : ""}</Text>
            </View>
          </View>
          
          <Text style={styles.swapIcon}>⇄</Text>
          
          <View style={styles.participant}>
            <Avatar name={s.studentName} size="sm" />
            <View style={styles.participantInfo}>
              <Text style={styles.participantName}>{s.studentName}</Text>
              <Text style={styles.participantRole}>Alumno {s.studentConfirmed ? "✓" : ""}</Text>
            </View>
          </View>
        </View>

        {/* Acciones */}
        {(canConfirm || canCancel) && (
          <View style={styles.actionsRow}>
            {canCancel && (
              <TouchableOpacity 
                style={styles.btnDanger} 
                onPress={() => cancel(s.id)}
                disabled={actioning === s.id}
              >
                <Text style={styles.btnDangerText}>Cancelar</Text>
              </TouchableOpacity>
            )}
            {canConfirm && (
              <TouchableOpacity 
                style={styles.btnSuccess} 
                onPress={() => confirm(s.id)}
                disabled={actioning === s.id}
              >
                {actioning === s.id ? (
                  <Spinner size="small" />
                ) : (
                  <>
                    <CheckCircle size={16} color="#fff" />
                    <Text style={styles.btnSuccessText}>Confirmar</Text>
                  </>
                )}
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* Mensaje de completado */}
        {s.status === "COMPLETED" && (
          <View style={styles.completedMessage}>
            <CheckCircle size={16} color="#84cc16" />
            <Text style={styles.completedText}>
              Sesión completada · +{s.creditsAmount} créditos liberados
            </Text>
          </View>
        )}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Mis Sesiones</Text>
        <Text style={styles.subtitle}>Sesiones de aprendizaje programadas</Text>
      </View>

      {/* Tabs */}
      <View style={styles.tabContainer}>
        {(["UPCOMING", "COMPLETED", "ALL"] as Tab[]).map((t) => (
          <TouchableOpacity 
            key={t} 
            style={[styles.tabBtn, tab === t && styles.tabActive]}
            onPress={() => setTab(t)}
          >
            <Text style={[styles.tabText, tab === t && styles.tabTextActive]}>
              {t === "UPCOMING" ? "Próximas" : t === "COMPLETED" ? "Completadas" : "Todas"}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading ? (
        <View style={styles.centerLoad}>
          <Spinner size="large" />
        </View>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon="📅"
          title="Sin sesiones"
          description="Acepta un intercambio y programa tu primera sesión"
        />
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={{ paddingBottom: 20 }}
          renderItem={renderSession}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a', padding: 16, paddingTop: 50 },
  header: { marginBottom: 20 },
  title: { color: '#f8fafc', fontSize: 24, fontWeight: 'bold' },
  subtitle: { color: '#94a3b8', fontSize: 12, marginTop: 4 },
  
  tabContainer: { flexDirection: 'row', backgroundColor: '#1e293b', borderRadius: 12, padding: 4, marginBottom: 20, alignSelf: 'flex-start' },
  tabBtn: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8 },
  tabActive: { backgroundColor: '#0f172a' },
  tabText: { color: '#94a3b8', fontSize: 12, fontWeight: 'bold' },
  tabTextActive: { color: '#f8fafc' },

  centerLoad: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  card: { backgroundColor: '#1e293b', borderRadius: 12, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: '#334155' },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 15 },
  cardHeaderLeft: { flex: 1, paddingRight: 10 },
  topicTitle: { color: '#f8fafc', fontSize: 16, fontWeight: 'bold', marginBottom: 6 },
  
  detailsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  detailBadge: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  detailText: { color: '#94a3b8', fontSize: 11 },
  badgeContainer: { alignItems: 'flex-end' },

  participantsContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#0f172a', padding: 12, borderRadius: 8, marginBottom: 15 },
  participant: { flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 },
  participantInfo: { flex: 1 },
  participantName: { color: '#f8fafc', fontSize: 12, fontWeight: 'bold' },
  participantRole: { color: '#94a3b8', fontSize: 10, marginTop: 2 },
  swapIcon: { color: '#64748b', fontSize: 16, marginHorizontal: 10 },

  actionsRow: { flexDirection: 'row', gap: 10 },
  btnDanger: { backgroundColor: 'rgba(239, 68, 68, 0.1)', borderWidth: 1, borderColor: 'rgba(239, 68, 68, 0.3)', paddingVertical: 10, paddingHorizontal: 15, borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
  btnDangerText: { color: '#ef4444', fontWeight: 'bold', fontSize: 12 },
  btnSuccess: { flex: 1, backgroundColor: '#84cc16', flexDirection: 'row', paddingVertical: 10, borderRadius: 8, justifyContent: 'center', alignItems: 'center', gap: 6 },
  btnSuccessText: { color: '#fff', fontWeight: 'bold', fontSize: 12 },

  completedMessage: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 5 },
  completedText: { color: '#84cc16', fontSize: 12, fontWeight: 'bold' }
});