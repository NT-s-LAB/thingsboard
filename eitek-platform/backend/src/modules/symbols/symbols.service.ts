import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CreateSymbolDto } from './dto/create-symbol.dto';
import { UpdateSymbolDto } from './dto/update-symbol.dto';
import { Symbol } from '@prisma/client';

@Injectable()
export class SymbolsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateSymbolDto): Promise<Symbol> {
    // Check unique name (system symbols have tenantId = null)
    const existing = await this.prisma.symbol.findFirst({
      where: { name: dto.name, tenantId: null },
    });
    if (existing) {
      throw new ConflictException(`Symbol with name "${dto.name}" already exists`);
    }

    return this.prisma.symbol.create({
      data: {
        name: dto.name,
        description: dto.description,
        svg: dto.svgContent,
        metadata: dto.category ? { category: dto.category } : undefined,
        tags: dto.tags ?? [],
        isSystem: true,  // Symbols created via API are system symbols
        tenantId: null,
      },
    });
  }

  async findAll(query: {
    search?: string;
    category?: string;
    tags?: string;
    page?: number;
    pageSize?: number;
    sortBy?: string;
    sortOrder?: string;
  }): Promise<{ data: Symbol[]; total: number }> {
    const page = Math.max(1, query.page ?? 1);
    const pageSize = Math.min(100, Math.max(1, query.pageSize ?? 50));
    const skip = (page - 1) * pageSize;

    const where: any = { isActive: true };

    if (query.search) {
      where.OR = [
        { name: { contains: query.search, mode: 'insensitive' } },
        { description: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    if (query.category) {
      where.metadata = { path: ['category'], equals: query.category };
    }

    if (query.tags) {
      const tagsArr = query.tags.split(',').map((t) => t.trim());
      where.tags = { hasSome: tagsArr };
    }

    const orderBy: any = {};
    const sortField = query.sortBy ?? 'createdAt';
    orderBy[sortField] = query.sortOrder === 'asc' ? 'asc' : 'desc';

    const [data, total] = await Promise.all([
      this.prisma.symbol.findMany({
        where,
        orderBy,
        skip,
        take: pageSize,
      }),
      this.prisma.symbol.count({ where }),
    ]);

    return { data, total };
  }

  async findOne(id: string): Promise<Symbol> {
    const symbol = await this.prisma.symbol.findUnique({ where: { id } });
    if (!symbol) {
      throw new NotFoundException(`Symbol with ID "${id}" not found`);
    }
    return symbol;
  }

  async update(id: string, dto: UpdateSymbolDto): Promise<Symbol> {
    await this.findOne(id); // Ensures exists

    if (dto.name) {
      const existing = await this.prisma.symbol.findFirst({
        where: { name: dto.name, NOT: { id } },
      });
      if (existing) {
        throw new ConflictException(`Symbol with name "${dto.name}" already exists`);
      }
    }

    return this.prisma.symbol.update({
      where: { id },
      data: {
        ...(dto.name !== undefined ? { name: dto.name } : {}),
        ...(dto.description !== undefined ? { description: dto.description } : {}),
        ...(dto.svgContent !== undefined ? { svg: dto.svgContent } : {}),
        ...(dto.category !== undefined ? { metadata: { category: dto.category } } : {}),
        ...(dto.tags !== undefined ? { tags: dto.tags } : {}),
      },
    });
  }

  async remove(id: string): Promise<void> {
    await this.findOne(id);
    // Soft-delete
    await this.prisma.symbol.update({
      where: { id },
      data: { isActive: false },
    });
  }

  async getCategories(): Promise<string[]> {
    const symbols = await this.prisma.symbol.findMany({
      where: { isActive: true },
      select: { metadata: true },
      distinct: ['metadata'],
    });

    const categories = new Set<string>();
    for (const s of symbols) {
      const meta = s.metadata as any;
      if (meta?.category) {
        categories.add(meta.category);
      }
    }
    return Array.from(categories).sort();
  }
}
