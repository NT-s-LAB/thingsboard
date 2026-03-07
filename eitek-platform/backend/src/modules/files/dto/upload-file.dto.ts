import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsEnum, IsBoolean } from 'class-validator';
import { FileType } from '@prisma/client';

export class UploadFileDto {
  @ApiPropertyOptional({ description: 'File type', enum: FileType })
  @IsOptional()
  @IsEnum(FileType)
  type?: FileType;

  @ApiPropertyOptional({ description: 'Whether the file is public', default: false })
  @IsOptional()
  @IsBoolean()
  isPublic?: boolean;

  @ApiPropertyOptional({ description: 'File metadata (JSON)' })
  @IsOptional()
  metadata?: Record<string, any>;
}
