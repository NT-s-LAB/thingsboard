/**
 * Image Library Service — API client for ImageCategory + Image CRUD.
 * Manages folders (categories) and images for SCADA widget states.
 */

import { apiClient } from '@/shared/services/api';

// ─── Types ───────────────────────────────────────────────────────────────────

export interface ImageCategoryItem {
  id: string;
  name: string;
  description?: string;
  icon?: string;
  order: number;
  isActive: boolean;
  parentId?: string | null;
  children?: ImageCategoryItem[];
  _count?: { files: number; children: number };
  createdAt?: string;
  updatedAt?: string;
}

export interface ImageItem {
  id: string;
  filename: string;
  originalName: string;
  mimetype: string;
  size: number;
  url: string | null;
  imageCategoryId: string | null;
  createdAt: string;
}

interface PaginationResult {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

// ─── Service ─────────────────────────────────────────────────────────────────

class ImageLibraryService {
  // ── Categories ──

  async getCategories(search?: string): Promise<ImageCategoryItem[]> {
    const params = new URLSearchParams({ limit: '100' });
    if (search) params.append('search', search);
    const res = await apiClient.get<{ data: ImageCategoryItem[]; pagination: PaginationResult }>(
      `/image-library/categories?${params.toString()}`,
    );
    return res.data;
  }

  async createCategory(data: {
    name: string;
    description?: string;
    icon?: string;
    parentId?: string;
    order?: number;
  }): Promise<ImageCategoryItem> {
    const res = await apiClient.post<{ data: ImageCategoryItem }>('/image-library/categories', data);
    return res.data;
  }

  async updateCategory(
    id: string,
    data: { name?: string; description?: string; icon?: string; order?: number; parentId?: string | null },
  ): Promise<ImageCategoryItem> {
    const res = await apiClient.put<{ data: ImageCategoryItem }>(`/image-library/categories/${id}`, data);
    return res.data;
  }

  async deleteCategory(id: string): Promise<void> {
    await apiClient.delete(`/image-library/categories/${id}`);
  }

  // ── Images ──

  async getImages(params?: { categoryId?: string; search?: string; page?: number; limit?: number }): Promise<{
    data: ImageItem[];
    pagination: PaginationResult;
  }> {
    const qp = new URLSearchParams();
    if (params?.categoryId) qp.append('categoryId', params.categoryId);
    if (params?.search) qp.append('search', params.search);
    if (params?.page) qp.append('page', String(params.page));
    qp.append('limit', String(params?.limit ?? 50));
    const res = await apiClient.get<{ data: ImageItem[]; pagination: PaginationResult }>(
      `/image-library/images?${qp.toString()}`,
    );
    return res;
  }

  async uploadImage(file: File, categoryId?: string): Promise<ImageItem> {
    const formData = new FormData();
    formData.append('file', file);
    if (categoryId) formData.append('categoryId', categoryId);
    const res = await apiClient.postFormData<{ data: ImageItem }>('/image-library/images', formData);
    return res.data;
  }

  async moveImage(fileId: string, categoryId: string | null): Promise<ImageItem> {
    const res = await apiClient.put<{ data: ImageItem }>(`/image-library/images/${fileId}/move`, { categoryId });
    return res.data;
  }

  async deleteImage(fileId: string): Promise<void> {
    await apiClient.delete(`/image-library/images/${fileId}`);
  }
}

export const imageLibraryService = new ImageLibraryService();
