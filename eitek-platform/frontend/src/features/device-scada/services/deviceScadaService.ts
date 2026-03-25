import { apiClient } from '@/shared/services/api';
import type {
  DeviceScadaTemplate,
  CreateDeviceScadaTemplateRequest,
  UpdateDeviceScadaTemplateRequest,
  DeviceProfileScadaDefault,
  DeviceScadaOverride,
  ResolvedDeviceScada,
} from '../types';

class DeviceScadaService {
  // ════════════════════════════════════════════════════════════
  // Template CRUD
  // ════════════════════════════════════════════════════════════

  async listTemplates(search?: string): Promise<DeviceScadaTemplate[]> {
    const qs = search ? `?search=${encodeURIComponent(search)}` : '';
    const res = await apiClient.get<DeviceScadaTemplate[]>(`/device-scada-templates${qs}`);
    return res;
  }

  async getTemplate(id: string): Promise<DeviceScadaTemplate> {
    return apiClient.get<DeviceScadaTemplate>(`/device-scada-templates/${id}`);
  }

  async createTemplate(data: CreateDeviceScadaTemplateRequest): Promise<DeviceScadaTemplate> {
    return apiClient.post<DeviceScadaTemplate>('/device-scada-templates', data);
  }

  async updateTemplate(id: string, data: UpdateDeviceScadaTemplateRequest): Promise<DeviceScadaTemplate> {
    return apiClient.put<DeviceScadaTemplate>(`/device-scada-templates/${id}`, data);
  }

  async deleteTemplate(id: string): Promise<void> {
    await apiClient.delete(`/device-scada-templates/${id}`);
  }

  // ════════════════════════════════════════════════════════════
  // Profile Default Mapping
  // ════════════════════════════════════════════════════════════

  async listProfileDefaults(): Promise<DeviceProfileScadaDefault[]> {
    return apiClient.get<DeviceProfileScadaDefault[]>('/device-profile-scada-defaults');
  }

  async getProfileDefault(profileId: string): Promise<DeviceProfileScadaDefault | null> {
    return apiClient.get<DeviceProfileScadaDefault | null>(`/device-profile-scada-defaults/${profileId}`);
  }

  async setProfileDefault(profileId: string, templateId: string): Promise<DeviceProfileScadaDefault> {
    return apiClient.put<DeviceProfileScadaDefault>(
      `/device-profile-scada-defaults/${profileId}`,
      { templateId },
    );
  }

  async removeProfileDefault(profileId: string): Promise<void> {
    await apiClient.delete(`/device-profile-scada-defaults/${profileId}`);
  }

  // ════════════════════════════════════════════════════════════
  // Device SCADA Runtime + Override
  // ════════════════════════════════════════════════════════════

  async resolveDeviceScada(deviceId: string): Promise<ResolvedDeviceScada> {
    return apiClient.get<ResolvedDeviceScada>(`/devices/${deviceId}/scada`);
  }

  async getDeviceOverride(deviceId: string): Promise<DeviceScadaOverride | null> {
    return apiClient.get<DeviceScadaOverride | null>(`/devices/${deviceId}/scada/override`);
  }

  async saveDeviceOverride(deviceId: string, overrides: Record<string, any>): Promise<DeviceScadaOverride> {
    return apiClient.put<DeviceScadaOverride>(`/devices/${deviceId}/scada/override`, { overrides });
  }

  async deleteDeviceOverride(deviceId: string): Promise<void> {
    await apiClient.delete(`/devices/${deviceId}/scada/override`);
  }
}

export const deviceScadaService = new DeviceScadaService();
