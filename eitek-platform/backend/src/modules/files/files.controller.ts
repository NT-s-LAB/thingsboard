import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
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
import { FilesService } from './files.service';
import { UploadFileDto } from './dto/upload-file.dto';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { RequestUser } from '../../common/interfaces/common.interface';

@ApiTags('Files')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('files')
export class FilesController {
  constructor(private readonly filesService: FilesService) {}

  @ApiOperation({ summary: 'Upload a file' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: { type: 'string', format: 'binary' },
        type: { type: 'string' },
        isPublic: { type: 'boolean' },
      },
    },
  })
  @Post('upload')
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
      limits: { fileSize: 50 * 1024 * 1024 }, // 50MB max
    }),
  )
  async upload(
    @UploadedFile() file: Express.Multer.File,
    @CurrentUser() user: RequestUser,
  ) {
    const uploadDto: UploadFileDto = {};
    const result = await this.filesService.upload(file, uploadDto, user);
    return {
      success: true,
      message: 'File uploaded successfully',
      data: result,
      timestamp: new Date().toISOString(),
    };
  }

  @ApiOperation({ summary: 'Get all files with pagination' })
  @Get()
  async findAll(
    @Query() pagination: PaginationDto,
    @CurrentUser() user: RequestUser,
  ) {
    const result = await this.filesService.findAll(pagination, user);
    return {
      success: true,
      message: 'Files retrieved successfully',
      data: result.data,
      pagination: result.pagination,
      timestamp: new Date().toISOString(),
    };
  }

  @ApiOperation({ summary: 'Get file by ID' })
  @Get(':id')
  async findOne(@Param('id') id: string) {
    const file = await this.filesService.findOne(id);
    return {
      success: true,
      message: 'File retrieved successfully',
      data: file,
      timestamp: new Date().toISOString(),
    };
  }

  @ApiOperation({ summary: 'Delete file' })
  @Delete(':id')
  async remove(@Param('id') id: string, @CurrentUser() user: RequestUser) {
    await this.filesService.remove(id, user);
    return {
      success: true,
      message: 'File deleted successfully',
      timestamp: new Date().toISOString(),
    };
  }
}
