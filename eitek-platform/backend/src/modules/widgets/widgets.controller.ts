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

@ApiTags('Widgets')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller({ path: 'widgets', version: '1' })
export class WidgetsController {
  constructor(private readonly widgetsService: WidgetsService) {}

  @ApiOperation({ summary: 'Create a new widget' })
  @Post()
  async create(@Body() createDto: CreateWidgetDto) {
    const widget = await this.widgetsService.create(createDto);
    return {
      success: true,
      message: 'Widget created successfully',
      data: widget,
      timestamp: new Date().toISOString(),
    };
  }

  @ApiOperation({ summary: 'Get all widgets with pagination' })
  @Get()
  async findAll(
    @Query() pagination: PaginationDto,
    @Query('categoryId') categoryId?: string,
  ) {
    const result = await this.widgetsService.findAll(pagination, categoryId);
    return {
      success: true,
      message: 'Widgets retrieved successfully',
      data: result.data,
      pagination: result.pagination,
      timestamp: new Date().toISOString(),
    };
  }

  @ApiOperation({ summary: 'Get widget by ID' })
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
  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() updateDto: UpdateWidgetDto,
  ) {
    const widget = await this.widgetsService.update(id, updateDto);
    return {
      success: true,
      message: 'Widget updated successfully',
      data: widget,
      timestamp: new Date().toISOString(),
    };
  }

  @ApiOperation({ summary: 'Delete widget' })
  @Delete(':id')
  async remove(@Param('id') id: string) {
    await this.widgetsService.remove(id);
    return {
      success: true,
      message: 'Widget deleted successfully',
      timestamp: new Date().toISOString(),
    };
  }
}
