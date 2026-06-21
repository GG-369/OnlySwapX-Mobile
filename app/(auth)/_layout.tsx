import { Stack, Redirect } from 'expo-router';
import { useAuth } from '../../src/lib/auth-context';

export default function AuthLayout() {
  const { isAuthenticated, isLoading } = useAuth();
  if (isLoading) return null; // O un ActivityIndicator
  if (isAuthenticated) return <Redirect href="/(tabs)" />;
  return <Stack screenOptions={{ headerShown: false }} />;
}