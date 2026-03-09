/**
 * WindowOverlay — Renders overlay/popup windows in SCADA runtime.
 *
 * When a button navigates to a window, it gets pushed onto `openWindowIds`.
 * This component renders each open window as a centered modal overlay with
 * its own widgets, background, and canvas size.
 */

'use client';

import React, { useCallback, useMemo } from 'react';
import { useScadaRuntimeStore } from '../../stores/scadaRuntimeStore';
import { widgetRegistry } from '../../core/registry';
import type { ScadaWindow, WidgetInstance } from '../../core/types';
import '../../styles/scada.css';

export const WindowOverlay: React.FC = () => {
  const screen = useScadaRuntimeStore((s) => s.screen);
  const openWindowIds = useScadaRuntimeStore((s) => s.openWindowIds);
  const closeOverlayWindow = useScadaRuntimeStore((s) => s.closeOverlayWindow);

  const openWindows = useMemo(() => {
    if (!screen?.windows) return [];
    return openWindowIds
      .map((id) => screen.windows!.find((w) => w.id === id))
      .filter(Boolean) as ScadaWindow[];
  }, [screen?.windows, openWindowIds]);

  if (openWindows.length === 0) return null;

  return (
    <>
      {openWindows.map((win, index) => (
        <SingleWindowOverlay
          key={win.id}
          window={win}
          zIndex={9000 + index}
          onClose={() => closeOverlayWindow(win.id)}
        />
      ))}
    </>
  );
};

// ─── Single Overlay Window ───────────────────────────────────────────────────

const SingleWindowOverlay: React.FC<{
  window: ScadaWindow;
  zIndex: number;
  onClose: () => void;
}> = ({ window: win, zIndex, onClose }) => {
  const setVariable = useScadaRuntimeStore((s) => s.setVariable);
  const navigateToWindow = useScadaRuntimeStore((s) => s.navigateToWindow);

  const handleAction = useCallback(
    (widget: WidgetInstance, trigger: string) => {
      const action = widget.actions.find((a) => a.trigger === trigger);
      if (!action) return;
      if (action.actionType === 'navigate' && action.config.targetWindowId) {
        navigateToWindow(action.config.targetWindowId);
      } else if (action.actionType === 'setVariable' && action.config.variableName) {
        setVariable(action.config.variableName, action.config.variableValue);
      }
    },
    [setVariable, navigateToWindow],
  );

  const bgStyle: React.CSSProperties = {
    width: win.canvasSize.width,
    height: win.canvasSize.height,
  };
  if (win.background.type === 'color') {
    bgStyle.background = win.background.color ?? '#ffffff';
  } else if (win.background.type === 'image' && win.background.imageUrl) {
    bgStyle.backgroundImage = `url(${win.background.imageUrl})`;
    bgStyle.backgroundSize = win.background.fit ?? 'cover';
    bgStyle.backgroundPosition = 'center';
  }

  const visibleLayerIds = new Set(
    win.layers.filter((l) => l.visible).map((l) => l.id),
  );

  const sortedWidgets = [...win.widgets]
    .filter((w) => w.visible !== false && visibleLayerIds.has(w.layerId))
    .sort((a, b) => a.transform.zIndex - b.transform.zIndex);

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
        // Close when clicking backdrop
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        style={{
          position: 'relative',
          maxWidth: '90vw',
          maxHeight: '90vh',
          overflow: 'auto',
          borderRadius: 12,
          boxShadow: '0 25px 50px rgba(0,0,0,0.25)',
          border: '1px solid rgba(255,255,255,0.1)',
        }}
      >
        {/* Title bar */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '8px 12px',
            background: 'rgba(15,23,42,0.95)',
            borderTopLeftRadius: 12,
            borderTopRightRadius: 12,
            borderBottom: '1px solid rgba(255,255,255,0.08)',
          }}
        >
          <span style={{ color: '#e2e8f0', fontSize: 12, fontWeight: 600 }}>
            {win.name}
          </span>
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
            title="Close"
          >
            ×
          </button>
        </div>

        {/* Canvas */}
        <div style={{ position: 'relative', ...bgStyle, overflow: 'hidden' }}>
          {sortedWidgets.map((widget) => {
            const definition = widgetRegistry.get(widget.type);
            if (!definition) return null;
            const Renderer = definition.renderer;
            return (
              <div
                key={widget.id}
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
                  properties={widget.properties}
                  width={widget.transform.size.width}
                  height={widget.transform.size.height}
                  isRuntime={true}
                  onAction={(trigger: string) =>
                    handleAction(widget, trigger)
                  }
                />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
