/**
 * RuntimeRenderer — The core SCADA runtime engine.
 *
 * Loads a ScreenDefinition, sets up subscriptions, resolves bindings,
 * renders all widgets as SVG components via the WidgetRegistry, and
 * handles actions via the CommandService.
 */

'use client';

import React, { useEffect, useRef, useCallback, useState } from 'react';
import { useWebSocket } from '@/shared/components/providers/WebSocketProvider';
import { widgetRegistry } from '../../core/registry';
import { SubscriptionManager } from '../../core/engine/subscriptionManager';
import { collectDataPoints, resolveWidgetProperties } from '../../core/engine/bindingResolver';
import { commandService } from '../../core/engine/commandService';
import { useScadaRuntimeStore } from '../../stores/scadaRuntimeStore';
import { AlarmOverlay } from './AlarmOverlay';
import type { ScreenDefinition, WidgetInstance } from '../../core/types';
import type { CommandRequest } from '../../core/types/command.types';
import '../../styles/scada.css';

// ─── Props ───────────────────────────────────────────────────────────────────

interface RuntimeRendererProps {
  screenId: string;
  /** Pre-loaded screen definition (if already fetched). */
  screen?: ScreenDefinition;
  className?: string;
  /** When true, auto-scale the canvas to fit the container (used in fullscreen). */
  autoFit?: boolean;
}

// ─── Component ───────────────────────────────────────────────────────────────

export const RuntimeRenderer: React.FC<RuntimeRendererProps> = ({
  screen: screenProp,
  className,
  autoFit,
}) => {
  const { subscribe, unsubscribe, emit, connected } = useWebSocket();

  const containerRef = useRef<HTMLDivElement>(null);
  const [fitScale, setFitScale] = useState<number>(1);
  const [fitOffset, setFitOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  const screen = useScadaRuntimeStore((s) => s.screen);
  const isFullscreen = useScadaRuntimeStore((s) => s.isFullscreen);
  const alarmStates = useScadaRuntimeStore((s) => s.alarmStates);
  const resolvedProperties = useScadaRuntimeStore((s) => s.resolvedProperties);
  const loadScreen = useScadaRuntimeStore((s) => s.loadScreen);
  const batchSetResolvedProperties = useScadaRuntimeStore((s) => s.batchSetResolvedProperties);
  const setVariable = useScadaRuntimeStore((s) => s.setVariable);

  const subManagerRef = useRef<SubscriptionManager | null>(null);

  // Auto-fit: compute scale and offset to center the canvas in the container
  useEffect(() => {
    if (!autoFit || !screen) {
      setFitScale(1);
      setFitOffset({ x: 0, y: 0 });
      return;
    }

    const computeFit = () => {
      const el = containerRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const viewW = rect.width;
      const viewH = rect.height;
      if (viewW <= 0 || viewH <= 0) return;

      const dashW = screen.canvasSize.width;
      const dashH = screen.canvasSize.height;
      const scale = Math.min(viewW / dashW, viewH / dashH);
      const offsetX = (viewW - dashW * scale) / 2;
      const offsetY = (viewH - dashH * scale) / 2;
      setFitScale(scale);
      setFitOffset({ x: offsetX, y: offsetY });
    };

    // Compute on mount and observe resize
    computeFit();
    // Delay once more for fullscreen settle
    const timer = setTimeout(computeFit, 150);

    const observer = new ResizeObserver(computeFit);
    if (containerRef.current) observer.observe(containerRef.current);

    return () => {
      clearTimeout(timer);
      observer.disconnect();
    };
  }, [autoFit, screen?.canvasSize?.width, screen?.canvasSize?.height]);

  // Load screen prop into store if provided
  useEffect(() => {
    if (screenProp) {
      loadScreen(screenProp);
    }
  }, [screenProp, loadScreen]);

  // ── Set up subscription manager ──
  useEffect(() => {
    if (!screen) return;

    const subManager = new SubscriptionManager();
    subManagerRef.current = subManager;

    // Provide WebSocket handle
    if (connected) {
      subManager.setWebSocket({ subscribe, unsubscribe, emit, connected });
    }

    // Collect data points from screen bindings
    const dataPoints = collectDataPoints(screen);

    // Build variables map
    const variablesMap: Record<string, unknown> = {};
    for (const v of screen.variables) {
      variablesMap[v.name] = v.currentValue ?? v.defaultValue;
    }

    // On data update → resolve all widget properties
    subManager.onUpdate(() => {
      if (!screen) return;

      const updates: Record<string, Record<string, unknown>> = {};
      for (const widget of screen.widgets) {
        updates[widget.id] = resolveWidgetProperties(
          widget,
          (entityId, key) => subManager.getLatest(entityId, key),
          variablesMap,
        );
      }
      batchSetResolvedProperties(updates);
    });

    // Subscribe
    subManager.subscribe(dataPoints);

    // Also resolve initial static properties
    const initialUpdates: Record<string, Record<string, unknown>> = {};
    for (const widget of screen.widgets) {
      initialUpdates[widget.id] = resolveWidgetProperties(
        widget,
        (entityId, key) => subManager.getLatest(entityId, key),
        variablesMap,
      );
    }
    batchSetResolvedProperties(initialUpdates);

    return () => {
      subManager.destroy();
      subManagerRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [screen?.id, screen?.version, connected]);

  // ── Action handler ──
  const handleAction = useCallback(
    (widget: WidgetInstance, trigger: string, payload?: Record<string, unknown>) => {
      const action = widget.actions.find((a) => a.trigger === trigger);
      if (!action) return;

      const config = action.config;
      switch (action.actionType) {
        case 'rpcCall': {
          const req: CommandRequest = {
            id: `cmd_${Date.now()}`,
            widgetId: widget.id,
            entityId: config.deviceId ?? '',
            entityType: 'DEVICE',
            type: 'rpc',
            rpcMethod: config.rpcMethod ?? '',
            rpcParams: { ...(config.rpcParams ?? {}), ...(payload ?? {}) },
            timestamp: new Date().toISOString(),
          };
          commandService.execute(req);
          break;
        }
        case 'setAttribute': {
          const req: CommandRequest = {
            id: `cmd_${Date.now()}`,
            widgetId: widget.id,
            entityId: config.deviceId ?? '',
            entityType: 'DEVICE',
            type: 'attribute',
            attributeKey: config.attributeKey ?? '',
            attributeValue: payload?.value ?? config.attributeValue,
            attributeScope: config.attributeScope ?? 'SHARED_SCOPE',
            timestamp: new Date().toISOString(),
          };
          commandService.execute(req);
          break;
        }
        case 'setVariable': {
          if (config.variableName) {
            setVariable(config.variableName, payload?.value ?? config.variableValue);
          }
          break;
        }
        case 'navigate': {
          // Navigation handled by parent
          break;
        }
        default:
          break;
      }
    },
    [setVariable],
  );

  // ── Render ──
  if (!screen) {
    return (
      <div ref={containerRef} className={`scada-runtime ${className ?? ''}`} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 300, width: '100%', height: '100%' }}>
        <span style={{ color: '#9CA3AF' }}>No screen loaded</span>
      </div>
    );
  }

  const { canvasSize, background, layers, widgets } = screen;

  // Build background style
  const bgStyle: React.CSSProperties = {
    width: canvasSize.width,
    height: canvasSize.height,
  };
  if (background.type === 'color') {
    bgStyle.background = background.color ?? '#f8fafc';
  } else if (background.type === 'image' && background.imageUrl) {
    bgStyle.backgroundImage = `url(${background.imageUrl})`;
    bgStyle.backgroundSize = background.fit ?? 'cover';
    bgStyle.backgroundPosition = 'center';
  }
  if (background.opacity !== undefined) {
    bgStyle.opacity = background.opacity;
  }

  // Visible layers
  const visibleLayerIds = new Set(layers.filter((l) => l.visible).map((l) => l.id));

  // Sort widgets by zIndex
  const sortedWidgets = [...widgets]
    .filter((w) => w.visible !== false && visibleLayerIds.has(w.layerId))
    .sort((a, b) => a.transform.zIndex - b.transform.zIndex);

  // When autoFit is active, wrap content in a scaled container
  if (autoFit) {
    return (
      <div
        ref={containerRef}
        className={`scada-runtime ${className ?? ''}`}
        style={{ position: 'relative', width: '100%', height: '100%', overflow: 'hidden', background: '#000' }}
      >
        <div
          style={{
            position: 'absolute',
            left: fitOffset.x,
            top: fitOffset.y,
            width: canvasSize.width,
            height: canvasSize.height,
            transform: `scale(${fitScale})`,
            transformOrigin: '0 0',
            ...bgStyle,
            overflow: 'hidden',
          }}
        >
          {sortedWidgets.map((widget) => {
            const rProps = resolvedProperties[widget.id];
            const alarm = alarmStates[widget.id];
            return (
              <RuntimeWidget
                key={widget.id}
                widget={widget}
                {...(rProps ? { resolvedProps: rProps } : {})}
                {...(alarm ? { alarmState: alarm } : {})}
                onAction={(trigger, payload) => handleAction(widget, trigger, payload)}
              />
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className={`scada-runtime ${isFullscreen ? 'scada-runtime--fullscreen' : ''} ${className ?? ''}`}
      style={{ position: 'relative', ...bgStyle, overflow: 'hidden' }}
    >
      {sortedWidgets.map((widget) => {
        const rProps = resolvedProperties[widget.id];
        const alarm = alarmStates[widget.id];
        return (
          <RuntimeWidget
            key={widget.id}
            widget={widget}
            {...(rProps ? { resolvedProps: rProps } : {})}
            {...(alarm ? { alarmState: alarm } : {})}
            onAction={(trigger, payload) => handleAction(widget, trigger, payload)}
          />
        );
      })}
    </div>
  );
};

// ─── Single Widget Wrapper ───────────────────────────────────────────────────

interface RuntimeWidgetProps {
  widget: WidgetInstance;
  resolvedProps?: Record<string, unknown>;
  alarmState?: import('../../core/types').AlarmState;
  onAction: (trigger: string, payload?: Record<string, unknown>) => void;
}

const RuntimeWidget: React.FC<RuntimeWidgetProps> = React.memo(
  ({ widget, resolvedProps, alarmState, onAction }) => {
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
            Unknown widget: {widget.type}
          </div>
        </div>
      );
    }

    const Renderer = definition.renderer;
    const props = resolvedProps ?? widget.properties;

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
          properties={props}
          width={widget.transform.size.width}
          height={widget.transform.size.height}
          isRuntime={true}
          {...(alarmState ? { alarmState } : {})}
          onAction={onAction}
        />
        {alarmState?.active && <AlarmOverlay severity={alarmState.severity} />}
      </div>
    );
  },
);

RuntimeWidget.displayName = 'RuntimeWidget';
