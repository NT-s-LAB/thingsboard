import { Module } from '@nestjs/common';
import { TenantsController } from './tenants.controller';
import { TenantsService } from './tenants.service';
import { TenantUsersController } from './tenant-users.controller';
import { TenantUsersService } from './tenant-users.service';
import { TenantProfilesController } from './tenant-profiles.controller';
import { TenantProfilesService } from './tenant-profiles.service';

@Module({
  controllers: [TenantsController, TenantUsersController, TenantProfilesController],
  providers: [TenantsService, TenantUsersService, TenantProfilesService],
  exports: [TenantsService, TenantUsersService, TenantProfilesService],
})
export class TenantsModule {}
