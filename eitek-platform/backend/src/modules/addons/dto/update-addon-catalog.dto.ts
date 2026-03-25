import { PartialType } from '@nestjs/swagger';
import { CreateAddonCatalogDto } from './create-addon-catalog.dto';

export class UpdateAddonCatalogDto extends PartialType(CreateAddonCatalogDto) {}
