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
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { RequestUser } from '../../common/interfaces/common.interface';
import { UserRole } from '@prisma/client';

@ApiTags('Sites')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('sites')
export class SitesController {
  constructor(private readonly sitesService: SitesService) {}

  @ApiOperation({ summary: 'Create a new site' })
  @Roles(UserRole.PROJECT_MANAGER)
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
  @Roles(UserRole.VIEWER)
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
  @Roles(UserRole.VIEWER)
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
  @Roles(UserRole.PROJECT_MANAGER)
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
  @Roles(UserRole.TENANT_ADMIN)
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
