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
import { TenantsService } from './tenants.service';
import { CreateTenantDto } from './dto/create-tenant.dto';
import { UpdateTenantDto } from './dto/update-tenant.dto';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Tenants')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('tenants')
export class TenantsController {
  constructor(private readonly tenantsService: TenantsService) {}

  @ApiOperation({ summary: 'Create a new tenant' })
  @Post()
  async create(@Body() createTenantDto: CreateTenantDto) {
    const tenant = await this.tenantsService.create(createTenantDto);
    return {
      success: true,
      message: 'Tenant created successfully',
      data: tenant,
      timestamp: new Date().toISOString(),
    };
  }

  @ApiOperation({ summary: 'Get all tenants with pagination' })
  @Get()
  async findAll(@Query() pagination: PaginationDto) {
    const result = await this.tenantsService.findAll(pagination);
    return {
      success: true,
      message: 'Tenants retrieved successfully',
      data: result.data,
      pagination: result.pagination,
      timestamp: new Date().toISOString(),
    };
  }

  @ApiOperation({ summary: 'Get tenant by ID' })
  @Get(':id')
  async findOne(@Param('id') id: string) {
    const tenant = await this.tenantsService.findOne(id);
    return {
      success: true,
      message: 'Tenant retrieved successfully',
      data: tenant,
      timestamp: new Date().toISOString(),
    };
  }

  @ApiOperation({ summary: 'Update tenant' })
  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() updateTenantDto: UpdateTenantDto,
  ) {
    const tenant = await this.tenantsService.update(id, updateTenantDto);
    return {
      success: true,
      message: 'Tenant updated successfully',
      data: tenant,
      timestamp: new Date().toISOString(),
    };
  }

  @ApiOperation({ summary: 'Delete tenant' })
  @Delete(':id')
  async remove(@Param('id') id: string) {
    await this.tenantsService.remove(id);
    return {
      success: true,
      message: 'Tenant deleted successfully',
      timestamp: new Date().toISOString(),
    };
  }
}
