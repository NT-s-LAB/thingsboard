import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
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
    // Verify area exists and belongs to user's tenant
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

    return this.prisma.scadaView.create({
      data: createDto,
      include: {
        area: { select: { id: true, name: true } },
        scadaWidgets: true,
      },
    });
  }

  async findAll(pagination: PaginationDto, user: RequestUser, areaId?: string): Promise<PaginatedResult<ScadaView>> {
    const page = pagination.page;
    const limit = pagination.effectiveLimit;
    const offset = pagination.offset;
    const search = pagination.effectiveSearch;
    const sortBy = pagination.effectiveSortBy;
    const sortOrder = pagination.effectiveSortOrder;

    const where: any = {
      area: {
        site: {
          project: { tenantId: user.tenantId },
        },
      },
    };

    if (areaId) {
      where.areaId = areaId;
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
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

  async findOne(id: string, user: RequestUser): Promise<ScadaView> {
    const view = await this.prisma.scadaView.findFirst({
      where: {
        id,
        area: {
          site: {
            project: { tenantId: user.tenantId },
          },
        },
      },
      include: {
        area: { select: { id: true, name: true } },
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
        area: {
          site: {
            project: { tenantId: user.tenantId },
          },
        },
      },
    });

    if (!view) {
      throw new NotFoundException('SCADA view not found');
    }

    if (updateDto.name && updateDto.name !== view.name) {
      const existing = await this.prisma.scadaView.findFirst({
        where: {
          areaId: view.areaId,
          name: updateDto.name,
          id: { not: id },
        },
      });
      if (existing) {
        throw new ConflictException('SCADA view name already exists in this area');
      }
    }

    return this.prisma.scadaView.update({
      where: { id },
      data: updateDto,
      include: {
        area: { select: { id: true, name: true } },
        scadaWidgets: true,
      },
    });
  }

  async remove(id: string, user: RequestUser): Promise<void> {
    const view = await this.prisma.scadaView.findFirst({
      where: {
        id,
        area: {
          site: {
            project: { tenantId: user.tenantId },
          },
        },
      },
    });

    if (!view) {
      throw new NotFoundException('SCADA view not found');
    }

    await this.prisma.scadaView.delete({ where: { id } });
  }
}
