import { IsString, IsOptional, IsBoolean, IsIn } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateUserSettingsDto {
  // Appearance
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @IsIn(['light', 'dark', 'auto'])
  theme?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @IsIn(['vi', 'en', 'zh'])
  language?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  timezone?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @IsIn(['DD/MM/YYYY', 'MM/DD/YYYY', 'YYYY-MM-DD'])
  dateFormat?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  compactMode?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  showGridLines?: boolean;

  // Notifications
  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  emailNotifications?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  deviceAlerts?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  systemUpdates?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  projectActivity?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  weeklyReports?: boolean;

  // Advanced
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  defaultProjectId?: string;
}
