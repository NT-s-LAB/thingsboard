import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { NotificationType, NotificationPriority } from '@prisma/client';
import { PaginationDto, PaginatedResult } from '../../common/dto/pagination.dto';
import { RealtimeGateway } from '../realtime/realtime.gateway';

export interface NotificationPayload {
  type: NotificationType;
  priority?: NotificationPriority;
  title: string;
  message: string;
  data?: Record<string, any>;
}

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly realtimeGateway: RealtimeGateway,
  ) {}

  /**
   * Create notification for a single user and push via WebSocket
   */
  async createForUser(
    userId: string,
    tenantId: string,
    payload: NotificationPayload,
  ) {
    const notification = await this.prisma.notification.create({
      data: {
        type: payload.type,
        priority: payload.priority ?? NotificationPriority.NORMAL,
        title: payload.title,
        message: payload.message,
        data: payload.data ?? undefined,
        userId,
        tenantId,
      },
    });

    // Push real-time via WebSocket
    this.realtimeGateway.sendToUser(userId, 'notification:new', notification);

    return notification;
  }

  /**
   * Create notification for all users in a tenant
   */
  async createForTenant(
    tenantId: string,
    payload: NotificationPayload,
  ) {
    const users = await this.prisma.user.findMany({
      where: { tenantId, isActive: true },
      select: { id: true },
    });

    const notifications = await this.prisma.notification.createMany({
      data: users.map((u) => ({
        type: payload.type,
        priority: payload.priority ?? NotificationPriority.NORMAL,
        title: payload.title,
        message: payload.message,
        data: payload.data ?? undefined,
        userId: u.id,
        tenantId,
      })),
    });

    // Push to all tenant users via WebSocket
    for (const u of users) {
      this.realtimeGateway.sendToUser(u.id, 'notification:new', {
        type: payload.type,
        priority: payload.priority ?? NotificationPriority.NORMAL,
        title: payload.title,
        message: payload.message,
        data: payload.data,
        tenantId,
        userId: u.id,
        isRead: false,
        createdAt: new Date().toISOString(),
      });
    }

    return { count: notifications.count };
  }

  /**
   * Create notification for specific users within a tenant
   */
  async createForUsers(
    userIds: string[],
    tenantId: string,
    payload: NotificationPayload,
  ) {
    const notifications = await this.prisma.notification.createMany({
      data: userIds.map((userId) => ({
        type: payload.type,
        priority: payload.priority ?? NotificationPriority.NORMAL,
        title: payload.title,
        message: payload.message,
        data: payload.data ?? undefined,
        userId,
        tenantId,
      })),
    });

    for (const userId of userIds) {
      this.realtimeGateway.sendToUser(userId, 'notification:new', {
        type: payload.type,
        priority: payload.priority ?? NotificationPriority.NORMAL,
        title: payload.title,
        message: payload.message,
        data: payload.data,
        tenantId,
        userId,
        isRead: false,
        createdAt: new Date().toISOString(),
      });
    }

    return { count: notifications.count };
  }

  /**
   * Admin broadcast — send to all users across specified tenants (or all)
   */
  async adminBroadcast(
    payload: NotificationPayload,
    tenantIds?: string[],
  ) {
    const where: any = { isActive: true };
    if (tenantIds?.length) {
      where.tenantId = { in: tenantIds };
    }

    const users = await this.prisma.user.findMany({
      where,
      select: { id: true, tenantId: true },
    });

    if (!users.length) return { count: 0 };

    const notifications = await this.prisma.notification.createMany({
      data: users.map((u) => ({
        type: payload.type,
        priority: payload.priority ?? NotificationPriority.NORMAL,
        title: payload.title,
        message: payload.message,
        data: payload.data ?? undefined,
        userId: u.id,
        tenantId: u.tenantId,
      })),
    });

    for (const u of users) {
      this.realtimeGateway.sendToUser(u.id, 'notification:new', {
        type: payload.type,
        priority: payload.priority ?? NotificationPriority.NORMAL,
        title: payload.title,
        message: payload.message,
        data: payload.data,
        tenantId: u.tenantId,
        userId: u.id,
        isRead: false,
        createdAt: new Date().toISOString(),
      });
    }

    this.logger.log(`Admin broadcast sent to ${notifications.count} users`);
    return { count: notifications.count };
  }

  /**
   * Get notifications for a user (paginated)
   */
  async findByUser(userId: string, pagination: PaginationDto) {
    const limit = pagination.effectiveLimit;
    const offset = pagination.offset;

    const where: any = { userId };

    const [data, total, unreadCount] = await Promise.all([
      this.prisma.notification.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: offset,
        take: limit,
      }),
      this.prisma.notification.count({ where }),
      this.prisma.notification.count({ where: { userId, isRead: false } }),
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
      data,
      unreadCount,
      pagination: {
        total,
        page: pagination.effectivePage,
        limit,
        totalPages,
        hasNext: pagination.effectivePage < totalPages,
        hasPrev: pagination.effectivePage > 1,
      },
    };
  }

  /**
   * Get unread count for a user
   */
  async getUnreadCount(userId: string): Promise<number> {
    return this.prisma.notification.count({
      where: { userId, isRead: false },
    });
  }

  /**
   * Mark a notification as read
   */
  async markAsRead(id: string, userId: string) {
    const notification = await this.prisma.notification.findFirst({
      where: { id, userId },
    });
    if (!notification) throw new NotFoundException('Notification not found');

    return this.prisma.notification.update({
      where: { id },
      data: { isRead: true, readAt: new Date() },
    });
  }

  /**
   * Mark all notifications as read for a user
   */
  async markAllAsRead(userId: string) {
    const result = await this.prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true, readAt: new Date() },
    });
    return { count: result.count };
  }

  /**
   * Delete a notification
   */
  async remove(id: string, userId: string) {
    const notification = await this.prisma.notification.findFirst({
      where: { id, userId },
    });
    if (!notification) throw new NotFoundException('Notification not found');

    await this.prisma.notification.delete({ where: { id } });
  }

  /**
   * Delete all read notifications for a user
   */
  async removeAllRead(userId: string) {
    const result = await this.prisma.notification.deleteMany({
      where: { userId, isRead: true },
    });
    return { count: result.count };
  }
}
