import { apiClient } from '@/shared/services/api';
import type {
  Site,
  SiteCreateRequest,
  SiteUpdateRequest,
  SiteListParams,
  SiteListResponse,
} from '../types/site';

class SiteService {
  /**
   * Get all sites with pagination and filtering
   */
  async getSites(params: SiteListParams = {}): Promise<SiteListResponse> {
    const queryParams = new URLSearchParams();
    
    if (params.page !== undefined) queryParams.append('page', params.page.toString());
    if (params.pageSize !== undefined) queryParams.append('limit', params.pageSize.toString());
    if (params.search) queryParams.append('search', params.search);
    if (params.projectId) queryParams.append('projectId', params.projectId);
    if (params.sortBy) queryParams.append('sortBy', params.sortBy);
    if (params.sortOrder) queryParams.append('sortOrder', params.sortOrder.toLowerCase());

    const response = await apiClient.get<SiteListResponse>(`/sites?${queryParams.toString()}`);
    return response;
  }

  /**
   * Get a single site by ID
   */
  async getSite(id: string): Promise<Site> {
    const response = await apiClient.get<Site>(`/sites/${id}`);
    return response;
  }

  /**
   * Create a new site
   */
  async createSite(data: SiteCreateRequest): Promise<Site> {
    const response = await apiClient.post<Site>('/sites', data);
    return response;
  }

  /**
   * Update an existing site
   */
  async updateSite(data: SiteUpdateRequest): Promise<Site> {
    const { id, ...updateData } = data;
    const response = await apiClient.put<Site>(`/sites/${id}`, updateData);
    return response;
  }

  /**
   * Delete a site
   */
  async deleteSite(id: string): Promise<void> {
    await apiClient.delete(`/sites/${id}`);
  }

  /**
   * Get all sites (no pagination, for dropdowns)
   */
  async getAllSites(projectId?: string): Promise<Site[]> {
    const queryParams = new URLSearchParams();
    queryParams.append('page', '1');
    queryParams.append('limit', '100');
    if (projectId) queryParams.append('projectId', projectId);
    
    const response = await apiClient.get<any>(`/sites?${queryParams.toString()}`);
    
    if (Array.isArray(response)) {
      return response;
    }
    
    if (response && response.data && Array.isArray(response.data)) {
      return response.data;
    }
    
    return [];
  }
}

export const siteService = new SiteService();
