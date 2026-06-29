import { useCallback, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';

const keyFor = (userId?: number) => `profile-photo:${userId || 'anonymous'}`;

export function useProfilePhoto(userId?: number, remoteUrl?: string) {
  const [photoUri, setPhotoUri] = useState<string | undefined>(remoteUrl);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const load = async () => {
      const stored = await AsyncStorage.getItem(keyFor(userId));
      setPhotoUri(stored || remoteUrl);
    };
    load();
  }, [remoteUrl, userId]);

  const persist = useCallback(async (uri: string) => {
    setPhotoUri(uri);
    await AsyncStorage.setItem(keyFor(userId), uri);
  }, [userId]);

  const pickFromGallery = useCallback(async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      throw new Error('Permite acceso a tu galería para elegir una foto.');
    }

    setLoading(true);
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.85,
      });

      if (!result.canceled) {
        await persist(result.assets[0].uri);
      }
    } finally {
      setLoading(false);
    }
  }, [persist]);

  const takePhoto = useCallback(async () => {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      throw new Error('Permite acceso a la cámara para tomar una foto.');
    }

    setLoading(true);
    try {
      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.85,
      });

      if (!result.canceled) {
        await persist(result.assets[0].uri);
      }
    } finally {
      setLoading(false);
    }
  }, [persist]);

  return { photoUri, loading, pickFromGallery, takePhoto };
}
