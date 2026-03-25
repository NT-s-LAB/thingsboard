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
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiParam, ApiBody } from '@nestjs/swagger';
import { TenantUsersService } from './tenant-users.service';
import { CreateTenantUserDto } from './dto/create-tenant-user.dto';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '@prisma/client';

@ApiTags('Tenant Users')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.SUPER_ADMIN)
@Controller('tenants/:tenantId/users')
export class TenantUsersController {
  constructor(private readonly tenantUsersService: TenantUsersService) {}

  @ApiOperation({ summary: 'Create a new user for a tenant' })
  @ApiParam({ name: 'tenantId', description: 'Tenant ID' })
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(
    @Param('tenantId') tenantId: string,
    @Body() createDto: CreateTenantUserDto,
  ) {
    const user = await this.tenantUsersService.createTenantUser(tenantId, createDto);
    return {
      success: true,
      message: 'User created successfully',
      data: user,
      timestamp: new Date().toISOString(),
    };
  }

  @ApiOperation({ summary: 'Get all users for a tenant' })
  @ApiParam({ name: 'tenantId', description: 'Tenant ID' })
  @Get()
  async findAll(
    @Param('tenantId') tenantId: string,
    @Query() pagination: PaginationDto,
  ) {
    const result = await this.tenantUsersService.findAllByTenant(tenantId, pagination);
    return {
      success: true,
      message: 'Users retrieved successfully',
      data: result.data,
      pagination: result.pagination,
      timestamp: new Date().toISOString(),
    };
  }

  @ApiOperation({ summary: 'Get a specific user in a tenant' })
  @ApiParam({ name: 'tenantId', description: 'Tenant ID' })
  @ApiParam({ name: 'userId', description: 'User ID' })
  @Get(':userId')
  async findOne(
    @Param('tenantId') tenantId: string,
    @Param('userId') userId: string,
  ) {
    const user = await this.tenantUsersService.findOneByTenant(tenantId, userId);
    return {
      success: true,
      message: 'User retrieved successfully',
      data: user,
      timestamp: new Date().toISOString(),
    };
  }

  @ApiOperation({ summary: 'Update a user in a tenant' })
  @ApiParam({ name: 'tenantId', description: 'Tenant ID' })
  @ApiParam({ name: 'userId', description: 'User ID' })
  @Put(':userId')
  async update(
    @Param('tenantId') tenantId: string,
    @Param('userId') userId: string,
    @Body() updateDto: Partial<CreateTenantUserDto>,
  ) {
    const user = await this.tenantUsersService.updateTenantUser(tenantId, userId, updateDto);
    return {
      success: true,
      message: 'User updated successfully',
      data: user,
      timestamp: new Date().toISOString(),
    };
  }

  @ApiOperation({ summary: 'Delete a user from a tenant' })
  @ApiParam({ name: 'tenantId', description: 'Tenant ID' })
  @ApiParam({ name: 'userId', description: 'User ID' })
  @Delete(':userId')
  @HttpCode(HttpStatus.OK)
  async remove(
    @Param('tenantId') tenantId: string,
    @Param('userId') userId: string,
  ) {
    await this.tenantUsersService.deleteTenantUser(tenantId, userId);
    return {
      success: true,
      message: 'User deleted successfully',
      timestamp: new Date().toISOString(),
    };
  }

  @ApiOperation({ summary: 'Resend activation link for a user' })
  @ApiParam({ name: 'tenantId', description: 'Tenant ID' })
  @ApiParam({ name: 'userId', description: 'User ID' })
  @Post(':userId/resend-activation')
  @HttpCode(HttpStatus.OK)
  async resendActivation(
    @Param('tenantId') tenantId: string,
    @Param('userId') userId: string,
  ) {
    const result = await this.tenantUsersService.resendActivationLink(tenantId, userId);
    return {
      success: true,
      message: 'Activation link sent successfully',
      data: result,
      timestamp: new Date().toISOString(),
    };
  }

  @ApiOperation({ summary: 'Set password for a user' })
  @ApiParam({ name: 'tenantId', description: 'Tenant ID' })
  @ApiParam({ name: 'userId', description: 'User ID' })
  @ApiBody({ schema: { type: 'object', properties: { password: { type: 'string', minLength: 6 } } } })
  @Post(':userId/set-password')
  @HttpCode(HttpStatus.OK)
  async setPassword(
    @Param('tenantId') tenantId: string,
    @Param('userId') userId: string,
    @Body('password') password: string,
  ) {
    await this.tenantUsersService.setUserPassword(tenantId, userId, password);
    return {
      success: true,
      message: 'Password set successfully',
      timestamp: new Date().toISOString(),
    };
  }

  @ApiOperation({ summary: 'Toggle user active status' })
  @ApiParam({ name: 'tenantId', description: 'Tenant ID' })
  @ApiParam({ name: 'userId', description: 'User ID' })
  @Post(':userId/toggle-status')
  @HttpCode(HttpStatus.OK)
  async toggleStatus(
    @Param('tenantId') tenantId: string,
    @Param('userId') userId: string,
  ) {
    const user = await this.tenantUsersService.toggleUserStatus(tenantId, userId);
    return {
      success: true,
      message: `User ${user.isActive ? 'activated' : 'deactivated'} successfully`,
      data: user,
      timestamp: new Date().toISOString(),
    };
  }
}
