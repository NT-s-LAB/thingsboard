import { apiClient } from '@/shared/services/api';
import type { UserRoleEnum } from '@/shared/types';

export interface ManagedUser {
  id: string;
  email: string;
  username?: string;
  firstName: string;
  lastName: string;
  phone?: string | null;
  avatar?: string | null;
  role: UserRoleEnum;
  isActive: boolean;
  lastLogin?: string | null;
  tenantId: string;
  tenant?: { id: string; name: string };
  createdAt: string;
  updatedAt: string;
}

export interface CreateUserDto {
  email: string;
  firstName: string;
  lastName: string;
  password: string;
  username?: string;
  phone?: string;
  role?: UserRoleEnum;
  isActive?: boolean;
}

export interface UpdateUserDto {
  email?: string;
  firstName?: string;
  lastName?: string;
  username?: string;
  phone?: string;
  role?: UserRoleEnum;
  isActive?: boolean;
}

export interface UsersQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

// After auto-unwrap by apiClient, paginated responses have this shape:
export interface PaginatedUsersResponse {
  data: ManagedUser[];
  totalElements: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
  page: number;
  limit: number;
}

class UserService {
  async getUsers(params: UsersQueryParams = {}): Promise<PaginatedUsersResponse> {
    const qp = new URLSearchParams();
    if (params.page) qp.set('page', params.page.toString());
    if (params.limit) qp.set('limit', params.limit.toString());
    if (params.search) qp.set('search', params.search);
    if (params.sortBy) qp.set('sortBy', params.sortBy);
    if (params.sortOrder) qp.set('sortOrder', params.sortOrder);
    const qs = qp.toString();
    return apiClient.get<PaginatedUsersResponse>(qs ? `/users?${qs}` : '/users');
  }

  async getUser(id: string): Promise<ManagedUser> {
    return apiClient.get<ManagedUser>(`/users/${id}`);
  }

  async createUser(data: CreateUserDto): Promise<ManagedUser> {
    return apiClient.post<ManagedUser>('/users', data);
  }

  async updateUser(id: string, data: UpdateUserDto): Promise<ManagedUser> {
    return apiClient.put<ManagedUser>(`/users/${id}`, data);
  }

  async deleteUser(id: string): Promise<void> {
    await apiClient.delete(`/users/${id}`);
  }
}

export const userService = new UserService();
