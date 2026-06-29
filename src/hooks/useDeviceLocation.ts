import { useCallback, useEffect, useState } from 'react';
import * as Location from 'expo-location';
import { Coordinates } from '@/utils/location';

export function useDeviceLocation() {
  const [coordinates, setCoordinates] = useState<Coordinates | null>(null);
  const [label, setLabel] = useState('Ubicación no activada');
  const [permission, setPermission] = useState<'checking' | 'granted' | 'denied'>('checking');
  const [loading, setLoading] = useState(false);

  const requestLocation = useCallback(async () => {
    setLoading(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setPermission('denied');
        setLabel('Permiso de ubicación denegado');
        return;
      }

      setPermission('granted');
      const current = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      const next = {
        latitude: current.coords.latitude,
        longitude: current.coords.longitude,
      };
      setCoordinates(next);

      try {
        const [place] = await Location.reverseGeocodeAsync(next);
        const parts = [place?.name, place?.district, place?.city].filter(Boolean);
        setLabel(parts.length > 0 ? parts.join(', ') : 'Ubicación actual detectada');
      } catch {
        setLabel('Ubicación actual detectada');
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    requestLocation();
  }, [requestLocation]);

  return { coordinates, label, permission, loading, requestLocation };
}
