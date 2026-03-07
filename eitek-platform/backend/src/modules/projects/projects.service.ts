import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { PaginationDto, PaginatedResult } from '../../common/dto/pagination.dto';
import { RequestUser } from '../../common/interfaces/common.interface';
import { Project } from '@prisma/client';

@Injectable()
export class ProjectsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createProjectDto: CreateProjectDto, user: RequestUser): Promise<Project> {
    // Verify tenant exists
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: createProjectDto.tenantId },
    });

    if (!tenant) {
      throw new NotFoundException('Tenant not found');
    }

    // Check uniqueness of name within tenant
    const existing = await this.prisma.project.findFirst({
      where: {
        tenantId: createProjectDto.tenantId,
        name: createProjectDto.name,
      },
    });

    if (existing) {
      throw new ConflictException('Project name already exists in this tenant');
    }

    return this.prisma.project.create({
      data: createProjectDto,
      include: {
        tenant: { select: { id: true, name: true } },
        _count: { select: { sites: true, userProjects: true } },
      },
    });
  }

  async findAll(pagination: PaginationDto, tenantId: string): Promise<PaginatedResult<Project>> {
    const { page, limit, offset, search, sortBy, sortOrder } = pagination;

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
}
