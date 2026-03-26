import { IsString, IsOptional, IsEnum, IsArray, IsObject } from 'class-validator';
import { NotificationType, NotificationPriority } from '@prisma/client';

export class CreateNotificationDto {
  @IsEnum(NotificationType)
  type: NotificationType;

  @IsEnum(NotificationPriority)
  @IsOptional()
  priority?: NotificationPriority = NotificationPriority.NORMAL;

  @IsString()
  title: string;

  @IsString()
  message: string;

  @IsObject()
  @IsOptional()
  data?: Record<string, any>;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  userIds?: string[]; // specific users; if empty, broadcast to all tenant users
}

export class AdminBroadcastDto {
  @IsString()
  title: string;

  @IsString()
  message: string;

  @IsEnum(NotificationPriority)
  @IsOptional()
  priority?: NotificationPriority = NotificationPriority.NORMAL;

  @IsObject()
  @IsOptional()
  data?: Record<string, any>;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  tenantIds?: string[]; // specific tenants; if empty, broadcast to all
}
