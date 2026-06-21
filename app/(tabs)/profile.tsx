import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { useAuth } from '../../src/lib/auth-context';
import { Camera, MapPin, Briefcase, Mail, Zap, BookOpen } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Avatar } from '../../src/components/ui/Avatar';

export default function ProfileScreen() {
  const { user } = useAuth();
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [isLoadingImage, setIsLoadingImage] = useState(true);

  // 1. Cargar la imagen guardada al iniciar
  useEffect(() => {
    const loadSavedImage = async () => {
      try {
        const savedUri = await AsyncStorage.getItem(`profile_image_${user?.id}`);
        if (savedUri) {
          setProfileImage(savedUri);
        }
      } catch (error) {
        console.error("Error al cargar la imagen:", error);
      } finally {
        setIsLoadingImage(false);
      }
    };
    loadSavedImage();
  }, [user?.id]);

  // 2. Función del Sensor: Abrir galería/cámara
  const pickImage = async () => {
    // Pedir permisos
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (status !== 'granted') {
      Alert.alert('Permiso denegado', 'Necesitamos acceso a tu galería para cambiar tu foto.');
      return;
    }

    try {
      let result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images, // Antes era MediaTypeOptions.Images
        allowsEditing: true,
        aspect: [1, 1], // Cuadrado perfecto
        quality: 0.8, // Buena calidad, tamaño decente
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const newImageUri = result.assets[0].uri;
        setProfileImage(newImageUri);
        // Guardar localmente
        await AsyncStorage.setItem(`profile_image_${user?.id}`, newImageUri);
        Alert.alert("¡Éxito!", "Foto de perfil actualizada.");
      }
    } catch (error) {
      Alert.alert("Error", "No se pudo seleccionar la imagen.");
    }
  };

  if (!user) return null;

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      
      {/* HEADER & FOTO DE PERFIL */}
      <View style={styles.headerContainer}>
        <View style={styles.imageWrapper}>
          {isLoadingImage ? (
            <View style={[styles.avatarFallback, styles.loadingWrapper]}>
              <ActivityIndicator color="#2563eb" />
            </View>
          ) : profileImage ? (
            <Image source={{ uri: profileImage }} style={styles.profileImage} />
          ) : (
             // Usamos tu componente Avatar si no hay foto
            <Avatar name={user.fullName} size="xl" style={styles.avatarFallback} />
          )}
          
          {/* Botón Flotante para usar el Sensor (Cámara/Galería) */}
          <TouchableOpacity style={styles.cameraButton} onPress={pickImage}>
            <Camera size={16} color="#fff" />
          </TouchableOpacity>
        </View>

        <Text style={styles.nameText}>{user.fullName}</Text>
        <Text style={styles.roleText}>{user.role || "Estudiante"}</Text>
      </View>

      {/* TARJETA DE ESTADÍSTICAS */}
      <View style={styles.statsCard}>
        <View style={styles.statItem}>
          <Zap size={20} color="#84cc16" />
          <Text style={styles.statValue}>{user.creditsBalance ?? 0}</Text>
          <Text style={styles.statLabel}>Créditos</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <BookOpen size={20} color="#2563eb" />
          <Text style={styles.statValue}>--</Text>
          <Text style={styles.statLabel}>Sesiones</Text>
        </View>
      </View>

      {/* INFORMACIÓN PERSONAL */}
      <Text style={styles.sectionTitle}>Información Personal</Text>
      <View style={styles.infoCard}>
        <View style={styles.infoRow}>
          <Mail size={18} color="#94a3b8" />
          <View style={styles.infoTextContainer}>
            <Text style={styles.infoLabel}>Correo Académico</Text>
            <Text style={styles.infoValue}>{user.email}</Text>
          </View>
        </View>

        {user.university && (
          <View style={styles.infoRow}>
            <MapPin size={18} color="#94a3b8" />
            <View style={styles.infoTextContainer}>
              <Text style={styles.infoLabel}>Universidad</Text>
              <Text style={styles.infoValue}>{user.university}</Text>
            </View>
          </View>
        )}

        {user.career && (
          <View style={styles.infoRow}>
            <Briefcase size={18} color="#94a3b8" />
            <View style={styles.infoTextContainer}>
              <Text style={styles.infoLabel}>Carrera</Text>
              <Text style={styles.infoValue}>{user.career}</Text>
            </View>
          </View>
        )}
      </View>

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a' },
  headerContainer: { alignItems: 'center', paddingTop: 60, paddingBottom: 20 },
  
  // Estilos de Imagen
  imageWrapper: { position: 'relative', marginBottom: 15 },
  profileImage: { width: 100, height: 100, borderRadius: 50, borderWidth: 3, borderColor: '#1e293b' },
  avatarFallback: { width: 100, height: 100, borderRadius: 50, borderWidth: 3, borderColor: '#1e293b' },
  loadingWrapper: { backgroundColor: '#1e293b', justifyContent: 'center', alignItems: 'center' },
  
  cameraButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#2563eb',
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#0f172a',
  },

  // Estilos de Texto del Header
  nameText: { color: '#f8fafc', fontSize: 22, fontWeight: 'bold' },
  roleText: { color: '#3b82f6', fontSize: 14, fontWeight: '600', marginTop: 4, textTransform: 'uppercase' },

  // Stats Card
  statsCard: {
    flexDirection: 'row',
    backgroundColor: '#1e293b',
    marginHorizontal: 20,
    borderRadius: 16,
    paddingVertical: 20,
    marginBottom: 25,
    borderWidth: 1,
    borderColor: '#334155'
  },
  statItem: { flex: 1, alignItems: 'center', gap: 6 },
  statDivider: { width: 1, backgroundColor: '#334155' },
  statValue: { color: '#f8fafc', fontSize: 20, fontWeight: 'bold' },
  statLabel: { color: '#94a3b8', fontSize: 12 },

  // Info Card
  sectionTitle: { color: '#f8fafc', fontSize: 18, fontWeight: 'bold', marginHorizontal: 20, marginBottom: 10 },
  infoCard: {
    backgroundColor: '#1e293b',
    marginHorizontal: 20,
    borderRadius: 16,
    padding: 15,
    borderWidth: 1,
    borderColor: '#334155',
    marginBottom: 40
  },
  infoRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: 'rgba(51, 65, 85, 0.5)' },
  infoTextContainer: { marginLeft: 15 },
  infoLabel: { color: '#94a3b8', fontSize: 11, marginBottom: 2, textTransform: 'uppercase' },
  infoValue: { color: '#f8fafc', fontSize: 14, fontWeight: '500' }
});