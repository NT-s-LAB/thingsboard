import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsBoolean, IsUUID, IsObject, IsArray, ValidateIf } from 'class-validator';

export class CreateScadaViewDto {
  @ApiProperty({ description: 'SCADA view name', example: 'Production Line Overview' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiPropertyOptional({ description: 'SCADA view description' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: 'Icon identifier for the dashboard', example: 'monitor' })
  @IsOptional()
  @IsString()
  icon?: string;

  @ApiPropertyOptional({ description: 'Layout configuration (JSON)', example: { type: 'grid', columns: 12 } })
  @IsOptional()
  @IsObject()
  layout?: Record<string, any>;

  @ApiPropertyOptional({ description: 'Background config (string URL or JSON object)', example: { type: 'color', color: '#f8fafc' } })
  @IsOptional()
  background?: string | Record<string, any>;

  @ApiPropertyOptional({ description: 'Canvas size (JSON)', example: { width: 1920, height: 1080 } })
  @IsOptional()
  @IsObject()
  canvasSize?: Record<string, any>;

  @ApiPropertyOptional({ description: 'Additional settings (JSON)' })
  @IsOptional()
  @IsObject()
  settings?: Record<string, any>;

  @ApiPropertyOptional({ description: 'Area ID (optional if projectId is provided)' })
  @IsOptional()
  @IsUUID()
  areaId?: string;

  @ApiPropertyOptional({ description: 'Project ID (direct project link)', example: 'uuid' })
  @IsOptional()
  @IsUUID()
  projectId?: string;

  @ApiPropertyOptional({ description: 'Is SCADA view active', default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({ description: 'Widgets array (for full save)', type: [Object] })
  @IsOptional()
  @IsArray()
  widgets?: any[];

  @ApiPropertyOptional({ description: 'Tags for categorization', type: [String] })
  @IsOptional()
  @IsArray()
  tags?: string[];
}
