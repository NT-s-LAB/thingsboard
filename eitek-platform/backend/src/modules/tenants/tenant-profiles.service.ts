import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CreateTenantProfileDto } from './dto/create-tenant-profile.dto';
import { UpdateTenantProfileDto } from './dto/update-tenant-profile.dto';
import { PaginationDto, PaginatedResult } from '../../common/dto/pagination.dto';
import { TenantProfile } from '@prisma/client';

export interface TenantProfileWithCounts extends TenantProfile {
  tenantsCount: number;
}

@Injectable()
export class TenantProfilesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(
    createTenantProfileDto: CreateTenantProfileDto,
  ): Promise<TenantProfile> {
    // Check uniqueness of name
    const existing = await this.prisma.tenantProfile.findUnique({
      where: { name: createTenantProfileDto.name },
    });

    if (existing) {
      throw new ConflictException('Profile name already exists');
    }

    // If this is set as default, unset other defaults
    if (createTenantProfileDto.isDefault) {
      await this.prisma.tenantProfile.updateMany({
        where: { isDefault: true },
        data: { isDefault: false },
      });
    }

    return this.prisma.tenantProfile.create({
      data: createTenantProfileDto,
    });
  }

  async findAll(
    pagination: PaginationDto,
  ): Promise<PaginatedResult<TenantProfileWithCounts>> {
    const limit = pagination.effectiveLimit;
    const offset = pagination.offset;
    const search = pagination.effectiveSearch;
    const sortBy = pagination.effectiveSortBy;
    const sortOrder = pagination.effectiveSortOrder;

    const where: any = {};

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

    const [profiles, total] = await Promise.all([
      this.prisma.tenantProfile.findMany({
        where,
        include: {
          _count: {
            select: { tenants: true },
          },
        },
        skip: offset,
        take: limit,
        orderBy,
      }),
      this.prisma.tenantProfile.count({ where }),
    ]);

    const profilesWithCounts: TenantProfileWithCounts[] = profiles.map(
      (profile) => ({
        ...profile,
        tenantsCount: (profile as any)._count?.tenants || 0,
      }),
    );

    const totalPages = Math.ceil(total / limit);

    return {
      data: profilesWithCounts,
      pagination: {
        page: pagination.page,
        limit,
        total,
        totalPages,
        hasNext: pagination.page < totalPages,
        hasPrev: pagination.page > 1,
      },
    };
  }

  async findAllSimple(): Promise<TenantProfile[]> {
    return this.prisma.tenantProfile.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' },
    });
  }

  async findOne(id: string): Promise<TenantProfileWithCounts> {
    const profile = await this.prisma.tenantProfile.findUnique({
      where: { id },
      include: {
        _count: {
          select: { tenants: true },
        },
      },
    });

    if (!profile) {
      throw new NotFoundException(`Tenant profile with ID ${id} not found`);
    }

    return {
      ...profile,
      tenantsCount: (profile as any)._count?.tenants || 0,
    };
  }

  async findDefault(): Promise<TenantProfile | null> {
    return this.prisma.tenantProfile.findFirst({
      where: { isDefault: true, isActive: true },
    });
  }

  async update(
    id: string,
    updateTenantProfileDto: UpdateTenantProfileDto,
  ): Promise<TenantProfile> {
    const profile = await this.prisma.tenantProfile.findUnique({
      where: { id },
    });

    if (!profile) {
      throw new NotFoundException(`Tenant profile with ID ${id} not found`);
    }

    // Check name uniqueness if name is being changed
    if (
      updateTenantProfileDto.name &&
      updateTenantProfileDto.name !== profile.name
    ) {
      const existing = await this.prisma.tenantProfile.findUnique({
        where: { name: updateTenantProfileDto.name },
      });

      if (existing) {
        throw new ConflictException('Profile name already exists');
      }
    }

    // If this is set as default, unset other defaults
    if (updateTenantProfileDto.isDefault && !profile.isDefault) {
      await this.prisma.tenantProfile.updateMany({
        where: { isDefault: true, id: { not: id } },
        data: { isDefault: false },
      });
    }

    return this.prisma.tenantProfile.update({
      where: { id },
      data: updateTenantProfileDto,
    });
  }

  async remove(id: string): Promise<{ message: string }> {
    const profile = await this.prisma.tenantProfile.findUnique({
      where: { id },
      include: {
        _count: {
          select: { tenants: true },
        },
      },
    });

    if (!profile) {
      throw new NotFoundException(`Tenant profile with ID ${id} not found`);
    }

    // Prevent deletion if tenants are using this profile
    if ((profile as any)._count?.tenants > 0) {
      throw new BadRequestException(
        `Cannot delete profile. ${(profile as any)._count?.tenants} tenant(s) are using this profile.`,
      );
    }

    // Prevent deletion of default profile
    if (profile.isDefault) {
      throw new BadRequestException('Cannot delete the default profile');
    }

    await this.prisma.tenantProfile.delete({
      where: { id },
    });

    return { message: 'Tenant profile deleted successfully' };
  }

  async setDefault(id: string): Promise<TenantProfile> {
    const profile = await this.prisma.tenantProfile.findUnique({
      where: { id },
    });

    if (!profile) {
      throw new NotFoundException(`Tenant profile with ID ${id} not found`);
    }

    // Unset current default
    await this.prisma.tenantProfile.updateMany({
      where: { isDefault: true },
      data: { isDefault: false },
    });

    // Set new default
    return this.prisma.tenantProfile.update({
      where: { id },
      data: { isDefault: true },
    });
  }

  async duplicate(id: string): Promise<TenantProfile> {
    const profile = await this.prisma.tenantProfile.findUnique({
      where: { id },
    });

    if (!profile) {
      throw new NotFoundException(`Tenant profile with ID ${id} not found`);
    }

    // Generate new unique name
    let newName = `${profile.name} (Copy)`;
    let counter = 1;
    while (await this.prisma.tenantProfile.findUnique({ where: { name: newName } })) {
      counter++;
      newName = `${profile.name} (Copy ${counter})`;
    }

    return this.prisma.tenantProfile.create({
      data: {
        name: newName,
        description: profile.description,
        maxUsers: profile.maxUsers,
        maxDevices: profile.maxDevices,
        maxProjects: profile.maxProjects,
        maxDashboards: profile.maxDashboards,
        maxApiCalls: profile.maxApiCalls,
        features: profile.features,
        isDefault: false,
        isActive: true,
      },
    });
  }
}
