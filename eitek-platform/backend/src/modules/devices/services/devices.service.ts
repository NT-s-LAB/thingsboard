import {
  Injectable,
  Logger,
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
import { TenantAddonService } from '../../addons/tenant-addon.service';
import { Device } from '@prisma/client';

@Injectable()
export class DevicesService {
  private readonly logger = new Logger(DevicesService.name);

  // In-memory cache for device online status (TTL-based)
  private statusCache = new Map<string, { data: { isOnline: boolean; lastActivityTime?: number }; expiry: number }>();
  private readonly STATUS_CACHE_TTL = 10_000; // 10 seconds
  private readonly BATCH_SIZE = 30; // Max concurrent TB API calls per batch

  constructor(
    private readonly prisma: PrismaService,
    private readonly tbDeviceApi: ThingsBoardDeviceApiService,
    private readonly tbClient: ThingsBoardClientService,
    private readonly tenantAddonService: TenantAddonService,
  ) {}

  /**
   * Fetch real-time online status for a batch of devices from ThingsBoard.
   * Uses batching (max BATCH_SIZE concurrent) and caching (TTL-based) to avoid
   * overwhelming ThingsBoard API at scale (1000+ devices).
   */
  private async fetchRealtimeStatus(
    tbDeviceIds: string[],
  ): Promise<Map<string, { isOnline: boolean; lastActivityTime?: number }>> {
    const statusMap = new Map<string, { isOnline: boolean; lastActivityTime?: number }>();
    if (!tbDeviceIds.length) return statusMap;

    const now = Date.now();
    const uncachedIds: string[] = [];

    // Return cached entries, collect uncached IDs
    for (const tbId of tbDeviceIds) {
      const cached = this.statusCache.get(tbId);
      if (cached && cached.expiry > now) {
        statusMap.set(tbId, cached.data);
      } else {
        uncachedIds.push(tbId);
      }
    }

    if (uncachedIds.length === 0) return statusMap;

    // Process in batches of BATCH_SIZE to avoid overwhelming TB
    for (let i = 0; i < uncachedIds.length; i += this.BATCH_SIZE) {
      const batch = uncachedIds.slice(i, i + this.BATCH_SIZE);
      const results = await Promise.allSettled(
        batch.map(async (tbId) => {
          const attrs = await this.tbClient.getDeviceAttributes(tbId, 'SERVER_SCOPE', [
            'active',
            'lastActivityTime',
          ]);
          return {
            tbId,
            isOnline: attrs['active']?.value === true,
            lastActivityTime: attrs['lastActivityTime']?.value as number | undefined,
          };
        }),
      );

      for (const result of results) {
        if (result.status === 'fulfilled') {
          const { tbId, ...data } = result.value;
          statusMap.set(tbId, data);
          this.statusCache.set(tbId, { data, expiry: now + this.STATUS_CACHE_TTL });
        }
      }
    }

    return statusMap;
  }

  async create(createDeviceDto: CreateDeviceDto, user: RequestUser): Promise<Device> {
    // Check tenant quota before creating
    await this.tenantAddonService.checkQuota(user.tenantId, 'DEVICES');

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

    // Resolve device type: use provided deviceTypeId or auto-create from TB profile
    let deviceTypeId = createDeviceDto.deviceTypeId;
    let deviceTypeName = '';

    if (createDeviceDto.deviceProfileId) {
      // Fetch TB profile to get name
      const tbProfile = await this.tbClient.getDeviceProfile(createDeviceDto.deviceProfileId);
      deviceTypeName = tbProfile.name;

      if (!deviceTypeId) {
        // Auto-create or find local DeviceType from TB profile
        let localType = await this.prisma.deviceType.findUnique({
          where: { name: tbProfile.name },
        });
        if (!localType) {
          localType = await this.prisma.deviceType.create({
            data: {
              name: tbProfile.name,
              category: tbProfile.type || 'DEFAULT',
              description: tbProfile.description || `Auto-created from ThingsBoard profile: ${tbProfile.name}`,
            },
          });
        }
        deviceTypeId = localType.id;
      }
    }

    if (!deviceTypeId) {
      throw new BadRequestException('Either deviceTypeId or deviceProfileId must be provided');
    }

    // Validate device type exists if directly provided
    if (!createDeviceDto.deviceProfileId && createDeviceDto.deviceTypeId) {
      const deviceType = await this.prisma.deviceType.findUnique({
        where: { id: deviceTypeId },
      });
      if (!deviceType) {
        throw new NotFoundException('Device type not found');
      }
      deviceTypeName = deviceType.name;
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
      // Build ThingsBoard device payload
      const tbDevicePayload: any = {
        name: createDeviceDto.name,
        type: deviceTypeName,
        label: createDeviceDto.label || createDeviceDto.description || '',
      };

      // Set device profile if provided
      if (createDeviceDto.deviceProfileId) {
        tbDevicePayload.deviceProfileId = {
          entityType: 'DEVICE_PROFILE',
          id: createDeviceDto.deviceProfileId,
        };
      }

      // Set gateway flag
      if (createDeviceDto.isGateway) {
        tbDevicePayload.additionalInfo = {
          ...(tbDevicePayload.additionalInfo || {}),
          gateway: true,
        };
      }

      // Create device in ThingsBoard
      const tbDevice = await this.tbClient.createDevice(tbDevicePayload);

      // Assign to customer/user in ThingsBoard if requested
      if (createDeviceDto.assignedUserId) {
        const assignedUser = await this.prisma.user.findUnique({
          where: { id: createDeviceDto.assignedUserId },
        });
        if (assignedUser?.tbUserId) {
          await this.tbClient.assignDeviceToCustomer(tbDevice.id.id, assignedUser.tbUserId);
        }
      }

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
          metadata: {
            ...(createDeviceDto.metadata || {}),
            isGateway: createDeviceDto.isGateway || false,
            deviceProfileId: createDeviceDto.deviceProfileId,
            assignedUserId: createDeviceDto.assignedUserId,
          },
          isActive: createDeviceDto.isActive ?? true,
          areaId: createDeviceDto.areaId,
          deviceTypeId: deviceTypeId,
        },
        include: {
          area: true,
          deviceType: true,
        },
      });

      return device;
    } catch (error) {
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
        },
        skip: offset,
        take: limit,
        orderBy,
      }),
      this.prisma.device.count({ where }),
    ]);

    // Enrich with real-time online status from ThingsBoard
    const tbDeviceIds = devices
      .filter((d) => d.tbDeviceId)
      .map((d) => d.tbDeviceId);

    const statusMap = await this.fetchRealtimeStatus(tbDeviceIds);

    const enrichedDevices = devices.map((device) => {
      const status = statusMap.get(device.tbDeviceId);
      if (status) {
        return {
          ...device,
          isOnline: status.isOnline,
          ...(status.lastActivityTime
            ? { lastSeen: new Date(status.lastActivityTime) }
            : {}),
        };
      }
      return device;
    });

    const totalPages = Math.ceil(total / limit);

    return {
      data: enrichedDevices,
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
    // Try to find by internal ID first, then fallback to tbDeviceId
    const device = await this.prisma.device.findFirst({
      where: {
        OR: [
          { id },
          { tbDeviceId: id },
        ],
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
      },
    });

    if (!device) {
      throw new NotFoundException('Device not found or access denied');
    }

    // Enrich with real-time online status from ThingsBoard
    if (device.tbDeviceId) {
      try {
        const statusMap = await this.fetchRealtimeStatus([device.tbDeviceId]);
        const status = statusMap.get(device.tbDeviceId);
        if (status) {
          return {
            ...device,
            isOnline: status.isOnline,
            ...(status.lastActivityTime
              ? { lastSeen: new Date(status.lastActivityTime) }
              : {}),
          } as Device;
        }
      } catch {
        // Fall through to DB value if TB is unreachable
      }
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