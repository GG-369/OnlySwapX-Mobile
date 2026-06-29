import apiClient from './apiClient';
import type { SignUpRequest, SignInRequest, TokenResponse, RefreshTokenRequest } from '@/types';

export const authService = {
  signUp: (data: SignUpRequest) =>
    apiClient.post<TokenResponse>('/api/v1/auth/sign-up', data).then((r) => r.data),

  signIn: (data: SignInRequest) =>
    apiClient.post<TokenResponse>('/api/v1/auth/sign-in', data).then((r) => r.data),

  refresh: (data: RefreshTokenRequest) =>
    apiClient.post<TokenResponse>('/api/v1/auth/refresh', data).then((r) => r.data),
};
