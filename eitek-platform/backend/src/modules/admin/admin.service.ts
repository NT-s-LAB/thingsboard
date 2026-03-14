import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { ConfigService } from '@nestjs/config';

export interface SystemStats {
  tenants: {
    total: number;
    active: number;
    inactive: number;
    newThisMonth: number;
    newThisWeek: number;
  };
  users: {
    total: number;
    active: number;
    inactive: number;
    newThisMonth: number;
    newThisWeek: number;
    byRole: { role: string; count: number }[];
  };
  devices: {
    total: number;
    active: number;
    inactive: number;
    offline: number;
    newThisMonth: number;
  };
  projects: {
    total: number;
    active: number;
  };
  scadaViews: {
    total: number;
  };
  timestamp: string;
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

@Injectable()
export class AdminService {
  private readonly logger = new Logger(AdminService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {}

  /**
   * Get comprehensive system statistics
   */
  async getSystemStats(): Promise<SystemStats> {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - 7);

    // Execute all queries in parallel for performance
    const [
      // Tenant stats
      totalTenants,
      activeTenants,
      tenantsThisMonth,
      tenantsThisWeek,

      // User stats
      totalUsers,
      activeUsers,
      usersThisMonth,
      usersThisWeek,
      usersByRole,

      // Device stats
      totalDevices,
      activeDevices,
      offlineDevices,
      devicesThisMonth,

      // Project stats
      totalProjects,
      activeProjects,

      // SCADA views
      totalScadaViews,
    ] = await Promise.all([
      // Tenants
      this.prisma.tenant.count(),
      this.prisma.tenant.count({ where: { isActive: true } }),
      this.prisma.tenant.count({ where: { createdAt: { gte: startOfMonth } } }),
      this.prisma.tenant.count({ where: { createdAt: { gte: startOfWeek } } }),

      // Users
      this.prisma.user.count(),
      this.prisma.user.count({ where: { isActive: true } }),
      this.prisma.user.count({ where: { createdAt: { gte: startOfMonth } } }),
      this.prisma.user.count({ where: { createdAt: { gte: startOfWeek } } }),
      this.prisma.user.groupBy({
        by: ['role'],
        _count: { role: true },
      }),

      // Devices
      this.prisma.device.count(),
      this.prisma.device.count({ where: { isOnline: true } }),
      this.prisma.device.count({ where: { isOnline: false } }),
      this.prisma.device.count({ where: { createdAt: { gte: startOfMonth } } }),

      // Projects
      this.prisma.project.count(),
      this.prisma.project.count({ where: { isActive: true } }),

      // SCADA views
      this.prisma.scadaView.count(),
    ]);

    return {
      tenants: {
        total: totalTenants,
        active: activeTenants,
        inactive: totalTenants - activeTenants,
        newThisMonth: tenantsThisMonth,
        newThisWeek: tenantsThisWeek,
      },
      users: {
        total: totalUsers,
        active: activeUsers,
        inactive: totalUsers - activeUsers,
        newThisMonth: usersThisMonth,
        newThisWeek: usersThisWeek,
        byRole: usersByRole.map((r) => ({
          role: r.role,
          count: r._count.role,
        })),
      },
      devices: {
        total: totalDevices,
        active: activeDevices,
        inactive: totalDevices - activeDevices - offlineDevices,
        offline: offlineDevices,
        newThisMonth: devicesThisMonth,
      },
      projects: {
        total: totalProjects,
        active: activeProjects,
      },
      scadaViews: {
        total: totalScadaViews,
      },
      timestamp: now.toISOString(),
    };
  }

  /**
   * Get recent system activity from audit logs
   */
  async getRecentActivity(limit: number = 20): Promise<RecentActivity[]> {
    const logs = await this.prisma.auditLog.findMany({
      take: limit,
      orderBy: { timestamp: 'desc' },
      include: {
        user: {
          select: { email: true, firstName: true, lastName: true },
        },
        tenant: {
          select: { name: true },
        },
      },
    });

    return logs.map((log) => ({
      id: log.id,
      action: log.action,
      entity: log.entity,
      entityId: log.entityId,
      userEmail: log.user?.email || null,
      userName: log.user
        ? `${log.user.firstName} ${log.user.lastName}`
        : null,
      tenantName: log.tenant.name,
      timestamp: log.timestamp.toISOString(),
      metadata: log.metadata,
    }));
  }

  /**
   * Get tenant overview list with counts
   */
  async getTenantsOverview(): Promise<TenantOverview[]> {
    const tenants = await this.prisma.tenant.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: {
            users: true,
            projects: true,
          },
        },
      },
    });

    // Get device counts per tenant (through project -> site -> area -> device hierarchy)
    const deviceCounts = await this.prisma.$queryRaw<
      { tenantId: string; count: bigint }[]
    >`
      SELECT t.id as "tenantId", COUNT(d.id) as count
      FROM tenants t
      LEFT JOIN projects p ON p."tenantId" = t.id
      LEFT JOIN sites s ON s."projectId" = p.id
      LEFT JOIN areas a ON a."siteId" = s.id
      LEFT JOIN devices d ON d."areaId" = a.id
      GROUP BY t.id
    `;

    const deviceCountMap = new Map<string, number>();
    deviceCounts.forEach((dc) => {
      deviceCountMap.set(dc.tenantId, Number(dc.count));
    });

    return tenants.map((tenant) => ({
      id: tenant.id,
      name: tenant.name,
      code: tenant.code,
      isActive: tenant.isActive,
      usersCount: tenant._count.users,
      devicesCount: deviceCountMap.get(tenant.id) || 0,
      projectsCount: tenant._count.projects,
      createdAt: tenant.createdAt.toISOString(),
    }));
  }

  /**
   * Get login activity for the last N days
   */
  async getLoginActivity(days: number = 7): Promise<{ date: string; count: number }[]> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    startDate.setHours(0, 0, 0, 0);

    const logins = await this.prisma.auditLog.groupBy({
      by: ['timestamp'],
      where: {
        action: 'LOGIN',
        timestamp: { gte: startDate },
      },
      _count: { id: true },
    });

    // Aggregate by day
    const dailyLogins = new Map<string, number>();
    logins.forEach((log) => {
      const date = log.timestamp.toISOString().split('T')[0];
      dailyLogins.set(date, (dailyLogins.get(date) || 0) + log._count.id);
    });

    // Fill in missing days with zero
    const result: { date: string; count: number }[] = [];
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      result.push({
        date: dateStr,
        count: dailyLogins.get(dateStr) || 0,
      });
    }

    return result;
  }

  /**
   * Create audit log entry
   */
  async createAuditLog(data: {
    action: 'CREATE' | 'UPDATE' | 'DELETE' | 'LOGIN' | 'LOGOUT' | 'EXPORT' | 'IMPORT' | 'SYNC';
    entity: string;
    entityId: string;
    userId?: string;
    tenantId: string;
    projectId?: string;
    deviceId?: string;
    oldData?: any;
    newData?: any;
    metadata?: any;
  }): Promise<void> {
    await this.prisma.auditLog.create({
      data: {
        action: data.action,
        entity: data.entity,
        entityId: data.entityId,
        userId: data.userId,
        tenantId: data.tenantId,
        projectId: data.projectId,
        deviceId: data.deviceId,
        oldData: data.oldData,
        newData: data.newData,
        metadata: data.metadata,
      },
    });
  }
}
