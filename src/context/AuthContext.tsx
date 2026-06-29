import React, { ReactNode, createContext, useContext, useEffect, useState } from 'react';
import { useRouter } from 'expo-router';
import { authService } from '../services/authService';
import { userService } from '../services/userService';
import { SignInRequest, SignUpRequest, TokenResponse, UserDetailResponse } from '../types';
import { tokenStorage } from '../utils/tokenStorage';

interface AuthContextType {
  user: UserDetailResponse | null;
  isAuthenticated: boolean;
  loading: boolean;
  login: (data: SignInRequest) => Promise<TokenResponse>;
  register: (data: SignUpRequest) => Promise<TokenResponse>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserDetailResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const isAuthenticated = !!user;

  useEffect(() => {
    const loadSession = async () => {
      const token = await tokenStorage.getToken();
      if (token) {
        try {
          setUser(await userService.getMe());
        } catch {
          await tokenStorage.clear();
        }
      }
      setLoading(false);
    };

    loadSession();
  }, []);

  const login = async (data: SignInRequest) => {
    const response = await authService.signIn(data);
    await tokenStorage.setTokens(response.token, response.refreshToken);
    setUser(await userService.getMe());
    router.replace('/(tabs)');
    return response;
  };

  const register = async (data: SignUpRequest) => {
    const response = await authService.signUp(data);
    await tokenStorage.setTokens(response.token, response.refreshToken);
    setUser(await userService.getMe());
    router.replace('/(tabs)');
    return response;
  };

  const logout = async () => {
    await tokenStorage.clear();
    setUser(null);
    router.replace('/(auth)/sign-in');
  };

  const refreshUser = async () => {
    setUser(await userService.getMe());
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated, loading, login, register, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
