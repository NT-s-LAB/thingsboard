import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CreateSiteDto } from './dto/create-site.dto';
import { UpdateSiteDto } from './dto/update-site.dto';
import { PaginationDto, PaginatedResult } from '../../common/dto/pagination.dto';
import { RequestUser } from '../../common/interfaces/common.interface';
import { Site } from '@prisma/client';

@Injectable()
export class SitesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createSiteDto: CreateSiteDto, user: RequestUser): Promise<Site> {
    // Verify project exists and belongs to user's tenant
    const project = await this.prisma.project.findFirst({
      where: {
        id: createSiteDto.projectId,
        tenantId: user.tenantId,
      },
    });

    if (!project) {
      throw new NotFoundException('Project not found or access denied');
    }

    // Check uniqueness of name within project
    const existing = await this.prisma.site.findFirst({
      where: {
        projectId: createSiteDto.projectId,
        name: createSiteDto.name,
      },
    });

    if (existing) {
      throw new ConflictException('Site name already exists in this project');
    }

    return this.prisma.site.create({
      data: createSiteDto,
      include: {
        project: { select: { id: true, name: true } },
        _count: { select: { areas: true } },
      },
    });
  }

  async findAll(pagination: PaginationDto, user: RequestUser, projectId?: string): Promise<PaginatedResult<Site>> {
    const { page, limit, offset, search, sortBy, sortOrder } = pagination;

    const where: any = {
      project: { tenantId: user.tenantId },
    };

    if (projectId) {
      where.projectId = projectId;
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { address: { contains: search, mode: 'insensitive' } },
      ];
    }

    const orderBy: any = {};
    if (sortBy) {
      orderBy[sortBy] = sortOrder;
    } else {
      orderBy.createdAt = 'desc';
    }

    const [sites, total] = await Promise.all([
      this.prisma.site.findMany({
        where,
        include: {
          project: { select: { id: true, name: true } },
          _count: { select: { areas: true } },
        },
        skip: offset,
        take: limit,
        orderBy,
      }),
      this.prisma.site.count({ where }),
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
      data: sites,
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

  async findOne(id: string, user: RequestUser): Promise<Site> {
    const site = await this.prisma.site.findFirst({
      where: {
        id,
        project: { tenantId: user.tenantId },
      },
      include: {
        project: { select: { id: true, name: true } },
        areas: { select: { id: true, name: true, isActive: true } },
        _count: { select: { areas: true } },
      },
    });

    if (!site) {
      throw new NotFoundException('Site not found');
    }

    return site;
  }

  async update(id: string, updateSiteDto: UpdateSiteDto, user: RequestUser): Promise<Site> {
    const site = await this.prisma.site.findFirst({
      where: {
        id,
        project: { tenantId: user.tenantId },
      },
    });

    if (!site) {
      throw new NotFoundException('Site not found');
    }

    if (updateSiteDto.name && updateSiteDto.name !== site.name) {
      const existing = await this.prisma.site.findFirst({
        where: {
          projectId: site.projectId,
          name: updateSiteDto.name,
          id: { not: id },
        },
      });
      if (existing) {
        throw new ConflictException('Site name already exists in this project');
      }
    }

    return this.prisma.site.update({
      where: { id },
      data: updateSiteDto,
      include: {
        project: { select: { id: true, name: true } },
        _count: { select: { areas: true } },
      },
    });
  }

  async remove(id: string, user: RequestUser): Promise<void> {
    const site = await this.prisma.site.findFirst({
      where: {
        id,
        project: { tenantId: user.tenantId },
      },
    });

    if (!site) {
      throw new NotFoundException('Site not found');
    }

    await this.prisma.site.delete({ where: { id } });
  }
}
