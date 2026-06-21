import { useEffect } from "react";
import { useRouter, useSegments } from "expo-router";
import { useAuth } from "../lib/auth-context";

export function useRequireAuth() {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const segments = useSegments();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      // Si no estamos en un grupo auth, redirigir
      if (segments[0] !== "(auth)") {
        router.replace("/(auth)/sign-in");
      }
    }
  }, [isAuthenticated, isLoading, router, segments]);

  return { isLoading, isAuthenticated };
}