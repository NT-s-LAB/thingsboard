/**
 * Screen Service — Frontend API client for SCADA Screen CRUD.
 *
 * Maps the ScreenDefinition type to the backend ScadaView model.
 */

import { apiClient } from '@/shared/services/api';
import type { ScreenDefinition } from '../core/types/screen.types';
import type { ScadaProject } from '../core/types/project.types';
import { projectToScreenDefinition, screenDefinitionToProject } from '../core/migrations/projectMigration';

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

  // ── Project-level helpers (multi-page) ──

  /** Load a screen and convert it to a ScadaProject (with migration). */
  async loadProject(id: string): Promise<ScadaProject> {
    const screen = await this.getById(id);
    return screenDefinitionToProject(screen);
  }

  /** Save a ScadaProject by serializing it to a ScreenDefinition. */
  async saveProject(project: ScadaProject): Promise<ScreenDefinition> {
    const screen = projectToScreenDefinition(project);
    return this.saveScreen(screen);
  }

  /** Create a new screen from a ScadaProject. */
  async createProject(project: ScadaProject): Promise<ScreenDefinition> {
    const screen = projectToScreenDefinition(project);
    const payload = mapScreenToBackend(screen);
    const raw = await apiClient.post(this.basePath, payload);
    return mapBackendToScreen(raw);
  }
}

// ─── Mapping helpers ─────────────────────────────────────────────────────────

/** Safely parse a JSON field that may come back as a string from the DB. */
function parseJsonField<T>(val: unknown, fallback: T): T {
  if (val == null) return fallback;
  if (typeof val === 'object') return val as T;
  if (typeof val === 'string') {
    try { return JSON.parse(val) as T; } catch { return fallback; }
  }
  return fallback;
}

/** Map backend ScadaView model to ScreenDefinition. */
function mapBackendToScreen(raw: any): ScreenDefinition {
  // Parse layout if it's a JSON string (some backends store JSON columns as strings)
  const layout = parseJsonField<Record<string, unknown>>(raw.layout, {});
  
  // Extract _projectData from layout if present (multi-page project)
  // Also parse it in case it's a nested JSON string
  let projectData = layout?._projectData as any;
  if (typeof projectData === 'string') {
    try {
      projectData = JSON.parse(projectData);
    } catch {
      // Keep as-is if parsing fails
    }
  }



  let widgets = (raw.widgets ?? raw.scadaWidgets ?? []).map(mapBackendWidget);

  // IMPORTANT: Sync events from _projectData into screen.widgets
  // Backend doesn't persist events in top-level widgets, only in _projectData blob
  if (projectData?.pages && projectData?.homePageId) {
    const homePage = projectData.pages.find((p: any) => p.id === projectData.homePageId);
    if (homePage?.widgets) {
      // Create a map of widget ID → events from projectData
      const eventsMap = new Map<string, any[]>();
      for (const w of homePage.widgets) {
        if (w.events && w.events.length > 0) {
          eventsMap.set(w.id, w.events);
        }
      }
      // Merge events into screen widgets
      widgets = widgets.map((w: import('../core/types/screen.types').WidgetInstance) => {
        const events = eventsMap.get(w.id);
        if (events) {
          return { ...w, events };
        }
        return w;
      });
    }
  }

  const screen: ScreenDefinition = {
    id: raw.id,
    version: raw.version ?? 1,
    name: raw.name ?? '',
    description: raw.description ?? '',
    canvasSize: parseJsonField(raw.canvasSize, null) ?? parseJsonField(raw.settings?.canvasSize, null) ?? { width: 1920, height: 1080 },
    background: parseJsonField(raw.background, null) ?? parseJsonField(raw.settings?.background, null) ?? { type: 'color', color: '#f8fafc' },
    layers: raw.layers ?? (layout?.layers as unknown[]) ?? [{ id: 'default', name: 'Default', visible: true, locked: false, opacity: 1, order: 0 }],
    widgets,
    variables: raw.variables ?? (layout?.variables as unknown[]) ?? [],
    metadata: {
      createdAt: raw.createdAt ?? '',
      updatedAt: raw.updatedAt ?? '',
      createdBy: raw.createdBy ?? '',
      tags: raw.tags ?? [],
      projectId: raw.projectId,
      areaId: raw.areaId,
    },
  };

  // Attach _projectData for round-trip if present
  if (projectData) {
    (screen as ScreenDefinition & { _projectData?: unknown })._projectData = projectData;
  }

  return screen;
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
    events: raw.events ?? [],
    svgAssetId: raw.svgAssetId ?? raw.symbolId,
    locked: raw.locked ?? false,
    visible: raw.visible ?? raw.isVisible ?? true,
  };
}

/** Map a WidgetInstance to the backend widget shape. */
function mapWidgetToBackend(w: import('../core/types/screen.types').WidgetInstance): Record<string, unknown> {
  return {
    id: w.id,
    type: w.type,
    name: w.name,
    layerId: w.layerId,
    transform: w.transform,
    properties: w.properties,
    bindings: w.bindings,
    actions: w.actions,
    events: (w as any).events ?? [],
    svgAssetId: w.svgAssetId,
    locked: w.locked ?? false,
    visible: w.visible ?? true,
  };
}

/** Map ScreenDefinition to backend payload. */
function mapScreenToBackend(screen: ScreenDefinition): Record<string, unknown> {
  // Include _projectData if present (multi-page project)
  const projectData = (screen as ScreenDefinition & { _projectData?: unknown })._projectData;

  return {
    name: screen.name,
    description: screen.description,
    canvasSize: screen.canvasSize,
    background: screen.background,
    layout: {
      layers: screen.layers,
      variables: screen.variables,
      // Store the full project structure for round-trip persistence
      ...(projectData ? { _projectData: projectData } : {}),
    },
    widgets: (screen.widgets ?? []).map(mapWidgetToBackend),
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
