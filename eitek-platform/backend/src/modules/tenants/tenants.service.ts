import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CreateTenantDto } from './dto/create-tenant.dto';
import { UpdateTenantDto } from './dto/update-tenant.dto';
import { PaginationDto, PaginatedResult } from '../../common/dto/pagination.dto';
import { Tenant } from '@prisma/client';

export interface TenantWithCounts extends Tenant {
  usersCount: number;
  projectsCount: number;
  devicesCount: number;
}

@Injectable()
export class TenantsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createTenantDto: CreateTenantDto): Promise<Tenant> {
    // Check uniqueness of name and code
    const existing = await this.prisma.tenant.findFirst({
      where: {
        OR: [
          { name: createTenantDto.name },
          { code: createTenantDto.code },
        ],
      },
    });

    if (existing) {
      throw new ConflictException(
        existing.name === createTenantDto.name
          ? 'Tenant name already exists'
          : 'Tenant code already exists',
      );
    }

    return this.prisma.tenant.create({
      data: createTenantDto,
    });
  }

  async findAll(pagination: PaginationDto): Promise<PaginatedResult<TenantWithCounts>> {
    const page = pagination.page;
    const limit = pagination.effectiveLimit;
    const offset = pagination.offset;
    const search = pagination.effectiveSearch;
    const sortBy = pagination.effectiveSortBy;
    const sortOrder = pagination.effectiveSortOrder;

    const where: any = {};

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { code: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    const orderBy: any = {};
    if (sortBy) {
      orderBy[sortBy] = sortOrder;
    } else {
      orderBy.createdAt = 'desc';
    }

    const [tenants, total] = await Promise.all([
      this.prisma.tenant.findMany({
        where,
        include: {
          _count: {
            select: { users: true, projects: true },
          },
        },
        skip: offset,
        take: limit,
        orderBy,
      }),
      this.prisma.tenant.count({ where }),
    ]);

    // Get device counts for each tenant (Device -> Area -> Site -> Project -> Tenant)
    const tenantsWithCounts = await Promise.all(
      tenants.map(async (tenant) => {
        const devicesCount = await this.prisma.device.count({
          where: {
            area: {
              site: {
                project: {
                  tenantId: tenant.id,
                },
              },
            },
          },
        });

        return {
          ...tenant,
          usersCount: (tenant as any)._count?.users || 0,
          projectsCount: (tenant as any)._count?.projects || 0,
          devicesCount,
        };
      }),
    );

    const totalPages = Math.ceil(total / limit);

    return {
      data: tenantsWithCounts,
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

  async findOne(id: string): Promise<TenantWithCounts> {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id },
      include: {
        _count: {
          select: { users: true, projects: true },
        },
      },
    });

    if (!tenant) {
      throw new NotFoundException('Tenant not found');
    }

    // Get device count for this tenant
    const devicesCount = await this.prisma.device.count({
      where: {
        area: {
          site: {
            project: {
              tenantId: id,
            },
          },
        },
      },
    });

    return {
      ...tenant,
      usersCount: (tenant as any)._count?.users || 0,
      projectsCount: (tenant as any)._count?.projects || 0,
      devicesCount,
    };
  }

  async update(id: string, updateTenantDto: UpdateTenantDto): Promise<Tenant> {
    const tenant = await this.prisma.tenant.findUnique({ where: { id } });

    if (!tenant) {
      throw new NotFoundException('Tenant not found');
    }

    if (updateTenantDto.name && updateTenantDto.name !== tenant.name) {
      const existing = await this.prisma.tenant.findUnique({
        where: { name: updateTenantDto.name },
      });
      if (existing) {
        throw new ConflictException('Tenant name already exists');
      }
    }

    if (updateTenantDto.code && updateTenantDto.code !== tenant.code) {
      const existing = await this.prisma.tenant.findUnique({
        where: { code: updateTenantDto.code },
      });
      if (existing) {
        throw new ConflictException('Tenant code already exists');
      }
    }

    return this.prisma.tenant.update({
      where: { id },
      data: updateTenantDto,
    });
  }

  async remove(id: string): Promise<void> {
    const tenant = await this.prisma.tenant.findUnique({ where: { id } });

    if (!tenant) {
      throw new NotFoundException('Tenant not found');
    }

    await this.prisma.tenant.delete({ where: { id } });
  }

}
