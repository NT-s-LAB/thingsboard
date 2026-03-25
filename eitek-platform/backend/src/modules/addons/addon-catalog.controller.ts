import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  ParseUUIDPipe,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AddonCatalogService } from './addon-catalog.service';
import { CreateAddonCatalogDto } from './dto/create-addon-catalog.dto';
import { UpdateAddonCatalogDto } from './dto/update-addon-catalog.dto';
import { PaginationDto } from '@/common/dto/pagination.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '@prisma/client';

@ApiTags('Addon Catalog')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('addon-catalog')
export class AddonCatalogController {
  constructor(private readonly addonCatalogService: AddonCatalogService) {}

  @Post()
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Create addon in catalog (SUPER_ADMIN)' })
  async create(@Body() dto: CreateAddonCatalogDto) {
    const data = await this.addonCatalogService.create(dto);
    return { success: true, message: 'Addon created', data, timestamp: new Date().toISOString() };
  }

  @Get()
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'List all addons with pagination (SUPER_ADMIN)' })
  async findAll(@Query() pagination: PaginationDto) {
    const result = await this.addonCatalogService.findAll(pagination);
    return {
      success: true,
      message: 'Addons retrieved',
      data: result.data,
      pagination: result.pagination,
      timestamp: new Date().toISOString(),
    };
  }

  @Get('active')
  @Roles(UserRole.TENANT_ADMIN)
  @ApiOperation({ summary: 'List active addons available for purchase (TENANT_ADMIN+)' })
  async findAllActive() {
    const data = await this.addonCatalogService.findAllActive();
    return { success: true, message: 'Active addons retrieved', data, timestamp: new Date().toISOString() };
  }

  @Get(':id')
  @Roles(UserRole.TENANT_ADMIN)
  @ApiOperation({ summary: 'Get addon by ID' })
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    const data = await this.addonCatalogService.findOne(id);
    return { success: true, message: 'Addon retrieved', data, timestamp: new Date().toISOString() };
  }

  @Patch(':id')
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Update addon (SUPER_ADMIN)' })
  async update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateAddonCatalogDto) {
    const data = await this.addonCatalogService.update(id, dto);
    return { success: true, message: 'Addon updated', data, timestamp: new Date().toISOString() };
  }

  @Delete(':id')
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Delete addon (SUPER_ADMIN)' })
  async remove(@Param('id', ParseUUIDPipe) id: string) {
    await this.addonCatalogService.remove(id);
    return { success: true, message: 'Addon deleted', timestamp: new Date().toISOString() };
  }
}
