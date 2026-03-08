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
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { DevicesService } from '../services/devices.service';
import { CreateDeviceDto } from '../dto/create-device.dto';
import { UpdateDeviceDto } from '../dto/update-device.dto';
import { PaginationDto } from '../../../common/dto/pagination.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { RequestUser } from '../../../common/interfaces/common.interface';

@ApiTags('Devices')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('devices')
export class DevicesController {
  constructor(private readonly devicesService: DevicesService) {}

  @ApiOperation({ summary: 'Create a new device' })
  @Post()
  async create(
    @Body() createDeviceDto: CreateDeviceDto,
    @CurrentUser() user: RequestUser,
  ) {
    const device = await this.devicesService.create(createDeviceDto, user);
    return {
      success: true,
      message: 'Device created successfully',
      data: device,
      timestamp: new Date().toISOString(),
    };
  }

  @ApiOperation({ summary: 'Get all devices with pagination' })
  @Get()
  async findAll(
    @Query() pagination: PaginationDto,
    @CurrentUser() user: RequestUser,
  ) {
    const result = await this.devicesService.findAll(pagination, user);
    return {
      success: true,
      message: 'Devices retrieved successfully',
      data: result.data,
      pagination: result.pagination,
      timestamp: new Date().toISOString(),
    };
  }

  @ApiOperation({ summary: 'Get device by ID' })
  @Get(':id')
  async findOne(@Param('id') id: string, @CurrentUser() user: RequestUser) {
    const device = await this.devicesService.findOne(id, user);
    return {
      success: true,
      message: 'Device retrieved successfully',
      data: device,
      timestamp: new Date().toISOString(),
    };
  }

  @ApiOperation({ summary: 'Update device' })
  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() updateDeviceDto: UpdateDeviceDto,
    @CurrentUser() user: RequestUser,
  ) {
    const device = await this.devicesService.update(id, updateDeviceDto, user);
    return {
      success: true,
      message: 'Device updated successfully',
      data: device,
      timestamp: new Date().toISOString(),
    };
  }

  @ApiOperation({ summary: 'Delete device' })
  @Delete(':id')
  async remove(@Param('id') id: string, @CurrentUser() user: RequestUser) {
    await this.devicesService.remove(id, user);
    return {
      success: true,
      message: 'Device deleted successfully',
      timestamp: new Date().toISOString(),
    };
  }

  @ApiOperation({ summary: 'Get device telemetry data' })
  @Get(':id/telemetry')
  async getTelemetry(
    @Param('id') deviceId: string,
    @Query('keys') keys?: string,
    @CurrentUser() user?: RequestUser,
  ) {
    const telemetryData = await this.devicesService.getTelemetry(
      deviceId,
      keys?.split(','),
      user,
    );
    return {
      success: true,
      message: 'Telemetry data retrieved successfully',
      data: telemetryData,
      timestamp: new Date().toISOString(),
    };
  }

  @ApiOperation({ summary: 'Send RPC command to device' })
  @Post(':id/rpc')
  async sendRpc(
    @Param('id') deviceId: string,
    @Body() rpcData: { method: string; params: any },
    @CurrentUser() user: RequestUser,
  ) {
    const result = await this.devicesService.sendRpc(
      deviceId,
      rpcData.method,
      rpcData.params,
      user,
    );
    return {
      success: true,
      message: 'RPC command sent successfully',
      data: result,
      timestamp: new Date().toISOString(),
    };
  }
}