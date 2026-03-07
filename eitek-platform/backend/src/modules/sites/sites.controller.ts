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
import { SitesService } from './sites.service';
import { CreateSiteDto } from './dto/create-site.dto';
import { UpdateSiteDto } from './dto/update-site.dto';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { RequestUser } from '../../common/interfaces/common.interface';

@ApiTags('Sites')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller({ path: 'sites', version: '1' })
export class SitesController {
  constructor(private readonly sitesService: SitesService) {}

  @ApiOperation({ summary: 'Create a new site' })
  @Post()
  async create(
    @Body() createSiteDto: CreateSiteDto,
    @CurrentUser() user: RequestUser,
  ) {
    const site = await this.sitesService.create(createSiteDto, user);
    return {
      success: true,
      message: 'Site created successfully',
      data: site,
      timestamp: new Date().toISOString(),
    };
  }

  @ApiOperation({ summary: 'Get all sites with pagination' })
  @Get()
  async findAll(
    @Query() pagination: PaginationDto,
    @Query('projectId') projectId: string,
    @CurrentUser() user: RequestUser,
  ) {
    const result = await this.sitesService.findAll(pagination, user, projectId);
    return {
      success: true,
      message: 'Sites retrieved successfully',
      data: result.data,
      pagination: result.pagination,
      timestamp: new Date().toISOString(),
    };
  }

  @ApiOperation({ summary: 'Get site by ID' })
  @Get(':id')
  async findOne(@Param('id') id: string, @CurrentUser() user: RequestUser) {
    const site = await this.sitesService.findOne(id, user);
    return {
      success: true,
      message: 'Site retrieved successfully',
      data: site,
      timestamp: new Date().toISOString(),
    };
  }

  @ApiOperation({ summary: 'Update site' })
  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() updateSiteDto: UpdateSiteDto,
    @CurrentUser() user: RequestUser,
  ) {
    const site = await this.sitesService.update(id, updateSiteDto, user);
    return {
      success: true,
      message: 'Site updated successfully',
      data: site,
      timestamp: new Date().toISOString(),
    };
  }

  @ApiOperation({ summary: 'Delete site' })
  @Delete(':id')
  async remove(@Param('id') id: string, @CurrentUser() user: RequestUser) {
    await this.sitesService.remove(id, user);
    return {
      success: true,
      message: 'Site deleted successfully',
      timestamp: new Date().toISOString(),
    };
  }
}
