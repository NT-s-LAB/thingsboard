import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service';
import { CreateDeviceDto } from '../dto/create-device.dto';
import { UpdateDeviceDto } from '../dto/update-device.dto';
import { PaginationDto, PaginatedResult } from '../../../common/dto/pagination.dto';
import { RequestUser } from '../../../common/interfaces/common.interface';
import { ThingsBoardDeviceApiService } from '../../thingsboard-integration/services/device-api.service';
import { ThingsBoardClientService } from '../../thingsboard-integration/services/thingsboard-client.service';
import { DeviceSyncService } from './device-sync.service';
import { Device } from '@prisma/client';

@Injectable()
export class DevicesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tbDeviceApi: ThingsBoardDeviceApiService,
    private readonly tbClient: ThingsBoardClientService,
    private readonly deviceSync: DeviceSyncService,
  ) {}

  async create(createDeviceDto: CreateDeviceDto, user: RequestUser): Promise<Device> {
    // Validate area belongs to user's tenant
    const area = await this.prisma.area.findFirst({
      where: {
        id: createDeviceDto.areaId,
        site: {
          project: {
            tenantId: user.tenantId,
          },
        },
      },
    });

    if (!area) {
      throw new NotFoundException('Area not found or access denied');
    }

    // Validate device type exists
    const deviceType = await this.prisma.deviceType.findUnique({
      where: { id: createDeviceDto.deviceTypeId },
    });

    if (!deviceType) {
      throw new NotFoundException('Device type not found');
    }

    // Check if device name already exists in area
    const existingDevice = await this.prisma.device.findFirst({
      where: {
        name: createDeviceDto.name,
        areaId: createDeviceDto.areaId,
      },
    });

    if (existingDevice) {
      throw new BadRequestException('Device name already exists in this area');
    }

    try {
      // Create device in ThingsBoard first
      const tbDevice = await this.tbDeviceApi.createDevice({
        name: createDeviceDto.name,
        type: deviceType.name,
        label: createDeviceDto.description,
      });

      // Create device in our database
      const device = await this.prisma.device.create({
        data: {
          name: createDeviceDto.name,
          description: createDeviceDto.description,
          tbDeviceId: tbDevice.id.id,
          tbEntityId: tbDevice.id.entityType + ':' + tbDevice.id.id,
          serialNumber: createDeviceDto.serialNumber,
          model: createDeviceDto.model,
          firmware: createDeviceDto.firmware,
          metadata: createDeviceDto.metadata || {},
          isActive: createDeviceDto.isActive ?? true,
          areaId: createDeviceDto.areaId,
          deviceTypeId: createDeviceDto.deviceTypeId,
        },
        include: {
          area: true,
          deviceType: true,
        },
      });

      // Initialize device state
      await this.prisma.deviceState.create({
        data: {
          deviceId: device.id,
          telemetryData: {},
          attributes: {},
          alarms: {},
        },
      });

      // Start sync process for real-time data
      await this.deviceSync.startDeviceSync(device.id);

      return device;
    } catch (error) {
      // If ThingsBoard creation fails, don't create in our database
      if (error.response?.status) {
        throw new BadRequestException(
          `Failed to create device in ThingsBoard: ${error.message}`,
        );
      }
      throw error;
    }
  }

  async findAll(
    pagination: PaginationDto,
    user: RequestUser,
  ): Promise<PaginatedResult<Device>> {
    const page = pagination.page;
    const limit = pagination.effectiveLimit;
    const offset = pagination.offset;
    const search = pagination.effectiveSearch;
    const sortBy = pagination.effectiveSortBy;
    const sortOrder = pagination.effectiveSortOrder;

    // Build where clause for user's tenant
    const where: any = {
      area: {
        site: {
          project: {
            tenantId: user.tenantId,
          },
        },
      },
    };

    // Add search filter
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { serialNumber: { contains: search, mode: 'insensitive' } },
        { model: { contains: search, mode: 'insensitive' } },
      ];
    }

    // Build order by clause
    const orderBy: any = {};
    if (sortBy) {
      orderBy[sortBy] = sortOrder;
    } else {
      orderBy.createdAt = 'desc';
    }

    const [devices, total] = await Promise.all([
      this.prisma.device.findMany({
        where,
        include: {
          area: {
            select: { id: true, name: true },
          },
          deviceType: {
            select: { id: true, name: true, category: true },
          },
          deviceState: {
            select: { telemetryData: true, lastUpdate: true },
          },
        },
        skip: offset,
        take: limit,
        orderBy,
      }),
      this.prisma.device.count({ where }),
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
      data: devices,
      pagination: {
        total,
        page,
        limit,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
    };
  }

  async findOne(id: string, user: RequestUser): Promise<Device> {
    const device = await this.prisma.device.findFirst({
      where: {
        id,
        area: {
          site: {
            project: {
              tenantId: user.tenantId,
            },
          },
        },
      },
      include: {
        area: {
          include: {
            site: {
              include: {
                project: true,
              },
            },
          },
        },
        deviceType: true,
        deviceState: true,
      },
    });

    if (!device) {
      throw new NotFoundException('Device not found or access denied');
    }

    return device;
  }

  async update(
    id: string,
    updateDeviceDto: UpdateDeviceDto,
    user: RequestUser,
  ): Promise<Device> {
    const device = await this.findOne(id, user);

    // If changing area, validate the new area
    if (updateDeviceDto.areaId && updateDeviceDto.areaId !== device.areaId) {
      const area = await this.prisma.area.findFirst({
        where: {
          id: updateDeviceDto.areaId,
          site: {
            project: {
              tenantId: user.tenantId,
            },
          },
        },
      });

      if (!area) {
        throw new NotFoundException('New area not found or access denied');
      }
    }

    // If changing device type, validate the new type
    if (updateDeviceDto.deviceTypeId && updateDeviceDto.deviceTypeId !== device.deviceTypeId) {
      const deviceType = await this.prisma.deviceType.findUnique({
        where: { id: updateDeviceDto.deviceTypeId },
      });

      if (!deviceType) {
        throw new NotFoundException('New device type not found');
      }
    }

    // Check for name conflicts if name is being changed
    if (updateDeviceDto.name && updateDeviceDto.name !== device.name) {
      const areaId = updateDeviceDto.areaId || device.areaId;
      const existingDevice = await this.prisma.device.findFirst({
        where: {
          name: updateDeviceDto.name,
          areaId,
          id: { not: id },
        },
      });

      if (existingDevice) {
        throw new BadRequestException('Device name already exists in this area');
      }
    }

    try {
      // Update device in ThingsBoard if relevant fields changed
      if (updateDeviceDto.name || updateDeviceDto.description) {
        await this.tbDeviceApi.updateDevice(device.tbDeviceId, {
          name: updateDeviceDto.name || device.name,
          label: updateDeviceDto.description || device.description,
        });
      }

      // Update device in our database
      return await this.prisma.device.update({
        where: { id },
        data: {
          name: updateDeviceDto.name,
          description: updateDeviceDto.description,
          serialNumber: updateDeviceDto.serialNumber,
          model: updateDeviceDto.model,
          firmware: updateDeviceDto.firmware,
          metadata: updateDeviceDto.metadata,
          isActive: updateDeviceDto.isActive,
          areaId: updateDeviceDto.areaId,
          deviceTypeId: updateDeviceDto.deviceTypeId,
        },
        include: {
          area: true,
          deviceType: true,
          deviceState: true,
        },
      });
    } catch (error) {
      if (error.response?.status) {
        throw new BadRequestException(
          `Failed to update device in ThingsBoard: ${error.message}`,
        );
      }
      throw error;
    }
  }

  async remove(id: string, user: RequestUser): Promise<void> {
    const device = await this.findOne(id, user);

    try {
      // Delete from ThingsBoard first
      await this.tbDeviceApi.deleteDevice(device.tbDeviceId);

      // Stop sync process
      await this.deviceSync.stopDeviceSync(device.id);

      // Delete from our database (cascade will handle device_state)
      await this.prisma.device.delete({
        where: { id },
      });
    } catch (error) {
      if (error.response?.status) {
        throw new BadRequestException(
          `Failed to delete device from ThingsBoard: ${error.message}`,
        );
      }
      throw error;
    }
  }

  async getTelemetry(
    deviceId: string,
    keys?: string[],
    user?: RequestUser,
  ): Promise<any> {
    const device = await this.findOne(deviceId, user);
    
    // Get real-time data from ThingsBoard
    return await this.tbDeviceApi.getDeviceTelemetry(device.tbDeviceId, keys);
  }

  async sendRpc(
    deviceId: string,
    method: string,
    params: any,
    user: RequestUser,
  ): Promise<any> {
    const device = await this.findOne(deviceId, user);
    
    // Send RPC command through ThingsBoard
    return await this.tbDeviceApi.sendRpcCommand(device.tbDeviceId, method, params);
  }

  // ================================
  // Device Credentials
  // ================================

  async getCredentials(deviceId: string, user: RequestUser): Promise<any> {
    const device = await this.findOne(deviceId, user);
    return await this.tbClient.getDeviceCredentials(device.tbDeviceId);
  }

  async saveCredentials(deviceId: string, credentials: any, user: RequestUser): Promise<any> {
    await this.findOne(deviceId, user);
    return await this.tbClient.saveDeviceCredentials(credentials);
  }

  // ================================
  // Device Attributes
  // ================================

  async getAttributes(
    deviceId: string,
    scope: 'CLIENT_SCOPE' | 'SHARED_SCOPE' | 'SERVER_SCOPE',
    user: RequestUser,
    keys?: string[],
  ): Promise<any> {
    const device = await this.findOne(deviceId, user);
    return await this.tbClient.getDeviceAttributes(device.tbDeviceId, scope, keys);
  }

  async saveAttributes(
    deviceId: string,
    scope: 'CLIENT_SCOPE' | 'SHARED_SCOPE' | 'SERVER_SCOPE',
    attributes: Record<string, any>,
    user: RequestUser,
  ): Promise<void> {
    const device = await this.findOne(deviceId, user);
    await this.tbClient.saveDeviceAttributes(device.tbDeviceId, scope, attributes);
  }

  async deleteAttributes(
    deviceId: string,
    scope: 'CLIENT_SCOPE' | 'SHARED_SCOPE' | 'SERVER_SCOPE',
    keys: string[],
    user: RequestUser,
  ): Promise<void> {
    const device = await this.findOne(deviceId, user);
    await this.tbClient.deleteDeviceAttributes(device.tbDeviceId, scope, keys);
  }

  // ================================
  // Device Telemetry (enhanced)
  // ================================

  async getLatestTelemetry(deviceId: string, user: RequestUser, keys?: string[]): Promise<any> {
    const device = await this.findOne(deviceId, user);
    return await this.tbClient.getLatestTelemetry(device.tbDeviceId, keys);
  }

  async getTimeseries(
    deviceId: string,
    keys: string[],
    startTs: number,
    endTs: number,
    user: RequestUser,
    params?: { interval?: number; limit?: number; agg?: string; orderBy?: string },
  ): Promise<any> {
    const device = await this.findOne(deviceId, user);
    return await this.tbClient.getTimeseries(device.tbDeviceId, keys, startTs, endTs, params);
  }

  // ================================
  // Device Alarms
  // ================================

  async getAlarms(deviceId: string, user: RequestUser, params: {
    pageSize?: number;
    page?: number;
    searchStatus?: string;
    severityList?: string[];
    typeList?: string[];
    startTime?: number;
    endTime?: number;
  } = {}): Promise<any> {
    const device = await this.findOne(deviceId, user);
    return await this.tbClient.getAlarms({
      entityType: 'DEVICE',
      entityId: device.tbDeviceId,
      ...params,
    });
  }

  async ackAlarm(deviceId: string, alarmId: string, user: RequestUser): Promise<void> {
    await this.findOne(deviceId, user);
    await this.tbClient.ackAlarm(alarmId);
  }

  async clearAlarm(deviceId: string, alarmId: string, user: RequestUser): Promise<void> {
    await this.findOne(deviceId, user);
    await this.tbClient.clearAlarm(alarmId);
  }

  // ================================
  // Device Events
  // ================================

  async getEvents(deviceId: string, eventType: string, user: RequestUser, params: {
    pageSize?: number;
    page?: number;
    startTime?: number;
    endTime?: number;
  } = {}): Promise<any> {
    const device = await this.findOne(deviceId, user);
    return await this.tbClient.getEvents('DEVICE', device.tbDeviceId, eventType, params);
  }

  // ================================
  // Device Relations
  // ================================

  async getRelations(deviceId: string, direction: 'FROM' | 'TO', user: RequestUser): Promise<any> {
    const device = await this.findOne(deviceId, user);
    return await this.tbClient.getRelations(device.tbDeviceId, 'DEVICE', direction);
  }

  async saveRelation(deviceId: string, relation: any, user: RequestUser): Promise<void> {
    await this.findOne(deviceId, user);
    await this.tbClient.saveRelation(relation);
  }

  async deleteRelation(
    deviceId: string,
    relationType: string,
    toId: string,
    toType: string,
    user: RequestUser,
  ): Promise<void> {
    const device = await this.findOne(deviceId, user);
    await this.tbClient.deleteRelation(device.tbDeviceId, 'DEVICE', relationType, toId, toType);
  }

  // ================================
  // Audit Logs
  // ================================

  async getAuditLogs(deviceId: string, user: RequestUser, params: {
    pageSize?: number;
    page?: number;
    startTime?: number;
    endTime?: number;
    actionTypes?: string[];
  } = {}): Promise<any> {
    const device = await this.findOne(deviceId, user);
    return await this.tbClient.getAuditLogsByEntityId('DEVICE', device.tbDeviceId, params);
  }
}