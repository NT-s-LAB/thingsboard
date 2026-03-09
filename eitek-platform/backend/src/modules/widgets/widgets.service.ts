import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CreateWidgetDto } from './dto/create-widget.dto';
import { UpdateWidgetDto } from './dto/update-widget.dto';
import { PaginationDto, PaginatedResult } from '../../common/dto/pagination.dto';
import { Widget } from '@prisma/client';

@Injectable()
export class WidgetsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createDto: CreateWidgetDto): Promise<Widget> {
    // Check uniqueness of widget name
    const existing = await this.prisma.widget.findUnique({
      where: { name: createDto.name },
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
      data: createDto,
      include: {
        category: true,
        symbol: true,
      },
    });
  }

  async findAll(pagination: PaginationDto, categoryId?: string): Promise<PaginatedResult<Widget>> {
    const page = pagination.page;
    const limit = pagination.effectiveLimit;
    const offset = pagination.offset;
    const search = pagination.effectiveSearch;
    const sortBy = pagination.effectiveSortBy;
    const sortOrder = pagination.effectiveSortOrder;

    const where: any = {};

    if (categoryId) {
      where.categoryId = categoryId;
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { type: { contains: search, mode: 'insensitive' } },
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

  async update(id: string, updateDto: UpdateWidgetDto): Promise<Widget> {
    const widget = await this.prisma.widget.findUnique({ where: { id } });

    if (!widget) {
      throw new NotFoundException('Widget not found');
    }

    if (updateDto.name && updateDto.name !== widget.name) {
      const existing = await this.prisma.widget.findUnique({
        where: { name: updateDto.name },
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

  async remove(id: string): Promise<void> {
    const widget = await this.prisma.widget.findUnique({ where: { id } });

    if (!widget) {
      throw new NotFoundException('Widget not found');
    }

    // Delete related ScadaWidget records first to avoid FK constraint errors
    await this.prisma.scadaWidget.deleteMany({ where: { widgetId: id } });

    await this.prisma.widget.delete({ where: { id } });
  }
}
