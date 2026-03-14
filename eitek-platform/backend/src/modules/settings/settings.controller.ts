import {
  Controller,
  Get,
  Put,
  Post,
  Body,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiConsumes, ApiBody } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { RequestUser } from '../../common/interfaces/common.interface';
import { SettingsService } from './settings.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { UpdateUserSettingsDto } from './dto/update-user-settings.dto';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { v4 as uuidv4 } from 'uuid';

const avatarStorage = diskStorage({
  destination: './uploads/avatars',
  filename: (req, file, cb) => {
    const uniqueName = `${uuidv4()}${extname(file.originalname)}`;
    cb(null, uniqueName);
  },
});

const imageFileFilter = (req: any, file: any, cb: any) => {
  if (!file.mimetype.match(/^image\/(jpeg|png|gif|webp)$/)) {
    return cb(new BadRequestException('Only image files are allowed'), false);
  }
  cb(null, true);
};

@ApiTags('Settings')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('settings')
export class SettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  // ─────────────────────────────────────────────────────────────
  // Get All Settings
  // ─────────────────────────────────────────────────────────────

  @Get()
  @ApiOperation({ summary: 'Get all settings for current user' })
  async getAllSettings(@CurrentUser() user: RequestUser) {
    return this.settingsService.getAllSettings(user.id);
  }

  // ─────────────────────────────────────────────────────────────
  // Profile
  // ─────────────────────────────────────────────────────────────

  @Get('profile')
  @ApiOperation({ summary: 'Get current user profile' })
  async getProfile(@CurrentUser() user: RequestUser) {
    return this.settingsService.getProfile(user.id);
  }

  @Put('profile')
  @ApiOperation({ summary: 'Update current user profile' })
  async updateProfile(
    @CurrentUser() user: RequestUser,
    @Body() dto: UpdateProfileDto,
  ) {
    return this.settingsService.updateProfile(user.id, dto);
  }

  @Post('profile/avatar')
  @ApiOperation({ summary: 'Upload avatar' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: { type: 'string', format: 'binary' },
      },
    },
  })
  @UseInterceptors(
    FileInterceptor('file', {
      storage: avatarStorage,
      fileFilter: imageFileFilter,
      limits: { fileSize: 2 * 1024 * 1024 }, // 2MB
    }),
  )
  async uploadAvatar(
    @CurrentUser() user: RequestUser,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }
    const avatarUrl = `/uploads/avatars/${file.filename}`;
    return this.settingsService.updateAvatar(user.id, avatarUrl);
  }

  // ─────────────────────────────────────────────────────────────
  // Password
  // ─────────────────────────────────────────────────────────────

  @Post('password')
  @ApiOperation({ summary: 'Change password' })
  async changePassword(
    @CurrentUser() user: RequestUser,
    @Body() dto: ChangePasswordDto,
  ) {
    return this.settingsService.changePassword(user.id, dto);
  }

  // ─────────────────────────────────────────────────────────────
  // User Settings (Preferences)
  // ─────────────────────────────────────────────────────────────

  @Get('preferences')
  @ApiOperation({ summary: 'Get user preferences' })
  async getUserSettings(@CurrentUser() user: RequestUser) {
    return this.settingsService.getUserSettings(user.id);
  }

  @Put('preferences')
  @ApiOperation({ summary: 'Update user preferences' })
  async updateUserSettings(
    @CurrentUser() user: RequestUser,
    @Body() dto: UpdateUserSettingsDto,
  ) {
    return this.settingsService.updateUserSettings(user.id, dto);
  }
}
