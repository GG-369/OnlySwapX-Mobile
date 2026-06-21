import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { ExchangeStatus, SessionStatus, SkillType } from "../../types";

interface BadgeProps {
  children: React.ReactNode;
  variant?: "primary" | "success" | "accent" | "danger" | "warning" | "neutral";
}

const colors = {
  primary: { bg: '#dbeafe', text: '#2563eb' },
  success: { bg: '#dcfce7', text: '#84cc16' },
  accent: { bg: '#cffafe', text: '#06b6d4' },
  danger: { bg: '#fee2e2', text: '#ef4444' },
  warning: { bg: '#fef3c7', text: '#f59e0b' },
  neutral: { bg: '#f1f5f9', text: '#64748b' },
};

export function Badge({ children, variant = "neutral" }: BadgeProps) {
  return (
    <View style={[styles.badge, { backgroundColor: colors[variant].bg }]}>
      <Text style={[styles.text, { color: colors[variant].text }]}>{children}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 12, alignSelf: 'flex-start' },
  text: { fontSize: 10, fontWeight: 'bold' }
});

// ─── Specialized badges ───────────────────────────────────────────

export function ExchangeStatusBadge({ status }: { status: ExchangeStatus }) {
  const map: Record<ExchangeStatus, { label: string; variant: BadgeProps["variant"] }> = {
    PENDING: { label: "Pendiente", variant: "warning" },
    ACCEPTED: { label: "Aceptado", variant: "success" },
    REJECTED: { label: "Rechazado", variant: "danger" },
    COMPLETED: { label: "Completado", variant: "accent" },
    CANCELLED: { label: "Cancelado", variant: "neutral" },
  };
  const { label, variant } = map[status] ?? { label: status, variant: "neutral" };
  return <Badge variant={variant}>{label}</Badge>;
}

export function SessionStatusBadge({ status }: { status: SessionStatus }) {
  const map: Record<SessionStatus, { label: string; variant: BadgeProps["variant"] }> = {
    SCHEDULED: { label: "Programada", variant: "primary" },
    TEACHER_CONFIRMED: { label: "Prof. confirmó", variant: "warning" },
    STUDENT_CONFIRMED: { label: "Alumno confirmó", variant: "warning" },
    COMPLETED: { label: "Completada", variant: "success" },
    CANCELLED: { label: "Cancelada", variant: "danger" },
  };
  const { label, variant } = map[status] ?? { label: status, variant: "neutral" };
  return <Badge variant={variant}>{label}</Badge>;
}

export function SkillTypeBadge({ type }: { type: SkillType }) {
  return type === "OFFER" ? (
    <Badge variant="success">🎓 Ofrezco</Badge>
  ) : (
    <Badge variant="accent">🔍 Busco</Badge>
  );
}