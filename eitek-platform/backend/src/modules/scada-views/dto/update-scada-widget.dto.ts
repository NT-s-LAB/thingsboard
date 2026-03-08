import { PartialType } from '@nestjs/swagger';
import { CreateScadaWidgetDto } from './create-scada-widget.dto';

export class UpdateScadaWidgetDto extends PartialType(CreateScadaWidgetDto) {}
