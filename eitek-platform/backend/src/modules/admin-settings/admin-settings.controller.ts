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

@Controller('admin/settings')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.SUPER_ADMIN)
export class AdminSettingsController {
  constructor(private readonly adminSettingsService: AdminSettingsService) {}

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
   */
  @Post('test/email')
  async testEmail() {
    return this.adminSettingsService.testEmailConfiguration();
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
