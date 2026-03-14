import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsBoolean, IsUUID, IsObject, IsArray } from 'class-validator';

export class UpdateScadaViewDto {
  @ApiPropertyOptional({ description: 'SCADA view name' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ description: 'SCADA view description' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: 'Icon identifier for the dashboard', example: 'monitor' })
  @IsOptional()
  @IsString()
  icon?: string;

  @ApiPropertyOptional({ description: 'Layout configuration (JSON)' })
  @IsOptional()
  @IsObject()
  layout?: Record<string, any>;

  @ApiPropertyOptional({ description: 'Background config (string URL or JSON object)' })
  @IsOptional()
  background?: any;

  @ApiPropertyOptional({ description: 'Canvas size (JSON)' })
  @IsOptional()
  @IsObject()
  canvasSize?: Record<string, any>;

  @ApiPropertyOptional({ description: 'Additional settings (JSON)' })
  @IsOptional()
  @IsObject()
  settings?: Record<string, any>;

  @ApiPropertyOptional({ description: 'Area ID' })
  @IsOptional()
  @IsUUID()
  areaId?: string;

  @ApiPropertyOptional({ description: 'Project ID' })
  @IsOptional()
  @IsUUID()
  projectId?: string;

  @ApiPropertyOptional({ description: 'Is SCADA view active' })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({ description: 'Widgets array (for full save)' })
  @IsOptional()
  @IsArray()
  widgets?: any[];

  @ApiPropertyOptional({ description: 'Tags for categorization' })
  @IsOptional()
  @IsArray()
  tags?: string[];
}
