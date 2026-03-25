import { Module } from '@nestjs/common';
import {
  DeviceScadaTemplateController,
  DeviceProfileScadaDefaultController,
  DeviceScadaController,
} from './device-scada.controller';
import { DeviceScadaService } from './device-scada.service';

@Module({
  controllers: [
    DeviceScadaTemplateController,
    DeviceProfileScadaDefaultController,
    DeviceScadaController,
  ],
  providers: [DeviceScadaService],
  exports: [DeviceScadaService],
})
export class DeviceScadaModule {}
