// Area Types for EITEK Platform

export interface SiteInfo {
  id: string;
  name: string;
}

export interface Area {
  id: string;
  name: string;
  description?: string | null;
  metadata?: Record<string, any> | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  siteId: string;
  site?: SiteInfo;
  devices?: Array<{ id: string; name: string; isActive: boolean; isOnline: boolean }>;
  scadaViews?: Array<{ id: string; name: string; isActive: boolean }>;
  _count?: {
    devices: number;
    scadaViews: number;
  };
}

export interface AreaCreateRequest {
  name: string;
  description?: string;
  siteId: string;
  metadata?: Record<string, any>;
  isActive?: boolean;
}

export interface AreaUpdateRequest {
  id: string;
  name?: string;
  description?: string;
  metadata?: Record<string, any>;
  isActive?: boolean;
}

export interface AreaListParams {
  page?: number | undefined;
  pageSize?: number | undefined;
  search?: string | undefined;
  siteId?: string | undefined;
  sortBy?: string | undefined;
  sortOrder?: 'asc' | 'desc' | 'ASC' | 'DESC' | undefined;
}

export interface AreaListResponse {
  data: Area[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}
