export interface TbEntityId {
  entityType: string;
  id: string;
}

export interface TbDevice {
  id: TbEntityId;
  createdTime: number;
  tenantId: TbEntityId;
  customerId?: TbEntityId;
  name: string;
  type: string;
  label?: string;
  deviceProfileId: TbEntityId;
  deviceData?: {
    configuration?: any;
    transportConfiguration?: any;
  };
  additionalInfo?: any;
}

export interface TbTelemetryData {
  [key: string]: Array<{
    ts: number;
    value: string;
  }>;
}

export interface TbAttributeData {
  [key: string]: {
    lastUpdateTs: number;
    value: any;
  };
}

export interface TbRpcRequest {
  method: string;
  params: any;
  timeout?: number;
  persistent?: boolean;
}

export interface TbRpcResponse {
  requestId: string;
  response?: any;
  error?: string;
  timeout: boolean;
}

export interface IThingsBoardClient {
  // Authentication
  login(): Promise<string>;
  refreshToken(): Promise<string>;

  // Device management
  createDevice(device: Partial<TbDevice>): Promise<TbDevice>;
  getDevice(deviceId: string): Promise<TbDevice>;
  updateDevice(deviceId: string, device: Partial<TbDevice>): Promise<TbDevice>;
  deleteDevice(deviceId: string): Promise<void>;
  getDevices(pageSize?: number, page?: number): Promise<TbDevice[]>;

  // Telemetry
  getDeviceTelemetry(
    deviceId: string,
    keys: string[],
    startTs?: number,
    endTs?: number,
  ): Promise<TbTelemetryData>;

  getLatestTelemetry(deviceId: string, keys?: string[]): Promise<TbTelemetryData>;

  // Attributes
  getDeviceAttributes(
    deviceId: string,
    scope: 'CLIENT_SCOPE' | 'SHARED_SCOPE' | 'SERVER_SCOPE',
    keys?: string[],
  ): Promise<TbAttributeData>;

  saveDeviceAttributes(
    deviceId: string,
    scope: 'CLIENT_SCOPE' | 'SHARED_SCOPE' | 'SERVER_SCOPE',
    attributes: Record<string, any>,
  ): Promise<void>;

  // RPC
  sendRpcCommand(deviceId: string, request: TbRpcRequest): Promise<TbRpcResponse>;

  // Real-time subscriptions
  subscribeToTelemetry(deviceId: string, keys: string[]): Promise<void>;
  subscribeToAttributes(deviceId: string, keys: string[]): Promise<void>;
  unsubscribeFromTelemetry(deviceId: string): Promise<void>;
  unsubscribeFromAttributes(deviceId: string): Promise<void>;
}