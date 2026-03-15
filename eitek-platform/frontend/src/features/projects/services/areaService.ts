import { apiClient } from '@/shared/services/api';
import type {
  Area,
  AreaCreateRequest,
  AreaUpdateRequest,
  AreaListParams,
  AreaListResponse,
} from '../types/area';

class AreaService {
  /**
   * Get all areas with pagination and filtering
   */
  async getAreas(params: AreaListParams = {}): Promise<AreaListResponse> {
    const queryParams = new URLSearchParams();
    
    if (params.page !== undefined) queryParams.append('page', params.page.toString());
    if (params.pageSize !== undefined) queryParams.append('limit', params.pageSize.toString());
    if (params.search) queryParams.append('search', params.search);
    if (params.siteId) queryParams.append('siteId', params.siteId);
    if (params.sortBy) queryParams.append('sortBy', params.sortBy);
    if (params.sortOrder) queryParams.append('sortOrder', params.sortOrder.toLowerCase());

    const response = await apiClient.get<AreaListResponse>(`/areas?${queryParams.toString()}`);
    return response;
  }

  /**
   * Get a single area by ID
   */
  async getArea(id: string): Promise<Area> {
    const response = await apiClient.get<Area>(`/areas/${id}`);
    return response;
  }

  /**
   * Create a new area
   */
  async createArea(data: AreaCreateRequest): Promise<Area> {
    const response = await apiClient.post<Area>('/areas', data);
    return response;
  }

  /**
   * Update an existing area
   */
  async updateArea(data: AreaUpdateRequest): Promise<Area> {
    const { id, ...updateData } = data;
    const response = await apiClient.put<Area>(`/areas/${id}`, updateData);
    return response;
  }

  /**
   * Delete an area
   */
  async deleteArea(id: string): Promise<void> {
    await apiClient.delete(`/areas/${id}`);
  }

  /**
   * Get all areas (no pagination, for dropdowns)
   */
  async getAllAreas(siteId?: string): Promise<Area[]> {
    const queryParams = new URLSearchParams();
    queryParams.append('page', '1');
    queryParams.append('limit', '100');  // Max allowed by backend validation
    if (siteId) queryParams.append('siteId', siteId);
    
    const response = await apiClient.get<any>(`/areas?${queryParams.toString()}`);
    
    // Handle both array and paginated response formats
    if (Array.isArray(response)) {
      return response;
    }
    
    // Paginated response has .data property
    if (response && response.data && Array.isArray(response.data)) {
      return response.data;
    }
    
    // Fallback: return empty array
    console.warn('Unexpected areas response format:', response);
    return [];
  }
}

export const areaService = new AreaService();
