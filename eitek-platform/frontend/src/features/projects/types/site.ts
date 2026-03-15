// Site Types for EITEK Platform

export interface ProjectInfo {
  id: string;
  name: string;
}

export interface Site {
  id: string;
  name: string;
  description?: string | null;
  address?: string | null;
  coordinates?: { lat: number; lng: number } | null;
  metadata?: Record<string, any> | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  projectId: string;
  project?: ProjectInfo;
  areas?: Array<{ id: string; name: string; isActive: boolean }>;
  _count?: {
    areas: number;
  };
}

export interface SiteCreateRequest {
  name: string;
  description?: string;
  address?: string;
  coordinates?: { lat: number; lng: number };
  projectId: string;
  metadata?: Record<string, any>;
  isActive?: boolean;
}

export interface SiteUpdateRequest {
  id: string;
  name?: string;
  description?: string;
  address?: string;
  coordinates?: { lat: number; lng: number };
  metadata?: Record<string, any>;
  isActive?: boolean;
}

export interface SiteListParams {
  page?: number | undefined;
  pageSize?: number | undefined;
  search?: string | undefined;
  projectId?: string | undefined;
  sortBy?: string | undefined;
  sortOrder?: 'asc' | 'desc' | 'ASC' | 'DESC' | undefined;
}

export interface SiteListResponse {
  data: Site[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}
