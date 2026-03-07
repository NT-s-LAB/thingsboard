import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsBoolean, IsUUID, IsObject } from 'class-validator';

export class CreateScadaViewDto {
  @ApiProperty({ description: 'SCADA view name', example: 'Production Line Overview' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiPropertyOptional({ description: 'SCADA view description' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ description: 'Layout configuration (JSON)', example: { type: 'grid', columns: 12 } })
  @IsObject()
  @IsNotEmpty()
  layout: Record<string, any>;

  @ApiPropertyOptional({ description: 'Background image URL' })
  @IsOptional()
  @IsString()
  background?: string;

  @ApiProperty({ description: 'Canvas size (JSON)', example: { width: 1920, height: 1080 } })
  @IsObject()
  @IsNotEmpty()
  canvasSize: Record<string, any>;

  @ApiPropertyOptional({ description: 'Additional settings (JSON)' })
  @IsOptional()
  @IsObject()
  settings?: Record<string, any>;

  @ApiProperty({ description: 'Area ID' })
  @IsUUID()
  @IsNotEmpty()
  areaId: string;

  @ApiPropertyOptional({ description: 'Is SCADA view active', default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
