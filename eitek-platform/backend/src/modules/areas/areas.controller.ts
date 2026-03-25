import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AreasService } from './areas.service';
import { CreateAreaDto } from './dto/create-area.dto';
import { UpdateAreaDto } from './dto/update-area.dto';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { RequestUser } from '../../common/interfaces/common.interface';
import { UserRole } from '@prisma/client';

@ApiTags('Areas')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('areas')
export class AreasController {
  constructor(private readonly areasService: AreasService) {}

  @ApiOperation({ summary: 'Create a new area' })
  @Roles(UserRole.PROJECT_MANAGER)
  @Post()
  async create(
    @Body() createAreaDto: CreateAreaDto,
    @CurrentUser() user: RequestUser,
  ) {
    const area = await this.areasService.create(createAreaDto, user);
    return {
      success: true,
      message: 'Area created successfully',
      data: area,
      timestamp: new Date().toISOString(),
    };
  }

  @ApiOperation({ summary: 'Get all areas with pagination' })
  @Roles(UserRole.VIEWER)
  @Get()
  async findAll(
    @Query() pagination: PaginationDto,
    @Query('siteId') siteId: string,
    @CurrentUser() user: RequestUser,
  ) {
    const result = await this.areasService.findAll(pagination, user, siteId);
    return {
      success: true,
      message: 'Areas retrieved successfully',
      data: result.data,
      pagination: result.pagination,
      timestamp: new Date().toISOString(),
    };
  }

  @ApiOperation({ summary: 'Get area by ID' })
  @Roles(UserRole.VIEWER)
  @Get(':id')
  async findOne(@Param('id') id: string, @CurrentUser() user: RequestUser) {
    const area = await this.areasService.findOne(id, user);
    return {
      success: true,
      message: 'Area retrieved successfully',
      data: area,
      timestamp: new Date().toISOString(),
    };
  }

  @ApiOperation({ summary: 'Update area' })
  @Roles(UserRole.PROJECT_MANAGER)
  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() updateAreaDto: UpdateAreaDto,
    @CurrentUser() user: RequestUser,
  ) {
    const area = await this.areasService.update(id, updateAreaDto, user);
    return {
      success: true,
      message: 'Area updated successfully',
      data: area,
      timestamp: new Date().toISOString(),
    };
  }

  @ApiOperation({ summary: 'Delete area' })
  @Roles(UserRole.TENANT_ADMIN)
  @Delete(':id')
  async remove(@Param('id') id: string, @CurrentUser() user: RequestUser) {
    await this.areasService.remove(id, user);
    return {
      success: true,
      message: 'Area deleted successfully',
      timestamp: new Date().toISOString(),
    };
  }
}
