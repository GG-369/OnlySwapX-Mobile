import apiClient from './apiClient';
import type { MessageRequest, MessageResponse } from '@/types';

export const messageService = {
  send: (data: MessageRequest) =>
    apiClient.post<MessageResponse>('/api/v1/messages', data).then((r) => r.data),

  getByExchange: (exchangeId: number) =>
    apiClient.get<MessageResponse[]>(`/api/v1/messages/exchange/${exchangeId}`).then((r) => r.data),
};
