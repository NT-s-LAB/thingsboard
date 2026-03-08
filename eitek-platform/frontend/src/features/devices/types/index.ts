// Device Types for EITEK Platform
// These match the BE Prisma DeviceType.category values
export type DeviceCategory = 'Gateway' | 'PLC' | 'HMI' | 'Sensor' | 'Actuator' | 'Camera' | 'Custom' | string;

export type DeviceStatus = 'Online' | 'Offline' | 'Error' | 'Maintenance' | 'Unknown';

// Related models from BE
export interface DeviceTypeInfo {
  id: string;
  name: string;
  category: string;
  description?: string;
  metadata?: Record<string, any>;
  isActive?: boolean;
}

export interface AreaInfo {
  id: string;
  name: string;
}

export interface DeviceStateInfo {
  telemetryData?: Record<string, any>;
  attributes?: Record<string, any>;
  alarms?: Record<string, any>;
  lastUpdate?: string;
}

// Main Device interface — matches BE Prisma Device model with includes
export interface Device {
  id: string;
  name: string;
  description?: string;
  tbDeviceId: string;
  tbEntityId?: string;
  serialNumber?: string;
  model?: string;
  firmware?: string;
  metadata?: Record<string, any>;
  isActive: boolean;
  isOnline: boolean;
  lastSeen?: string;
  createdAt: string;
  updatedAt: string;
  areaId: string;
  deviceTypeId: string;
  // Included relations
  area?: AreaInfo;
  deviceType?: DeviceTypeInfo;
  deviceState?: DeviceStateInfo;
}

// Helper to derive display status from Device
export function getDeviceStatus(device: Device): DeviceStatus {
  if (!device.isActive) return 'Maintenance';
  if (device.isOnline) return 'Online';
  return 'Offline';
}

// Helper to get device type display name
export function getDeviceTypeName(device: Device): string {
  return device.deviceType?.name || device.deviceType?.category || 'Unknown';
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

// TB Alarm from API
export interface TbAlarmData {
  id: { id: string; entityType: string };
  createdTime: number;
  name: string;
  type: string;
  originator: { id: string; entityType: string };
  severity: 'CRITICAL' | 'MAJOR' | 'MINOR' | 'WARNING' | 'INDETERMINATE';
  status: string;
  acknowledged: boolean;
  cleared: boolean;
  startTs: number;
  endTs: number;
  ackTs: number;
  clearTs: number;
  details?: any;
}

// TB Device Credentials
export interface DeviceCredentials {
  id: { id: string; entityType: string };
  createdTime: number;
  deviceId: { id: string; entityType: string };
  credentialsType: 'ACCESS_TOKEN' | 'X509_CERTIFICATE' | 'MQTT_BASIC' | 'LWM2M_CREDENTIALS';
  credentialsId: string;
  credentialsValue?: string;
}

// TB Attribute
export interface DeviceAttribute {
  key: string;
  lastUpdateTs: number;
  value: any;
}

// TB Event
export interface DeviceEvent {
  id: { id: string; entityType: string };
  createdTime: number;
  tenantId: { id: string; entityType: string };
  entityId: string;
  serviceId: string;
  body: any;
}

// TB Relation
export interface DeviceRelation {
  from: { id: string; entityType: string };
  to: { id: string; entityType: string };
  type: string;
  typeGroup: string;
  additionalInfo?: any;
}

// TB Audit Log
export interface DeviceAuditLog {
  id: { id: string; entityType: string };
  createdTime: number;
  entityId: { id: string; entityType: string };
  entityName: string;
  userId: { id: string; entityType: string };
  userName: string;
  actionType: string;
  actionData?: any;
  actionStatus: string;
  actionFailureDetails?: string;
}

// TB Paged Response
export interface TbPagedResponse<T> {
  data: T[];
  totalPages: number;
  totalElements: number;
  hasNext: boolean;
}

// Request/Response types for API
export interface DeviceCreateRequest {
  name: string;
  description?: string;
  label?: string;
  areaId: string;
  deviceTypeId?: string;
  deviceProfileId?: string;
  isGateway?: boolean;
  assignedUserId?: string;
  serialNumber?: string;
  model?: string;
  firmware?: string;
  metadata?: Record<string, any>;
  isActive?: boolean;
}

// TB Device Profile for dropdown
export interface TbDeviceProfileOption {
  id: string;
  name: string;
  type?: string;
  transportType?: string;
  description?: string;
  isDefault?: boolean;
}

// User option for assignment dropdown
export interface UserOption {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
}

export interface DeviceUpdateRequest {
  id: string;
  name?: string;
  description?: string;
  areaId?: string;
  deviceTypeId?: string;
  serialNumber?: string;
  model?: string;
  firmware?: string;
  metadata?: Record<string, any>;
  isActive?: boolean;
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
  deviceTypes: string[];
  statuses: DeviceStatus[];
  hasLocation?: boolean | null;
}

export interface DeviceSort {
  field: string;
  direction: 'asc' | 'desc';
}

export interface DeviceSelection {
  selectedIds: string[];
  isAllSelected: boolean;
  isIndeterminate: boolean;
}