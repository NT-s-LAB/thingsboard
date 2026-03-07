import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsBoolean, IsUUID, IsObject } from 'class-validator';

export class CreateWidgetDto {
  @ApiProperty({ description: 'Widget name', example: 'Temperature Gauge' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiPropertyOptional({ description: 'Widget description' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ description: 'Widget type', example: 'GAUGE' })
  @IsString()
  @IsNotEmpty()
  type: string;

  @ApiProperty({ description: 'Widget configuration (JSON)', example: { min: 0, max: 100, unit: '°C' } })
  @IsObject()
  @IsNotEmpty()
  config: Record<string, any>;

  @ApiProperty({ description: 'Widget template (JSON)', example: { html: '<div></div>', css: '', js: '' } })
  @IsObject()
  @IsNotEmpty()
  template: Record<string, any>;

  @ApiPropertyOptional({ description: 'Preview image URL' })
  @IsOptional()
  @IsString()
  preview?: string;

  @ApiPropertyOptional({ description: 'Widget version', default: '1.0.0' })
  @IsOptional()
  @IsString()
  version?: string;

  @ApiPropertyOptional({ description: 'Widget category ID' })
  @IsOptional()
  @IsUUID()
  categoryId?: string;

  @ApiPropertyOptional({ description: 'Symbol ID' })
  @IsOptional()
  @IsUUID()
  symbolId?: string;

  @ApiPropertyOptional({ description: 'Is widget active', default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
