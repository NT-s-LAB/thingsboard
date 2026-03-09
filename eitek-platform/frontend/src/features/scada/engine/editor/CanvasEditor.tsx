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
import type { AlignAction } from '../../stores/scadaRuntimeStore';
import type { WidgetInstance } from '../../core/types';
import '../../styles/scada.css';

/**
 * Generate a unique widget name with auto-incrementing number.
 * E.g., "Button 1", "Button 2", or "Custom Widget 1", "Custom Widget 2"
 */
function generateUniqueWidgetName(baseName: string, existingWidgets: { name: string }[]): string {
  const regex = new RegExp(`^${escapeRegex(baseName)}(?:\\s+(\\d+))?$`, 'i');
  let maxNum = 0;
  
  for (const w of existingWidgets) {
    const match = w.name.match(regex);
    if (match) {
      const num = match[1] ? parseInt(match[1], 10) : 0;
      if (num > maxNum) maxNum = num;
    }
  }
  
  return `${baseName} ${maxNum + 1}`;
}

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

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
  const setZoom = useScadaRuntimeStore((s) => s.setZoom);
  const setPanOffset = useScadaRuntimeStore((s) => s.setPanOffset);
  const undo = useScadaRuntimeStore((s) => s.undo);
  const redo = useScadaRuntimeStore((s) => s.redo);
  const alignWidgets = useScadaRuntimeStore((s) => s.alignWidgets);

  const canvasRef = useRef<HTMLDivElement>(null);
  const [dragState, setDragState] = useState<{
    widgetId: string;
    startX: number;
    startY: number;
    origX: number;
    origY: number;
  } | null>(null);

  // ── Rubber-band (marquee) selection state ──
  const [marquee, setMarquee] = useState<{
    startX: number;
    startY: number;
    currentX: number;
    currentY: number;
  } | null>(null);

  // ── Pan drag state (middle mouse / space + drag) ──
  const [panDrag, setPanDrag] = useState<{
    startX: number;
    startY: number;
    origPanX: number;
    origPanY: number;
  } | null>(null);
  const [spaceHeld, setSpaceHeld] = useState(false);

  // ── Snap helper ──
  const snap = useCallback(
    (v: number) => (snapToGrid ? Math.round(v / gridSize) * gridSize : v),
    [snapToGrid, gridSize],
  );

  // ── Drop handler — add widget from palette or library ──
  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      if (!canvasRef.current) return;

      const rect = canvasRef.current.getBoundingClientRect();
      const x = snap((e.clientX - rect.left - 40) / zoom - panOffset.x);
      const y = snap((e.clientY - rect.top - 40) / zoom - panOffset.y);

      // ── Library widget drop ──
      const libraryData = e.dataTransfer.getData('library-widget-data');
      if (libraryData) {
        try {
          const libWidget = JSON.parse(libraryData) as {
            id: string;
            name: string;
            config?: Record<string, unknown>;
            template?: Record<string, unknown>;
          };
          const cfg = libWidget.config || {};
          const tpl = libWidget.template || {};
          const defW = (cfg.defaultWidth as number) || 120;
          const defH = (cfg.defaultHeight as number) || 80;

          // Build properties from library widget's propSchema + internal fields
          const props: Record<string, unknown> = {
            _libraryId: libWidget.id,
            _libraryName: libWidget.name,
            _svgContent: (tpl.svg as string) || '',
            _imageUrl: (tpl.imageUrl as string) || '',
            label: libWidget.name || '',
            fillColor: '',
            strokeColor: '',
            bgColor: 'transparent',
            labelColor: '#6B7280',
            borderRadius: 0,
            borderWidth: 0,
            borderColor: '#E5E7EB',
            opacity: 1,
          };

          // Merge custom property defaults from config.propSchema
          const schema = (cfg.propSchema as Array<{ key: string; defaultValue?: unknown }>) || [];
          for (const field of schema) {
            if (field.key && !(field.key in props)) {
              props[field.key] = field.defaultValue ?? '';
            }
          }

          const newWidget: WidgetInstance = {
            id: `w_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
            type: 'customWidget',
            name: generateUniqueWidgetName(libWidget.name || 'Custom Widget', screen?.widgets ?? []),
            layerId: screen?.layers[0]?.id ?? 'default',
            transform: {
              position: { x, y },
              size: { width: defW, height: defH },
              rotation: 0,
              zIndex: (screen?.widgets.length ?? 0) + 1,
            },
            properties: props,
            bindings: [],
            actions: [],
            visible: true,
            locked: false,
          };

          addWidget(newWidget);
          selectWidget(newWidget.id);
          return;
        } catch {
          // Fall through to built-in handler
        }
      }

      // ── Built-in widget drop ──
      const type = e.dataTransfer.getData('widget-type');
      if (!type) return;

      const def = widgetRegistry.get(type);
      if (!def) return;

      const newWidget: WidgetInstance = {
        id: `w_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        type,
        name: generateUniqueWidgetName(def.name, screen?.widgets ?? []),
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
      // Don't deselect if we just finished a pan drag
      if (panDrag) return;
      const target = e.target as HTMLElement;
      if (target === canvasRef.current || target.classList.contains('scada-canvas-grid') || target.classList.contains('scada-canvas-frame')) {
        clearSelection();
      }
    },
    [clearSelection, panDrag],
  );

  // ── Canvas mouse down — start rubber-band or pan drag ──
  const handleCanvasMouseDown = useCallback(
    (e: React.MouseEvent) => {
      const target = e.target as HTMLElement;
      const isCanvasBg = target === canvasRef.current
        || target.classList.contains('scada-canvas-grid')
        || target.classList.contains('scada-canvas-frame');
      if (!isCanvasBg) return;

      // Middle mouse button → pan
      if (e.button === 1) {
        e.preventDefault();
        setPanDrag({
          startX: e.clientX,
          startY: e.clientY,
          origPanX: panOffset.x,
          origPanY: panOffset.y,
        });
        return;
      }

      // Space held + left click → pan
      if (spaceHeld && e.button === 0) {
        e.preventDefault();
        setPanDrag({
          startX: e.clientX,
          startY: e.clientY,
          origPanX: panOffset.x,
          origPanY: panOffset.y,
        });
        return;
      }

      if (e.button !== 0) return; // left click only for selection

      const rect = canvasRef.current!.getBoundingClientRect();
      const x = (e.clientX - rect.left - 40) / zoom - panOffset.x;
      const y = (e.clientY - rect.top - 40) / zoom - panOffset.y;

      setMarquee({ startX: x, startY: y, currentX: x, currentY: y });
      if (!e.shiftKey && !e.ctrlKey) {
        clearSelection();
      }
    },
    [zoom, panOffset, clearSelection, spaceHeld],
  );

  // ── Widget mouse down — start drag ──
  const handleWidgetMouseDown = useCallback(
    (e: React.MouseEvent, widgetId: string) => {
      e.stopPropagation();
      if (spaceHeld) return; // don't pick up widgets while space-panning
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
    [screen, selectWidget, spaceHeld],
  );

  // ── Mouse move — drag widget, update marquee, or pan ──
  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (panDrag) {
        const dx = (e.clientX - panDrag.startX) / zoom;
        const dy = (e.clientY - panDrag.startY) / zoom;
        setPanOffset({ x: panDrag.origPanX + dx, y: panDrag.origPanY + dy });
        return;
      }
      if (dragState) {
        const dx = (e.clientX - dragState.startX) / zoom;
        const dy = (e.clientY - dragState.startY) / zoom;

        updateWidgetTransform(dragState.widgetId, {
          position: {
            x: snap(dragState.origX + dx),
            y: snap(dragState.origY + dy),
          },
        });
      } else if (marquee && canvasRef.current) {
        const rect = canvasRef.current.getBoundingClientRect();
        const x = (e.clientX - rect.left - 40) / zoom - panOffset.x;
        const y = (e.clientY - rect.top - 40) / zoom - panOffset.y;
        setMarquee((prev) => prev ? { ...prev, currentX: x, currentY: y } : null);
      }
    },
    [dragState, marquee, panDrag, zoom, panOffset, snap, updateWidgetTransform, setPanOffset],
  );

  // ── Mouse up — end drag, marquee, or pan ──
  const handleMouseUp = useCallback((e?: React.MouseEvent) => {
    void e; // used for type signature only
    if (panDrag) {
      setPanDrag(null);
      return;
    }
    if (marquee && screen) {
      const x1 = Math.min(marquee.startX, marquee.currentX);
      const y1 = Math.min(marquee.startY, marquee.currentY);
      const x2 = Math.max(marquee.startX, marquee.currentX);
      const y2 = Math.max(marquee.startY, marquee.currentY);

      if (Math.abs(x2 - x1) > 5 || Math.abs(y2 - y1) > 5) {
        for (const w of screen.widgets) {
          if (w.locked || w.visible === false) continue;
          const wx = w.transform.position.x;
          const wy = w.transform.position.y;
          const wr = wx + w.transform.size.width;
          const wb = wy + w.transform.size.height;

          if (wx < x2 && wr > x1 && wy < y2 && wb > y1) {
            selectWidget(w.id, true);
          }
        }
      }
      setMarquee(null);
    }
    setDragState(null);
  }, [marquee, panDrag, screen, selectWidget]);

  // ── Wheel — zoom towards cursor (Ctrl+Wheel) or pan (Wheel) ──
  const handleWheel = useCallback(
    (e: React.WheelEvent) => {
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        const rect = canvasRef.current?.getBoundingClientRect();
        if (!rect) return;
        // Mouse position relative to canvas container (minus padding)
        const mx = e.clientX - rect.left - 40;
        const my = e.clientY - rect.top - 40;
        // Mouse pos in world coords before zoom
        const wxBefore = mx / zoom - panOffset.x;
        const wyBefore = my / zoom - panOffset.y;

        const delta = e.deltaY > 0 ? -0.1 : 0.1;
        const newZoom = Math.max(0.1, Math.min(5, zoom + delta));

        // Adjust pan so the world point under cursor stays put
        const newPanX = mx / newZoom - wxBefore;
        const newPanY = my / newZoom - wyBefore;

        setZoom(newZoom);
        setPanOffset({ x: newPanX, y: newPanY });
      } else {
        // Scroll to pan
        setPanOffset({
          x: panOffset.x - e.deltaX / zoom,
          y: panOffset.y - e.deltaY / zoom,
        });
      }
    },
    [zoom, panOffset, setZoom, setPanOffset],
  );

  // ── Keyboard shortcuts ──
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      // Space for pan mode
      if (e.key === ' ' && !e.repeat) {
        e.preventDefault();
        setSpaceHeld(true);
        return;
      }
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
      if (e.key === 'z' && (e.ctrlKey || e.metaKey) && !e.shiftKey) {
        e.preventDefault();
        undo();
      }
      if ((e.key === 'z' && (e.ctrlKey || e.metaKey) && e.shiftKey) || (e.key === 'y' && (e.ctrlKey || e.metaKey))) {
        e.preventDefault();
        redo();
      }
      // Zoom shortcuts: +/- keys
      if (e.key === '=' || e.key === '+') {
        if (e.ctrlKey || e.metaKey) { e.preventDefault(); setZoom(zoom + 0.1); }
      }
      if (e.key === '-') {
        if (e.ctrlKey || e.metaKey) { e.preventDefault(); setZoom(zoom - 0.1); }
      }
      if (e.key === '0' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        setZoom(1);
        setPanOffset({ x: 0, y: 0 });
      }
    },
    [selectedWidgetIds, removeWidgets, selectAll, copySelected, pasteClipboard, duplicateWidgets, undo, redo, zoom, setZoom, setPanOffset],
  );

  const handleKeyUp = useCallback((e: React.KeyboardEvent) => {
    if (e.key === ' ') {
      setSpaceHeld(false);
    }
  }, []);

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
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {/* Alignment toolbar — shown when 2+ widgets selected */}
      {selectedWidgetIds.length >= 2 && (
        <AlignmentToolbar onAlign={alignWidgets} />
      )}

      <div
        ref={canvasRef}
        tabIndex={0}
        style={{
          flex: 1,
          overflow: 'auto',
          position: 'relative',
          outline: 'none',
          background: '#e5e7eb',
          padding: 40,
          cursor: panDrag ? 'grabbing' : spaceHeld ? 'grab' : dragState ? 'grabbing' : marquee ? 'crosshair' : 'default',
        }}
        onClick={handleCanvasClick}
        onMouseDown={handleCanvasMouseDown}
        onDrop={handleDrop}
        onDragOver={(e) => e.preventDefault()}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onKeyDown={handleKeyDown}
        onKeyUp={handleKeyUp}
        onWheel={handleWheel}
      >
      <div
        className={`scada-canvas-frame${showGrid ? ' scada-canvas-grid' : ''}`}
        style={{
          ...bgStyle,
          transform: `scale(${zoom}) translate(${panOffset.x}px, ${panOffset.y}px)`,
          transformOrigin: '0 0',
        }}
      >
        {sortedWidgets.map((widget) => {
          const def = widgetRegistry.get(widget.type);
          const isSelected = selectedWidgetIds.includes(widget.id);
          const wp = widget.properties;

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
                opacity: wp._opacity != null ? Number(wp._opacity) : undefined,
                border: wp._borderWidth ? `${wp._borderWidth}px solid ${wp._borderColor ?? '#000'}` : undefined,
                borderRadius: wp._borderRadius ? `${wp._borderRadius}px` : undefined,
                backgroundColor: wp._bgColor ? String(wp._bgColor) : undefined,
                backgroundImage: wp._bgImage ? `url(${wp._bgImage})` : undefined,
                backgroundSize: wp._bgImage ? 'cover' : undefined,
                backgroundPosition: wp._bgImage ? 'center' : undefined,
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

        {/* Rubber-band / marquee selection overlay */}
        {marquee && (
          <div
            style={{
              position: 'absolute',
              left: Math.min(marquee.startX, marquee.currentX),
              top: Math.min(marquee.startY, marquee.currentY),
              width: Math.abs(marquee.currentX - marquee.startX),
              height: Math.abs(marquee.currentY - marquee.startY),
              border: '1px dashed #3B82F6',
              background: 'rgba(59, 130, 246, 0.08)',
              pointerEvents: 'none',
              zIndex: 9999,
            }}
          />
        )}
      </div>
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

// ─── Alignment Toolbar ────────────────────────────────────────────────────────

const ALIGN_BUTTONS: { action: AlignAction; label: string; title: string }[] = [
  { action: 'left', label: '⫷', title: 'Align Left' },
  { action: 'centerH', label: '⫿', title: 'Center Horizontal' },
  { action: 'right', label: '⫸', title: 'Align Right' },
  { action: 'top', label: '⊤', title: 'Align Top' },
  { action: 'centerV', label: '⊡', title: 'Center Vertical' },
  { action: 'bottom', label: '⊥', title: 'Align Bottom' },
  { action: 'distributeH', label: '⋯', title: 'Distribute Horizontally' },
  { action: 'distributeV', label: '⋮', title: 'Distribute Vertically' },
];

const AlignmentToolbar: React.FC<{ onAlign: (action: AlignAction) => void }> = ({ onAlign }) => (
  <div
    style={{
      display: 'flex',
      alignItems: 'center',
      gap: 4,
      padding: '4px 8px',
      borderBottom: '1px solid #e5e7eb',
      background: '#f0f9ff',
      fontSize: 11,
      flexShrink: 0,
    }}
  >
    <span style={{ color: '#6B7280', marginRight: 4, fontSize: 10 }}>Align:</span>
    {ALIGN_BUTTONS.map((btn) => (
      <button
        key={btn.action}
        onClick={() => onAlign(btn.action)}
        title={btn.title}
        style={{
          padding: '2px 6px',
          border: '1px solid #d1d5db',
          borderRadius: 3,
          background: '#fff',
          cursor: 'pointer',
          fontSize: 12,
          lineHeight: 1,
        }}
      >
        {btn.label}
      </button>
    ))}
  </div>
);
