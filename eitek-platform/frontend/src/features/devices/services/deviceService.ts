import { apiClient } from '@/shared/services/api';
import type { 
  Device, 
  DeviceListResponse, 
  DeviceListParams, 
  DeviceCreateRequest, 
  DeviceUpdateRequest,
  DeviceAttribute,
  DeviceTelemetry,
  AttributeUpdateRequest,
  TelemetryRequest,
  DeviceRpcRequest,
  DeviceCommand,
  DeviceAlarm,
  DeviceProfile,
  DeviceGroup
} from '../types';

class DeviceService {
  // Device CRUD operations
  async getDevices(params: DeviceListParams = {}): Promise<DeviceListResponse> {
    const queryParams = new URLSearchParams();
    
    if (params.page !== undefined) queryParams.append('page', params.page.toString());
    if (params.pageSize !== undefined) queryParams.append('pageSize', params.pageSize.toString());
    if (params.sortProperty) queryParams.append('sortProperty', params.sortProperty);
    if (params.sortOrder) queryParams.append('sortOrder', params.sortOrder);
    if (params.textSearch) queryParams.append('textSearch', params.textSearch);
    if (params.deviceTypes?.length) {
      params.deviceTypes.forEach(type => queryParams.append('deviceType', type));
    }
    if (params.statuses?.length) {
      params.statuses.forEach(status => queryParams.append('status', status));
    }

    const response = await apiClient.get<DeviceListResponse>(`/devices?${queryParams.toString()}`);
    return response;
  }

  async getDevice(id: string): Promise<Device> {
    const response = await apiClient.get<Device>(`/devices/${id}`);
    return response;
  }

  async createDevice(data: DeviceCreateRequest): Promise<Device> {
    const response = await apiClient.post<Device>('/devices', data);
    return response;
  }

  async updateDevice(data: DeviceUpdateRequest): Promise<Device> {
    const response = await apiClient.put<Device>(`/devices/${data.id}`, data);
    return response;
  }

  async deleteDevice(id: string): Promise<void> {
    await apiClient.delete(`/devices/${id}`);
  }

  async deleteDevices(ids: string[]): Promise<void> {
    await apiClient.post<void>('/devices/bulk-delete', { deviceIds: ids });
  }

  // Device credentials
  async getDeviceCredentials(deviceId: string) {
    const response = await apiClient.get<any>(`/devices/${deviceId}/credentials`);
    return response;
  }

  async updateDeviceCredentials(deviceId: string, credentials: any) {
    const response = await apiClient.post<any>(`/devices/${deviceId}/credentials`, credentials);
    return response;
  }

  // Device attributes
  async getDeviceAttributes(deviceId: string, scope: 'SERVER_SCOPE' | 'CLIENT_SCOPE' | 'SHARED_SCOPE' = 'SERVER_SCOPE'): Promise<DeviceAttribute[]> {
    const response = await apiClient.get<DeviceAttribute[]>(`/devices/${deviceId}/attributes/${scope}`);
    return response;
  }

  async updateDeviceAttributes(request: AttributeUpdateRequest): Promise<void> {
    await apiClient.post<void>(`/devices/${request.deviceId}/attributes/${request.scope}`, request.attributes);
  }

  async deleteDeviceAttributes(deviceId: string, scope: string, keys: string[]): Promise<void> {
    const queryParams = new URLSearchParams();
    keys.forEach(key => queryParams.append('keys', key));
    await apiClient.delete(`/devices/${deviceId}/attributes/${scope}?${queryParams.toString()}`);
  }

  // Device telemetry
  async getDeviceTelemetry(request: TelemetryRequest): Promise<Record<string, DeviceTelemetry[]>> {
    const queryParams = new URLSearchParams();
    request.keys.forEach(key => queryParams.append('keys', key));
    if (request.startTs) queryParams.append('startTs', request.startTs.toString());
    if (request.endTs) queryParams.append('endTs', request.endTs.toString());
    if (request.interval) queryParams.append('interval', request.interval.toString());
    if (request.limit) queryParams.append('limit', request.limit.toString());
    if (request.agg) queryParams.append('agg', request.agg);

    const response = await apiClient.get<Record<string, DeviceTelemetry[]>>(`/devices/${request.deviceId}/telemetry?${queryParams.toString()}`);
    return response;
  }

  async getLatestTelemetry(deviceId: string, keys?: string[]): Promise<Record<string, DeviceTelemetry>> {
    const queryParams = new URLSearchParams();
    if (keys?.length) {
      keys.forEach(key => queryParams.append('keys', key));
    }
    
    const response = await apiClient.get<Record<string, DeviceTelemetry>>(`/devices/${deviceId}/telemetry/latest?${queryParams.toString()}`);
    return response;
  }

  async saveTelemetry(deviceId: string, data: Record<string, any>): Promise<void> {
    await apiClient.post<void>(`/devices/${deviceId}/telemetry`, data);
  }

  // Device RPC
  async sendRpcCommand(request: DeviceRpcRequest): Promise<any> {
    const response = await apiClient.post<any>(`/devices/${request.deviceId}/rpc`, {
      method: request.method,
      params: request.params,
      timeout: request.timeout || 5000,
      persistent: request.persistent || false,
      retries: request.retries || 0
    });
    return response;
  }

  async getRpcCommands(deviceId: string, page = 0, pageSize = 20): Promise<{ data: DeviceCommand[], totalElements: number }> {
    const response = await apiClient.get<{ data: DeviceCommand[], totalElements: number }>(`/devices/${deviceId}/rpc?page=${page}&pageSize=${pageSize}`);
    return response;
  }

  // Device alarms
  async getDeviceAlarms(deviceId: string, page = 0, pageSize = 20): Promise<{ data: DeviceAlarm[], totalElements: number }> {
    const response = await apiClient.get<{ data: DeviceAlarm[], totalElements: number }>(`/devices/${deviceId}/alarms?page=${page}&pageSize=${pageSize}`);
    return response;
  }

  async acknowledgeAlarm(alarmId: string): Promise<void> {
    await apiClient.post<void>(`/alarms/${alarmId}/ack`);
  }

  async clearAlarm(alarmId: string): Promise<void> {
    await apiClient.post<void>(`/alarms/${alarmId}/clear`);
  }

  // Device profiles
  async getDeviceProfiles(page = 0, pageSize = 50): Promise<{ data: DeviceProfile[], totalElements: number }> {
    const response = await apiClient.get<{ data: DeviceProfile[], totalElements: number }>(`/device-profiles?page=${page}&pageSize=${pageSize}`);
    return response;
  }

  async getDeviceProfile(id: string): Promise<DeviceProfile> {
    const response = await apiClient.get<DeviceProfile>(`/deviceProfiles/${id}`);
    return response;
  }

  async createDeviceProfile(profile: Omit<DeviceProfile, 'id' | 'createdTime'>): Promise<DeviceProfile> {
    const response = await apiClient.post<DeviceProfile>('/deviceProfiles', profile);
    return response;
  }

  async updateDeviceProfile(profile: DeviceProfile): Promise<DeviceProfile> {
    const response = await apiClient.put<DeviceProfile>(`/deviceProfiles/${profile.id}`, profile);
    return response;
  }

  async deleteDeviceProfile(id: string): Promise<void> {
    await apiClient.delete(`/deviceProfiles/${id}`);
  }

  // Device groups
  async getDeviceGroups(): Promise<DeviceGroup[]> {
    const response = await apiClient.get<DeviceGroup[]>('/device-groups');
    return response;
  }

  async createDeviceGroup(group: Omit<DeviceGroup, 'id' | 'createdTime' | 'updatedTime'>): Promise<DeviceGroup> {
    const response = await apiClient.post<DeviceGroup>('/device-groups', group);
    return response;
  }

  async updateDeviceGroup(group: DeviceGroup): Promise<DeviceGroup> {
    const response = await apiClient.put<DeviceGroup>(`/device-groups/${group.id}`, group);
    return response;
  }

  async deleteDeviceGroup(id: string): Promise<void> {
    await apiClient.delete(`/device-groups/${id}`);
  }

  async addDevicesToGroup(groupId: string, deviceIds: string[]): Promise<void> {
    await apiClient.post<void>(`/device-groups/${groupId}/devices`, { deviceIds });
  }

  async removeDevicesFromGroup(groupId: string, deviceIds: string[]): Promise<void> {
    await apiClient.post<void>(`/device-groups/${groupId}/devices/remove`, { deviceIds });
  }

  // Device connectivity
  async checkDeviceConnectivity(deviceId: string): Promise<{ isConnected: boolean, lastSeen?: string }> {
    const response = await apiClient.get<{ isConnected: boolean, lastSeen?: string }>(`/devices/${deviceId}/connectivity`);
    return response;
  }

  async getDeviceStatus(deviceId: string): Promise<{ status: string, info: any }> {
    const response = await apiClient.get<{ status: string, info: any }>(`/devices/${deviceId}/status`);
    return response;
  }

  // Bulk operations
  async bulkUpdateDevices(deviceIds: string[], updates: Partial<Device>): Promise<void> {
    await apiClient.put<void>('/devices/bulk', { deviceIds, updates });
  }

  async assignDevicesToCustomer(deviceIds: string[], customerId: string): Promise<void> {
    await apiClient.post<void>('/devices/assign-customer', { deviceIds, customerId });
  }

  async unassignDevicesFromCustomer(deviceIds: string[]): Promise<void> {
    await apiClient.post<void>('/devices/unassign-customer', { deviceIds });
  }

  // Import/Export
  async exportDevices(deviceIds?: string[]): Promise<Blob> {
    const response = await apiClient.post<Blob>('/devices/export',
      deviceIds ? { deviceIds } : {}
    );
    return response;
  }

  async importDevices(file: File): Promise<{ imported: number, errors: any[] }> {
    const formData = new FormData();
    formData.append('file', file);
    
    const response = await apiClient.post<{ imported: number, errors: any[] }>('/devices/import', formData);
    return response;
  }
}

export const deviceService = new DeviceService();
