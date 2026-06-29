import apiClient from './apiClient';
import type { MatchSuggestedResponse } from '@/types';

export const matchService = {
  getSuggested: () =>
    apiClient.get<MatchSuggestedResponse[]>('/api/v1/matches/suggested').then((r) => r.data),

  backfill: () =>
    apiClient.post<{ message: string; skillsQueued: number }>('/api/v1/matches/backfill').then((r) => r.data),
};
