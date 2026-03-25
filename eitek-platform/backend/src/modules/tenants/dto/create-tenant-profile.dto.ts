import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsBoolean,
  IsInt,
  IsArray,
  Min,
} from 'class-validator';

export class CreateTenantProfileDto {
  @ApiProperty({ description: 'Profile name', example: 'Enterprise' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiPropertyOptional({
    description: 'Profile description',
    example: 'Full-featured plan for enterprise customers',
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({
    description: 'Maximum number of users',
    example: 100,
    default: 10,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  maxUsers?: number;

  @ApiPropertyOptional({
    description: 'Maximum number of devices',
    example: 1000,
    default: 100,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  maxDevices?: number;

  @ApiPropertyOptional({
    description: 'Maximum number of projects',
    example: 10,
    default: 5,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  maxProjects?: number;

  @ApiPropertyOptional({
    description: 'Maximum number of dashboards',
    example: 20,
    default: 10,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  maxDashboards?: number;

  @ApiPropertyOptional({
    description: 'Maximum number of API calls per month (null = unlimited)',
    example: 100000,
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  maxApiCalls?: number;

  @ApiPropertyOptional({
    description: 'List of enabled features',
    example: ['SCADA Editor', 'Advanced Analytics', 'API Access'],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  features?: string[];

  @ApiPropertyOptional({
    description: 'Is this the default profile for new tenants',
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;

  @ApiPropertyOptional({
    description: 'Can tenants with this profile purchase add-ons',
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  addonEligible?: boolean;

  @ApiPropertyOptional({
    description: 'Is profile active',
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
