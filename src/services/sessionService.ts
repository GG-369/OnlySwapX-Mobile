import apiClient from './apiClient';
import type { SessionCreateRequest, SessionUpdateRequest, SessionDetailResponse, SessionSummaryResponse } from '@/types';

export const sessionService = {
  create: (data: SessionCreateRequest) =>
    apiClient.post<SessionDetailResponse>('/api/v1/sessions', data).then((r) => r.data),

  getMySessions: () =>
    apiClient.get<SessionSummaryResponse[]>('/api/v1/sessions').then((r) => r.data),

  getById: (id: number) =>
    apiClient.get<SessionDetailResponse>(`/api/v1/sessions/${id}`).then((r) => r.data),

  update: (id: number, data: SessionUpdateRequest) =>
    apiClient.put<SessionDetailResponse>(`/api/v1/sessions/${id}`, data).then((r) => r.data),

  cancel: (id: number) =>
    apiClient.post<SessionDetailResponse>(`/api/v1/sessions/${id}/cancel`).then((r) => r.data),

  accept: (id: number) =>
    apiClient.post<SessionDetailResponse>(`/api/v1/sessions/${id}/accept`).then((r) => r.data),

  reject: (id: number) =>
    apiClient.post<SessionDetailResponse>(`/api/v1/sessions/${id}/reject`).then((r) => r.data),

  getSuggestedCredits: (skillId: number) =>
    apiClient.get<{ suggestedCredits: number }>('/api/v1/sessions/suggested-credits', { params: { skillId } })
      .then((r) => r.data.suggestedCredits),
};
