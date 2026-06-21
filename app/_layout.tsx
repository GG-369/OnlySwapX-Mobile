import { Slot } from 'expo-router';
import { AuthProvider } from '../src/lib/auth-context';

export default function RootLayout() {
  return (
    <AuthProvider>
      <Slot />
    </AuthProvider>
  );
}