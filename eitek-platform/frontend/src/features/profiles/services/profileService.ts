import { apiClient } from '@/shared/services/api';
import type {
  DeviceProfile,
  AssetProfile,
  DeviceProfileCreateRequest,
  DeviceProfileUpdateRequest,
  AssetProfileCreateRequest,
  AssetProfileUpdateRequest,
  ProfileListResponse,
  ProfileListParams,
} from '../types';

class ProfileService {
  // ================================
  // Device Profiles
  // ================================

  async getDeviceProfiles(params: ProfileListParams = {}): Promise<ProfileListResponse<DeviceProfile>> {
    const queryParams = new URLSearchParams();
    if (params.page !== undefined) queryParams.append('page', params.page.toString());
    if (params.pageSize !== undefined) queryParams.append('pageSize', params.pageSize.toString());
    if (params.textSearch) queryParams.append('textSearch', params.textSearch);
    if (params.sortProperty) queryParams.append('sortProperty', params.sortProperty);
    if (params.sortOrder) queryParams.append('sortOrder', params.sortOrder);

    const response = await apiClient.get<ProfileListResponse<DeviceProfile>>(
      `/device-profiles?${queryParams.toString()}`,
    );
    return response;
  }

  async getDeviceProfile(id: string): Promise<DeviceProfile> {
    return apiClient.get<DeviceProfile>(`/device-profiles/${id}`);
  }

  async createDeviceProfile(data: DeviceProfileCreateRequest): Promise<DeviceProfile> {
    return apiClient.post<DeviceProfile>('/device-profiles', data);
  }

  async updateDeviceProfile(id: string, data: DeviceProfileUpdateRequest): Promise<DeviceProfile> {
    return apiClient.put<DeviceProfile>(`/device-profiles/${id}`, data);
  }

  async deleteDeviceProfile(id: string): Promise<void> {
    await apiClient.delete(`/device-profiles/${id}`);
  }

  // ================================
  // Asset Profiles
  // ================================

  async getAssetProfiles(params: ProfileListParams = {}): Promise<ProfileListResponse<AssetProfile>> {
    const queryParams = new URLSearchParams();
    if (params.page !== undefined) queryParams.append('page', params.page.toString());
    if (params.pageSize !== undefined) queryParams.append('pageSize', params.pageSize.toString());
    if (params.textSearch) queryParams.append('textSearch', params.textSearch);
    if (params.sortProperty) queryParams.append('sortProperty', params.sortProperty);
    if (params.sortOrder) queryParams.append('sortOrder', params.sortOrder);

    const response = await apiClient.get<ProfileListResponse<AssetProfile>>(
      `/asset-profiles?${queryParams.toString()}`,
    );
    return response;
  }

  async getAssetProfile(id: string): Promise<AssetProfile> {
    return apiClient.get<AssetProfile>(`/asset-profiles/${id}`);
  }

  async createAssetProfile(data: AssetProfileCreateRequest): Promise<AssetProfile> {
    return apiClient.post<AssetProfile>('/asset-profiles', data);
  }

  async updateAssetProfile(id: string, data: AssetProfileUpdateRequest): Promise<AssetProfile> {
    return apiClient.put<AssetProfile>(`/asset-profiles/${id}`, data);
  }

  async deleteAssetProfile(id: string): Promise<void> {
    await apiClient.delete(`/asset-profiles/${id}`);
  }
}

export const profileService = new ProfileService();
