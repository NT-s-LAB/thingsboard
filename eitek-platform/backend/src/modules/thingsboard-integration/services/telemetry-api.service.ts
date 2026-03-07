import { Injectable, Logger } from '@nestjs/common';
import { ThingsBoardClientService } from './thingsboard-client.service';
import { TbTelemetryData, TbAttributeData } from '../interfaces/thingsboard-api.interface';

@Injectable()
export class ThingsBoardTelemetryApiService {
  private readonly logger = new Logger(ThingsBoardTelemetryApiService.name);

  constructor(private readonly tbClient: ThingsBoardClientService) {}

  /**
   * Get telemetry data for a device
   */
  async getTelemetry(
    deviceId: string,
    keys: string[],
    startTs?: number,
    endTs?: number,
  ): Promise<TbTelemetryData> {
    try {
      return await this.tbClient.getDeviceTelemetry(deviceId, keys, startTs, endTs);
    } catch (error) {
      this.logger.error(`Failed to get telemetry for device ${deviceId}: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get latest telemetry data for a device
   */
  async getLatestTelemetry(deviceId: string, keys?: string[]): Promise<TbTelemetryData> {
    try {
      return await this.tbClient.getLatestTelemetry(deviceId, keys);
    } catch (error) {
      this.logger.error(`Failed to get latest telemetry for device ${deviceId}: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get device attributes
   */
  async getAttributes(
    deviceId: string,
    scope: 'CLIENT_SCOPE' | 'SHARED_SCOPE' | 'SERVER_SCOPE' = 'CLIENT_SCOPE',
    keys?: string[],
  ): Promise<TbAttributeData> {
    try {
      return await this.tbClient.getDeviceAttributes(deviceId, scope, keys);
    } catch (error) {
      this.logger.error(`Failed to get attributes for device ${deviceId}: ${error.message}`);
      throw error;
    }
  }

  /**
   * Save device attributes
   */
  async saveAttributes(
    deviceId: string,
    scope: 'CLIENT_SCOPE' | 'SHARED_SCOPE' | 'SERVER_SCOPE',
    attributes: Record<string, any>,
  ): Promise<void> {
    try {
      await this.tbClient.saveDeviceAttributes(deviceId, scope, attributes);
      this.logger.debug(`Attributes saved for device ${deviceId}`);
    } catch (error) {
      this.logger.error(`Failed to save attributes for device ${deviceId}: ${error.message}`);
      throw error;
    }
  }

  /**
   * Subscribe to device telemetry updates
   */
  async subscribeTelemetry(deviceId: string, keys: string[]): Promise<void> {
    await this.tbClient.subscribeToTelemetry(deviceId, keys);
  }

  /**
   * Subscribe to device attribute updates
   */
  async subscribeAttributes(deviceId: string, keys: string[]): Promise<void> {
    await this.tbClient.subscribeToAttributes(deviceId, keys);
  }

  /**
   * Unsubscribe from device telemetry updates
   */
  async unsubscribeTelemetry(deviceId: string): Promise<void> {
    await this.tbClient.unsubscribeFromTelemetry(deviceId);
  }

  /**
   * Unsubscribe from device attribute updates
   */
  async unsubscribeAttributes(deviceId: string): Promise<void> {
    await this.tbClient.unsubscribeFromAttributes(deviceId);
  }
}
