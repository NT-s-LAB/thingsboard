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

// Debug flag - set to true to enable logging
const DEBUG_SYNC = false;

function debugLog(...args: any[]) {
  if (DEBUG_SYNC) {
    console.log('[SyncProjectToRuntime]', ...args);
  }
}

/**
 * Converts a ScadaPage + project metadata into a ScreenDefinition
 * that the runtime store can consume.
 * IMPORTANT: Preserves widget events.
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
    // Preserve events on widgets
    widgets: page.widgets.map(w => ({
      ...w,
      events: (w as any).events ?? [],
    })),
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
  // Use a counter to track when we're in a sync operation
  // This handles the async nature of Zustand subscriptions better than a boolean
  const syncingFromProjectCounter = useRef(0);
  const syncingFromRuntimeCounter = useRef(0);
  
  // Track if initial sync has completed
  const initialSyncDone = useRef(false);

  // ── Project → Runtime: when active page changes, load into runtime store ──
  useEffect(() => {
    const unsubscribe = useScadaProjectStore.subscribe(
      (state) => ({
        activePageId: state.activePageId,
        project: state.project,
      }),
      ({ activePageId, project }) => {
        if (syncingFromRuntimeCounter.current > 0) {
          debugLog('Skipping project→runtime sync: runtime is syncing');
          return;
        }
        if (!project || !activePageId) return;

        const page = project.pages.find((p) => p.id === activePageId);
        if (!page) return;

        debugLog('Project→Runtime sync: loading page', activePageId);
        syncingFromProjectCounter.current++;
        const screen = pageToScreen(page, project.id, project.name);
        useScadaRuntimeStore.getState().loadScreen(screen);
        
        // Delay decrement to allow subscription to fire first
        setTimeout(() => {
          syncingFromProjectCounter.current--;
          debugLog('Project→Runtime sync complete');
        }, 0);
      },
      { equalityFn: (a, b) => a.activePageId === b.activePageId && a.project === b.project },
    );

    return unsubscribe;
  }, []);

  // ── Runtime → Project: when widgets/layers/background change in runtime store,
  //    push back to the project store's active page ──
  useEffect(() => {
    const unsubscribe = useScadaRuntimeStore.subscribe(
      (state) => ({
        screen: state.screen,
        // Track widget count and IDs to detect paste/delete operations
        widgetIds: state.screen?.widgets.map(w => w.id).join(',') ?? '',
        layerCount: state.screen?.layers.length ?? 0,
      }),
      ({ screen, widgetIds, layerCount }) => {
        void widgetIds; // used for change detection
        void layerCount; // used for change detection
        
        // Skip if we're in a project→runtime sync
        if (syncingFromProjectCounter.current > 0) {
          debugLog('Skipping runtime→project sync: project is syncing');
          return;
        }
        
        // Skip during initial sync
        if (!initialSyncDone.current) {
          debugLog('Skipping runtime→project sync: initial sync not done');
          return;
        }
        
        if (!screen) return;

        const { project, activePageId } = useScadaProjectStore.getState();
        if (!project || !activePageId) return;

        const page = project.pages.find((p) => p.id === activePageId);
        if (!page) return;

        // Detect changes by comparing counts and widget IDs (more reliable than reference comparison)
        const screenWidgetIds = screen.widgets.map(w => w.id).sort().join(',');
        const pageWidgetIds = page.widgets.map(w => w.id).sort().join(',');
        const widgetsChanged = screenWidgetIds !== pageWidgetIds || screen.widgets.length !== page.widgets.length;
        const layersChanged = screen.layers.length !== page.layers.length;
        const bgChanged = screen.background !== page.background;
        const sizeChanged =
          screen.canvasSize.width !== page.canvasSize.width ||
          screen.canvasSize.height !== page.canvasSize.height;

        // Also check if any widget positions/sizes have changed
        let widgetDataChanged = false;
        if (!widgetsChanged && screen.widgets.length === page.widgets.length) {
          for (let i = 0; i < screen.widgets.length; i++) {
            const sw = screen.widgets.find(w => w.id === page.widgets[i]?.id);
            const pw = page.widgets[i];
            if (sw && pw) {
              if (sw.transform.position.x !== pw.transform.position.x ||
                  sw.transform.position.y !== pw.transform.position.y ||
                  sw.transform.size.width !== pw.transform.size.width ||
                  sw.transform.size.height !== pw.transform.size.height ||
                  sw.transform.zIndex !== pw.transform.zIndex) {
                widgetDataChanged = true;
                break;
              }
            }
          }
        }

        if (!widgetsChanged && !widgetDataChanged && !layersChanged && !bgChanged && !sizeChanged) {
          debugLog('Runtime→Project sync: no changes detected');
          return;
        }

        debugLog('Runtime→Project sync: updating project', { widgetsChanged, widgetDataChanged, layersChanged, bgChanged, sizeChanged });
        syncingFromRuntimeCounter.current++;

        // Update the project store's active page with runtime changes
        // IMPORTANT: Preserve widget events that aren't in the screen (runtime store may lose them)
        useScadaProjectStore.setState((state) => {
          if (!state.project) return;
          const idx = state.project.pages.findIndex((p) => p.id === activePageId);
          if (idx === -1) return;
          
          const existingPage = state.project.pages[idx]!;
          
          // Merge widgets: prefer events from runtime widget if defined, otherwise preserve existing
          const mergedWidgets = screen.widgets.map((runtimeWidget) => {
            const existingWidget = existingPage.widgets.find((w) => w.id === runtimeWidget.id);
            const runtimeEvents = (runtimeWidget as any).events;
            const existingEvents = (existingWidget as any)?.events;
            
            // If runtime has events defined (even empty array), use it
            // Otherwise preserve existing events (undefined means runtime doesn't know about events)
            const events = runtimeEvents !== undefined
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

        syncingFromRuntimeCounter.current--;
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

    debugLog('Initial sync: loading page', activePageId);
    
    // Set flag to prevent runtime subscription from triggering during initial sync
    syncingFromProjectCounter.current++;
    const screen = pageToScreen(page, project.id, project.name);
    useScadaRuntimeStore.getState().loadScreen(screen);
    
    // Mark initial sync as done after a tick to allow subscriptions to settle
    setTimeout(() => {
      syncingFromProjectCounter.current--;
      initialSyncDone.current = true;
      debugLog('Initial sync complete, future runtime changes will sync to project');
    }, 0);
  }, []);
}
