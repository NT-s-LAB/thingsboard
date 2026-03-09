import { Injectable, NotFoundException, ConflictException, Logger } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CreateImageCategoryDto } from './dto/create-image-category.dto';
import { UpdateImageCategoryDto } from './dto/update-image-category.dto';
import { PaginationDto, PaginatedResult } from '../../common/dto/pagination.dto';
import { RequestUser } from '../../common/interfaces/common.interface';
import { ImageCategory, File as PrismaFile } from '@prisma/client';
import * as path from 'path';
import * as fs from 'fs';

const CHILDREN_INCLUDE = {
  children: {
    include: {
      children: {
        include: {
          children: true,
          _count: { select: { files: true, children: true } },
        },
        orderBy: { order: 'asc' as const },
      },
      _count: { select: { files: true, children: true } },
    },
    orderBy: { order: 'asc' as const },
  },
  _count: { select: { files: true, children: true } },
};

@Injectable()
export class ImageLibraryService {
  private readonly logger = new Logger(ImageLibraryService.name);
  private readonly uploadDir = path.join(process.cwd(), 'uploads');

  constructor(private readonly prisma: PrismaService) {
    if (!fs.existsSync(this.uploadDir)) {
      fs.mkdirSync(this.uploadDir, { recursive: true });
    }
  }

  // ── Categories ──

  async createCategory(dto: CreateImageCategoryDto): Promise<ImageCategory> {
    const existing = await this.prisma.imageCategory.findFirst({
      where: { name: dto.name, parentId: dto.parentId ?? null },
    });
    if (existing) {
      throw new ConflictException('Category name already exists at this level');
    }

    if (dto.parentId) {
      const parent = await this.prisma.imageCategory.findUnique({ where: { id: dto.parentId } });
      if (!parent) throw new NotFoundException('Parent category not found');
    }

    return this.prisma.imageCategory.create({
      data: {
        name: dto.name,
        description: dto.description,
        icon: dto.icon,
        order: dto.order ?? 0,
        isActive: dto.isActive ?? true,
        parentId: dto.parentId ?? null,
      },
      include: CHILDREN_INCLUDE,
    });
  }

  async findAllCategories(pagination: PaginationDto): Promise<PaginatedResult<ImageCategory>> {
    const page = pagination.page;
    const limit = pagination.effectiveLimit;
    const offset = pagination.offset;
    const search = pagination.effectiveSearch;

    const where: any = {};
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    } else {
      where.parentId = null; // root categories only
    }

    const [categories, total] = await Promise.all([
      this.prisma.imageCategory.findMany({
        where,
        include: CHILDREN_INCLUDE,
        skip: offset,
        take: limit,
        orderBy: { order: 'asc' },
      }),
      this.prisma.imageCategory.count({ where }),
    ]);

    return {
      data: categories,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        hasNext: page < Math.ceil(total / limit),
        hasPrev: page > 1,
      },
    };
  }

  async findCategory(id: string): Promise<ImageCategory> {
    const cat = await this.prisma.imageCategory.findUnique({
      where: { id },
      include: CHILDREN_INCLUDE,
    });
    if (!cat) throw new NotFoundException('Image category not found');
    return cat;
  }

  async updateCategory(id: string, dto: UpdateImageCategoryDto): Promise<ImageCategory> {
    await this.findCategory(id);
    return this.prisma.imageCategory.update({
      where: { id },
      data: {
        ...(dto.name !== undefined && { name: dto.name }),
        ...(dto.description !== undefined && { description: dto.description }),
        ...(dto.icon !== undefined && { icon: dto.icon }),
        ...(dto.order !== undefined && { order: dto.order }),
        ...(dto.isActive !== undefined && { isActive: dto.isActive }),
        ...(dto.parentId !== undefined && { parentId: dto.parentId }),
      },
      include: CHILDREN_INCLUDE,
    });
  }

  async removeCategory(id: string): Promise<void> {
    await this.findCategory(id);
    // Unlink files from this category before deleting
    await this.prisma.file.updateMany({
      where: { imageCategoryId: id },
      data: { imageCategoryId: null },
    });
    await this.prisma.imageCategory.delete({ where: { id } });
  }

  // ── Images (files of type IMAGE) ──

  async uploadImage(
    file: Express.Multer.File,
    categoryId: string | undefined,
    user: RequestUser,
  ): Promise<PrismaFile> {
    if (categoryId) {
      const cat = await this.prisma.imageCategory.findUnique({ where: { id: categoryId } });
      if (!cat) throw new NotFoundException('Image category not found');
    }

    const fileRecord = await this.prisma.file.create({
      data: {
        filename: file.filename,
        originalName: file.originalname,
        mimetype: file.mimetype,
        size: file.size,
        type: 'IMAGE',
        path: path.join(this.uploadDir, file.filename),
        url: `/uploads/${file.filename}`,
        metadata: {},
        isPublic: true,
        uploadedBy: user.id,
        imageCategoryId: categoryId ?? null,
      },
    });

    this.logger.log(`Image uploaded: ${fileRecord.originalName} → category ${categoryId ?? 'uncategorized'}`);
    return fileRecord;
  }

  async findImages(pagination: PaginationDto, categoryId?: string): Promise<PaginatedResult<PrismaFile>> {
    const page = pagination.page;
    const limit = pagination.effectiveLimit;
    const offset = pagination.offset;
    const search = pagination.effectiveSearch;

    const where: any = { type: 'IMAGE' };

    if (categoryId) {
      where.imageCategoryId = categoryId;
    }

    if (search) {
      where.OR = [
        { originalName: { contains: search, mode: 'insensitive' } },
        { filename: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [files, total] = await Promise.all([
      this.prisma.file.findMany({
        where,
        skip: offset,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.file.count({ where }),
    ]);

    return {
      data: files,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        hasNext: page < Math.ceil(total / limit),
        hasPrev: page > 1,
      },
    };
  }

  async moveImage(fileId: string, categoryId: string | null): Promise<PrismaFile> {
    const file = await this.prisma.file.findUnique({ where: { id: fileId } });
    if (!file) throw new NotFoundException('File not found');

    if (categoryId) {
      const cat = await this.prisma.imageCategory.findUnique({ where: { id: categoryId } });
      if (!cat) throw new NotFoundException('Image category not found');
    }

    return this.prisma.file.update({
      where: { id: fileId },
      data: { imageCategoryId: categoryId },
    });
  }

  async deleteImage(fileId: string): Promise<void> {
    const file = await this.prisma.file.findUnique({ where: { id: fileId } });
    if (!file) throw new NotFoundException('File not found');

    // Delete physical file
    if (fs.existsSync(file.path)) {
      fs.unlinkSync(file.path);
    }

    await this.prisma.file.delete({ where: { id: fileId } });
  }
}
