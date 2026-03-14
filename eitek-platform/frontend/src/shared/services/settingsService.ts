/**
 * Settings Service - API client for user settings management
 */

import { apiClient } from '@/shared/services/api';

// ── Types ────────────────────────────────────────────────────────────────────

export interface UserProfile {
  id: string;
  email: string;
  username?: string;
  firstName: string;
  lastName: string;
  avatar?: string;
  phone?: string;
  description?: string;
  role: string;
  isActive: boolean;
  lastLogin?: string;
  createdAt: string;
  tenant: { id: string; name: string };
  userRoles?: { role: { id: string; name: string; permissions: string[] } }[];
}

export interface UserSettings {
  id: string;
  userId: string;
  // Appearance
  theme: 'light' | 'dark' | 'auto';
  language: string;
  timezone: string;
  dateFormat: string;
  compactMode: boolean;
  showGridLines: boolean;
  // Notifications
  emailNotifications: boolean;
  deviceAlerts: boolean;
  systemUpdates: boolean;
  projectActivity: boolean;
  weeklyReports: boolean;
  // Advanced
  defaultProjectId?: string;
  dashboardLayout?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface AllSettings {
  profile: UserProfile;
  settings: UserSettings;
}

export interface UpdateProfileDto {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  description?: string;
}

export interface ChangePasswordDto {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export interface UpdateUserSettingsDto {
  theme?: 'light' | 'dark' | 'auto';
  language?: string;
  timezone?: string;
  dateFormat?: string;
  compactMode?: boolean;
  showGridLines?: boolean;
  emailNotifications?: boolean;
  deviceAlerts?: boolean;
  systemUpdates?: boolean;
  projectActivity?: boolean;
  weeklyReports?: boolean;
  defaultProjectId?: string;
}

// ── Service ──────────────────────────────────────────────────────────────────

class SettingsService {
  private basePath = '/settings';

  /**
   * Get all settings (profile + preferences)
   */
  async getAll(): Promise<AllSettings> {
    return apiClient.get(this.basePath);
  }

  // ── Profile ────────────────────────────────────────────────────

  /**
   * Get current user profile
   */
  async getProfile(): Promise<UserProfile> {
    return apiClient.get(`${this.basePath}/profile`);
  }

  /**
   * Update current user profile
   */
  async updateProfile(data: UpdateProfileDto): Promise<UserProfile> {
    return apiClient.put(`${this.basePath}/profile`, data);
  }

  /**
   * Upload avatar
   */
  async uploadAvatar(file: File): Promise<{ id: string; avatar: string }> {
    const formData = new FormData();
    formData.append('file', file);
    return apiClient.postFormData(`${this.basePath}/profile/avatar`, formData);
  }

  // ── Password ───────────────────────────────────────────────────

  /**
   * Change password
   */
  async changePassword(data: ChangePasswordDto): Promise<{ message: string }> {
    return apiClient.post(`${this.basePath}/password`, data);
  }

  // ── Preferences ────────────────────────────────────────────────

  /**
   * Get user preferences
   */
  async getPreferences(): Promise<UserSettings> {
    return apiClient.get(`${this.basePath}/preferences`);
  }

  /**
   * Update user preferences
   */
  async updatePreferences(data: UpdateUserSettingsDto): Promise<UserSettings> {
    return apiClient.put(`${this.basePath}/preferences`, data);
  }
}

export const settingsService = new SettingsService();
