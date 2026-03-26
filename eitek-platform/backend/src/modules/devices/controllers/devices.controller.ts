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
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { RequestUser } from '../../../common/interfaces/common.interface';
import { UserRole } from '@prisma/client';

@ApiTags('Devices')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('devices')
export class DevicesController {
  constructor(private readonly devicesService: DevicesService) {}

  @ApiOperation({ summary: 'Create a new device' })
  @Roles(UserRole.PROJECT_MANAGER)
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
  @Roles(UserRole.VIEWER)
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
  @Roles(UserRole.VIEWER)
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
  @Roles(UserRole.PROJECT_MANAGER)
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
  @Roles(UserRole.TENANT_ADMIN)
  @Delete(':id')
  async remove(@Param('id') id: string, @CurrentUser() user: RequestUser) {
    await this.devicesService.remove(id, user);
    return {
      success: true,
      message: 'Device deleted successfully',
      timestamp: new Date().toISOString(),
    };
  }

  // ================================
  // Device Credentials
  // ================================

  @ApiOperation({ summary: 'Get device credentials' })
  @Roles(UserRole.PROJECT_MANAGER)
  @Get(':id/credentials')
  async getCredentials(@Param('id') id: string, @CurrentUser() user: RequestUser) {
    const credentials = await this.devicesService.getCredentials(id, user);
    return {
      success: true,
      message: 'Device credentials retrieved successfully',
      data: credentials,
      timestamp: new Date().toISOString(),
    };
  }

  @ApiOperation({ summary: 'Save device credentials' })
  @Roles(UserRole.PROJECT_MANAGER)
  @Post(':id/credentials')
  async saveCredentials(
    @Param('id') id: string,
    @Body() credentials: any,
    @CurrentUser() user: RequestUser,
  ) {
    const result = await this.devicesService.saveCredentials(id, credentials, user);
    return {
      success: true,
      message: 'Device credentials saved successfully',
      data: result,
      timestamp: new Date().toISOString(),
    };
  }

  // ================================
  // Device Attributes
  // ================================

  @ApiOperation({ summary: 'Get device attributes by scope' })
  @Roles(UserRole.VIEWER)
  @Get(':id/attributes/:scope')
  async getAttributes(
    @Param('id') id: string,
    @Param('scope') scope: 'CLIENT_SCOPE' | 'SHARED_SCOPE' | 'SERVER_SCOPE',
    @Query('keys') keys: string | undefined,
    @CurrentUser() user: RequestUser,
  ) {
    const attributes = await this.devicesService.getAttributes(
      id,
      scope,
      user,
      keys?.split(','),
    );
    return {
      success: true,
      message: 'Device attributes retrieved successfully',
      data: attributes,
      timestamp: new Date().toISOString(),
    };
  }

  @ApiOperation({ summary: 'Save device attributes' })
  @Roles(UserRole.OPERATOR)
  @Post(':id/attributes/:scope')
  async saveAttributes(
    @Param('id') id: string,
    @Param('scope') scope: 'CLIENT_SCOPE' | 'SHARED_SCOPE' | 'SERVER_SCOPE',
    @Body() attributes: Record<string, any>,
    @CurrentUser() user: RequestUser,
  ) {
    await this.devicesService.saveAttributes(id, scope, attributes, user);
    return {
      success: true,
      message: 'Device attributes saved successfully',
      timestamp: new Date().toISOString(),
    };
  }

  @ApiOperation({ summary: 'Delete device attributes' })
  @Roles(UserRole.PROJECT_MANAGER)
  @Delete(':id/attributes/:scope')
  async deleteAttributes(
    @Param('id') id: string,
    @Param('scope') scope: 'CLIENT_SCOPE' | 'SHARED_SCOPE' | 'SERVER_SCOPE',
    @Query('keys') keys: string,
    @CurrentUser() user: RequestUser,
  ) {
    await this.devicesService.deleteAttributes(id, scope, keys.split(','), user);
    return {
      success: true,
      message: 'Device attributes deleted successfully',
      timestamp: new Date().toISOString(),
    };
  }

  // ================================
  // Device Telemetry
  // ================================

  @ApiOperation({ summary: 'Get device latest telemetry' })
  @Roles(UserRole.VIEWER)
  @Get(':id/telemetry')
  async getTelemetry(
    @Param('id') deviceId: string,
    @Query('keys') keys: string | undefined,
    @CurrentUser() user: RequestUser,
  ) {
    const telemetryData = await this.devicesService.getLatestTelemetry(
      deviceId,
      user,
      keys?.split(','),
    );
    return {
      success: true,
      message: 'Telemetry data retrieved successfully',
      data: telemetryData,
      timestamp: new Date().toISOString(),
    };
  }

  @ApiOperation({ summary: 'Get device timeseries data' })
  @Roles(UserRole.VIEWER)
  @Get(':id/timeseries')
  async getTimeseries(
    @Param('id') deviceId: string,
    @Query('keys') keys: string,
    @Query('startTs') startTs: string,
    @Query('endTs') endTs: string,
    @Query('interval') interval: string | undefined,
    @Query('limit') limit: string | undefined,
    @Query('agg') agg: string | undefined,
    @CurrentUser() user: RequestUser,
  ) {
    const data = await this.devicesService.getTimeseries(
      deviceId,
      keys.split(','),
      Number(startTs),
      Number(endTs),
      user,
      {
        interval: interval ? Number(interval) : undefined,
        limit: limit ? Number(limit) : undefined,
        agg: agg || undefined,
      },
    );
    return {
      success: true,
      message: 'Timeseries data retrieved successfully',
      data,
      timestamp: new Date().toISOString(),
    };
  }

  // ================================
  // Device RPC
  // ================================

  @ApiOperation({ summary: 'Send RPC command to device' })
  @Roles(UserRole.OPERATOR)
  @Post(':id/rpc')
  async sendRpc(
    @Param('id') deviceId: string,
    @Body() rpcData: { method: string; params: any },
    @CurrentUser() user: RequestUser,
  ) {
    console.log('\n╔════════════════════════════════════════════════╗');
    console.log('║           RPC REQUEST RECEIVED                 ║');
    console.log('╠════════════════════════════════════════════════╣');
    console.log('Device ID:', deviceId);
    console.log('Method:', rpcData.method);
    console.log('Params:', JSON.stringify(rpcData.params, null, 2));
    console.log('User:', user.id);
    console.log('╚════════════════════════════════════════════════╝\n');

    try {
      const result = await this.devicesService.sendRpc(
        deviceId,
        rpcData.method,
        rpcData.params,
        user,
      );
      console.log('\n✅ RPC SUCCESS:', JSON.stringify(result, null, 2));
      return {
        success: true,
        message: 'RPC command sent successfully',
        data: result,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      console.log('\n❌ RPC ERROR:', error.message);
      throw error;
    }
  }

  // ================================
  // Device Alarms
  // ================================

  @ApiOperation({ summary: 'Get device alarms' })
  @Roles(UserRole.VIEWER)
  @Get(':id/alarms')
  async getAlarms(
    @Param('id') deviceId: string,
    @Query('pageSize') pageSize: string | undefined,
    @Query('page') page: string | undefined,
    @Query('searchStatus') searchStatus: string | undefined,
    @Query('startTime') startTime: string | undefined,
    @Query('endTime') endTime: string | undefined,
    @CurrentUser() user: RequestUser,
  ) {
    const data = await this.devicesService.getAlarms(deviceId, user, {
      pageSize: pageSize ? Number(pageSize) : undefined,
      page: page ? Number(page) : undefined,
      searchStatus: searchStatus || undefined,
      startTime: startTime ? Number(startTime) : undefined,
      endTime: endTime ? Number(endTime) : undefined,
    });
    return {
      success: true,
      message: 'Device alarms retrieved successfully',
      data,
      timestamp: new Date().toISOString(),
    };
  }

  @ApiOperation({ summary: 'Acknowledge device alarm' })
  @Roles(UserRole.OPERATOR)
  @Post(':id/alarms/:alarmId/ack')
  async ackAlarm(
    @Param('id') deviceId: string,
    @Param('alarmId') alarmId: string,
    @CurrentUser() user: RequestUser,
  ) {
    await this.devicesService.ackAlarm(deviceId, alarmId, user);
    return {
      success: true,
      message: 'Alarm acknowledged successfully',
      timestamp: new Date().toISOString(),
    };
  }

  @ApiOperation({ summary: 'Clear device alarm' })
  @Roles(UserRole.OPERATOR)
  @Post(':id/alarms/:alarmId/clear')
  async clearAlarm(
    @Param('id') deviceId: string,
    @Param('alarmId') alarmId: string,
    @CurrentUser() user: RequestUser,
  ) {
    await this.devicesService.clearAlarm(deviceId, alarmId, user);
    return {
      success: true,
      message: 'Alarm cleared successfully',
      timestamp: new Date().toISOString(),
    };
  }

  // ================================
  // Device Events
  // ================================

  @ApiOperation({ summary: 'Get device events' })
  @Roles(UserRole.VIEWER)
  @Get(':id/events/:eventType')
  async getEvents(
    @Param('id') deviceId: string,
    @Param('eventType') eventType: string,
    @Query('pageSize') pageSize: string | undefined,
    @Query('page') page: string | undefined,
    @Query('startTime') startTime: string | undefined,
    @Query('endTime') endTime: string | undefined,
    @CurrentUser() user: RequestUser,
  ) {
    const data = await this.devicesService.getEvents(deviceId, eventType, user, {
      pageSize: pageSize ? Number(pageSize) : undefined,
      page: page ? Number(page) : undefined,
      startTime: startTime ? Number(startTime) : undefined,
      endTime: endTime ? Number(endTime) : undefined,
    });
    return {
      success: true,
      message: 'Device events retrieved successfully',
      data,
      timestamp: new Date().toISOString(),
    };
  }

  // ================================
  // Device Relations
  // ================================

  @ApiOperation({ summary: 'Get device relations' })
  @Roles(UserRole.VIEWER)
  @Get(':id/relations')
  async getRelations(
    @Param('id') deviceId: string,
    @Query('direction') direction: 'FROM' | 'TO' = 'FROM',
    @CurrentUser() user: RequestUser,
  ) {
    const data = await this.devicesService.getRelations(deviceId, direction, user);
    return {
      success: true,
      message: 'Device relations retrieved successfully',
      data,
      timestamp: new Date().toISOString(),
    };
  }

  @ApiOperation({ summary: 'Save device relation' })
  @Roles(UserRole.PROJECT_MANAGER)
  @Post(':id/relations')
  async saveRelation(
    @Param('id') deviceId: string,
    @Body() relation: any,
    @CurrentUser() user: RequestUser,
  ) {
    await this.devicesService.saveRelation(deviceId, relation, user);
    return {
      success: true,
      message: 'Relation saved successfully',
      timestamp: new Date().toISOString(),
    };
  }

  @ApiOperation({ summary: 'Delete device relation' })
  @Roles(UserRole.PROJECT_MANAGER)
  @Delete(':id/relations')
  async deleteRelation(
    @Param('id') deviceId: string,
    @Query('relationType') relationType: string,
    @Query('toId') toId: string,
    @Query('toType') toType: string,
    @CurrentUser() user: RequestUser,
  ) {
    await this.devicesService.deleteRelation(deviceId, relationType, toId, toType, user);
    return {
      success: true,
      message: 'Relation deleted successfully',
      timestamp: new Date().toISOString(),
    };
  }

  // ================================
  // Audit Logs
  // ================================

  @ApiOperation({ summary: 'Get device audit logs' })
  @Roles(UserRole.VIEWER)
  @Get(':id/audit-logs')
  async getAuditLogs(
    @Param('id') deviceId: string,
    @Query('pageSize') pageSize: string | undefined,
    @Query('page') page: string | undefined,
    @Query('startTime') startTime: string | undefined,
    @Query('endTime') endTime: string | undefined,
    @CurrentUser() user: RequestUser,
  ) {
    const data = await this.devicesService.getAuditLogs(deviceId, user, {
      pageSize: pageSize ? Number(pageSize) : undefined,
      page: page ? Number(page) : undefined,
      startTime: startTime ? Number(startTime) : undefined,
      endTime: endTime ? Number(endTime) : undefined,
    });
    return {
      success: true,
      message: 'Device audit logs retrieved successfully',
      data,
      timestamp: new Date().toISOString(),
    };
  }
}