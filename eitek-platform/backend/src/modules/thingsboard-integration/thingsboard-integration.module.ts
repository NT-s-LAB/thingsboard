import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ThingsBoardClientService } from './services/thingsboard-client.service';
import { ThingsBoardDeviceApiService } from './services/device-api.service';
import { ThingsBoardTelemetryApiService } from './services/telemetry-api.service';
import { ThingsBoardRpcApiService } from './services/rpc-api.service';
import { ThingsBoardWebSocketService } from './services/thingsboard-websocket.service';
import { DeviceMapper } from './mappers/device.mapper';

@Module({
  imports: [
    HttpModule.register({
      timeout: 30000,
      maxRedirects: 5,
    }),
  ],
  providers: [
    ThingsBoardClientService,
    ThingsBoardDeviceApiService,
    ThingsBoardTelemetryApiService,
    ThingsBoardRpcApiService,
    ThingsBoardWebSocketService,
    DeviceMapper,
  ],
  exports: [
    ThingsBoardClientService,
    ThingsBoardDeviceApiService,
    ThingsBoardTelemetryApiService,
    ThingsBoardRpcApiService,
    ThingsBoardWebSocketService,
    DeviceMapper,
  ],
})
export class ThingsBoardIntegrationModule {}