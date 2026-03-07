import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsBoolean, IsUUID, IsObject } from 'class-validator';

export class CreateAreaDto {
  @ApiProperty({
    description: 'Area name',
    example: 'Production Line A',
  })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiPropertyOptional({
    description: 'Area description',
    example: 'Main production line for manufacturing widgets',
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({
    description: 'Site ID this area belongs to',
    example: 'site-uuid',
  })
  @IsUUID()
  @IsNotEmpty()
  siteId: string;

  @ApiPropertyOptional({
    description: 'Additional metadata (JSON)',
    example: { temperature_threshold: 50, humidity_threshold: 80 },
  })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;

  @ApiPropertyOptional({
    description: 'Whether the area is active',
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class UpdateAreaDto {
  @ApiPropertyOptional({
    description: 'Area name',
    example: 'Production Line A - Updated',
  })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  name?: string;

  @ApiPropertyOptional({
    description: 'Area description',
    example: 'Updated description for production line',
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({
    description: 'Additional metadata (JSON)',
    example: { temperature_threshold: 55, humidity_threshold: 75 },
  })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;

  @ApiPropertyOptional({
    description: 'Whether the area is active',
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}