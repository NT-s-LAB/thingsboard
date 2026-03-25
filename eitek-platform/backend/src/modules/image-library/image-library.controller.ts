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
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiConsumes, ApiBody } from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { v4 as uuidv4 } from 'uuid';
import * as path from 'path';
import { ImageLibraryService } from './image-library.service';
import { CreateImageCategoryDto } from './dto/create-image-category.dto';
import { UpdateImageCategoryDto } from './dto/update-image-category.dto';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { IsOptional, IsString } from 'class-validator';

class FindImagesQueryDto extends PaginationDto {
  @IsOptional()
  @IsString()
  categoryId?: string;
}
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { RequestUser } from '../../common/interfaces/common.interface';
import { UserRole } from '@prisma/client';

@ApiTags('Image Library')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('image-library')
export class ImageLibraryController {
  constructor(private readonly service: ImageLibraryService) {}

  // ── Category CRUD ──

  @ApiOperation({ summary: 'Create image category (folder)' })
  @Roles(UserRole.TENANT_ADMIN)
  @Post('categories')
  async createCategory(@Body() dto: CreateImageCategoryDto, @CurrentUser() user: RequestUser) {
    const category = await this.service.createCategory(dto, user);
    return {
      success: true,
      message: 'Image category created successfully',
      data: category,
      timestamp: new Date().toISOString(),
    };
  }

  @ApiOperation({ summary: 'Get all image categories (tree)' })
  @Roles(UserRole.VIEWER)
  @Get('categories')
  async findAllCategories(@Query() pagination: PaginationDto, @CurrentUser() user: RequestUser) {
    const result = await this.service.findAllCategories(pagination, user);
    return {
      success: true,
      message: 'Image categories retrieved successfully',
      data: result.data,
      pagination: result.pagination,
      timestamp: new Date().toISOString(),
    };
  }

  @ApiOperation({ summary: 'Get image category by ID' })
  @Roles(UserRole.VIEWER)
  @Get('categories/:id')
  async findCategory(@Param('id') id: string) {
    const category = await this.service.findCategory(id);
    return {
      success: true,
      message: 'Image category retrieved successfully',
      data: category,
      timestamp: new Date().toISOString(),
    };
  }

  @ApiOperation({ summary: 'Update image category' })
  @Roles(UserRole.TENANT_ADMIN)
  @Put('categories/:id')
  async updateCategory(@Param('id') id: string, @Body() dto: UpdateImageCategoryDto) {
    const category = await this.service.updateCategory(id, dto);
    return {
      success: true,
      message: 'Image category updated successfully',
      data: category,
      timestamp: new Date().toISOString(),
    };
  }

  @ApiOperation({ summary: 'Delete image category' })
  @Roles(UserRole.TENANT_ADMIN)
  @Delete('categories/:id')
  async removeCategory(@Param('id') id: string, @CurrentUser() user: RequestUser) {
    await this.service.removeCategory(id, user);
    return {
      success: true,
      message: 'Image category deleted successfully',
      timestamp: new Date().toISOString(),
    };
  }

  // ── Image CRUD ──

  @ApiOperation({ summary: 'Upload image to library' })
  @Roles(UserRole.TENANT_ADMIN)
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: { type: 'string', format: 'binary' },
        categoryId: { type: 'string' },
      },
    },
  })
  @Post('images')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: './uploads',
        filename: (req, file, cb) => {
          const ext = path.extname(file.originalname);
          const filename = `${uuidv4()}${ext}`;
          cb(null, filename);
        },
      }),
      limits: { fileSize: 50 * 1024 * 1024 },
      fileFilter: (req, file, cb) => {
        if (!file.mimetype.startsWith('image/')) {
          cb(new Error('Only image files are allowed'), false);
          return;
        }
        cb(null, true);
      },
    }),
  )
  async uploadImage(
    @UploadedFile() file: Express.Multer.File,
    @Body('categoryId') categoryId: string | undefined,
    @CurrentUser() user: RequestUser,
  ) {
    const result = await this.service.uploadImage(file, categoryId, user);
    return {
      success: true,
      message: 'Image uploaded successfully',
      data: result,
      timestamp: new Date().toISOString(),
    };
  }

  @ApiOperation({ summary: 'Get images (optionally filtered by category)' })
  @Roles(UserRole.VIEWER)
  @Get('images')
  async findImages(
    @Query() query: FindImagesQueryDto,
    @CurrentUser() user: RequestUser,
  ) {
    const result = await this.service.findImages(query, user, query.categoryId);
    return {
      success: true,
      message: 'Images retrieved successfully',
      data: result.data,
      pagination: result.pagination,
      timestamp: new Date().toISOString(),
    };
  }

  @ApiOperation({ summary: 'Move image to another category' })
  @Roles(UserRole.TENANT_ADMIN)
  @Put('images/:id/move')
  async moveImage(
    @Param('id') id: string,
    @Body('categoryId') categoryId: string | null,
  ) {
    const file = await this.service.moveImage(id, categoryId);
    return {
      success: true,
      message: 'Image moved successfully',
      data: file,
      timestamp: new Date().toISOString(),
    };
  }

  @ApiOperation({ summary: 'Delete image' })
  @Roles(UserRole.TENANT_ADMIN)
  @Delete('images/:id')
  async deleteImage(@Param('id') id: string, @CurrentUser() user: RequestUser) {
    await this.service.deleteImage(id, user);
    return {
      success: true,
      message: 'Image deleted successfully',
      timestamp: new Date().toISOString(),
    };
  }
}
