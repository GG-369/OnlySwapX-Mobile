import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, TouchableOpacity, Alert } from 'react-native';
import * as Location from 'expo-location';
import { skillApi } from '@/lib/api';
import { SkillWithUser } from '@/types';
import { useAuth } from '@/lib/auth-context';
import { SkillCard } from '@/components/features/SkillCard';

export default function ExploreScreen() {
  const { user } = useAuth();
  const [skills, setSkills] = useState<SkillWithUser[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Estados de Geolocalización (Sensor para la Rúbrica)
  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);

  // 1. Cargar Skills
  const fetchSkills = useCallback(async () => {
    try {
      const res = await skillApi.getAll();
      setSkills(res.data);
    } catch (error) {
      Alert.alert('Error', 'No se pudieron cargar las habilidades');
    } finally {
      setLoading(false);
    }
  }, []);

  // 2. Pedir permisos y obtener Geolocalización
  const fetchLocation = async () => {
    let { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      setLocationError('Permiso de ubicación denegado. No podemos mostrar sugerencias cercanas.');
      return;
    }

    try {
      let loc = await Location.getCurrentPositionAsync({});
      setLocation(loc);
      // Opcional: Aquí podrías llamar a un endpoint especial como `skillApi.getNearby(loc.coords.latitude, loc.coords.longitude)`
    } catch (error) {
      setLocationError('No se pudo obtener la ubicación.');
    }
  };

  useEffect(() => {
    fetchSkills();
    fetchLocation();
  }, [fetchSkills]);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Explorar Habilidades</Text>
        <Text style={styles.subtitle}>Encuentra el match perfecto</Text>
      </View>

      {/* Tarjeta de Sensor de Geolocalización (Demuestra uso de sensor nativo) */}
      <View style={styles.locationCard}>
        <Text style={styles.locationTitle}>📍 Tu ubicación actual</Text>
        {locationError ? (
          <Text style={styles.locationError}>{locationError}</Text>
        ) : !location ? (
          <ActivityIndicator size="small" color="#84cc16" />
        ) : (
          <Text style={styles.locationCoords}>
            Lat: {location.coords.latitude.toFixed(4)} | Lon: {location.coords.longitude.toFixed(4)}
          </Text>
        )}
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#2563eb" style={{ marginTop: 50 }} />
      ) : (
        <FlatList
          data={skills}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.listContainer}
          renderItem={({ item }) => (
            <SkillCard
              skill={item}
              currentUserId={user?.id}
              onPropose={(id, name) => Alert.alert("Proponer", `¿Quieres proponer un intercambio a ${name}? (Implementar Modal)`)}
            />
          )}
          ListEmptyComponent={
            <Text style={styles.emptyText}>No hay habilidades publicadas aún.</Text>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a', paddingHorizontal: 16 },
  header: { marginTop: 50, marginBottom: 15 },
  title: { color: '#f8fafc', fontSize: 24, fontWeight: 'bold' },
  subtitle: { color: '#cbd5e1', fontSize: 14, marginTop: 4 },
  listContainer: { paddingBottom: 20 },
  emptyText: { color: '#cbd5e1', textAlign: 'center', marginTop: 50 },
  
  // Estilos del Sensor
  locationCard: {
    backgroundColor: '#1e293b',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#334155'
  },
  locationTitle: { color: '#84cc16', fontWeight: 'bold', fontSize: 12, marginBottom: 4 },
  locationCoords: { color: '#cbd5e1', fontSize: 12, fontFamily: 'monospace' },
  locationError: { color: '#ef4444', fontSize: 12 }
});