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
import { ScadaViewsService } from './scada-views.service';
import { CreateScadaViewDto } from './dto/create-scada-view.dto';
import { UpdateScadaViewDto } from './dto/update-scada-view.dto';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { RequestUser } from '../../common/interfaces/common.interface';

@ApiTags('SCADA Views')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller({ path: 'scada-views', version: '1' })
export class ScadaViewsController {
  constructor(private readonly scadaViewsService: ScadaViewsService) {}

  @ApiOperation({ summary: 'Create a new SCADA view' })
  @Post()
  async create(
    @Body() createDto: CreateScadaViewDto,
    @CurrentUser() user: RequestUser,
  ) {
    const view = await this.scadaViewsService.create(createDto, user);
    return {
      success: true,
      message: 'SCADA view created successfully',
      data: view,
      timestamp: new Date().toISOString(),
    };
  }

  @ApiOperation({ summary: 'Get all SCADA views with pagination' })
  @Get()
  async findAll(
    @Query() pagination: PaginationDto,
    @Query('areaId') areaId: string,
    @CurrentUser() user: RequestUser,
  ) {
    const result = await this.scadaViewsService.findAll(pagination, user, areaId);
    return {
      success: true,
      message: 'SCADA views retrieved successfully',
      data: result.data,
      pagination: result.pagination,
      timestamp: new Date().toISOString(),
    };
  }

  @ApiOperation({ summary: 'Get SCADA view by ID' })
  @Get(':id')
  async findOne(@Param('id') id: string, @CurrentUser() user: RequestUser) {
    const view = await this.scadaViewsService.findOne(id, user);
    return {
      success: true,
      message: 'SCADA view retrieved successfully',
      data: view,
      timestamp: new Date().toISOString(),
    };
  }

  @ApiOperation({ summary: 'Update SCADA view' })
  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() updateDto: UpdateScadaViewDto,
    @CurrentUser() user: RequestUser,
  ) {
    const view = await this.scadaViewsService.update(id, updateDto, user);
    return {
      success: true,
      message: 'SCADA view updated successfully',
      data: view,
      timestamp: new Date().toISOString(),
    };
  }

  @ApiOperation({ summary: 'Delete SCADA view' })
  @Delete(':id')
  async remove(@Param('id') id: string, @CurrentUser() user: RequestUser) {
    await this.scadaViewsService.remove(id, user);
    return {
      success: true,
      message: 'SCADA view deleted successfully',
      timestamp: new Date().toISOString(),
    };
  }
}
