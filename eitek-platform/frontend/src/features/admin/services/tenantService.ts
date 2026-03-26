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
  isDefault: boolean;
  isActive: boolean;
}

export interface Tenant {
  id: string;
  name: string;
  code: string;
  description: string | null;
  settings: Record<string, any> | null;
  isActive: boolean;
  tbTenantId: string | null;
  tbSettings: Record<string, any> | null;
  profileId: string | null;
  profile?: TenantProfile | null;
  adminEmail: string | null;
  createdAt: string;
  updatedAt: string;
  usersCount: number;
  projectsCount: number;
  devicesCount: number;
}

export interface CreateTenantDto {
  name: string;
  code: string;
  description?: string;
  profileId?: string;
  settings?: Record<string, any>;
  tbTenantId?: string;
  tbSettings?: Record<string, any>;
  isActive?: boolean;
}

export interface UpdateTenantDto {
  name?: string;
  code?: string;
  description?: string;
  profileId?: string | null;
  settings?: Record<string, any>;
  tbTenantId?: string;
  tbSettings?: Record<string, any>;
  isActive?: boolean;
}

export interface PaginationInfo {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface TenantsResponse {
  success: boolean;
  message: string;
  data: Tenant[];
  pagination: PaginationInfo;
  timestamp: string;
}

export interface TenantResponse {
  success: boolean;
  message: string;
  data: Tenant;
  timestamp: string;
}

export interface TenantsQueryParams {
  page?: number | undefined;
  limit?: number | undefined;
  search?: string | undefined;
  sortBy?: string | undefined;
  sortOrder?: 'asc' | 'desc' | undefined;
  isActive?: boolean | undefined;
}

// ==================== SERVICE ====================

class TenantService {
  private readonly baseUrl = '/tenants';

  /**
   * Get all tenants with pagination
   */
  async getTenants(params: TenantsQueryParams = {}): Promise<TenantsResponse> {
    const queryParams = new URLSearchParams();
    
    if (params.page) queryParams.set('page', params.page.toString());
    if (params.limit) queryParams.set('limit', params.limit.toString());
    if (params.search) queryParams.set('search', params.search);
    if (params.sortBy) queryParams.set('sortBy', params.sortBy);
    if (params.sortOrder) queryParams.set('sortOrder', params.sortOrder);
    if (params.isActive !== undefined) queryParams.set('isActive', params.isActive.toString());
    
    const queryString = queryParams.toString();
    const url = queryString ? `${this.baseUrl}?${queryString}` : this.baseUrl;
    
    return apiClient.get<TenantsResponse>(url);
  }

  /**
   * Get a single tenant by ID
   */
  async getTenant(id: string): Promise<Tenant> {
    const response = await apiClient.get<TenantResponse>(`${this.baseUrl}/${id}`);
    return response.data;
  }

  /**
   * Create a new tenant
   */
  async createTenant(data: CreateTenantDto): Promise<Tenant> {
    const response = await apiClient.post<TenantResponse>(this.baseUrl, data);
    return response.data;
  }

  /**
   * Update an existing tenant
   */
  async updateTenant(id: string, data: UpdateTenantDto): Promise<Tenant> {
    const response = await apiClient.put<TenantResponse>(`${this.baseUrl}/${id}`, data);
    return response.data;
  }

  /**
   * Delete a tenant
   */
  async deleteTenant(id: string): Promise<void> {
    await apiClient.delete(`${this.baseUrl}/${id}`);
  }

  /**
   * Toggle tenant active status
   */
  async toggleTenantStatus(id: string, isActive: boolean): Promise<Tenant> {
    return this.updateTenant(id, { isActive });
  }
}

export const tenantService = new TenantService();
