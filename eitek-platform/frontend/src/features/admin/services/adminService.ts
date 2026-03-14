import { apiClient } from '@/shared/services/api';

// Types matching backend responses
export interface TenantStats {
  total: number;
  active: number;
  inactive: number;
  newThisMonth: number;
  newThisWeek: number;
}

export interface UserStats {
  total: number;
  active: number;
  inactive: number;
  newThisMonth: number;
  newThisWeek: number;
  byRole: { role: string; count: number }[];
}

export interface DeviceStats {
  total: number;
  active: number;
  inactive: number;
  offline: number;
  newThisMonth: number;
}

export interface SystemStats {
  tenants: TenantStats;
  users: UserStats;
  devices: DeviceStats;
  projects: {
    total: number;
    active: number;
  };
  scadaViews: {
    total: number;
  };
  timestamp: string;
}

export interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  message: string;
  responseTime?: number;
  details?: Record<string, any>;
}

export interface SystemHealth {
  overall: 'healthy' | 'degraded' | 'unhealthy';
  uptime: number;
  timestamp: string;
  services: {
    database: HealthStatus;
    redis: HealthStatus;
    thingsboard: HealthStatus;
    backgroundJobs: HealthStatus;
  };
  system: {
    memory: {
      used: number;
      total: number;
      percentage: number;
    };
    cpu: {
      usage: number;
    };
    nodeVersion: string;
    platform: string;
  };
}

export interface RecentActivity {
  id: string;
  action: string;
  entity: string;
  entityId: string;
  userEmail: string | null;
  userName: string | null;
  tenantName: string;
  timestamp: string;
  metadata?: any;
}

export interface TenantOverview {
  id: string;
  name: string;
  code: string;
  isActive: boolean;
  usersCount: number;
  devicesCount: number;
  projectsCount: number;
  createdAt: string;
}

export interface LoginActivity {
  date: string;
  count: number;
}

class AdminService {
  private baseUrl = '/admin';

  /**
   * Get comprehensive system statistics
   */
  async getSystemStats(): Promise<SystemStats> {
    return apiClient.get<SystemStats>(`${this.baseUrl}/stats`);
  }

  /**
   * Get system health status
   */
  async getSystemHealth(): Promise<SystemHealth> {
    return apiClient.get<SystemHealth>(`${this.baseUrl}/health`);
  }

  /**
   * Get recent system activity
   */
  async getRecentActivity(limit: number = 20): Promise<RecentActivity[]> {
    return apiClient.get<RecentActivity[]>(`${this.baseUrl}/activity?limit=${limit}`);
  }

  /**
   * Get tenant overview with counts
   */
  async getTenantsOverview(): Promise<TenantOverview[]> {
    return apiClient.get<TenantOverview[]>(`${this.baseUrl}/tenants/overview`);
  }

  /**
   * Get login activity for the last N days
   */
  async getLoginActivity(days: number = 7): Promise<LoginActivity[]> {
    return apiClient.get<LoginActivity[]>(`${this.baseUrl}/activity/logins?days=${days}`);
  }

  /**
   * Quick ping to check if backend is healthy
   */
  async ping(): Promise<{ status: string; timestamp: string }> {
    return apiClient.get<{ status: string; timestamp: string }>(`${this.baseUrl}/ping`);
  }
}

export const adminService = new AdminService();
