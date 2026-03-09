import { Module } from '@nestjs/common';
import { WidgetCategoriesController } from './widget-categories.controller';
import { WidgetCategoriesService } from './widget-categories.service';

@Module({
  controllers: [WidgetCategoriesController],
  providers: [WidgetCategoriesService],
  exports: [WidgetCategoriesService],
})
export class WidgetCategoriesModule {}
