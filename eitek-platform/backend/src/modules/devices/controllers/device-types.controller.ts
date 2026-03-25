import {
  Controller,
  Get,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { PrismaService } from '../../../database/prisma.service';
import { UserRole } from '@prisma/client';

@ApiTags('Device Types')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.VIEWER)
@Controller('device-types')
export class DeviceTypesController {
  constructor(private readonly prisma: PrismaService) {}

  @ApiOperation({ summary: 'Get all device types' })
  @Get()
  async findAll() {
    const deviceTypes = await this.prisma.deviceType.findMany({
      where: { isActive: true },
      select: {
        id: true,
        name: true,
        category: true,
        description: true,
      },
      orderBy: { name: 'asc' },
    });

    return {
      success: true,
      data: deviceTypes,
      timestamp: new Date().toISOString(),
    };
  }
}
