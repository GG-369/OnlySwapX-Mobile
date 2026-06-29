export interface Coordinates {
  latitude: number;
  longitude: number;
}

export const CAMPUS_COORDINATES: Record<string, Coordinates> = {
  UTEC: { latitude: -12.1359, longitude: -77.0226 },
  UNI: { latitude: -12.0238, longitude: -77.0487 },
  PUCP: { latitude: -12.0695, longitude: -77.0794 },
  UNMSM: { latitude: -12.0586, longitude: -77.0833 },
  UPC: { latitude: -12.1047, longitude: -76.9631 },
};

export const distanceInMeters = (from: Coordinates, to: Coordinates) => {
  const radius = 6371000;
  const lat1 = (from.latitude * Math.PI) / 180;
  const lat2 = (to.latitude * Math.PI) / 180;
  const deltaLat = ((to.latitude - from.latitude) * Math.PI) / 180;
  const deltaLon = ((to.longitude - from.longitude) * Math.PI) / 180;

  const a =
    Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(deltaLon / 2) * Math.sin(deltaLon / 2);

  return radius * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

export const campusFromUniversity = (university?: string) => {
  if (!university) return null;
  const normalized = university.toUpperCase();
  const key = Object.keys(CAMPUS_COORDINATES).find((campus) => normalized.includes(campus));
  return key ? { name: key, coordinates: CAMPUS_COORDINATES[key] } : null;
};
