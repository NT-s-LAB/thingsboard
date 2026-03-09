/**
 * SCADA Runtime Store — Zustand store for the new enterprise SCADA architecture.
 *
 * Manages: screen definition, runtime state, editor state, selection, layers.
 * Separate from the legacy scadaStore.
 */

import { create } from 'zustand';
import { devtools, subscribeWithSelector } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import type {
  ScreenDefinition,
  WidgetInstance,
  ScreenLayer,
  Transform,
  AlarmState,
} from '../core/types';

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

  // ── Actions ──
  loadScreen: (screen: ScreenDefinition) => void;
  setDirty: (dirty: boolean) => void;

  toggleRuntime: () => void;
  setRuntime: (value: boolean) => void;
  setFullscreen: (value: boolean) => void;

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
}

// ─── Store ───────────────────────────────────────────────────────────────────

let idCounter = 0;
function genId(): string {
  return `w_${Date.now()}_${++idCounter}`;
}

export const useScadaRuntimeStore = create<ScadaRuntimeState>()(
  devtools(
    subscribeWithSelector(
      immer((set) => ({
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

        // ── Actions ──
        loadScreen: (screen) =>
          set((s) => {
            s.screen = screen;
            s.isDirty = false;
            s.selectedWidgetIds = [];
            s.alarmStates = {};
            s.resolvedProperties = {};
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

        addWidget: (widget) =>
          set((s) => {
            if (!s.screen) return;
            s.screen.widgets.push(widget);
            s.isDirty = true;
          }),

        updateWidget: (id, patch) =>
          set((s) => {
            if (!s.screen) return;
            const idx = s.screen.widgets.findIndex((w) => w.id === id);
            if (idx === -1) return;
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
            const idSet = new Set(ids);
            s.screen.widgets = s.screen.widgets.filter((w) => !idSet.has(w.id));
            s.selectedWidgetIds = s.selectedWidgetIds.filter((id) => !idSet.has(id));
            s.isDirty = true;
          }),

        duplicateWidgets: (ids) =>
          set((s) => {
            if (!s.screen) return;
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
      })),
    ),
    { name: 'scada-runtime-store' },
  ),
);
