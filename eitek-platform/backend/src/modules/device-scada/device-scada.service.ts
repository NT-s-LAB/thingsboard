import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { RequestUser } from '../../common/interfaces/common.interface';
import { CreateDeviceScadaTemplateDto } from './dto/create-device-scada-template.dto';
import { UpdateDeviceScadaTemplateDto } from './dto/update-device-scada-template.dto';
import { SaveDeviceOverrideDto } from './dto/save-device-override.dto';

@Injectable()
export class DeviceScadaService {
  constructor(private readonly prisma: PrismaService) {}

  // ════════════════════════════════════════════════════════════════════════════
  // Template CRUD
  // ════════════════════════════════════════════════════════════════════════════

  async createTemplate(dto: CreateDeviceScadaTemplateDto, user: RequestUser) {
    try {
      return await this.prisma.deviceScadaTemplate.create({
        data: {
          name: dto.name,
          description: dto.description,
          screenDefinition: dto.screenDefinition,
          thumbnail: dto.thumbnail,
          isActive: dto.isActive ?? true,
          tenantId: user.tenantId,
        },
      });
    } catch (error: any) {
      if (error?.code === 'P2002') {
        throw new ConflictException('A template with this name already exists');
      }
      throw error;
    }
  }

  async listTemplates(user: RequestUser, search?: string) {
    const where: any = { tenantId: user.tenantId };
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    return this.prisma.deviceScadaTemplate.findMany({
      where,
      orderBy: { updatedAt: 'desc' },
      include: {
        profileDefaults: { select: { deviceProfileId: true } },
        _count: { select: { overrides: true } },
      },
    });
  }

  async getTemplate(id: string, user: RequestUser) {
    const template = await this.prisma.deviceScadaTemplate.findFirst({
      where: { id, tenantId: user.tenantId },
      include: {
        profileDefaults: { select: { deviceProfileId: true } },
        _count: { select: { overrides: true } },
      },
    });
    if (!template) throw new NotFoundException('Device SCADA template not found');
    return template;
  }

  async updateTemplate(id: string, dto: UpdateDeviceScadaTemplateDto, user: RequestUser) {
    const existing = await this.prisma.deviceScadaTemplate.findFirst({
      where: { id, tenantId: user.tenantId },
    });
    if (!existing) throw new NotFoundException('Device SCADA template not found');

    // Check name uniqueness if name changed
    if (dto.name && dto.name !== existing.name) {
      const dup = await this.prisma.deviceScadaTemplate.findFirst({
        where: { tenantId: user.tenantId, name: dto.name, NOT: { id } },
      });
      if (dup) throw new ConflictException('Template name already exists');
    }

    const data: any = {};
    if (dto.name !== undefined) data.name = dto.name;
    if (dto.description !== undefined) data.description = dto.description;
    if (dto.screenDefinition !== undefined) {
      data.screenDefinition = dto.screenDefinition;
      data.version = existing.version + 1;
    }
    if (dto.thumbnail !== undefined) data.thumbnail = dto.thumbnail;
    if (dto.isActive !== undefined) data.isActive = dto.isActive;

    return this.prisma.deviceScadaTemplate.update({
      where: { id },
      data,
    });
  }

  async deleteTemplate(id: string, user: RequestUser) {
    const existing = await this.prisma.deviceScadaTemplate.findFirst({
      where: { id, tenantId: user.tenantId },
    });
    if (!existing) throw new NotFoundException('Device SCADA template not found');

    await this.prisma.deviceScadaTemplate.delete({ where: { id } });
  }

  // ════════════════════════════════════════════════════════════════════════════
  // Profile → Default Template Mapping
  // ════════════════════════════════════════════════════════════════════════════

  async setProfileDefault(deviceProfileId: string, templateId: string, user: RequestUser) {
    // Verify template belongs to this tenant
    const template = await this.prisma.deviceScadaTemplate.findFirst({
      where: { id: templateId, tenantId: user.tenantId },
    });
    if (!template) throw new NotFoundException('Device SCADA template not found');

    return this.prisma.deviceProfileScadaDefault.upsert({
      where: {
        tenantId_deviceProfileId: {
          tenantId: user.tenantId,
          deviceProfileId,
        },
      },
      update: { templateId },
      create: {
        deviceProfileId,
        templateId,
        tenantId: user.tenantId,
      },
      include: { template: { select: { id: true, name: true } } },
    });
  }

  async getProfileDefault(deviceProfileId: string, user: RequestUser) {
    return this.prisma.deviceProfileScadaDefault.findUnique({
      where: {
        tenantId_deviceProfileId: {
          tenantId: user.tenantId,
          deviceProfileId,
        },
      },
      include: { template: true },
    });
  }

  async removeProfileDefault(deviceProfileId: string, user: RequestUser) {
    const existing = await this.prisma.deviceProfileScadaDefault.findUnique({
      where: {
        tenantId_deviceProfileId: {
          tenantId: user.tenantId,
          deviceProfileId,
        },
      },
    });
    if (!existing) throw new NotFoundException('No default template mapping found');

    await this.prisma.deviceProfileScadaDefault.delete({
      where: { id: existing.id },
    });
  }

  async listProfileDefaults(user: RequestUser) {
    return this.prisma.deviceProfileScadaDefault.findMany({
      where: { tenantId: user.tenantId },
      include: { template: { select: { id: true, name: true, thumbnail: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  // ════════════════════════════════════════════════════════════════════════════
  // Device Override
  // ════════════════════════════════════════════════════════════════════════════

  async saveDeviceOverride(deviceId: string, dto: SaveDeviceOverrideDto, user: RequestUser) {
    // Verify device belongs to tenant
    const device = await this.prisma.device.findFirst({
      where: {
        id: deviceId,
        area: { site: { project: { tenantId: user.tenantId } } },
      },
    });
    if (!device) throw new NotFoundException('Device not found');

    // Resolve the profile default template for this device
    const profileId = (device.metadata as any)?.deviceProfileId;
    if (!profileId) throw new BadRequestException('Device has no device profile assigned');

    const profileDefault = await this.prisma.deviceProfileScadaDefault.findUnique({
      where: {
        tenantId_deviceProfileId: {
          tenantId: user.tenantId,
          deviceProfileId: profileId,
        },
      },
    });
    if (!profileDefault) throw new BadRequestException('No default SCADA template for this device profile');

    return this.prisma.deviceScadaOverride.upsert({
      where: { deviceId },
      update: { overrides: dto.overrides },
      create: {
        deviceId,
        templateId: profileDefault.templateId,
        overrides: dto.overrides,
      },
    });
  }

  async getDeviceOverride(deviceId: string, user: RequestUser) {
    const device = await this.prisma.device.findFirst({
      where: {
        id: deviceId,
        area: { site: { project: { tenantId: user.tenantId } } },
      },
    });
    if (!device) throw new NotFoundException('Device not found');

    return this.prisma.deviceScadaOverride.findUnique({
      where: { deviceId },
    });
  }

  async deleteDeviceOverride(deviceId: string, user: RequestUser) {
    const device = await this.prisma.device.findFirst({
      where: {
        id: deviceId,
        area: { site: { project: { tenantId: user.tenantId } } },
      },
    });
    if (!device) throw new NotFoundException('Device not found');

    const existing = await this.prisma.deviceScadaOverride.findUnique({
      where: { deviceId },
    });
    if (!existing) throw new NotFoundException('No override found for this device');

    await this.prisma.deviceScadaOverride.delete({ where: { deviceId } });
  }

  // ════════════════════════════════════════════════════════════════════════════
  // Resolved SCADA for Device (Runtime)
  // ════════════════════════════════════════════════════════════════════════════

  /**
   * Main runtime endpoint: resolve the full SCADA ScreenDefinition for a device.
   *
   * Flow:
   *  1. Load device → get deviceProfileId from metadata
   *  2. Find profile's default template
   *  3. Get template screenDefinition
   *  4. Apply device override (if any)
   *  5. Replace $currentDevice with actual device TB IDs
   *  6. Return resolved ScreenDefinition + device context
   */
  async resolveDeviceScada(deviceId: string, user: RequestUser) {
    // 1. Load device
    const device = await this.prisma.device.findFirst({
      where: {
        id: deviceId,
        area: { site: { project: { tenantId: user.tenantId } } },
      },
      include: {
        deviceType: { select: { name: true } },
        area: { select: { id: true, name: true } },
      },
    });
    if (!device) throw new NotFoundException('Device not found');

    // 2. Resolve device profile ID
    const profileId = (device.metadata as any)?.deviceProfileId;
    if (!profileId) {
      return { hasTemplate: false, device: this.buildDeviceContext(device), screen: null };
    }

    // 3. Find profile default template
    const profileDefault = await this.prisma.deviceProfileScadaDefault.findUnique({
      where: {
        tenantId_deviceProfileId: {
          tenantId: user.tenantId,
          deviceProfileId: profileId,
        },
      },
      include: { template: true },
    });
    if (!profileDefault) {
      return { hasTemplate: false, device: this.buildDeviceContext(device), screen: null };
    }

    // 4. Get screen definition from template
    let screenDef = JSON.parse(JSON.stringify(profileDefault.template.screenDefinition));

    // 5. Apply device-level overrides
    const override = await this.prisma.deviceScadaOverride.findUnique({
      where: { deviceId },
    });
    if (override) {
      screenDef = this.applyOverrides(screenDef, override.overrides as any);
    }

    // 6. Replace $currentDevice placeholder with actual device IDs
    const screenJson = JSON.stringify(screenDef);
    const resolved = screenJson
      .replace(/\$currentDevice/g, device.tbDeviceId)
      .replace(/\$currentDeviceName/g, device.name);
    const resolvedScreen = JSON.parse(resolved);

    return {
      hasTemplate: true,
      templateId: profileDefault.template.id,
      templateName: profileDefault.template.name,
      templateVersion: profileDefault.template.version,
      hasOverride: !!override,
      device: this.buildDeviceContext(device),
      screen: resolvedScreen,
    };
  }

  // ── Helpers ──

  private buildDeviceContext(device: any) {
    return {
      id: device.id,
      name: device.name,
      tbDeviceId: device.tbDeviceId,
      deviceProfileId: (device.metadata as any)?.deviceProfileId ?? null,
      deviceTypeName: device.deviceType?.name ?? null,
      areaId: device.area?.id ?? null,
      areaName: device.area?.name ?? null,
      isOnline: device.isOnline,
    };
  }

  /**
   * Apply overrides to a screen definition. Override schema:
   * {
   *   widgets: {
   *     [widgetId]: {
   *       properties?: { ... },  // Merged into widget properties
   *       visible?: boolean,
   *       transform?: { ... },   // Merged into widget transform
   *     }
   *   },
   *   variables: {
   *     [varName]: { defaultValue: ... }
   *   }
   * }
   */
  private applyOverrides(screen: any, overrides: any): any {
    if (!overrides) return screen;

    // Override widgets
    if (overrides.widgets && screen.widgets) {
      screen.widgets = screen.widgets.map((widget: any) => {
        const wo = overrides.widgets[widget.id];
        if (!wo) return widget;

        const merged = { ...widget };
        if (wo.properties) {
          merged.properties = { ...widget.properties, ...wo.properties };
        }
        if (wo.visible !== undefined) {
          merged.visible = wo.visible;
        }
        if (wo.transform) {
          merged.transform = { ...widget.transform, ...wo.transform };
        }
        if (wo.bindings) {
          merged.bindings = wo.bindings;
        }
        return merged;
      });
    }

    // Override variables
    if (overrides.variables && screen.variables) {
      screen.variables = screen.variables.map((v: any) => {
        const vo = overrides.variables[v.name];
        if (!vo) return v;
        return { ...v, ...vo };
      });
    }

    return screen;
  }
}
