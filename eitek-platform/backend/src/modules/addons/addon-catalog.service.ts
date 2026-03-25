import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '@/database/prisma.service';
import { CreateAddonCatalogDto } from './dto/create-addon-catalog.dto';
import { UpdateAddonCatalogDto } from './dto/update-addon-catalog.dto';
import { PaginationDto, PaginatedResult } from '@/common/dto/pagination.dto';
import { AddonCatalog } from '@prisma/client';

@Injectable()
export class AddonCatalogService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateAddonCatalogDto): Promise<AddonCatalog> {
    const existing = await this.prisma.addonCatalog.findUnique({
      where: { code: dto.code },
    });
    if (existing) {
      throw new ConflictException(`Addon with code "${dto.code}" already exists`);
    }

    // Validate: QUOTA type must have resourceType + quantityPerUnit
    if (dto.type === 'QUOTA') {
      if (!dto.resourceType) {
        throw new BadRequestException('QUOTA addon must have resourceType');
      }
      if (!dto.quantityPerUnit || dto.quantityPerUnit < 1) {
        throw new BadRequestException('QUOTA addon must have quantityPerUnit >= 1');
      }
    }

    // Validate: FEATURE type must have featureFlag
    if (dto.type === 'FEATURE') {
      if (!dto.featureFlag) {
        throw new BadRequestException('FEATURE addon must have featureFlag');
      }
    }

    return this.prisma.addonCatalog.create({ data: dto });
  }

  async findAll(pagination: PaginationDto): Promise<PaginatedResult<AddonCatalog>> {
    const limit = pagination.effectiveLimit;
    const offset = pagination.offset;
    const search = pagination.effectiveSearch;

    const where: any = {};
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { code: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [items, total] = await Promise.all([
      this.prisma.addonCatalog.findMany({
        where,
        skip: offset,
        take: limit,
        orderBy: { sortOrder: 'asc' },
      }),
      this.prisma.addonCatalog.count({ where }),
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
      data: items,
      pagination: {
        total,
        page: pagination.page ?? 1,
        limit,
        totalPages,
        hasNext: (pagination.page ?? 1) < totalPages,
        hasPrev: (pagination.page ?? 1) > 1,
      },
    };
  }

  async findAllActive(): Promise<AddonCatalog[]> {
    return this.prisma.addonCatalog.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: 'asc' },
    });
  }

  async findOne(id: string): Promise<AddonCatalog> {
    const addon = await this.prisma.addonCatalog.findUnique({ where: { id } });
    if (!addon) throw new NotFoundException(`Addon ${id} not found`);
    return addon;
  }

  async update(id: string, dto: UpdateAddonCatalogDto): Promise<AddonCatalog> {
    await this.findOne(id);

    if (dto.code) {
      const existing = await this.prisma.addonCatalog.findFirst({
        where: { code: dto.code, id: { not: id } },
      });
      if (existing) {
        throw new ConflictException(`Addon with code "${dto.code}" already exists`);
      }
    }

    return this.prisma.addonCatalog.update({ where: { id }, data: dto });
  }

  async remove(id: string): Promise<void> {
    await this.findOne(id);

    const inUse = await this.prisma.tenantAddon.count({
      where: { addonId: id, isActive: true },
    });
    if (inUse > 0) {
      throw new BadRequestException(
        `Cannot delete addon: ${inUse} tenant(s) are using it. Deactivate instead.`,
      );
    }

    await this.prisma.addonCatalog.delete({ where: { id } });
  }
}
