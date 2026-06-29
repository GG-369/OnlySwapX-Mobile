import apiClient from './apiClient';
import type { SkillCreateRequest, SkillUpdateRequest, SkillDetailResponse, SkillSummaryResponse, PageResponse, DiscoverBatchResponse } from '@/types';

export const skillService = {
  create: (data: SkillCreateRequest) =>
    apiClient.post<SkillDetailResponse>('/api/v1/skills', data).then((r) => r.data),

  getMySkills: () =>
    apiClient.get<SkillSummaryResponse[]>('/api/v1/skills/my').then((r) => r.data),

  getSkillsByUserId: (userId: number) =>
    apiClient.get<SkillSummaryResponse[]>(`/api/v1/skills/user/${userId}`).then((r) => r.data),

  getAll: (page = 0, size = 10, skillType?: string, category?: string) => {
    const params = new URLSearchParams({ page: String(page), size: String(size) });
    if (skillType) params.set('skillType', skillType);
    if (category) params.set('category', category);
    return apiClient.get<PageResponse<SkillDetailResponse>>(`/api/v1/skills?${params}`).then((r) => r.data);
  },

  search: (query: string, page = 0, size = 10, category?: string, excludeUserId?: number) => {
    const params = new URLSearchParams({ page: String(page), size: String(size) });
    if (query) params.set('search', query);
    if (category) params.set('category', category);
    if (excludeUserId) params.set('excludeUserId', String(excludeUserId));
    return apiClient.get<PageResponse<SkillDetailResponse>>(`/api/v1/skills?${params}`).then((r) => r.data);
  },

  getById: (id: number) =>
    apiClient.get<SkillDetailResponse>(`/api/v1/skills/${id}`).then((r) => r.data),

  update: (id: number, data: SkillUpdateRequest) =>
    apiClient.put<SkillDetailResponse>(`/api/v1/skills/${id}`, data).then((r) => r.data),

  delete: (id: number) =>
    apiClient.delete(`/api/v1/skills/${id}`).then((r) => r.data),

  getDiscoverBatch: (skillIds: number[]) =>
    apiClient.post<DiscoverBatchResponse>('/api/v1/skills/discover-batch', { skillIds }).then((r) => r.data),
};
