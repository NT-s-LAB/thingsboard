import { Module } from '@nestjs/common';
import { DevicesController } from './controllers/devices.controller';
import { DeviceTypesController } from './controllers/device-types.controller';
import { DevicesService } from './services/devices.service';
import { DeviceSyncService } from './services/device-sync.service';
import { ThingsBoardIntegrationModule } from '../thingsboard-integration/thingsboard-integration.module';
import { RealtimeModule } from '../realtime/realtime.module';

@Module({
  imports: [ThingsBoardIntegrationModule, RealtimeModule],
  controllers: [DevicesController, DeviceTypesController],
  providers: [DevicesService, DeviceSyncService],
  exports: [DevicesService],
})
export class DevicesModule {}