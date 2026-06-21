import { useEffect } from "react";
import api from "../lib/api";
import AsyncStorage from "@react-native-async-storage/async-storage";

export function useTokenInjector() {
  useEffect(() => {
    const interceptorId = api.interceptors.request.use(async (config) => {
      const token = await AsyncStorage.getItem("osxToken");
      if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    });

    return () => api.interceptors.request.eject(interceptorId);
  }, []);
}