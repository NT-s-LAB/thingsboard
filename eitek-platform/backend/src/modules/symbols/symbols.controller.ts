import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { SymbolsService } from './symbols.service';
import { CreateSymbolDto } from './dto/create-symbol.dto';
import { UpdateSymbolDto } from './dto/update-symbol.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Symbols')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('symbols')
export class SymbolsController {
  constructor(private readonly symbolsService: SymbolsService) {}

  @ApiOperation({ summary: 'Create a new SVG symbol' })
  @Post()
  async create(@Body() dto: CreateSymbolDto) {
    const symbol = await this.symbolsService.create(dto);
    return {
      success: true,
      message: 'Symbol created successfully',
      data: this.mapToResponse(symbol),
      timestamp: new Date().toISOString(),
    };
  }

  @ApiOperation({ summary: 'List SVG symbols with filtering' })
  @Get()
  async findAll(
    @Query('search') search?: string,
    @Query('category') category?: string,
    @Query('tags') tags?: string,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
    @Query('sortBy') sortBy?: string,
    @Query('sortOrder') sortOrder?: string,
  ) {
    const result = await this.symbolsService.findAll({
      search,
      category,
      tags,
      page: page ? parseInt(page, 10) : undefined,
      pageSize: pageSize ? parseInt(pageSize, 10) : undefined,
      sortBy,
      sortOrder,
    });
    return {
      success: true,
      message: 'Symbols retrieved successfully',
      data: result.data.map(this.mapToResponse),
      total: result.total,
      timestamp: new Date().toISOString(),
    };
  }

  @ApiOperation({ summary: 'Get symbol by ID' })
  @Get('categories')
  async getCategories() {
    const categories = await this.symbolsService.getCategories();
    return {
      success: true,
      data: categories,
      timestamp: new Date().toISOString(),
    };
  }

  @ApiOperation({ summary: 'Get symbol by ID' })
  @Get(':id')
  async findOne(@Param('id') id: string) {
    const symbol = await this.symbolsService.findOne(id);
    return {
      success: true,
      data: this.mapToResponse(symbol),
      timestamp: new Date().toISOString(),
    };
  }

  @ApiOperation({ summary: 'Update a symbol' })
  @Patch(':id')
  async update(@Param('id') id: string, @Body() dto: UpdateSymbolDto) {
    const symbol = await this.symbolsService.update(id, dto);
    return {
      success: true,
      message: 'Symbol updated successfully',
      data: this.mapToResponse(symbol),
      timestamp: new Date().toISOString(),
    };
  }

  @ApiOperation({ summary: 'Delete a symbol' })
  @Delete(':id')
  async remove(@Param('id') id: string) {
    await this.symbolsService.remove(id);
    return {
      success: true,
      message: 'Symbol deleted successfully',
      timestamp: new Date().toISOString(),
    };
  }

  private mapToResponse(symbol: any) {
    const meta = (symbol.metadata as any) ?? {};
    return {
      id: symbol.id,
      name: symbol.name,
      description: symbol.description,
      svgContent: symbol.svg,
      category: meta.category ?? 'custom',
      tags: symbol.tags ?? [],
      viewBox: meta.viewBox ?? { width: 100, height: 100 },
      fileSize: symbol.svg?.length ?? 0,
      version: 1,
      createdAt: symbol.createdAt,
      updatedAt: symbol.updatedAt,
    };
  }
}
