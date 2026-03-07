import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CreateTenantDto } from './dto/create-tenant.dto';
import { UpdateTenantDto } from './dto/update-tenant.dto';
import { PaginationDto, PaginatedResult } from '../../common/dto/pagination.dto';
import { Tenant } from '@prisma/client';

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

  async findAll(pagination: PaginationDto): Promise<PaginatedResult<Tenant>> {
    const { page, limit, offset, search, sortBy, sortOrder } = pagination;

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

    const totalPages = Math.ceil(total / limit);

    return {
      data: tenants,
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

  async findOne(id: string): Promise<Tenant> {
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

    return tenant;
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
