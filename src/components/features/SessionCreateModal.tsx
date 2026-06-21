import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ScrollView } from "react-native";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { CalendarDays, Zap } from "lucide-react-native";
import { Modal } from "../ui/Modal";
import { Spinner } from "../ui/Spinner";
import { sessionApi } from "../../lib/api";
import { ExchangeResponse } from "../../types";
import { sanitizeString } from "../../lib/utils";
import { useAuth } from "../../lib/auth-context";

const schema = z.object({
  topic: z
    .string()
    .min(3, "Mínimo 3 caracteres")
    .max(120, "Máximo 120 caracteres")
    .regex(/^[^<>"';&]+$/, "Caracteres no permitidos"),
  scheduledAt: z.string().refine((val) => {
    const date = new Date(val);
    return date > new Date();
  }, "La fecha debe ser futura"),
  creditsAmount: z
    .number()
    .min(1, "Mínimo 1 crédito")
    .max(20, "Máximo 20 créditos"),
  durationMinutes: z
    .number()
    .min(15, "Mínimo 15 minutos")
    .max(240, "Máximo 4 horas"),
});

type FormData = z.infer<typeof schema>;

interface SessionCreateModalProps {
  exchange: ExchangeResponse;
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
}

export function SessionCreateModal({ exchange, open, onClose, onCreated }: SessionCreateModalProps) {
  const { user } = useAuth();
  const [saving, setSaving] = useState(false);
  const [isTeacher, setIsTeacher] = useState(true);

  const teacherId = isTeacher ? user?.id : (user?.id === exchange.requesterId ? exchange.receiverId : exchange.requesterId);
  const studentId = isTeacher ? (user?.id === exchange.requesterId ? exchange.receiverId : exchange.requesterId) : user?.id;

  const { control, handleSubmit, reset, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      durationMinutes: 60,
      creditsAmount: 3,
    },
  });

  const onSubmit = async (data: FormData) => {
    if (!teacherId || !studentId) return;
    setSaving(true);
    try {
      await sessionApi.create({
        exchangeId: exchange.id,
        teacherId,
        studentId,
        topic: sanitizeString(data.topic, 120),
        scheduledAt: new Date(data.scheduledAt).toISOString(),
        creditsAmount: data.creditsAmount,
        durationMinutes: data.durationMinutes,
      });
      Alert.alert("Éxito", "¡Sesión programada! Los créditos quedan en escrow 🔒");
      reset();
      onCreated();
      onClose();
    } catch (err: any) {
      Alert.alert("Error", err.message || "Error al crear sesión");
    } finally {
      setSaving(false);
    }
  };

  const otherName = user?.id === exchange.requesterId ? exchange.receiverName : exchange.requesterName;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Programar sesión"
      description={`Con ${otherName} · Intercambio #${exchange.id}`}
    >
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Selector de Rol */}
        <Text style={styles.label}>Tu rol en esta sesión</Text>
        <View style={styles.roleContainer}>
          <TouchableOpacity
            style={[styles.roleButton, isTeacher && styles.roleActive]}
            onPress={() => setIsTeacher(true)}
          >
            <Text style={[styles.roleTitle, isTeacher && styles.roleTextActive]}>🎓 Soy el profesor</Text>
            <Text style={styles.roleDesc}>Recibes créditos</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.roleButton, !isTeacher && styles.roleActive]}
            onPress={() => setIsTeacher(false)}
          >
            <Text style={[styles.roleTitle, !isTeacher && styles.roleTextActive]}>📖 Soy el alumno</Text>
            <Text style={styles.roleDesc}>Pagas créditos</Text>
          </TouchableOpacity>
        </View>

        {/* Tema */}
        <Text style={styles.label}>Tema de la sesión *</Text>
        <Controller
          control={control}
          name="topic"
          render={({ field: { onChange, value } }) => (
            <TextInput
              style={styles.input}
              placeholder="ej. Intro a Python"
              placeholderTextColor="#64748b"
              value={value}
              onChangeText={onChange}
            />
          )}
        />
        {errors.topic && <Text style={styles.errorText}>{errors.topic.message}</Text>}

        {/* Fecha y Hora */}
        <View style={styles.iconLabel}>
          <CalendarDays size={14} color="#cbd5e1" />
          <Text style={styles.label}>Fecha y hora * (YYYY-MM-DDTHH:MM)</Text>
        </View>
        <Controller
          control={control}
          name="scheduledAt"
          render={({ field: { onChange, value } }) => (
            <TextInput
              style={styles.input}
              placeholder="2026-06-25T15:30"
              placeholderTextColor="#64748b"
              value={value}
              onChangeText={onChange}
            />
          )}
        />
        {errors.scheduledAt && <Text style={styles.errorText}>{errors.scheduledAt.message}</Text>}

        {/* Duración y Créditos */}
        <View style={styles.row}>
          <View style={styles.halfWidth}>
            <Text style={styles.label}>Duración (min)</Text>
            <Controller
              control={control}
              name="durationMinutes"
              render={({ field: { onChange, value } }) => (
                <TextInput
                  style={styles.input}
                  keyboardType="numeric"
                  value={value?.toString()}
                  onChangeText={(text) => onChange(parseInt(text) || 0)}
                />
              )}
            />
            {errors.durationMinutes && <Text style={styles.errorText}>{errors.durationMinutes.message}</Text>}
          </View>
          <View style={styles.halfWidth}>
            <View style={styles.iconLabel}>
              <Zap size={14} color="#cbd5e1" />
              <Text style={styles.label}>Créditos</Text>
            </View>
            <Controller
              control={control}
              name="creditsAmount"
              render={({ field: { onChange, value } }) => (
                <TextInput
                  style={styles.input}
                  keyboardType="numeric"
                  value={value?.toString()}
                  onChangeText={(text) => onChange(parseInt(text) || 0)}
                />
              )}
            />
            {errors.creditsAmount && <Text style={styles.errorText}>{errors.creditsAmount.message}</Text>}
          </View>
        </View>

        {/* Nota Escrow */}
        <View style={styles.escrowBox}>
          <Text style={styles.escrowText}>
            🔒 Los créditos se reservarán en escrow al crear la sesión. Se liberan cuando ambos confirmen.
          </Text>
        </View>

        {/* Botones */}
        <View style={styles.buttonRow}>
          <TouchableOpacity style={styles.btnGhost} onPress={onClose}>
            <Text style={styles.btnGhostText}>Cancelar</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.btnPrimary} onPress={handleSubmit(onSubmit)} disabled={saving}>
            {saving ? <Spinner size="small" /> : (
              <View style={styles.btnContent}>
                <CalendarDays size={16} color="#fff" />
                <Text style={styles.btnPrimaryText}>Programar</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  label: { color: '#cbd5e1', fontSize: 12, fontWeight: 'bold', marginBottom: 5, marginTop: 10 },
  iconLabel: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  input: { backgroundColor: '#0f172a', borderColor: '#334155', borderWidth: 1, borderRadius: 8, padding: 12, color: '#f8fafc' },
  errorText: { color: '#ef4444', fontSize: 10, marginTop: 2 },
  
  roleContainer: { flexDirection: 'row', gap: 10, marginBottom: 10 },
  roleButton: { flex: 1, padding: 12, borderRadius: 8, borderWidth: 1, borderColor: '#334155' },
  roleActive: { borderColor: '#2563eb', backgroundColor: 'rgba(37, 99, 235, 0.1)' },
  roleTitle: { color: '#cbd5e1', fontSize: 14, fontWeight: 'bold' },
  roleTextActive: { color: '#2563eb' },
  roleDesc: { color: '#94a3b8', fontSize: 10, marginTop: 2 },

  row: { flexDirection: 'row', gap: 10 },
  halfWidth: { flex: 1 },

  escrowBox: { backgroundColor: 'rgba(234, 179, 8, 0.1)', borderColor: 'rgba(234, 179, 8, 0.3)', borderWidth: 1, padding: 12, borderRadius: 8, marginVertical: 15 },
  escrowText: { color: '#eab308', fontSize: 11, lineHeight: 16 },

  buttonRow: { flexDirection: 'row', gap: 10, marginTop: 10 },
  btnGhost: { flex: 1, padding: 12, borderRadius: 8, alignItems: 'center' },
  btnGhostText: { color: '#cbd5e1' },
  btnPrimary: { flex: 1, backgroundColor: '#2563eb', padding: 12, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  btnPrimaryText: { color: '#fff', fontWeight: 'bold', marginLeft: 8 },
  btnContent: { flexDirection: 'row', alignItems: 'center' }
});