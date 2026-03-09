/**
 * SCADA Runtime Store — Zustand store for the new enterprise SCADA architecture.
 *
 * Manages: screen definition, runtime state, editor state, selection, layers.
 * Separate from the legacy scadaStore.
 */

import { create } from 'zustand';
import { devtools, subscribeWithSelector } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import { current } from 'immer';
import type {
  ScreenDefinition,
  ScreenBackground,
  WidgetInstance,
  ScreenLayer,
  Transform,
  AlarmState,
  Size,
  ScadaWindow,
} from '../core/types';

const MAX_UNDO = 50;

export type AlignAction =
  | 'left' | 'right' | 'top' | 'bottom'
  | 'centerH' | 'centerV'
  | 'distributeH' | 'distributeV';

// ─── State Shape ─────────────────────────────────────────────────────────────

interface ScadaRuntimeState {
  // ── Screen ──
  screen: ScreenDefinition | null;
  isDirty: boolean;

  // ── Runtime / Editor mode ──
  isRuntime: boolean;
  isFullscreen: boolean;

  // ── Editor selection ──
  selectedWidgetIds: string[];
  hoveredWidgetId: string | null;
  clipboardWidgets: WidgetInstance[];

  // ── Editor viewport ──
  zoom: number;
  panOffset: { x: number; y: number };
  showGrid: boolean;
  snapToGrid: boolean;
  gridSize: number;

  // ── Alarm states by widget ID ──
  alarmStates: Record<string, AlarmState>;

  // ── Resolved properties (output of binding resolver) ──
  resolvedProperties: Record<string, Record<string, unknown>>;

  // ── Window management ──
  activeWindowId: string | null;
  openWindowIds: string[]; // stack of open overlay windows in runtime

  // ── Undo / Redo history ──
  past: ScreenDefinition[];
  future: ScreenDefinition[];

  // ── Actions ──
  loadScreen: (screen: ScreenDefinition) => void;
  setDirty: (dirty: boolean) => void;

  toggleRuntime: () => void;
  setRuntime: (value: boolean) => void;
  setFullscreen: (value: boolean) => void;

  // Screen-level properties
  updateScreenBackground: (background: Partial<ScreenBackground>) => void;
  updateScreenCanvasSize: (size: Partial<Size>) => void;
  updateScreenName: (name: string) => void;
  updateScreenDescription: (description: string) => void;

  // Widget CRUD
  addWidget: (widget: WidgetInstance) => void;
  updateWidget: (id: string, patch: Partial<WidgetInstance>) => void;
  updateWidgetTransform: (id: string, transform: Partial<Transform>) => void;
  removeWidgets: (ids: string[]) => void;
  duplicateWidgets: (ids: string[]) => void;

  // Selection
  selectWidget: (id: string, multi?: boolean) => void;
  clearSelection: () => void;
  selectAll: () => void;
  setHoveredWidget: (id: string | null) => void;

  // Clipboard
  copySelected: () => void;
  pasteClipboard: (offset?: { x: number; y: number }) => void;

  // Layers
  addLayer: (layer: ScreenLayer) => void;
  updateLayer: (id: string, patch: Partial<ScreenLayer>) => void;
  removeLayer: (id: string) => void;

  // Variables
  setVariable: (name: string, value: unknown) => void;

  // Viewport
  setZoom: (zoom: number) => void;
  setPanOffset: (offset: { x: number; y: number }) => void;
  toggleGrid: () => void;
  toggleSnap: () => void;

  // Alarms
  setAlarmState: (widgetId: string, alarm: AlarmState) => void;
  clearAlarmStates: () => void;

  // Resolved properties
  setResolvedProperties: (widgetId: string, props: Record<string, unknown>) => void;
  batchSetResolvedProperties: (updates: Record<string, Record<string, unknown>>) => void;

  // Undo / Redo
  undo: () => void;
  redo: () => void;
  canUndo: () => boolean;
  canRedo: () => boolean;

  // Alignment
  alignWidgets: (action: AlignAction) => void;

  // Windows
  addWindow: (window: ScadaWindow) => void;
  updateWindow: (id: string, patch: Partial<ScadaWindow>) => void;
  removeWindow: (id: string) => void;
  setMainWindow: (id: string) => void;
  setActiveWindowId: (id: string | null) => void;
  navigateToWindow: (windowId: string) => void;
  closeOverlayWindow: (windowId: string) => void;
  closeAllOverlayWindows: () => void;
}

// ─── Store ───────────────────────────────────────────────────────────────────

let idCounter = 0;
function genId(): string {
  return `w_${Date.now()}_${++idCounter}`;
}

export const useScadaRuntimeStore = create<ScadaRuntimeState>()(
  devtools(
    subscribeWithSelector(
      immer((set, get) => ({
        // ── Initial state ──
        screen: null,
        isDirty: false,
        isRuntime: false,
        isFullscreen: false,
        selectedWidgetIds: [],
        hoveredWidgetId: null,
        clipboardWidgets: [],
        zoom: 1,
        panOffset: { x: 0, y: 0 },
        showGrid: true,
        snapToGrid: true,
        gridSize: 20,
        alarmStates: {},
        resolvedProperties: {},
        activeWindowId: null,
        openWindowIds: [],
        past: [] as ScreenDefinition[],
        future: [] as ScreenDefinition[],

        // ── Actions ──
        loadScreen: (screen) =>
          set((s) => {
            s.screen = screen;
            s.isDirty = false;
            s.selectedWidgetIds = [];
            s.alarmStates = {};
            s.resolvedProperties = {};
            s.past = [];
            s.future = [];
            // Set active window to the main window if windows exist
            s.activeWindowId = screen.windows?.find((w) => w.isMain)?.id ?? null;
            s.openWindowIds = [];
          }),

        setDirty: (dirty) =>
          set((s) => {
            s.isDirty = dirty;
          }),

        toggleRuntime: () =>
          set((s) => {
            s.isRuntime = !s.isRuntime;
            if (s.isRuntime) {
              s.selectedWidgetIds = [];
            }
          }),

        setRuntime: (value) =>
          set((s) => {
            s.isRuntime = value;
            if (value) s.selectedWidgetIds = [];
          }),

        setFullscreen: (value) =>
          set((s) => {
            s.isFullscreen = value;
          }),

        // ── Screen-level property updates ──
        updateScreenBackground: (bg) =>
          set((s) => {
            if (!s.screen) return;
            s.past.push(current(s.screen));
            if (s.past.length > MAX_UNDO) s.past.shift();
            s.future = [];
            s.screen.background = { ...s.screen.background, ...bg };
            s.isDirty = true;
          }),

        updateScreenCanvasSize: (size) =>
          set((s) => {
            if (!s.screen) return;
            s.past.push(current(s.screen));
            if (s.past.length > MAX_UNDO) s.past.shift();
            s.future = [];
            s.screen.canvasSize = { ...s.screen.canvasSize, ...size };
            s.isDirty = true;
          }),

        updateScreenName: (name) =>
          set((s) => {
            if (!s.screen) return;
            s.screen.name = name;
            s.isDirty = true;
          }),

        updateScreenDescription: (description) =>
          set((s) => {
            if (!s.screen) return;
            s.screen.description = description;
            s.isDirty = true;
          }),

        addWidget: (widget) =>
          set((s) => {
            if (!s.screen) return;
            s.past.push(current(s.screen));
            if (s.past.length > MAX_UNDO) s.past.shift();
            s.future = [];
            s.screen.widgets.push(widget);
            s.isDirty = true;
          }),

        updateWidget: (id, patch) =>
          set((s) => {
            if (!s.screen) return;
            const idx = s.screen.widgets.findIndex((w) => w.id === id);
            if (idx === -1) return;
            s.past.push(current(s.screen));
            if (s.past.length > MAX_UNDO) s.past.shift();
            s.future = [];
            const widget = s.screen.widgets[idx];
            for (const key of Object.keys(patch) as Array<keyof WidgetInstance>) {
              (widget as any)[key] = (patch as any)[key];
            }
            s.isDirty = true;
          }),

        updateWidgetTransform: (id, transform) =>
          set((s) => {
            if (!s.screen) return;
            const w = s.screen.widgets.find((w) => w.id === id);
            if (!w) return;
            Object.assign(w.transform, transform);
            s.isDirty = true;
          }),

        removeWidgets: (ids) =>
          set((s) => {
            if (!s.screen) return;
            s.past.push(current(s.screen));
            if (s.past.length > MAX_UNDO) s.past.shift();
            s.future = [];
            const idSet = new Set(ids);
            s.screen.widgets = s.screen.widgets.filter((w) => !idSet.has(w.id));
            s.selectedWidgetIds = s.selectedWidgetIds.filter((id) => !idSet.has(id));
            s.isDirty = true;
          }),

        duplicateWidgets: (ids) =>
          set((s) => {
            if (!s.screen) return;
            s.past.push(current(s.screen));
            if (s.past.length > MAX_UNDO) s.past.shift();
            s.future = [];
            const newIds: string[] = [];
            for (const id of ids) {
              const orig = s.screen.widgets.find((w) => w.id === id);
              if (!orig) continue;
              const newId = genId();
              const clone: WidgetInstance = JSON.parse(JSON.stringify(orig));
              clone.id = newId;
              clone.name = `${orig.name} (copy)`;
              clone.transform.position.x += 20;
              clone.transform.position.y += 20;
              s.screen.widgets.push(clone);
              newIds.push(newId);
            }
            s.selectedWidgetIds = newIds;
            s.isDirty = true;
          }),

        selectWidget: (id, multi) =>
          set((s) => {
            if (multi) {
              const idx = s.selectedWidgetIds.indexOf(id);
              if (idx >= 0) {
                s.selectedWidgetIds.splice(idx, 1);
              } else {
                s.selectedWidgetIds.push(id);
              }
            } else {
              s.selectedWidgetIds = [id];
            }
          }),

        clearSelection: () =>
          set((s) => {
            s.selectedWidgetIds = [];
          }),

        selectAll: () =>
          set((s) => {
            if (!s.screen) return;
            s.selectedWidgetIds = s.screen.widgets.map((w) => w.id);
          }),

        setHoveredWidget: (id) =>
          set((s) => {
            s.hoveredWidgetId = id;
          }),

        copySelected: () =>
          set((s) => {
            if (!s.screen) return;
            const selectedSet = new Set(s.selectedWidgetIds);
            s.clipboardWidgets = s.screen.widgets
              .filter((w) => selectedSet.has(w.id))
              .map((w) => JSON.parse(JSON.stringify(w)));
          }),

        pasteClipboard: (offset = { x: 20, y: 20 }) =>
          set((s) => {
            if (!s.screen || s.clipboardWidgets.length === 0) return;
            s.past.push(current(s.screen));
            if (s.past.length > MAX_UNDO) s.past.shift();
            s.future = [];
            const newIds: string[] = [];
            for (const orig of s.clipboardWidgets) {
              const newId = genId();
              const clone: WidgetInstance = JSON.parse(JSON.stringify(orig));
              clone.id = newId;
              clone.name = `${orig.name} (paste)`;
              clone.transform.position.x += offset.x;
              clone.transform.position.y += offset.y;
              s.screen.widgets.push(clone);
              newIds.push(newId);
            }
            s.selectedWidgetIds = newIds;
            s.isDirty = true;
          }),

        addLayer: (layer) =>
          set((s) => {
            if (!s.screen) return;
            s.screen.layers.push(layer);
            s.isDirty = true;
          }),

        updateLayer: (id, patch) =>
          set((s) => {
            if (!s.screen) return;
            const layer = s.screen.layers.find((l) => l.id === id);
            if (layer) Object.assign(layer, patch);
            s.isDirty = true;
          }),

        removeLayer: (id) =>
          set((s) => {
            if (!s.screen) return;
            s.screen.layers = s.screen.layers.filter((l) => l.id !== id);
            // Move widgets from deleted layer to default layer
            for (const w of s.screen.widgets) {
              if (w.layerId === id) {
                w.layerId = s.screen.layers[0]?.id ?? 'default';
              }
            }
            s.isDirty = true;
          }),

        setVariable: (name, value) =>
          set((s) => {
            if (!s.screen) return;
            const v = s.screen.variables.find((v) => v.name === name);
            if (v) {
              v.currentValue = value;
            }
          }),

        setZoom: (zoom) =>
          set((s) => {
            s.zoom = Math.max(0.1, Math.min(5, zoom));
          }),

        setPanOffset: (offset) =>
          set((s) => {
            s.panOffset = offset;
          }),

        toggleGrid: () =>
          set((s) => {
            s.showGrid = !s.showGrid;
          }),

        toggleSnap: () =>
          set((s) => {
            s.snapToGrid = !s.snapToGrid;
          }),

        setAlarmState: (widgetId, alarm) =>
          set((s) => {
            s.alarmStates[widgetId] = alarm;
          }),

        clearAlarmStates: () =>
          set((s) => {
            s.alarmStates = {};
          }),

        setResolvedProperties: (widgetId, props) =>
          set((s) => {
            s.resolvedProperties[widgetId] = props;
          }),

        batchSetResolvedProperties: (updates) =>
          set((s) => {
            for (const [widgetId, props] of Object.entries(updates)) {
              s.resolvedProperties[widgetId] = props;
            }
          }),

        // ── Undo / Redo ──
        undo: () =>
          set((s) => {
            if (s.past.length === 0 || !s.screen) return;
            s.future.push(current(s.screen));
            s.screen = s.past.pop()!;
            s.isDirty = true;
            s.selectedWidgetIds = [];
          }),

        redo: () =>
          set((s) => {
            if (s.future.length === 0 || !s.screen) return;
            s.past.push(current(s.screen));
            s.screen = s.future.pop()!;
            s.isDirty = true;
            s.selectedWidgetIds = [];
          }),

        canUndo: () => get().past.length > 0,
        canRedo: () => get().future.length > 0,

        // ── Alignment ──
        alignWidgets: (action) =>
          set((s) => {
            if (!s.screen || s.selectedWidgetIds.length < 2) return;
            s.past.push(current(s.screen));
            if (s.past.length > MAX_UNDO) s.past.shift();
            s.future = [];

            const widgets = s.screen.widgets.filter((w) => s.selectedWidgetIds.includes(w.id));
            if (widgets.length < 2) return;

            switch (action) {
              case 'left': {
                const minX = Math.min(...widgets.map((w) => w.transform.position.x));
                widgets.forEach((w) => { w.transform.position.x = minX; });
                break;
              }
              case 'right': {
                const maxR = Math.max(...widgets.map((w) => w.transform.position.x + w.transform.size.width));
                widgets.forEach((w) => { w.transform.position.x = maxR - w.transform.size.width; });
                break;
              }
              case 'top': {
                const minY = Math.min(...widgets.map((w) => w.transform.position.y));
                widgets.forEach((w) => { w.transform.position.y = minY; });
                break;
              }
              case 'bottom': {
                const maxB = Math.max(...widgets.map((w) => w.transform.position.y + w.transform.size.height));
                widgets.forEach((w) => { w.transform.position.y = maxB - w.transform.size.height; });
                break;
              }
              case 'centerH': {
                const minX = Math.min(...widgets.map((w) => w.transform.position.x));
                const maxR = Math.max(...widgets.map((w) => w.transform.position.x + w.transform.size.width));
                const cx = (minX + maxR) / 2;
                widgets.forEach((w) => { w.transform.position.x = cx - w.transform.size.width / 2; });
                break;
              }
              case 'centerV': {
                const minY = Math.min(...widgets.map((w) => w.transform.position.y));
                const maxB = Math.max(...widgets.map((w) => w.transform.position.y + w.transform.size.height));
                const cy = (minY + maxB) / 2;
                widgets.forEach((w) => { w.transform.position.y = cy - w.transform.size.height / 2; });
                break;
              }
              case 'distributeH': {
                if (widgets.length < 3) return;
                const sorted = [...widgets].sort((a, b) => a.transform.position.x - b.transform.position.x);
                const first = sorted[0]!;
                const last = sorted[sorted.length - 1]!;
                const totalSpan = last.transform.position.x + last.transform.size.width - first.transform.position.x;
                const widgetWidths = sorted.reduce((sum, w) => sum + w.transform.size.width, 0);
                const gap = (totalSpan - widgetWidths) / (sorted.length - 1);
                let cx = first.transform.position.x;
                sorted.forEach((w) => {
                  w.transform.position.x = cx;
                  cx += w.transform.size.width + gap;
                });
                break;
              }
              case 'distributeV': {
                if (widgets.length < 3) return;
                const sorted = [...widgets].sort((a, b) => a.transform.position.y - b.transform.position.y);
                const first = sorted[0]!;
                const last = sorted[sorted.length - 1]!;
                const totalSpan = last.transform.position.y + last.transform.size.height - first.transform.position.y;
                const widgetHeights = sorted.reduce((sum, w) => sum + w.transform.size.height, 0);
                const gap = (totalSpan - widgetHeights) / (sorted.length - 1);
                let cy = first.transform.position.y;
                sorted.forEach((w) => {
                  w.transform.position.y = cy;
                  cy += w.transform.size.height + gap;
                });
                break;
              }
            }
            s.isDirty = true;
          }),

        // ── Window management ──
        addWindow: (window) =>
          set((s) => {
            if (!s.screen) return;
            s.past.push(current(s.screen));
            if (s.past.length > MAX_UNDO) s.past.shift();
            s.future = [];
            if (!s.screen.windows) s.screen.windows = [];
            // If this is the first window, make it main
            if (s.screen.windows.length === 0) window.isMain = true;
            s.screen.windows.push(window);
            s.isDirty = true;
          }),

        updateWindow: (id, patch) =>
          set((s) => {
            if (!s.screen?.windows) return;
            const win = s.screen.windows.find((w) => w.id === id);
            if (!win) return;
            s.past.push(current(s.screen));
            if (s.past.length > MAX_UNDO) s.past.shift();
            s.future = [];
            Object.assign(win, patch);
            s.isDirty = true;
          }),

        removeWindow: (id) =>
          set((s) => {
            if (!s.screen?.windows) return;
            const idx = s.screen.windows.findIndex((w) => w.id === id);
            if (idx === -1) return;
            s.past.push(current(s.screen));
            if (s.past.length > MAX_UNDO) s.past.shift();
            s.future = [];
            const wasMain = s.screen.windows[idx]!.isMain;
            s.screen.windows.splice(idx, 1);
            // If we removed the main window, assign the first remaining
            if (wasMain && s.screen.windows.length > 0) {
              s.screen.windows[0]!.isMain = true;
              s.activeWindowId = s.screen.windows[0]!.id;
            }
            if (s.activeWindowId === id) {
              s.activeWindowId = s.screen.windows.find((w) => w.isMain)?.id ?? null;
            }
            s.isDirty = true;
          }),

        setMainWindow: (id) =>
          set((s) => {
            if (!s.screen?.windows) return;
            s.past.push(current(s.screen));
            if (s.past.length > MAX_UNDO) s.past.shift();
            s.future = [];
            for (const w of s.screen.windows) {
              w.isMain = w.id === id;
            }
            s.isDirty = true;
          }),

        setActiveWindowId: (id) =>
          set((s) => {
            s.activeWindowId = id;
            s.selectedWidgetIds = [];
          }),

        navigateToWindow: (windowId) =>
          set((s) => {
            if (!windowId) return;
            // In runtime: push window onto overlay stack
            if (!s.openWindowIds.includes(windowId)) {
              s.openWindowIds.push(windowId);
            }
          }),

        closeOverlayWindow: (windowId) =>
          set((s) => {
            s.openWindowIds = s.openWindowIds.filter((id) => id !== windowId);
          }),

        closeAllOverlayWindows: () =>
          set((s) => {
            s.openWindowIds = [];
          }),
      })),
    ),
    { name: 'scada-runtime-store' },
  ),
);
