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

export interface TbDeviceProfile {
  id?: TbEntityId;
  createdTime?: number;
  tenantId?: TbEntityId;
  name: string;
  description?: string;
  image?: string;
  type?: string;
  transportType?: string;
  provisionType?: string;
  defaultRuleChainId?: TbEntityId;
  defaultDashboardId?: TbEntityId;
  defaultQueueName?: string;
  firmwareId?: TbEntityId;
  softwareId?: TbEntityId;
  default?: boolean;
  profileData?: {
    configuration?: any;
    transportConfiguration?: any;
    provisionConfiguration?: any;
    alarms?: any[];
  };
}

export interface TbAssetProfile {
  id?: TbEntityId;
  createdTime?: number;
  tenantId?: TbEntityId;
  name: string;
  description?: string;
  image?: string;
  default?: boolean;
  defaultRuleChainId?: TbEntityId;
  defaultDashboardId?: TbEntityId;
  defaultQueueName?: string;
}

export interface TbPageData<T> {
  data: T[];
  totalPages: number;
  totalElements: number;
  hasNext: boolean;
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

export interface TbDeviceCredentials {
  id: TbEntityId;
  createdTime: number;
  deviceId: TbEntityId;
  credentialsType: 'ACCESS_TOKEN' | 'X509_CERTIFICATE' | 'MQTT_BASIC' | 'LWM2M_CREDENTIALS';
  credentialsId: string;
  credentialsValue?: string | undefined;
}

export interface TbAlarm {
  id: TbEntityId;
  createdTime: number;
  tenantId: TbEntityId;
  customerId?: TbEntityId | undefined;
  name: string;
  type: string;
  originator: TbEntityId;
  severity: 'CRITICAL' | 'MAJOR' | 'MINOR' | 'WARNING' | 'INDETERMINATE';
  status: 'ACTIVE_UNACK' | 'ACTIVE_ACK' | 'CLEARED_UNACK' | 'CLEARED_ACK';
  acknowledged: boolean;
  cleared: boolean;
  startTs: number;
  endTs: number;
  ackTs: number;
  clearTs: number;
  assigneeId?: TbEntityId | undefined;
  propagate: boolean;
  propagateToOwner: boolean;
  propagateToTenant: boolean;
  propagateRelationTypes?: string[] | undefined;
  details?: any;
}

export interface TbEvent {
  id: TbEntityId;
  createdTime: number;
  tenantId: TbEntityId;
  entityId: string;
  serviceId: string;
  body: any;
}

export interface TbRelation {
  from: TbEntityId;
  to: TbEntityId;
  type: string;
  typeGroup: string;
  additionalInfo?: any;
}

export interface TbAuditLog {
  id: TbEntityId;
  createdTime: number;
  tenantId: TbEntityId;
  customerId?: TbEntityId | undefined;
  entityId: TbEntityId;
  entityName: string;
  userId: TbEntityId;
  userName: string;
  actionType: string;
  actionData?: any;
  actionStatus: string;
  actionFailureDetails?: string | undefined;
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