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
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { RequestUser } from '../../common/interfaces/common.interface';
import { UserRole } from '@prisma/client';

/** Roles a TENANT_ADMIN is allowed to assign */
const TENANT_ASSIGNABLE_ROLES: string[] = [
  UserRole.PROJECT_MANAGER,
  UserRole.OPERATOR,
  UserRole.VIEWER,
];

@ApiTags('Users')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.TENANT_ADMIN)
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  private isSuperAdmin(user: any): boolean {
    return user.role === UserRole.SUPER_ADMIN;
  }

  /**
   * Ensure a TENANT_ADMIN can only touch users within their own tenant
   * and only those with PM / OPERATOR / VIEWER roles.
   */
  private async ensureTenantOwnership(
    userId: string,
    currentUser: any,
  ) {
    const target = await this.usersService.findOne(userId);
    if (!target) throw new NotFoundException('User not found');

    if (!this.isSuperAdmin(currentUser)) {
      // Must belong to same tenant
      if (target.tenantId !== currentUser.tenantId) {
        throw new ForbiddenException('Access denied');
      }
      // Cannot touch SUPER_ADMIN or TENANT_ADMIN users
      if (!TENANT_ASSIGNABLE_ROLES.includes(target.role)) {
        throw new ForbiddenException('Access denied');
      }
    }
    return target;
  }

  @ApiOperation({ summary: 'Create a new user' })
  @Post()
  async create(
    @Body() createUserDto: CreateUserDto,
    @CurrentUser() currentUser: RequestUser,
  ) {
    if (!this.isSuperAdmin(currentUser)) {
      // Force own tenant
      createUserDto.tenantId = currentUser.tenantId;
      // TENANT_ADMIN can only create PM / OPERATOR / VIEWER
      if (
        createUserDto.role &&
        !TENANT_ASSIGNABLE_ROLES.includes(createUserDto.role)
      ) {
        throw new ForbiddenException('Cannot create users with this role');
      }
      // Default role if not provided
      if (!createUserDto.role) {
        createUserDto.role = UserRole.VIEWER;
      }
    }
    const user = await this.usersService.create(createUserDto);
    return {
      success: true,
      message: 'User created successfully',
      data: user,
      timestamp: new Date().toISOString(),
    };
  }

  @ApiOperation({ summary: 'Get all users with pagination' })
  @Get()
  async findAll(
    @Query() pagination: PaginationDto,
    @CurrentUser() user: RequestUser,
  ) {
    // SUPER_ADMIN sees all users; TENANT_ADMIN sees only own-tenant PM/OPERATOR/VIEWER
    const tenantId = this.isSuperAdmin(user) ? undefined : user.tenantId;
    const roleFilter = this.isSuperAdmin(user) ? undefined : TENANT_ASSIGNABLE_ROLES;

    const result = await this.usersService.findAll(pagination, tenantId, roleFilter);
    return {
      success: true,
      message: 'Users retrieved successfully',
      data: result.data,
      pagination: result.pagination,
      timestamp: new Date().toISOString(),
    };
  }

  @ApiOperation({ summary: 'Get user by ID' })
  @Get(':id')
  async findOne(
    @Param('id') id: string,
    @CurrentUser() currentUser: RequestUser,
  ) {
    const user = await this.ensureTenantOwnership(id, currentUser);
    return {
      success: true,
      message: 'User retrieved successfully',
      data: user,
      timestamp: new Date().toISOString(),
    };
  }

  @ApiOperation({ summary: 'Update user' })
  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() updateUserDto: UpdateUserDto,
    @CurrentUser() currentUser: RequestUser,
  ) {
    await this.ensureTenantOwnership(id, currentUser);

    if (!this.isSuperAdmin(currentUser)) {
      // Prevent role escalation
      if (
        updateUserDto.role &&
        !TENANT_ASSIGNABLE_ROLES.includes(updateUserDto.role as string)
      ) {
        throw new ForbiddenException('Cannot assign this role');
      }
      // Prevent changing tenantId
      delete (updateUserDto as any).tenantId;
    }

    const user = await this.usersService.update(id, updateUserDto);
    return {
      success: true,
      message: 'User updated successfully',
      data: user,
      timestamp: new Date().toISOString(),
    };
  }

  @ApiOperation({ summary: 'Delete user' })
  @Delete(':id')
  async remove(
    @Param('id') id: string,
    @CurrentUser() currentUser: RequestUser,
  ) {
    await this.ensureTenantOwnership(id, currentUser);
    await this.usersService.remove(id);
    return {
      success: true,
      message: 'User deleted successfully',
      timestamp: new Date().toISOString(),
    };
  }
}
