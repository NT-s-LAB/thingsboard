import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  ParseUUIDPipe,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { TenantAddonService } from './tenant-addon.service';
import { PurchaseAddonDto, UpdateTenantAddonDto } from './dto/purchase-addon.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { User } from '../auth/decorators/user.decorator';
import { UserRole } from '@prisma/client';

@ApiTags('Tenant Addons')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('tenant-addons')
export class TenantAddonController {
  constructor(private readonly tenantAddonService: TenantAddonService) {}

  // ── TENANT_ADMIN: manage own tenant's addons ──

  @Get('my/quota')
  @Roles(UserRole.VIEWER) // all authenticated users can see their quota
  @ApiOperation({ summary: 'Get current tenant quota info (usage, limits, addons)' })
  async getMyQuota(@User('tenantId') tenantId: string) {
    const data = await this.tenantAddonService.getQuotaInfo(tenantId);
    return { success: true, message: 'Quota info retrieved', data, timestamp: new Date().toISOString() };
  }

  @Get('my')
  @Roles(UserRole.TENANT_ADMIN)
  @ApiOperation({ summary: 'List my tenant active addons' })
  async getMyAddons(@User('tenantId') tenantId: string) {
    const data = await this.tenantAddonService.findByTenant(tenantId);
    return { success: true, message: 'Tenant addons retrieved', data, timestamp: new Date().toISOString() };
  }

  @Post('my/purchase')
  @Roles(UserRole.TENANT_ADMIN)
  @ApiOperation({ summary: 'Purchase an addon for my tenant' })
  async purchaseForMyTenant(@User('tenantId') tenantId: string, @Body() dto: PurchaseAddonDto) {
    const data = await this.tenantAddonService.purchase(tenantId, dto);
    return { success: true, message: 'Addon purchased', data, timestamp: new Date().toISOString() };
  }

  @Patch('my/:addonId')
  @Roles(UserRole.TENANT_ADMIN)
  @ApiOperation({ summary: 'Update addon quantity for my tenant' })
  async updateMyAddon(
    @User('tenantId') tenantId: string,
    @Param('addonId', ParseUUIDPipe) addonId: string,
    @Body() dto: UpdateTenantAddonDto,
  ) {
    const data = await this.tenantAddonService.update(addonId, tenantId, dto);
    return { success: true, message: 'Addon updated', data, timestamp: new Date().toISOString() };
  }

  @Delete('my/:addonId')
  @Roles(UserRole.TENANT_ADMIN)
  @ApiOperation({ summary: 'Remove addon from my tenant' })
  async removeMyAddon(
    @User('tenantId') tenantId: string,
    @Param('addonId', ParseUUIDPipe) addonId: string,
  ) {
    await this.tenantAddonService.remove(addonId, tenantId);
    return { success: true, message: 'Addon removed', timestamp: new Date().toISOString() };
  }

  // ── SUPER_ADMIN: manage any tenant's addons ──

  @Get('tenant/:tenantId/quota')
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Get quota info for a specific tenant (SUPER_ADMIN)' })
  async getTenantQuota(@Param('tenantId', ParseUUIDPipe) tenantId: string) {
    const data = await this.tenantAddonService.getQuotaInfo(tenantId);
    return { success: true, message: 'Quota info retrieved', data, timestamp: new Date().toISOString() };
  }

  @Get('tenant/:tenantId')
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'List addons for a specific tenant (SUPER_ADMIN)' })
  async getTenantAddons(@Param('tenantId', ParseUUIDPipe) tenantId: string) {
    const data = await this.tenantAddonService.findByTenant(tenantId);
    return { success: true, message: 'Tenant addons retrieved', data, timestamp: new Date().toISOString() };
  }

  @Post('tenant/:tenantId/purchase')
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Assign addon to a tenant (SUPER_ADMIN)' })
  async purchaseForTenant(
    @Param('tenantId', ParseUUIDPipe) tenantId: string,
    @Body() dto: PurchaseAddonDto,
  ) {
    const data = await this.tenantAddonService.purchase(tenantId, dto);
    return { success: true, message: 'Addon assigned', data, timestamp: new Date().toISOString() };
  }
}
