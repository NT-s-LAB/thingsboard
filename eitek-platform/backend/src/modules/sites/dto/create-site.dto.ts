import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsBoolean, IsUUID, IsObject } from 'class-validator';

export class CreateSiteDto {
  @ApiProperty({ description: 'Site name', example: 'Factory Site Alpha' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiPropertyOptional({ description: 'Site description' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: 'Physical address' })
  @IsOptional()
  @IsString()
  address?: string;

  @ApiPropertyOptional({ description: 'Coordinates (JSON)', example: { lat: 10.7769, lng: 106.7009 } })
  @IsOptional()
  @IsObject()
  coordinates?: Record<string, any>;

  @ApiPropertyOptional({ description: 'Additional metadata (JSON)' })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;

  @ApiProperty({ description: 'Project ID' })
  @IsUUID()
  @IsNotEmpty()
  projectId: string;

  @ApiPropertyOptional({ description: 'Is site active', default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
