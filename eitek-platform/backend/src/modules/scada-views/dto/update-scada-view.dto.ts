import { PartialType, OmitType } from '@nestjs/swagger';
import { CreateScadaViewDto } from './create-scada-view.dto';

export class UpdateScadaViewDto extends PartialType(
  OmitType(CreateScadaViewDto, ['areaId', 'projectId'] as const),
) {}
