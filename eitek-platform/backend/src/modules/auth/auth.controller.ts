import { 
  Controller, 
  Post, 
  Body, 
  HttpStatus, 
  UseGuards, 
  Get, 
  Req,
  Query,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { LoginDto, RegisterDto, RefreshTokenDto, AuthResponseDto, ForgotPasswordDto, ResetPasswordDto, ActivateAccountDto } from './dto/auth.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { User } from './decorators/user.decorator';
import { ApiResponseWrapper } from '@/common/decorators/api-response.decorator';
import { ResponseDto } from '@/common/dto/response.dto';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @ApiOperation({ summary: 'User login' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Login successful',
    type: AuthResponseDto,
  })
  @ApiResponseWrapper(AuthResponseDto)
  async login(@Body() loginDto: LoginDto): Promise<ResponseDto<AuthResponseDto>> {
    const result = await this.authService.login(loginDto);
    
    return {
      success: true,
      statusCode: HttpStatus.OK,
      message: 'Login successful',
      data: result,
      timestamp: new Date().toISOString(),
    };
  }

  @Post('register')
  @ApiOperation({ summary: 'User registration' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Registration successful — activation email sent',
  })
  @ApiResponseWrapper()
  async register(@Body() registerDto: RegisterDto): Promise<ResponseDto<any>> {
    const result = await this.authService.register(registerDto);
    
    return {
      success: true,
      statusCode: HttpStatus.CREATED,
      message: result.message,
      data: result,
      timestamp: new Date().toISOString(),
    };
  }

  @Post('activate')
  @ApiOperation({ summary: 'Activate account via email token' })
  @ApiResponseWrapper()
  async activateAccount(@Body() dto: ActivateAccountDto): Promise<ResponseDto<any>> {
    const result = await this.authService.activateAccount(dto.token);
    return {
      success: true,
      statusCode: HttpStatus.OK,
      message: result.message,
      data: result,
      timestamp: new Date().toISOString(),
    };
  }

  @Post('forgot-password')
  @ApiOperation({ summary: 'Request password reset email' })
  @ApiResponseWrapper()
  async forgotPassword(@Body() dto: ForgotPasswordDto): Promise<ResponseDto<any>> {
    const result = await this.authService.forgotPassword(dto.email);
    return {
      success: true,
      statusCode: HttpStatus.OK,
      message: result.message,
      data: result,
      timestamp: new Date().toISOString(),
    };
  }

  @Post('reset-password')
  @ApiOperation({ summary: 'Reset password using token from email' })
  @ApiResponseWrapper()
  async resetPassword(@Body() dto: ResetPasswordDto): Promise<ResponseDto<any>> {
    const result = await this.authService.resetPassword(dto.token, dto.password);
    return {
      success: true,
      statusCode: HttpStatus.OK,
      message: result.message,
      data: result,
      timestamp: new Date().toISOString(),
    };
  }

  @Post('refresh')
  @ApiOperation({ summary: 'Refresh access token' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Token refreshed successfully',
    type: AuthResponseDto,
  })
  @ApiResponseWrapper(AuthResponseDto)
  async refreshToken(@Body() refreshTokenDto: RefreshTokenDto): Promise<ResponseDto<AuthResponseDto>> {
    const result = await this.authService.refreshToken(refreshTokenDto.refreshToken);
    
    return {
      success: true,
      statusCode: HttpStatus.OK,
      message: 'Token refreshed successfully',
      data: result,
      timestamp: new Date().toISOString(),
    };
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'User logout' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Logout successful',
  })
  @ApiResponseWrapper()
  async logout(@User('id') userId: string): Promise<ResponseDto<void>> {
    await this.authService.logout(userId);
    
    return {
      success: true,
      statusCode: HttpStatus.OK,
      message: 'Logout successful',
      timestamp: new Date().toISOString(),
    };
  }

  @Get('profile')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get user profile' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'User profile retrieved successfully',
  })
  @ApiResponseWrapper()
  async getProfile(@User() user: any): Promise<ResponseDto<any>> {
    // Remove sensitive data
    const { password, ...userProfile } = user;
    
    return {
      success: true,
      statusCode: HttpStatus.OK,
      message: 'User profile retrieved successfully',
      data: userProfile,
      timestamp: new Date().toISOString(),
    };
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current user information' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Current user information retrieved successfully',
  })
  @ApiResponseWrapper()
  async getCurrentUser(@User() user: any): Promise<ResponseDto<any>> {
    return {
      success: true,
      statusCode: HttpStatus.OK,
      message: 'Current user information retrieved successfully',
      data: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        tenantId: user.tenantId,
        isActive: user.isActive,
        lastLogin: user.lastLogin,
      },
      timestamp: new Date().toISOString(),
    };
  }
}