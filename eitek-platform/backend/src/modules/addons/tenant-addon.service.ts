import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '@/database/prisma.service';
import { PurchaseAddonDto, UpdateTenantAddonDto } from './dto/purchase-addon.dto';
import { AddonResourceType, TenantAddon } from '@prisma/client';

export interface TenantAddonWithCatalog extends TenantAddon {
  addon: {
    id: string;
    code: string;
    name: string;
    type: string;
    resourceType: string | null;
    quantityPerUnit: number | null;
    featureFlag: string | null;
    priceMonthly: number;
  };
}

export interface EffectiveLimits {
  maxUsers: number | null;
  maxDevices: number | null;
  maxProjects: number | null;
  maxDashboards: number | null;
  maxApiCalls: number | null;
  features: string[];
  addonFeatures: string[];
}

export interface TenantUsage {
  users: number;
  devices: number;
  projects: number;
  dashboards: number;
}

export interface TenantQuotaInfo {
  profileName: string;
  baseLimits: {
    maxUsers: number;
    maxDevices: number;
    maxProjects: number;
    maxDashboards: number;
    maxApiCalls: number | null;
  };
  addonExtras: {
    users: number;
    devices: number;
    projects: number;
    dashboards: number;
    apiCalls: number;
  };
  effectiveLimits: {
    maxUsers: number | null;
    maxDevices: number | null;
    maxProjects: number | null;
    maxDashboards: number | null;
    maxApiCalls: number | null;
  };
  usage: TenantUsage;
  features: string[];
  addonFeatures: string[];
  addonEligible: boolean;
  addons: TenantAddonWithCatalog[];
}

@Injectable()
export class TenantAddonService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Purchase or add an addon for a tenant
   */
  async purchase(tenantId: string, dto: PurchaseAddonDto): Promise<TenantAddonWithCatalog> {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
      include: { profile: true },
    });
    if (!tenant) throw new NotFoundException('Tenant not found');

    // Check addon eligibility
    if (!tenant.profile?.addonEligible) {
      throw new ForbiddenException(
        'Gói hiện tại không hỗ trợ mua thêm add-on. Vui lòng nâng gói.',
      );
    }

    const addon = await this.prisma.addonCatalog.findUnique({
      where: { id: dto.addonId },
    });
    if (!addon || !addon.isActive) {
      throw new NotFoundException('Addon not found or not active');
    }

    // Upsert: if tenant already has this addon, update quantity
    const existing = await this.prisma.tenantAddon.findUnique({
      where: { tenantId_addonId: { tenantId, addonId: dto.addonId } },
    });

    let tenantAddon: TenantAddon;
    if (existing) {
      tenantAddon = await this.prisma.tenantAddon.update({
        where: { id: existing.id },
        data: {
          quantity: existing.quantity + (dto.quantity ?? 1),
          isActive: true,
          note: dto.note ?? existing.note,
        },
      });
    } else {
      tenantAddon = await this.prisma.tenantAddon.create({
        data: {
          tenantId,
          addonId: dto.addonId,
          quantity: dto.quantity ?? 1,
          note: dto.note,
        },
      });
    }

    return this.prisma.tenantAddon.findUnique({
      where: { id: tenantAddon.id },
      include: {
        addon: {
          select: {
            id: true, code: true, name: true, type: true,
            resourceType: true, quantityPerUnit: true, featureFlag: true, priceMonthly: true,
          },
        },
      },
    }) as Promise<TenantAddonWithCatalog>;
  }

  /**
   * Update quantity of an existing addon
   */
  async update(tenantAddonId: string, tenantId: string, dto: UpdateTenantAddonDto): Promise<TenantAddonWithCatalog> {
    const tenantAddon = await this.prisma.tenantAddon.findUnique({
      where: { id: tenantAddonId },
    });
    if (!tenantAddon || tenantAddon.tenantId !== tenantId) {
      throw new NotFoundException('Tenant addon not found');
    }

    await this.prisma.tenantAddon.update({
      where: { id: tenantAddonId },
      data: dto,
    });

    return this.prisma.tenantAddon.findUnique({
      where: { id: tenantAddonId },
      include: {
        addon: {
          select: {
            id: true, code: true, name: true, type: true,
            resourceType: true, quantityPerUnit: true, featureFlag: true, priceMonthly: true,
          },
        },
      },
    }) as Promise<TenantAddonWithCatalog>;
  }

  /**
   * Remove addon from tenant
   */
  async remove(tenantAddonId: string, tenantId: string): Promise<void> {
    const tenantAddon = await this.prisma.tenantAddon.findUnique({
      where: { id: tenantAddonId },
    });
    if (!tenantAddon || tenantAddon.tenantId !== tenantId) {
      throw new NotFoundException('Tenant addon not found');
    }
    await this.prisma.tenantAddon.delete({ where: { id: tenantAddonId } });
  }

  /**
   * Get all active addons for a tenant
   */
  async findByTenant(tenantId: string): Promise<TenantAddonWithCatalog[]> {
    return this.prisma.tenantAddon.findMany({
      where: { tenantId, isActive: true },
      include: {
        addon: {
          select: {
            id: true, code: true, name: true, type: true,
            resourceType: true, quantityPerUnit: true, featureFlag: true, priceMonthly: true,
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    }) as unknown as TenantAddonWithCatalog[];
  }

  /**
   * Calculate effective limits: base profile + addon extras
   */
  async getEffectiveLimits(tenantId: string): Promise<EffectiveLimits> {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
      include: {
        profile: true,
        addons: { where: { isActive: true }, include: { addon: true } },
      },
    });

    if (!tenant) throw new NotFoundException('Tenant not found');

    const profile = tenant.profile;
    const baseUsers = profile?.maxUsers ?? 10;
    const baseDevices = profile?.maxDevices ?? 100;
    const baseProjects = profile?.maxProjects ?? 5;
    const baseDashboards = profile?.maxDashboards ?? 10;
    const baseApiCalls = profile?.maxApiCalls ?? null; // null = unlimited
    const baseFeatures = profile?.features ?? [];

    let extraUsers = 0;
    let extraDevices = 0;
    let extraProjects = 0;
    let extraDashboards = 0;
    let extraApiCalls = 0;
    const addonFeatures: string[] = [];

    for (const ta of tenant.addons) {
      const addon = ta.addon;
      if (addon.type === 'QUOTA' && addon.resourceType && addon.quantityPerUnit) {
        const total = addon.quantityPerUnit * ta.quantity;
        switch (addon.resourceType) {
          case 'DEVICES': extraDevices += total; break;
          case 'USERS': extraUsers += total; break;
          case 'PROJECTS': extraProjects += total; break;
          case 'DASHBOARDS': extraDashboards += total; break;
          case 'API_CALLS': extraApiCalls += total; break;
        }
      } else if (addon.type === 'FEATURE' && addon.featureFlag) {
        addonFeatures.push(addon.featureFlag);
      }
    }

    return {
      maxUsers: baseUsers + extraUsers,
      maxDevices: baseDevices + extraDevices,
      maxProjects: baseProjects + extraProjects,
      maxDashboards: baseDashboards + extraDashboards,
      maxApiCalls: baseApiCalls === null ? null : baseApiCalls + extraApiCalls,
      features: baseFeatures,
      addonFeatures,
    };
  }

  /**
   * Get current resource usage counts for a tenant
   */
  async getUsage(tenantId: string): Promise<TenantUsage> {
    const [users, projects, devices, dashboards] = await Promise.all([
      this.prisma.user.count({ where: { tenantId, isActive: true } }),
      this.prisma.project.count({ where: { tenantId, isActive: true } }),
      this.prisma.device.count({
        where: { area: { site: { project: { tenantId } } }, isActive: true },
      }),
      this.prisma.scadaView.count({
        where: {
          isActive: true,
          OR: [
            { project: { tenantId } },
            { area: { site: { project: { tenantId } } } },
          ],
        },
      }),
    ]);

    return { users, devices, projects, dashboards };
  }

  /**
   * Get full quota info (base + addons + usage) for dashboard display
   */
  async getQuotaInfo(tenantId: string): Promise<TenantQuotaInfo> {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
      include: {
        profile: true,
        addons: {
          where: { isActive: true },
          include: {
            addon: {
              select: {
                id: true, code: true, name: true, type: true,
                resourceType: true, quantityPerUnit: true, featureFlag: true, priceMonthly: true,
              },
            },
          },
        },
      },
    });

    if (!tenant) throw new NotFoundException('Tenant not found');

    const profile = tenant.profile;
    const baseLimits = {
      maxUsers: profile?.maxUsers ?? 10,
      maxDevices: profile?.maxDevices ?? 100,
      maxProjects: profile?.maxProjects ?? 5,
      maxDashboards: profile?.maxDashboards ?? 10,
      maxApiCalls: profile?.maxApiCalls ?? null,
    };

    let addonExtras = { users: 0, devices: 0, projects: 0, dashboards: 0, apiCalls: 0 };
    const addonFeatures: string[] = [];

    for (const ta of tenant.addons) {
      const addon = ta.addon as any;
      if (addon.type === 'QUOTA' && addon.quantityPerUnit) {
        const total = addon.quantityPerUnit * ta.quantity;
        switch (addon.resourceType as string) {
          case 'DEVICES': addonExtras.devices += total; break;
          case 'USERS': addonExtras.users += total; break;
          case 'PROJECTS': addonExtras.projects += total; break;
          case 'DASHBOARDS': addonExtras.dashboards += total; break;
          case 'API_CALLS': addonExtras.apiCalls += total; break;
        }
      } else if (addon.type === 'FEATURE' && addon.featureFlag) {
        addonFeatures.push(addon.featureFlag);
      }
    }

    const effectiveLimits = {
      maxUsers: baseLimits.maxUsers + addonExtras.users,
      maxDevices: baseLimits.maxDevices + addonExtras.devices,
      maxProjects: baseLimits.maxProjects + addonExtras.projects,
      maxDashboards: baseLimits.maxDashboards + addonExtras.dashboards,
      maxApiCalls: baseLimits.maxApiCalls === null ? null : baseLimits.maxApiCalls + addonExtras.apiCalls,
    };

    const usage = await this.getUsage(tenantId);

    return {
      profileName: profile?.name ?? 'No Profile',
      baseLimits,
      addonExtras,
      effectiveLimits,
      usage,
      features: profile?.features ?? [],
      addonFeatures,
      addonEligible: profile?.addonEligible ?? false,
      addons: tenant.addons as unknown as TenantAddonWithCatalog[],
    };
  }

  /**
   * Check if a specific resource creation is allowed
   */
  async checkQuota(
    tenantId: string,
    resource: 'USERS' | 'DEVICES' | 'PROJECTS' | 'DASHBOARDS',
  ): Promise<void> {
    const limits = await this.getEffectiveLimits(tenantId);
    const usage = await this.getUsage(tenantId);

    const resourceMap = {
      USERS: { current: usage.users, max: limits.maxUsers, label: 'user' },
      DEVICES: { current: usage.devices, max: limits.maxDevices, label: 'thiết bị' },
      PROJECTS: { current: usage.projects, max: limits.maxProjects, label: 'dự án' },
      DASHBOARDS: { current: usage.dashboards, max: limits.maxDashboards, label: 'dashboard' },
    };

    const check = resourceMap[resource];
    if (check.max !== null && check.current >= check.max) {
      throw new ForbiddenException(
        `Đã đạt giới hạn ${check.label} (${check.current}/${check.max}). Vui lòng nâng gói hoặc mua thêm add-on.`,
      );
    }
  }
}
