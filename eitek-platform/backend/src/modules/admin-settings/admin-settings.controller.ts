import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { AdminSettingsService } from './admin-settings.service';
import {
  CreateSettingDto,
  UpdateSettingDto,
  UpdateSettingsByCategoryDto,
  SettingsCategory,
} from './dto/system-settings.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '@prisma/client';
import { EmailService } from '../email/email.service';

@Controller('admin/settings')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.SUPER_ADMIN)
export class AdminSettingsController {
  constructor(
    private readonly adminSettingsService: AdminSettingsService,
    private readonly emailService: EmailService,
  ) {}

  /**
   * Get all system settings grouped by category
   */
  @Get()
  async getAllSettings() {
    return this.adminSettingsService.getGroupedSettings();
  }

  /**
   * Get settings by category
   */
  @Get('category/:category')
  async getSettingsByCategory(@Param('category') category: SettingsCategory) {
    return this.adminSettingsService.getSettingsByCategory(category);
  }

  /**
   * Get a single setting by key
   */
  @Get('key/:key')
  async getSettingByKey(@Param('key') key: string) {
    return this.adminSettingsService.getSettingByKey(key);
  }

  /**
   * Create a new setting
   */
  @Post()
  async createSetting(@Body() dto: CreateSettingDto) {
    return this.adminSettingsService.createSetting(dto);
  }

  /**
   * Update a setting by key
   */
  @Put('key/:key')
  async updateSetting(@Param('key') key: string, @Body() dto: UpdateSettingDto) {
    return this.adminSettingsService.updateSetting(key, dto);
  }

  /**
   * Update multiple settings by category
   */
  @Put('category/:category')
  async updateSettingsByCategory(
    @Param('category') category: SettingsCategory,
    @Body() dto: UpdateSettingsByCategoryDto,
  ) {
    return this.adminSettingsService.updateSettingsByCategory(category, dto);
  }

  /**
   * Delete a setting by key
   */
  @Delete('key/:key')
  async deleteSetting(@Param('key') key: string) {
    await this.adminSettingsService.deleteSetting(key);
    return { message: 'Setting deleted successfully' };
  }

  /**
   * Test email configuration
   * Accepts config from form so user doesn't need to save first
   * Supports both SMTP and Resend providers
   */
  @Post('test/email')
  async testEmail(@Body() body: {
    recipient?: string;
    provider?: string;
    smtpHost?: string;
    smtpPort?: number;
    smtpUsername?: string;
    smtpPassword?: string;
    smtpSecure?: boolean;
    resendApiKey?: string;
    fromName?: string;
    fromEmail?: string;
  }) {
    const provider = body?.provider || 'smtp';
    const fromName = body?.fromName || 'EITEK Platform';
    const fromEmail = body?.fromEmail || 'noreply@eitek.com';

    if (provider === 'resend' && body?.resendApiKey) {
      // Resolve masked API key
      let apiKey = body.resendApiKey;
      if (apiKey === '********') {
        const realKey = await this.adminSettingsService.getSettingValue<string>('email.resendApiKey');
        apiKey = realKey || '';
      }
      return this.emailService.testResendWithConfig(
        { apiKey, fromName, fromEmail, enabled: true },
        body.recipient,
      );
    }

    // SMTP test
    if (body?.smtpHost && body?.smtpUsername) {
      let password = body.smtpPassword || '';
      if (password === '********') {
        const realPassword = await this.adminSettingsService.getSettingValue<string>('email.smtpPassword');
        password = realPassword || '';
      }
      return this.emailService.testWithConfig(
        {
          host: body.smtpHost,
          port: body.smtpPort || 587,
          secure: body.smtpSecure ?? true,
          username: body.smtpUsername,
          password,
          fromName,
          fromEmail,
          enabled: true,
        },
        body.recipient,
      );
    }

    // Fallback: read from DB
    return this.emailService.testConnection(body?.recipient);
  }

  /**
   * Test ThingsBoard connection
   */
  @Post('test/thingsboard')
  async testThingsBoard() {
    return this.adminSettingsService.testThingsBoardConnection();
  }

  /**
   * Reset settings to default values
   */
  @Post('reset')
  async resetToDefaults() {
    await this.adminSettingsService.initializeDefaultSettings();
    return { message: 'Settings reset to defaults' };
  }
}
