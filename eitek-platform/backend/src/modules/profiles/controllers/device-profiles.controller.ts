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
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { ProfilesService } from '../services/profiles.service';
import { CreateDeviceProfileDto, UpdateDeviceProfileDto } from '../dto/device-profile.dto';
import { PaginationDto } from '../../../common/dto/pagination.dto';
import { UserRole } from '@prisma/client';

@ApiTags('Device Profiles')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('device-profiles')
export class DeviceProfilesController {
  constructor(private readonly profilesService: ProfilesService) {}

  @ApiOperation({ summary: 'Get all device profiles from ThingsBoard' })
  @Roles(UserRole.VIEWER)
  @Get()
  async findAll(@Query() pagination: PaginationDto) {
    const result = await this.profilesService.getDeviceProfiles(
      pagination.effectiveLimit,
      (pagination.page || 1) - 1,
      pagination.effectiveSearch,
      pagination.effectiveSortBy || 'name',
      pagination.effectiveSortOrder === 'asc' ? 'ASC' : 'DESC',
    );

    return {
      success: true,
      data: result.data,
      pagination: {
        total: result.totalElements,
        page: pagination.page || 1,
        limit: pagination.effectiveLimit,
        totalPages: result.totalPages,
        hasNext: result.hasNext,
        hasPrev: (pagination.page || 1) > 1,
      },
      timestamp: new Date().toISOString(),
    };
  }

  @ApiOperation({ summary: 'Get device profile by ID' })
  @Roles(UserRole.VIEWER)
  @Get(':id')
  async findOne(@Param('id') id: string) {
    const profile = await this.profilesService.getDeviceProfile(id);
    return {
      success: true,
      data: profile,
      timestamp: new Date().toISOString(),
    };
  }

  @ApiOperation({ summary: 'Create a new device profile' })
  @Roles(UserRole.TENANT_ADMIN)
  @Post()
  async create(@Body() dto: CreateDeviceProfileDto) {
    const profile = await this.profilesService.createDeviceProfile(dto);
    return {
      success: true,
      message: 'Device profile created successfully',
      data: profile,
      timestamp: new Date().toISOString(),
    };
  }

  @ApiOperation({ summary: 'Update a device profile' })
  @Roles(UserRole.TENANT_ADMIN)
  @Put(':id')
  async update(@Param('id') id: string, @Body() dto: Omit<UpdateDeviceProfileDto, 'id'>) {
    const profile = await this.profilesService.updateDeviceProfile({ ...dto, id });
    return {
      success: true,
      message: 'Device profile updated successfully',
      data: profile,
      timestamp: new Date().toISOString(),
    };
  }

  @ApiOperation({ summary: 'Delete a device profile' })
  @Roles(UserRole.TENANT_ADMIN)
  @Delete(':id')
  async remove(@Param('id') id: string) {
    await this.profilesService.deleteDeviceProfile(id);
    return {
      success: true,
      message: 'Device profile deleted successfully',
      timestamp: new Date().toISOString(),
    };
  }
}
