import { ApiProperty } from '@nestjs/swagger';
import { IsObject, IsNotEmpty } from 'class-validator';

export class SaveDeviceOverrideDto {
  @ApiProperty({
    description: 'Per-device overrides applied on top of profile default template',
    example: {
      widgets: {
        'widget-1': { properties: { label: 'Custom Label' } },
        'widget-2': { visible: false },
      },
    },
  })
  @IsObject()
  @IsNotEmpty()
  overrides: Record<string, any>;
}
