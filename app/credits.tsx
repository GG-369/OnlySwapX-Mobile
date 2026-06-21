import React, { useEffect, useState, useCallback } from "react";
import { View, Text, StyleSheet, ScrollView, Alert } from "react-native";
import { Zap, ArrowDownLeft, Lock, RefreshCw, Gift } from "lucide-react-native";
import { Spinner } from "../src/components/ui/Spinner";
import { creditApi } from "../src/lib/api";
import { useAuth } from "../src/lib/auth-context";

// Tipos de transacciones del backend
type TxType = "ESCROW_HOLD" | "ESCROW_RELEASE" | "ESCROW_REFUND" | "INITIAL_GRANT";

interface Transaction {
  id: number;
  type: TxType;
  amount: number;
  description: string;
  date: string;
  dir: "in" | "out";
}

// Configuración visual adaptada a React Native (Colores y fondos)
const txConfig: Record<TxType, { label: string; icon: React.ReactNode; dir: "in" | "out"; color: string; bg: string }> = {
  INITIAL_GRANT: {
    label: "Créditos de bienvenida",
    icon: <Gift size={16} color="#84cc16" />,
    dir: "in",
    color: "#84cc16", // success
    bg: "rgba(132, 204, 22, 0.1)",
  },
  ESCROW_HOLD: {
    label: "Reserva (escrow)",
    icon: <Lock size={16} color="#facc15" />,
    dir: "out",
    color: "#facc15", // yellow-400
    bg: "rgba(250, 204, 21, 0.1)",
  },
  ESCROW_RELEASE: {
    label: "Pago recibido",
    icon: <ArrowDownLeft size={16} color="#84cc16" />,
    dir: "in",
    color: "#84cc16", // success
    bg: "rgba(132, 204, 22, 0.1)",
  },
  ESCROW_REFUND: {
    label: "Reembolso",
    icon: <RefreshCw size={16} color="#06b6d4" />,
    dir: "in",
    color: "#06b6d4", // accent
    bg: "rgba(6, 182, 212, 0.1)",
  },
};

// Mock de transacciones
const MOCK_TX: Transaction[] = [
  {
    id: 1,
    type: "INITIAL_GRANT",
    amount: 10,
    description: "Créditos de bienvenida a OnlySwapX",
    date: new Date(Date.now() - 1_209_600_000).toISOString(),
    dir: "in",
  },
  {
    id: 2,
    type: "ESCROW_HOLD",
    amount: 3,
    description: "Reserva para sesión: Intro a Figma",
    date: new Date(Date.now() - 604_800_000).toISOString(),
    dir: "out",
  },
  {
    id: 3,
    type: "ESCROW_RELEASE",
    amount: 3,
    description: "Pago por sesión: Guitarra clásica",
    date: new Date(Date.now() - 432_000_000).toISOString(),
    dir: "in",
  },
];

export default function CreditsScreen() {
  const { user, updateCredits } = useAuth();
  const [balance, setBalance] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchBalance = useCallback(async () => {
    try {
      const res = await creditApi.getBalance();
      setBalance(res.data.balance);
      updateCredits(res.data.balance);
    } catch {
      // Si la API falla, usamos el balance del usuario guardado silenciosamente
      console.log("No se pudo cargar el balance del servidor, usando caché.");
    } finally {
      setLoading(false);
    }
  }, [updateCredits]);

  useEffect(() => {
    fetchBalance();
  }, [fetchBalance]);

  const displayBalance = balance ?? user?.creditsBalance ?? 0;

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      
      {/* HEADER */}
      <View style={styles.header}>
        <Text style={styles.pageTitle}>Mis Créditos</Text>
        <Text style={styles.pageSubtitle}>Los créditos son la moneda de OnlySwapX</Text>
      </View>

      {loading ? (
        <View style={styles.centerLoad}>
          <Spinner size="large" />
        </View>
      ) : (
        <>
          {/* BALANCE HERO */}
          <View style={styles.heroCard}>
            <View style={styles.heroBgIcon}>
              <Zap size={100} color="rgba(132, 204, 22, 0.1)" />
            </View>
            <Text style={styles.heroLabel}>Balance disponible</Text>
            <View style={styles.heroAmountRow}>
              <Text style={styles.heroAmount}>{displayBalance}</Text>
              <Text style={styles.heroCurrency}>créditos</Text>
            </View>
            <Text style={styles.heroDesc}>
              Cada sesión vale entre 1 y 10 créditos según acuerdo mutuo
            </Text>
          </View>

          {/* CÓMO FUNCIONA */}
          <View style={styles.infoCard}>
            <View style={styles.sectionHeaderRow}>
              <Zap size={18} color="#2563eb" />
              <Text style={styles.sectionTitle}>¿Cómo funcionan?</Text>
            </View>

            <View style={styles.featuresList}>
              {[
                {
                  icon: <Gift size={16} color="#84cc16" />,
                  title: "10 créditos de bienvenida",
                  desc: "Al registrarte recibes 10 créditos para empezar a intercambiar.",
                  bg: "rgba(132, 204, 22, 0.1)",
                  border: "rgba(132, 204, 22, 0.3)",
                },
                {
                  icon: <Lock size={16} color="#facc15" />,
                  title: "Escrow automático",
                  desc: "Al programar una sesión, los créditos se reservan en escrow y se retienen hasta que ambas partes confirmen.",
                  bg: "rgba(250, 204, 21, 0.1)",
                  border: "rgba(250, 204, 21, 0.3)",
                },
                {
                  icon: <ArrowDownLeft size={16} color="#06b6d4" />,
                  title: "Liberación dual",
                  desc: "Cuando el profesor y el alumno confirman la sesión, los créditos se liberan automáticamente al profesor.",
                  bg: "rgba(6, 182, 212, 0.1)",
                  border: "rgba(6, 182, 212, 0.3)",
                },
                {
                  icon: <RefreshCw size={16} color="#2563eb" />,
                  title: "Reembolso inmediato",
                  desc: "Si cancelas una sesión, recuperas tus créditos al instante.",
                  bg: "rgba(37, 99, 235, 0.1)",
                  border: "rgba(37, 99, 235, 0.3)",
                },
              ].map((item, i) => (
                <View key={i} style={[styles.featureItem, { backgroundColor: item.bg, borderColor: item.border }]}>
                  <View style={styles.featureIcon}>{item.icon}</View>
                  <View style={styles.featureTextCol}>
                    <Text style={styles.featureTitle}>{item.title}</Text>
                    <Text style={styles.featureDesc}>{item.desc}</Text>
                  </View>
                </View>
              ))}
            </View>
          </View>

          {/* HISTORIAL */}
          <View style={[styles.infoCard, { marginBottom: 40 }]}>
            <Text style={styles.sectionTitle}>Historial de transacciones</Text>
            
            <View style={styles.txList}>
              {MOCK_TX.map((tx) => {
                const config = txConfig[tx.type];
                const isIn = config.dir === "in";

                return (
                  <View key={tx.id} style={styles.txRow}>
                    <View style={[styles.txIconBox, { backgroundColor: config.bg }]}>
                      {config.icon}
                    </View>
                    
                    <View style={styles.txTextCol}>
                      <Text style={styles.txLabel}>{config.label}</Text>
                      <Text style={styles.txDesc} numberOfLines={1}>{tx.description}</Text>
                    </View>
                    
                    <View style={styles.txAmountCol}>
                      <Text style={[styles.txAmount, { color: isIn ? '#84cc16' : '#facc15' }]}>
                        {isIn ? "+" : "-"}{tx.amount}
                      </Text>
                      <Text style={styles.txDate}>
                        {new Date(tx.date).toLocaleDateString("es-PE", { day: "numeric", month: "short" })}
                      </Text>
                    </View>
                  </View>
                );
              })}
            </View>
          </View>
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a', padding: 16 },
  header: { marginTop: 40, marginBottom: 20 },
  pageTitle: { color: '#f8fafc', fontSize: 24, fontWeight: 'bold' },
  pageSubtitle: { color: '#94a3b8', fontSize: 12, marginTop: 4 },
  
  centerLoad: { paddingVertical: 50, alignItems: 'center' },

  heroCard: { backgroundColor: 'rgba(132, 204, 22, 0.05)', borderRadius: 16, padding: 20, borderWidth: 1, borderColor: 'rgba(132, 204, 22, 0.3)', marginBottom: 20, position: 'relative', overflow: 'hidden' },
  heroBgIcon: { position: 'absolute', right: -10, top: -10 },
  heroLabel: { color: 'rgba(132, 204, 22, 0.8)', fontSize: 12, fontWeight: 'bold', textTransform: 'uppercase', marginBottom: 10 },
  heroAmountRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 8, marginBottom: 10 },
  heroAmount: { color: '#84cc16', fontSize: 48, fontWeight: 'bold', lineHeight: 50 },
  heroCurrency: { color: 'rgba(132, 204, 22, 0.8)', fontSize: 16, marginBottom: 8 },
  heroDesc: { color: '#cbd5e1', fontSize: 12 },

  infoCard: { backgroundColor: '#1e293b', borderRadius: 16, padding: 16, marginBottom: 20, borderWidth: 1, borderColor: '#334155' },
  sectionHeaderRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 15 },
  sectionTitle: { color: '#f8fafc', fontSize: 16, fontWeight: 'bold' },
  
  featuresList: { gap: 10 },
  featureItem: { flexDirection: 'row', padding: 12, borderRadius: 12, borderWidth: 1, alignItems: 'flex-start', gap: 12 },
  featureIcon: { marginTop: 2 },
  featureTextCol: { flex: 1 },
  featureTitle: { color: '#f8fafc', fontSize: 14, fontWeight: 'bold' },
  featureDesc: { color: '#cbd5e1', fontSize: 12, marginTop: 4, lineHeight: 18 },

  txList: { marginTop: 10 },
  txRow: { flexDirection: 'row', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: '#334155', paddingVertical: 12 },
  txIconBox: { width: 40, height: 40, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  txTextCol: { flex: 1, paddingHorizontal: 12 },
  txLabel: { color: '#f8fafc', fontSize: 14, fontWeight: 'bold' },
  txDesc: { color: '#94a3b8', fontSize: 11, marginTop: 2 },
  txAmountCol: { alignItems: 'flex-end' },
  txAmount: { fontSize: 16, fontWeight: 'bold' },
  txDate: { color: '#64748b', fontSize: 10, marginTop: 4 }
});