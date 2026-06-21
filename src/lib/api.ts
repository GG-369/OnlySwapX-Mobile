import axios, {
  AxiosError,
  AxiosResponse,
  InternalAxiosRequestConfig,
} from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { ApiError } from "../types"; // Asumo que copiaste tu carpeta types/ a src/types/

// ⚠️ Usamos tu IP Local, porque localhost apuntaría al propio celular
const BASE_URL = "http://10.44.196.227:8080";

// ─── Instancia de Axios ───────────────────────────────────────────────
const api = axios.create({
  baseURL: BASE_URL,
  timeout: 15_000,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});

// ─── Request interceptor ─────────────────────────────────────────
api.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    try {
      // Leemos el token nativo del celular
      const token = await AsyncStorage.getItem("osxToken");
      if (token && config.headers) {
        config.headers["Authorization"] = `Bearer ${token}`;
      }
    } catch (error) {
      console.error("Error leyendo token de AsyncStorage", error);
    }

    if (config.params) {
      const sanitized: Record<string, unknown> = {};
      for (const [k, v] of Object.entries(config.params)) {
        sanitized[k] =
          typeof v === "string" ? v.replace(/[\r\n]/g, "") : v;
      }
      config.params = sanitized;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ─── Response interceptor ────────────────────────────────────────
api.interceptors.response.use(
  (response: AxiosResponse) => response,
  (error: AxiosError<ApiError>) => {
    const message =
      error.response?.data?.message ??
      error.message ??
      "Error inesperado";
      
    return Promise.reject(new Error(message));
  }
);

export default api;

// ─── Endpoints ───────────────────────────────────────────────
export const authApi = {
  signIn: (data: any) => api.post("/api/v1/auth/sign-in", data),
  signUp: (data: any) => api.post("/api/v1/auth/sign-up", data),
};

export const userApi = {
  getMe: () => api.get("/api/v1/users/me"),
  getById: (id: number) => api.get(`/api/v1/users/${id}`),
  getAll: () => api.get("/api/v1/users"),
};

export const skillApi = {
  create: (data: object) => api.post("/api/v1/skills", data),
  getMine: () => api.get("/api/v1/skills/my"),
  getAll: () => api.get("/api/v1/skills"),
  delete: (id: number) => api.delete(`/api/v1/skills/${id}`),
};

export const exchangeApi = {
  create: (receiverId: number, message: string) =>
    api.post("/api/v1/exchanges", { receiverId, message }),
  getMine: () => api.get("/api/v1/exchanges"),
  accept: (id: number) => api.post(`/api/v1/exchanges/${id}/accept`),
  reject: (id: number) => api.post(`/api/v1/exchanges/${id}/reject`),
};

export const sessionApi = {
  create: (data: object) => api.post("/api/v1/sessions", data),
  getMine: () => api.get("/api/v1/sessions"),
  cancel: (id: number) => api.post(`/api/v1/sessions/${id}/cancel`),
  confirm: (id: number) =>
    api.post(`/api/v1/credits/sessions/${id}/confirm`),
};

export const messageApi = {
  send: (data: object) => api.post("/api/v1/messages", data),
  getByExchange: (exchangeId: number) =>
    api.get(`/api/v1/messages/exchange/${exchangeId}`),
};

export const reviewApi = {
  create: (data: object) => api.post("/api/v1/reviews", data),
  getByUser: (userId: number) => api.get(`/api/v1/reviews/user/${userId}`),
  getAvgRating: (userId: number) =>
    api.get(`/api/v1/reviews/user/${userId}/rating`),
};

export const creditApi = {
  getBalance: () => api.get("/api/v1/credits/balance"),
};