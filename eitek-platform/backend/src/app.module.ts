import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DatabaseModule } from './database/database.module';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { TenantsModule } from './modules/tenants/tenants.module';
import { ProjectsModule } from './modules/projects/projects.module';
import { SitesModule } from './modules/sites/sites.module';
import { AreasModule } from './modules/areas/areas.module';
import { DevicesModule } from './modules/devices/devices.module';
import { DeviceTemplatesModule } from './modules/device-templates/device-templates.module';
import { ScadaViewsModule } from './modules/scada-views/scada-views.module';
import { WidgetsModule } from './modules/widgets/widgets.module';
import { ThingsBoardIntegrationModule } from './modules/thingsboard-integration/thingsboard-integration.module';
import { RealtimeModule } from './modules/realtime/realtime.module';
import { FilesModule } from './modules/files/files.module';
import appConfig from './config/app.config';
import databaseConfig from './config/database.config';
import thingsBoardConfig from './config/thingsboard.config';

@Module({
  imports: [
    // Configuration
    ConfigModule.forRoot({
      isGlobal: true,
      load: [appConfig, databaseConfig, thingsBoardConfig],
      envFilePath: ['.env.local', '.env'],
    }),

    // Database
    DatabaseModule,

    // Core modules
    AuthModule,
    UsersModule,
    TenantsModule,
    ProjectsModule,
    SitesModule,
    AreasModule,
    DevicesModule,
    DeviceTemplatesModule,
    ScadaViewsModule,
    WidgetsModule,

    // Integration
    ThingsBoardIntegrationModule,

    // Infrastructure
    RealtimeModule,
    FilesModule,
  ],
})
export class AppModule {}