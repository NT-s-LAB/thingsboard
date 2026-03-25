import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty } from 'class-validator';

export class SetProfileDefaultDto {
  @ApiProperty({ description: 'Device SCADA Template ID to assign as default' })
  @IsString()
  @IsNotEmpty()
  templateId: string;
}
