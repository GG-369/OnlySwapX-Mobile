import apiClient from './apiClient';
import type { ExchangeCreateRequest, ExchangeDetailResponse, ExchangeSummaryResponse } from '@/types';

interface ExchangeCheckResult {
  exists: boolean;
  reason?: 'self' | 'active' | 'cooldown';
  status?: string;
}

export const exchangeService = {
  create: (data: ExchangeCreateRequest) =>
    apiClient.post<ExchangeDetailResponse>('/api/v1/exchanges', data).then((r) => r.data),

  getMyExchanges: () =>
    apiClient.get<ExchangeSummaryResponse[]>('/api/v1/exchanges').then((r) => r.data),

  getById: (id: number) =>
    apiClient.get<ExchangeDetailResponse>(`/api/v1/exchanges/${id}`).then((r) => r.data),

  accept: (id: number) =>
    apiClient.post<ExchangeDetailResponse>(`/api/v1/exchanges/${id}/accept`).then((r) => r.data),

  reject: (id: number) =>
    apiClient.post<ExchangeDetailResponse>(`/api/v1/exchanges/${id}/reject`).then((r) => r.data),

  end: (id: number) =>
    apiClient.post<ExchangeDetailResponse>(`/api/v1/exchanges/${id}/end`).then((r) => r.data),

  checkExisting: (receiverId: number, skillId: number) =>
    apiClient.get<ExchangeCheckResult>('/api/v1/exchanges/check', { params: { receiverId, skillId } }).then((r) => r.data),
};
