/**
 * Screen Service — Frontend API client for SCADA Screen CRUD.
 *
 * Maps the ScreenDefinition type to the backend ScadaView model.
 */

import { apiClient } from '@/shared/services/api';
import type { ScreenDefinition } from '../core/types/screen.types';

class ScreenService {
  private basePath = '/scada-views';

  /** List screens with pagination. */
  async list(params: {
    page?: number;
    pageSize?: number;
    search?: string;
    projectId?: string;
    areaId?: string;
  } = {}): Promise<{ data: ScreenDefinition[]; total: number; page: number; pageSize: number }> {
    const qs = new URLSearchParams();
    if (params.page !== undefined) qs.append('page', String(params.page));
    if (params.pageSize !== undefined) qs.append('pageSize', String(params.pageSize));
    if (params.search) qs.append('search', params.search);
    if (params.projectId) qs.append('projectId', params.projectId);
    if (params.areaId) qs.append('areaId', params.areaId);

    const queryStr = qs.toString();
    const raw: any = await apiClient.get(`${this.basePath}${queryStr ? `?${queryStr}` : ''}`);

    // Map backend response to ScreenDefinition[]
    return {
      data: (raw.data ?? raw.items ?? []).map(mapBackendToScreen),
      total: raw.total ?? 0,
      page: raw.page ?? 1,
      pageSize: raw.pageSize ?? 20,
    };
  }

  /** Get a single screen by ID. */
  async getById(id: string): Promise<ScreenDefinition> {
    const raw = await apiClient.get(`${this.basePath}/${encodeURIComponent(id)}`);
    return mapBackendToScreen(raw);
  }

  /** Create a new screen. */
  async create(screen: Partial<ScreenDefinition> & { name: string }): Promise<ScreenDefinition> {
    const payload = mapScreenToBackend(screen as ScreenDefinition);
    const raw = await apiClient.post(this.basePath, payload);
    return mapBackendToScreen(raw);
  }

  /** Update an existing screen. */
  async update(id: string, screen: Partial<ScreenDefinition>): Promise<ScreenDefinition> {
    const payload = mapScreenToBackend(screen as ScreenDefinition);
    const raw = await apiClient.patch(`${this.basePath}/${encodeURIComponent(id)}`, payload);
    return mapBackendToScreen(raw);
  }

  /** Delete a screen. */
  async delete(id: string): Promise<void> {
    return apiClient.delete(`${this.basePath}/${encodeURIComponent(id)}`);
  }

  /** Save entire screen definition (full replace). */
  async saveScreen(screen: ScreenDefinition): Promise<ScreenDefinition> {
    const payload = mapScreenToBackend(screen);
    const raw = await apiClient.put(`${this.basePath}/${encodeURIComponent(screen.id)}`, payload);
    return mapBackendToScreen(raw);
  }
}

// ─── Mapping helpers ─────────────────────────────────────────────────────────

/** Map backend ScadaView model to ScreenDefinition. */
function mapBackendToScreen(raw: any): ScreenDefinition {
  return {
    id: raw.id,
    version: raw.version ?? 1,
    name: raw.name ?? '',
    description: raw.description ?? '',
    canvasSize: raw.canvasSize ?? raw.settings?.canvasSize ?? { width: 1920, height: 1080 },
    background: raw.background ?? raw.settings?.background ?? { type: 'color', color: '#f8fafc' },
    layers: raw.layers ?? raw.layout?.layers ?? [{ id: 'default', name: 'Default', visible: true, locked: false, opacity: 1, order: 0 }],
    widgets: (raw.widgets ?? raw.scadaWidgets ?? []).map(mapBackendWidget),
    variables: raw.variables ?? raw.layout?.variables ?? [],
    metadata: {
      createdAt: raw.createdAt ?? '',
      updatedAt: raw.updatedAt ?? '',
      createdBy: raw.createdBy ?? '',
      tags: raw.tags ?? [],
      projectId: raw.projectId,
      areaId: raw.areaId,
    },
  };
}

/** Map a backend widget to WidgetInstance. */
function mapBackendWidget(raw: any): import('../core/types/screen.types').WidgetInstance {
  const pos = raw.position ?? {};
  return {
    id: raw.id,
    type: raw.type ?? raw.widget?.type ?? raw.properties?.widgetType ?? 'text',
    name: raw.name ?? raw.properties?.name ?? '',
    layerId: raw.layerId ?? 'default',
    transform: raw.transform ?? {
      position: { x: pos.x ?? 0, y: pos.y ?? 0 },
      size: { width: pos.width ?? 100, height: pos.height ?? 50 },
      rotation: pos.rotation ?? 0,
      zIndex: pos.zIndex ?? 0,
    },
    properties: raw.properties ?? {},
    bindings: raw.bindings ?? [],
    actions: raw.actions ?? [],
    svgAssetId: raw.svgAssetId ?? raw.symbolId,
    locked: raw.locked ?? false,
    visible: raw.visible ?? raw.isVisible ?? true,
  };
}

/** Map ScreenDefinition to backend payload. */
function mapScreenToBackend(screen: ScreenDefinition): Record<string, unknown> {
  return {
    name: screen.name,
    description: screen.description,
    canvasSize: screen.canvasSize,
    background: screen.background,
    layout: {
      layers: screen.layers,
      variables: screen.variables,
    },
    settings: {
      canvasSize: screen.canvasSize,
      background: screen.background,
    },
    projectId: screen.metadata?.projectId,
    areaId: screen.metadata?.areaId,
    tags: screen.metadata?.tags,
  };
}

export const screenService = new ScreenService();
