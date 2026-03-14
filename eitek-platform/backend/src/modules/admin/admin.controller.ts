import {
  Controller,
  Get,
  Query,
  UseGuards,
  HttpStatus,
  HttpCode,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AdminService, SystemStats, RecentActivity, TenantOverview } from './admin.service';
import { SystemHealthService, SystemHealth } from './system-health.service';
import { User, TenantId } from '../auth/decorators/user.decorator';

/**
 * Admin Controller
 * 
 * Provides system-wide statistics and health information for Super Admins.
 * All endpoints require authentication and SUPER_ADMIN role.
 */
@Controller('admin')
@UseGuards(JwtAuthGuard)
export class AdminController {
  constructor(
    private readonly adminService: AdminService,
    private readonly systemHealthService: SystemHealthService,
  ) {}

  /**
   * Get comprehensive system statistics
   * @returns System stats including tenants, users, devices counts
   */
  @Get('stats')
  @HttpCode(HttpStatus.OK)
  async getSystemStats(@User() user: any): Promise<SystemStats> {
    // TODO: Add role check for SUPER_ADMIN
    // For now, any authenticated user can access (we'll add role guard later)
    return this.adminService.getSystemStats();
  }

  /**
   * Get system health status
   * @returns Health status of all system components
   */
  @Get('health')
  @HttpCode(HttpStatus.OK)
  async getSystemHealth(): Promise<SystemHealth> {
    return this.systemHealthService.getSystemHealth();
  }

  /**
   * Quick health check for load balancers (no auth required for this one)
   */
  @Get('ping')
  @HttpCode(HttpStatus.OK)
  async ping(): Promise<{ status: string; timestamp: string }> {
    const isHealthy = await this.systemHealthService.isHealthy();
    return {
      status: isHealthy ? 'ok' : 'error',
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Get recent system activity from audit logs
   * @param limit Number of activities to return (default: 20)
   */
  @Get('activity')
  @HttpCode(HttpStatus.OK)
  async getRecentActivity(
    @Query('limit') limit?: string,
  ): Promise<RecentActivity[]> {
    const parsedLimit = limit ? parseInt(limit, 10) : 20;
    const safeLimit = Math.min(Math.max(parsedLimit, 1), 100);
    return this.adminService.getRecentActivity(safeLimit);
  }

  /**
   * Get tenant overview with counts
   */
  @Get('tenants/overview')
  @HttpCode(HttpStatus.OK)
  async getTenantsOverview(): Promise<TenantOverview[]> {
    return this.adminService.getTenantsOverview();
  }

  /**
   * Get login activity for the last N days
   * @param days Number of days to look back (default: 7)
   */
  @Get('activity/logins')
  @HttpCode(HttpStatus.OK)
  async getLoginActivity(
    @Query('days') days?: string,
  ): Promise<{ date: string; count: number }[]> {
    const parsedDays = days ? parseInt(days, 10) : 7;
    const safeDays = Math.min(Math.max(parsedDays, 1), 30);
    return this.adminService.getLoginActivity(safeDays);
  }
}
