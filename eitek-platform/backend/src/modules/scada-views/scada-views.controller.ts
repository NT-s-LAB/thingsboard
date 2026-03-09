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
import { ScadaViewQueryDto } from './dto/scada-view-query.dto';
import { CreateScadaWidgetDto } from './dto/create-scada-widget.dto';
import { UpdateScadaWidgetDto } from './dto/update-scada-widget.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { RequestUser } from '../../common/interfaces/common.interface';

@ApiTags('SCADA Views')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('scada-views')
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
    @Query() query: ScadaViewQueryDto,
    @CurrentUser() user: RequestUser,
  ) {
    const result = await this.scadaViewsService.findAll(query, user, query.areaId, query.projectId);
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

  // ========== ScadaWidget CRUD (widgets placed on a view) ==========

  @ApiOperation({ summary: 'Add a widget to a SCADA view' })
  @Post(':id/widgets')
  async addWidget(
    @Param('id') viewId: string,
    @Body() createDto: CreateScadaWidgetDto,
    @CurrentUser() user: RequestUser,
  ) {
    const widget = await this.scadaViewsService.addWidget(viewId, createDto, user);
    return {
      success: true,
      message: 'Widget added successfully',
      data: widget,
      timestamp: new Date().toISOString(),
    };
  }

  @ApiOperation({ summary: 'Bulk update widgets on a SCADA view' })
  @Put(':id/widgets/bulk')
  async bulkUpdateWidgets(
    @Param('id') viewId: string,
    @Body() body: { widgets: any[] },
    @CurrentUser() user: RequestUser,
  ) {
    const widgets = await this.scadaViewsService.bulkUpdateScadaWidgets(viewId, body.widgets ?? [], user);
    return {
      success: true,
      message: 'Widgets updated successfully',
      data: widgets,
      timestamp: new Date().toISOString(),
    };
  }

  @ApiOperation({ summary: 'Update a widget on a SCADA view' })
  @Put(':id/widgets/:widgetId')
  async updateWidget(
    @Param('id') viewId: string,
    @Param('widgetId') widgetId: string,
    @Body() updateDto: UpdateScadaWidgetDto,
    @CurrentUser() user: RequestUser,
  ) {
    const widget = await this.scadaViewsService.updateScadaWidget(viewId, widgetId, updateDto, user);
    return {
      success: true,
      message: 'Widget updated successfully',
      data: widget,
      timestamp: new Date().toISOString(),
    };
  }

  @ApiOperation({ summary: 'Delete a widget from a SCADA view' })
  @Delete(':id/widgets/:widgetId')
  async deleteWidget(
    @Param('id') viewId: string,
    @Param('widgetId') widgetId: string,
    @CurrentUser() user: RequestUser,
  ) {
    await this.scadaViewsService.removeScadaWidget(viewId, widgetId, user);
    return {
      success: true,
      message: 'Widget removed successfully',
      timestamp: new Date().toISOString(),
    };
  }

  @ApiOperation({ summary: 'Duplicate a widget on a SCADA view' })
  @Post(':id/widgets/:widgetId/duplicate')
  async duplicateWidget(
    @Param('id') viewId: string,
    @Param('widgetId') widgetId: string,
    @CurrentUser() user: RequestUser,
  ) {
    const widget = await this.scadaViewsService.duplicateScadaWidget(viewId, widgetId, user);
    return {
      success: true,
      message: 'Widget duplicated successfully',
      data: widget,
      timestamp: new Date().toISOString(),
    };
  }
}
