import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../../database/prisma.service';
import { ThingsBoardDeviceApiService } from '../../thingsboard-integration/services/device-api.service';
import { ThingsBoardTelemetryApiService } from '../../thingsboard-integration/services/telemetry-api.service';
import { DeviceMapper } from '../../thingsboard-integration/mappers/device.mapper';
import { RealtimeGateway } from '../../realtime/realtime.gateway';

/**
 * DeviceSyncService
 * 
 * NOTE: Global polling has been DISABLED for scalability (1000+ devices).
 * Real-time updates are now handled by:
 * - ThingsBoardWebSocketService: Subscribes to TB's native WebSocket API
 * - DeviceSubscriptionManager: On-demand subscriptions for active viewers
 * 
 * This service now only handles:
 * - Individual device sync on startup/demand
 * - Manual sync requests
 */

@Injectable()
export class DeviceSyncService implements OnModuleInit {
  private readonly logger = new Logger(DeviceSyncService.name);
  private syncIntervals = new Map<string, NodeJS.Timeout>();
  
  // Flag to control global polling (disabled by default for scalability)
  private readonly enableGlobalPolling: boolean;

  constructor(
    private readonly prisma: PrismaService,
    private readonly tbDeviceApi: ThingsBoardDeviceApiService,
    private readonly tbTelemetryApi: ThingsBoardTelemetryApiService,
    private readonly deviceMapper: DeviceMapper,
    private readonly realtimeGateway: RealtimeGateway,
    private readonly configService: ConfigService,
  ) {
    // Only enable global polling if explicitly set (for small deployments)
    this.enableGlobalPolling = this.configService.get<boolean>('ENABLE_GLOBAL_DEVICE_POLLING', false);
  }

  /**
   * On app startup, only sync if global polling is enabled (small deployments).
   * For large deployments, use DeviceSubscriptionManager instead.
   */
  async onModuleInit(): Promise<void> {
    if (this.enableGlobalPolling) {
      this.logger.log('Global device polling ENABLED — running initial sync for all devices...');
      try {
        await this.syncAllDevices();
      } catch (error) {
        this.logger.error(`Initial device sync failed: ${error.message}`);
      }
    } else {
      this.logger.log('Global device polling DISABLED — using on-demand subscriptions via DeviceSubscriptionManager');
    }
  }

  /**
   * Start syncing a device's telemetry data
   */
  async startDeviceSync(deviceId: string, intervalMs = 30000): Promise<void> {
    // Stop existing sync if any
    this.stopDeviceSync(deviceId);

    const device = await this.prisma.device.findUnique({
      where: { id: deviceId },
    });

    if (!device || !device.tbDeviceId) {
      this.logger.warn(`Cannot sync device ${deviceId}: device not found or no TB device ID`);
      return;
    }

    // Initial sync
    await this.syncDeviceData(deviceId, device.tbDeviceId);

    // Set up periodic sync
    const interval = setInterval(async () => {
      try {
        await this.syncDeviceData(deviceId, device.tbDeviceId);
      } catch (error) {
        this.logger.error(`Sync failed for device ${deviceId}: ${error.message}`);
      }
    }, intervalMs);

    this.syncIntervals.set(deviceId, interval);
    this.logger.log(`Device sync started for ${deviceId} (interval: ${intervalMs}ms)`);
  }

  /**
   * Stop syncing a device
   */
  stopDeviceSync(deviceId: string): void {
    const interval = this.syncIntervals.get(deviceId);
    if (interval) {
      clearInterval(interval);
      this.syncIntervals.delete(deviceId);
      this.logger.log(`Device sync stopped for ${deviceId}`);
    }
  }

  /**
   * Sync device data from ThingsBoard to local database
   */
  async syncDeviceData(deviceId: string, tbDeviceId: string): Promise<void> {
    try {
      // Fetch latest telemetry
      const telemetryData = await this.tbTelemetryApi.getLatestTelemetry(tbDeviceId);

      // Fetch client-scope attributes (app data)
      const attributes = await this.tbTelemetryApi.getAttributes(
        tbDeviceId,
        'CLIENT_SCOPE',
      );

      // Fetch SERVER_SCOPE to get ThingsBoard's authoritative connectivity status.
      const serverAttributes = await this.tbTelemetryApi.getAttributes(
        tbDeviceId,
        'SERVER_SCOPE',
        ['active', 'lastActivityTime'],
      );
      const isOnline = serverAttributes['active']?.value === true;
      const lastActivityTime = serverAttributes['lastActivityTime']?.value as number | undefined;

      // Map telemetry data
      const mappedTelemetry = this.deviceMapper.mapTelemetryData(telemetryData);

      // Update device state in local database
      await this.prisma.deviceState.upsert({
        where: { deviceId },
        update: {
          telemetryData: mappedTelemetry,
          attributes: attributes as any,
          lastUpdate: new Date(),
        },
        create: {
          deviceId,
          telemetryData: mappedTelemetry,
          attributes: attributes as any,
          alarms: {},
          lastUpdate: new Date(),
        },
      });

      // Update device online status
      await this.prisma.device.update({
        where: { id: deviceId },
        data: {
          isOnline,
          ...(isOnline ? { lastSeen: new Date() } : {}),
        },
      });

      // Broadcast real-time updates via WebSocket
      this.realtimeGateway.broadcastTelemetry(deviceId, telemetryData);
      this.realtimeGateway.broadcastDeviceStatus(deviceId, {
        isOnline,
        lastActivityTime,
        lastSeen: isOnline ? new Date().toISOString() : undefined,
      });

      this.logger.debug(`Device ${deviceId} synced — isOnline: ${isOnline}`);
    } catch (error) {
      this.logger.error(`Failed to sync device ${deviceId}: ${error.message}`);

      // Mark device as offline if sync fails
      await this.prisma.device.update({
        where: { id: deviceId },
        data: { isOnline: false },
      });

      this.realtimeGateway.broadcastDeviceStatus(deviceId, {
        isOnline: false,
      });
    }
  }

  /**
   * Sync all active devices.
   * NOTE: Global polling is disabled by default for scalability.
   * Set ENABLE_GLOBAL_DEVICE_POLLING=true for small deployments (< 100 devices).
   */
  async syncAllDevices(): Promise<void> {
    if (!this.enableGlobalPolling) {
      this.logger.debug('syncAllDevices called but global polling is disabled');
      return;
    }

    const devices = await this.prisma.device.findMany({
      where: { isActive: true },
      select: { id: true, tbDeviceId: true },
    });

    this.logger.log(`Syncing ${devices.length} devices...`);

    for (const device of devices) {
      if (device.tbDeviceId) {
        try {
          await this.syncDeviceData(device.id, device.tbDeviceId);
        } catch (error) {
          this.logger.error(`Sync failed for device ${device.id}: ${error.message}`);
        }
      }
    }

    this.logger.log('Device sync cycle completed');
  }

  /**
   * Stop all device syncs (cleanup)
   */
  stopAll(): void {
    for (const [deviceId, interval] of this.syncIntervals) {
      clearInterval(interval);
      this.logger.debug(`Sync stopped for device ${deviceId}`);
    }
    this.syncIntervals.clear();
    this.logger.log('All device syncs stopped');
  }
}
