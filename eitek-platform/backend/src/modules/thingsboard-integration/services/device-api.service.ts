import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { ThingsBoardClientService } from './thingsboard-client.service';
import { TbDevice } from '../interfaces/thingsboard-api.interface';

@Injectable()
export class ThingsBoardDeviceApiService {
  private readonly logger = new Logger(ThingsBoardDeviceApiService.name);

  constructor(private readonly tbClient: ThingsBoardClientService) {}

  /**
   * Create a device in ThingsBoard
   */
  async createDevice(deviceData: {
    name: string;
    type: string;
    label?: string;
    additionalInfo?: any;
  }): Promise<TbDevice> {
    try {
      const device = await this.tbClient.createDevice({
        name: deviceData.name,
        type: deviceData.type,
        label: deviceData.label,
        additionalInfo: deviceData.additionalInfo,
      } as Partial<TbDevice>);

      this.logger.log(`Device created in ThingsBoard: ${device.id.id}`);
      return device;
    } catch (error) {
      this.logger.error(`Failed to create device in ThingsBoard: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get a device from ThingsBoard
   */
  async getDevice(deviceId: string): Promise<TbDevice> {
    try {
      return await this.tbClient.getDevice(deviceId);
    } catch (error) {
      if (error.response?.status === 404) {
        throw new NotFoundException(`Device not found in ThingsBoard: ${deviceId}`);
      }
      throw error;
    }
  }

  /**
   * Update a device in ThingsBoard
   */
  async updateDevice(deviceId: string, deviceData: Partial<TbDevice>): Promise<TbDevice> {
    try {
      const device = await this.tbClient.updateDevice(deviceId, deviceData);
      this.logger.log(`Device updated in ThingsBoard: ${deviceId}`);
      return device;
    } catch (error) {
      this.logger.error(`Failed to update device in ThingsBoard: ${error.message}`);
      throw error;
    }
  }

  /**
   * Delete a device from ThingsBoard
   */
  async deleteDevice(deviceId: string): Promise<void> {
    try {
      await this.tbClient.deleteDevice(deviceId);
      this.logger.log(`Device deleted from ThingsBoard: ${deviceId}`);
    } catch (error) {
      this.logger.error(`Failed to delete device from ThingsBoard: ${error.message}`);
      throw error;
    }
  }

  /**
   * List all tenant devices from ThingsBoard
   */
  async listDevices(pageSize = 100, page = 0): Promise<TbDevice[]> {
    return this.tbClient.getDevices(pageSize, page);
  }

  /**
   * Get device credentials from ThingsBoard
   */
  async getDeviceCredentials(deviceId: string): Promise<any> {
    try {
      // Uses the client's HTTP directly for non-standard endpoint
      const device = await this.tbClient.getDevice(deviceId);
      return device;
    } catch (error) {
      this.logger.error(`Failed to get device credentials: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get latest telemetry data for a device from ThingsBoard
   */
  async getDeviceTelemetry(deviceId: string, keys?: string[]): Promise<any> {
    try {
      return await this.tbClient.getLatestTelemetry(deviceId, keys);
    } catch (error) {
      this.logger.error(`Failed to get device telemetry: ${error.message}`);
      throw error;
    }
  }

  /**
   * Send an RPC command to a device through ThingsBoard
   */
  async sendRpcCommand(deviceId: string, method: string, params: any): Promise<any> {
    try {
      return await this.tbClient.sendRpcCommand(deviceId, { method, params });
    } catch (error) {
      this.logger.error(`Failed to send RPC command: ${error.message}`);
      throw error;
    }
  }
}
