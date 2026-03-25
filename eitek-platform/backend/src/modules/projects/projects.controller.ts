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
import { ProjectsService } from './projects.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { RequestUser } from '../../common/interfaces/common.interface';
import { UserRole } from '@prisma/client';

@ApiTags('Projects')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('projects')
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}

  @ApiOperation({ summary: 'Get recent projects' })
  @Roles(UserRole.VIEWER)
  @Get('recent')
  async getRecent(
    @Query('limit') limit: string = '10',
    @CurrentUser() user: RequestUser,
  ) {
    const projects = await this.projectsService.getRecentProjects(
      user.tenantId,
      parseInt(limit, 10) || 10,
    );
    return {
      success: true,
      message: 'Recent projects retrieved successfully',
      data: projects,
      timestamp: new Date().toISOString(),
    };
  }

  @ApiOperation({ summary: 'Get favorite projects' })
  @Roles(UserRole.VIEWER)
  @Get('favorites')
  async getFavorites(@CurrentUser() user: RequestUser) {
    const projects = await this.projectsService.getFavoriteProjects(
      user.id,
      user.tenantId,
    );
    return {
      success: true,
      message: 'Favorite projects retrieved successfully',
      data: projects,
      timestamp: new Date().toISOString(),
    };
  }

  @ApiOperation({ summary: 'Create a new project' })
  @Roles(UserRole.PROJECT_MANAGER)
  @Post()
  async create(
    @Body() createProjectDto: CreateProjectDto,
    @CurrentUser() user: RequestUser,
  ) {
    const project = await this.projectsService.create(createProjectDto, user);
    return {
      success: true,
      message: 'Project created successfully',
      data: project,
      timestamp: new Date().toISOString(),
    };
  }

  @ApiOperation({ summary: 'Get all projects with pagination' })
  @Roles(UserRole.VIEWER)
  @Get()
  async findAll(
    @Query() pagination: PaginationDto,
    @CurrentUser() user: RequestUser,
  ) {
    const result = await this.projectsService.findAll(pagination, user.tenantId);
    return {
      success: true,
      message: 'Projects retrieved successfully',
      data: result.data,
      pagination: result.pagination,
      timestamp: new Date().toISOString(),
    };
  }

  @ApiOperation({ summary: 'Add project to favorites' })
  @Roles(UserRole.VIEWER)
  @Post(':id/favorite')
  async addToFavorites(
    @Param('id') id: string,
    @CurrentUser() user: RequestUser,
  ) {
    await this.projectsService.addToFavorites(id, user.id, user.tenantId);
    return {
      success: true,
      message: 'Project added to favorites',
      timestamp: new Date().toISOString(),
    };
  }

  @ApiOperation({ summary: 'Remove project from favorites' })
  @Roles(UserRole.VIEWER)
  @Delete(':id/favorite')
  async removeFromFavorites(
    @Param('id') id: string,
    @CurrentUser() user: RequestUser,
  ) {
    await this.projectsService.removeFromFavorites(id, user.id);
    return {
      success: true,
      message: 'Project removed from favorites',
      timestamp: new Date().toISOString(),
    };
  }

  @ApiOperation({ summary: 'Get project by ID' })
  @Roles(UserRole.VIEWER)
  @Get(':id')
  async findOne(@Param('id') id: string, @CurrentUser() user: RequestUser) {
    const project = await this.projectsService.findOne(id, user.tenantId);
    return {
      success: true,
      message: 'Project retrieved successfully',
      data: project,
      timestamp: new Date().toISOString(),
    };
  }

  @ApiOperation({ summary: 'Update project' })
  @Roles(UserRole.PROJECT_MANAGER)
  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() updateProjectDto: UpdateProjectDto,
    @CurrentUser() user: RequestUser,
  ) {
    const project = await this.projectsService.update(id, updateProjectDto, user.tenantId);
    return {
      success: true,
      message: 'Project updated successfully',
      data: project,
      timestamp: new Date().toISOString(),
    };
  }

  @ApiOperation({ summary: 'Delete project' })
  @Roles(UserRole.TENANT_ADMIN)
  @Delete(':id')
  async remove(@Param('id') id: string, @CurrentUser() user: RequestUser) {
    await this.projectsService.remove(id, user.tenantId);
    return {
      success: true,
      message: 'Project deleted successfully',
      timestamp: new Date().toISOString(),
    };
  }
}
