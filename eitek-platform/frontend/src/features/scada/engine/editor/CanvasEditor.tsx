/**
 * CanvasEditor — The main SCADA editor canvas.
 *
 * Features:
 *   • Drag-and-drop widgets from the palette
 *   • Select, move, resize widgets
 *   • Grid overlay with snap-to-grid
 *   • Zoom and pan
 *   • Widget rendering via the WidgetRegistry (SVG-based)
 */

'use client';

import React, { useCallback, useRef, useState } from 'react';
import { widgetRegistry } from '../../core/registry';
import { useScadaRuntimeStore } from '../../stores/scadaRuntimeStore';
import type { WidgetInstance } from '../../core/types';
import '../../styles/scada.css';

export const CanvasEditor: React.FC = () => {
  const screen = useScadaRuntimeStore((s) => s.screen);
  const selectedWidgetIds = useScadaRuntimeStore((s) => s.selectedWidgetIds);
  const zoom = useScadaRuntimeStore((s) => s.zoom);
  const panOffset = useScadaRuntimeStore((s) => s.panOffset);
  const showGrid = useScadaRuntimeStore((s) => s.showGrid);
  const snapToGrid = useScadaRuntimeStore((s) => s.snapToGrid);
  const gridSize = useScadaRuntimeStore((s) => s.gridSize);

  const addWidget = useScadaRuntimeStore((s) => s.addWidget);
  const selectWidget = useScadaRuntimeStore((s) => s.selectWidget);
  const clearSelection = useScadaRuntimeStore((s) => s.clearSelection);
  const updateWidgetTransform = useScadaRuntimeStore((s) => s.updateWidgetTransform);
  const removeWidgets = useScadaRuntimeStore((s) => s.removeWidgets);
  const duplicateWidgets = useScadaRuntimeStore((s) => s.duplicateWidgets);
  const copySelected = useScadaRuntimeStore((s) => s.copySelected);
  const pasteClipboard = useScadaRuntimeStore((s) => s.pasteClipboard);
  const selectAll = useScadaRuntimeStore((s) => s.selectAll);

  const canvasRef = useRef<HTMLDivElement>(null);
  const [dragState, setDragState] = useState<{
    widgetId: string;
    startX: number;
    startY: number;
    origX: number;
    origY: number;
  } | null>(null);

  // ── Snap helper ──
  const snap = useCallback(
    (v: number) => (snapToGrid ? Math.round(v / gridSize) * gridSize : v),
    [snapToGrid, gridSize],
  );

  // ── Drop handler — add widget from palette ──
  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      const type = e.dataTransfer.getData('widget-type');
      if (!type || !canvasRef.current) return;

      const def = widgetRegistry.get(type);
      if (!def) return;

      const rect = canvasRef.current.getBoundingClientRect();
      const x = snap((e.clientX - rect.left) / zoom - panOffset.x);
      const y = snap((e.clientY - rect.top) / zoom - panOffset.y);

      const newWidget: WidgetInstance = {
        id: `w_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        type,
        name: def.name,
        layerId: screen?.layers[0]?.id ?? 'default',
        transform: {
          position: { x, y },
          size: { ...def.defaultSize },
          rotation: 0,
          zIndex: (screen?.widgets.length ?? 0) + 1,
        },
        properties: buildDefaultProperties(def),
        bindings: [],
        actions: [],
        visible: true,
        locked: false,
      };

      addWidget(newWidget);
      selectWidget(newWidget.id);
    },
    [screen, zoom, panOffset, snap, addWidget, selectWidget],
  );

  // ── Canvas click — deselect ──
  const handleCanvasClick = useCallback(
    (e: React.MouseEvent) => {
      if (e.target === canvasRef.current || (e.target as HTMLElement).classList.contains('scada-canvas-grid')) {
        clearSelection();
      }
    },
    [clearSelection],
  );

  // ── Widget mouse down — start drag ──
  const handleWidgetMouseDown = useCallback(
    (e: React.MouseEvent, widgetId: string) => {
      e.stopPropagation();
      const widget = screen?.widgets.find((w) => w.id === widgetId);
      if (!widget || widget.locked) return;

      selectWidget(widgetId, e.shiftKey || e.ctrlKey);

      setDragState({
        widgetId,
        startX: e.clientX,
        startY: e.clientY,
        origX: widget.transform.position.x,
        origY: widget.transform.position.y,
      });
    },
    [screen, selectWidget],
  );

  // ── Mouse move — drag widget ──
  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!dragState) return;

      const dx = (e.clientX - dragState.startX) / zoom;
      const dy = (e.clientY - dragState.startY) / zoom;

      updateWidgetTransform(dragState.widgetId, {
        position: {
          x: snap(dragState.origX + dx),
          y: snap(dragState.origY + dy),
        },
      });
    },
    [dragState, zoom, snap, updateWidgetTransform],
  );

  // ── Mouse up — end drag ──
  const handleMouseUp = useCallback(() => {
    setDragState(null);
  }, []);

  // ── Keyboard shortcuts ──
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (selectedWidgetIds.length > 0) {
          removeWidgets(selectedWidgetIds);
        }
      }
      if (e.key === 'a' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        selectAll();
      }
      if (e.key === 'c' && (e.ctrlKey || e.metaKey)) {
        copySelected();
      }
      if (e.key === 'v' && (e.ctrlKey || e.metaKey)) {
        pasteClipboard();
      }
      if (e.key === 'd' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        duplicateWidgets(selectedWidgetIds);
      }
    },
    [selectedWidgetIds, removeWidgets, selectAll, copySelected, pasteClipboard, duplicateWidgets],
  );

  if (!screen) {
    return (
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9CA3AF' }}>
        No screen loaded
      </div>
    );
  }

  const { canvasSize, background, widgets } = screen;

  // Background style
  const bgStyle: React.CSSProperties = {
    width: canvasSize.width,
    height: canvasSize.height,
    position: 'relative',
  };
  if (background.type === 'color') {
    bgStyle.background = background.color ?? '#f8fafc';
  } else if (background.type === 'image' && background.imageUrl) {
    bgStyle.backgroundImage = `url(${background.imageUrl})`;
    bgStyle.backgroundSize = background.fit ?? 'cover';
  }

  const sortedWidgets = [...widgets]
    .filter((w) => w.visible !== false)
    .sort((a, b) => a.transform.zIndex - b.transform.zIndex);

  return (
    <div
      ref={canvasRef}
      tabIndex={0}
      style={{
        flex: 1,
        overflow: 'auto',
        position: 'relative',
        outline: 'none',
        cursor: dragState ? 'grabbing' : 'default',
      }}
      onClick={handleCanvasClick}
      onDrop={handleDrop}
      onDragOver={(e) => e.preventDefault()}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onKeyDown={handleKeyDown}
    >
      <div
        className={showGrid ? 'scada-canvas-grid' : undefined}
        style={{
          ...bgStyle,
          transform: `scale(${zoom}) translate(${panOffset.x}px, ${panOffset.y}px)`,
          transformOrigin: '0 0',
        }}
      >
        {sortedWidgets.map((widget) => {
          const def = widgetRegistry.get(widget.type);
          const isSelected = selectedWidgetIds.includes(widget.id);

          return (
            <div
              key={widget.id}
              className={`scada-widget-wrapper scada-widget-wrapper--editing ${isSelected ? 'scada-widget-wrapper--selected' : ''} ${widget.locked ? 'scada-widget-wrapper--locked' : ''}`}
              style={{
                left: widget.transform.position.x,
                top: widget.transform.position.y,
                width: widget.transform.size.width,
                height: widget.transform.size.height,
                transform: widget.transform.rotation ? `rotate(${widget.transform.rotation}deg)` : undefined,
                zIndex: widget.transform.zIndex,
              }}
              onMouseDown={(e) => handleWidgetMouseDown(e, widget.id)}
            >
              {def ? (
                <def.renderer
                  properties={widget.properties}
                  width={widget.transform.size.width}
                  height={widget.transform.size.height}
                  isRuntime={false}
                />
              ) : (
                <div style={{ width: '100%', height: '100%', background: '#fef2f2', border: '1px dashed #fca5a5', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, color: '#ef4444' }}>
                  {widget.type}
                </div>
              )}

              {/* Resize handles (for selected widget) */}
              {isSelected && <ResizeHandles widgetId={widget.id} widget={widget} />}
            </div>
          );
        })}
      </div>
    </div>
  );
};

// ─── Resize Handles ──────────────────────────────────────────────────────────

const ResizeHandles: React.FC<{ widgetId: string; widget: WidgetInstance }> = ({ widgetId, widget }) => {
  const updateWidgetTransform = useScadaRuntimeStore((s) => s.updateWidgetTransform);
  const snapToGrid = useScadaRuntimeStore((s) => s.snapToGrid);
  const gridSize = useScadaRuntimeStore((s) => s.gridSize);
  const zoom = useScadaRuntimeStore((s) => s.zoom);

  const snap = (v: number) => (snapToGrid ? Math.round(v / gridSize) * gridSize : v);

  const handleResize = useCallback(
    (e: React.MouseEvent, corner: string) => {
      e.stopPropagation();
      e.preventDefault();

      const startX = e.clientX;
      const startY = e.clientY;
      const origW = widget.transform.size.width;
      const origH = widget.transform.size.height;
      const origX = widget.transform.position.x;
      const origY = widget.transform.position.y;

      const onMove = (me: MouseEvent) => {
        const dx = (me.clientX - startX) / zoom;
        const dy = (me.clientY - startY) / zoom;

        let newW = origW;
        let newH = origH;
        let newX = origX;
        let newY = origY;

        if (corner.includes('e')) newW = snap(Math.max(20, origW + dx));
        if (corner.includes('s')) newH = snap(Math.max(20, origH + dy));
        if (corner.includes('w')) {
          newW = snap(Math.max(20, origW - dx));
          newX = snap(origX + origW - newW);
        }
        if (corner.includes('n')) {
          newH = snap(Math.max(20, origH - dy));
          newY = snap(origY + origH - newH);
        }

        updateWidgetTransform(widgetId, {
          position: { x: newX, y: newY },
          size: { width: newW, height: newH },
        });
      };

      const onUp = () => {
        document.removeEventListener('mousemove', onMove);
        document.removeEventListener('mouseup', onUp);
      };

      document.addEventListener('mousemove', onMove);
      document.addEventListener('mouseup', onUp);
    },
    [widget, widgetId, zoom, snap, updateWidgetTransform],
  );

  const handleStyle = (cursor: string): React.CSSProperties => ({
    position: 'absolute',
    width: 8,
    height: 8,
    background: '#3B82F6',
    border: '1px solid #fff',
    borderRadius: 2,
    cursor,
    zIndex: 10,
  });

  return (
    <>
      {/* Corners */}
      <div style={{ ...handleStyle('nw-resize'), top: -4, left: -4 }} onMouseDown={(e) => handleResize(e, 'nw')} />
      <div style={{ ...handleStyle('ne-resize'), top: -4, right: -4 }} onMouseDown={(e) => handleResize(e, 'ne')} />
      <div style={{ ...handleStyle('sw-resize'), bottom: -4, left: -4 }} onMouseDown={(e) => handleResize(e, 'sw')} />
      <div style={{ ...handleStyle('se-resize'), bottom: -4, right: -4 }} onMouseDown={(e) => handleResize(e, 'se')} />
      {/* Edges */}
      <div style={{ ...handleStyle('n-resize'), top: -4, left: '50%', marginLeft: -4 }} onMouseDown={(e) => handleResize(e, 'n')} />
      <div style={{ ...handleStyle('s-resize'), bottom: -4, left: '50%', marginLeft: -4 }} onMouseDown={(e) => handleResize(e, 's')} />
      <div style={{ ...handleStyle('w-resize'), top: '50%', left: -4, marginTop: -4 }} onMouseDown={(e) => handleResize(e, 'w')} />
      <div style={{ ...handleStyle('e-resize'), top: '50%', right: -4, marginTop: -4 }} onMouseDown={(e) => handleResize(e, 'e')} />
    </>
  );
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

function buildDefaultProperties(def: import('../../core/types').WidgetDefinition): Record<string, unknown> {
  const props: Record<string, unknown> = {};
  for (const field of def.propSchema) {
    props[field.key] = field.defaultValue;
  }
  return props;
}
