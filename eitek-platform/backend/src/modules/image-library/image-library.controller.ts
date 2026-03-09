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
import { IsOptional, IsString } from 'class-validator';

class FindImagesQueryDto extends PaginationDto {
  @IsOptional()
  @IsString()
  categoryId?: string;
}
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { RequestUser } from '../../common/interfaces/common.interface';

@ApiTags('Image Library')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('image-library')
export class ImageLibraryController {
  constructor(private readonly service: ImageLibraryService) {}

  // ── Category CRUD ──

  @ApiOperation({ summary: 'Create image category (folder)' })
  @Post('categories')
  async createCategory(@Body() dto: CreateImageCategoryDto) {
    const category = await this.service.createCategory(dto);
    return {
      success: true,
      message: 'Image category created successfully',
      data: category,
      timestamp: new Date().toISOString(),
    };
  }

  @ApiOperation({ summary: 'Get all image categories (tree)' })
  @Get('categories')
  async findAllCategories(@Query() pagination: PaginationDto) {
    const result = await this.service.findAllCategories(pagination);
    return {
      success: true,
      message: 'Image categories retrieved successfully',
      data: result.data,
      pagination: result.pagination,
      timestamp: new Date().toISOString(),
    };
  }

  @ApiOperation({ summary: 'Get image category by ID' })
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
  @Delete('categories/:id')
  async removeCategory(@Param('id') id: string) {
    await this.service.removeCategory(id);
    return {
      success: true,
      message: 'Image category deleted successfully',
      timestamp: new Date().toISOString(),
    };
  }

  // ── Image CRUD ──

  @ApiOperation({ summary: 'Upload image to library' })
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
  @Get('images')
  async findImages(
    @Query() query: FindImagesQueryDto,
  ) {
    const result = await this.service.findImages(query, query.categoryId);
    return {
      success: true,
      message: 'Images retrieved successfully',
      data: result.data,
      pagination: result.pagination,
      timestamp: new Date().toISOString(),
    };
  }

  @ApiOperation({ summary: 'Move image to another category' })
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
  @Delete('images/:id')
  async deleteImage(@Param('id') id: string) {
    await this.service.deleteImage(id);
    return {
      success: true,
      message: 'Image deleted successfully',
      timestamp: new Date().toISOString(),
    };
  }
}
