import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { DeviceScadaService } from './device-scada.service';
import { CreateDeviceScadaTemplateDto } from './dto/create-device-scada-template.dto';
import { UpdateDeviceScadaTemplateDto } from './dto/update-device-scada-template.dto';
import { SetProfileDefaultDto } from './dto/set-profile-default.dto';
import { SaveDeviceOverrideDto } from './dto/save-device-override.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { RequestUser } from '../../common/interfaces/common.interface';
import { UserRole } from '@prisma/client';

// ═══════════════════════════════════════════════════════════════════
// Template CRUD
// ═══════════════════════════════════════════════════════════════════

@ApiTags('Device SCADA Templates')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('device-scada-templates')
export class DeviceScadaTemplateController {
  constructor(private readonly svc: DeviceScadaService) {}

  @ApiOperation({ summary: 'Create a device SCADA template' })
  @Roles(UserRole.PROJECT_MANAGER)
  @Post()
  async create(@Body() dto: CreateDeviceScadaTemplateDto, @CurrentUser() user: RequestUser) {
    const data = await this.svc.createTemplate(dto, user);
    return { success: true, message: 'Template created', data, timestamp: new Date().toISOString() };
  }

  @ApiOperation({ summary: 'List all device SCADA templates' })
  @Roles(UserRole.VIEWER)
  @Get()
  async list(@Query('search') search: string, @CurrentUser() user: RequestUser) {
    const data = await this.svc.listTemplates(user, search);
    return { success: true, message: 'Templates retrieved', data, timestamp: new Date().toISOString() };
  }

  @ApiOperation({ summary: 'Get device SCADA template by ID' })
  @Roles(UserRole.VIEWER)
  @Get(':id')
  async get(@Param('id') id: string, @CurrentUser() user: RequestUser) {
    const data = await this.svc.getTemplate(id, user);
    return { success: true, message: 'Template retrieved', data, timestamp: new Date().toISOString() };
  }

  @ApiOperation({ summary: 'Update device SCADA template' })
  @Roles(UserRole.PROJECT_MANAGER)
  @Put(':id')
  async update(@Param('id') id: string, @Body() dto: UpdateDeviceScadaTemplateDto, @CurrentUser() user: RequestUser) {
    const data = await this.svc.updateTemplate(id, dto, user);
    return { success: true, message: 'Template updated', data, timestamp: new Date().toISOString() };
  }

  @ApiOperation({ summary: 'Delete device SCADA template' })
  @Roles(UserRole.TENANT_ADMIN)
  @Delete(':id')
  async delete(@Param('id') id: string, @CurrentUser() user: RequestUser) {
    await this.svc.deleteTemplate(id, user);
    return { success: true, message: 'Template deleted', timestamp: new Date().toISOString() };
  }
}

// ═══════════════════════════════════════════════════════════════════
// Profile Default Mapping
// ═══════════════════════════════════════════════════════════════════

@ApiTags('Device Profile SCADA Defaults')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('device-profile-scada-defaults')
export class DeviceProfileScadaDefaultController {
  constructor(private readonly svc: DeviceScadaService) {}

  @ApiOperation({ summary: 'List all profile-to-template mappings' })
  @Roles(UserRole.VIEWER)
  @Get()
  async listAll(@CurrentUser() user: RequestUser) {
    const data = await this.svc.listProfileDefaults(user);
    return { success: true, message: 'Profile defaults retrieved', data, timestamp: new Date().toISOString() };
  }

  @ApiOperation({ summary: 'Get default template for a device profile' })
  @Roles(UserRole.VIEWER)
  @Get(':profileId')
  async get(@Param('profileId') profileId: string, @CurrentUser() user: RequestUser) {
    const data = await this.svc.getProfileDefault(profileId, user);
    return { success: true, message: 'Profile default retrieved', data, timestamp: new Date().toISOString() };
  }

  @ApiOperation({ summary: 'Set/update default template for a device profile' })
  @Roles(UserRole.PROJECT_MANAGER)
  @Put(':profileId')
  async set(
    @Param('profileId') profileId: string,
    @Body() dto: SetProfileDefaultDto,
    @CurrentUser() user: RequestUser,
  ) {
    const data = await this.svc.setProfileDefault(profileId, dto.templateId, user);
    return { success: true, message: 'Profile default set', data, timestamp: new Date().toISOString() };
  }

  @ApiOperation({ summary: 'Remove default template mapping for a device profile' })
  @Roles(UserRole.TENANT_ADMIN)
  @Delete(':profileId')
  async remove(@Param('profileId') profileId: string, @CurrentUser() user: RequestUser) {
    await this.svc.removeProfileDefault(profileId, user);
    return { success: true, message: 'Profile default removed', timestamp: new Date().toISOString() };
  }
}

// ═══════════════════════════════════════════════════════════════════
// Device SCADA Runtime + Override
// ═══════════════════════════════════════════════════════════════════

@ApiTags('Device SCADA')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('devices')
export class DeviceScadaController {
  constructor(private readonly svc: DeviceScadaService) {}

  @ApiOperation({ summary: 'Get resolved SCADA for a device (runtime)' })
  @Roles(UserRole.VIEWER)
  @Get(':deviceId/scada')
  async resolveScada(@Param('deviceId') deviceId: string, @CurrentUser() user: RequestUser) {
    const data = await this.svc.resolveDeviceScada(deviceId, user);
    return { success: true, message: 'Device SCADA resolved', data, timestamp: new Date().toISOString() };
  }

  @ApiOperation({ summary: 'Get device SCADA override' })
  @Roles(UserRole.VIEWER)
  @Get(':deviceId/scada/override')
  async getOverride(@Param('deviceId') deviceId: string, @CurrentUser() user: RequestUser) {
    const data = await this.svc.getDeviceOverride(deviceId, user);
    return { success: true, message: 'Override retrieved', data, timestamp: new Date().toISOString() };
  }

  @ApiOperation({ summary: 'Save device SCADA override' })
  @Roles(UserRole.PROJECT_MANAGER)
  @Put(':deviceId/scada/override')
  async saveOverride(
    @Param('deviceId') deviceId: string,
    @Body() dto: SaveDeviceOverrideDto,
    @CurrentUser() user: RequestUser,
  ) {
    const data = await this.svc.saveDeviceOverride(deviceId, dto, user);
    return { success: true, message: 'Override saved', data, timestamp: new Date().toISOString() };
  }

  @ApiOperation({ summary: 'Delete device SCADA override' })
  @Roles(UserRole.PROJECT_MANAGER)
  @Delete(':deviceId/scada/override')
  async deleteOverride(@Param('deviceId') deviceId: string, @CurrentUser() user: RequestUser) {
    await this.svc.deleteDeviceOverride(deviceId, user);
    return { success: true, message: 'Override deleted', timestamp: new Date().toISOString() };
  }
}
