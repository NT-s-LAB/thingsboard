import { PartialType } from '@nestjs/swagger';
import { CreateWidgetCategoryDto } from './create-widget-category.dto';

export class UpdateWidgetCategoryDto extends PartialType(CreateWidgetCategoryDto) {}
