import { Injectable, Logger, OnModuleInit, BadGatewayException, NotFoundException, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { IThingsBoardClient, TbDevice, TbDeviceProfile, TbAssetProfile, TbPageData, TbTelemetryData, TbAttributeData, TbRpcRequest, TbRpcResponse, TbDeviceCredentials, TbAlarm, TbEvent, TbRelation, TbAuditLog } from '../interfaces/thingsboard-api.interface';

@Injectable()
export class ThingsBoardClientService implements IThingsBoardClient, OnModuleInit {
  private readonly logger = new Logger(ThingsBoardClientService.name);
  private baseUrl: string;
  private username: string;
  private password: string;
  private accessToken: string | null = null;
  private refreshTokenValue: string | null = null;
  private tokenExpiry = 0;
  private tbTenantId: string | null = null; // ThingsBoard tenant ID from JWT
  private loginPromise: Promise<string> | null = null; // Singleton login guard

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
    if (this.accessToken && Date.now() < this.tokenExpiry) return;
    // Singleton guard: all concurrent callers share the same login() promise
    if (!this.loginPromise) {
      this.loginPromise = this.login().finally(() => { this.loginPromise = null; });
    }
    await this.loginPromise;
  }

  private getHeaders() {
    return {
      'Content-Type': 'application/json',
      'X-Authorization': `Bearer ${this.accessToken}`,
    };
  }

  private async tbRequest<T>(operation: string, fn: () => any): Promise<T> {
    await this.ensureAuthenticated();
    try {
      const response = await firstValueFrom(fn()) as any;
      return response.data;
    } catch (error) {
      const status = error?.response?.status;
      const message = error?.response?.data?.message || error.message || 'Unknown error';
      this.logger.error(`TB API error [${operation}]: ${status || 'N/A'} - ${message}`);

      if (status === 401) {
        this.logger.warn(`Token expired, re-authenticating for [${operation}]...`);
        this.accessToken = null;
        try {
          await this.ensureAuthenticated();
          const retryResponse = await firstValueFrom(fn()) as any;
          return retryResponse.data;
        } catch (retryError) {
          const retryMsg = retryError?.response?.data?.message || retryError.message;
          this.logger.error(`TB API retry failed [${operation}]: ${retryMsg}`);
          throw this.mapTbError(operation, retryError);
        }
      }

      throw this.mapTbError(operation, error);
    }
  }

  private mapTbError(operation: string, error: any): Error {
    const status = error?.response?.status;
    const message = error?.response?.data?.message || error.message || 'Unknown error';
    if (status === 404) {
      return new NotFoundException(`ThingsBoard [${operation}]: ${message}`);
    }
    if (status >= 400 && status < 500) {
      return new BadRequestException(`ThingsBoard [${operation}]: ${message}`);
    }
    return new BadGatewayException(`ThingsBoard service error [${operation}]: ${message}`);
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

      // Extract tenantId from JWT token for API calls that require it
      this.tbTenantId = this.extractTenantIdFromToken(this.accessToken);
      
      this.logger.debug(`ThingsBoard authentication successful (tenantId: ${this.tbTenantId})`);
      return this.accessToken;
    } catch (error) {
      this.logger.error(`ThingsBoard login failed: ${error.message}`);
      throw error;
    }
  }

  /**
   * Extract tenantId from JWT token payload
   */
  private extractTenantIdFromToken(token: string): string | null {
    try {
      const parts = token.split('.');
      if (parts.length !== 3) return null;
      
      const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString('utf8'));
      return payload.tenantId || null;
    } catch (error) {
      this.logger.warn('Failed to extract tenantId from JWT token');
      return null;
    }
  }

  /**
   * Get ThingsBoard tenant ID
   */
  getTenantId(): string | null {
    return this.tbTenantId;
  }

  /**
   * Get current access token (ensures authenticated)
   */
  async getAccessToken(): Promise<string> {
    await this.ensureAuthenticated();
    return this.accessToken!;
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
      
      // Re-extract tenantId from new token
      this.tbTenantId = this.extractTenantIdFromToken(this.accessToken);

      return this.accessToken;
    } catch (error) {
      this.logger.warn('Token refresh failed, re-authenticating...');
      return this.login();
    }
  }

  async createDevice(device: Partial<TbDevice>): Promise<TbDevice> {
    return this.tbRequest<TbDevice>('createDevice', () =>
      this.httpService.post(`${this.baseUrl}/api/device`, device, {
        headers: this.getHeaders(),
      }),
    );
  }

  async getDevice(deviceId: string): Promise<TbDevice> {
    return this.tbRequest<TbDevice>('getDevice', () =>
      this.httpService.get(`${this.baseUrl}/api/device/${deviceId}`, {
        headers: this.getHeaders(),
      }),
    );
  }

  async updateDevice(deviceId: string, device: Partial<TbDevice>): Promise<TbDevice> {
    return this.tbRequest<TbDevice>('updateDevice', () =>
      this.httpService.post(`${this.baseUrl}/api/device`, { ...device, id: { id: deviceId, entityType: 'DEVICE' } }, {
        headers: this.getHeaders(),
      }),
    );
  }

  async deleteDevice(deviceId: string): Promise<void> {
    await this.tbRequest('deleteDevice', () =>
      this.httpService.delete(`${this.baseUrl}/api/device/${deviceId}`, {
        headers: this.getHeaders(),
      }),
    );
  }

  async assignDeviceToCustomer(deviceId: string, customerId: string): Promise<TbDevice> {
    return this.tbRequest<TbDevice>('assignDeviceToCustomer', () =>
      this.httpService.post(
        `${this.baseUrl}/api/customer/${customerId}/device/${deviceId}`,
        {},
        { headers: this.getHeaders() },
      ),
    );
  }

  async unassignDeviceFromCustomer(deviceId: string): Promise<TbDevice> {
    return this.tbRequest<TbDevice>('unassignDeviceFromCustomer', () =>
      this.httpService.delete(
        `${this.baseUrl}/api/customer/device/${deviceId}`,
        { headers: this.getHeaders() },
      ),
    );
  }

  async getDevices(pageSize = 100, page = 0): Promise<TbDevice[]> {
    const result = await this.tbRequest<any>('getDevices', () =>
      this.httpService.get(
        `${this.baseUrl}/api/tenant/devices?pageSize=${pageSize}&page=${page}`,
        { headers: this.getHeaders() },
      ),
    );
    return result?.data || [];
  }

  async getDeviceTelemetry(
    deviceId: string,
    keys: string[],
    startTs?: number,
    endTs?: number,
  ): Promise<TbTelemetryData> {
    const params: any = { keys: keys.join(',') };
    if (startTs) params.startTs = startTs;
    if (endTs) params.endTs = endTs;

    return this.tbRequest<TbTelemetryData>('getDeviceTelemetry', () =>
      this.httpService.get(
        `${this.baseUrl}/api/plugins/telemetry/DEVICE/${deviceId}/values/timeseries`,
        { headers: this.getHeaders(), params },
      ),
    );
  }

  async getLatestTelemetry(deviceId: string, keys?: string[]): Promise<TbTelemetryData> {
    const params: any = {};
    if (keys && keys.length) params.keys = keys.join(',');

    return this.tbRequest<TbTelemetryData>('getLatestTelemetry', () =>
      this.httpService.get(
        `${this.baseUrl}/api/plugins/telemetry/DEVICE/${deviceId}/values/timeseries`,
        { headers: this.getHeaders(), params },
      ),
    );
  }

  async getDeviceAttributes(
    deviceId: string,
    scope: 'CLIENT_SCOPE' | 'SHARED_SCOPE' | 'SERVER_SCOPE',
    keys?: string[],
  ): Promise<TbAttributeData> {
    const params: any = {};
    if (keys && keys.length) params.keys = keys.join(',');

    const data = await this.tbRequest<any>('getDeviceAttributes', () =>
      this.httpService.get(
        `${this.baseUrl}/api/plugins/telemetry/DEVICE/${deviceId}/values/attributes/${scope}`,
        { headers: this.getHeaders(), params },
      ),
    );

    // Convert array response to keyed object
    const result: TbAttributeData = {};
    if (Array.isArray(data)) {
      data.forEach((attr: any) => {
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
    await this.tbRequest('saveDeviceAttributes', () =>
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

    console.log('\n╔════════════════════════════════════════════════╗');
    console.log('║        SENDING RPC TO THINGSBOARD             ║');
    console.log('╠════════════════════════════════════════════════╣');
    console.log('TB Device ID:', deviceId);
    console.log('RPC Request:', JSON.stringify(request, null, 2));
    console.log('URL:', `${this.baseUrl}/api/rpc/oneway/${deviceId}`);
    console.log('╚════════════════════════════════════════════════╝\n');

    try {
      const response = await firstValueFrom(
        this.httpService.post(
          `${this.baseUrl}/api/rpc/oneway/${deviceId}`,
          request,
          { headers: this.getHeaders(), timeout },
        ),
      );
      console.log('✅ TB RPC Response:', JSON.stringify(response.data, null, 2));
      return {
        requestId: response.data?.requestId || '',
        response: response.data,
        timeout: false,
      };
    } catch (error) {
      console.log('❌ TB RPC Error:', error.message);
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

  // ================================
  // Device Profile Management
  // ================================

  async getDeviceProfiles(pageSize = 100, page = 0, textSearch?: string, sortProperty = 'name', sortOrder = 'ASC'): Promise<TbPageData<TbDeviceProfile>> {
    const params: any = { pageSize, page, sortProperty, sortOrder };
    if (textSearch) params.textSearch = textSearch;

    return this.tbRequest<TbPageData<TbDeviceProfile>>('getDeviceProfiles', () =>
      this.httpService.get(`${this.baseUrl}/api/deviceProfiles`, {
        headers: this.getHeaders(),
        params,
      }),
    );
  }

  async getDeviceProfile(deviceProfileId: string): Promise<TbDeviceProfile> {
    return this.tbRequest<TbDeviceProfile>('getDeviceProfile', () =>
      this.httpService.get(`${this.baseUrl}/api/deviceProfile/${deviceProfileId}`, {
        headers: this.getHeaders(),
      }),
    );
  }

  async saveDeviceProfile(profile: Partial<TbDeviceProfile>): Promise<TbDeviceProfile> {
    return this.tbRequest<TbDeviceProfile>('saveDeviceProfile', () =>
      this.httpService.post(`${this.baseUrl}/api/deviceProfile`, profile, {
        headers: this.getHeaders(),
      }),
    );
  }

  async deleteDeviceProfile(deviceProfileId: string): Promise<void> {
    await this.tbRequest('deleteDeviceProfile', () =>
      this.httpService.delete(`${this.baseUrl}/api/deviceProfile/${deviceProfileId}`, {
        headers: this.getHeaders(),
      }),
    );
  }

  // ================================
  // Asset Profile Management
  // ================================

  async getAssetProfiles(pageSize = 100, page = 0, textSearch?: string, sortProperty = 'name', sortOrder = 'ASC'): Promise<TbPageData<TbAssetProfile>> {
    const params: any = { pageSize, page, sortProperty, sortOrder };
    if (textSearch) params.textSearch = textSearch;

    return this.tbRequest<TbPageData<TbAssetProfile>>('getAssetProfiles', () =>
      this.httpService.get(`${this.baseUrl}/api/assetProfiles`, {
        headers: this.getHeaders(),
        params,
      }),
    );
  }

  async getAssetProfile(assetProfileId: string): Promise<TbAssetProfile> {
    return this.tbRequest<TbAssetProfile>('getAssetProfile', () =>
      this.httpService.get(`${this.baseUrl}/api/assetProfile/${assetProfileId}`, {
        headers: this.getHeaders(),
      }),
    );
  }

  async saveAssetProfile(profile: Partial<TbAssetProfile>): Promise<TbAssetProfile> {
    return this.tbRequest<TbAssetProfile>('saveAssetProfile', () =>
      this.httpService.post(`${this.baseUrl}/api/assetProfile`, profile, {
        headers: this.getHeaders(),
      }),
    );
  }

  async deleteAssetProfile(assetProfileId: string): Promise<void> {
    await this.tbRequest('deleteAssetProfile', () =>
      this.httpService.delete(`${this.baseUrl}/api/assetProfile/${assetProfileId}`, {
        headers: this.getHeaders(),
      }),
    );
  }

  // ================================
  // Device Credentials
  // ================================

  async getDeviceCredentials(deviceId: string): Promise<TbDeviceCredentials> {
    return this.tbRequest<TbDeviceCredentials>('getDeviceCredentials', () =>
      this.httpService.get(`${this.baseUrl}/api/device/${deviceId}/credentials`, {
        headers: this.getHeaders(),
      }),
    );
  }

  async saveDeviceCredentials(credentials: Partial<TbDeviceCredentials>): Promise<TbDeviceCredentials> {
    return this.tbRequest<TbDeviceCredentials>('saveDeviceCredentials', () =>
      this.httpService.post(`${this.baseUrl}/api/device/credentials`, credentials, {
        headers: this.getHeaders(),
      }),
    );
  }

  // ================================
  // Device Alarms
  // ================================

  async getAlarms(params: {
    entityType?: string;
    entityId?: string;
    pageSize?: number;
    page?: number;
    textSearch?: string;
    sortProperty?: string;
    sortOrder?: string;
    startTime?: number;
    endTime?: number;
    searchStatus?: string;
    severityList?: string[];
    typeList?: string[];
    statusList?: string[];
  } = {}): Promise<TbPageData<TbAlarm>> {
    const queryParams: any = {
      pageSize: params.pageSize || 20,
      page: params.page || 0,
      sortProperty: params.sortProperty || 'createdTime',
      sortOrder: params.sortOrder || 'DESC',
    };
    if (params.textSearch) queryParams.textSearch = params.textSearch;
    if (params.startTime) queryParams.startTime = params.startTime;
    if (params.endTime) queryParams.endTime = params.endTime;
    if (params.searchStatus) queryParams.searchStatus = params.searchStatus;
    if (params.severityList?.length) queryParams.severityList = params.severityList.join(',');
    if (params.typeList?.length) queryParams.typeList = params.typeList.join(',');
    if (params.statusList?.length) queryParams.statusList = params.statusList.join(',');

    let url = `${this.baseUrl}/api/alarms`;
    if (params.entityType && params.entityId) {
      url = `${this.baseUrl}/api/alarm/${params.entityType}/${params.entityId}`;
    }

    return this.tbRequest<TbPageData<TbAlarm>>('getAlarms', () =>
      this.httpService.get(url, { headers: this.getHeaders(), params: queryParams }),
    );
  }

  async getAlarmById(alarmId: string): Promise<TbAlarm> {
    return this.tbRequest<TbAlarm>('getAlarmById', () =>
      this.httpService.get(`${this.baseUrl}/api/alarm/${alarmId}`, {
        headers: this.getHeaders(),
      }),
    );
  }

  async ackAlarm(alarmId: string): Promise<void> {
    await this.tbRequest('ackAlarm', () =>
      this.httpService.post(`${this.baseUrl}/api/alarm/${alarmId}/ack`, {}, {
        headers: this.getHeaders(),
      }),
    );
  }

  async clearAlarm(alarmId: string): Promise<void> {
    await this.tbRequest('clearAlarm', () =>
      this.httpService.post(`${this.baseUrl}/api/alarm/${alarmId}/clear`, {}, {
        headers: this.getHeaders(),
      }),
    );
  }

  async deleteAlarm(alarmId: string): Promise<void> {
    await this.tbRequest('deleteAlarm', () =>
      this.httpService.delete(`${this.baseUrl}/api/alarm/${alarmId}`, {
        headers: this.getHeaders(),
      }),
    );
  }

  // ================================
  // Device Events
  // ================================

  async getEvents(entityType: string, entityId: string, eventType: string, params: {
    pageSize?: number;
    page?: number;
    sortProperty?: string;
    sortOrder?: string;
    startTime?: number;
    endTime?: number;
    tenantId?: string;
  } = {}): Promise<TbPageData<TbEvent>> {
    const queryParams: any = {
      pageSize: params.pageSize || 20,
      page: params.page || 0,
      sortProperty: params.sortProperty || 'createdTime',
      sortOrder: params.sortOrder || 'DESC',
    };
    if (params.startTime) queryParams.startTime = params.startTime;
    if (params.endTime) queryParams.endTime = params.endTime;
    
    // Use provided tenantId or fall back to auto-extracted from JWT
    const tenantId = params.tenantId || this.tbTenantId;
    if (tenantId) {
      queryParams.tenantId = tenantId;
    }

    return this.tbRequest<TbPageData<TbEvent>>('getEvents', () =>
      this.httpService.get(
        `${this.baseUrl}/api/events/${entityType}/${entityId}/${eventType}`,
        { headers: this.getHeaders(), params: queryParams },
      ),
    );
  }

  // ================================
  // Relations
  // ================================

  async getRelations(entityId: string, entityType: string, direction: 'FROM' | 'TO' = 'FROM', relationType?: string): Promise<TbRelation[]> {
    const params: any = {};
    if (relationType) params.relationType = relationType;

    return this.tbRequest<TbRelation[]>('getRelations', () =>
      this.httpService.get(
        `${this.baseUrl}/api/relations?fromId=${entityId}&fromType=${entityType}`,
        { headers: this.getHeaders(), params },
      ),
    );
  }

  async saveRelation(relation: TbRelation): Promise<void> {
    await this.tbRequest('saveRelation', () =>
      this.httpService.post(`${this.baseUrl}/api/relation`, relation, {
        headers: this.getHeaders(),
      }),
    );
  }

  async deleteRelation(fromId: string, fromType: string, relationType: string, toId: string, toType: string): Promise<void> {
    await this.tbRequest('deleteRelation', () =>
      this.httpService.delete(
        `${this.baseUrl}/api/relation?fromId=${fromId}&fromType=${fromType}&relationType=${relationType}&toId=${toId}&toType=${toType}`,
        { headers: this.getHeaders() },
      ),
    );
  }

  // ================================
  // Audit Logs
  // ================================

  async getAuditLogsByEntityId(entityType: string, entityId: string, params: {
    pageSize?: number;
    page?: number;
    sortProperty?: string;
    sortOrder?: string;
    startTime?: number;
    endTime?: number;
    actionTypes?: string[];
  } = {}): Promise<TbPageData<TbAuditLog>> {
    const queryParams: any = {
      pageSize: params.pageSize || 20,
      page: params.page || 0,
      sortProperty: params.sortProperty || 'createdTime',
      sortOrder: params.sortOrder || 'DESC',
    };
    if (params.startTime) queryParams.startTime = params.startTime;
    if (params.endTime) queryParams.endTime = params.endTime;
    if (params.actionTypes?.length) queryParams.actionTypes = params.actionTypes.join(',');

    return this.tbRequest<TbPageData<TbAuditLog>>('getAuditLogsByEntityId', () =>
      this.httpService.get(
        `${this.baseUrl}/api/audit/logs/entity/${entityType}/${entityId}`,
        { headers: this.getHeaders(), params: queryParams },
      ),
    );
  }

  // ================================
  // Delete Attributes
  // ================================

  async deleteDeviceAttributes(
    deviceId: string,
    scope: 'CLIENT_SCOPE' | 'SHARED_SCOPE' | 'SERVER_SCOPE',
    keys: string[],
  ): Promise<void> {
    await this.tbRequest('deleteDeviceAttributes', () =>
      this.httpService.delete(
        `${this.baseUrl}/api/plugins/telemetry/DEVICE/${deviceId}/attributes/${scope}?keys=${keys.join(',')}`,
        { headers: this.getHeaders() },
      ),
    );
  }

  // ================================
  // Timeseries with aggregation
  // ================================

  async getTimeseries(
    deviceId: string,
    keys: string[],
    startTs: number,
    endTs: number,
    params: {
      interval?: number;
      limit?: number;
      agg?: string;
      orderBy?: string;
    } = {},
  ): Promise<TbTelemetryData> {
    const queryParams: any = {
      keys: keys.join(','),
      startTs,
      endTs,
    };
    if (params.interval) queryParams.interval = params.interval;
    if (params.limit) queryParams.limit = params.limit;
    if (params.agg) queryParams.agg = params.agg;
    if (params.orderBy) queryParams.orderBy = params.orderBy;

    return this.tbRequest<TbTelemetryData>('getTimeseries', () =>
      this.httpService.get(
        `${this.baseUrl}/api/plugins/telemetry/DEVICE/${deviceId}/values/timeseries`,
        { headers: this.getHeaders(), params: queryParams },
      ),
    );
  }
}
