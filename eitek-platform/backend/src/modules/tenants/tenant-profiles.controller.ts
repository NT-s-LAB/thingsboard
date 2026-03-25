import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  ParseUUIDPipe,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { TenantProfilesService } from './tenant-profiles.service';
import { CreateTenantProfileDto } from './dto/create-tenant-profile.dto';
import { UpdateTenantProfileDto } from './dto/update-tenant-profile.dto';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '@prisma/client';

@ApiTags('Tenant Profiles')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.SUPER_ADMIN)
@Controller('tenant-profiles')
export class TenantProfilesController {
  constructor(private readonly tenantProfilesService: TenantProfilesService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new tenant profile' })
  @ApiResponse({
    status: 201,
    description: 'Profile created successfully',
  })
  @ApiResponse({
    status: 409,
    description: 'Profile name already exists',
  })
  create(@Body() createTenantProfileDto: CreateTenantProfileDto) {
    return this.tenantProfilesService.create(createTenantProfileDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all tenant profiles with pagination' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiQuery({ name: 'sortBy', required: false, type: String })
  @ApiQuery({
    name: 'sortOrder',
    required: false,
    enum: ['asc', 'desc'],
  })
  @ApiResponse({
    status: 200,
    description: 'List of tenant profiles',
  })
  findAll(@Query() pagination: PaginationDto) {
    return this.tenantProfilesService.findAll(pagination);
  }

  @Get('simple')
  @ApiOperation({ summary: 'Get all active tenant profiles (simple list)' })
  @ApiResponse({
    status: 200,
    description: 'Simple list of active tenant profiles',
  })
  findAllSimple() {
    return this.tenantProfilesService.findAllSimple();
  }

  @Get('default')
  @ApiOperation({ summary: 'Get the default tenant profile' })
  @ApiResponse({
    status: 200,
    description: 'The default tenant profile',
  })
  findDefault() {
    return this.tenantProfilesService.findDefault();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a tenant profile by ID' })
  @ApiParam({ name: 'id', description: 'Profile ID' })
  @ApiResponse({
    status: 200,
    description: 'The tenant profile',
  })
  @ApiResponse({
    status: 404,
    description: 'Profile not found',
  })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.tenantProfilesService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a tenant profile' })
  @ApiParam({ name: 'id', description: 'Profile ID' })
  @ApiResponse({
    status: 200,
    description: 'Profile updated successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Profile not found',
  })
  @ApiResponse({
    status: 409,
    description: 'Profile name already exists',
  })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateTenantProfileDto: UpdateTenantProfileDto,
  ) {
    return this.tenantProfilesService.update(id, updateTenantProfileDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete a tenant profile' })
  @ApiParam({ name: 'id', description: 'Profile ID' })
  @ApiResponse({
    status: 200,
    description: 'Profile deleted successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'Cannot delete profile in use or default profile',
  })
  @ApiResponse({
    status: 404,
    description: 'Profile not found',
  })
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.tenantProfilesService.remove(id);
  }

  @Post(':id/set-default')
  @ApiOperation({ summary: 'Set a profile as default' })
  @ApiParam({ name: 'id', description: 'Profile ID' })
  @ApiResponse({
    status: 200,
    description: 'Profile set as default successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Profile not found',
  })
  setDefault(@Param('id', ParseUUIDPipe) id: string) {
    return this.tenantProfilesService.setDefault(id);
  }

  @Post(':id/duplicate')
  @ApiOperation({ summary: 'Duplicate a tenant profile' })
  @ApiParam({ name: 'id', description: 'Profile ID' })
  @ApiResponse({
    status: 201,
    description: 'Profile duplicated successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Profile not found',
  })
  duplicate(@Param('id', ParseUUIDPipe) id: string) {
    return this.tenantProfilesService.duplicate(id);
  }
}
