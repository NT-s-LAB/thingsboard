import {
  IsString,
  IsOptional,
  IsNotEmpty,
  IsBoolean,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateAssetProfileDto {
  @ApiProperty({ description: 'Asset profile name' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiPropertyOptional({ description: 'Asset profile description' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: 'Is default profile' })
  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;
}

export class UpdateAssetProfileDto {
  @ApiProperty({ description: 'ThingsBoard asset profile ID' })
  @IsString()
  @IsNotEmpty()
  id: string;

  @ApiPropertyOptional({ description: 'Asset profile name' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ description: 'Asset profile description' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: 'Is default profile' })
  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;
}
