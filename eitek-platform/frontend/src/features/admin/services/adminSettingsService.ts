import { apiClient } from '@/shared/services/api';

// ── Types ────────────────────────────────────────────────────────────────────

export type SettingsCategory = 'general' | 'thingsboard' | 'email' | 'branding' | 'security';

export interface SystemSetting {
  id: string;
  key: string;
  value: any;
  category: string;
  label: string | null;
  description: string | null;
  isSecret: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface SettingItem {
  value: any;
  label: string | null;
  description: string | null;
  isSecret: boolean;
}

export interface GroupedSettings {
  general?: Record<string, SettingItem>;
  thingsboard?: Record<string, SettingItem>;
  email?: Record<string, SettingItem>;
  branding?: Record<string, SettingItem>;
  security?: Record<string, SettingItem>;
}

export interface UpdateSettingDto {
  value: any;
  label?: string;
  description?: string;
}

export interface UpdateCategorySettingsDto {
  settings: Record<string, any>;
}

export interface TestResult {
  success: boolean;
  message: string;
}

// ── Default Values for UI ────────────────────────────────────────────────────

export const DEFAULT_GENERAL_SETTINGS = {
  platformName: 'EITEK IoT Platform',
  platformUrl: 'https://iot.eitek.com',
  defaultTimezone: 'Asia/Ho_Chi_Minh',
  defaultLanguage: 'vi',
  sessionTimeout: 60,
  maxLoginAttempts: 5,
  maintenanceMode: false,
};

export const DEFAULT_THINGSBOARD_SETTINGS = {
  url: '',
  username: '',
  password: '',
  autoSync: true,
  syncInterval: 300,
};

export const DEFAULT_EMAIL_SETTINGS = {
  smtpHost: 'smtp.gmail.com',
  smtpPort: 587,
  smtpUsername: '',
  smtpPassword: '',
  smtpSecure: true,
  fromName: 'EITEK Platform',
  fromEmail: 'noreply@eitek.com',
};

export const DEFAULT_BRANDING_SETTINGS = {
  logoUrl: '',
  faviconUrl: '',
  primaryColor: '#1e3a5f',
  secondaryColor: '#3b82f6',
  footerText: '© 2024 EITEK Corporation',
};

export const DEFAULT_SECURITY_SETTINGS = {
  passwordMinLength: 8,
  passwordRequireUppercase: true,
  passwordRequireLowercase: true,
  passwordRequireNumber: true,
  passwordRequireSpecial: false,
  twoFactorEnabled: false,
  ipWhitelist: [],
};

// ── Service ──────────────────────────────────────────────────────────────────

class AdminSettingsService {
  private basePath = '/admin/settings';

  /**
   * Get all settings grouped by category
   */
  async getAll(): Promise<GroupedSettings> {
    return apiClient.get<GroupedSettings>(this.basePath);
  }

  /**
   * Get settings by category
   */
  async getByCategory(category: SettingsCategory): Promise<Record<string, any>> {
    return apiClient.get<Record<string, any>>(`${this.basePath}/category/${category}`);
  }

  /**
   * Get a single setting by key
   */
  async getByKey(key: string): Promise<SystemSetting | null> {
    return apiClient.get<SystemSetting | null>(`${this.basePath}/key/${key}`);
  }

  /**
   * Update a single setting
   */
  async updateSetting(key: string, dto: UpdateSettingDto): Promise<SystemSetting> {
    return apiClient.put<SystemSetting>(`${this.basePath}/key/${key}`, dto);
  }

  /**
   * Update multiple settings by category
   */
  async updateCategory(category: SettingsCategory, settings: Record<string, any>): Promise<Record<string, any>> {
    return apiClient.put<Record<string, any>>(`${this.basePath}/category/${category}`, {
      settings,
    });
  }

  /**
   * Test email configuration
   */
  async testEmail(): Promise<TestResult> {
    return apiClient.post<TestResult>(`${this.basePath}/test/email`);
  }

  /**
   * Test ThingsBoard connection
   */
  async testThingsBoard(): Promise<TestResult> {
    return apiClient.post<TestResult>(`${this.basePath}/test/thingsboard`);
  }

  /**
   * Reset all settings to defaults
   */
  async resetToDefaults(): Promise<{ message: string }> {
    return apiClient.post<{ message: string }>(`${this.basePath}/reset`);
  }

  /**
   * Helper to extract values from grouped settings
   */
  extractCategoryValues<T extends Record<string, any>>(
    grouped: GroupedSettings,
    category: SettingsCategory,
    defaults: T,
  ): T {
    const categorySettings = grouped[category];
    if (!categorySettings) return { ...defaults };

    const result: Record<string, any> = {};
    for (const [key, defaultValue] of Object.entries(defaults)) {
      const setting = categorySettings[key];
      result[key] = setting?.value ?? defaultValue;
    }
    return result as T;
  }
}

export const adminSettingsService = new AdminSettingsService();
export default adminSettingsService;
