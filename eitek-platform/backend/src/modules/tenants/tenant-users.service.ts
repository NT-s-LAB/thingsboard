import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CreateTenantUserDto, ActivationMethod } from './dto/create-tenant-user.dto';
import { PaginationDto, PaginatedResult } from '../../common/dto/pagination.dto';
import { User, UserRole } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import * as crypto from 'crypto';

export interface TenantUserWithoutPassword {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string | null;
  description: string | null;
  role: UserRole;
  isActive: boolean;
  isActivated: boolean;
  activationToken: string | null;
  activationExpiresAt: Date | null;
  lastLogin: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

@Injectable()
export class TenantUsersService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Create a new user for a specific tenant
   */
  async createTenantUser(
    tenantId: string,
    createDto: CreateTenantUserDto,
  ): Promise<TenantUserWithoutPassword & { activationLink?: string }> {
    // Verify tenant exists
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
    });

    if (!tenant) {
      throw new NotFoundException('Tenant not found');
    }

    // Check if user with email already exists
    const existingUser = await this.prisma.user.findUnique({
      where: { email: createDto.email },
    });

    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }

    let hashedPassword: string;
    let activationToken: string | null = null;
    let activationExpiresAt: Date | null = null;
    let isActivated = false;

    if (createDto.activationMethod === ActivationMethod.SET_PASSWORD) {
      if (!createDto.password) {
        throw new BadRequestException('Password is required when activation method is SET_PASSWORD');
      }
      hashedPassword = await bcrypt.hash(createDto.password, 12);
      isActivated = true;
    } else {
      // Generate activation token
      activationToken = crypto.randomBytes(32).toString('hex');
      activationExpiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
      // Set a temporary random password
      hashedPassword = await bcrypt.hash(crypto.randomBytes(16).toString('hex'), 12);
      isActivated = false;
    }

    const user = await this.prisma.user.create({
      data: {
        email: createDto.email,
        firstName: createDto.firstName,
        lastName: createDto.lastName,
        phone: createDto.phone,
        description: createDto.description,
        // Super Admin can only create TENANT_ADMIN users
        role: UserRole.TENANT_ADMIN,
        password: hashedPassword,
        isActive: createDto.isActive ?? true,
        isActivated,
        activationToken,
        activationExpiresAt,
        tenantId,
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        description: true,
        role: true,
        isActive: true,
        isActivated: true,
        activationToken: true,
        activationExpiresAt: true,
        lastLogin: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    // Generate activation link if using activation link method
    if (createDto.activationMethod === ActivationMethod.ACTIVATION_LINK && activationToken) {
      const activationLink = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/activate?token=${activationToken}`;
      return {
        ...user,
        activationLink,
      };
    }

    return user;
  }

  /**
   * Get all users for a specific tenant
   */
  async findAllByTenant(
    tenantId: string,
    pagination: PaginationDto,
  ): Promise<PaginatedResult<TenantUserWithoutPassword>> {
    const page = pagination.page;
    const limit = pagination.effectiveLimit;
    const offset = pagination.offset;
    const search = pagination.effectiveSearch;
    const sortBy = pagination.effectiveSortBy;
    const sortOrder = pagination.effectiveSortOrder;

    // Verify tenant exists
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
    });

    if (!tenant) {
      throw new NotFoundException('Tenant not found');
    }

    const where: any = {
      tenantId,
    };

    if (search) {
      where.OR = [
        { email: { contains: search, mode: 'insensitive' } },
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search, mode: 'insensitive' } },
      ];
    }

    const orderBy: any = {};
    if (sortBy) {
      orderBy[sortBy] = sortOrder;
    } else {
      orderBy.createdAt = 'desc';
    }

    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          phone: true,
          description: true,
          role: true,
          isActive: true,
          isActivated: true,
          activationToken: true,
          activationExpiresAt: true,
          lastLogin: true,
          createdAt: true,
          updatedAt: true,
        },
        skip: offset,
        take: limit,
        orderBy,
      }),
      this.prisma.user.count({ where }),
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
      data: users,
      pagination: {
        total,
        page,
        limit,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
    };
  }

  /**
   * Get a specific user by ID within a tenant
   */
  async findOneByTenant(tenantId: string, userId: string): Promise<TenantUserWithoutPassword> {
    const user = await this.prisma.user.findFirst({
      where: {
        id: userId,
        tenantId,
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        description: true,
        role: true,
        isActive: true,
        isActivated: true,
        activationToken: true,
        activationExpiresAt: true,
        lastLogin: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found in this tenant');
    }

    return user;
  }

  /**
   * Update a user within a tenant
   */
  async updateTenantUser(
    tenantId: string,
    userId: string,
    updateDto: Partial<CreateTenantUserDto>,
  ): Promise<TenantUserWithoutPassword> {
    // Verify user belongs to tenant
    const existingUser = await this.prisma.user.findFirst({
      where: {
        id: userId,
        tenantId,
      },
    });

    if (!existingUser) {
      throw new NotFoundException('User not found in this tenant');
    }

    // Check email uniqueness if updating email
    if (updateDto.email && updateDto.email !== existingUser.email) {
      const emailExists = await this.prisma.user.findUnique({
        where: { email: updateDto.email },
      });
      if (emailExists) {
        throw new ConflictException('Email already in use');
      }
    }

    const updateData: any = {};
    if (updateDto.email) updateData.email = updateDto.email;
    if (updateDto.firstName) updateData.firstName = updateDto.firstName;
    if (updateDto.lastName) updateData.lastName = updateDto.lastName;
    if (updateDto.phone !== undefined) updateData.phone = updateDto.phone;
    if (updateDto.description !== undefined) updateData.description = updateDto.description;
    // Role is always TENANT_ADMIN for tenant users - not changeable by Super Admin
    if (updateDto.isActive !== undefined) updateData.isActive = updateDto.isActive;

    const user = await this.prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        description: true,
        role: true,
        isActive: true,
        isActivated: true,
        activationToken: true,
        activationExpiresAt: true,
        lastLogin: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return user;
  }

  /**
   * Delete a user from a tenant
   */
  async deleteTenantUser(tenantId: string, userId: string): Promise<void> {
    const user = await this.prisma.user.findFirst({
      where: {
        id: userId,
        tenantId,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found in this tenant');
    }

    await this.prisma.user.delete({
      where: { id: userId },
    });
  }

  /**
   * Resend activation link for a user
   */
  async resendActivationLink(
    tenantId: string,
    userId: string,
  ): Promise<{ activationLink: string; expiresAt: Date }> {
    const user = await this.prisma.user.findFirst({
      where: {
        id: userId,
        tenantId,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found in this tenant');
    }

    if (user.isActivated) {
      throw new BadRequestException('User is already activated');
    }

    // Generate new activation token
    const activationToken = crypto.randomBytes(32).toString('hex');
    const activationExpiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    await this.prisma.user.update({
      where: { id: userId },
      data: {
        activationToken,
        activationExpiresAt,
      },
    });

    const activationLink = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/activate?token=${activationToken}`;

    return {
      activationLink,
      expiresAt: activationExpiresAt,
    };
  }

  /**
   * Set password for a user (admin action)
   */
  async setUserPassword(
    tenantId: string,
    userId: string,
    newPassword: string,
  ): Promise<void> {
    const user = await this.prisma.user.findFirst({
      where: {
        id: userId,
        tenantId,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found in this tenant');
    }

    if (newPassword.length < 6) {
      throw new BadRequestException('Password must be at least 6 characters');
    }

    const hashedPassword = await bcrypt.hash(newPassword, 12);

    await this.prisma.user.update({
      where: { id: userId },
      data: {
        password: hashedPassword,
        isActivated: true,
        activationToken: null,
        activationExpiresAt: null,
      },
    });
  }

  /**
   * Activate user account with token
   */
  async activateAccount(
    token: string,
    newPassword: string,
  ): Promise<{ success: boolean; message: string }> {
    const user = await this.prisma.user.findFirst({
      where: {
        activationToken: token,
        activationExpiresAt: {
          gt: new Date(),
        },
      },
    });

    if (!user) {
      throw new BadRequestException('Invalid or expired activation token');
    }

    if (newPassword.length < 6) {
      throw new BadRequestException('Password must be at least 6 characters');
    }

    const hashedPassword = await bcrypt.hash(newPassword, 12);

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        isActivated: true,
        activationToken: null,
        activationExpiresAt: null,
      },
    });

    return {
      success: true,
      message: 'Account activated successfully',
    };
  }

  /**
   * Toggle user active status
   */
  async toggleUserStatus(
    tenantId: string,
    userId: string,
  ): Promise<TenantUserWithoutPassword> {
    const user = await this.prisma.user.findFirst({
      where: {
        id: userId,
        tenantId,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found in this tenant');
    }

    const updatedUser = await this.prisma.user.update({
      where: { id: userId },
      data: {
        isActive: !user.isActive,
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        description: true,
        role: true,
        isActive: true,
        isActivated: true,
        activationToken: true,
        activationExpiresAt: true,
        lastLogin: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return updatedUser;
  }
}
