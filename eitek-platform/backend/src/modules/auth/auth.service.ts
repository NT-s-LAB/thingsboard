import { Injectable, UnauthorizedException, ConflictException, BadRequestException, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcryptjs';
import * as crypto from 'crypto';
import { PrismaService } from '@/database/prisma.service';
import { LoginDto, RegisterDto, AuthResponseDto } from './dto/auth.dto';
import { EmailService } from '../email/email.service';
import { User } from '@prisma/client';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly emailService: EmailService,
  ) {}

  private get frontendUrl(): string {
    return this.configService.get<string>('FRONTEND_URL', 'http://localhost:3000');
  }

  /**
   * Authenticate user with email and password
   */
  async login(loginDto: LoginDto): Promise<AuthResponseDto> {
    const { email, password } = loginDto;

    const user = await this.prisma.user.findUnique({
      where: { email },
      include: { tenant: true },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('Account is deactivated');
    }

    // Check activation
    if (!user.isActivated) {
      throw new UnauthorizedException('Tài khoản chưa được kích hoạt. Vui lòng kiểm tra email để kích hoạt.');
    }

    await this.prisma.user.update({
      where: { id: user.id },
      data: { lastLogin: new Date() },
    });

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
   * Register new user — sends activation email instead of auto-login
   */
  async register(registerDto: RegisterDto): Promise<{ message: string }> {
    const { email, password, firstName, lastName } = registerDto;

    const existingUser = await this.prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    const activationToken = crypto.randomBytes(32).toString('hex');
    const activationExpiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24h

    const tenantCode = `tenant-${Date.now()}`;
    const tenantName = `${firstName} ${lastName}`;

    const user = await this.prisma.$transaction(async (tx) => {
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
          isActivated: false,
          activationToken,
          activationExpiresAt,
        },
      });
    });

    // Send activation email
    await this.sendActivationEmail(user.email, user.firstName, activationToken);

    return { message: 'Đăng ký thành công! Vui lòng kiểm tra email để kích hoạt tài khoản.' };
  }

  /**
   * Activate account via email token
   */
  async activateAccount(token: string): Promise<{ message: string }> {
    const user = await this.prisma.user.findUnique({
      where: { activationToken: token },
    });

    if (!user) {
      throw new BadRequestException('Link kích hoạt không hợp lệ.');
    }

    if (user.isActivated) {
      return { message: 'Tài khoản đã được kích hoạt trước đó.' };
    }

    if (user.activationExpiresAt && user.activationExpiresAt < new Date()) {
      throw new BadRequestException('Link kích hoạt đã hết hạn. Vui lòng đăng ký lại.');
    }

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        isActivated: true,
        activationToken: null,
        activationExpiresAt: null,
      },
    });

    return { message: 'Kích hoạt tài khoản thành công! Bạn có thể đăng nhập ngay bây giờ.' };
  }

  /**
   * Forgot password — sends reset link via email
   */
  async forgotPassword(email: string): Promise<{ message: string }> {
    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    // Always return success to prevent email enumeration
    if (!user || !user.isActive) {
      return { message: 'Nếu email tồn tại trong hệ thống, bạn sẽ nhận được link đặt lại mật khẩu.' };
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetExpiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    // Store reset token in activationToken field (reuse the field)
    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        activationToken: resetToken,
        activationExpiresAt: resetExpiresAt,
      },
    });

    await this.sendResetPasswordEmail(user.email, user.firstName, resetToken);

    return { message: 'Nếu email tồn tại trong hệ thống, bạn sẽ nhận được link đặt lại mật khẩu.' };
  }

  /**
   * Reset password using token from email
   */
  async resetPassword(token: string, newPassword: string): Promise<{ message: string }> {
    const user = await this.prisma.user.findUnique({
      where: { activationToken: token },
    });

    if (!user) {
      throw new BadRequestException('Link đặt lại mật khẩu không hợp lệ.');
    }

    if (user.activationExpiresAt && user.activationExpiresAt < new Date()) {
      throw new BadRequestException('Link đặt lại mật khẩu đã hết hạn. Vui lòng thử lại.');
    }

    const hashedPassword = await bcrypt.hash(newPassword, 12);

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        activationToken: null,
        activationExpiresAt: null,
      },
    });

    return { message: 'Đặt lại mật khẩu thành công! Bạn có thể đăng nhập với mật khẩu mới.' };
  }

  // ── Email helpers ─────────────────────────────────────────────────────

  private async sendActivationEmail(email: string, firstName: string, token: string): Promise<void> {
    const activationUrl = `${this.frontendUrl}/activate?token=${token}`;

    const result = await this.emailService.sendEmail({
      to: email,
      subject: '🔑 EITEK Platform - Kích hoạt tài khoản',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 520px; margin: 0 auto; padding: 32px; background: #ffffff;">
          <div style="text-align: center; margin-bottom: 24px;">
            <h1 style="color: #1e3a5f; font-size: 28px; margin: 0;">EITEK</h1>
            <p style="color: #94a3b8; font-size: 11px; letter-spacing: 2px; text-transform: uppercase;">IoT Platform</p>
          </div>
          <h2 style="color: #1e3a5f; font-size: 20px;">Xin chào ${firstName},</h2>
          <p style="color: #475569; line-height: 1.6;">
            Cảm ơn bạn đã đăng ký tài khoản EITEK Platform. Vui lòng nhấn nút bên dưới để kích hoạt tài khoản:
          </p>
          <div style="text-align: center; margin: 32px 0;">
            <a href="${activationUrl}" 
               style="display: inline-block; padding: 14px 32px; background: #1e3a5f; color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 15px;">
              Kích hoạt tài khoản
            </a>
          </div>
          <p style="color: #94a3b8; font-size: 13px;">
            Link kích hoạt có hiệu lực trong <strong>24 giờ</strong>.<br/>
            Nếu bạn không đăng ký tài khoản, vui lòng bỏ qua email này.
          </p>
          <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 24px 0;" />
          <p style="color: #cbd5e1; font-size: 11px; text-align: center;">© ${new Date().getFullYear()} EITEK Corporation</p>
        </div>
      `,
    });

    if (!result.success) {
      this.logger.warn(`Failed to send activation email to ${email}: ${result.error}`);
    }
  }

  private async sendResetPasswordEmail(email: string, firstName: string, token: string): Promise<void> {
    const resetUrl = `${this.frontendUrl}/reset-password?token=${token}`;

    const result = await this.emailService.sendEmail({
      to: email,
      subject: '🔒 EITEK Platform - Đặt lại mật khẩu',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 520px; margin: 0 auto; padding: 32px; background: #ffffff;">
          <div style="text-align: center; margin-bottom: 24px;">
            <h1 style="color: #1e3a5f; font-size: 28px; margin: 0;">EITEK</h1>
            <p style="color: #94a3b8; font-size: 11px; letter-spacing: 2px; text-transform: uppercase;">IoT Platform</p>
          </div>
          <h2 style="color: #1e3a5f; font-size: 20px;">Xin chào ${firstName},</h2>
          <p style="color: #475569; line-height: 1.6;">
            Chúng tôi nhận được yêu cầu đặt lại mật khẩu cho tài khoản của bạn. Nhấn nút bên dưới để tạo mật khẩu mới:
          </p>
          <div style="text-align: center; margin: 32px 0;">
            <a href="${resetUrl}" 
               style="display: inline-block; padding: 14px 32px; background: #1e3a5f; color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 15px;">
              Đặt lại mật khẩu
            </a>
          </div>
          <p style="color: #94a3b8; font-size: 13px;">
            Link có hiệu lực trong <strong>1 giờ</strong>.<br/>
            Nếu bạn không yêu cầu đặt lại mật khẩu, vui lòng bỏ qua email này.
          </p>
          <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 24px 0;" />
          <p style="color: #cbd5e1; font-size: 11px; text-align: center;">© ${new Date().getFullYear()} EITEK Corporation</p>
        </div>
      `,
    });

    if (!result.success) {
      this.logger.warn(`Failed to send reset password email to ${email}: ${result.error}`);
    }
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