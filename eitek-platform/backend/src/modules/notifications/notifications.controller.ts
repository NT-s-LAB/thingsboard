import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { NotificationsService } from './notifications.service';
import { CreateNotificationDto, AdminBroadcastDto } from './dto/create-notification.dto';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole, NotificationType } from '@prisma/client';

@ApiTags('Notifications')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  // ─── User endpoints ──────────────────────────────────────────────────────────

  @ApiOperation({ summary: 'Get my notifications (paginated)' })
  @Get()
  async findMy(@Request() req: any, @Query() pagination: PaginationDto) {
    const result = await this.notificationsService.findByUser(req.user.id, pagination);
    return {
      success: true,
      message: 'Notifications retrieved',
      data: result.data,
      unreadCount: result.unreadCount,
      pagination: result.pagination,
      timestamp: new Date().toISOString(),
    };
  }

  @ApiOperation({ summary: 'Get unread notification count' })
  @Get('unread-count')
  async getUnreadCount(@Request() req: any) {
    const count = await this.notificationsService.getUnreadCount(req.user.id);
    return {
      success: true,
      data: { count },
      timestamp: new Date().toISOString(),
    };
  }

  @ApiOperation({ summary: 'Mark a notification as read' })
  @Patch(':id/read')
  async markAsRead(@Request() req: any, @Param('id') id: string) {
    const notification = await this.notificationsService.markAsRead(id, req.user.id);
    return {
      success: true,
      message: 'Notification marked as read',
      data: notification,
      timestamp: new Date().toISOString(),
    };
  }

  @ApiOperation({ summary: 'Mark all notifications as read' })
  @Patch('read-all')
  @HttpCode(HttpStatus.OK)
  async markAllAsRead(@Request() req: any) {
    const result = await this.notificationsService.markAllAsRead(req.user.id);
    return {
      success: true,
      message: `${result.count} notifications marked as read`,
      data: result,
      timestamp: new Date().toISOString(),
    };
  }

  @ApiOperation({ summary: 'Delete a notification' })
  @Delete(':id')
  async remove(@Request() req: any, @Param('id') id: string) {
    await this.notificationsService.remove(id, req.user.id);
    return {
      success: true,
      message: 'Notification deleted',
      timestamp: new Date().toISOString(),
    };
  }

  @ApiOperation({ summary: 'Delete all read notifications' })
  @Delete()
  @HttpCode(HttpStatus.OK)
  async removeAllRead(@Request() req: any) {
    const result = await this.notificationsService.removeAllRead(req.user.id);
    return {
      success: true,
      message: `${result.count} read notifications deleted`,
      data: result,
      timestamp: new Date().toISOString(),
    };
  }

  // ─── Tenant admin: send notification to tenant users ──────────────────────────

  @ApiOperation({ summary: 'Send notification to tenant users' })
  @UseGuards(RolesGuard)
  @Roles(UserRole.TENANT_ADMIN)
  @Post('send')
  @HttpCode(HttpStatus.CREATED)
  async sendToTenantUsers(@Request() req: any, @Body() dto: CreateNotificationDto) {
    const tenantId = req.user.tenantId;

    if (dto.userIds?.length) {
      const result = await this.notificationsService.createForUsers(
        dto.userIds,
        tenantId,
        { type: dto.type, priority: dto.priority, title: dto.title, message: dto.message, data: dto.data },
      );
      return {
        success: true,
        message: `Notification sent to ${result.count} users`,
        data: result,
        timestamp: new Date().toISOString(),
      };
    }

    const result = await this.notificationsService.createForTenant(tenantId, {
      type: dto.type,
      priority: dto.priority,
      title: dto.title,
      message: dto.message,
      data: dto.data,
    });
    return {
      success: true,
      message: `Notification sent to ${result.count} users`,
      data: result,
      timestamp: new Date().toISOString(),
    };
  }

  // ─── Super admin: broadcast to all or specific tenants ─────────────────────────

  @ApiOperation({ summary: 'Admin broadcast notification' })
  @UseGuards(RolesGuard)
  @Roles(UserRole.SUPER_ADMIN)
  @Post('broadcast')
  @HttpCode(HttpStatus.CREATED)
  async adminBroadcast(@Body() dto: AdminBroadcastDto) {
    const result = await this.notificationsService.adminBroadcast(
      {
        type: NotificationType.ADMIN_MESSAGE,
        priority: dto.priority,
        title: dto.title,
        message: dto.message,
        data: dto.data,
      },
      dto.tenantIds,
    );
    return {
      success: true,
      message: `Broadcast sent to ${result.count} users`,
      data: result,
      timestamp: new Date().toISOString(),
    };
  }
}
