import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsBoolean, IsUUID, IsObject } from 'class-validator';

export class CreateDeviceTemplateDto {
  @ApiProperty({ description: 'Template name', example: 'Temperature Sensor Template' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiPropertyOptional({ description: 'Template description' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ description: 'Template configuration (JSON)', example: { telemetryKeys: ['temperature', 'humidity'] } })
  @IsObject()
  @IsNotEmpty()
  template: Record<string, any>;

  @ApiPropertyOptional({ description: 'Preview image URL' })
  @IsOptional()
  @IsString()
  preview?: string;

  @ApiPropertyOptional({ description: 'Template version', default: '1.0.0' })
  @IsOptional()
  @IsString()
  version?: string;

  @ApiProperty({ description: 'Device type ID' })
  @IsUUID()
  @IsNotEmpty()
  deviceTypeId: string;

  @ApiPropertyOptional({ description: 'Is template active', default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
