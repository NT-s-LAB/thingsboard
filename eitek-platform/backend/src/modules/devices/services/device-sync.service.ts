import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service';
import { ThingsBoardDeviceApiService } from '../../thingsboard-integration/services/device-api.service';
import { ThingsBoardTelemetryApiService } from '../../thingsboard-integration/services/telemetry-api.service';
import { DeviceMapper } from '../../thingsboard-integration/mappers/device.mapper';

@Injectable()
export class DeviceSyncService {
  private readonly logger = new Logger(DeviceSyncService.name);
  private syncIntervals = new Map<string, NodeJS.Timeout>();

  constructor(
    private readonly prisma: PrismaService,
    private readonly tbDeviceApi: ThingsBoardDeviceApiService,
    private readonly tbTelemetryApi: ThingsBoardTelemetryApiService,
    private readonly deviceMapper: DeviceMapper,
  ) {}

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

      // Fetch device attributes
      const attributes = await this.tbTelemetryApi.getAttributes(
        tbDeviceId,
        'CLIENT_SCOPE',
      );

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
          isOnline: true,
          lastSeen: new Date(),
        },
      });

      this.logger.debug(`Device ${deviceId} synced successfully`);
    } catch (error) {
      this.logger.error(`Failed to sync device ${deviceId}: ${error.message}`);

      // Mark device as offline if sync fails
      await this.prisma.device.update({
        where: { id: deviceId },
        data: { isOnline: false },
      });
    }
  }

  /**
   * Sync all active devices
   */
  async syncAllDevices(): Promise<void> {
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
