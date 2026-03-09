import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CreateWidgetCategoryDto } from './dto/create-widget-category.dto';
import { UpdateWidgetCategoryDto } from './dto/update-widget-category.dto';
import { PaginationDto, PaginatedResult } from '../../common/dto/pagination.dto';
import { WidgetCategory } from '@prisma/client';

@Injectable()
export class WidgetCategoriesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateWidgetCategoryDto): Promise<WidgetCategory> {
    const existing = await this.prisma.widgetCategory.findFirst({
      where: { name: dto.name, parentId: dto.parentId ?? null },
    });
    if (existing) {
      throw new ConflictException('Category name already exists in this level');
    }

    if (dto.parentId) {
      const parent = await this.prisma.widgetCategory.findUnique({ where: { id: dto.parentId } });
      if (!parent) {
        throw new NotFoundException('Parent category not found');
      }
    }

    return this.prisma.widgetCategory.create({
      data: {
        name: dto.name,
        description: dto.description,
        icon: dto.icon,
        order: dto.order ?? 0,
        isActive: dto.isActive ?? true,
        parentId: dto.parentId ?? null,
      },
      include: {
        children: true,
        _count: { select: { widgets: true, children: true } },
      },
    });
  }

  async findAll(pagination: PaginationDto): Promise<PaginatedResult<WidgetCategory>> {
    const page = pagination.page;
    const limit = pagination.effectiveLimit;
    const offset = pagination.offset;
    const search = pagination.effectiveSearch;

    const where: any = {};

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    } else {
      // When not searching, return only root categories (tree structure)
      where.parentId = null;
    }

    const includeChildren = {
      children: {
        include: {
          children: {
            include: {
              children: true,
              _count: { select: { widgets: true, children: true } },
            },
            orderBy: { order: 'asc' as const },
          },
          _count: { select: { widgets: true, children: true } },
        },
        orderBy: { order: 'asc' as const },
      },
      _count: { select: { widgets: true, children: true } },
    };

    const [categories, total] = await Promise.all([
      this.prisma.widgetCategory.findMany({
        where,
        include: includeChildren,
        skip: offset,
        take: limit,
        orderBy: { order: 'asc' },
      }),
      this.prisma.widgetCategory.count({ where }),
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
      data: categories,
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

  async findOne(id: string): Promise<WidgetCategory> {
    const category = await this.prisma.widgetCategory.findUnique({
      where: { id },
      include: {
        widgets: {
          select: { id: true, name: true, type: true, preview: true, isActive: true },
          orderBy: { createdAt: 'desc' },
        },
        children: {
          include: {
            _count: { select: { widgets: true, children: true } },
          },
          orderBy: { order: 'asc' },
        },
        _count: { select: { widgets: true, children: true } },
      },
    });

    if (!category) {
      throw new NotFoundException('Widget category not found');
    }

    return category;
  }

  async update(id: string, dto: UpdateWidgetCategoryDto): Promise<WidgetCategory> {
    const category = await this.prisma.widgetCategory.findUnique({ where: { id } });
    if (!category) {
      throw new NotFoundException('Widget category not found');
    }

    const newName = dto.name ?? category.name;
    const newParentId = dto.parentId !== undefined ? dto.parentId : category.parentId;

    if (newName !== category.name || (dto.parentId !== undefined && dto.parentId !== category.parentId)) {
      const existing = await this.prisma.widgetCategory.findFirst({
        where: { name: newName, parentId: newParentId ?? null, id: { not: id } },
      });
      if (existing) {
        throw new ConflictException('Category name already exists in this level');
      }
    }

    return this.prisma.widgetCategory.update({
      where: { id },
      data: dto,
      include: {
        children: true,
        _count: { select: { widgets: true, children: true } },
      },
    });
  }

  async remove(id: string): Promise<void> {
    const category = await this.prisma.widgetCategory.findUnique({
      where: { id },
      include: { _count: { select: { widgets: true, children: true } } },
    });

    if (!category) {
      throw new NotFoundException('Widget category not found');
    }

    // Collect all descendant IDs for widget unlinking
    const descendantIds = await this.collectDescendantIds(id);
    const allIds = [id, ...descendantIds];

    // Unlink widgets from this category and all descendants before deleting
    await this.prisma.widget.updateMany({
      where: { categoryId: { in: allIds } },
      data: { categoryId: null },
    });

    // Delete category (children cascade via onDelete: Cascade)
    await this.prisma.widgetCategory.delete({ where: { id } });
  }

  private async collectDescendantIds(parentId: string): Promise<string[]> {
    const children = await this.prisma.widgetCategory.findMany({
      where: { parentId },
      select: { id: true },
    });
    const ids: string[] = [];
    for (const child of children) {
      ids.push(child.id);
      const grandchildren = await this.collectDescendantIds(child.id);
      ids.push(...grandchildren);
    }
    return ids;
  }
}
