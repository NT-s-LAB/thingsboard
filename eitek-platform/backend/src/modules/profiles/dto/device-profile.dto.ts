import {
  IsString,
  IsOptional,
  IsNotEmpty,
  IsObject,
  IsBoolean,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateDeviceProfileDto {
  @ApiProperty({ description: 'Device profile name' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiPropertyOptional({ description: 'Device profile description' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: 'Transport type', default: 'DEFAULT' })
  @IsOptional()
  @IsString()
  transportType?: string;

  @ApiPropertyOptional({ description: 'Provision type', default: 'DISABLED' })
  @IsOptional()
  @IsString()
  provisionType?: string;

  @ApiPropertyOptional({ description: 'Profile data (configuration, transport, provision, alarms)' })
  @IsOptional()
  @IsObject()
  profileData?: {
    configuration?: any;
    transportConfiguration?: any;
    provisionConfiguration?: any;
    alarms?: any[];
  };

  @ApiPropertyOptional({ description: 'Profile icon/image URL' })
  @IsOptional()
  @IsString()
  image?: string;

  @ApiPropertyOptional({ description: 'Is default profile' })
  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;
}

export class UpdateDeviceProfileDto {
  @ApiProperty({ description: 'ThingsBoard device profile ID' })
  @IsString()
  @IsNotEmpty()
  id: string;

  @ApiPropertyOptional({ description: 'Device profile name' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ description: 'Device profile description' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: 'Transport type' })
  @IsOptional()
  @IsString()
  transportType?: string;

  @ApiPropertyOptional({ description: 'Provision type' })
  @IsOptional()
  @IsString()
  provisionType?: string;

  @ApiPropertyOptional({ description: 'Profile data' })
  @IsOptional()
  @IsObject()
  profileData?: {
    configuration?: any;
    transportConfiguration?: any;
    provisionConfiguration?: any;
    alarms?: any[];
  };

  @ApiPropertyOptional({ description: 'Profile icon/image URL' })
  @IsOptional()
  @IsString()
  image?: string;

  @ApiPropertyOptional({ description: 'Is default profile' })
  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;
}
