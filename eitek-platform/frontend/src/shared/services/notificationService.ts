import { apiClient } from '@/shared/services/api';

// ==================== TYPES ====================

export type NotificationType =
  | 'DEVICE_OFFLINE'
  | 'DEVICE_ONLINE'
  | 'DEVICE_ALARM'
  | 'SYSTEM_UPDATE'
  | 'SYSTEM_MAINTENANCE'
  | 'ADMIN_MESSAGE'
  | 'ACCOUNT_ACTIVITY'
  | 'PROJECT_UPDATE';

export type NotificationPriority = 'LOW' | 'NORMAL' | 'HIGH' | 'CRITICAL';

export interface AppNotification {
  id: string;
  type: NotificationType;
  priority: NotificationPriority;
  title: string;
  message: string;
  data: Record<string, any> | null;
  isRead: boolean;
  readAt: string | null;
  userId: string;
  tenantId: string;
  createdAt: string;
}

export interface NotificationsResponse {
  data: AppNotification[];
  unreadCount: number;
  totalElements: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
  page: number;
  limit: number;
}

export interface SendNotificationDto {
  type: NotificationType;
  priority?: NotificationPriority;
  title: string;
  message: string;
  data?: Record<string, any>;
  userIds?: string[];
}

export interface BroadcastDto {
  priority?: NotificationPriority;
  title: string;
  message: string;
  data?: Record<string, any>;
  tenantIds?: string[];
}

// ==================== SERVICE ====================

class NotificationService {
  async getMyNotifications(page = 1, limit = 20): Promise<NotificationsResponse> {
    const params = new URLSearchParams({ page: String(page), limit: String(limit) });
    // apiClient auto-unwraps paginated responses, but unreadCount is a custom field.
    // Fetch notifications and unread count in parallel.
    const [listResult, unreadCount] = await Promise.all([
      apiClient.get<NotificationsResponse>(`/notifications?${params}`),
      this.getUnreadCount(),
    ]);
    return { ...listResult, unreadCount };
  }

  async getUnreadCount(): Promise<number> {
    const result = await apiClient.get<{ count: number }>('/notifications/unread-count');
    return result.count;
  }

  async markAsRead(id: string): Promise<AppNotification> {
    return apiClient.patch<AppNotification>(`/notifications/${id}/read`);
  }

  async markAllAsRead(): Promise<{ count: number }> {
    return apiClient.patch<{ count: number }>('/notifications/read-all');
  }

  async deleteNotification(id: string): Promise<void> {
    await apiClient.delete(`/notifications/${id}`);
  }

  async deleteAllRead(): Promise<{ count: number }> {
    return apiClient.delete<{ count: number }>('/notifications');
  }

  async sendToTenantUsers(dto: SendNotificationDto): Promise<{ count: number }> {
    return apiClient.post<{ count: number }>('/notifications/send', dto);
  }

  async broadcast(dto: BroadcastDto): Promise<{ count: number }> {
    return apiClient.post<{ count: number }>('/notifications/broadcast', dto);
  }
}

export const notificationService = new NotificationService();
