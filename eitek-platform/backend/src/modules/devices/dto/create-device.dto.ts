import {
  IsString,
  IsOptional,
  IsUUID,
  IsBoolean,
  IsObject,
  IsNotEmpty,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateDeviceDto {
  @ApiProperty({ description: 'Device name' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiPropertyOptional({ description: 'Device description' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ description: 'Area ID where device belongs' })
  @IsUUID()
  areaId: string;

  @ApiProperty({ description: 'Device type ID' })
  @IsUUID()
  deviceTypeId: string;

  @ApiPropertyOptional({ description: 'Device serial number' })
  @IsOptional()
  @IsString()
  serialNumber?: string;

  @ApiPropertyOptional({ description: 'Device model' })
  @IsOptional()
  @IsString()
  model?: string;

  @ApiPropertyOptional({ description: 'Device firmware version' })
  @IsOptional()
  @IsString()
  firmware?: string;

  @ApiPropertyOptional({ description: 'Device metadata' })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;

  @ApiPropertyOptional({ description: 'Device active status' })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}