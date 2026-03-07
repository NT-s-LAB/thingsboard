import { Module } from '@nestjs/common';
import { ScadaViewsController } from './scada-views.controller';
import { ScadaViewsService } from './scada-views.service';

@Module({
  controllers: [ScadaViewsController],
  providers: [ScadaViewsService],
  exports: [ScadaViewsService],
})
export class ScadaViewsModule {}
