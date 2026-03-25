import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsUUID, IsInt, IsOptional, IsString, Min } from 'class-validator';

export class PurchaseAddonDto {
  @ApiProperty({ description: 'Addon catalog ID' })
  @IsUUID()
  addonId: string;

  @ApiPropertyOptional({ example: 1, description: 'Number of units to purchase' })
  @IsOptional()
  @IsInt()
  @Min(1)
  quantity?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  note?: string;
}

export class UpdateTenantAddonDto {
  @ApiPropertyOptional({ example: 2 })
  @IsOptional()
  @IsInt()
  @Min(1)
  quantity?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  note?: string;
}
