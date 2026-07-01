import axios from 'axios';
import { router } from 'expo-router';
import { tokenStorage } from '@/utils/tokenStorage';

const apiClient = axios.create({
  baseURL: process.env.EXPO_PUBLIC_API_URL || 'http://YOUR_LOCAL_IP:8080',
  headers: { 'Content-Type': 'application/json' },
  timeout: 15000,
});

apiClient.interceptors.request.use(async (config) => {
  const token = await tokenStorage.getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && originalRequest && !originalRequest._retry) {
      originalRequest._retry = true;
      const refreshToken = await tokenStorage.getRefreshToken();

      if (refreshToken) {
        try {
          const { data } = await axios.post(
            `${apiClient.defaults.baseURL}/api/v1/auth/refresh`,
            { refreshToken }
          );
          await tokenStorage.setTokens(data.token, data.refreshToken);
          originalRequest.headers.Authorization = `Bearer ${data.token}`;
          return apiClient(originalRequest);
        } catch {
          await tokenStorage.clear();
          router.replace('/(auth)/sign-in');
        }
      } else {
        await tokenStorage.clear();
        router.replace('/(auth)/sign-in');
      }
    }

    return Promise.reject(error);
  }
);

export default apiClient;
