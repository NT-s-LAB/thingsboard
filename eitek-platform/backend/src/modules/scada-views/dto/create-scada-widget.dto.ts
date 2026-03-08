import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsBoolean, IsObject, ValidateIf } from 'class-validator';

export class CreateScadaWidgetDto {
  @ApiProperty({ description: 'Widget type', example: 'button' })
  @IsString()
  @IsNotEmpty()
  type: string;

  @ApiProperty({ description: 'Widget name', example: 'New Button' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiPropertyOptional({ description: 'Widget description' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({
    description: 'Widget position and size on canvas',
    example: { x: 100, y: 100, width: 120, height: 40, rotation: 0, zIndex: 0 },
  })
  @IsObject()
  @IsNotEmpty()
  position: Record<string, any>;

  @ApiProperty({
    description: 'Widget-specific properties',
    example: { text: 'Click me', variant: 'primary' },
  })
  @IsObject()
  @IsNotEmpty()
  properties: Record<string, any>;

  @ApiPropertyOptional({
    description: 'Data bindings configuration',
    example: { items: [] },
  })
  @IsOptional()
  @ValidateIf((_o, value) => value !== null && value !== undefined)
  bindings?: any;

  @ApiPropertyOptional({
    description: 'Widget styles',
    example: { backgroundColor: '#3B82F6', borderColor: '#2563EB' },
  })
  @IsOptional()
  @ValidateIf((_o, value) => value !== null && value !== undefined)
  styles?: any;

  @ApiPropertyOptional({ description: 'Widget visibility', default: true })
  @IsOptional()
  @IsBoolean()
  isVisible?: boolean;

  @ApiPropertyOptional({ description: 'Reference to a widget library item' })
  @IsOptional()
  @IsString()
  widgetId?: string;
}
