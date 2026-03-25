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
import { WidgetsService } from './widgets.service';
import { CreateWidgetDto } from './dto/create-widget.dto';
import { UpdateWidgetDto } from './dto/update-widget.dto';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { RequestUser } from '../../common/interfaces/common.interface';
import { UserRole } from '@prisma/client';
import { IsOptional, IsString } from 'class-validator';

class FindAllWidgetsQueryDto extends PaginationDto {
  @IsOptional()
  @IsString()
  categoryId?: string;
}

@ApiTags('Widgets')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('widgets')
export class WidgetsController {
  constructor(private readonly widgetsService: WidgetsService) {}

  @ApiOperation({ summary: 'Create a new widget' })
  @Roles(UserRole.TENANT_ADMIN)
  @Post()
  async create(@Body() createDto: CreateWidgetDto, @CurrentUser() user: RequestUser) {
    const widget = await this.widgetsService.create(createDto, user);
    return {
      success: true,
      message: 'Widget created successfully',
      data: widget,
      timestamp: new Date().toISOString(),
    };
  }

  @ApiOperation({ summary: 'Get all widgets with pagination' })
  @Roles(UserRole.VIEWER)
  @Get()
  async findAll(
    @Query() query: FindAllWidgetsQueryDto,
    @CurrentUser() user: RequestUser,
  ) {
    const result = await this.widgetsService.findAll(query, user, query.categoryId);
    return {
      success: true,
      message: 'Widgets retrieved successfully',
      data: result.data,
      pagination: result.pagination,
      timestamp: new Date().toISOString(),
    };
  }

  @ApiOperation({ summary: 'Get widget by ID' })
  @Roles(UserRole.VIEWER)
  @Get(':id')
  async findOne(@Param('id') id: string) {
    const widget = await this.widgetsService.findOne(id);
    return {
      success: true,
      message: 'Widget retrieved successfully',
      data: widget,
      timestamp: new Date().toISOString(),
    };
  }

  @ApiOperation({ summary: 'Update widget' })
  @Roles(UserRole.TENANT_ADMIN)
  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() updateDto: UpdateWidgetDto,
    @CurrentUser() user: RequestUser,
  ) {
    const widget = await this.widgetsService.update(id, updateDto, user);
    return {
      success: true,
      message: 'Widget updated successfully',
      data: widget,
      timestamp: new Date().toISOString(),
    };
  }

  @ApiOperation({ summary: 'Delete widget' })
  @Roles(UserRole.TENANT_ADMIN)
  @Delete(':id')
  async remove(@Param('id') id: string, @CurrentUser() user: RequestUser) {
    await this.widgetsService.remove(id, user);
    return {
      success: true,
      message: 'Widget deleted successfully',
      timestamp: new Date().toISOString(),
    };
  }
}
