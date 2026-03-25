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
import { CreateAssetProfileDto, UpdateAssetProfileDto } from '../dto/asset-profile.dto';
import { PaginationDto } from '../../../common/dto/pagination.dto';
import { UserRole } from '@prisma/client';

@ApiTags('Asset Profiles')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('asset-profiles')
export class AssetProfilesController {
  constructor(private readonly profilesService: ProfilesService) {}

  @ApiOperation({ summary: 'Get all asset profiles from ThingsBoard' })
  @Roles(UserRole.VIEWER)
  @Get()
  async findAll(@Query() pagination: PaginationDto) {
    const result = await this.profilesService.getAssetProfiles(
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

  @ApiOperation({ summary: 'Get asset profile by ID' })
  @Roles(UserRole.VIEWER)
  @Get(':id')
  async findOne(@Param('id') id: string) {
    const profile = await this.profilesService.getAssetProfile(id);
    return {
      success: true,
      data: profile,
      timestamp: new Date().toISOString(),
    };
  }

  @ApiOperation({ summary: 'Create a new asset profile' })
  @Roles(UserRole.TENANT_ADMIN)
  @Post()
  async create(@Body() dto: CreateAssetProfileDto) {
    const profile = await this.profilesService.createAssetProfile(dto);
    return {
      success: true,
      message: 'Asset profile created successfully',
      data: profile,
      timestamp: new Date().toISOString(),
    };
  }

  @ApiOperation({ summary: 'Update an asset profile' })
  @Roles(UserRole.TENANT_ADMIN)
  @Put(':id')
  async update(@Param('id') id: string, @Body() dto: Omit<UpdateAssetProfileDto, 'id'>) {
    const profile = await this.profilesService.updateAssetProfile({ ...dto, id });
    return {
      success: true,
      message: 'Asset profile updated successfully',
      data: profile,
      timestamp: new Date().toISOString(),
    };
  }

  @ApiOperation({ summary: 'Delete an asset profile' })
  @Roles(UserRole.TENANT_ADMIN)
  @Delete(':id')
  async remove(@Param('id') id: string) {
    await this.profilesService.deleteAssetProfile(id);
    return {
      success: true,
      message: 'Asset profile deleted successfully',
      timestamp: new Date().toISOString(),
    };
  }
}
