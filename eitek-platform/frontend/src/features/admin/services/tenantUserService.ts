import { apiClient } from '@/shared/services/api';

// ==================== TYPES ====================

export enum ActivationMethod {
  SET_PASSWORD = 'SET_PASSWORD',
  ACTIVATION_LINK = 'ACTIVATION_LINK',
}

export interface TenantUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string | null;
  description: string | null;
  role: string;
  isActive: boolean;
  isActivated: boolean;
  activationToken: string | null;
  activationExpiresAt: string | null;
  lastLogin: string | null;
  createdAt: string;
  updatedAt: string;
  activationLink?: string;
}

export interface CreateTenantUserDto {
  email: string;
  firstName: string;
  lastName: string;
  phone?: string | undefined;
  description?: string | undefined;
  // Role is always TENANT_ADMIN for users created by Super Admin (enforced by backend)
  activationMethod: ActivationMethod;
  password?: string | undefined;
  isActive?: boolean | undefined;
}

export interface UpdateTenantUserDto {
  email?: string | undefined;
  firstName?: string | undefined;
  lastName?: string | undefined;
  phone?: string | undefined;
  description?: string | undefined;
  role?: string | undefined;
  isActive?: boolean | undefined;
}

export interface PaginationInfo {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface TenantUsersResponse {
  success: boolean;
  message: string;
  data: TenantUser[];
  pagination: PaginationInfo;
  timestamp: string;
}

export interface TenantUserResponse {
  success: boolean;
  message: string;
  data: TenantUser;
  timestamp: string;
}

export interface TenantUsersQueryParams {
  page?: number | undefined;
  limit?: number | undefined;
  search?: string | undefined;
  sortBy?: string | undefined;
  sortOrder?: 'asc' | 'desc' | undefined;
}

export interface ActivationLinkResponse {
  success: boolean;
  message: string;
  data: {
    activationLink: string;
    expiresAt: string;
  };
  timestamp: string;
}

// ==================== SERVICE ====================

class TenantUserService {
  /**
   * Get all users for a tenant
   */
  async getUsers(tenantId: string, params: TenantUsersQueryParams = {}): Promise<TenantUsersResponse> {
    const queryParams = new URLSearchParams();
    
    if (params.page) queryParams.set('page', params.page.toString());
    if (params.limit) queryParams.set('limit', params.limit.toString());
    if (params.search) queryParams.set('search', params.search);
    if (params.sortBy) queryParams.set('sortBy', params.sortBy);
    if (params.sortOrder) queryParams.set('sortOrder', params.sortOrder);
    
    const queryString = queryParams.toString();
    const url = queryString 
      ? `/tenants/${tenantId}/users?${queryString}` 
      : `/tenants/${tenantId}/users`;
    
    return apiClient.get<TenantUsersResponse>(url);
  }

  /**
   * Get a single user by ID
   */
  async getUser(tenantId: string, userId: string): Promise<TenantUser> {
    return apiClient.get<TenantUser>(`/tenants/${tenantId}/users/${userId}`);
  }

  /**
   * Create a new user for a tenant
   */
  async createUser(tenantId: string, data: CreateTenantUserDto): Promise<TenantUser> {
    return apiClient.post<TenantUser>(`/tenants/${tenantId}/users`, data);
  }

  /**
   * Update a user
   */
  async updateUser(tenantId: string, userId: string, data: UpdateTenantUserDto): Promise<TenantUser> {
    return apiClient.put<TenantUser>(`/tenants/${tenantId}/users/${userId}`, data);
  }

  /**
   * Delete a user
   */
  async deleteUser(tenantId: string, userId: string): Promise<void> {
    await apiClient.delete(`/tenants/${tenantId}/users/${userId}`);
  }

  /**
   * Resend activation link
   */
  async resendActivationLink(tenantId: string, userId: string): Promise<ActivationLinkResponse['data']> {
    return apiClient.post<ActivationLinkResponse['data']>(
      `/tenants/${tenantId}/users/${userId}/resend-activation`,
      {}
    );
  }

  /**
   * Set password for a user
   */
  async setPassword(tenantId: string, userId: string, password: string): Promise<void> {
    await apiClient.post(`/tenants/${tenantId}/users/${userId}/set-password`, { password });
  }

  /**
   * Toggle user active status
   */
  async toggleUserStatus(tenantId: string, userId: string): Promise<TenantUser> {
    return apiClient.post<TenantUser>(
      `/tenants/${tenantId}/users/${userId}/toggle-status`,
      {}
    );
  }
}

export const tenantUserService = new TenantUserService();
