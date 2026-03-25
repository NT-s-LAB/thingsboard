import { Injectable, Logger, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { ThingsBoardClientService } from '../../thingsboard-integration/services/thingsboard-client.service';
import { TbDeviceProfile, TbAssetProfile, TbPageData } from '../../thingsboard-integration/interfaces/thingsboard-api.interface';
import { CreateDeviceProfileDto, UpdateDeviceProfileDto } from '../dto/device-profile.dto';
import { CreateAssetProfileDto, UpdateAssetProfileDto } from '../dto/asset-profile.dto';
import { PrismaService } from '../../../database/prisma.service';

@Injectable()
export class ProfilesService {
  private readonly logger = new Logger(ProfilesService.name);

  constructor(
    private readonly tbClient: ThingsBoardClientService,
    private readonly prisma: PrismaService,
  ) {}

  // ================================
  // Device Profiles (tenant-isolated)
  // ================================

  async getDeviceProfiles(
    tenantId: string,
    pageSize = 10,
    page = 0,
    textSearch?: string,
    sortProperty = 'name',
    sortOrder = 'ASC',
  ): Promise<TbPageData<TbDeviceProfile>> {
    try {
      // Get TB profile IDs that belong to this tenant
      const tenantProfiles = await this.prisma.tenantDeviceProfile.findMany({
        where: { tenantId },
        select: { tbProfileId: true },
      });
      const allowedIds = new Set(tenantProfiles.map((tp) => tp.tbProfileId));

      // If tenant has no profiles at all, return empty page
      if (allowedIds.size === 0) {
        return { data: [], totalPages: 0, totalElements: 0, hasNext: false };
      }

      // Fetch all from TB (use large page to get them all for filtering)
      const allProfiles = await this.tbClient.getDeviceProfiles(1000, 0, textSearch, sortProperty, sortOrder);

      // Filter to only this tenant's profiles
      const filtered = allProfiles.data.filter((p) => allowedIds.has(p.id?.id));

      // Apply manual pagination
      const start = page * pageSize;
      const paged = filtered.slice(start, start + pageSize);

      return {
        data: paged,
        totalElements: filtered.length,
        totalPages: Math.ceil(filtered.length / pageSize),
        hasNext: start + pageSize < filtered.length,
      };
    } catch (error) {
      this.logger.error(`Failed to get device profiles: ${error.message}`);
      throw new BadRequestException(`Failed to get device profiles from ThingsBoard: ${error.message}`);
    }
  }

  async getDeviceProfile(tenantId: string, id: string): Promise<TbDeviceProfile> {
    await this.assertDeviceProfileOwnership(tenantId, id);
    try {
      return await this.tbClient.getDeviceProfile(id);
    } catch (error) {
      if (error.response?.status === 404) {
        throw new NotFoundException(`Device profile not found: ${id}`);
      }
      throw new BadRequestException(`Failed to get device profile: ${error.message}`);
    }
  }

  async createDeviceProfile(tenantId: string, dto: CreateDeviceProfileDto): Promise<TbDeviceProfile> {
    try {
      const profileData = dto.profileData || {
        configuration: { type: 'DEFAULT' },
        transportConfiguration: { type: dto.transportType || 'DEFAULT' },
        provisionConfiguration: { type: dto.provisionType || 'DISABLED' },
        alarms: [],
      };

      const profile: Partial<TbDeviceProfile> = {
        name: dto.name,
        description: dto.description,
        image: dto.image,
        type: 'DEFAULT',
        transportType: dto.transportType || 'DEFAULT',
        provisionType: dto.provisionType || 'DISABLED',
        profileData,
      };

      const result = await this.tbClient.saveDeviceProfile(profile);

      // Record ownership in local DB
      await this.prisma.tenantDeviceProfile.create({
        data: { tbProfileId: result.id.id, tenantId },
      });

      this.logger.log(`Device profile created: ${result.id?.id} for tenant ${tenantId}`);
      return result;
    } catch (error) {
      this.logger.error(`Failed to create device profile: ${error.message}`);
      throw new BadRequestException(`Failed to create device profile: ${error.message}`);
    }
  }

  async updateDeviceProfile(tenantId: string, dto: UpdateDeviceProfileDto): Promise<TbDeviceProfile> {
    await this.assertDeviceProfileOwnership(tenantId, dto.id);
    try {
      // Fetch existing profile first
      const existing = await this.tbClient.getDeviceProfile(dto.id);

      const updated: Partial<TbDeviceProfile> = {
        ...existing,
        name: dto.name ?? existing.name,
        description: dto.description ?? existing.description,
        image: dto.image !== undefined ? dto.image : existing.image,
        transportType: dto.transportType ?? existing.transportType,
        provisionType: dto.provisionType ?? existing.provisionType,
        profileData: dto.profileData ?? existing.profileData,
      };

      const result = await this.tbClient.saveDeviceProfile(updated);
      this.logger.log(`Device profile updated: ${dto.id}`);
      return result;
    } catch (error) {
      if (error.response?.status === 404) {
        throw new NotFoundException(`Device profile not found: ${dto.id}`);
      }
      this.logger.error(`Failed to update device profile: ${error.message}`);
      throw new BadRequestException(`Failed to update device profile: ${error.message}`);
    }
  }

  async deleteDeviceProfile(tenantId: string, id: string): Promise<void> {
    await this.assertDeviceProfileOwnership(tenantId, id);
    try {
      await this.tbClient.deleteDeviceProfile(id);

      // Remove ownership record
      await this.prisma.tenantDeviceProfile.deleteMany({
        where: { tbProfileId: id, tenantId },
      });

      this.logger.log(`Device profile deleted: ${id}`);
    } catch (error) {
      if (error.response?.status === 404) {
        throw new NotFoundException(`Device profile not found: ${id}`);
      }
      this.logger.error(`Failed to delete device profile: ${error.message}`);
      throw new BadRequestException(`Failed to delete device profile: ${error.message}`);
    }
  }

  /** Throws ForbiddenException if the device profile doesn't belong to the tenant */
  private async assertDeviceProfileOwnership(tenantId: string, tbProfileId: string): Promise<void> {
    const record = await this.prisma.tenantDeviceProfile.findUnique({
      where: { tenantId_tbProfileId: { tenantId, tbProfileId } },
    });
    if (!record) {
      throw new ForbiddenException('Device profile does not belong to your tenant');
    }
  }

  // ================================
  // Asset Profiles (tenant-isolated)
  // ================================

  async getAssetProfiles(
    tenantId: string,
    pageSize = 10,
    page = 0,
    textSearch?: string,
    sortProperty = 'name',
    sortOrder = 'ASC',
  ): Promise<TbPageData<TbAssetProfile>> {
    try {
      const tenantProfiles = await this.prisma.tenantAssetProfile.findMany({
        where: { tenantId },
        select: { tbProfileId: true },
      });
      const allowedIds = new Set(tenantProfiles.map((tp) => tp.tbProfileId));

      if (allowedIds.size === 0) {
        return { data: [], totalPages: 0, totalElements: 0, hasNext: false };
      }

      const allProfiles = await this.tbClient.getAssetProfiles(1000, 0, textSearch, sortProperty, sortOrder);
      const filtered = allProfiles.data.filter((p) => allowedIds.has(p.id?.id));

      const start = page * pageSize;
      const paged = filtered.slice(start, start + pageSize);

      return {
        data: paged,
        totalElements: filtered.length,
        totalPages: Math.ceil(filtered.length / pageSize),
        hasNext: start + pageSize < filtered.length,
      };
    } catch (error) {
      this.logger.error(`Failed to get asset profiles: ${error.message}`);
      throw new BadRequestException(`Failed to get asset profiles from ThingsBoard: ${error.message}`);
    }
  }

  async getAssetProfile(tenantId: string, id: string): Promise<TbAssetProfile> {
    await this.assertAssetProfileOwnership(tenantId, id);
    try {
      return await this.tbClient.getAssetProfile(id);
    } catch (error) {
      if (error.response?.status === 404) {
        throw new NotFoundException(`Asset profile not found: ${id}`);
      }
      throw new BadRequestException(`Failed to get asset profile: ${error.message}`);
    }
  }

  async createAssetProfile(tenantId: string, dto: CreateAssetProfileDto): Promise<TbAssetProfile> {
    try {
      const profile: Partial<TbAssetProfile> = {
        name: dto.name,
        description: dto.description,
      };

      const result = await this.tbClient.saveAssetProfile(profile);

      await this.prisma.tenantAssetProfile.create({
        data: { tbProfileId: result.id.id, tenantId },
      });

      this.logger.log(`Asset profile created: ${result.id?.id} for tenant ${tenantId}`);
      return result;
    } catch (error) {
      this.logger.error(`Failed to create asset profile: ${error.message}`);
      throw new BadRequestException(`Failed to create asset profile: ${error.message}`);
    }
  }

  async updateAssetProfile(tenantId: string, dto: UpdateAssetProfileDto): Promise<TbAssetProfile> {
    await this.assertAssetProfileOwnership(tenantId, dto.id);
    try {
      const existing = await this.tbClient.getAssetProfile(dto.id);

      const updated: Partial<TbAssetProfile> = {
        ...existing,
        name: dto.name ?? existing.name,
        description: dto.description ?? existing.description,
      };

      const result = await this.tbClient.saveAssetProfile(updated);
      this.logger.log(`Asset profile updated: ${dto.id}`);
      return result;
    } catch (error) {
      if (error.response?.status === 404) {
        throw new NotFoundException(`Asset profile not found: ${dto.id}`);
      }
      this.logger.error(`Failed to update asset profile: ${error.message}`);
      throw new BadRequestException(`Failed to update asset profile: ${error.message}`);
    }
  }

  async deleteAssetProfile(tenantId: string, id: string): Promise<void> {
    await this.assertAssetProfileOwnership(tenantId, id);
    try {
      await this.tbClient.deleteAssetProfile(id);

      await this.prisma.tenantAssetProfile.deleteMany({
        where: { tbProfileId: id, tenantId },
      });

      this.logger.log(`Asset profile deleted: ${id}`);
    } catch (error) {
      if (error.response?.status === 404) {
        throw new NotFoundException(`Asset profile not found: ${id}`);
      }
      this.logger.error(`Failed to delete asset profile: ${error.message}`);
      throw new BadRequestException(`Failed to delete asset profile: ${error.message}`);
    }
  }

  /** Throws ForbiddenException if the asset profile doesn't belong to the tenant */
  private async assertAssetProfileOwnership(tenantId: string, tbProfileId: string): Promise<void> {
    const record = await this.prisma.tenantAssetProfile.findUnique({
      where: { tenantId_tbProfileId: { tenantId, tbProfileId } },
    });
    if (!record) {
      throw new ForbiddenException('Asset profile does not belong to your tenant');
    }
  }
}
