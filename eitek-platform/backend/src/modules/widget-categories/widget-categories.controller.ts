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
import { WidgetCategoriesService } from './widget-categories.service';
import { CreateWidgetCategoryDto } from './dto/create-widget-category.dto';
import { UpdateWidgetCategoryDto } from './dto/update-widget-category.dto';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Widget Categories')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('widget-categories')
export class WidgetCategoriesController {
  constructor(private readonly service: WidgetCategoriesService) {}

  @ApiOperation({ summary: 'Create a widget category' })
  @Post()
  async create(@Body() dto: CreateWidgetCategoryDto) {
    const category = await this.service.create(dto);
    return {
      success: true,
      message: 'Widget category created successfully',
      data: category,
      timestamp: new Date().toISOString(),
    };
  }

  @ApiOperation({ summary: 'Get all widget categories' })
  @Get()
  async findAll(@Query() pagination: PaginationDto) {
    const result = await this.service.findAll(pagination);
    return {
      success: true,
      message: 'Widget categories retrieved successfully',
      data: result.data,
      pagination: result.pagination,
      timestamp: new Date().toISOString(),
    };
  }

  @ApiOperation({ summary: 'Get widget category by ID' })
  @Get(':id')
  async findOne(@Param('id') id: string) {
    const category = await this.service.findOne(id);
    return {
      success: true,
      message: 'Widget category retrieved successfully',
      data: category,
      timestamp: new Date().toISOString(),
    };
  }

  @ApiOperation({ summary: 'Update widget category' })
  @Put(':id')
  async update(@Param('id') id: string, @Body() dto: UpdateWidgetCategoryDto) {
    const category = await this.service.update(id, dto);
    return {
      success: true,
      message: 'Widget category updated successfully',
      data: category,
      timestamp: new Date().toISOString(),
    };
  }

  @ApiOperation({ summary: 'Delete widget category' })
  @Delete(':id')
  async remove(@Param('id') id: string) {
    await this.service.remove(id);
    return {
      success: true,
      message: 'Widget category deleted successfully',
      timestamp: new Date().toISOString(),
    };
  }
}
