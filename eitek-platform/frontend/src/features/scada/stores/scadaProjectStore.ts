/**
 * SCADA Project Store — Manages the multi-page ScadaProject.
 *
 * Responsibilities:
 *   - Load / save project
 *   - Page CRUD (add, rename, duplicate, delete, reorder)
 *   - Set home page
 *   - Active page tracking for the editor
 *   - Global variables
 *   - Undo/redo at the project level
 *
 * This store is the SOURCE OF TRUTH for the project structure.
 * The existing scadaRuntimeStore continues to manage the *active page*
 * editor state (selection, zoom, etc.) and is fed page data from here.
 */

import { create } from 'zustand';
import { devtools, subscribeWithSelector } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import { current } from 'immer';
import type {
  ScadaProject,
  ScadaPage,
  WidgetEvent,
} from '../core/types/project.types';
import {
  createDefaultPage,
  createPopupPage,
} from '../core/types/project.types';
import type { WidgetInstance, ScreenLayer, ScreenBackground, Size, ScreenVariable } from '../core/types';

const MAX_UNDO = 30;

// ─── State Shape ─────────────────────────────────────────────────────────────

interface ScadaProjectState {
  /** The loaded project */
  project: ScadaProject | null;
  /** Which page is currently being edited */
  activePageId: string | null;
  /** Dirty flag — project has unsaved changes */
  isDirty: boolean;

  // ── Undo / Redo ──
  past: ScadaProject[];
  future: ScadaProject[];

  // ── Project-level actions ──
  loadProject: (project: ScadaProject) => void;
  setDirty: (dirty: boolean) => void;
  updateProjectName: (name: string) => void;
  updateProjectDescription: (description: string) => void;
  setHomePageId: (pageId: string) => void;

  // ── Page CRUD ──
  addPage: (name: string, type?: 'normal' | 'popup') => string;
  renamePage: (pageId: string, name: string) => void;
  duplicatePage: (pageId: string) => string | null;
  removePage: (pageId: string) => void;
  reorderPage: (pageId: string, newOrder: number) => void;
  setActivePage: (pageId: string) => void;

  // ── Page-level properties ──
  updatePageBackground: (pageId: string, bg: Partial<ScreenBackground>) => void;
  updatePageCanvasSize: (pageId: string, size: Partial<Size>) => void;

  // ── Active page widget operations ──
  /** Get the currently active page object */
  getActivePage: () => ScadaPage | null;
  /** Add widget to the active page */
  addWidgetToPage: (widget: WidgetInstance) => void;
  /** Update widget in the active page */
  updateWidgetInPage: (widgetId: string, patch: Partial<WidgetInstance>) => void;
  /** Remove widgets from the active page */
  removeWidgetsFromPage: (widgetIds: string[]) => void;
  /** Duplicate widgets in the active page */
  duplicateWidgetsInPage: (widgetIds: string[]) => string[];

  // ── Layer operations on active page ──
  addLayerToPage: (layer: ScreenLayer) => void;
  updateLayerInPage: (layerId: string, patch: Partial<ScreenLayer>) => void;
  removeLayerFromPage: (layerId: string) => void;

  // ── Widget events (new action system) ──
  setWidgetEvents: (widgetId: string, events: WidgetEvent[]) => void;

  // ── Global variables ──
  setGlobalVariable: (name: string, value: unknown) => void;
  addGlobalVariable: (variable: ScreenVariable) => void;
  removeGlobalVariable: (name: string) => void;

  // ── Undo / Redo ──
  undo: () => void;
  redo: () => void;
  canUndo: () => boolean;
  canRedo: () => boolean;
}

// ─── Helper: snapshot for undo ───────────────────────────────────────────────

function pushUndo(s: { project: ScadaProject | null; past: ScadaProject[]; future: ScadaProject[] }) {
  if (!s.project) return;
  s.past.push(current(s.project) as ScadaProject);
  if (s.past.length > MAX_UNDO) s.past.shift();
  s.future = [];
}

function findPage(project: ScadaProject, pageId: string): ScadaPage | undefined {
  return project.pages.find((p) => p.id === pageId);
}

// ─── Store ───────────────────────────────────────────────────────────────────

export const useScadaProjectStore = create<ScadaProjectState>()(
  devtools(
    subscribeWithSelector(
      immer((set, get) => ({
        project: null,
        activePageId: null,
        isDirty: false,
        past: [] as ScadaProject[],
        future: [] as ScadaProject[],

        // ── Project loading ──
        loadProject: (project) =>
          set((s) => {
            console.log('[ProjectStore] loadProject called:', project.id);
            const homePage = project.pages.find(p => p.id === project.homePageId);
            console.log('[ProjectStore] Home page widgets with events:', 
              homePage?.widgets.filter((w: any) => w.events?.length > 0).map((w: any) => ({
                id: w.id,
                name: w.name,
                eventCount: w.events?.length
              }))
            );
            s.project = project;
            s.activePageId = project.homePageId ?? project.pages[0]?.id ?? null;
            s.isDirty = false;
            s.past = [];
            s.future = [];
          }),

        setDirty: (dirty) =>
          set((s) => {
            s.isDirty = dirty;
          }),

        updateProjectName: (name) =>
          set((s) => {
            if (!s.project) return;
            s.project.name = name;
            s.isDirty = true;
          }),

        updateProjectDescription: (description) =>
          set((s) => {
            if (!s.project) return;
            s.project.description = description;
            s.isDirty = true;
          }),

        setHomePageId: (pageId) =>
          set((s) => {
            if (!s.project) return;
            if (!s.project.pages.some((p) => p.id === pageId)) return;
            pushUndo(s);
            s.project.homePageId = pageId;
            s.isDirty = true;
          }),

        // ── Page CRUD ──
        addPage: (name, type = 'normal') => {
          let newPageId = '';
          set((s) => {
            if (!s.project) return;
            pushUndo(s);
            const order = s.project.pages.length;
            const page = type === 'popup'
              ? createPopupPage(name, order)
              : createDefaultPage(name, order);
            // Inherit project default canvas/bg
            if (type !== 'popup') {
              page.canvasSize = { ...s.project.settings.defaultCanvasSize };
              page.background = { ...s.project.settings.defaultBackground };
            }
            s.project.pages.push(page);
            s.activePageId = page.id;
            s.isDirty = true;
            newPageId = page.id;
          });
          return newPageId;
        },

        renamePage: (pageId, name) =>
          set((s) => {
            if (!s.project) return;
            const page = findPage(s.project, pageId);
            if (!page) return;
            page.name = name;
            page.updatedAt = new Date().toISOString();
            s.isDirty = true;
          }),

        duplicatePage: (pageId) => {
          let newId: string | null = null;
          set((s) => {
            if (!s.project) return;
            const source = findPage(s.project, pageId);
            if (!source) return;
            pushUndo(s);
            const clone: ScadaPage = JSON.parse(JSON.stringify(source));
            clone.id = `page_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
            clone.name = `${source.name} (copy)`;
            clone.order = s.project.pages.length;
            clone.createdAt = new Date().toISOString();
            clone.updatedAt = new Date().toISOString();
            // Generate new IDs for widgets to avoid conflicts
            for (const w of clone.widgets) {
              w.id = `w_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
            }
            s.project.pages.push(clone);
            s.activePageId = clone.id;
            s.isDirty = true;
            newId = clone.id;
          });
          return newId;
        },

        removePage: (pageId) =>
          set((s) => {
            if (!s.project) return;
            // Must keep at least one page
            if (s.project.pages.length <= 1) return;
            pushUndo(s);
            s.project.pages = s.project.pages.filter((p) => p.id !== pageId);
            // Fix home page reference
            if (s.project.homePageId === pageId) {
              s.project.homePageId = s.project.pages[0]!.id;
            }
            // Fix active page
            if (s.activePageId === pageId) {
              s.activePageId = s.project.homePageId;
            }
            // Recompute order
            s.project.pages.forEach((p, i) => { p.order = i; });
            s.isDirty = true;
          }),

        reorderPage: (pageId, newOrder) =>
          set((s) => {
            if (!s.project) return;
            const idx = s.project.pages.findIndex((p) => p.id === pageId);
            if (idx === -1) return;
            const clamped = Math.max(0, Math.min(s.project.pages.length - 1, newOrder));
            if (idx === clamped) return;
            pushUndo(s);
            const [page] = s.project.pages.splice(idx, 1);
            s.project.pages.splice(clamped, 0, page!);
            s.project.pages.forEach((p, i) => { p.order = i; });
            s.isDirty = true;
          }),

        setActivePage: (pageId) =>
          set((s) => {
            if (!s.project) return;
            if (!s.project.pages.some((p) => p.id === pageId)) return;
            s.activePageId = pageId;
          }),

        // ── Page-level properties ──
        updatePageBackground: (pageId, bg) =>
          set((s) => {
            if (!s.project) return;
            const page = findPage(s.project, pageId);
            if (!page) return;
            pushUndo(s);
            page.background = { ...page.background, ...bg };
            page.updatedAt = new Date().toISOString();
            s.isDirty = true;
          }),

        updatePageCanvasSize: (pageId, size) =>
          set((s) => {
            if (!s.project) return;
            const page = findPage(s.project, pageId);
            if (!page) return;
            pushUndo(s);
            page.canvasSize = { ...page.canvasSize, ...size };
            page.updatedAt = new Date().toISOString();
            s.isDirty = true;
          }),

        // ── Active page access ──
        getActivePage: () => {
          const { project, activePageId } = get();
          if (!project || !activePageId) return null;
          return project.pages.find((p) => p.id === activePageId) ?? null;
        },

        // ── Widget operations on active page ──
        addWidgetToPage: (widget) =>
          set((s) => {
            if (!s.project || !s.activePageId) return;
            const page = findPage(s.project, s.activePageId);
            if (!page) return;
            pushUndo(s);
            page.widgets.push(widget);
            page.updatedAt = new Date().toISOString();
            s.isDirty = true;
          }),

        updateWidgetInPage: (widgetId, patch) =>
          set((s) => {
            if (!s.project || !s.activePageId) return;
            const page = findPage(s.project, s.activePageId);
            if (!page) return;
            const widget = page.widgets.find((w) => w.id === widgetId);
            if (!widget) return;
            pushUndo(s);
            for (const key of Object.keys(patch) as Array<keyof WidgetInstance>) {
              (widget as unknown as Record<string, unknown>)[key] = (patch as unknown as Record<string, unknown>)[key];
            }
            page.updatedAt = new Date().toISOString();
            s.isDirty = true;
          }),

        removeWidgetsFromPage: (widgetIds) =>
          set((s) => {
            if (!s.project || !s.activePageId) return;
            const page = findPage(s.project, s.activePageId);
            if (!page) return;
            pushUndo(s);
            const idSet = new Set(widgetIds);
            page.widgets = page.widgets.filter((w) => !idSet.has(w.id));
            page.updatedAt = new Date().toISOString();
            s.isDirty = true;
          }),

        duplicateWidgetsInPage: (widgetIds) => {
          const newIds: string[] = [];
          set((s) => {
            if (!s.project || !s.activePageId) return;
            const page = findPage(s.project, s.activePageId);
            if (!page) return;
            pushUndo(s);
            for (const id of widgetIds) {
              const orig = page.widgets.find((w) => w.id === id);
              if (!orig) continue;
              const clone: WidgetInstance = JSON.parse(JSON.stringify(orig));
              clone.id = `w_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
              clone.name = `${orig.name} (copy)`;
              clone.transform.position.x += 20;
              clone.transform.position.y += 20;
              page.widgets.push(clone);
              newIds.push(clone.id);
            }
            page.updatedAt = new Date().toISOString();
            s.isDirty = true;
          });
          return newIds;
        },

        // ── Layer operations ──
        addLayerToPage: (layer) =>
          set((s) => {
            if (!s.project || !s.activePageId) return;
            const page = findPage(s.project, s.activePageId);
            if (!page) return;
            page.layers.push(layer);
            s.isDirty = true;
          }),

        updateLayerInPage: (layerId, patch) =>
          set((s) => {
            if (!s.project || !s.activePageId) return;
            const page = findPage(s.project, s.activePageId);
            if (!page) return;
            const layer = page.layers.find((l) => l.id === layerId);
            if (layer) Object.assign(layer, patch);
            s.isDirty = true;
          }),

        removeLayerFromPage: (layerId) =>
          set((s) => {
            if (!s.project || !s.activePageId) return;
            const page = findPage(s.project, s.activePageId);
            if (!page) return;
            page.layers = page.layers.filter((l) => l.id !== layerId);
            for (const w of page.widgets) {
              if (w.layerId === layerId) {
                w.layerId = page.layers[0]?.id ?? 'default';
              }
            }
            s.isDirty = true;
          }),

        // ── Widget events ──
        setWidgetEvents: (widgetId, events) =>
          set((s) => {
            if (!s.project || !s.activePageId) return;
            const page = findPage(s.project, s.activePageId);
            if (!page) return;
            const widget = page.widgets.find((w) => w.id === widgetId);
            if (!widget) return;
            pushUndo(s);
            // Store events as a property on the widget
            (widget as WidgetInstance & { events?: WidgetEvent[] }).events = events;
            page.updatedAt = new Date().toISOString();
            s.isDirty = true;
          }),

        // ── Global variables ──
        setGlobalVariable: (name, value) =>
          set((s) => {
            if (!s.project) return;
            const v = s.project.globalVariables.find((v) => v.name === name);
            if (v) v.currentValue = value;
          }),

        addGlobalVariable: (variable) =>
          set((s) => {
            if (!s.project) return;
            s.project.globalVariables.push(variable);
            s.isDirty = true;
          }),

        removeGlobalVariable: (name) =>
          set((s) => {
            if (!s.project) return;
            s.project.globalVariables = s.project.globalVariables.filter((v) => v.name !== name);
            s.isDirty = true;
          }),

        // ── Undo / Redo ──
        undo: () =>
          set((s) => {
            if (s.past.length === 0 || !s.project) return;
            s.future.push(current(s.project) as ScadaProject);
            s.project = s.past.pop()!;
            s.isDirty = true;
          }),

        redo: () =>
          set((s) => {
            if (s.future.length === 0 || !s.project) return;
            s.past.push(current(s.project) as ScadaProject);
            s.project = s.future.pop()!;
            s.isDirty = true;
          }),

        canUndo: () => get().past.length > 0,
        canRedo: () => get().future.length > 0,
      })),
    ),
    { name: 'scada-project-store' },
  ),
);
