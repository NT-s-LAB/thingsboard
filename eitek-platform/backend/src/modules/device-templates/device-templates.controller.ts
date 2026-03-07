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

@ApiTags('Device Templates')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller({ path: 'device-templates', version: '1' })
export class DeviceTemplatesController {
  constructor(private readonly deviceTemplatesService: DeviceTemplatesService) {}

  @ApiOperation({ summary: 'Create a new device template' })
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
