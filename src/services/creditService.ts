import apiClient from './apiClient';
import type { CreditBalanceResponse, CreditTransactionResponse } from '@/types';

export const creditService = {
  getBalance: () =>
    apiClient.get<CreditBalanceResponse>('/api/v1/credits/balance').then((r) => r.data),

  getHistory: () =>
    apiClient.get<CreditTransactionResponse[]>('/api/v1/credits/history').then((r) => r.data),

  confirmSession: (sessionId: number) =>
    apiClient.post(`/api/v1/credits/sessions/${sessionId}/confirm`).then((r) => r.data),
};
