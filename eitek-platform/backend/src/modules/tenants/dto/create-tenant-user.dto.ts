import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { 
  IsString, 
  IsNotEmpty, 
  IsOptional, 
  IsEmail, 
  IsBoolean, 
  MinLength,
  ValidateIf,
  IsEnum,
} from 'class-validator';

export enum ActivationMethod {
  SET_PASSWORD = 'SET_PASSWORD',
  ACTIVATION_LINK = 'ACTIVATION_LINK',
}

export class CreateTenantUserDto {
  @ApiProperty({ description: 'User email address', example: 'user@company.com' })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({ description: 'First name', example: 'John' })
  @IsString()
  @IsNotEmpty()
  firstName: string;

  @ApiProperty({ description: 'Last name', example: 'Doe' })
  @IsString()
  @IsNotEmpty()
  lastName: string;

  @ApiPropertyOptional({ description: 'Phone number in E.164 format', example: '+12015550123' })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional({ description: 'User description' })
  @IsOptional()
  @IsString()
  description?: string;

  // Note: Role is always TENANT_ADMIN for tenant users created by Super Admin
  // Role field removed - enforced in service layer

  @ApiProperty({ 
    description: 'Activation method', 
    enum: ActivationMethod,
    default: ActivationMethod.ACTIVATION_LINK 
  })
  @IsEnum(ActivationMethod)
  @IsNotEmpty()
  activationMethod: ActivationMethod;

  @ApiPropertyOptional({ description: 'Password (required if activation method is SET_PASSWORD)', minLength: 6 })
  @ValidateIf((o) => o.activationMethod === ActivationMethod.SET_PASSWORD)
  @IsString()
  @IsNotEmpty()
  @MinLength(6)
  password?: string;

  @ApiPropertyOptional({ description: 'Is user active', default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
