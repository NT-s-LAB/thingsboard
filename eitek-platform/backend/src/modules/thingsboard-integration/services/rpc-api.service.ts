import { Injectable, Logger } from '@nestjs/common';
import { ThingsBoardClientService } from './thingsboard-client.service';
import { TbRpcRequest, TbRpcResponse } from '../interfaces/thingsboard-api.interface';

@Injectable()
export class ThingsBoardRpcApiService {
  private readonly logger = new Logger(ThingsBoardRpcApiService.name);

  constructor(private readonly tbClient: ThingsBoardClientService) {}

  /**
   * Send a one-way RPC command to a device
   */
  async sendOneWayRpc(deviceId: string, method: string, params: any): Promise<TbRpcResponse> {
    const request: TbRpcRequest = {
      method,
      params,
      timeout: 30000,
    };

    try {
      const response = await this.tbClient.sendRpcCommand(deviceId, request);
      this.logger.debug(`RPC command '${method}' sent to device ${deviceId}`);
      return response;
    } catch (error) {
      this.logger.error(`RPC command failed for device ${deviceId}: ${error.message}`);
      throw error;
    }
  }

  /**
   * Send a two-way RPC command to a device and wait for response
   */
  async sendTwoWayRpc(
    deviceId: string,
    method: string,
    params: any,
    timeout = 30000,
  ): Promise<TbRpcResponse> {
    const request: TbRpcRequest = {
      method,
      params,
      timeout,
    };

    try {
      const response = await this.tbClient.sendRpcCommand(deviceId, request);

      if (response.timeout) {
        this.logger.warn(`RPC command '${method}' timed out for device ${deviceId}`);
      } else {
        this.logger.debug(`RPC command '${method}' completed for device ${deviceId}`);
      }

      return response;
    } catch (error) {
      this.logger.error(`Two-way RPC failed for device ${deviceId}: ${error.message}`);
      throw error;
    }
  }

  /**
   * Send a persistent RPC command
   */
  async sendPersistentRpc(
    deviceId: string,
    method: string,
    params: any,
  ): Promise<TbRpcResponse> {
    const request: TbRpcRequest = {
      method,
      params,
      persistent: true,
    };

    try {
      const response = await this.tbClient.sendRpcCommand(deviceId, request);
      this.logger.debug(`Persistent RPC command '${method}' sent to device ${deviceId}`);
      return response;
    } catch (error) {
      this.logger.error(`Persistent RPC failed for device ${deviceId}: ${error.message}`);
      throw error;
    }
  }
}
