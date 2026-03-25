import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '@/database/prisma.service';
import { LoginDto, RegisterDto, AuthResponseDto } from './dto/auth.dto';
import { User } from '@prisma/client';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  /**
   * Authenticate user with email and password
   */
  async login(loginDto: LoginDto): Promise<AuthResponseDto> {
    const { email, password } = loginDto;

    // Find user by email
    const user = await this.prisma.user.findUnique({
      where: { email },
      include: {
        tenant: true,
      },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Check if user is active
    if (!user.isActive) {
      throw new UnauthorizedException('Account is deactivated');
    }

    // Update last login
    await this.prisma.user.update({
      where: { id: user.id },
      data: { lastLogin: new Date() },
    });

    // Generate tokens
    const tokens = await this.generateTokens(user);

    return {
      ...tokens,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        tenantId: user.tenantId,
      },
    };
  }

  /**
   * Register new user
   */
  async register(registerDto: RegisterDto): Promise<AuthResponseDto> {
    const { email, password, firstName, lastName } = registerDto;

    // Check if user already exists
    const existingUser = await this.prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create tenant + TENANT_ADMIN user in a single transaction
    const tenantCode = `tenant-${Date.now()}`;
    const tenantName = `${firstName} ${lastName}`;

    const user = await this.prisma.$transaction(async (tx) => {
      // Find default profile to auto-assign
      const defaultProfile = await tx.tenantProfile.findFirst({
        where: { isDefault: true, isActive: true },
      });

      const tenant = await tx.tenant.create({
        data: {
          name: tenantName,
          code: tenantCode,
          profileId: defaultProfile?.id ?? undefined,
        },
      });

      return tx.user.create({
        data: {
          email,
          password: hashedPassword,
          firstName,
          lastName,
          tenantId: tenant.id,
          role: 'TENANT_ADMIN',
        },
        include: {
          tenant: true,
        },
      });
    });

    // Generate tokens
    const tokens = await this.generateTokens(user);

    return {
      ...tokens,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        tenantId: user.tenantId,
      },
    };
  }

  /**
   * Refresh access token
   */
  async refreshToken(refreshToken: string): Promise<AuthResponseDto> {
    try {
      const payload = this.jwtService.verify(refreshToken, {
        secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
      });

      const user = await this.prisma.user.findUnique({
        where: { id: payload.sub },
        include: { tenant: true },
      });

      if (!user || !user.isActive) {
        throw new UnauthorizedException('Invalid refresh token');
      }

      const tokens = await this.generateTokens(user);

      return {
        ...tokens,
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
          tenantId: user.tenantId,
        },
      };
    } catch (error) {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  /**
   * Validate user by ID (for JWT strategy)
   */
  async validateUser(userId: string): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: { id: userId, isActive: true },
      include: { tenant: { include: { profile: true } } },
    });
  }

  /**
   * Parse expiration time from config (supports "1d", "7d", "1h", or seconds as number)
   */
  private parseExpiration(value: string | number | undefined, defaultSeconds: number): number {
    if (!value) return defaultSeconds;
    if (typeof value === 'number') return value;
    
    const str = String(value).trim().toLowerCase();
    const match = str.match(/^(\d+)(s|m|h|d|w)?$/);
    if (!match) return defaultSeconds;
    
    const num = parseInt(match[1], 10);
    const unit = match[2] || 's';
    
    switch (unit) {
      case 's': return num;
      case 'm': return num * 60;
      case 'h': return num * 3600;
      case 'd': return num * 86400;
      case 'w': return num * 604800;
      default: return defaultSeconds;
    }
  }

  /**
   * Generate access and refresh tokens
   */
  private async generateTokens(user: User): Promise<{
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
  }> {
    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      tenantId: user.tenantId,
    };

    // Support both "1d" format and numeric seconds
    const accessTokenExpiration = this.parseExpiration(
      this.configService.get('JWT_ACCESS_EXPIRATION'),
      86400, // Default: 1 day (increased from 1 hour)
    );
    const refreshTokenExpiration = this.parseExpiration(
      this.configService.get('JWT_REFRESH_EXPIRATION'),
      604800, // Default: 7 days
    );

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret: this.configService.get<string>('JWT_ACCESS_SECRET'),
        expiresIn: accessTokenExpiration,
      }),
      this.jwtService.signAsync(payload, {
        secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
        expiresIn: refreshTokenExpiration,
      }),
    ]);

    return {
      accessToken,
      refreshToken,
      expiresIn: accessTokenExpiration,
    };
  }

  /**
   * Logout user (invalidate tokens)
   */
  async logout(userId: string): Promise<void> {
    // In a production system, you might want to blacklist tokens
    // For now, we just update the user's last activity
    await this.prisma.user.update({
      where: { id: userId },
      data: { updatedAt: new Date() },
    });
  }
}