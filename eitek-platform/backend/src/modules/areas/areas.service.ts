import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CreateAreaDto, UpdateAreaDto } from './dto/area.dto';
import { PaginationDto, PaginatedResult } from '../../common/dto/pagination.dto';
import { RequestUser } from '../../common/interfaces/common.interface';
import { Area } from '@prisma/client';

@Injectable()
export class AreasService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Create a new area
   */
  async create(createAreaDto: CreateAreaDto, user: RequestUser): Promise<Area> {
    // Verify site exists and belongs to user's tenant
    const site = await this.prisma.site.findFirst({
      where: {
        id: createAreaDto.siteId,
        project: { tenantId: user.tenantId },
      },
    });

    if (!site) {
      throw new NotFoundException('Site not found or access denied');
    }

    // Check if area name is unique within the site
    const existingArea = await this.prisma.area.findFirst({
      where: {
        siteId: createAreaDto.siteId,
        name: createAreaDto.name,
      },
    });

    if (existingArea) {
      throw new ConflictException('Area name already exists in this site');
    }

    return this.prisma.area.create({
      data: {
        name: createAreaDto.name,
        description: createAreaDto.description,
        metadata: createAreaDto.metadata || {},
        isActive: createAreaDto.isActive ?? true,
        siteId: createAreaDto.siteId,
      },
      include: {
        site: { select: { id: true, name: true } },
        _count: { select: { devices: true, scadaViews: true } },
      },
    });
  }

  /**
   * Get all areas with pagination
   */
  async findAll(
    pagination: PaginationDto,
    user: RequestUser,
    siteId?: string,
  ): Promise<PaginatedResult<Area>> {
    const page = pagination.page;
    const limit = pagination.effectiveLimit;
    const offset = pagination.offset;
    const search = pagination.effectiveSearch;
    const sortBy = pagination.effectiveSortBy;
    const sortOrder = pagination.effectiveSortOrder;

    const where: any = {
      site: {
        project: { tenantId: user.tenantId },
      },
    };

    if (siteId) {
      where.siteId = siteId;
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
      orderBy.name = 'asc';
    }

    const [areas, total] = await Promise.all([
      this.prisma.area.findMany({
        where,
        include: {
          site: { select: { id: true, name: true } },
          _count: { select: { devices: true, scadaViews: true } },
        },
        skip: offset,
        take: limit,
        orderBy,
      }),
      this.prisma.area.count({ where }),
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
      data: areas,
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

  /**
   * Get area by ID
   */
  async findOne(id: string, user: RequestUser): Promise<Area> {
    const area = await this.prisma.area.findFirst({
      where: {
        id,
        site: {
          project: { tenantId: user.tenantId },
        },
      },
      include: {
        site: { select: { id: true, name: true } },
        devices: {
          select: { id: true, name: true, isActive: true, isOnline: true },
        },
        scadaViews: {
          select: { id: true, name: true, isActive: true },
        },
        _count: { select: { devices: true, scadaViews: true } },
      },
    });

    if (!area) {
      throw new NotFoundException('Area not found');
    }

    return area;
  }

  /**
   * Update area
   */
  async update(id: string, updateAreaDto: UpdateAreaDto, user: RequestUser): Promise<Area> {
    const existingArea = await this.prisma.area.findFirst({
      where: {
        id,
        site: {
          project: { tenantId: user.tenantId },
        },
      },
    });

    if (!existingArea) {
      throw new NotFoundException('Area not found');
    }

    // Check for name uniqueness within site if name is changed
    if (updateAreaDto.name && updateAreaDto.name !== existingArea.name) {
      const duplicate = await this.prisma.area.findFirst({
        where: {
          siteId: existingArea.siteId,
          name: updateAreaDto.name,
          id: { not: id },
        },
      });

      if (duplicate) {
        throw new ConflictException('Area name already exists in this site');
      }
    }

    return this.prisma.area.update({
      where: { id },
      data: {
        ...(updateAreaDto.name && { name: updateAreaDto.name }),
        ...(updateAreaDto.description !== undefined && { description: updateAreaDto.description }),
        ...(updateAreaDto.metadata !== undefined && { metadata: updateAreaDto.metadata }),
        ...(updateAreaDto.isActive !== undefined && { isActive: updateAreaDto.isActive }),
      },
      include: {
        site: { select: { id: true, name: true } },
        _count: { select: { devices: true, scadaViews: true } },
      },
    });
  }

  /**
   * Delete area
   */
  async remove(id: string, user: RequestUser): Promise<void> {
    const area = await this.prisma.area.findFirst({
      where: {
        id,
        site: {
          project: { tenantId: user.tenantId },
        },
      },
      include: {
        _count: { select: { devices: true, scadaViews: true } },
      },
    });

    if (!area) {
      throw new NotFoundException('Area not found');
    }

    if (area._count.devices > 0) {
      throw new BadRequestException('Cannot delete area with devices. Move or delete devices first.');
    }

    if (area._count.scadaViews > 0) {
      throw new BadRequestException('Cannot delete area with SCADA views. Delete views first.');
    }

    await this.prisma.area.delete({ where: { id } });
  }
}