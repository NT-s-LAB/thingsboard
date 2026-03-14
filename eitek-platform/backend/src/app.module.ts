import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { DatabaseModule } from './database/database.module';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { TenantsModule } from './modules/tenants/tenants.module';
import { ProjectsModule } from './modules/projects/projects.module';
import { SitesModule } from './modules/sites/sites.module';
import { AreasModule } from './modules/areas/areas.module';
import { DevicesModule } from './modules/devices/devices.module';
import { DeviceTemplatesModule } from './modules/device-templates/device-templates.module';
import { ProfilesModule } from './modules/profiles/profiles.module';
import { ScadaViewsModule } from './modules/scada-views/scada-views.module';
import { WidgetsModule } from './modules/widgets/widgets.module';
import { WidgetCategoriesModule } from './modules/widget-categories/widget-categories.module';
import { SymbolsModule } from './modules/symbols/symbols.module';
import { ThingsBoardIntegrationModule } from './modules/thingsboard-integration/thingsboard-integration.module';
import { RealtimeModule } from './modules/realtime/realtime.module';
import { FilesModule } from './modules/files/files.module';
import { ImageLibraryModule } from './modules/image-library/image-library.module';
import { AdminModule } from './modules/admin/admin.module';
import { AdminSettingsModule } from './modules/admin-settings/admin-settings.module';
import { SettingsModule } from './modules/settings/settings.module';
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

    // Scheduler
    ScheduleModule.forRoot(),

    // Event Emitter (for internal event-driven communication)
    EventEmitterModule.forRoot(),

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
    ProfilesModule,
    ScadaViewsModule,
    WidgetsModule,
    WidgetCategoriesModule,
    SymbolsModule,

    // Integration
    ThingsBoardIntegrationModule,

    // Infrastructure
    RealtimeModule,
    FilesModule,
    ImageLibraryModule,
    SettingsModule,

    // Admin
    AdminModule,
    AdminSettingsModule,
  ],
})
export class AppModule {}