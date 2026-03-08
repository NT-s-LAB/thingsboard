import { Module } from '@nestjs/common';
import { DeviceProfilesController } from './controllers/device-profiles.controller';
import { AssetProfilesController } from './controllers/asset-profiles.controller';
import { ProfilesService } from './services/profiles.service';
import { ThingsBoardIntegrationModule } from '../thingsboard-integration/thingsboard-integration.module';

@Module({
  imports: [ThingsBoardIntegrationModule],
  controllers: [DeviceProfilesController, AssetProfilesController],
  providers: [ProfilesService],
  exports: [ProfilesService],
})
export class ProfilesModule {}
