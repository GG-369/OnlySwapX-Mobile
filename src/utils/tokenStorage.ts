import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';

const TOKEN_KEY = 'token';
const REFRESH_TOKEN_KEY = 'refreshToken';

const write = async (key: string, value: string) => {
  try {
    await SecureStore.setItemAsync(key, value);
  } catch {
    await AsyncStorage.setItem(key, value);
  }
};

const read = async (key: string) => {
  try {
    const value = await SecureStore.getItemAsync(key);
    if (value) return value;
  } catch {}
  return AsyncStorage.getItem(key);
};

const remove = async (key: string) => {
  try {
    await SecureStore.deleteItemAsync(key);
  } catch {}
  await AsyncStorage.removeItem(key);
};

export const tokenStorage = {
  getToken: () => read(TOKEN_KEY),
  getRefreshToken: () => read(REFRESH_TOKEN_KEY),
  setTokens: async (token: string, refreshToken: string) => {
    await Promise.all([
      write(TOKEN_KEY, token),
      write(REFRESH_TOKEN_KEY, refreshToken),
    ]);
  },
  clear: async () => {
    await Promise.all([
      remove(TOKEN_KEY),
      remove(REFRESH_TOKEN_KEY),
    ]);
  },
};
