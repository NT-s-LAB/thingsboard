import { apiClient } from '@/shared/services/api';
import { LoginRequest, LoginResponse, User } from '@/shared/types';

class AuthService {
  private basePath = '/auth';

  async login(credentials: LoginRequest): Promise<LoginResponse> {
    const data = await apiClient.post<any>(`${this.basePath}/login`, credentials);
    
    // BE returns { accessToken, refreshToken, user }
    // FE expects { token, refreshToken, user }
    const loginResponse: LoginResponse = {
      token: data.accessToken || data.token,
      refreshToken: data.refreshToken,
      user: data.user,
    };
    
    if (loginResponse.token) {
      apiClient.setToken(loginResponse.token);
    }
    if (loginResponse.refreshToken) {
      apiClient.setRefreshToken(loginResponse.refreshToken);
    }
    
    return loginResponse;
  }

  async logout(): Promise<void> {
    try {
      await apiClient.post(`${this.basePath}/logout`);
    } finally {
      apiClient.clearToken();
    }
  }

  async getProfile(): Promise<User> {
    return apiClient.get<User>(`${this.basePath}/profile`);
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