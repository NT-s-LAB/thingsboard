import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsBoolean, IsObject, IsInt, Min } from 'class-validator';

export class UpdateDeviceScadaTemplateDto {
  @ApiPropertyOptional({ description: 'Template name' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ description: 'Template description' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: 'ScreenDefinition JSON with $currentDevice placeholders' })
  @IsOptional()
  @IsObject()
  screenDefinition?: Record<string, any>;

  @ApiPropertyOptional({ description: 'Thumbnail image URL or base64' })
  @IsOptional()
  @IsString()
  thumbnail?: string;

  @ApiPropertyOptional({ description: 'Is template active' })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({ description: 'Version number (for optimistic concurrency)' })
  @IsOptional()
  @IsInt()
  @Min(1)
  version?: number;
}
