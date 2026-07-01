import apiClient from './apiClient';
import type { UserDetailResponse } from '@/types';

export const userService = {
  getMe: () =>
    apiClient.get<UserDetailResponse>('/api/v1/users/me').then((r) => r.data),

  getUserById: (id: number) =>
    apiClient.get<UserDetailResponse>(`/api/v1/users/${id}`).then((r) => r.data),
};
