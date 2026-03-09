/**
 * SVG Symbol Library Service — Frontend API client for managing SVG assets.
 */

import { apiClient } from '@/shared/services/api';
import type { SvgAsset, SvgAssetQuery, SvgAssetUpload } from '../core/types/symbol.types';

class SymbolLibraryService {
  private basePath = '/symbols';

  /** List SVG assets with filtering, pagination. */
  async list(query: SvgAssetQuery = {}): Promise<{ data: SvgAsset[]; total: number }> {
    const params = new URLSearchParams();
    if (query.search) params.append('search', query.search);
    if (query.category) params.append('category', query.category);
    if (query.tags?.length) params.append('tags', query.tags.join(','));
    if (query.page !== undefined) params.append('page', String(query.page));
    if (query.pageSize !== undefined) params.append('pageSize', String(query.pageSize));
    if (query.sortBy) params.append('sortBy', query.sortBy);
    if (query.sortOrder) params.append('sortOrder', query.sortOrder);

    const qs = params.toString();
    return apiClient.get(`${this.basePath}${qs ? `?${qs}` : ''}`);
  }

  /** Get a single SVG asset by ID. */
  async getById(id: string): Promise<SvgAsset> {
    return apiClient.get(`${this.basePath}/${encodeURIComponent(id)}`);
  }

  /** Upload a new SVG asset. */
  async upload(data: SvgAssetUpload): Promise<SvgAsset> {
    return apiClient.post(this.basePath, data);
  }

  /** Upload SVG from file. */
  async uploadFile(file: File, name: string, category: string, tags: string[] = []): Promise<SvgAsset> {
    const svgContent = await file.text();
    return this.upload({
      name,
      svgContent,
      category: category as SvgAssetUpload['category'],
      tags,
    });
  }

  /** Update an existing SVG asset. */
  async update(id: string, data: Partial<SvgAssetUpload>): Promise<SvgAsset> {
    return apiClient.patch(`${this.basePath}/${encodeURIComponent(id)}`, data);
  }

  /** Delete an SVG asset. */
  async delete(id: string): Promise<void> {
    return apiClient.delete(`${this.basePath}/${encodeURIComponent(id)}`);
  }

  /** Get all available categories. */
  async getCategories(): Promise<string[]> {
    return apiClient.get(`${this.basePath}/categories`);
  }
}

export const symbolLibraryService = new SymbolLibraryService();
