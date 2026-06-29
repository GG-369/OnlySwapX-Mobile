import apiClient from './apiClient';
import type { ReviewCreateRequest, ReviewDetailResponse, ReviewSummaryResponse, RoleRatingsResponse } from '@/types';

export const reviewService = {
  create: (data: ReviewCreateRequest) =>
    apiClient.post<ReviewDetailResponse>('/api/v1/reviews', data).then((r) => r.data),

  getByUser: (userId: number) =>
    apiClient.get<ReviewSummaryResponse[]>(`/api/v1/reviews/user/${userId}`).then((r) => r.data),

  getAverageRating: (userId: number) =>
    apiClient.get<{ averageRating: number }>(`/api/v1/reviews/user/${userId}/rating`).then((r) => r.data),

  getRoleRatings: (userId: number) =>
    apiClient.get<RoleRatingsResponse>(`/api/v1/reviews/user/${userId}/role-ratings`).then((r) => r.data),
};
