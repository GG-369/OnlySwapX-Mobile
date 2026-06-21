import React, { createContext, useCallback, useContext, useEffect, useState, useMemo } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { AuthUser, TokenResponse } from "../types";
import { authApi, userApi } from "./api";
import { useRouter } from "expo-router";

const SESSION_KEY = "@osx_session";
const TOKEN_KEY = "osxToken";

interface AuthContextType {
  user: AuthUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (data: any) => Promise<void>;
  signOut: () => Promise<void>;
  refreshUser: () => Promise<void>;
  updateCredits: (newBalance: number) => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  // ─── Restore session on mount ─────────────────────────────────
  useEffect(() => {
    const loadSession = async () => {
      try {
        const storedSession = await AsyncStorage.getItem(SESSION_KEY);
        if (storedSession) {
          setUser(JSON.parse(storedSession));
        }
      } catch (e) {
        await AsyncStorage.removeItem(SESSION_KEY);
      } finally {
        setIsLoading(false);
      }
    };
    loadSession();
  }, []);

  // ─── Save Session Helper ──────────────────────────────────────
  const saveSession = async (tokenData: TokenResponse) => {
    // 1. Guardar el token de inmediato para que las siguientes peticiones de Axios funcionen
    await AsyncStorage.setItem(TOKEN_KEY, tokenData.token);

    try {
      // 2. Traer el perfil COMPLETO del usuario usando la API (ya incluye id, university, etc.)
      const res = await userApi.getMe();
      
      // Asegurarnos de castearlo a AuthUser para TypeScript
      const sessionData: AuthUser = {
        id: res.data.id,
        email: res.data.email,
        fullName: res.data.fullName,
        role: res.data.role,
        creditsBalance: res.data.creditsBalance,
        university: res.data.university, // Ahora sí los tenemos
        career: res.data.career
      };

      // 3. Guardar el objeto completo en AsyncStorage y en Estado
      await AsyncStorage.setItem(SESSION_KEY, JSON.stringify(sessionData));
      setUser(sessionData);
      
    } catch (error) {
      console.error("Error al obtener los datos del usuario después del login", error);
      // Si falla obtener el perfil, deslogueamos por seguridad
      await signOut();
      throw error; 
    }
  };

  // ─── Sign in ──────────────────────────────────────────────────
  const signIn = useCallback(async (email: string, password: string) => {
    const res = await authApi.signIn({ email, password });
    await saveSession(res.data);
    router.replace("/(tabs)");
  }, [router]);

  // ─── Sign up ──────────────────────────────────────────────────
  const signUp = useCallback(async (data: any) => {
    const res = await authApi.signUp(data);
    await saveSession(res.data);
    router.replace("/(tabs)");
  }, [router]);

  // ─── Sign out ─────────────────────────────────────────────────
  const signOut = useCallback(async () => {
    await AsyncStorage.removeItem(TOKEN_KEY);
    await AsyncStorage.removeItem(SESSION_KEY);
    setUser(null);
    router.replace("/(auth)/sign-in");
  }, [router]);

  // ─── Refresh user from backend ────────────────────────────────
  const refreshUser = useCallback(async () => {
    try {
      const res = await userApi.getMe();
      const updated: AuthUser = { 
        id: res.data.id,
        email: res.data.email,
        fullName: res.data.fullName,
        role: res.data.role,
        creditsBalance: res.data.creditsBalance,
        university: res.data.university,
        career: res.data.career
       };
      setUser(updated);
      await AsyncStorage.setItem(SESSION_KEY, JSON.stringify(updated));
    } catch {
      await signOut();
    }
  }, [signOut]);

  const updateCredits = useCallback((newBalance: number) => {
    setUser((prev) => (prev ? { ...prev, creditsBalance: newBalance } : prev));
  }, []);

  const value = useMemo(() => ({
    user,
    isLoading,
    isAuthenticated: !!user,
    signIn,
    signUp,
    signOut,
    refreshUser,
    updateCredits,
  }), [user, isLoading, signIn, signUp, signOut, refreshUser, updateCredits]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}