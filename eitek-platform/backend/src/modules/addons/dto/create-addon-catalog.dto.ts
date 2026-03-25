import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsBoolean,
  IsInt,
  IsNumber,
  IsEnum,
  Min,
} from 'class-validator';
import { AddonType, AddonResourceType } from '@prisma/client';

export class CreateAddonCatalogDto {
  @ApiProperty({ example: 'EXTRA_DEVICES_50' })
  @IsString()
  @IsNotEmpty()
  code: string;

  @ApiProperty({ example: 'Extra 50 Devices' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiPropertyOptional({ example: 'Thêm 50 thiết bị cho tenant' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ enum: AddonType, example: 'QUOTA' })
  @IsEnum(AddonType)
  type: AddonType;

  @ApiPropertyOptional({ enum: AddonResourceType, example: 'DEVICES' })
  @IsOptional()
  @IsEnum(AddonResourceType)
  resourceType?: AddonResourceType;

  @ApiPropertyOptional({ example: 50, description: 'Resources per unit (for QUOTA type)' })
  @IsOptional()
  @IsInt()
  @Min(1)
  quantityPerUnit?: number;

  @ApiPropertyOptional({ example: 'scada_editor', description: 'Feature flag key (for FEATURE type)' })
  @IsOptional()
  @IsString()
  featureFlag?: string;

  @ApiPropertyOptional({ example: 30, description: 'Monthly price in USD' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  priceMonthly?: number;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({ default: 0 })
  @IsOptional()
  @IsInt()
  sortOrder?: number;
}
