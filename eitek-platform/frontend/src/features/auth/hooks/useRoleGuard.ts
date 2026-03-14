'use client';

import { useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '../stores/authStore';
import { useAuthGuard } from './useAuthGuard';

// Role hierarchy - higher index means higher privilege
export const ROLE_HIERARCHY = {
  VIEWER: 0,
  OPERATOR: 1,
  PROJECT_MANAGER: 2,
  TENANT_ADMIN: 3,
  SUPER_ADMIN: 4,
} as const;

export type UserRoleType = keyof typeof ROLE_HIERARCHY;

interface UseRoleGuardOptions {
  requiredRole: UserRoleType;
  redirectTo?: string;
}

/**
 * Hook to guard routes based on user role.
 * Uses role hierarchy - user with higher role can access lower role pages.
 * 
 * @param options - Required role and optional redirect path
 * @returns Object with access status and user info
 */
export function useRoleGuard(options: UseRoleGuardOptions) {
  const { requiredRole, redirectTo } = options;
  const router = useRouter();
  
  const { isReady, isAuthenticated } = useAuthGuard();
  const user = useAuthStore((state) => state.user);
  
  const userRole = user?.role as UserRoleType | undefined;
  
  const accessInfo = useMemo(() => {
    if (!isReady || !isAuthenticated || !userRole) {
      return {
        hasAccess: false,
        userRoleLevel: -1,
        requiredRoleLevel: ROLE_HIERARCHY[requiredRole],
      };
    }
    
    const userRoleLevel = ROLE_HIERARCHY[userRole] ?? -1;
    const requiredRoleLevel = ROLE_HIERARCHY[requiredRole];
    
    return {
      hasAccess: userRoleLevel >= requiredRoleLevel,
      userRoleLevel,
      requiredRoleLevel,
    };
  }, [isReady, isAuthenticated, userRole, requiredRole]);
  
  useEffect(() => {
    if (!isReady) return;
    
    // Not authenticated - let useAuthGuard handle redirect to login
    if (!isAuthenticated) return;
    
    // User doesn't have required role - redirect
    if (!accessInfo.hasAccess && redirectTo) {
      router.replace(redirectTo);
    }
  }, [isReady, isAuthenticated, accessInfo.hasAccess, redirectTo, router]);
  
  return {
    isReady,
    isAuthenticated,
    hasAccess: accessInfo.hasAccess,
    userRole,
    user,
  };
}

/**
 * Check if user is Super Admin
 */
export function useIsSuperAdmin() {
  const user = useAuthStore((state) => state.user);
  return user?.role === 'SUPER_ADMIN';
}

/**
 * Check if user is at least Tenant Admin
 */
export function useIsTenantAdmin() {
  const user = useAuthStore((state) => state.user);
  const role = user?.role as UserRoleType | undefined;
  if (!role) return false;
  return ROLE_HIERARCHY[role] >= ROLE_HIERARCHY.TENANT_ADMIN;
}

/**
 * Get redirect path based on user role
 */
export function getDefaultPathForRole(role: UserRoleType): string {
  switch (role) {
    case 'SUPER_ADMIN':
      return '/admin';
    case 'TENANT_ADMIN':
    case 'PROJECT_MANAGER':
    case 'OPERATOR':
    case 'VIEWER':
    default:
      return '/';
  }
}
