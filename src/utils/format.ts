export const formatDate = (value?: string) => {
  if (!value) return 'No date';
  return new Intl.DateTimeFormat('en-US', {
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
    PENDING: 'Pending',
    ACCEPTED: 'Accepted',
    REJECTED: 'Rejected',
    ENDED: 'Ended',
    COMPLETED: 'Completed',
    PROPOSED: 'Proposed',
    SCHEDULED: 'Scheduled',
    CANCELLED: 'Cancelled',
  };
  return labels[status || ''] || status || 'No status';
};

// Category values are kept in Spanish to match the backend enum contract.
// This helper only controls what is displayed to the user.
export const categoryLabel = (category?: string) => {
  const labels: Record<string, string> = {
    TECNOLOGIA: 'Technology',
    CIENCIAS: 'Science',
    HUMANIDADES: 'Humanities',
    ARTE: 'Art',
    IDIOMAS: 'Languages',
    NEGOCIOS: 'Business',
    OTRO: 'Other',
  };
  return labels[category || ''] || category || 'Other';
};

export const levelLabel = (level?: string) => {
  const labels: Record<string, string> = {
    BEGINNER: 'Beginner',
    INTERMEDIATE: 'Intermediate',
    ADVANCED: 'Advanced',
  };
  return labels[(level || '').toUpperCase()] || 'Intermediate';
};

export const readableError = (error: unknown, fallback: string) => {
  const err = error as { response?: { data?: { message?: string }; status?: number } };
  if (err.response?.data?.message) return err.response.data.message;
  if (err.response?.status === 401) return 'Your session expired. Please sign in again.';
  if (err.response?.status === 403) return 'You do not have permission to perform this action.';
  if (err.response?.status === 404) return 'We could not find that information.';
  if (err.response?.status && err.response.status >= 500) return 'The server did not respond correctly.';
  return fallback;
};

export const formatDistance = (meters?: number | null) => {
  if (meters === null || meters === undefined) return 'Distance unavailable';
  if (meters < 1000) return `${Math.round(meters)} m`;
  return `${(meters / 1000).toFixed(1)} km`;
};
