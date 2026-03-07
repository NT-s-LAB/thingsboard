import { PartialType, OmitType } from '@nestjs/swagger';
import { CreateDeviceTemplateDto } from './create-device-template.dto';

export class UpdateDeviceTemplateDto extends PartialType(
  OmitType(CreateDeviceTemplateDto, ['deviceTypeId'] as const),
) {}
