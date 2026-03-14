import { IsString, IsOptional, IsBoolean, IsObject, IsEnum } from 'class-validator';

export enum SettingsCategory {
  GENERAL = 'general',
  THINGSBOARD = 'thingsboard',
  EMAIL = 'email',
  BRANDING = 'branding',
  SECURITY = 'security',
}

export class CreateSettingDto {
  @IsString()
  key: string;

  @IsObject()
  value: any;

  @IsEnum(SettingsCategory)
  category: SettingsCategory;

  @IsOptional()
  @IsString()
  label?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsBoolean()
  isSecret?: boolean;
}

export class UpdateSettingDto {
  @IsObject()
  value: any;

  @IsOptional()
  @IsString()
  label?: string;

  @IsOptional()
  @IsString()
  description?: string;
}

export class UpdateSettingsByCategoryDto {
  @IsObject()
  settings: Record<string, any>;
}

// Response types
export interface SystemSettingResponse {
  id: string;
  key: string;
  value: any;
  category: string;
  label: string | null;
  description: string | null;
  isSecret: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface SettingsByCategoryResponse {
  [key: string]: any;
}

// Default system settings
export const DEFAULT_SYSTEM_SETTINGS = {
  general: {
    platformName: { value: 'EITEK IoT Platform', label: 'Platform Name' },
    platformUrl: { value: 'https://iot.eitek.com', label: 'Platform URL' },
    defaultTimezone: { value: 'Asia/Ho_Chi_Minh', label: 'Default Timezone' },
    defaultLanguage: { value: 'vi', label: 'Default Language' },
    sessionTimeout: { value: 60, label: 'Session Timeout (minutes)' },
    maxLoginAttempts: { value: 5, label: 'Max Login Attempts' },
    maintenanceMode: { value: false, label: 'Maintenance Mode' },
  },
  thingsboard: {
    url: { value: '', label: 'ThingsBoard URL', isSecret: false },
    username: { value: '', label: 'System Admin Username', isSecret: false },
    password: { value: '', label: 'System Admin Password', isSecret: true },
    autoSync: { value: true, label: 'Enable Auto Sync' },
    syncInterval: { value: 300, label: 'Sync Interval (seconds)' },
  },
  email: {
    smtpHost: { value: 'smtp.gmail.com', label: 'SMTP Host' },
    smtpPort: { value: 587, label: 'SMTP Port' },
    smtpUsername: { value: '', label: 'SMTP Username' },
    smtpPassword: { value: '', label: 'SMTP Password', isSecret: true },
    smtpSecure: { value: true, label: 'Use TLS/SSL' },
    fromName: { value: 'EITEK Platform', label: 'From Name' },
    fromEmail: { value: 'noreply@eitek.com', label: 'From Email' },
  },
  branding: {
    logoUrl: { value: '', label: 'Logo URL' },
    faviconUrl: { value: '', label: 'Favicon URL' },
    primaryColor: { value: '#1e3a5f', label: 'Primary Color' },
    secondaryColor: { value: '#3b82f6', label: 'Secondary Color' },
    footerText: { value: '© 2024 EITEK Corporation', label: 'Footer Text' },
  },
  security: {
    passwordMinLength: { value: 8, label: 'Minimum Password Length' },
    passwordRequireUppercase: { value: true, label: 'Require Uppercase Letter' },
    passwordRequireLowercase: { value: true, label: 'Require Lowercase Letter' },
    passwordRequireNumber: { value: true, label: 'Require Number' },
    passwordRequireSpecial: { value: false, label: 'Require Special Character' },
    twoFactorEnabled: { value: false, label: 'Enable 2FA' },
    ipWhitelist: { value: [], label: 'IP Whitelist' },
  },
};
