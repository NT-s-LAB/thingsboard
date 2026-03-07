// Device Types for EITEK Platform
export type DeviceType = 'Gateway' | 'PLC' | 'HMI' | 'Sensor' | 'Actuator' | 'Camera' | 'Custom';

export type DeviceStatus = 'Online' | 'Offline' | 'Error' | 'Maintenance' | 'Unknown';

export type ConnectionType = 'Modbus' | 'Ethernet/IP' | 'OPC UA' | 'MQTT' | 'HTTP' | 'TCP/IP' | 'Serial' | 'CAN';

export interface DeviceAttribute {
  id: string;
  key: string;
  value: any;
  type: 'string' | 'number' | 'boolean' | 'json' | 'date';
  lastUpdate: string;
  isPublic: boolean;
}

export interface DeviceTelemetry {
  id: string;
  key: string;
  value: any;
  timestamp: string;
  dataType: 'string' | 'number' | 'boolean' | 'json';
}

export interface DeviceCredentials {
  id: string;
  deviceId: string;
  credentialsType: 'ACCESS_TOKEN' | 'X509_CERTIFICATE' | 'MQTT_BASIC';
  credentialsValue: string;
  createdTime: string;
}

export interface DeviceProfile {
  id: string;
  name: string;
  description?: string;
  deviceType: DeviceType;
  transportType: ConnectionType;
  firmwareId?: string;
  softwareId?: string;
  defaultDashboardId?: string;
  defaultRuleChainId?: string;
  isDefault: boolean;
  provisioning: {
    type: 'DISABLED' | 'ALLOW_CREATE_NEW_DEVICES' | 'CHECK_PRE_PROVISIONED_DEVICES';
    provisionDeviceSecret?: string;
  };
  configuration: {
    alarms?: any[];
    deviceConfiguration?: any;
    transportConfiguration?: any;
  };
  createdTime: string;
}

export interface Device {
  id: string;
  name: string;
  label: string;
  deviceProfileId: string;
  deviceProfile?: DeviceProfile;
  customerId?: string;
  ownerId: string;
  type: DeviceType;
  status: DeviceStatus;
  lastConnectTime?: string;
  lastDisconnectTime?: string;
  lastActivityTime?: string;
  connectionType: ConnectionType;
  firmwareVersion?: string;
  softwareVersion?: string;
  additionalInfo: {
    gateway?: boolean;
    description?: string;
    location?: {
      latitude?: number;
      longitude?: number;
      address?: string;
    };
  };
  attributes: DeviceAttribute[];
  telemetry: DeviceTelemetry[];
  credentials?: DeviceCredentials;
  createdTime: string;
  updatedTime: string;
}

export interface DeviceGroup {
  id: string;
  name: string;
  description?: string;
  type: 'STATIC' | 'DYNAMIC';
  devices: Device[];
  filterConditions?: {
    deviceTypes?: DeviceType[];
    statuses?: DeviceStatus[];
    attributeFilters?: Array<{
      key: string;
      operation: 'EQUAL' | 'NOT_EQUAL' | 'GREATER' | 'LESS' | 'CONTAINS';
      value: any;
    }>;
  };
  createdTime: string;
  updatedTime: string;
}

export interface DeviceCommand {
  id: string;
  deviceId: string;
  commandType: 'RPC' | 'ATTRIBUTE_UPDATE' | 'TELEMETRY_UPDATE';
  method: string;
  params: any;
  status: 'PENDING' | 'SUCCESS' | 'ERROR' | 'TIMEOUT';
  response?: any;
  error?: string;
  timestamp: string;
  timeout?: number;
}

export interface DeviceAlarm {
  id: string;
  deviceId: string;
  deviceName: string;
  type: string;
  severity: 'CRITICAL' | 'MAJOR' | 'MINOR' | 'WARNING' | 'INDETERMINATE';
  status: 'ACTIVE' | 'ACKNOWLEDGED' | 'CLEARED';
  startTime: string;
  endTime?: string;
  acknowledgeTime?: string;
  clearTime?: string;
  details: any;
  propagate: boolean;
}

// Request/Response types for API
export interface DeviceCreateRequest {
  name: string;
  label: string;
  deviceProfileId: string;
  type: DeviceType;
  connectionType: ConnectionType;
  additionalInfo?: Device['additionalInfo'];
  customerId?: string;
}

export interface DeviceUpdateRequest {
  id: string;
  name?: string;
  label?: string;
  additionalInfo?: Device['additionalInfo'];
}

export interface DeviceListResponse {
  data: Device[];
  totalPages: number;
  totalElements: number;
  hasNext: boolean;
}

export interface DeviceListParams {
  page?: number;
  pageSize?: number;
  sortProperty?: string;
  sortOrder?: 'ASC' | 'DESC';
  textSearch?: string;
  deviceTypes?: DeviceType[];
  statuses?: DeviceStatus[];
}

export interface AttributeUpdateRequest {
  deviceId: string;
  scope: 'SERVER_SCOPE' | 'CLIENT_SCOPE' | 'SHARED_SCOPE';
  attributes: Record<string, any>;
}

export interface TelemetryRequest {
  deviceId: string;
  keys: string[];
  startTs?: number;
  endTs?: number;
  interval?: number;
  limit?: number;
  agg?: 'NONE' | 'MIN' | 'MAX' | 'AVG' | 'SUM' | 'COUNT';
}

export interface DeviceRpcRequest {
  deviceId: string;
  method: string;
  params: any;
  timeout?: number;
  persistent?: boolean;
  retries?: number;
}

// UI State types
export interface DeviceFilters {
  search: string;
  deviceTypes: DeviceType[];
  statuses: DeviceStatus[];
  connectionTypes: ConnectionType[];
  hasLocation: boolean | null;
  lastActivityFrom?: string;
  lastActivityTo?: string;
}

export interface DeviceSort {
  field: keyof Device;
  direction: 'asc' | 'desc';
}

export interface DeviceSelection {
  selectedIds: string[];
  isAllSelected: boolean;
  isIndeterminate: boolean;
}