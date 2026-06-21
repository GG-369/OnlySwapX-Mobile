import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useAuth } from '../../src/lib/auth-context';
import { Zap, BookOpen, Users, LogOut } from 'lucide-react-native';

export default function DashboardScreen() {
  const { user, signOut } = useAuth();

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.welcomeText}>Hola, {user?.fullName?.split(" ")[0] || "Usuario"} 👋</Text>
        <Text style={styles.subText}>Aquí tienes tu resumen</Text>
      </View>

      <View style={styles.grid}>
        <View style={styles.statCard}>
          <Zap size={20} color="#84cc16" />
          <Text style={styles.statValue}>{user?.creditsBalance ?? 0}</Text>
          <Text style={styles.statLabel}>Créditos</Text>
        </View>
        <View style={styles.statCard}>
          <BookOpen size={20} color="#2563eb" />
          <Text style={styles.statValue}>0</Text>
          <Text style={styles.statLabel}>Habilidades</Text>
        </View>
      </View>

      <TouchableOpacity style={styles.logoutBtn} onPress={signOut}>
        <LogOut size={16} color="#ef4444" />
        <Text style={styles.logoutText}>Cerrar sesión</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a', padding: 20 },
  header: { marginTop: 40, marginBottom: 20 },
  welcomeText: { color: '#f8fafc', fontSize: 24, fontWeight: 'bold' },
  subText: { color: '#cbd5e1', fontSize: 14, marginTop: 5 },
  grid: { flexDirection: 'row', gap: 15 },
  statCard: { flex: 1, backgroundColor: '#1e293b', padding: 15, borderRadius: 12, alignItems: 'center' },
  statValue: { color: '#f8fafc', fontSize: 20, fontWeight: 'bold', marginVertical: 5 },
  statLabel: { color: '#cbd5e1', fontSize: 12 },
  logoutBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 40, padding: 15, backgroundColor: '#1e293b', borderRadius: 8, gap: 10 },
  logoutText: { color: '#ef4444', fontWeight: '600' }
});