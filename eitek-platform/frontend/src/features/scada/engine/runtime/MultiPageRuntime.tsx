/**
 * MultiPageRuntime — Multi-page SCADA runtime container.
 *
 * Wraps the existing RuntimeRenderer with:
 *   - Page navigation (navigateToPage, goBack, goHome)
 *   - Popup overlay stack
 *   - Transition effects (fade / slide / none)
 *   - Action engine integration for the new discriminated-union action system
 *   - Data binding resolution via SubscriptionManager + bindingResolver
 *
 * This is the top-level runtime component that replaces direct RuntimeRenderer
 * usage in the SCADA page when working with multi-page projects.
 */

'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRuntimeNavStore } from '../../stores/runtimeNavStore';
import { widgetRegistry } from '../../core/registry';
import { executeActions } from './actionEngine';
import { collectDataPoints, resolveWidgetProperties } from '../../core/engine/bindingResolver';
import { SubscriptionManager, DataUpdate, DataValue } from '../../core/engine/subscriptionManager';
import { useWebSocket } from '@/shared/components/providers/WebSocketProvider';
import type { ScadaProject, ScadaPage, WidgetEvent } from '../../core/types/project.types';
import type { WidgetInstance, ScreenDefinition } from '../../core/types';
import '../../styles/scada.css';

// ─── Props ───────────────────────────────────────────────────────────────────

interface MultiPageRuntimeProps {
  project: ScadaProject;
  /** When true, auto-scale canvas to fit container */
  autoFit?: boolean;
  className?: string;
}

// ─── Component ───────────────────────────────────────────────────────────────

export const MultiPageRuntime: React.FC<MultiPageRuntimeProps> = ({
  project,
  autoFit,
  className,
}) => {
  const currentPageId = useRuntimeNavStore((s) => s.currentPageId);
  const popupStack = useRuntimeNavStore((s) => s.popupStack);
  const init = useRuntimeNavStore((s) => s.init);
  const closePopup = useRuntimeNavStore((s) => s.closePopup);

  // Initialize nav on project load
  useEffect(() => {
    if (project) {
      init(project.homePageId, project.settings.transition);
    }
  }, [project, init]);

  // Find current page
  const currentPage = useMemo(() => {
    if (!currentPageId) return null;
    return project.pages.find((p) => p.id === currentPageId) ?? null;
  }, [project.pages, currentPageId]);

  // Find popup pages
  const openPopups = useMemo(() => {
    return popupStack
      .map((id) => project.pages.find((p) => p.id === id))
      .filter(Boolean) as ScadaPage[];
  }, [project.pages, popupStack]);

  if (!currentPage) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#9CA3AF' }}>
        No page to display
      </div>
    );
  }

  return (
    <div className={className} style={{ position: 'relative', width: '100%', height: '100%', overflow: 'hidden' }}>
      {/* Main page */}
      <PageRenderer page={currentPage} autoFit={autoFit ?? false} project={project} />

      {/* Popup overlays */}
      {openPopups.map((popup, idx) => (
        <PopupOverlay
          key={popup.id}
          page={popup}
          project={project}
          zIndex={9000 + idx}
          onClose={() => closePopup(popup.id)}
        />
      ))}
    </div>
  );
};

// ─── Page Renderer ───────────────────────────────────────────────────────────

const PageRenderer: React.FC<{
  page: ScadaPage;
  project: ScadaProject;
  autoFit?: boolean;
}> = ({ page, autoFit, project }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [fitScale, setFitScale] = useState(1);
  const [fitOffset, setFitOffset] = useState({ x: 0, y: 0 });

  // Data binding state
  const [dataCache, setDataCache] = useState<Map<string, DataUpdate>>(new Map());
  const subscriptionManager = useRef<SubscriptionManager | null>(null);
  const { subscribe, unsubscribe, emit, connected } = useWebSocket();
  
  // Convert page variables to a lookup object
  const variables = useMemo(() => {
    const vars: Record<string, unknown> = {};
    for (const v of page.variables) {
      vars[v.name] = v.defaultValue;
    }
    // Also include project-level global variables
    if (project.globalVariables) {
      for (const v of project.globalVariables) {
        if (!(v.name in vars)) {
          vars[v.name] = v.defaultValue;
        }
      }
    }
    return vars;
  }, [page.variables, project.globalVariables]);

  // Create a pseudo-screen for collectDataPoints (it just needs widgets array)
  const screenForBinding = useMemo(() => ({
    widgets: page.widgets,
  } as ScreenDefinition), [page.widgets]);

  // Collect data points from page widgets
  const dataPoints = useMemo(() => {
    console.log('[MultiPageRuntime] Collecting dataPoints from widgets:', page.widgets.length);
    page.widgets.forEach((w, i) => {
      console.log(`[MultiPageRuntime] Widget[${i}] "${w.name}" type=${w.type} bindings:`, w.bindings);
    });
    return collectDataPoints(screenForBinding);
  }, [screenForBinding]);

  // Set up subscription manager and subscribe to data points
  useEffect(() => {
    console.log('[MultiPageRuntime] Effect triggered:', {
      dataPointsCount: dataPoints.length,
      connected,
      pageId: page.id,
    });
    
    // Create manager if needed
    if (!subscriptionManager.current) {
      subscriptionManager.current = new SubscriptionManager(5000);
    }

    const manager = subscriptionManager.current;

    // Set up WebSocket handle
    console.log('[MultiPageRuntime] Setting WebSocket handle, connected:', connected);
    manager.setWebSocket({ subscribe, unsubscribe, emit, connected });

    // Set up update callback
    manager.onUpdate((updates: DataUpdate[]) => {
      console.log('[MultiPageRuntime] Received updates from SubscriptionManager:', updates);
      setDataCache((prev) => {
        const next = new Map(prev);
        for (const update of updates) {
          next.set(`${update.entityId}::${update.key}`, update);
        }
        return next;
      });
    });

    // Subscribe to data points
    if (dataPoints.length > 0) {
      console.log('[MultiPageRuntime] Subscribing to dataPoints:', dataPoints);
      manager.subscribe(dataPoints);
    } else {
      console.log('[MultiPageRuntime] No dataPoints to subscribe');
    }

    return () => {
      manager.unsubscribeAll();
    };
  }, [dataPoints, subscribe, unsubscribe, emit, connected]);

  // Provide getLatest function for binding resolution
  const getLatest = useCallback(
    (entityId: string, key: string): DataValue | undefined => {
      return dataCache.get(`${entityId}::${key}`)?.value;
    },
    [dataCache],
  );

  // Auto-fit logic
  useEffect(() => {
    if (!autoFit) {
      setFitScale(1);
      setFitOffset({ x: 0, y: 0 });
      return;
    }
    const computeFit = () => {
      const el = containerRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      if (rect.width <= 0 || rect.height <= 0) return;
      const scale = Math.min(rect.width / page.canvasSize.width, rect.height / page.canvasSize.height);
      setFitScale(scale);
      setFitOffset({
        x: (rect.width - page.canvasSize.width * scale) / 2,
        y: (rect.height - page.canvasSize.height * scale) / 2,
      });
    };
    computeFit();
    const timer = setTimeout(computeFit, 150);
    const observer = new ResizeObserver(computeFit);
    if (containerRef.current) observer.observe(containerRef.current);
    return () => { clearTimeout(timer); observer.disconnect(); };
  }, [autoFit, page.canvasSize.width, page.canvasSize.height]);

  // Build background style
  const bgStyle = useMemo(() => {
    const style: React.CSSProperties = {
      width: page.canvasSize.width,
      height: page.canvasSize.height,
    };
    if (page.background.type === 'color') {
      style.background = page.background.color ?? '#f8fafc';
    } else if (page.background.type === 'image' && page.background.imageUrl) {
      style.backgroundImage = `url(${page.background.imageUrl})`;
      style.backgroundSize = page.background.fit ?? 'cover';
      style.backgroundPosition = 'center';
    }
    return style;
  }, [page.background, page.canvasSize]);

  // Visible widgets
  const visibleLayerIds = useMemo(() => new Set(
    page.layers.filter((l) => l.visible).map((l) => l.id),
  ), [page.layers]);

  const sortedWidgets = useMemo(() =>
    [...page.widgets]
      .filter((w) => w.visible !== false && visibleLayerIds.has(w.layerId))
      .sort((a, b) => a.transform.zIndex - b.transform.zIndex),
    [page.widgets, visibleLayerIds],
  );

  // Map widget trigger names to event trigger names
  // Widgets send: 'click', 'doubleClick', 'mouseDown', etc.
  // Events use: 'onClick', 'onDoubleClick', 'onMouseDown', etc.
  const normalizeToEventTrigger = (trigger: string): string => {
    // If already in 'onXxx' format, return as-is
    if (trigger.startsWith('on')) return trigger;
    // Capitalize first letter and add 'on' prefix
    return `on${trigger.charAt(0).toUpperCase()}${trigger.slice(1)}`;
  };

  // Handle widget action (new event system)
  const handleWidgetAction = useCallback((widget: WidgetInstance, trigger: string) => {
    const widgetWithEvents = widget as WidgetInstance & { events?: WidgetEvent[] };
    const events = widgetWithEvents.events ?? [];
    
    // Normalize trigger: 'click' → 'onClick'
    const normalizedTrigger = normalizeToEventTrigger(trigger);
    const event = events.find((e) => e.trigger === normalizedTrigger || e.trigger === trigger);
    
    if (event && event.actions.length > 0) {
      executeActions(event.actions, { widgetId: widget.id });
      return;
    }

    // Fallback: check legacy actions array
    const legacyAction = widget.actions.find((a) => a.trigger === trigger || a.trigger === normalizedTrigger);
    if (legacyAction) {
      // Map legacy action to new action system for execution
      const mapped = mapLegacyAction(legacyAction);
      if (mapped) {
        executeActions([mapped], { widgetId: widget.id });
      }
    }
  }, []);

  const outerBg = page.background.type === 'color' && page.background.color
    ? page.background.color : '#f8fafc';

  return (
    <div
      ref={containerRef}
      style={{
        position: 'relative',
        width: '100%',
        height: '100%',
        overflow: 'hidden',
        background: outerBg,
      }}
    >
      <div
        style={{
          position: autoFit ? 'absolute' : 'relative',
          left: autoFit ? fitOffset.x : undefined,
          top: autoFit ? fitOffset.y : undefined,
          transform: autoFit ? `scale(${fitScale})` : undefined,
          transformOrigin: '0 0',
          ...bgStyle,
          overflow: 'hidden',
        }}
      >
        {sortedWidgets.map((widget) => {
          // Resolve widget properties with live data bindings
          const resolvedProperties = resolveWidgetProperties(widget, getLatest, variables);
          return (
            <RuntimeWidgetV2
              key={widget.id}
              widget={widget}
              resolvedProperties={resolvedProperties}
              onAction={(trigger) => handleWidgetAction(widget, trigger)}
            />
          );
        })}
      </div>
    </div>
  );
};

// ─── Popup Overlay ───────────────────────────────────────────────────────────

const PopupOverlay: React.FC<{
  page: ScadaPage;
  project: ScadaProject;
  zIndex: number;
  onClose: () => void;
}> = ({ page, project, zIndex, onClose }) => {
  // Use canvasSize as the source of truth for popup dimensions
  const popupWidth = page.canvasSize.width;
  const popupHeight = page.canvasSize.height;
  const showTitle = page.popupSettings?.showTitleBar ?? true;
  const title = page.popupSettings?.title ?? page.name;
  const closeOnBackdrop = page.popupSettings?.closeOnBackdropClick ?? true;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'rgba(0,0,0,0.5)',
        backdropFilter: 'blur(4px)',
      }}
      onClick={(e) => {
        if (closeOnBackdrop && e.target === e.currentTarget) onClose();
      }}
    >
      <div
        style={{
          position: 'relative',
          width: popupWidth,
          maxWidth: '90vw',
          maxHeight: '90vh',
          overflow: 'auto',
          borderRadius: 12,
          boxShadow: '0 25px 50px rgba(0,0,0,0.25)',
          border: '1px solid rgba(255,255,255,0.1)',
          background: '#fff',
        }}
      >
        {showTitle && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '8px 12px',
            background: 'rgba(15,23,42,0.95)',
            borderTopLeftRadius: 12,
            borderTopRightRadius: 12,
            borderBottom: '1px solid rgba(255,255,255,0.08)',
          }}>
            <span style={{ color: '#e2e8f0', fontSize: 12, fontWeight: 600 }}>{title}</span>
            <button
              onClick={onClose}
              style={{
                background: 'none',
                border: 'none',
                color: '#94a3b8',
                fontSize: 16,
                cursor: 'pointer',
                padding: '2px 6px',
                borderRadius: 4,
                lineHeight: 1,
              }}
            >
              ×
            </button>
          </div>
        )}
        <div style={{ width: popupWidth, height: popupHeight, position: 'relative', overflow: 'hidden' }}>
          <PageRenderer page={page} project={project} autoFit={false} />
        </div>
      </div>
    </div>
  );
};

// ─── Runtime Widget V2 ──────────────────────────────────────────────────────

const RuntimeWidgetV2: React.FC<{
  widget: WidgetInstance;
  resolvedProperties: Record<string, unknown>;
  onAction: (trigger: string) => void;
}> = React.memo(({ widget, resolvedProperties, onAction }) => {
  const definition = widgetRegistry.get(widget.type);
  if (!definition) {
    return (
      <div
        className="scada-widget-wrapper"
        style={{
          left: widget.transform.position.x,
          top: widget.transform.position.y,
          width: widget.transform.size.width,
          height: widget.transform.size.height,
        }}
      >
        <div style={{ padding: 4, fontSize: 10, color: '#EF4444' }}>
          Unknown: {widget.type}
        </div>
      </div>
    );
  }
  const Renderer = definition.renderer;
  return (
    <div
      className="scada-widget-wrapper"
      style={{
        left: widget.transform.position.x,
        top: widget.transform.position.y,
        width: widget.transform.size.width,
        height: widget.transform.size.height,
        transform: widget.transform.rotation ? `rotate(${widget.transform.rotation}deg)` : undefined,
        zIndex: widget.transform.zIndex,
      }}
    >
      <Renderer
        properties={resolvedProperties}
        width={widget.transform.size.width}
        height={widget.transform.size.height}
        isRuntime={true}
        onAction={onAction}
      />
    </div>
  );
});

RuntimeWidgetV2.displayName = 'RuntimeWidgetV2';

// ─── Legacy Action Mapper ───────────────────────────────────────────────────

import type { WidgetActionInstance } from '../../core/types';
import type { ScadaAction } from '../../core/types/project.types';
import { ACTION_TYPES } from '../../core/types/project.types';

function mapLegacyAction(legacy: WidgetActionInstance): ScadaAction | null {
  switch (legacy.actionType) {
    case 'navigate':
      if (legacy.config.targetWindowId) {
        // targetWindowId was the old "window" concept — map to page navigation
        return {
          id: legacy.id,
          type: ACTION_TYPES.NAVIGATE_TO_PAGE,
          targetPageId: legacy.config.targetWindowId,
        };
      }
      return null;
    case 'rpcCall':
      return {
        id: legacy.id,
        type: ACTION_TYPES.RPC_CALL,
        deviceId: legacy.config.deviceId ?? '',
        rpcMethod: legacy.config.rpcMethod ?? '',
        rpcParams: legacy.config.rpcParams ?? {},
      };
    case 'setAttribute':
      return {
        id: legacy.id,
        type: ACTION_TYPES.SET_ATTRIBUTE,
        deviceId: legacy.config.deviceId ?? '',
        attributeScope: legacy.config.attributeScope ?? 'SHARED_SCOPE',
        attributeKey: legacy.config.attributeKey ?? '',
        attributeValue: legacy.config.attributeValue,
      };
    case 'setVariable':
      return {
        id: legacy.id,
        type: ACTION_TYPES.SET_VARIABLE,
        variableName: legacy.config.variableName ?? '',
        variableValue: legacy.config.variableValue,
        scope: 'page',
      };
    default:
      return null;
  }
}
