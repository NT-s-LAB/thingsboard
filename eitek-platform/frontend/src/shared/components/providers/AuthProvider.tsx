'use client';

import * as React from 'react';
import { useEffect } from 'react';
import { useAuthStore } from '@/features/auth/stores/authStore';

interface AuthProviderProps {
  children: React.ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const restoreTokens = useAuthStore((s) => s.restoreTokens);

  // Restore tokens to apiClient when app loads
  useEffect(() => {
    restoreTokens();
  }, [restoreTokens]);

  return <>{children}</>;
}