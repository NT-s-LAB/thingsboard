import { Module } from '@nestjs/common';
import { DevicesController } from './controllers/devices.controller';
import { DevicesService } from './services/devices.service';
import { DeviceSyncService } from './services/device-sync.service';
import { ThingsBoardIntegrationModule } from '../thingsboard-integration/thingsboard-integration.module';

@Module({
  imports: [ThingsBoardIntegrationModule],
  controllers: [DevicesController],
  providers: [DevicesService, DeviceSyncService],
  exports: [DevicesService],
})
export class DevicesModule {}