import React from 'react';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import type { LucideIcon } from 'lucide-react-native';

export const colors = {
  background: '#0f172a',
  card: '#1e293b',
  cardSoft: '#162033',
  border: '#334155',
  text: '#f8fafc',
  muted: '#94a3b8',
  accent: '#facc15',
  danger: '#ef4444',
  success: '#22c55e',
  blue: '#3b82f6',
};

interface HeaderProps {
  title: string;
  subtitle?: string;
  right?: React.ReactNode;
}

export function ScreenHeader({ title, subtitle, right }: HeaderProps) {
  return (
    <View style={styles.header}>
      <View style={styles.headerText}>
        <Text style={styles.title}>{title}</Text>
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      </View>
      {right}
    </View>
  );
}

export function Card({ children, style }: { children: React.ReactNode; style?: object }) {
  return <View style={[styles.card, style]}>{children}</View>;
}

export function Badge({ children, tone = 'neutral' }: { children: React.ReactNode; tone?: 'neutral' | 'accent' | 'success' | 'danger' | 'blue' }) {
  const toneStyle = {
    neutral: styles.badgeNeutral,
    accent: styles.badgeAccent,
    success: styles.badgeSuccess,
    danger: styles.badgeDanger,
    blue: styles.badgeBlue,
  }[tone];

  return (
    <View style={[styles.badge, toneStyle]}>
      <Text style={[styles.badgeText, tone === 'accent' && styles.badgeTextDark]}>{children}</Text>
    </View>
  );
}

interface ButtonProps {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  disabled?: boolean;
  loading?: boolean;
  icon?: LucideIcon;
}

export function Button({ label, onPress, variant = 'primary', disabled, loading, icon: Icon }: ButtonProps) {
  const variantStyle = {
    primary: styles.buttonPrimary,
    secondary: styles.buttonSecondary,
    ghost: styles.buttonGhost,
    danger: styles.buttonDanger,
  }[variant];
  const textStyle = variant === 'primary' ? styles.buttonPrimaryText : styles.buttonText;
  const iconColor = variant === 'primary' ? colors.background : variant === 'danger' ? '#fee2e2' : colors.text;

  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={onPress}
      disabled={disabled || loading}
      style={[styles.button, variantStyle, (disabled || loading) && styles.disabled]}
    >
      {loading ? <ActivityIndicator size="small" color={iconColor} /> : Icon ? <Icon size={16} color={iconColor} /> : null}
      <Text style={textStyle}>{label}</Text>
    </TouchableOpacity>
  );
}

export function EmptyState({ icon: Icon, title, subtitle, action }: { icon: LucideIcon; title: string; subtitle?: string; action?: React.ReactNode }) {
  return (
    <Card style={styles.empty}>
      <Icon size={34} color="rgba(250, 204, 21, 0.45)" />
      <Text style={styles.emptyTitle}>{title}</Text>
      {subtitle ? <Text style={styles.emptySubtitle}>{subtitle}</Text> : null}
      {action ? <View style={styles.emptyAction}>{action}</View> : null}
    </Card>
  );
}

export function LoadingState() {
  return (
    <View style={styles.loading}>
      <ActivityIndicator size="large" color={colors.accent} />
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 16,
    marginBottom: 18,
  },
  headerText: {
    flex: 1,
  },
  title: {
    color: colors.text,
    fontSize: 26,
    fontWeight: '800',
  },
  subtitle: {
    color: colors.muted,
    fontSize: 14,
    marginTop: 4,
  },
  card: {
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderRadius: 14,
    borderWidth: 1,
    padding: 16,
  },
  badge: {
    alignSelf: 'flex-start',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  badgeNeutral: {
    backgroundColor: '#334155',
  },
  badgeAccent: {
    backgroundColor: colors.accent,
  },
  badgeSuccess: {
    backgroundColor: 'rgba(34, 197, 94, 0.18)',
  },
  badgeDanger: {
    backgroundColor: 'rgba(239, 68, 68, 0.18)',
  },
  badgeBlue: {
    backgroundColor: 'rgba(59, 130, 246, 0.18)',
  },
  badgeText: {
    color: colors.text,
    fontSize: 11,
    fontWeight: '700',
  },
  badgeTextDark: {
    color: colors.background,
  },
  button: {
    minHeight: 42,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  buttonPrimary: {
    backgroundColor: colors.accent,
  },
  buttonSecondary: {
    backgroundColor: colors.cardSoft,
    borderColor: colors.border,
    borderWidth: 1,
  },
  buttonGhost: {
    backgroundColor: 'transparent',
  },
  buttonDanger: {
    backgroundColor: 'rgba(239, 68, 68, 0.18)',
    borderColor: 'rgba(239, 68, 68, 0.35)',
    borderWidth: 1,
  },
  buttonPrimaryText: {
    color: colors.background,
    fontSize: 13,
    fontWeight: '800',
  },
  buttonText: {
    color: colors.text,
    fontSize: 13,
    fontWeight: '800',
  },
  disabled: {
    opacity: 0.55,
  },
  empty: {
    alignItems: 'center',
    paddingVertical: 34,
  },
  emptyTitle: {
    color: colors.text,
    fontSize: 17,
    fontWeight: '800',
    marginTop: 12,
    textAlign: 'center',
  },
  emptySubtitle: {
    color: colors.muted,
    fontSize: 13,
    marginTop: 6,
    textAlign: 'center',
  },
  emptyAction: {
    marginTop: 16,
  },
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
  },
});
