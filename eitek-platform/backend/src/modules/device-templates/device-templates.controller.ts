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
import { DeviceTemplatesService } from './device-templates.service';
import { CreateDeviceTemplateDto } from './dto/create-device-template.dto';
import { UpdateDeviceTemplateDto } from './dto/update-device-template.dto';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '@prisma/client';

@ApiTags('Device Templates')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('device-templates')
export class DeviceTemplatesController {
  constructor(private readonly deviceTemplatesService: DeviceTemplatesService) {}

  @ApiOperation({ summary: 'Create a new device template' })
  @Roles(UserRole.TENANT_ADMIN)
  @Post()
  async create(@Body() createDto: CreateDeviceTemplateDto) {
    const template = await this.deviceTemplatesService.create(createDto);
    return {
      success: true,
      message: 'Device template created successfully',
      data: template,
      timestamp: new Date().toISOString(),
    };
  }

  @ApiOperation({ summary: 'Get all device templates with pagination' })
  @Roles(UserRole.VIEWER)
  @Get()
  async findAll(
    @Query() pagination: PaginationDto,
    @Query('deviceTypeId') deviceTypeId?: string,
  ) {
    const result = await this.deviceTemplatesService.findAll(pagination, deviceTypeId);
    return {
      success: true,
      message: 'Device templates retrieved successfully',
      data: result.data,
      pagination: result.pagination,
      timestamp: new Date().toISOString(),
    };
  }

  @ApiOperation({ summary: 'Get device template by ID' })
  @Roles(UserRole.VIEWER)
  @Get(':id')
  async findOne(@Param('id') id: string) {
    const template = await this.deviceTemplatesService.findOne(id);
    return {
      success: true,
      message: 'Device template retrieved successfully',
      data: template,
      timestamp: new Date().toISOString(),
    };
  }

  @ApiOperation({ summary: 'Update device template' })
  @Roles(UserRole.TENANT_ADMIN)
  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() updateDto: UpdateDeviceTemplateDto,
  ) {
    const template = await this.deviceTemplatesService.update(id, updateDto);
    return {
      success: true,
      message: 'Device template updated successfully',
      data: template,
      timestamp: new Date().toISOString(),
    };
  }

  @ApiOperation({ summary: 'Delete device template' })
  @Roles(UserRole.TENANT_ADMIN)
  @Delete(':id')
  async remove(@Param('id') id: string) {
    await this.deviceTemplatesService.remove(id);
    return {
      success: true,
      message: 'Device template deleted successfully',
      timestamp: new Date().toISOString(),
    };
  }
}
