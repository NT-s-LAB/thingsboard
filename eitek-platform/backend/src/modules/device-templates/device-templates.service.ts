import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CreateDeviceTemplateDto } from './dto/create-device-template.dto';
import { UpdateDeviceTemplateDto } from './dto/update-device-template.dto';
import { PaginationDto, PaginatedResult } from '../../common/dto/pagination.dto';
import { DeviceTemplate } from '@prisma/client';

@Injectable()
export class DeviceTemplatesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createDto: CreateDeviceTemplateDto): Promise<DeviceTemplate> {
    // Verify device type exists
    const deviceType = await this.prisma.deviceType.findUnique({
      where: { id: createDto.deviceTypeId },
    });

    if (!deviceType) {
      throw new NotFoundException('Device type not found');
    }

    // Check uniqueness within device type
    const existing = await this.prisma.deviceTemplate.findFirst({
      where: {
        deviceTypeId: createDto.deviceTypeId,
        name: createDto.name,
      },
    });

    if (existing) {
      throw new ConflictException('Template name already exists for this device type');
    }

    return this.prisma.deviceTemplate.create({
      data: createDto,
      include: {
        deviceType: { select: { id: true, name: true, category: true } },
      },
    });
  }

  async findAll(pagination: PaginationDto, deviceTypeId?: string): Promise<PaginatedResult<DeviceTemplate>> {
    const { page, limit, offset, search, sortBy, sortOrder } = pagination;

    const where: any = {};

    if (deviceTypeId) {
      where.deviceTypeId = deviceTypeId;
    }

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

    const [templates, total] = await Promise.all([
      this.prisma.deviceTemplate.findMany({
        where,
        include: {
          deviceType: { select: { id: true, name: true, category: true } },
        },
        skip: offset,
        take: limit,
        orderBy,
      }),
      this.prisma.deviceTemplate.count({ where }),
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
      data: templates,
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

  async findOne(id: string): Promise<DeviceTemplate> {
    const template = await this.prisma.deviceTemplate.findUnique({
      where: { id },
      include: {
        deviceType: { select: { id: true, name: true, category: true } },
      },
    });

    if (!template) {
      throw new NotFoundException('Device template not found');
    }

    return template;
  }

  async update(id: string, updateDto: UpdateDeviceTemplateDto): Promise<DeviceTemplate> {
    const template = await this.prisma.deviceTemplate.findUnique({ where: { id } });

    if (!template) {
      throw new NotFoundException('Device template not found');
    }

    if (updateDto.name && updateDto.name !== template.name) {
      const existing = await this.prisma.deviceTemplate.findFirst({
        where: {
          deviceTypeId: template.deviceTypeId,
          name: updateDto.name,
          id: { not: id },
        },
      });
      if (existing) {
        throw new ConflictException('Template name already exists for this device type');
      }
    }

    return this.prisma.deviceTemplate.update({
      where: { id },
      data: updateDto,
      include: {
        deviceType: { select: { id: true, name: true, category: true } },
      },
    });
  }

  async remove(id: string): Promise<void> {
    const template = await this.prisma.deviceTemplate.findUnique({ where: { id } });

    if (!template) {
      throw new NotFoundException('Device template not found');
    }

    await this.prisma.deviceTemplate.delete({ where: { id } });
  }
}
