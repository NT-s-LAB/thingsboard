import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { PaginationDto, PaginatedResult } from '../../common/dto/pagination.dto';
import { RequestUser } from '../../common/interfaces/common.interface';
import { TenantAddonService } from '../addons/tenant-addon.service';
import { Project } from '@prisma/client';

@Injectable()
export class ProjectsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tenantAddonService: TenantAddonService,
  ) {}

  async create(createProjectDto: CreateProjectDto, user: RequestUser): Promise<Project> {
    const tenantId = user.tenantId;

    // Check tenant quota before creating
    await this.tenantAddonService.checkQuota(tenantId, 'PROJECTS');

    // Check uniqueness of name within tenant
    const existing = await this.prisma.project.findFirst({
      where: {
        tenantId,
        name: createProjectDto.name,
      },
    });

    if (existing) {
      throw new ConflictException('Project name already exists in this tenant');
    }

    return this.prisma.project.create({
      data: {
        name: createProjectDto.name,
        description: createProjectDto.description,
        settings: createProjectDto.settings || {},
        isActive: createProjectDto.isActive ?? true,
        tenantId,
      },
      include: {
        tenant: { select: { id: true, name: true } },
        _count: { select: { sites: true, userProjects: true } },
      },
    });
  }

  async findAll(pagination: PaginationDto, tenantId: string): Promise<PaginatedResult<Project>> {
    const page = pagination.page;
    const limit = pagination.effectiveLimit;
    const offset = pagination.offset;
    const search = pagination.effectiveSearch;
    const sortBy = pagination.effectiveSortBy;
    const sortOrder = pagination.effectiveSortOrder;

    const where: any = { tenantId };

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

    const [projects, total] = await Promise.all([
      this.prisma.project.findMany({
        where,
        include: {
          tenant: { select: { id: true, name: true } },
          _count: { select: { sites: true, userProjects: true } },
        },
        skip: offset,
        take: limit,
        orderBy,
      }),
      this.prisma.project.count({ where }),
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
      data: projects,
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

  async findOne(id: string, tenantId: string): Promise<Project> {
    const project = await this.prisma.project.findFirst({
      where: { id, tenantId },
      include: {
        tenant: { select: { id: true, name: true } },
        sites: { select: { id: true, name: true, isActive: true } },
        _count: { select: { sites: true, userProjects: true } },
      },
    });

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    return project;
  }

  async update(id: string, updateProjectDto: UpdateProjectDto, tenantId: string): Promise<Project> {
    const project = await this.prisma.project.findFirst({
      where: { id, tenantId },
    });

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    if (updateProjectDto.name && updateProjectDto.name !== project.name) {
      const existing = await this.prisma.project.findFirst({
        where: { tenantId, name: updateProjectDto.name, id: { not: id } },
      });
      if (existing) {
        throw new ConflictException('Project name already exists in this tenant');
      }
    }

    return this.prisma.project.update({
      where: { id },
      data: updateProjectDto,
      include: {
        tenant: { select: { id: true, name: true } },
        _count: { select: { sites: true, userProjects: true } },
      },
    });
  }

  async remove(id: string, tenantId: string): Promise<void> {
    const project = await this.prisma.project.findFirst({
      where: { id, tenantId },
    });

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    await this.prisma.project.delete({ where: { id } });
  }

  async getRecentProjects(tenantId: string, limit: number): Promise<Project[]> {
    return this.prisma.project.findMany({
      where: { tenantId },
      include: {
        tenant: { select: { id: true, name: true } },
        _count: { select: { sites: true, userProjects: true } },
      },
      orderBy: { updatedAt: 'desc' },
      take: limit,
    });
  }

  async getFavoriteProjects(userId: string, tenantId: string): Promise<Project[]> {
    const userProjects = await this.prisma.userProject.findMany({
      where: { userId },
      include: {
        project: {
          include: {
            tenant: { select: { id: true, name: true } },
            _count: { select: { sites: true, userProjects: true } },
          },
        },
      },
    });

    return userProjects
      .map((up) => up.project)
      .filter((p) => p.tenantId === tenantId);
  }

  async addToFavorites(projectId: string, userId: string, tenantId: string): Promise<void> {
    const project = await this.prisma.project.findFirst({
      where: { id: projectId, tenantId },
    });

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    await this.prisma.userProject.upsert({
      where: {
        userId_projectId: { userId, projectId },
      },
      update: {},
      create: {
        userId,
        projectId,
        role: 'member',
      },
    });
  }

  async removeFromFavorites(projectId: string, userId: string): Promise<void> {
    await this.prisma.userProject.deleteMany({
      where: { userId, projectId },
    });
  }
}
