import { apiClient } from '@/shared/services/api';
import type { 
  Device, 
  DeviceListResponse, 
  DeviceListParams, 
  DeviceCreateRequest, 
  DeviceUpdateRequest,
  DeviceRpcRequest,
  DeviceCredentials,
  TbAlarmData,
  DeviceEvent,
  DeviceRelation,
  DeviceAuditLog,
  TbPagedResponse,
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
    for (const id of ids) {
      await apiClient.delete(`/devices/${id}`);
    }
  }

  // ================================
  // Device Credentials
  // ================================

  async getDeviceCredentials(deviceId: string): Promise<DeviceCredentials> {
    const response = await apiClient.get<DeviceCredentials>(`/devices/${deviceId}/credentials`);
    return response;
  }

  async saveDeviceCredentials(deviceId: string, credentials: Partial<DeviceCredentials>): Promise<DeviceCredentials> {
    const response = await apiClient.post<DeviceCredentials>(`/devices/${deviceId}/credentials`, credentials);
    return response;
  }

  // ================================
  // Device Attributes
  // ================================

  async getDeviceAttributes(deviceId: string, scope: string, keys?: string[]): Promise<Record<string, { lastUpdateTs: number; value: any }>> {
    const queryParams = new URLSearchParams();
    if (keys?.length) queryParams.append('keys', keys.join(','));
    const response = await apiClient.get<Record<string, { lastUpdateTs: number; value: any }>>(`/devices/${deviceId}/attributes/${scope}?${queryParams.toString()}`);
    return response;
  }

  async saveDeviceAttributes(deviceId: string, scope: string, attributes: Record<string, any>): Promise<void> {
    await apiClient.post(`/devices/${deviceId}/attributes/${scope}`, attributes);
  }

  async deleteDeviceAttributes(deviceId: string, scope: string, keys: string[]): Promise<void> {
    await apiClient.delete(`/devices/${deviceId}/attributes/${scope}?keys=${keys.join(',')}`);
  }

  // ================================
  // Device Telemetry
  // ================================

  async getDeviceTelemetry(deviceId: string, keys?: string[]): Promise<any> {
    const queryParams = new URLSearchParams();
    if (keys?.length) {
      queryParams.append('keys', keys.join(','));
    }
    const response = await apiClient.get<any>(`/devices/${deviceId}/telemetry?${queryParams.toString()}`);
    return response;
  }

  async getDeviceTimeseries(
    deviceId: string,
    keys: string[],
    startTs: number,
    endTs: number,
    params?: { interval?: number; limit?: number; agg?: string },
  ): Promise<any> {
    const queryParams = new URLSearchParams();
    queryParams.append('keys', keys.join(','));
    queryParams.append('startTs', startTs.toString());
    queryParams.append('endTs', endTs.toString());
    if (params?.interval) queryParams.append('interval', params.interval.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.agg) queryParams.append('agg', params.agg);
    
    const response = await apiClient.get<any>(`/devices/${deviceId}/timeseries?${queryParams.toString()}`);
    return response;
  }

  // ================================
  // Device RPC
  // ================================

  async sendRpcCommand(request: DeviceRpcRequest): Promise<any> {
    const response = await apiClient.post<any>(`/devices/${request.deviceId}/rpc`, {
      method: request.method,
      params: request.params,
      timeout: request.timeout || 5000,
    });
    return response;
  }

  // ================================
  // Device Alarms
  // ================================

  async getDeviceAlarms(deviceId: string, params?: {
    pageSize?: number;
    page?: number;
    searchStatus?: string;
    startTime?: number;
    endTime?: number;
  }): Promise<TbPagedResponse<TbAlarmData>> {
    const queryParams = new URLSearchParams();
    if (params?.pageSize) queryParams.append('pageSize', params.pageSize.toString());
    if (params?.page !== undefined) queryParams.append('page', params.page.toString());
    if (params?.searchStatus) queryParams.append('searchStatus', params.searchStatus);
    if (params?.startTime) queryParams.append('startTime', params.startTime.toString());
    if (params?.endTime) queryParams.append('endTime', params.endTime.toString());
    
    const response = await apiClient.get<TbPagedResponse<TbAlarmData>>(`/devices/${deviceId}/alarms?${queryParams.toString()}`);
    return response;
  }

  async ackDeviceAlarm(deviceId: string, alarmId: string): Promise<void> {
    await apiClient.post(`/devices/${deviceId}/alarms/${alarmId}/ack`, {});
  }

  async clearDeviceAlarm(deviceId: string, alarmId: string): Promise<void> {
    await apiClient.post(`/devices/${deviceId}/alarms/${alarmId}/clear`, {});
  }

  // ================================
  // Device Events
  // ================================

  async getDeviceEvents(deviceId: string, eventType: string, params?: {
    pageSize?: number;
    page?: number;
    startTime?: number;
    endTime?: number;
  }): Promise<TbPagedResponse<DeviceEvent>> {
    const queryParams = new URLSearchParams();
    if (params?.pageSize) queryParams.append('pageSize', params.pageSize.toString());
    if (params?.page !== undefined) queryParams.append('page', params.page.toString());
    if (params?.startTime) queryParams.append('startTime', params.startTime.toString());
    if (params?.endTime) queryParams.append('endTime', params.endTime.toString());
    
    const response = await apiClient.get<TbPagedResponse<DeviceEvent>>(`/devices/${deviceId}/events/${eventType}?${queryParams.toString()}`);
    return response;
  }

  // ================================
  // Device Relations
  // ================================

  async getDeviceRelations(deviceId: string, direction: 'FROM' | 'TO' = 'FROM'): Promise<DeviceRelation[]> {
    const response = await apiClient.get<DeviceRelation[]>(`/devices/${deviceId}/relations?direction=${direction}`);
    return response;
  }

  async saveDeviceRelation(deviceId: string, relation: Partial<DeviceRelation>): Promise<void> {
    await apiClient.post(`/devices/${deviceId}/relations`, relation);
  }

  async deleteDeviceRelation(deviceId: string, relationType: string, toId: string, toType: string): Promise<void> {
    await apiClient.delete(`/devices/${deviceId}/relations?relationType=${relationType}&toId=${toId}&toType=${toType}`);
  }

  // ================================
  // Device Audit Logs
  // ================================

  async getDeviceAuditLogs(deviceId: string, params?: {
    pageSize?: number;
    page?: number;
    startTime?: number;
    endTime?: number;
  }): Promise<TbPagedResponse<DeviceAuditLog>> {
    const queryParams = new URLSearchParams();
    if (params?.pageSize) queryParams.append('pageSize', params.pageSize.toString());
    if (params?.page !== undefined) queryParams.append('page', params.page.toString());
    if (params?.startTime) queryParams.append('startTime', params.startTime.toString());
    if (params?.endTime) queryParams.append('endTime', params.endTime.toString());
    
    const response = await apiClient.get<TbPagedResponse<DeviceAuditLog>>(`/devices/${deviceId}/audit-logs?${queryParams.toString()}`);
    return response;
  }

  // ================================
  // Meta endpoints
  // ================================

  async getDeviceTypes(): Promise<any[]> {
    const response = await apiClient.get<any>('/device-types');
    return Array.isArray(response) ? response : (response?.data || []);
  }

  async getAreas(): Promise<any[]> {
    const response = await apiClient.get<any>('/areas?pageSize=100');
    return Array.isArray(response) ? response : (response?.data || []);
  }
}

export const deviceService = new DeviceService();
