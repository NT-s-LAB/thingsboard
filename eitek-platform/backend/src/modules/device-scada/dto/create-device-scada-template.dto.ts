import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsBoolean, IsObject } from 'class-validator';

export class CreateDeviceScadaTemplateDto {
  @ApiProperty({ description: 'Template name', example: 'Motor Control Panel' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiPropertyOptional({ description: 'Template description' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ description: 'ScreenDefinition JSON with $currentDevice placeholders' })
  @IsObject()
  @IsNotEmpty()
  screenDefinition: Record<string, any>;

  @ApiPropertyOptional({ description: 'Thumbnail image URL or base64' })
  @IsOptional()
  @IsString()
  thumbnail?: string;

  @ApiPropertyOptional({ description: 'Is template active', default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
