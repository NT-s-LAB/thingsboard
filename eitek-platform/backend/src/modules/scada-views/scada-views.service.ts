import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CreateScadaViewDto } from './dto/create-scada-view.dto';
import { UpdateScadaViewDto } from './dto/update-scada-view.dto';
import { PaginationDto, PaginatedResult } from '../../common/dto/pagination.dto';
import { RequestUser } from '../../common/interfaces/common.interface';
import { ScadaView } from '@prisma/client';

@Injectable()
export class ScadaViewsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createDto: CreateScadaViewDto, user: RequestUser): Promise<ScadaView> {
    // Must have either projectId or areaId
    if (!createDto.projectId && !createDto.areaId) {
      throw new BadRequestException('Either projectId or areaId must be provided');
    }

    // If areaId is provided, verify it belongs to user's tenant
    if (createDto.areaId) {
      const area = await this.prisma.area.findFirst({
        where: {
          id: createDto.areaId,
          site: {
            project: { tenantId: user.tenantId },
          },
        },
      });
      if (!area) {
        throw new NotFoundException('Area not found or access denied');
      }
    }

    // If projectId is provided, verify it belongs to user's tenant
    if (createDto.projectId) {
      const project = await this.prisma.project.findFirst({
        where: {
          id: createDto.projectId,
          tenantId: user.tenantId,
        },
      });
      if (!project) {
        throw new NotFoundException('Project not found or access denied');
      }

      // Check name uniqueness within project
      const existing = await this.prisma.scadaView.findFirst({
        where: {
          projectId: createDto.projectId,
          name: createDto.name,
        },
      });
      if (existing) {
        throw new ConflictException('SCADA view name already exists in this project');
      }
    } else if (createDto.areaId) {
      // Check uniqueness within area
      const existing = await this.prisma.scadaView.findFirst({
        where: {
          areaId: createDto.areaId,
          name: createDto.name,
        },
      });
      if (existing) {
        throw new ConflictException('SCADA view name already exists in this area');
      }
    }

    // Provide defaults for layout and canvasSize
    const data: any = {
      name: createDto.name,
      description: createDto.description,
      layout: createDto.layout || { type: 'free' },
      background: createDto.background,
      canvasSize: createDto.canvasSize || { width: 1920, height: 1080 },
      settings: createDto.settings,
      isActive: createDto.isActive ?? true,
    };

    if (createDto.areaId) data.areaId = createDto.areaId;
    if (createDto.projectId) data.projectId = createDto.projectId;

    return this.prisma.scadaView.create({
      data,
      include: {
        area: { select: { id: true, name: true } },
        project: { select: { id: true, name: true } },
        scadaWidgets: true,
      },
    });
  }

  async findAll(
    pagination: PaginationDto,
    user: RequestUser,
    areaId?: string,
    projectId?: string,
  ): Promise<PaginatedResult<ScadaView>> {
    const page = pagination.page;
    const limit = pagination.effectiveLimit;
    const offset = pagination.offset;
    const search = pagination.effectiveSearch;
    const sortBy = pagination.effectiveSortBy;
    const sortOrder = pagination.effectiveSortOrder;

    const where: any = {};

    // Filter by projectId directly
    if (projectId) {
      where.projectId = projectId;
      where.project = { is: { tenantId: user.tenantId } };
    } else if (areaId) {
      where.areaId = areaId;
      where.area = {
        is: {
          site: {
            project: { tenantId: user.tenantId },
          },
        },
      };
    } else {
      // Return all SCADA views for this tenant
      where.OR = [
        {
          project: { is: { tenantId: user.tenantId } },
        },
        {
          area: {
            is: {
              site: {
                project: { tenantId: user.tenantId },
              },
            },
          },
        },
      ];
    }

    if (search) {
      const searchCondition = [
        { name: { contains: search, mode: 'insensitive' as any } },
        { description: { contains: search, mode: 'insensitive' as any } },
      ];
      if (where.OR) {
        // Combine with existing OR
        where.AND = [{ OR: where.OR }, { OR: searchCondition }];
        delete where.OR;
      } else {
        where.OR = searchCondition;
      }
    }

    const orderBy: any = {};
    if (sortBy) {
      orderBy[sortBy] = sortOrder;
    } else {
      orderBy.createdAt = 'desc';
    }

    const [views, total] = await Promise.all([
      this.prisma.scadaView.findMany({
        where,
        include: {
          area: { select: { id: true, name: true } },
          project: { select: { id: true, name: true } },
          _count: { select: { scadaWidgets: true } },
        },
        skip: offset,
        take: limit,
        orderBy,
      }),
      this.prisma.scadaView.count({ where }),
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
      data: views,
      pagination: {
        total,
        page,
        limit,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
    };
  }

  async findByProject(
    projectId: string,
    pagination: PaginationDto,
    user: RequestUser,
  ): Promise<PaginatedResult<ScadaView>> {
    // Verify project belongs to user's tenant
    const project = await this.prisma.project.findFirst({
      where: { id: projectId, tenantId: user.tenantId },
    });
    if (!project) {
      throw new NotFoundException('Project not found or access denied');
    }

    return this.findAll(pagination, user, undefined, projectId);
  }

  async findOne(id: string, user: RequestUser): Promise<ScadaView> {
    const view = await this.prisma.scadaView.findFirst({
      where: {
        id,
        OR: [
          { project: { tenantId: user.tenantId } },
          { area: { site: { project: { tenantId: user.tenantId } } } },
        ],
      },
      include: {
        area: { select: { id: true, name: true } },
        project: { select: { id: true, name: true } },
        scadaWidgets: {
          include: {
            widget: true,
          },
        },
      },
    });

    if (!view) {
      throw new NotFoundException('SCADA view not found');
    }

    return view;
  }

  async update(id: string, updateDto: UpdateScadaViewDto, user: RequestUser): Promise<ScadaView> {
    const view = await this.prisma.scadaView.findFirst({
      where: {
        id,
        OR: [
          { project: { tenantId: user.tenantId } },
          { area: { site: { project: { tenantId: user.tenantId } } } },
        ],
      },
    });

    if (!view) {
      throw new NotFoundException('SCADA view not found');
    }

    if (updateDto.name && updateDto.name !== view.name) {
      const whereUnique: any = { name: updateDto.name, id: { not: id } };
      if (view.projectId) whereUnique.projectId = view.projectId;
      else if (view.areaId) whereUnique.areaId = view.areaId;

      const existing = await this.prisma.scadaView.findFirst({ where: whereUnique });
      if (existing) {
        throw new ConflictException('SCADA view name already exists');
      }
    }

    return this.prisma.scadaView.update({
      where: { id },
      data: updateDto,
      include: {
        area: { select: { id: true, name: true } },
        project: { select: { id: true, name: true } },
        scadaWidgets: true,
      },
    });
  }

  async remove(id: string, user: RequestUser): Promise<void> {
    const view = await this.prisma.scadaView.findFirst({
      where: {
        id,
        OR: [
          { project: { tenantId: user.tenantId } },
          { area: { site: { project: { tenantId: user.tenantId } } } },
        ],
      },
    });

    if (!view) {
      throw new NotFoundException('SCADA view not found');
    }

    await this.prisma.scadaView.delete({ where: { id } });
  }

  // ========== ScadaWidget CRUD ==========

  private async ensureWidgetLibraryEntry(type: string, name: string): Promise<string> {
    // Find or create a Widget library entry for this type
    const libName = `__scada_${type}`;
    let widget = await this.prisma.widget.findUnique({ where: { name: libName } });
    if (!widget) {
      widget = await this.prisma.widget.create({
        data: {
          name: libName,
          type,
          config: {},
          template: {},
          description: `Auto-created library entry for SCADA ${type} widget`,
        },
      });
    }
    return widget.id;
  }

  async addWidget(viewId: string, dto: any, user: RequestUser) {
    // Verify view access
    const view = await this.findOne(viewId, user);

    // Ensure a Widget library entry exists for this type
    const widgetId = dto.widgetId || await this.ensureWidgetLibraryEntry(dto.type || 'custom', dto.name || 'Widget');

    const scadaWidget = await this.prisma.scadaWidget.create({
      data: {
        scadaViewId: viewId,
        widgetId,
        position: dto.position || dto.transform || { x: 100, y: 100, width: 100, height: 50 },
        properties: dto.properties || {},
        bindings: dto.bindings || dto.dataBindings || [],
        styles: dto.styles || dto.style || {},
        isVisible: dto.isVisible ?? dto.visible ?? true,
      },
      include: {
        widget: true,
      },
    });

    // Transform to FE-compatible shape
    return this.transformScadaWidgetToFE(scadaWidget);
  }

  async updateScadaWidget(viewId: string, scadaWidgetId: string, dto: any, user: RequestUser) {
    // Verify view access
    await this.findOne(viewId, user);

    const existing = await this.prisma.scadaWidget.findFirst({
      where: { id: scadaWidgetId, scadaViewId: viewId },
    });
    if (!existing) {
      throw new NotFoundException('Widget not found on this view');
    }

    const updated = await this.prisma.scadaWidget.update({
      where: { id: scadaWidgetId },
      data: {
        position: dto.position ?? undefined,
        properties: dto.properties ?? undefined,
        bindings: dto.bindings ?? undefined,
        styles: dto.styles ?? undefined,
        isVisible: dto.isVisible ?? undefined,
      },
      include: { widget: true },
    });

    return this.transformScadaWidgetToFE(updated);
  }

  async removeScadaWidget(viewId: string, scadaWidgetId: string, user: RequestUser) {
    await this.findOne(viewId, user);

    const existing = await this.prisma.scadaWidget.findFirst({
      where: { id: scadaWidgetId, scadaViewId: viewId },
    });
    if (!existing) {
      throw new NotFoundException('Widget not found on this view');
    }

    await this.prisma.scadaWidget.delete({ where: { id: scadaWidgetId } });
  }

  async duplicateScadaWidget(viewId: string, scadaWidgetId: string, user: RequestUser) {
    await this.findOne(viewId, user);

    const original = await this.prisma.scadaWidget.findFirst({
      where: { id: scadaWidgetId, scadaViewId: viewId },
      include: { widget: true },
    });
    if (!original) {
      throw new NotFoundException('Widget not found on this view');
    }

    const pos = original.position as any;
    const duplicated = await this.prisma.scadaWidget.create({
      data: {
        scadaViewId: viewId,
        widgetId: original.widgetId,
        position: { ...pos, x: (pos?.x || 0) + 20, y: (pos?.y || 0) + 20 },
        properties: original.properties as any,
        bindings: original.bindings as any,
        styles: original.styles as any,
        isVisible: original.isVisible,
      },
      include: { widget: true },
    });

    return this.transformScadaWidgetToFE(duplicated);
  }

  /** Transform a Prisma ScadaWidget (with widget relation) into the shape the FE expects */
  private transformScadaWidgetToFE(sw: any) {
    const pos = sw.position as any || {};
    return {
      id: sw.id,
      type: sw.widget?.type || (sw.properties as any)?.widgetType || 'custom',
      name: (sw.properties as any)?.name || sw.widget?.name || 'Widget',
      description: sw.widget?.description || '',
      transform: {
        position: { x: pos.x ?? 100, y: pos.y ?? 100 },
        size: { width: pos.width ?? 100, height: pos.height ?? 50 },
        rotation: pos.rotation ?? 0,
        scale: pos.scale ?? 1,
        zIndex: pos.zIndex ?? 0,
      },
      style: sw.styles || {},
      visible: sw.isVisible ?? true,
      enabled: true,
      locked: false,
      dataBindings: Array.isArray(sw.bindings) ? sw.bindings : [],
      actions: [],
      properties: sw.properties || {},
      createdTime: sw.createdAt?.toISOString?.() || new Date().toISOString(),
      updatedTime: sw.updatedAt?.toISOString?.() || new Date().toISOString(),
      createdBy: '',
    };
  }
}
