import { Module } from '@nestjs/common';
import { DevicesController } from './controllers/devices.controller';
import { DeviceTypesController } from './controllers/device-types.controller';
import { DevicesService } from './services/devices.service';
import { DeviceSubscriptionManager } from './services/device-subscription.manager';
import { ThingsBoardIntegrationModule } from '../thingsboard-integration/thingsboard-integration.module';
import { RealtimeModule } from '../realtime/realtime.module';
import { AddonsModule } from '../addons/addons.module';

@Module({
  imports: [ThingsBoardIntegrationModule, RealtimeModule, AddonsModule],
  controllers: [DevicesController, DeviceTypesController],
  providers: [DevicesService, DeviceSubscriptionManager],
  exports: [DevicesService, DeviceSubscriptionManager],
})
export class DevicesModule {}