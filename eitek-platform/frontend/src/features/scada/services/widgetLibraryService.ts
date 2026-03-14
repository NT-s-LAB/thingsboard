/**
 * Widget Library Service — API client for Widget + WidgetCategory CRUD.
 * Used by the Widget Library management page (SCADA V1 custom widgets).
 */

import { apiClient } from '@/shared/services/api';

/** Remove undefined values from an object before sending to API. */
function stripUndefined<T extends Record<string, unknown>>(obj: T): T {
  const result = {} as Record<string, unknown>;
  for (const key of Object.keys(obj)) {
    if (obj[key] !== undefined) {
      result[key] = obj[key];
    }
  }
  return result as T;
}

// ─── Types ───────────────────────────────────────────────────────────────────

export interface WidgetCategoryItem {
  id: string;
  name: string;
  description?: string;
  icon?: string;
  order: number;
  isActive: boolean;
  parentId?: string | null;
  children?: WidgetCategoryItem[];
  createdAt: string;
  updatedAt: string;
  _count?: { widgets: number; children?: number };
  /** Multi-tenant fields */
  tenantId?: string | null;
  isSystem?: boolean;
}

export interface WidgetItem {
  id: string;
  name: string;
  description?: string;
  type: string;
  config: Record<string, unknown>;
  template: Record<string, unknown>;
  preview?: string;
  version: string;
  isActive: boolean;
  categoryId?: string;
  symbolId?: string;
  category?: WidgetCategoryItem;
  createdAt: string;
  updatedAt: string;
  _count?: { scadaWidgets: number };
  /** Multi-tenant fields */
  tenantId?: string | null;
  isSystem?: boolean;
}

export interface PaginatedResponse<T> {
  data: T[];
  totalElements: number;
  totalPages: number;
  hasNext: boolean;
}

// ─── Widget Categories API ───────────────────────────────────────────────────

class WidgetCategoryService {
  private basePath = '/widget-categories';

  async list(params: { page?: number; pageSize?: number; search?: string } = {}): Promise<PaginatedResponse<WidgetCategoryItem>> {
    const qs = new URLSearchParams();
    if (params.page !== undefined) qs.append('page', String(params.page));
    if (params.pageSize !== undefined) qs.append('pageSize', String(params.pageSize));
    if (params.search) qs.append('search', params.search);
    const queryStr = qs.toString();
    return apiClient.get(`${this.basePath}${queryStr ? `?${queryStr}` : ''}`);
  }

  async getById(id: string): Promise<WidgetCategoryItem> {
    return apiClient.get(`${this.basePath}/${encodeURIComponent(id)}`);
  }

  async create(data: { name: string; description?: string | undefined; icon?: string | undefined; order?: number; parentId?: string | undefined }): Promise<WidgetCategoryItem> {
    return apiClient.post(this.basePath, stripUndefined(data));
  }

  async update(id: string, data: Partial<{ name: string; description?: string | undefined; icon?: string | undefined; order?: number; isActive?: boolean; parentId?: string | null }>): Promise<WidgetCategoryItem> {
    return apiClient.put(`${this.basePath}/${encodeURIComponent(id)}`, stripUndefined(data));
  }

  async delete(id: string): Promise<void> {
    return apiClient.delete(`${this.basePath}/${encodeURIComponent(id)}`);
  }
}

// ─── Widgets API ─────────────────────────────────────────────────────────────

class WidgetService {
  private basePath = '/widgets';

  async list(params: { page?: number; pageSize?: number; search?: string; categoryId?: string } = {}): Promise<PaginatedResponse<WidgetItem>> {
    const qs = new URLSearchParams();
    if (params.page !== undefined) qs.append('page', String(params.page));
    if (params.pageSize !== undefined) qs.append('pageSize', String(params.pageSize));
    if (params.search) qs.append('search', params.search);
    if (params.categoryId) qs.append('categoryId', params.categoryId);
    const queryStr = qs.toString();
    return apiClient.get(`${this.basePath}${queryStr ? `?${queryStr}` : ''}`);
  }

  async getById(id: string): Promise<WidgetItem> {
    return apiClient.get(`${this.basePath}/${encodeURIComponent(id)}`);
  }

  async create(data: {
    name: string;
    description?: string | undefined;
    type: string;
    config: Record<string, unknown>;
    template: Record<string, unknown>;
    preview?: string | undefined;
    version?: string | undefined;
    categoryId?: string | undefined;
    symbolId?: string | undefined;
  }): Promise<WidgetItem> {
    return apiClient.post(this.basePath, stripUndefined(data));
  }

  async update(id: string, data: Partial<{
    name: string;
    description?: string | undefined;
    type: string;
    config: Record<string, unknown>;
    template: Record<string, unknown>;
    preview?: string | undefined;
    categoryId?: string | undefined;
    isActive?: boolean;
  }>): Promise<WidgetItem> {
    return apiClient.put(`${this.basePath}/${encodeURIComponent(id)}`, stripUndefined(data));
  }

  async delete(id: string): Promise<void> {
    return apiClient.delete(`${this.basePath}/${encodeURIComponent(id)}`);
  }
}

// ─── File Upload API ─────────────────────────────────────────────────────────

class FileUploadService {
  async upload(file: File): Promise<{ id: string; url: string; filename: string; originalName: string; mimetype: string; size: number }> {
    const formData = new FormData();
    formData.append('file', file);
    return apiClient.postFormData('/files/upload', formData);
  }
}

// ─── Exports ─────────────────────────────────────────────────────────────────

export const widgetCategoryService = new WidgetCategoryService();
export const widgetService = new WidgetService();
export const fileUploadService = new FileUploadService();
