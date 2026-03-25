import { apiClient } from '@/shared/services/api';
import type { AddonCatalog, TenantAddon, TenantQuotaInfo } from '@/shared/types';

// ==================== ADDON CATALOG (SUPER_ADMIN) ====================

class AddonCatalogService {
  private readonly baseUrl = '/addon-catalog';

  async getAll(params: { page?: number; limit?: number; search?: string } = {}) {
    const query = new URLSearchParams();
    if (params.page) query.set('page', params.page.toString());
    if (params.limit) query.set('limit', params.limit.toString());
    if (params.search) query.set('search', params.search);
    const qs = query.toString();
    return apiClient.get<{ data: AddonCatalog[]; pagination: any }>(
      qs ? `${this.baseUrl}?${qs}` : this.baseUrl,
    );
  }

  async getActive(): Promise<AddonCatalog[]> {
    return apiClient.get<AddonCatalog[]>(`${this.baseUrl}/active`);
  }

  async getById(id: string): Promise<AddonCatalog> {
    return apiClient.get<AddonCatalog>(`${this.baseUrl}/${id}`);
  }

  async create(data: Partial<AddonCatalog>): Promise<AddonCatalog> {
    return apiClient.post<AddonCatalog>(this.baseUrl, data);
  }

  async update(id: string, data: Partial<AddonCatalog>): Promise<AddonCatalog> {
    return apiClient.patch<AddonCatalog>(`${this.baseUrl}/${id}`, data);
  }

  async delete(id: string): Promise<void> {
    return apiClient.delete(`${this.baseUrl}/${id}`);
  }
}

// ==================== TENANT ADDONS ====================

class TenantAddonApiService {
  private readonly baseUrl = '/tenant-addons';

  // ── Current tenant (TENANT_ADMIN) ──

  async getMyQuota(): Promise<TenantQuotaInfo> {
    return apiClient.get<TenantQuotaInfo>(`${this.baseUrl}/my/quota`);
  }

  async getMyAddons(): Promise<TenantAddon[]> {
    return apiClient.get<TenantAddon[]>(`${this.baseUrl}/my`);
  }

  async purchase(addonId: string, quantity = 1, note?: string): Promise<TenantAddon> {
    return apiClient.post<TenantAddon>(`${this.baseUrl}/my/purchase`, {
      addonId,
      quantity,
      note,
    });
  }

  async updateAddon(addonId: string, data: { quantity?: number; note?: string }): Promise<TenantAddon> {
    return apiClient.patch<TenantAddon>(`${this.baseUrl}/my/${addonId}`, data);
  }

  async removeAddon(addonId: string): Promise<void> {
    return apiClient.delete(`${this.baseUrl}/my/${addonId}`);
  }

  // ── Specific tenant (SUPER_ADMIN) ──

  async getTenantQuota(tenantId: string): Promise<TenantQuotaInfo> {
    return apiClient.get<TenantQuotaInfo>(`${this.baseUrl}/tenant/${tenantId}/quota`);
  }

  async getTenantAddons(tenantId: string): Promise<TenantAddon[]> {
    return apiClient.get<TenantAddon[]>(`${this.baseUrl}/tenant/${tenantId}`);
  }

  async purchaseForTenant(tenantId: string, addonId: string, quantity = 1): Promise<TenantAddon> {
    return apiClient.post<TenantAddon>(`${this.baseUrl}/tenant/${tenantId}/purchase`, {
      addonId,
      quantity,
    });
  }
}

export const addonCatalogService = new AddonCatalogService();
export const tenantAddonService = new TenantAddonApiService();
