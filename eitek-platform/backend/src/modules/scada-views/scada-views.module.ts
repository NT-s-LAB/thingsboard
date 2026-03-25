import { Module } from '@nestjs/common';
import { ScadaViewsController } from './scada-views.controller';
import { ScadaViewsService } from './scada-views.service';
import { AddonsModule } from '../addons/addons.module';

@Module({
  imports: [AddonsModule],
  controllers: [ScadaViewsController],
  providers: [ScadaViewsService],
  exports: [ScadaViewsService],
})
export class ScadaViewsModule {}
