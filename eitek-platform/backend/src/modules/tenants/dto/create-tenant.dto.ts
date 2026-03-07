import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsBoolean, IsObject } from 'class-validator';

export class CreateTenantDto {
  @ApiProperty({ description: 'Tenant name', example: 'EITEK Corporation' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ description: 'Tenant code (unique)', example: 'EITEK' })
  @IsString()
  @IsNotEmpty()
  code: string;

  @ApiPropertyOptional({ description: 'Tenant description' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: 'Tenant settings (JSON)' })
  @IsOptional()
  @IsObject()
  settings?: Record<string, any>;

  @ApiPropertyOptional({ description: 'ThingsBoard tenant ID' })
  @IsOptional()
  @IsString()
  tbTenantId?: string;

  @ApiPropertyOptional({ description: 'ThingsBoard settings (JSON)' })
  @IsOptional()
  @IsObject()
  tbSettings?: Record<string, any>;

  @ApiPropertyOptional({ description: 'Is tenant active', default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
