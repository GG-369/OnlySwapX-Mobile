export const formatDate = (value?: string) => {
  if (!value) return 'Sin fecha';
  return new Intl.DateTimeFormat('es-PE', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value));
};

export const initialsOf = (name?: string) => {
  if (!name) return 'OS';
  return name
    .split(' ')
    .filter(Boolean)
    .map((part) => part[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
};

export const statusLabel = (status?: string) => {
  const labels: Record<string, string> = {
    PENDING: 'Pendiente',
    ACCEPTED: 'Aceptado',
    REJECTED: 'Rechazado',
    ENDED: 'Finalizado',
    COMPLETED: 'Completado',
    PROPOSED: 'Propuesta',
    SCHEDULED: 'Programada',
    CANCELLED: 'Cancelada',
  };
  return labels[status || ''] || status || 'Sin estado';
};

export const readableError = (error: unknown, fallback: string) => {
  const err = error as { response?: { data?: { message?: string }; status?: number } };
  if (err.response?.data?.message) return err.response.data.message;
  if (err.response?.status === 401) return 'Tu sesión expiró. Inicia sesión nuevamente.';
  if (err.response?.status === 403) return 'No tienes permiso para realizar esta acción.';
  if (err.response?.status === 404) return 'No encontramos esa información.';
  if (err.response?.status && err.response.status >= 500) return 'El servidor no respondió correctamente.';
  return fallback;
};

export const formatDistance = (meters?: number | null) => {
  if (meters === null || meters === undefined) return 'Distancia no disponible';
  if (meters < 1000) return `${Math.round(meters)} m`;
  return `${(meters / 1000).toFixed(1)} km`;
};
