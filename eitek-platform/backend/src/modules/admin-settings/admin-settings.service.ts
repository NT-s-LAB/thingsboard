import { Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import {
  CreateSettingDto,
  UpdateSettingDto,
  UpdateSettingsByCategoryDto,
  SettingsCategory,
  SystemSettingResponse,
  DEFAULT_SYSTEM_SETTINGS,
} from './dto/system-settings.dto';

@Injectable()
export class AdminSettingsService implements OnModuleInit {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Initialize default settings on module startup
   */
  async onModuleInit() {
    await this.initializeDefaultSettings();
  }

  /**
   * Initialize default system settings if they don't exist
   */
  async initializeDefaultSettings(): Promise<void> {
    for (const [category, settings] of Object.entries(DEFAULT_SYSTEM_SETTINGS)) {
      for (const [key, config] of Object.entries(settings)) {
        const fullKey = `${category}.${key}`;
        const existing = await this.prisma.systemSettings.findUnique({
          where: { key: fullKey },
        });

        if (!existing) {
          await this.prisma.systemSettings.create({
            data: {
              key: fullKey,
              value: config.value,
              category,
              label: config.label,
              isSecret: (config as any).isSecret || false,
            },
          });
        }
      }
    }
  }

  /**
   * Get all settings
   */
  async getAllSettings(): Promise<SystemSettingResponse[]> {
    const settings = await this.prisma.systemSettings.findMany({
      orderBy: [{ category: 'asc' }, { key: 'asc' }],
    });

    return settings.map((s) => this.maskSecretValue(s));
  }

  /**
   * Get settings by category
   */
  async getSettingsByCategory(category: SettingsCategory): Promise<Record<string, any>> {
    const settings = await this.prisma.systemSettings.findMany({
      where: { category },
      orderBy: { key: 'asc' },
    });

    const result: Record<string, any> = {};
    for (const setting of settings) {
      // Extract the key name without category prefix
      const keyName = setting.key.replace(`${category}.`, '');
      result[keyName] = setting.isSecret ? '********' : setting.value;
    }

    return result;
  }

  /**
   * Get a single setting by key
   */
  async getSettingByKey(key: string): Promise<SystemSettingResponse | null> {
    const setting = await this.prisma.systemSettings.findUnique({
      where: { key },
    });

    if (!setting) return null;
    return this.maskSecretValue(setting);
  }

  /**
   * Get raw setting value (without masking, for internal use)
   */
  async getSettingValue<T = any>(key: string): Promise<T | null> {
    const setting = await this.prisma.systemSettings.findUnique({
      where: { key },
    });

    return setting?.value as T | null;
  }

  /**
   * Create a new setting
   */
  async createSetting(dto: CreateSettingDto): Promise<SystemSettingResponse> {
    const setting = await this.prisma.systemSettings.create({
      data: {
        key: dto.key,
        value: dto.value,
        category: dto.category,
        label: dto.label,
        description: dto.description,
        isSecret: dto.isSecret || false,
      },
    });

    return this.maskSecretValue(setting);
  }

  /**
   * Update a setting by key
   */
  async updateSetting(key: string, dto: UpdateSettingDto): Promise<SystemSettingResponse> {
    const setting = await this.prisma.systemSettings.update({
      where: { key },
      data: {
        value: dto.value,
        label: dto.label,
        description: dto.description,
      },
    });

    return this.maskSecretValue(setting);
  }

  /**
   * Update multiple settings by category
   */
  async updateSettingsByCategory(
    category: SettingsCategory,
    dto: UpdateSettingsByCategoryDto,
  ): Promise<Record<string, any>> {
    const updates: Promise<any>[] = [];

    for (const [keyName, value] of Object.entries(dto.settings)) {
      const fullKey = `${category}.${keyName}`;
      
      // Check if setting exists
      const existing = await this.prisma.systemSettings.findUnique({
        where: { key: fullKey },
      });

      if (existing) {
        // Update existing
        updates.push(
          this.prisma.systemSettings.update({
            where: { key: fullKey },
            data: { value },
          }),
        );
      } else {
        // Create new
        const defaultConfig = DEFAULT_SYSTEM_SETTINGS[category]?.[keyName];
        updates.push(
          this.prisma.systemSettings.create({
            data: {
              key: fullKey,
              value,
              category,
              label: defaultConfig?.label || keyName,
              isSecret: defaultConfig?.isSecret || false,
            },
          }),
        );
      }
    }

    await Promise.all(updates);
    return this.getSettingsByCategory(category);
  }

  /**
   * Delete a setting by key
   */
  async deleteSetting(key: string): Promise<void> {
    await this.prisma.systemSettings.delete({
      where: { key },
    });
  }

  /**
   * Get grouped settings for admin dashboard
   */
  async getGroupedSettings(): Promise<Record<string, Record<string, any>>> {
    const settings = await this.prisma.systemSettings.findMany({
      orderBy: [{ category: 'asc' }, { key: 'asc' }],
    });

    const grouped: Record<string, Record<string, any>> = {};

    for (const setting of settings) {
      if (!grouped[setting.category]) {
        grouped[setting.category] = {};
      }
      const keyName = setting.key.replace(`${setting.category}.`, '');
      grouped[setting.category][keyName] = {
        value: setting.isSecret ? '********' : setting.value,
        label: setting.label,
        description: setting.description,
        isSecret: setting.isSecret,
      };
    }

    return grouped;
  }

  /**
   * Test email configuration
   */
  async testEmailConfiguration(): Promise<{ success: boolean; message: string }> {
    try {
      const smtpHost = await this.getSettingValue<string>('email.smtpHost');
      const smtpPort = await this.getSettingValue<number>('email.smtpPort');
      const smtpUsername = await this.getSettingValue<string>('email.smtpUsername');
      
      if (!smtpHost || !smtpUsername) {
        return { success: false, message: 'Email configuration incomplete' };
      }

      // In a real implementation, we would send a test email here
      // For now, just validate the configuration exists
      return { success: true, message: `Email configuration validated for ${smtpHost}:${smtpPort}` };
    } catch (error) {
      return { success: false, message: error.message };
    }
  }

  /**
   * Test ThingsBoard connection
   */
  async testThingsBoardConnection(): Promise<{ success: boolean; message: string }> {
    try {
      const url = await this.getSettingValue<string>('thingsboard.url');
      const username = await this.getSettingValue<string>('thingsboard.username');
      
      if (!url || !username) {
        return { success: false, message: 'ThingsBoard configuration incomplete' };
      }

      // In a real implementation, we would test the connection here
      // For now, just validate the configuration exists
      return { success: true, message: `ThingsBoard configuration validated for ${url}` };
    } catch (error) {
      return { success: false, message: error.message };
    }
  }

  /**
   * Mask secret values in response
   */
  private maskSecretValue(setting: any): SystemSettingResponse {
    return {
      ...setting,
      value: setting.isSecret ? '********' : setting.value,
    };
  }
}
