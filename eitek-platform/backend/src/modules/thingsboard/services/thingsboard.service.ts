import { Injectable, Logger, HttpException, HttpStatus } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosInstance, AxiosResponse } from 'axios';
import { 
  IThingsBoardService, 
  TBDevice, 
  TBTelemetry, 
  TBAttributes, 
  TBCredentials, 
  TBAlarm,
  TBResponse,
  TBError,
  TBErrorCode,
  TBConfig
} from '../interfaces/thingsboard.interface';

@Injectable()
export class ThingsBoardService implements IThingsBoardService {
  private readonly logger = new Logger(ThingsBoardService.name);
  private readonly httpClient: AxiosInstance;
  private authToken: string | null = null;
  private tokenExpiry: number = 0;
  private readonly config: TBConfig;

  constructor(private readonly configService: ConfigService) {
    this.config = {
      baseUrl: this.configService.get<string>('THINGSBOARD_URL', 'http://localhost:8080'),
      username: this.configService.get<string>('THINGSBOARD_USERNAME', 'tenant@thingsboard.org'),
      password: this.configService.get<string>('THINGSBOARD_PASSWORD', 'tenant'),
      timeout: this.configService.get<number>('THINGSBOARD_TIMEOUT', 30000),
      retryAttempts: this.configService.get<number>('THINGSBOARD_RETRY_ATTEMPTS', 3),
      retryDelay: this.configService.get<number>('THINGSBOARD_RETRY_DELAY', 1000),
      websocketUrl: this.configService.get<string>('THINGSBOARD_WS_URL'),
      enableWebSocket: this.configService.get<boolean>('THINGSBOARD_ENABLE_WS', false),
    };

    this.httpClient = axios.create({
      baseURL: this.config.baseUrl,
      timeout: this.config.timeout,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
    });

    this.setupInterceptors();
  }

  /**
   * Setup axios interceptors for authentication and error handling
   */
  private setupInterceptors(): void {
    // Request interceptor to add auth token
    this.httpClient.interceptors.request.use(
      async (config) => {
        if (this.isTokenExpired()) {
          await this.refreshAuthToken();
        }
        
        if (this.authToken) {
          config.headers['X-Authorization'] = `Bearer ${this.authToken}`;
        }
        
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Response interceptor for error handling
    this.httpClient.interceptors.response.use(
      (response) => response,
      async (error) => {
        if (error.response?.status === 401) {
          // Token expired, try to refresh
          try {
            await this.refreshAuthToken();
            // Retry the original request
            const originalRequest = error.config;
            originalRequest.headers['X-Authorization'] = `Bearer ${this.authToken}`;
            return this.httpClient(originalRequest);
          } catch (authError) {
            this.logger.error('Failed to refresh ThingsBoard token', authError);
            throw new TBError(
              TBErrorCode.AUTHENTICATION_FAILED,
              'Authentication failed',
              authError
            );
          }
        }

        return Promise.reject(this.handleError(error));
      }
    );
  }

  /**
   * Check if current token is expired
   */
  private isTokenExpired(): boolean {
    return !this.authToken || Date.now() >= this.tokenExpiry;
  }

  /**
   * Refresh authentication token
   */
  private async refreshAuthToken(): Promise<void> {
    try {
      await this.login(this.config.username, this.config.password);
    } catch (error) {
      this.logger.error('Failed to refresh ThingsBoard authentication token', error);
      throw new TBError(
        TBErrorCode.AUTHENTICATION_FAILED,
        'Failed to authenticate with ThingsBoard'
      );
    }
  }

  /**
   * Handle axios errors and convert to TBError
   */
  private handleError(error: any): TBError {
    if (error.code === 'ECONNREFUSED') {
      return new TBError(
        TBErrorCode.CONNECTION_TIMEOUT,
        'Connection to ThingsBoard refused',
        error
      );
    }

    if (error.response) {
      const status = error.response.status;
      const message = error.response.data?.message || error.message;

      switch (status) {
        case 401:
          return new TBError(TBErrorCode.AUTHENTICATION_FAILED, message, error);
        case 404:
          return new TBError(TBErrorCode.DEVICE_NOT_FOUND, message, error);
        case 429:
          return new TBError(TBErrorCode.RATE_LIMIT_EXCEEDED, message, error);
        default:
          return new TBError(TBErrorCode.UNKNOWN_ERROR, message, error);
      }
    }

    return new TBError(TBErrorCode.UNKNOWN_ERROR, error.message, error);
  }

  /**
   * Authenticate with ThingsBoard
   */
  async login(username: string, password: string): Promise<string> {
    try {
      const response = await this.httpClient.post('/api/auth/login', {
        username,
        password,
      });

      const { token, refreshToken } = response.data;
      this.authToken = token;
      
      // Set token expiry (typically 15 minutes for ThingsBoard)
      this.tokenExpiry = Date.now() + (15 * 60 * 1000);

      this.logger.log('Successfully authenticated with ThingsBoard');
      return token;
    } catch (error) {
      this.logger.error('Failed to authenticate with ThingsBoard', error);
      throw new TBError(
        TBErrorCode.AUTHENTICATION_FAILED,
        'Failed to authenticate with ThingsBoard'
      );
    }
  }

  /**
   * Refresh token (not typically used with ThingsBoard's stateless JWT)
   */
  async refreshToken(token: string): Promise<string> {
    // ThingsBoard uses stateless JWT, so we just re-authenticate
    return this.login(this.config.username, this.config.password);
  }

  /**
   * Create a new device in ThingsBoard
   */
  async createDevice(device: Partial<TBDevice>): Promise<TBDevice> {
    try {
      const response = await this.httpClient.post('/api/device', device);
      this.logger.log(`Device created in ThingsBoard: ${device.name}`);
      return response.data;
    } catch (error) {
      this.logger.error(`Failed to create device ${device.name}`, error);
      throw this.handleError(error);
    }
  }

  /**
   * Update device in ThingsBoard
   */
  async updateDevice(deviceId: string, device: Partial<TBDevice>): Promise<TBDevice> {
    try {
      const response = await this.httpClient.post(`/api/device`, {
        id: { entityType: 'DEVICE', id: deviceId },
        ...device,
      });
      this.logger.log(`Device updated in ThingsBoard: ${deviceId}`);
      return response.data;
    } catch (error) {
      this.logger.error(`Failed to update device ${deviceId}`, error);
      throw this.handleError(error);
    }
  }

  /**
   * Delete device from ThingsBoard
   */
  async deleteDevice(deviceId: string): Promise<void> {
    try {
      await this.httpClient.delete(`/api/device/${deviceId}`);
      this.logger.log(`Device deleted from ThingsBoard: ${deviceId}`);
    } catch (error) {
      this.logger.error(`Failed to delete device ${deviceId}`, error);
      throw this.handleError(error);
    }
  }

  /**
   * Get device by ID from ThingsBoard
   */
  async getDevice(deviceId: string): Promise<TBDevice> {
    try {
      const response = await this.httpClient.get(`/api/device/${deviceId}`);
      return response.data;
    } catch (error) {
      this.logger.error(`Failed to get device ${deviceId}`, error);
      throw this.handleError(error);
    }
  }

  /**
   * Get devices list from ThingsBoard
   */
  async getDevices(
    pageSize: number = 10, 
    page: number = 0, 
    textSearch?: string
  ): Promise<TBResponse<TBDevice[]>> {
    try {
      const params = new URLSearchParams({
        pageSize: pageSize.toString(),
        page: page.toString(),
      });

      if (textSearch) {
        params.append('textSearch', textSearch);
      }

      const response = await this.httpClient.get(`/api/tenant/devices?${params}`);
      return response.data;
    } catch (error) {
      this.logger.error('Failed to get devices list', error);
      throw this.handleError(error);
    }
  }

  /**
   * Get device credentials
   */
  async getDeviceCredentials(deviceId: string): Promise<TBCredentials> {
    try {
      const response = await this.httpClient.get(`/api/device/${deviceId}/credentials`);
      return response.data;
    } catch (error) {
      this.logger.error(`Failed to get credentials for device ${deviceId}`, error);
      throw this.handleError(error);
    }
  }

  /**
   * Update device credentials
   */
  async updateDeviceCredentials(
    deviceId: string, 
    credentials: Partial<TBCredentials>
  ): Promise<TBCredentials> {
    try {
      const response = await this.httpClient.post(`/api/device/credentials`, {
        deviceId: { entityType: 'DEVICE', id: deviceId },
        ...credentials,
      });
      this.logger.log(`Credentials updated for device ${deviceId}`);
      return response.data;
    } catch (error) {
      this.logger.error(`Failed to update credentials for device ${deviceId}`, error);
      throw this.handleError(error);
    }
  }

  /**
   * Get latest telemetry for device
   */
  async getLatestTelemetry(deviceId: string, keys?: string[]): Promise<TBTelemetry> {
    try {
      const keysParam = keys?.join(',') || '';
      const response = await this.httpClient.get(
        `/api/plugins/telemetry/DEVICE/${deviceId}/values/timeseries?keys=${keysParam}`
      );
      return response.data;
    } catch (error) {
      this.logger.error(`Failed to get telemetry for device ${deviceId}`, error);
      throw this.handleError(error);
    }
  }

  /**
   * Get telemetry history for device
   */
  async getTelemetryHistory(
    deviceId: string,
    keys: string[],
    startTs: number,
    endTs: number,
    interval?: number
  ): Promise<TBTelemetry> {
    try {
      const params = new URLSearchParams({
        keys: keys.join(','),
        startTs: startTs.toString(),
        endTs: endTs.toString(),
      });

      if (interval) {
        params.append('interval', interval.toString());
      }

      const response = await this.httpClient.get(
        `/api/plugins/telemetry/DEVICE/${deviceId}/values/timeseries?${params}`
      );
      return response.data;
    } catch (error) {
      this.logger.error(`Failed to get telemetry history for device ${deviceId}`, error);
      throw this.handleError(error);
    }
  }

  /**
   * Get device attributes
   */
  async getDeviceAttributes(
    deviceId: string, 
    scope: 'CLIENT_SCOPE' | 'SERVER_SCOPE' | 'SHARED_SCOPE' = 'SERVER_SCOPE'
  ): Promise<TBAttributes> {
    try {
      const response = await this.httpClient.get(
        `/api/plugins/telemetry/DEVICE/${deviceId}/values/attributes/${scope}`
      );
      return response.data;
    } catch (error) {
      this.logger.error(`Failed to get attributes for device ${deviceId}`, error);
      throw this.handleError(error);
    }
  }

  /**
   * Update device attributes
   */
  async updateDeviceAttributes(
    deviceId: string,
    scope: string,
    attributes: Record<string, any>
  ): Promise<void> {
    try {
      await this.httpClient.post(
        `/api/plugins/telemetry/DEVICE/${deviceId}/${scope}`,
        attributes
      );
      this.logger.log(`Attributes updated for device ${deviceId}`);
    } catch (error) {
      this.logger.error(`Failed to update attributes for device ${deviceId}`, error);
      throw this.handleError(error);
    }
  }

  /**
   * Send RPC command to device
   */
  async sendRpcCommand(
    deviceId: string,
    method: string,
    params: Record<string, any>,
    timeout: number = 5000
  ): Promise<any> {
    try {
      const response = await this.httpClient.post(
        `/api/plugins/rpc/oneway/${deviceId}`,
        {
          method,
          params,
          timeout,
        }
      );
      this.logger.log(`RPC command sent to device ${deviceId}: ${method}`);
      return response.data;
    } catch (error) {
      this.logger.error(`Failed to send RPC command to device ${deviceId}`, error);
      throw this.handleError(error);
    }
  }

  /**
   * Get device alarms
   */
  async getDeviceAlarms(
    deviceId: string,
    status?: string,
    pageSize: number = 10,
    page: number = 0
  ): Promise<TBResponse<TBAlarm[]>> {
    try {
      const params = new URLSearchParams({
        pageSize: pageSize.toString(),
        page: page.toString(),
      });

      if (status) {
        params.append('status', status);
      }

      const response = await this.httpClient.get(
        `/api/alarm/DEVICE/${deviceId}?${params}`
      );
      return response.data;
    } catch (error) {
      this.logger.error(`Failed to get alarms for device ${deviceId}`, error);
      throw this.handleError(error);
    }
  }

  /**
   * Subscribe to telemetry (WebSocket implementation would go here)
   */
  subscribeToTelemetry(
    deviceId: string,
    keys: string[],
    callback: (data: TBTelemetry) => void
  ): string {
    // TODO: Implement WebSocket subscription
    this.logger.warn('WebSocket subscriptions not yet implemented');
    return 'subscription-id';
  }

  /**
   * Subscribe to attributes (WebSocket implementation would go here)
   */
  subscribeToAttributes(
    deviceId: string,
    callback: (data: TBAttributes) => void
  ): string {
    // TODO: Implement WebSocket subscription
    this.logger.warn('WebSocket subscriptions not yet implemented');
    return 'subscription-id';
  }

  /**
   * Subscribe to alarms (WebSocket implementation would go here)
   */
  subscribeToAlarms(
    entityId: string,
    callback: (alarm: TBAlarm) => void
  ): string {
    // TODO: Implement WebSocket subscription
    this.logger.warn('WebSocket subscriptions not yet implemented');
    return 'subscription-id';
  }

  /**
   * Unsubscribe from updates
   */
  unsubscribe(subscriptionId: string): void {
    // TODO: Implement WebSocket unsubscription
    this.logger.warn('WebSocket subscriptions not yet implemented');
  }
}