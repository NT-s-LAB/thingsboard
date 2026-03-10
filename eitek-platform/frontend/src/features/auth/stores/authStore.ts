import { create } from 'zustand';
import { devtools, persist, createJSONStorage } from 'zustand/middleware';
import { User, LoginRequest } from '@/shared/types';
import { authService } from '../services/authService';
import { apiClient } from '@/shared/services/api';

interface AuthState {
  user: User | null;
  token: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  permissions: string[];
}

interface AuthActions {
  login: (credentials: LoginRequest) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  updateUser: (user: Partial<User>) => void;
  clearError: () => void;
  hasPermission: (permission: string) => boolean;
  hasAnyPermission: (permissions: string[]) => boolean;
  hasAllPermissions: (permissions: string[]) => boolean;
  restoreTokens: () => void;
}

export const useAuthStore = create<AuthState & AuthActions>()(
  devtools(
    persist(
      (set, get) => ({
        // Initial State
        user: null,
        token: null,
        refreshToken: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
        permissions: [],

        // Restore tokens to apiClient on app load
        restoreTokens: () => {
          const { token, refreshToken } = get();
          if (token) {
            apiClient.setToken(token);
          }
          if (refreshToken) {
            apiClient.setRefreshToken(refreshToken);
          }
        },

        // Actions
        login: async (credentials) => {
          try {
            set({ isLoading: true, error: null });
            
            const response = await authService.login(credentials);
            
            // Extract permissions from user roles
            const permissions = response.user.userRoles?.flatMap(ur => ur.role.permissions) || [];
            
            set({
              user: response.user,
              token: response.token,
              refreshToken: response.refreshToken ?? null,
              isAuthenticated: true,
              permissions: permissions,
              isLoading: false,
            });
          } catch (error: any) {
            set({
              error: error.message,
              isLoading: false,
              isAuthenticated: false,
            });
            throw error;
          }
        },

        logout: async () => {
          try {
            await authService.logout();
          } finally {
            set({
              user: null,
              token: null,
              refreshToken: null,
              isAuthenticated: false,
              permissions: [],
              error: null,
            });
          }
        },

        refreshUser: async () => {
          try {
            const user = await authService.getProfile();
            set({ user });
          } catch (error) {
            // If refresh fails, logout
            get().logout();
          }
        },

        updateUser: (userData) => {
          set((state) => ({
            user: state.user ? { ...state.user, ...userData } : null,
          }));
        },

        clearError: () => set({ error: null }),

        // Permission helpers
        hasPermission: (permission) => {
          const { permissions } = get();
          return permissions.includes(permission);
        },

        hasAnyPermission: (requiredPermissions) => {
          const { permissions } = get();
          return requiredPermissions.some(p => permissions.includes(p));
        },

        hasAllPermissions: (requiredPermissions) => {
          const { permissions } = get();
          return requiredPermissions.every(p => permissions.includes(p));
        },
      }),
      {
        name: 'auth-store',
        storage: createJSONStorage(() => localStorage),
        partialize: (state) => ({
          user: state.user,
          token: state.token,
          refreshToken: state.refreshToken,
          isAuthenticated: state.isAuthenticated,
          permissions: state.permissions,
        }),
        onRehydrateStorage: () => (state) => {
          // Restore apiClient token from persisted auth state
          if (state?.token) {
            apiClient.setToken(state.token);
          }
          if (state?.refreshToken) {
            apiClient.setRefreshToken(state.refreshToken);
          }
        },
      }
    ),
    { name: 'auth-store' }
  )
);

// Initialize auth on app start
export async function initializeAuth() {
  const { token, refreshUser, logout } = useAuthStore.getState();
  
  if (token) {
    try {
      await refreshUser();
    } catch {
      await logout();
    }
  }
}