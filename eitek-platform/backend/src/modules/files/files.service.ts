import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { UploadFileDto } from './dto/upload-file.dto';
import { PaginationDto, PaginatedResult } from '../../common/dto/pagination.dto';
import { RequestUser } from '../../common/interfaces/common.interface';
import { File as PrismaFile, FileType } from '@prisma/client';
import * as path from 'path';
import * as fs from 'fs';

@Injectable()
export class FilesService {
  private readonly logger = new Logger(FilesService.name);
  private readonly uploadDir = path.join(process.cwd(), 'uploads');

  constructor(private readonly prisma: PrismaService) {
    // Ensure upload directory exists
    if (!fs.existsSync(this.uploadDir)) {
      fs.mkdirSync(this.uploadDir, { recursive: true });
    }
  }

  async upload(
    file: Express.Multer.File,
    uploadFileDto: UploadFileDto,
    user: RequestUser,
  ): Promise<PrismaFile> {
    const filePath = path.join(this.uploadDir, file.filename);

    const fileRecord = await this.prisma.file.create({
      data: {
        filename: file.filename,
        originalName: file.originalname,
        mimetype: file.mimetype,
        size: file.size,
        type: uploadFileDto.type || this.detectFileType(file.mimetype),
        path: filePath,
        url: `/uploads/${file.filename}`,
        metadata: uploadFileDto.metadata || {},
        isPublic: uploadFileDto.isPublic ?? false,
        uploadedBy: user.id,
      },
      include: {
        uploader: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
      },
    });

    this.logger.log(`File uploaded: ${fileRecord.originalName} by user ${user.id}`);
    return fileRecord;
  }

  async findAll(pagination: PaginationDto, user: RequestUser): Promise<PaginatedResult<PrismaFile>> {
    const { page, limit, offset, search, sortBy, sortOrder } = pagination;

    const where: any = {};

    if (search) {
      where.OR = [
        { originalName: { contains: search, mode: 'insensitive' } },
        { filename: { contains: search, mode: 'insensitive' } },
      ];
    }

    const orderBy: any = {};
    if (sortBy) {
      orderBy[sortBy] = sortOrder;
    } else {
      orderBy.createdAt = 'desc';
    }

    const [files, total] = await Promise.all([
      this.prisma.file.findMany({
        where,
        include: {
          uploader: {
            select: { id: true, firstName: true, lastName: true, email: true },
          },
        },
        skip: offset,
        take: limit,
        orderBy,
      }),
      this.prisma.file.count({ where }),
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
      data: files,
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

  async findOne(id: string): Promise<PrismaFile> {
    const file = await this.prisma.file.findUnique({
      where: { id },
      include: {
        uploader: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
      },
    });

    if (!file) {
      throw new NotFoundException('File not found');
    }

    return file;
  }

  async remove(id: string, user: RequestUser): Promise<void> {
    const file = await this.prisma.file.findUnique({ where: { id } });

    if (!file) {
      throw new NotFoundException('File not found');
    }

    // Delete physical file
    try {
      if (fs.existsSync(file.path)) {
        fs.unlinkSync(file.path);
      }
    } catch (error) {
      this.logger.warn(`Failed to delete physical file: ${file.path}`);
    }

    await this.prisma.file.delete({ where: { id } });
  }

  private detectFileType(mimetype: string): FileType {
    if (mimetype.startsWith('image/')) return FileType.IMAGE;
    if (mimetype.startsWith('video/')) return FileType.VIDEO;
    if (mimetype.includes('zip') || mimetype.includes('tar') || mimetype.includes('rar'))
      return FileType.ARCHIVE;
    if (
      mimetype.includes('pdf') ||
      mimetype.includes('document') ||
      mimetype.includes('text')
    )
      return FileType.DOCUMENT;
    return FileType.OTHER;
  }
}
