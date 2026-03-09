import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { ThingsBoardClientService } from '../../thingsboard-integration/services/thingsboard-client.service';
import { TbDeviceProfile, TbAssetProfile, TbPageData } from '../../thingsboard-integration/interfaces/thingsboard-api.interface';
import { CreateDeviceProfileDto, UpdateDeviceProfileDto } from '../dto/device-profile.dto';
import { CreateAssetProfileDto, UpdateAssetProfileDto } from '../dto/asset-profile.dto';

@Injectable()
export class ProfilesService {
  private readonly logger = new Logger(ProfilesService.name);

  constructor(private readonly tbClient: ThingsBoardClientService) {}

  // ================================
  // Device Profiles
  // ================================

  async getDeviceProfiles(
    pageSize = 10,
    page = 0,
    textSearch?: string,
    sortProperty = 'name',
    sortOrder = 'ASC',
  ): Promise<TbPageData<TbDeviceProfile>> {
    try {
      return await this.tbClient.getDeviceProfiles(pageSize, page, textSearch, sortProperty, sortOrder);
    } catch (error) {
      this.logger.error(`Failed to get device profiles: ${error.message}`);
      throw new BadRequestException(`Failed to get device profiles from ThingsBoard: ${error.message}`);
    }
  }

  async getDeviceProfile(id: string): Promise<TbDeviceProfile> {
    try {
      return await this.tbClient.getDeviceProfile(id);
    } catch (error) {
      if (error.response?.status === 404) {
        throw new NotFoundException(`Device profile not found: ${id}`);
      }
      throw new BadRequestException(`Failed to get device profile: ${error.message}`);
    }
  }

  async createDeviceProfile(dto: CreateDeviceProfileDto): Promise<TbDeviceProfile> {
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
      this.logger.log(`Device profile created: ${result.id?.id}`);
      return result;
    } catch (error) {
      this.logger.error(`Failed to create device profile: ${error.message}`);
      throw new BadRequestException(`Failed to create device profile: ${error.message}`);
    }
  }

  async updateDeviceProfile(dto: UpdateDeviceProfileDto): Promise<TbDeviceProfile> {
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

  async deleteDeviceProfile(id: string): Promise<void> {
    try {
      await this.tbClient.deleteDeviceProfile(id);
      this.logger.log(`Device profile deleted: ${id}`);
    } catch (error) {
      if (error.response?.status === 404) {
        throw new NotFoundException(`Device profile not found: ${id}`);
      }
      this.logger.error(`Failed to delete device profile: ${error.message}`);
      throw new BadRequestException(`Failed to delete device profile: ${error.message}`);
    }
  }

  // ================================
  // Asset Profiles
  // ================================

  async getAssetProfiles(
    pageSize = 10,
    page = 0,
    textSearch?: string,
    sortProperty = 'name',
    sortOrder = 'ASC',
  ): Promise<TbPageData<TbAssetProfile>> {
    try {
      return await this.tbClient.getAssetProfiles(pageSize, page, textSearch, sortProperty, sortOrder);
    } catch (error) {
      this.logger.error(`Failed to get asset profiles: ${error.message}`);
      throw new BadRequestException(`Failed to get asset profiles from ThingsBoard: ${error.message}`);
    }
  }

  async getAssetProfile(id: string): Promise<TbAssetProfile> {
    try {
      return await this.tbClient.getAssetProfile(id);
    } catch (error) {
      if (error.response?.status === 404) {
        throw new NotFoundException(`Asset profile not found: ${id}`);
      }
      throw new BadRequestException(`Failed to get asset profile: ${error.message}`);
    }
  }

  async createAssetProfile(dto: CreateAssetProfileDto): Promise<TbAssetProfile> {
    try {
      const profile: Partial<TbAssetProfile> = {
        name: dto.name,
        description: dto.description,
      };

      const result = await this.tbClient.saveAssetProfile(profile);
      this.logger.log(`Asset profile created: ${result.id?.id}`);
      return result;
    } catch (error) {
      this.logger.error(`Failed to create asset profile: ${error.message}`);
      throw new BadRequestException(`Failed to create asset profile: ${error.message}`);
    }
  }

  async updateAssetProfile(dto: UpdateAssetProfileDto): Promise<TbAssetProfile> {
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

  async deleteAssetProfile(id: string): Promise<void> {
    try {
      await this.tbClient.deleteAssetProfile(id);
      this.logger.log(`Asset profile deleted: ${id}`);
    } catch (error) {
      if (error.response?.status === 404) {
        throw new NotFoundException(`Asset profile not found: ${id}`);
      }
      this.logger.error(`Failed to delete asset profile: ${error.message}`);
      throw new BadRequestException(`Failed to delete asset profile: ${error.message}`);
    }
  }
}
