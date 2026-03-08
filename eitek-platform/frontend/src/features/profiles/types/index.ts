// Profile types for ThingsBoard Device Profiles and Asset Profiles

export interface TbEntityId {
  entityType: string;
  id: string;
}

// ================================
// Device Profile
// ================================

export interface DeviceProfile {
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
  profileData?: DeviceProfileData;
}

export interface DeviceProfileData {
  configuration?: any;
  transportConfiguration?: any;
  provisionConfiguration?: any;
  alarms?: any[];
}

export interface DeviceProfileCreateRequest {
  name: string;
  description?: string | undefined;
  transportType?: string | undefined;
  provisionType?: string | undefined;
  profileData?: DeviceProfileData | undefined;
}

export interface DeviceProfileUpdateRequest {
  name?: string | undefined;
  description?: string | undefined;
  transportType?: string | undefined;
  provisionType?: string | undefined;
  profileData?: DeviceProfileData | undefined;
}

// ================================
// Asset Profile
// ================================

export interface AssetProfile {
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

export interface AssetProfileCreateRequest {
  name: string;
  description?: string | undefined;
}

export interface AssetProfileUpdateRequest {
  name?: string | undefined;
  description?: string | undefined;
}

// ================================
// Shared types
// ================================

export interface ProfileListResponse<T> {
  data: T[];
  totalPages: number;
  totalElements: number;
  hasNext: boolean;
}

export interface ProfileListParams {
  page?: number | undefined;
  pageSize?: number | undefined;
  textSearch?: string | undefined;
  sortProperty?: string | undefined;
  sortOrder?: 'ASC' | 'DESC' | undefined;
}

export type TransportType = 'DEFAULT' | 'MQTT' | 'COAP' | 'LWM2M' | 'SNMP';
export type ProvisionType = 'DISABLED' | 'ALLOW_CREATE_NEW_DEVICES' | 'CHECK_PRE_PROVISIONED_DEVICES';

export const TRANSPORT_TYPES: { value: TransportType; label: string }[] = [
  { value: 'DEFAULT', label: 'Default' },
  { value: 'MQTT', label: 'MQTT' },
  { value: 'COAP', label: 'CoAP' },
  { value: 'LWM2M', label: 'LwM2M' },
  { value: 'SNMP', label: 'SNMP' },
];

export const PROVISION_TYPES: { value: ProvisionType; label: string }[] = [
  { value: 'DISABLED', label: 'Disabled' },
  { value: 'ALLOW_CREATE_NEW_DEVICES', label: 'Allow create new devices' },
  { value: 'CHECK_PRE_PROVISIONED_DEVICES', label: 'Check pre-provisioned devices' },
];
