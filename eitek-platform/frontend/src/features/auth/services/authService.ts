import { apiClient } from '@/shared/services/api';
import { LoginRequest, LoginResponse, User } from '@/shared/types';

class AuthService {
  private basePath = '/auth';

  async login(credentials: LoginRequest): Promise<LoginResponse> {
    const response = await apiClient.post<LoginResponse>(`${this.basePath}/login`, credentials);
    
    if (response.token) {
      apiClient.setToken(response.token);
    }
    
    return response;
  }

  async logout(): Promise<void> {
    try {
      await apiClient.post(`${this.basePath}/logout`);
    } finally {
      apiClient.clearToken();
    }
  }

  async getProfile(): Promise<User> {
    const response = await apiClient.get<User>(`${this.basePath}/profile`);
    return response;
  }

  async updateProfile(data: Partial<User>): Promise<User> {
    const response = await apiClient.put<User>(`${this.basePath}/profile`, data);
    return response;
  }

  async changePassword(oldPassword: string, newPassword: string): Promise<void> {
    await apiClient.post(`${this.basePath}/change-password`, {
      oldPassword,
      newPassword,
    });
  }

  async requestPasswordReset(email: string): Promise<void> {
    await apiClient.post(`${this.basePath}/password-reset`, { email });
  }

  async resetPassword(token: string, password: string): Promise<void> {
    await apiClient.post(`${this.basePath}/password-reset/confirm`, {
      token,
      password,
    });
  }

  async verifyToken(): Promise<boolean> {
    try {
      await apiClient.get(`${this.basePath}/verify`);
      return true;
    } catch {
      return false;
    }
  }
}

export const authService = new AuthService();