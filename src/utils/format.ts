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

export const readableError = (error: unknown, fallback: string) => {
  const err = error as { response?: { data?: { message?: string }; status?: number } };
  if (err.response?.data?.message) return err.response.data.message;
  if (err.response?.status === 401) return 'Your session expired. Sign in again.';
  if (err.response?.status === 403) return "You don't have permission to perform this action.";
  if (err.response?.status === 404) return "We couldn't find that information.";
  if (err.response?.status && err.response.status >= 500) return 'The server did not respond correctly.';
  return fallback;
};

export const formatDistance = (meters?: number | null) => {
  if (meters === null || meters === undefined) return 'Distance not available';
  if (meters < 1000) return `${Math.round(meters)} m`;
  return `${(meters / 1000).toFixed(1)} km`;
};
