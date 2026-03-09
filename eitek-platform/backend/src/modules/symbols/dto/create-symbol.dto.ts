import { IsString, IsOptional, IsArray, IsBoolean, IsEnum } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateSymbolDto {
  @ApiProperty({ description: 'Symbol name' })
  @IsString()
  name: string;

  @ApiPropertyOptional({ description: 'Description' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ description: 'SVG content' })
  @IsString()
  svgContent: string;

  @ApiPropertyOptional({ description: 'Category' })
  @IsOptional()
  @IsString()
  category?: string;

  @ApiPropertyOptional({ description: 'Tags for searching', type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];
}
