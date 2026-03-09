/**
 * useSyncProjectToRuntime — Bridge hook that keeps the scadaRuntimeStore
 * in sync with the active page from the scadaProjectStore.
 *
 * This allows CanvasEditor, PropertyPanelV2, BindingPanelV2, LayerPanel, etc.
 * to continue reading from `useScadaRuntimeStore.screen` without any changes,
 * while the project store manages the multi-page model.
 *
 * Flow:
 *   Project Store (active page) → Runtime Store (screen)
 *   Runtime Store (screen mutation) → Project Store (active page)
 */

import { useEffect, useRef } from 'react';
import { useScadaProjectStore } from '../stores/scadaProjectStore';
import { useScadaRuntimeStore } from '../stores/scadaRuntimeStore';
import type { ScreenDefinition } from '../core/types';
import type { ScadaPage } from '../core/types/project.types';

/**
 * Converts a ScadaPage + project metadata into a ScreenDefinition
 * that the runtime store can consume.
 */
function pageToScreen(page: ScadaPage, projectId: string, projectName: string): ScreenDefinition {
  return {
    id: projectId,
    version: 1,
    name: projectName,
    description: '',
    canvasSize: page.canvasSize,
    background: page.background,
    layers: page.layers,
    widgets: page.widgets,
    variables: page.variables ?? [],
    metadata: {
      createdAt: '',
      updatedAt: '',
      createdBy: '',
      tags: [],
    },
  };
}

/**
 * Call this hook in ScadaEditorV2. It subscribes to project store
 * changes and pushes the active page into the runtime store.
 */
export function useSyncProjectToRuntime() {
  const syncingFromProject = useRef(false);
  const syncingFromRuntime = useRef(false);

  // ── Project → Runtime: when active page changes, load into runtime store ──
  useEffect(() => {
    const unsubscribe = useScadaProjectStore.subscribe(
      (state) => ({
        activePageId: state.activePageId,
        project: state.project,
      }),
      ({ activePageId, project }) => {
        if (syncingFromRuntime.current) return;
        if (!project || !activePageId) return;

        const page = project.pages.find((p) => p.id === activePageId);
        if (!page) return;

        syncingFromProject.current = true;
        const screen = pageToScreen(page, project.id, project.name);
        useScadaRuntimeStore.getState().loadScreen(screen);
        syncingFromProject.current = false;
      },
      { equalityFn: (a, b) => a.activePageId === b.activePageId && a.project === b.project },
    );

    return unsubscribe;
  }, []);

  // ── Runtime → Project: when widgets/layers/background change in runtime store,
  //    push back to the project store's active page ──
  useEffect(() => {
    const unsubscribe = useScadaRuntimeStore.subscribe(
      (state) => state.screen,
      (screen) => {
        if (syncingFromProject.current) return;
        if (!screen) return;

        const { project, activePageId } = useScadaProjectStore.getState();
        if (!project || !activePageId) return;

        const page = project.pages.find((p) => p.id === activePageId);
        if (!page) return;

        // Only sync if there are actual differences
        const widgetsChanged = screen.widgets !== page.widgets;
        const layersChanged = screen.layers !== page.layers;
        const bgChanged = screen.background !== page.background;
        const sizeChanged =
          screen.canvasSize.width !== page.canvasSize.width ||
          screen.canvasSize.height !== page.canvasSize.height;

        if (!widgetsChanged && !layersChanged && !bgChanged && !sizeChanged) return;

        syncingFromRuntime.current = true;

        // Update the project store's active page with runtime changes
        // IMPORTANT: Preserve widget events that aren't in the screen (runtime store may lose them)
        useScadaProjectStore.setState((state) => {
          if (!state.project) return;
          const idx = state.project.pages.findIndex((p) => p.id === activePageId);
          if (idx === -1) return;
          
          const existingPage = state.project.pages[idx]!;
          
          // Merge widgets: prefer events from runtime widget, fall back to existing widget
          const mergedWidgets = screen.widgets.map((runtimeWidget) => {
            const existingWidget = existingPage.widgets.find((w) => w.id === runtimeWidget.id);
            const runtimeEvents = (runtimeWidget as any).events;
            const existingEvents = (existingWidget as any)?.events;
            
            // Use runtime events if present, otherwise preserve existing events
            const events = (runtimeEvents && runtimeEvents.length > 0)
              ? runtimeEvents
              : existingEvents ?? [];
            
            return {
              ...runtimeWidget,
              events,
            };
          });
          
          state.project.pages[idx]!.widgets = mergedWidgets;
          state.project.pages[idx]!.layers = screen.layers;
          state.project.pages[idx]!.background = screen.background;
          state.project.pages[idx]!.canvasSize = screen.canvasSize;
          state.isDirty = true;
        });

        syncingFromRuntime.current = false;
      },
    );

    return unsubscribe;
  }, []);

  // ── Initial sync on mount ──
  useEffect(() => {
    const { project, activePageId } = useScadaProjectStore.getState();
    if (!project || !activePageId) return;

    const page = project.pages.find((p) => p.id === activePageId);
    if (!page) return;

    const screen = pageToScreen(page, project.id, project.name);
    useScadaRuntimeStore.getState().loadScreen(screen);
  }, []);
}
