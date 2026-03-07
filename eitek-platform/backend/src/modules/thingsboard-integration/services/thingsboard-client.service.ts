import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { IThingsBoardClient, TbDevice, TbTelemetryData, TbAttributeData, TbRpcRequest, TbRpcResponse } from '../interfaces/thingsboard-api.interface';

@Injectable()
export class ThingsBoardClientService implements IThingsBoardClient, OnModuleInit {
  private readonly logger = new Logger(ThingsBoardClientService.name);
  private baseUrl: string;
  private username: string;
  private password: string;
  private accessToken: string | null = null;
  private refreshTokenValue: string | null = null;
  private tokenExpiry = 0;

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {
    this.baseUrl = this.configService.get<string>('THINGSBOARD_URL', 'http://localhost:8080');
    this.username = this.configService.get<string>('THINGSBOARD_USERNAME', 'tenant@thingsboard.org');
    this.password = this.configService.get<string>('THINGSBOARD_PASSWORD', 'tenant');
  }

  async onModuleInit() {
    try {
      await this.login();
      this.logger.log('ThingsBoard client initialized successfully');
    } catch (error) {
      this.logger.warn(`ThingsBoard client initialization failed: ${error.message}. Will retry on first request.`);
    }
  }

  private async ensureAuthenticated(): Promise<void> {
    if (!this.accessToken || Date.now() >= this.tokenExpiry) {
      await this.login();
    }
  }

  private getHeaders() {
    return {
      'Content-Type': 'application/json',
      'X-Authorization': `Bearer ${this.accessToken}`,
    };
  }

  async login(): Promise<string> {
    try {
      const response = await firstValueFrom(
        this.httpService.post(`${this.baseUrl}/api/auth/login`, {
          username: this.username,
          password: this.password,
        }),
      );

      this.accessToken = response.data.token;
      this.refreshTokenValue = response.data.refreshToken;
      // Set expiry to 50 minutes (tokens typically last 60 min)
      this.tokenExpiry = Date.now() + 50 * 60 * 1000;

      this.logger.debug('ThingsBoard authentication successful');
      return this.accessToken;
    } catch (error) {
      this.logger.error(`ThingsBoard login failed: ${error.message}`);
      throw error;
    }
  }

  async refreshToken(): Promise<string> {
    try {
      const response = await firstValueFrom(
        this.httpService.post(`${this.baseUrl}/api/auth/token`, {
          refreshToken: this.refreshTokenValue,
        }),
      );

      this.accessToken = response.data.token;
      this.refreshTokenValue = response.data.refreshToken;
      this.tokenExpiry = Date.now() + 50 * 60 * 1000;

      return this.accessToken;
    } catch (error) {
      this.logger.warn('Token refresh failed, re-authenticating...');
      return this.login();
    }
  }

  async createDevice(device: Partial<TbDevice>): Promise<TbDevice> {
    await this.ensureAuthenticated();
    const response = await firstValueFrom(
      this.httpService.post(`${this.baseUrl}/api/device`, device, {
        headers: this.getHeaders(),
      }),
    );
    return response.data;
  }

  async getDevice(deviceId: string): Promise<TbDevice> {
    await this.ensureAuthenticated();
    const response = await firstValueFrom(
      this.httpService.get(`${this.baseUrl}/api/device/${deviceId}`, {
        headers: this.getHeaders(),
      }),
    );
    return response.data;
  }

  async updateDevice(deviceId: string, device: Partial<TbDevice>): Promise<TbDevice> {
    await this.ensureAuthenticated();
    const response = await firstValueFrom(
      this.httpService.post(`${this.baseUrl}/api/device`, { ...device, id: { id: deviceId, entityType: 'DEVICE' } }, {
        headers: this.getHeaders(),
      }),
    );
    return response.data;
  }

  async deleteDevice(deviceId: string): Promise<void> {
    await this.ensureAuthenticated();
    await firstValueFrom(
      this.httpService.delete(`${this.baseUrl}/api/device/${deviceId}`, {
        headers: this.getHeaders(),
      }),
    );
  }

  async getDevices(pageSize = 100, page = 0): Promise<TbDevice[]> {
    await this.ensureAuthenticated();
    const response = await firstValueFrom(
      this.httpService.get(
        `${this.baseUrl}/api/tenant/devices?pageSize=${pageSize}&page=${page}`,
        { headers: this.getHeaders() },
      ),
    );
    return response.data.data || [];
  }

  async getDeviceTelemetry(
    deviceId: string,
    keys: string[],
    startTs?: number,
    endTs?: number,
  ): Promise<TbTelemetryData> {
    await this.ensureAuthenticated();
    const params: any = { keys: keys.join(',') };
    if (startTs) params.startTs = startTs;
    if (endTs) params.endTs = endTs;

    const response = await firstValueFrom(
      this.httpService.get(
        `${this.baseUrl}/api/plugins/telemetry/DEVICE/${deviceId}/values/timeseries`,
        { headers: this.getHeaders(), params },
      ),
    );
    return response.data;
  }

  async getLatestTelemetry(deviceId: string, keys?: string[]): Promise<TbTelemetryData> {
    await this.ensureAuthenticated();
    const params: any = {};
    if (keys && keys.length) params.keys = keys.join(',');

    const response = await firstValueFrom(
      this.httpService.get(
        `${this.baseUrl}/api/plugins/telemetry/DEVICE/${deviceId}/values/timeseries`,
        { headers: this.getHeaders(), params },
      ),
    );
    return response.data;
  }

  async getDeviceAttributes(
    deviceId: string,
    scope: 'CLIENT_SCOPE' | 'SHARED_SCOPE' | 'SERVER_SCOPE',
    keys?: string[],
  ): Promise<TbAttributeData> {
    await this.ensureAuthenticated();
    const params: any = {};
    if (keys && keys.length) params.keys = keys.join(',');

    const response = await firstValueFrom(
      this.httpService.get(
        `${this.baseUrl}/api/plugins/telemetry/DEVICE/${deviceId}/values/attributes/${scope}`,
        { headers: this.getHeaders(), params },
      ),
    );

    // Convert array response to keyed object
    const result: TbAttributeData = {};
    if (Array.isArray(response.data)) {
      response.data.forEach((attr: any) => {
        result[attr.key] = {
          lastUpdateTs: attr.lastUpdateTs,
          value: attr.value,
        };
      });
    }
    return result;
  }

  async saveDeviceAttributes(
    deviceId: string,
    scope: 'CLIENT_SCOPE' | 'SHARED_SCOPE' | 'SERVER_SCOPE',
    attributes: Record<string, any>,
  ): Promise<void> {
    await this.ensureAuthenticated();
    await firstValueFrom(
      this.httpService.post(
        `${this.baseUrl}/api/plugins/telemetry/DEVICE/${deviceId}/attributes/${scope}`,
        attributes,
        { headers: this.getHeaders() },
      ),
    );
  }

  async sendRpcCommand(deviceId: string, request: TbRpcRequest): Promise<TbRpcResponse> {
    await this.ensureAuthenticated();
    const timeout = request.timeout || 30000;

    try {
      const response = await firstValueFrom(
        this.httpService.post(
          `${this.baseUrl}/api/rpc/oneway/${deviceId}`,
          request,
          { headers: this.getHeaders(), timeout },
        ),
      );
      return {
        requestId: response.data?.requestId || '',
        response: response.data,
        timeout: false,
      };
    } catch (error) {
      if (error.code === 'ECONNABORTED') {
        return { requestId: '', timeout: true, error: 'Request timed out' };
      }
      throw error;
    }
  }

  async subscribeToTelemetry(deviceId: string, keys: string[]): Promise<void> {
    this.logger.debug(`Subscribing to telemetry for device ${deviceId}, keys: ${keys.join(',')}`);
    // WebSocket subscription would be implemented here
  }

  async subscribeToAttributes(deviceId: string, keys: string[]): Promise<void> {
    this.logger.debug(`Subscribing to attributes for device ${deviceId}, keys: ${keys.join(',')}`);
  }

  async unsubscribeFromTelemetry(deviceId: string): Promise<void> {
    this.logger.debug(`Unsubscribing from telemetry for device ${deviceId}`);
  }

  async unsubscribeFromAttributes(deviceId: string): Promise<void> {
    this.logger.debug(`Unsubscribing from attributes for device ${deviceId}`);
  }
}
