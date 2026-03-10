'use client';

import { useEffect, useState, useSyncExternalStore } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '../stores/authStore';

interface UseAuthGuardOptions {
  redirectTo?: string;
}

// Helper to get hydration state from persist API
const getHydrationState = (): boolean => {
  try {
    const persist = (useAuthStore as any).persist;
    return persist?.hasHydrated?.() ?? false;
  } catch {
    return false;
  }
};

// Subscribe to hydration changes
const subscribeHydration = (callback: () => void): (() => void) => {
  try {
    const persist = (useAuthStore as any).persist;
    if (persist?.onFinishHydration) {
      return persist.onFinishHydration(callback);
    }
  } catch {}
  
  // Fallback: trigger callback immediately since hydration is likely done
  callback();
  return () => {};
};

/**
 * Hook to guard routes that require authentication.
 * Waits for Zustand persist hydration to complete before checking auth state.
 * 
 * @returns Object with `isReady` (hydration complete) and `isAuthenticated` state
 */
export function useAuthGuard(options: UseAuthGuardOptions = {}) {
  const { redirectTo = '/login' } = options;
  const router = useRouter();
  
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const token = useAuthStore((state) => state.token);
  
  // Track hydration using useSyncExternalStore for SSR safety
  const hasHydrated = useSyncExternalStore(
    subscribeHydration,
    getHydrationState,
    () => false // Server-side always returns false
  );
  
  // Fallback: if persist API doesn't work, use effect-based detection
  const [fallbackHydrated, setFallbackHydrated] = useState(false);
  
  useEffect(() => {
    // On client mount, persist should have hydrated synchronously from localStorage
    // Just in case the persist API is not available, mark as hydrated after mount
    setFallbackHydrated(true);
  }, []);
  
  const isHydrated = hasHydrated || fallbackHydrated;
  
  useEffect(() => {
    // Wait for hydration to complete before checking auth
    if (!isHydrated) {
      return;
    }
    
    // If not authenticated after hydration, redirect to login
    if (!isAuthenticated || !token) {
      router.replace(redirectTo);
    }
  }, [isHydrated, isAuthenticated, token, router, redirectTo]);
  
  return {
    isReady: isHydrated,
    isAuthenticated: isHydrated && isAuthenticated && !!token,
  };
}
