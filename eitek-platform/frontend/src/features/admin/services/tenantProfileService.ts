import { apiClient } from '@/shared/services/api';

// ==================== TYPES ====================

export interface TenantProfile {
  id: string;
  name: string;
  description: string | null;
  maxUsers: number;
  maxDevices: number;
  maxProjects: number;
  maxDashboards: number;
  maxApiCalls: number | null;
  features: string[];
  addonEligible: boolean;
  price: number;
  isCommercial: boolean;
  isDefault: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  tenantsCount: number;
}

export interface CreateTenantProfileDto {
  name: string;
  description?: string;
  maxUsers?: number;
  maxDevices?: number;
  maxProjects?: number;
  maxDashboards?: number;
  maxApiCalls?: number | undefined;
  features?: string[];
  addonEligible?: boolean;
  price?: number;
  isCommercial?: boolean;
  isDefault?: boolean;
  isActive?: boolean;
}

export interface UpdateTenantProfileDto {
  name?: string;
  description?: string;
  maxUsers?: number;
  maxDevices?: number;
  maxProjects?: number;
  maxDashboards?: number;
  maxApiCalls?: number | undefined;
  features?: string[];
  addonEligible?: boolean;
  price?: number;
  isCommercial?: boolean;
  isDefault?: boolean;
  isActive?: boolean;
}

export interface PaginationInfo {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface TenantProfilesResponse {
  success: boolean;
  message: string;
  data: TenantProfile[];
  pagination: PaginationInfo;
  timestamp: string;
}

export interface TenantProfileResponse {
  success: boolean;
  message: string;
  data: TenantProfile;
  timestamp: string;
}

export interface TenantProfilesQueryParams {
  page?: number | undefined;
  limit?: number | undefined;
  search?: string | undefined;
  sortBy?: string | undefined;
  sortOrder?: 'asc' | 'desc' | undefined;
}

// ==================== SERVICE ====================

class TenantProfileService {
  private readonly baseUrl = '/tenant-profiles';

  /**
   * Get all tenant profiles with pagination
   */
  async getProfiles(params: TenantProfilesQueryParams = {}): Promise<TenantProfilesResponse> {
    const queryParams = new URLSearchParams();
    
    if (params.page) queryParams.set('page', params.page.toString());
    if (params.limit) queryParams.set('limit', params.limit.toString());
    if (params.search) queryParams.set('search', params.search);
    if (params.sortBy) queryParams.set('sortBy', params.sortBy);
    if (params.sortOrder) queryParams.set('sortOrder', params.sortOrder);
    
    const queryString = queryParams.toString();
    const url = queryString ? `${this.baseUrl}?${queryString}` : this.baseUrl;
    
    return apiClient.get<TenantProfilesResponse>(url);
  }

  /**
   * Get all active profiles (simple list)
   */
  async getProfilesSimple(): Promise<TenantProfile[]> {
    return apiClient.get(`${this.baseUrl}/simple`);
  }

  /**
   * Get the default profile
   */
  async getDefaultProfile(): Promise<{ success: boolean; data: TenantProfile | null }> {
    return apiClient.get(`${this.baseUrl}/default`);
  }

  /**
   * Get a single profile by ID
   */
  async getProfile(id: string): Promise<TenantProfileResponse> {
    return apiClient.get<TenantProfileResponse>(`${this.baseUrl}/${id}`);
  }

  /**
   * Create a new profile
   */
  async createProfile(data: CreateTenantProfileDto): Promise<TenantProfileResponse> {
    return apiClient.post<TenantProfileResponse>(this.baseUrl, data);
  }

  /**
   * Update a profile
   */
  async updateProfile(id: string, data: UpdateTenantProfileDto): Promise<TenantProfileResponse> {
    return apiClient.patch<TenantProfileResponse>(`${this.baseUrl}/${id}`, data);
  }

  /**
   * Delete a profile
   */
  async deleteProfile(id: string): Promise<{ success: boolean; message: string }> {
    return apiClient.delete(`${this.baseUrl}/${id}`);
  }

  /**
   * Set a profile as default
   */
  async setAsDefault(id: string): Promise<TenantProfileResponse> {
    return apiClient.post<TenantProfileResponse>(`${this.baseUrl}/${id}/set-default`, {});
  }

  /**
   * Duplicate a profile
   */
  async duplicateProfile(id: string): Promise<TenantProfileResponse> {
    return apiClient.post<TenantProfileResponse>(`${this.baseUrl}/${id}/duplicate`, {});
  }

  /**
   * Get commercial profiles available in tenant store
   */
  async getCommercialProfiles(): Promise<TenantProfile[]> {
    return apiClient.get<TenantProfile[]>(`${this.baseUrl}/commercial`);
  }
}

// Export singleton instance
export const tenantProfileService = new TenantProfileService();
