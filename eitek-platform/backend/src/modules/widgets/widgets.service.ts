import { Injectable, NotFoundException, ConflictException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CreateWidgetDto } from './dto/create-widget.dto';
import { UpdateWidgetDto } from './dto/update-widget.dto';
import { PaginationDto, PaginatedResult } from '../../common/dto/pagination.dto';
import { Widget } from '@prisma/client';
import { RequestUser } from '../../common/interfaces/common.interface';

const SUPER_ADMIN_ROLE = 'SUPER_ADMIN';

@Injectable()
export class WidgetsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createDto: CreateWidgetDto, user: RequestUser): Promise<Widget> {
    const isSuperAdmin = user?.roles?.includes(SUPER_ADMIN_ROLE) ?? false;
    const tenantId = isSuperAdmin ? null : user.tenantId;

    // Check uniqueness of widget name within tenant scope
    const existing = await this.prisma.widget.findFirst({
      where: { name: createDto.name, tenantId },
    });

    if (existing) {
      throw new ConflictException('Widget name already exists');
    }

    // Verify category exists if provided
    if (createDto.categoryId) {
      const category = await this.prisma.widgetCategory.findUnique({
        where: { id: createDto.categoryId },
      });
      if (!category) {
        throw new NotFoundException('Widget category not found');
      }
    }

    // Verify symbol exists if provided
    if (createDto.symbolId) {
      const symbol = await this.prisma.symbol.findUnique({
        where: { id: createDto.symbolId },
      });
      if (!symbol) {
        throw new NotFoundException('Symbol not found');
      }
    }

    return this.prisma.widget.create({
      data: {
        ...createDto,
        isSystem: isSuperAdmin,
        tenantId,
      },
      include: {
        category: true,
        symbol: true,
      },
    });
  }

  async findAll(pagination: PaginationDto, user: RequestUser, categoryId?: string): Promise<PaginatedResult<Widget>> {
    const page = pagination.page;
    const limit = pagination.effectiveLimit;
    const offset = pagination.offset;
    const search = pagination.effectiveSearch;
    const sortBy = pagination.effectiveSortBy;
    const sortOrder = pagination.effectiveSortOrder;

    const isSuperAdmin = user?.roles?.includes(SUPER_ADMIN_ROLE) ?? false;

    const where: any = {};

    // Tenant filtering: system widgets (tenantId = null) + own tenant widgets
    if (!isSuperAdmin) {
      where.OR = [
        { tenantId: null },  // System widgets (visible to all)
        { tenantId: user.tenantId },  // Own tenant widgets
      ];
    }

    if (categoryId) {
      where.categoryId = categoryId;
    }

    if (search) {
      where.AND = [
        ...(where.AND || []),
        {
          OR: [
            { name: { contains: search, mode: 'insensitive' } },
            { description: { contains: search, mode: 'insensitive' } },
            { type: { contains: search, mode: 'insensitive' } },
          ],
        },
      ];
    }

    const orderBy: any = {};
    if (sortBy) {
      orderBy[sortBy] = sortOrder;
    } else {
      orderBy.createdAt = 'desc';
    }

    const [widgets, total] = await Promise.all([
      this.prisma.widget.findMany({
        where,
        include: {
          category: true,
          symbol: true,
          _count: { select: { scadaWidgets: true } },
        },
        skip: offset,
        take: limit,
        orderBy,
      }),
      this.prisma.widget.count({ where }),
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
      data: widgets,
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

  async findOne(id: string): Promise<Widget> {
    const widget = await this.prisma.widget.findUnique({
      where: { id },
      include: {
        category: true,
        symbol: true,
        scadaWidgets: {
          include: {
            scadaView: { select: { id: true, name: true } },
          },
        },
      },
    });

    if (!widget) {
      throw new NotFoundException('Widget not found');
    }

    return widget;
  }

  async update(id: string, updateDto: UpdateWidgetDto, user: RequestUser): Promise<Widget> {
    const widget = await this.prisma.widget.findUnique({ where: { id } });

    if (!widget) {
      throw new NotFoundException('Widget not found');
    }

    const isSuperAdmin = user?.roles?.includes(SUPER_ADMIN_ROLE) ?? false;
    
    // Permission check: only owner can update
    if (widget.isSystem && !isSuperAdmin) {
      throw new ForbiddenException('Only Super Admin can update system widgets');
    }
    if (!widget.isSystem && widget.tenantId !== user.tenantId && !isSuperAdmin) {
      throw new ForbiddenException('You can only update your own widgets');
    }

    if (updateDto.name && updateDto.name !== widget.name) {
      const existing = await this.prisma.widget.findFirst({
        where: { name: updateDto.name, tenantId: widget.tenantId },
      });
      if (existing) {
        throw new ConflictException('Widget name already exists');
      }
    }

    return this.prisma.widget.update({
      where: { id },
      data: updateDto,
      include: {
        category: true,
        symbol: true,
      },
    });
  }

  async remove(id: string, user: RequestUser): Promise<void> {
    const widget = await this.prisma.widget.findUnique({ where: { id } });

    if (!widget) {
      throw new NotFoundException('Widget not found');
    }

    const isSuperAdmin = user?.roles?.includes(SUPER_ADMIN_ROLE) ?? false;
    
    // Permission check: only owner can delete
    if (widget.isSystem && !isSuperAdmin) {
      throw new ForbiddenException('Only Super Admin can delete system widgets');
    }
    if (!widget.isSystem && widget.tenantId !== user.tenantId && !isSuperAdmin) {
      throw new ForbiddenException('You can only delete your own widgets');
    }

    // Delete related ScadaWidget records first to avoid FK constraint errors
    await this.prisma.scadaWidget.deleteMany({ where: { widgetId: id } });

    await this.prisma.widget.delete({ where: { id } });
  }
}
