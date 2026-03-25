import { Module } from '@nestjs/common';
import { AddonCatalogController } from './addon-catalog.controller';
import { AddonCatalogService } from './addon-catalog.service';
import { TenantAddonController } from './tenant-addon.controller';
import { TenantAddonService } from './tenant-addon.service';

@Module({
  controllers: [AddonCatalogController, TenantAddonController],
  providers: [AddonCatalogService, TenantAddonService],
  exports: [AddonCatalogService, TenantAddonService],
})
export class AddonsModule {}
