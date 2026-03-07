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
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { RequestUser } from '../../common/interfaces/common.interface';

@ApiTags('Projects')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller({ path: 'projects', version: '1' })
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}

  @ApiOperation({ summary: 'Create a new project' })
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

  @ApiOperation({ summary: 'Get project by ID' })
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
