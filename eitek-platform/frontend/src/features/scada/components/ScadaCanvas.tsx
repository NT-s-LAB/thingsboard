/**
 * @deprecated V1 SCADA — This file belongs to the legacy V1 engine (Konva-based).
 * Replaced by V2 engine in /engine/ and /core/. Scheduled for removal.
 */
'use client';

import React, { useRef, useEffect, useState, useCallback, useMemo } from 'react';
import { Stage, Layer, Rect, Circle, Line, Text, Group, Transformer, Arc, Arrow, Ellipse, Image as KImage } from 'react-konva';
import Konva from 'konva';
import { useScadaStore } from '../stores/scadaStore';
import type { Widget } from '../types';

interface ScadaCanvasProps {
  width: number;
  height: number;
}

/* ────── Color helpers ────── */
const VARIANT_COLORS: Record<string, string> = {
  primary: '#3B82F6', secondary: '#6B7280', success: '#22C55E', warning: '#F59E0B', danger: '#EF4444',
};

/* ────── Resolve binding value from realtimeData ────── */
function resolveBindingValue(
  widget: Widget,
  realtimeData: Record<string, any>,
  key?: string,
): any {
  for (const b of widget.dataBindings ?? []) {
    if (b.type === 'static') return b.staticValue ?? b.defaultValue;
    if (
      (b.type === 'telemetry' || b.type === 'attribute') &&
      b.entityId &&
      (b.telemetryKey || b.attributeKey)
    ) {
      const deviceData = realtimeData[b.entityId];
      if (!deviceData) continue;
      const bKey = b.telemetryKey || b.attributeKey;
      if (key && bKey !== key) continue;
      if (bKey && deviceData[bKey] !== undefined) return deviceData[bKey];
    }
  }
  return undefined;
}

/* ────── Resolve + format binding value with decimals/unit/prefix/suffix ────── */
function resolveFormattedValue(
  widget: Widget,
  realtimeData: Record<string, any>,
): string | undefined {
  for (const b of widget.dataBindings ?? []) {
    let raw: any;

    if (b.type === 'static') {
      raw = b.staticValue ?? b.defaultValue;
    } else if (
      (b.type === 'telemetry' || b.type === 'attribute') &&
      b.entityId &&
      (b.telemetryKey || b.attributeKey)
    ) {
      const deviceData = realtimeData[b.entityId];
      if (!deviceData) continue;
      const bKey = b.telemetryKey || b.attributeKey;
      if (bKey && deviceData[bKey] !== undefined) {
        raw = deviceData[bKey];
      } else {
        continue;
      }
    } else {
      continue;
    }

    if (raw === undefined || raw === null) {
      return b.defaultValue != null ? String(b.defaultValue) : undefined;
    }

    // Apply format from binding
    const fmt = b.format;
    const num = Number(raw);
    let display = isNaN(num) ? String(raw) : num.toFixed(fmt?.decimals ?? 2);
    const prefix = fmt?.prefix || '';
    const suffix = fmt?.suffix || '';
    const unit = fmt?.unit ? ` ${fmt.unit}` : '';
    return `${prefix}${display}${suffix}${unit}`;
  }
  return undefined;
}

export const ScadaCanvas: React.FC<ScadaCanvasProps> = ({ width, height }) => {
  const stageRef = useRef<Konva.Stage>(null);
  const transformerRef = useRef<Konva.Transformer>(null);

  /* ── Granular store selectors — avoid full re-render on any state change ── */
  const currentDashboard = useScadaStore(s => s.currentDashboard);
  const editorState = useScadaStore(s => s.editorState);
  const isRuntimeMode = useScadaStore(s => s.isRuntimeMode);
  const realtimeData = useScadaStore(s => s.realtimeData);
  const selectWidget = useScadaStore(s => s.selectWidget);
  const selectWidgets = useScadaStore(s => s.selectWidgets);
  const clearSelection = useScadaStore(s => s.clearSelection);
  const moveWidget = useScadaStore(s => s.moveWidget);
  const resizeWidget = useScadaStore(s => s.resizeWidget);
  const setViewport = useScadaStore(s => s.setViewport);
  const deleteWidget = useScadaStore(s => s.deleteWidget);
  const duplicateWidget = useScadaStore(s => s.duplicateWidget);
  const copyWidgets = useScadaStore(s => s.copyWidgets);
  const cutWidgets = useScadaStore(s => s.cutWidgets);
  const pasteWidgets = useScadaStore(s => s.pasteWidgets);
  const undo = useScadaStore(s => s.undo);
  const redo = useScadaStore(s => s.redo);

  const [selectedShapes, setSelectedShapes] = useState<string[]>([]);

  /* ── Rubber-band / marquee selection state ── */
  const [selectionRect, setSelectionRect] = useState<{ x: number; y: number; width: number; height: number } | null>(null);
  const isSelecting = useRef(false);
  const selectionStartPt = useRef({ x: 0, y: 0 });

  /* ── Image cache for widgets with onImageUrl / offImageUrl ── */
  const [loadedImages, setLoadedImages] = useState<Record<string, HTMLImageElement>>({});
  const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001';

  /** Resolve image URL: handles full URLs, /uploads/ paths, and bare filenames */
  const resolveImageUrl = (raw: string): string => {
    if (!raw) return raw;
    if (raw.startsWith('http://') || raw.startsWith('https://') || raw.startsWith('data:')) return raw;
    if (raw.startsWith('/')) return `${API_BASE}${raw}`;
    // Bare filename (e.g. "abc.png") — assume /uploads/ prefix
    return `${API_BASE}/uploads/${raw}`;
  };

  useEffect(() => {
    const widgets: Widget[] = (currentDashboard as any)?.widgets ?? (currentDashboard as any)?.scadaWidgets ?? [];
    const urls = new Set<string>();
    for (const w of widgets) {
      const p = w.properties as Record<string, any>;
      if (p?.onImageUrl) urls.add(p.onImageUrl as string);
      if (p?.offImageUrl) urls.add(p.offImageUrl as string);
    }
    // Load any new URLs not already cached
    for (const url of Array.from(urls)) {
      if (loadedImages[url]) continue;
      const img = new window.Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        setLoadedImages((prev) => ({ ...prev, [url]: img }));
      };
      img.onerror = () => { /* silently skip failed images */ };
      img.src = resolveImageUrl(url);
    }
  }, [currentDashboard]);


  /* ── Keyboard shortcuts ── */
  useEffect(() => {
    if (isRuntimeMode) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore shortcuts when typing in inputs
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || (e.target as HTMLElement)?.isContentEditable) return;

      const ids = editorState?.selection?.selectedWidgetIds ?? [];
      const ctrl = e.ctrlKey || e.metaKey;

      switch (e.key) {
        case 'Delete':
        case 'Backspace': {
          if (ids.length > 0) {
            e.preventDefault();
            ids.forEach((id) => deleteWidget(id));
          }
          break;
        }
        case 'c':
          if (ctrl && ids.length > 0) { e.preventDefault(); copyWidgets(ids); }
          break;
        case 'x':
          if (ctrl && ids.length > 0) { e.preventDefault(); cutWidgets(ids); }
          break;
        case 'v':
          if (ctrl) { e.preventDefault(); pasteWidgets(); }
          break;
        case 'd':
          if (ctrl && ids.length > 0) {
            e.preventDefault();
            ids.forEach((id) => duplicateWidget(id));
          }
          break;
        case 'z':
          if (ctrl && e.shiftKey) { e.preventDefault(); redo(); }
          else if (ctrl) { e.preventDefault(); undo(); }
          break;
        case 'y':
          if (ctrl) { e.preventDefault(); redo(); }
          break;
        case 'a':
          if (ctrl) {
            e.preventDefault();
            const widgets: Widget[] = (currentDashboard as any)?.widgets ?? [];
            selectWidgets(widgets.map((w) => w.id));
          }
          break;
        case 'Escape':
          clearSelection();
          break;
        case 'ArrowUp': {
          if (ids.length > 0) {
            e.preventDefault();
            const step = e.shiftKey ? 10 : 1;
            const widgets: Widget[] = (currentDashboard as any)?.widgets ?? [];
            ids.forEach((id) => {
              const w = widgets.find((w) => w.id === id);
              if (w) moveWidget(id, { x: w.transform.position.x, y: w.transform.position.y - step });
            });
          }
          break;
        }
        case 'ArrowDown': {
          if (ids.length > 0) {
            e.preventDefault();
            const step = e.shiftKey ? 10 : 1;
            const widgets: Widget[] = (currentDashboard as any)?.widgets ?? [];
            ids.forEach((id) => {
              const w = widgets.find((w) => w.id === id);
              if (w) moveWidget(id, { x: w.transform.position.x, y: w.transform.position.y + step });
            });
          }
          break;
        }
        case 'ArrowLeft': {
          if (ids.length > 0) {
            e.preventDefault();
            const step = e.shiftKey ? 10 : 1;
            const widgets: Widget[] = (currentDashboard as any)?.widgets ?? [];
            ids.forEach((id) => {
              const w = widgets.find((w) => w.id === id);
              if (w) moveWidget(id, { x: w.transform.position.x - step, y: w.transform.position.y });
            });
          }
          break;
        }
        case 'ArrowRight': {
          if (ids.length > 0) {
            e.preventDefault();
            const step = e.shiftKey ? 10 : 1;
            const widgets: Widget[] = (currentDashboard as any)?.widgets ?? [];
            ids.forEach((id) => {
              const w = widgets.find((w) => w.id === id);
              if (w) moveWidget(id, { x: w.transform.position.x + step, y: w.transform.position.y });
            });
          }
          break;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isRuntimeMode, editorState?.selection?.selectedWidgetIds, currentDashboard, clearSelection, deleteWidget, duplicateWidget, copyWidgets, cutWidgets, pasteWidgets, undo, redo, moveWidget, selectWidgets]);

  /* ── Viewport / zoom / pan ── */
  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;

    // In runtime mode: no zoom, no pan — fixed viewport only
    if (isRuntimeMode) {
      stage.on('wheel', (e) => { e.evt.preventDefault(); });
      return () => { stage.off('wheel'); };
    }

    const updateViewport = () => {
      const pos = stage.position();
      const scale = stage.scaleX();
      setViewport({
        position: { x: -pos.x / scale, y: -pos.y / scale },
        zoom: scale,
        size: { width: width / scale, height: height / scale },
      });
    };

    stage.on('dragend', updateViewport);
    stage.on('wheel', (e) => {
      e.evt.preventDefault();
      const scaleBy = 1.08;
      const old = stage.scaleX();
      const ptr = stage.getPointerPosition()!;
      const mp = { x: (ptr.x - stage.x()) / old, y: (ptr.y - stage.y()) / old };
      const ns = Math.max(0.1, Math.min(5, e.evt.deltaY > 0 ? old * scaleBy : old / scaleBy));
      stage.scale({ x: ns, y: ns });
      stage.position({ x: ptr.x - mp.x * ns, y: ptr.y - mp.y * ns });
      updateViewport();
    });

    return () => { stage.off('dragend'); stage.off('wheel'); };
  }, [width, height, setViewport, isRuntimeMode]);

  /* ── Transformer sync ── */
  useEffect(() => {
    const tr = transformerRef.current;
    if (!tr) return;
    if (selectedShapes.length > 0) {
      const s = stageRef.current;
      if (!s) return;
      const nodes = selectedShapes.map((id) => s.findOne(`#${id}`)).filter((n): n is Konva.Node => n != null);
      tr.nodes(nodes);
      tr.getLayer()?.batchDraw();
    } else {
      tr.nodes([]);
    }
  }, [selectedShapes]);

  useEffect(() => {
    setSelectedShapes(editorState?.selection?.selectedWidgetIds ?? []);
  }, [editorState?.selection?.selectedWidgetIds]);

  /* ── Event handlers (stable references via useCallback) ── */
  const handleStageClick = useCallback((e: any) => {
    if (isRuntimeMode) return;
    if (e.target === e.target.getStage()) clearSelection();
  }, [isRuntimeMode, clearSelection]);

  const handleShapeClick = useCallback((widgetId: string, e: any) => {
    if (isRuntimeMode) return;
    e.cancelBubble = true;
    if (e.evt.ctrlKey || e.evt.metaKey) {
      const cur = [...(useScadaStore.getState().editorState?.selection?.selectedWidgetIds ?? [])];
      const idx = cur.indexOf(widgetId);
      if (idx === -1) cur.push(widgetId); else cur.splice(idx, 1);
      selectWidgets(cur);
    } else {
      selectWidget(widgetId);
    }
  }, [isRuntimeMode, selectWidget, selectWidgets]);

  const handleDragMove = useCallback((e: any) => {
    if (isRuntimeMode) return;
    const state = useScadaStore.getState();
    const snapEnabled = state.editorState?.snapToGrid;
    if (!snapEnabled) return;
    const settings = state.currentDashboard?.settings as any;
    const gridSize = settings?.grid?.size || 20;
    const n = e.target;
    n.x(Math.round(n.x() / gridSize) * gridSize);
    n.y(Math.round(n.y() / gridSize) * gridSize);
  }, [isRuntimeMode]);

  const handleDragEnd = useCallback((widgetId: string, e: any) => {
    if (isRuntimeMode) return;
    const n = e.target;
    moveWidget(widgetId, { x: n.x(), y: n.y() });
  }, [isRuntimeMode, moveWidget]);

  const handleTransformEnd = useCallback((e: any) => {
    if (isRuntimeMode) return;
    const n = e.target;
    const sx = n.scaleX();
    const sy = n.scaleY();
    n.scaleX(1);
    n.scaleY(1);
    const wid = n.id();
    if (wid) {
      moveWidget(wid, { x: n.x(), y: n.y() });
      resizeWidget(wid, { width: Math.max(10, n.width() * sx), height: Math.max(10, n.height() * sy) });
    }
  }, [isRuntimeMode, moveWidget, resizeWidget]);

  /* ── Rubber-band / marquee selection handlers ── */
  const handleStageMouseDown = useCallback((e: any) => {
    if (isRuntimeMode) return;
    // Only start selection on empty stage (not on a widget)
    if (e.target !== e.target.getStage()) return;
    const stage = stageRef.current;
    if (!stage) return;
    const pos = stage.getPointerPosition();
    if (!pos) return;
    const scale = stage.scaleX();
    const stagePos = stage.position();
    // Convert to canvas coordinates
    const canvasX = (pos.x - stagePos.x) / scale;
    const canvasY = (pos.y - stagePos.y) / scale;
    isSelecting.current = true;
    selectionStartPt.current = { x: canvasX, y: canvasY };
    setSelectionRect({ x: canvasX, y: canvasY, width: 0, height: 0 });
  }, [isRuntimeMode]);

  const handleStageMouseMove = useCallback((_e: any) => {
    if (!isSelecting.current) return;
    const stage = stageRef.current;
    if (!stage) return;
    const pos = stage.getPointerPosition();
    if (!pos) return;
    const scale = stage.scaleX();
    const stagePos = stage.position();
    const canvasX = (pos.x - stagePos.x) / scale;
    const canvasY = (pos.y - stagePos.y) / scale;
    const sx = selectionStartPt.current.x;
    const sy = selectionStartPt.current.y;
    setSelectionRect({
      x: Math.min(sx, canvasX),
      y: Math.min(sy, canvasY),
      width: Math.abs(canvasX - sx),
      height: Math.abs(canvasY - sy),
    });
  }, []);

  const handleStageMouseUp = useCallback(() => {
    if (!isSelecting.current) return;
    isSelecting.current = false;
    const rect = selectionRect;
    setSelectionRect(null);
    if (!rect || (rect.width < 5 && rect.height < 5)) return; // Too small, treat as click
    // Find widgets intersecting the selection rectangle
    const state = useScadaStore.getState();
    const widgets: Widget[] = (state.currentDashboard as any)?.widgets ?? [];
    const intersecting = widgets.filter((w: Widget) => {
      if (w.visible === false) return false;
      const wx = w.transform.position.x;
      const wy = w.transform.position.y;
      const ww = w.transform.size.width;
      const wh = w.transform.size.height;
      return !(wx + ww < rect.x || wx > rect.x + rect.width || wy + wh < rect.y || wy > rect.y + rect.height);
    });
    if (intersecting.length > 0) {
      selectWidgets(intersecting.map(w => w.id));
    }
  }, [selectionRect, selectWidgets]);

  /* ════════════════════════════════════════════════════
     Widget Renderers
     ════════════════════════════════════════════════════ */

  const commonProps = useCallback((w: Widget) => ({
    id: w.id,
    x: w.transform.position.x,
    y: w.transform.position.y,
    width: w.transform.size.width,
    height: w.transform.size.height,
    rotation: w.transform.rotation || 0,
    draggable: !isRuntimeMode && !w.locked,
    onClick: (e: any) => handleShapeClick(w.id, e),
    onDragMove: handleDragMove,
    onDragEnd: (e: any) => handleDragEnd(w.id, e),
    onTransformEnd: handleTransformEnd,
    opacity: w.style.opacity ?? 1,
  }), [isRuntimeMode, handleShapeClick, handleDragMove, handleDragEnd, handleTransformEnd]);

  const renderWidget = (w: Widget) => {
    const cp = commonProps(w);
    const p: Record<string, any> = w.properties || {};
    const s: Record<string, any> = w.style || {};
    const W = w.transform.size.width;
    const H = w.transform.size.height;

    switch (w.type) {
      /* ── Button ── */
      case 'button': {
        const bg = VARIANT_COLORS[p.variant] || s.backgroundColor || '#3B82F6';
        return (
          <Group key={w.id} {...cp}>
            <Rect width={W} height={H} fill={bg} stroke={s.borderColor || bg} strokeWidth={s.borderWidth || 1} cornerRadius={s.borderRadius ?? 6} shadowBlur={2} shadowColor="rgba(0,0,0,0.15)" shadowOffsetY={1} />
            <Text text={p.icon ? `${p.icon} ${p.text || 'Button'}` : (p.text || 'Button')} fontSize={s.fontSize || 13} fontFamily={s.fontFamily || 'Arial'} fontStyle={s.fontWeight === 'bold' ? 'bold' : 'normal'} fill={s.textColor || '#FFF'} align="center" verticalAlign="middle" width={W} height={H} />
          </Group>
        );
      }

      /* ── Text ── */
      case 'text': {
        let displayText = p.text || 'Text';
        if (isRuntimeMode && (w.dataBindings?.length ?? 0) > 0) {
          // If telemetryPattern is set, replace ${key} placeholders
          if (p.telemetryPattern) {
            displayText = p.telemetryPattern.replace(/\$\{(\w+)\}/g, (_: string, key: string) => {
              const val = resolveBindingValue(w, realtimeData, key);
              if (val === undefined || val === null) return '---';
              const num = Number(val);
              return isNaN(num) ? String(val) : num.toFixed(p.decimals ?? 2);
            });
          } else {
            // Use formatted binding value directly
            const formatted = resolveFormattedValue(w, realtimeData);
            if (formatted !== undefined) displayText = formatted;
          }
        }
        return (
          <Group key={w.id} {...cp}>
            {s.backgroundColor && <Rect width={W} height={H} fill={s.backgroundColor} cornerRadius={s.borderRadius || 0} />}
            <Text text={displayText} fontSize={s.fontSize || 14} fontFamily={s.fontFamily || 'Arial'} fontStyle={`${s.fontWeight === 'bold' ? 'bold ' : ''}${s.fontStyle === 'italic' ? 'italic' : ''}`} fill={s.textColor || '#1F2937'} align={s.textAlign || 'left'} verticalAlign="middle" width={W} height={H} wrap={p.wordWrap ? 'word' : 'none'} />
          </Group>
        );
      }

      /* ── Shape ── */
      case 'shape': {
        const fillClr = p.fill ? (p.fillColor || '#E5E7EB') : 'transparent';
        const strokeClr = p.strokeColor || '#374151';
        const strokeW = p.strokeWidth ?? 1;
        const dash = p.strokeStyle === 'dashed' ? [8, 4] : p.strokeStyle === 'dotted' ? [2, 4] : undefined;
        if (p.shape === 'circle') {
          const r = Math.min(W, H) / 2;
          return <Circle key={w.id} {...cp} x={cp.x + r} y={cp.y + r} radius={r} fill={fillClr} stroke={strokeClr} strokeWidth={strokeW} {...(dash ? { dash } : {})} />;
        }
        if (p.shape === 'ellipse') {
          return <Ellipse key={w.id} {...cp} x={cp.x + W / 2} y={cp.y + H / 2} radiusX={W / 2} radiusY={H / 2} fill={fillClr} stroke={strokeClr} strokeWidth={strokeW} {...(dash ? { dash } : {})} />;
        }
        if (p.shape === 'line') {
          return <Line key={w.id} {...cp} points={[0, 0, W, H]} stroke={strokeClr} strokeWidth={strokeW} {...(dash ? { dash } : {})} />;
        }
        if (p.shape === 'arrow') {
          return <Arrow key={w.id} {...cp} points={[0, H / 2, W, H / 2]} stroke={strokeClr} strokeWidth={strokeW} fill={strokeClr} pointerLength={10} pointerWidth={8} />;
        }
        return <Rect key={w.id} {...cp} fill={fillClr} stroke={strokeClr} strokeWidth={strokeW} cornerRadius={s.borderRadius || 0} {...(dash ? { dash } : {})} />;
      }

      /* ── Gauge ── */
      case 'gauge': {
        const cx = W / 2, cy = H / 2;
        const r = Math.min(W, H) / 2 - 8;
        const rtVal = isRuntimeMode ? resolveBindingValue(w, realtimeData) : undefined;
        const val = rtVal !== undefined ? Number(rtVal) : (p.value ?? 0);
        const min = p.min ?? 0, max = p.max ?? 100;
        const pct = Math.max(0, Math.min(1, (val - min) / (max - min || 1)));
        const angle = -135 + pct * 270;
        const rad = (angle * Math.PI) / 180;
        const needleLen = r * 0.75;
        return (
          <Group key={w.id} {...cp}>
            {/* Background arc */}
            <Arc x={cx} y={cy} innerRadius={r - 8} outerRadius={r} angle={270} rotation={135} fill="#E5E7EB" />
            {/* Value arc */}
            <Arc x={cx} y={cy} innerRadius={r - 8} outerRadius={r} angle={pct * 270} rotation={135} fill={getGaugeColor(pct, p.ranges)} />
            {/* Needle */}
            <Line points={[cx, cy, cx + Math.cos(rad) * needleLen, cy + Math.sin(rad) * needleLen]} stroke={p.needle?.color || '#1F2937'} strokeWidth={p.needle?.width || 2} />
            <Circle x={cx} y={cy} radius={4} fill="#1F2937" />
            {/* Value text */}
            {(p.showValue ?? true) && (
              <Text text={`${val}${p.unit || ''}`} fontSize={s.fontSize || Math.max(12, r / 3)} fontFamily={s.fontFamily || 'Arial'} fontStyle="bold" fill={s.textColor || '#1F2937'} align="center" verticalAlign="top" x={0} y={cy + r * 0.25} width={W} />
            )}
            {/* Min/Max */}
            {(p.showMinMax ?? true) && (
              <>
                <Text text={String(min)} fontSize={9} fill="#9CA3AF" x={cx - r} y={cy + 8} width={r} align="center" />
                <Text text={String(max)} fontSize={9} fill="#9CA3AF" x={cx} y={cy + 8} width={r} align="center" />
              </>
            )}
          </Group>
        );
      }

      /* ── Switch ── */
      case 'switch': {
        const rtVal = isRuntimeMode ? resolveBindingValue(w, realtimeData) : undefined;
        const isOn = rtVal !== undefined ? Boolean(rtVal) && rtVal !== '0' && rtVal !== 'false' : true;
        const onImg = p.onImageUrl as string | undefined;
        const offImg = p.offImageUrl as string | undefined;
        const imgUrl = isOn ? onImg : offImg;

        // If a PNG image is set for the current state, render it
        if (imgUrl && loadedImages[imgUrl]) {
          return (
            <Group key={w.id} {...cp}>
              <KImage image={loadedImages[imgUrl]} x={0} y={0} width={W} height={H} />
            </Group>
          );
        }

        // Default switch graphics (track + knob + label)
        const trackW = W, trackH = H;
        const knobR = Math.min(trackH / 2 - 2, trackW / 4);
        const bg = isOn ? (p.onColor || '#22C55E') : (p.offColor || '#9CA3AF');
        return (
          <Group key={w.id} {...cp}>
            {imgUrl && !loadedImages[imgUrl] && (
              <>
                <Rect width={trackW} height={trackH} fill="#F3F4F6" stroke="#D1D5DB" strokeWidth={1} dash={[4, 4]} cornerRadius={4} />
                <Text text="Loading..." width={trackW} height={trackH} align="center" verticalAlign="middle" fontSize={10} fill="#9CA3AF" />
              </>
            )}
            {!imgUrl && (
              <>
                <Rect width={trackW} height={trackH} fill={bg} cornerRadius={trackH / 2} />
                <Circle x={isOn ? trackW - knobR - 3 : knobR + 3} y={trackH / 2} radius={knobR} fill="#FFFFFF" shadowBlur={2} shadowColor="rgba(0,0,0,0.2)" />
                <Text text={isOn ? (p.onLabel || 'ON') : (p.offLabel || 'OFF')} fontSize={Math.max(8, trackH * 0.3)} fontFamily="Arial" fill="#FFFFFF" align="center" verticalAlign="middle" x={isOn ? 0 : trackW / 2} y={0} width={trackW / 2} height={trackH} />
              </>
            )}
          </Group>
        );
      }

      /* ── Slider ── */
      case 'slider': {
        const rtVal = isRuntimeMode ? resolveBindingValue(w, realtimeData) : undefined;
        const min = p.min ?? 0, max = p.max ?? 100, val = rtVal !== undefined ? Number(rtVal) : (p.value ?? 50);
        const pct = (val - min) / (max - min || 1);
        const trackY = H / 2;
        const thumbX = 6 + pct * (W - 12);
        return (
          <Group key={w.id} {...cp}>
            {/* Track bg */}
            <Rect x={0} y={trackY - 3} width={W} height={6} fill={p.trackColor || '#E5E7EB'} cornerRadius={3} />
            {/* Track fill */}
            <Rect x={0} y={trackY - 3} width={thumbX} height={6} fill={p.thumbColor || '#3B82F6'} cornerRadius={3} />
            {/* Thumb */}
            <Circle x={thumbX} y={trackY} radius={8} fill={p.thumbColor || '#3B82F6'} stroke="#FFFFFF" strokeWidth={2} shadowBlur={3} shadowColor="rgba(0,0,0,0.2)" />
            {(p.showValue ?? true) && (
              <Text text={`${val}${p.unit || ''}`} fontSize={10} fontFamily="Arial" fill="#6B7280" align="center" width={W} y={trackY + 12} />
            )}
          </Group>
        );
      }

      /* ── LED ── */
      case 'led': {
        const rtVal = isRuntimeMode ? resolveBindingValue(w, realtimeData) : undefined;
        const isOn = rtVal !== undefined ? Boolean(rtVal) && rtVal !== '0' && rtVal !== 'false' : true;
        const color = isOn ? (p.onColor || '#22C55E') : (p.offColor || '#6B7280');
        const r = Math.min(W, H) / 2 - 2;
        const cx = W / 2, cy = (p.label ? H / 2 - 6 : H / 2);
        if (p.shape === 'square') {
          const side = Math.min(W, H) - 4;
          return (
            <Group key={w.id} {...cp}>
              <Rect x={(W - side) / 2} y={(H - side) / 2 - (p.label ? 6 : 0)} width={side} height={side} fill={color} cornerRadius={4} shadowBlur={isOn ? 8 : 0} shadowColor={color} />
              {p.label && <Text text={p.label} fontSize={9} fill="#6B7280" align="center" width={W} y={H - 14} />}
            </Group>
          );
        }
        return (
          <Group key={w.id} {...cp}>
            <Circle x={cx} y={cy} radius={r} fill={color} shadowBlur={isOn ? 10 : 0} shadowColor={color} stroke="#D1D5DB" strokeWidth={1} />
            {/* Highlight */}
            <Circle x={cx - r * 0.2} y={cy - r * 0.2} radius={r * 0.3} fill="rgba(255,255,255,0.4)" />
            {p.label && <Text text={p.label} fontSize={9} fill="#6B7280" align="center" width={W} y={H - 14} />}
          </Group>
        );
      }

      /* ── Value Display ── */
      case 'valueDisplay': {
        const rtVal = isRuntimeMode ? resolveBindingValue(w, realtimeData) : undefined;
        const rawVal = rtVal !== undefined ? rtVal : (p.value ?? '0');
        const dec = p.decimals ?? 2;
        const displayVal = isNaN(Number(rawVal)) ? String(rawVal) : Number(rawVal).toFixed(dec);
        const numVal = Number(rawVal);

        // Threshold color
        let thresholdColor: string | null = null;
        if (p.thresholds && Array.isArray(p.thresholds) && !isNaN(numVal)) {
          const sorted = [...p.thresholds].sort((a: any, b: any) => b.value - a.value);
          for (const t of sorted) {
            if (numVal >= t.value) { thresholdColor = t.color; break; }
          }
        }

        const valueColor = thresholdColor || s.textColor || '#1F2937';
        const hasIcon = !!p.icon;
        const iconSize = Math.max(14, H * 0.28);
        const labelY = 6;
        const labelH = 14;
        const valueY = labelH + 6;
        const valueH = H - valueY - (p.showTrend ? 16 : 4);

        return (
          <Group key={w.id} {...cp}>
            <Rect width={W} height={H} fill={s.backgroundColor || '#F9FAFB'} stroke={s.borderColor || '#E5E7EB'} strokeWidth={s.borderWidth || 1} cornerRadius={s.borderRadius || 8} shadowBlur={isRuntimeMode ? 4 : 0} shadowColor="rgba(0,0,0,0.06)" />
            {/* Label row */}
            <Text text={p.label || 'Value'} fontSize={10} fontFamily={s.fontFamily || 'Arial'} fill="#6B7280" align="center" width={W} y={labelY} />
            {/* Icon + Value */}
            {hasIcon && (
              <Text text={p.icon} fontSize={iconSize} align="center" width={W} y={valueY} height={valueH} verticalAlign="middle" />
            )}
            <Text
              text={`${p.prefix || ''}${displayVal}${p.suffix || ''}${p.unit ? ' ' + p.unit : ''}`}
              fontSize={s.fontSize || Math.max(16, H * 0.32)}
              fontFamily={s.fontFamily || 'Arial'}
              fontStyle="bold"
              fill={valueColor}
              align="center"
              verticalAlign="middle"
              x={hasIcon ? iconSize : 0}
              y={valueY}
              width={hasIcon ? W - iconSize : W}
              height={valueH}
            />
            {/* Trend arrow */}
            {p.showTrend && (
              <Text
                text={numVal > 0 ? '▲' : numVal < 0 ? '▼' : '●'}
                fontSize={10}
                fill={numVal > 0 ? (p.trendUpColor || '#22C55E') : numVal < 0 ? (p.trendDownColor || '#EF4444') : '#9CA3AF'}
                align="center"
                width={W}
                y={H - 16}
              />
            )}
          </Group>
        );
      }

      /* ── Valve ── */
      case 'valve': {
        const rtVal = isRuntimeMode ? resolveBindingValue(w, realtimeData) : undefined;
        const isOpen = rtVal !== undefined ? Boolean(rtVal) && rtVal !== '0' && rtVal !== 'false' && rtVal !== 'CLOSED' : true;
        const color = isOpen ? (p.openColor || '#22C55E') : (p.closedColor || '#EF4444');
        const cx = W / 2, cy = H / 2;
        const half = Math.min(W, H) / 2 - 4;
        // Butterfly valve symbol: two triangles
        return (
          <Group key={w.id} {...cp}>
            {/* Pipe connections */}
            <Rect x={0} y={cy - 4} width={W} height={8} fill="#9CA3AF" />
            {/* Valve body */}
            <Line points={[cx - half, cy - half, cx, cy, cx - half, cy + half]} fill={color} stroke="#374151" strokeWidth={1.5} closed />
            <Line points={[cx + half, cy - half, cx, cy, cx + half, cy + half]} fill={color} stroke="#374151" strokeWidth={1.5} closed />
            {/* Center point */}
            <Circle x={cx} y={cy} radius={3} fill="#374151" />
            {/* Label */}
            {(p.showLabel ?? true) && (
              <Text text={p.label || (isOpen ? 'OPEN' : 'CLOSED')} fontSize={8} fill="#6B7280" align="center" width={W} y={H - 12} />
            )}
          </Group>
        );
      }

      /* ── Tank ── */
      case 'tank': {
        const rtVal = isRuntimeMode ? resolveBindingValue(w, realtimeData) : undefined;
        const level = rtVal !== undefined ? Number(rtVal) : 65;
        const min = p.minLevel ?? 0, max = p.maxLevel ?? 100;
        const pct = Math.max(0, Math.min(1, (level - min) / (max - min || 1)));
        const tankPad = 3;
        const innerH = (H - 20) * pct;
        let fillColor = p.fillColor || '#3B82F6';
        if (level >= (p.criticalLevel ?? 95)) fillColor = p.criticalColor || '#EF4444';
        else if (level >= (p.warningLevel ?? 80)) fillColor = p.warningColor || '#F59E0B';
        return (
          <Group key={w.id} {...cp}>
            {/* Tank body */}
            <Rect x={tankPad} y={10} width={W - tankPad * 2} height={H - 20} fill={p.emptyColor || '#F3F4F6'} stroke="#9CA3AF" strokeWidth={2} cornerRadius={4} />
            {/* Liquid fill */}
            <Rect x={tankPad + 2} y={10 + (H - 20) - innerH} width={W - tankPad * 2 - 4} height={innerH - 2} fill={fillColor} opacity={0.8} cornerRadius={[0, 0, 2, 2] as any} />
            {/* Level text */}
            {(p.showLevel ?? true) && (
              <Text text={`${Math.round(level)}${p.unit || '%'}`} fontSize={s.fontSize || 14} fontFamily="Arial" fontStyle="bold" fill="#1F2937" align="center" verticalAlign="middle" width={W} y={H / 2 - 10} height={20} />
            )}
            {/* Scale marks */}
            {(p.showScale ?? true) && [0, 25, 50, 75, 100].map((mark) => {
              const markY = 10 + (H - 20) * (1 - mark / 100);
              return (
                <React.Fragment key={mark}>
                  <Line points={[W - tankPad - 10, markY, W - tankPad, markY]} stroke="#9CA3AF" strokeWidth={1} />
                  <Text text={String(mark)} fontSize={7} fill="#9CA3AF" x={W - tankPad + 2} y={markY - 4} />
                </React.Fragment>
              );
            })}
            {/* Label */}
            {p.label && <Text text={p.label} fontSize={9} fill="#6B7280" align="center" width={W} y={0} />}
          </Group>
        );
      }

      /* ── Motor ── */
      case 'motor': {
        const rtVal = isRuntimeMode ? resolveBindingValue(w, realtimeData) : undefined;
        const isRunning = rtVal !== undefined ? Boolean(rtVal) && rtVal !== '0' && rtVal !== 'false' && rtVal !== 'STOPPED' : true;
        const color = isRunning ? (p.runningColor || '#22C55E') : (p.stoppedColor || '#6B7280');
        const cx = W / 2, cy = H / 2;
        const r = Math.min(W, H) / 2 - 4;
        return (
          <Group key={w.id} {...cp}>
            {/* Motor body */}
            <Circle x={cx} y={cy} radius={r} fill="#F9FAFB" stroke={color} strokeWidth={3} />
            {/* M label */}
            <Text text="M" fontSize={Math.max(14, r * 0.8)} fontFamily="Arial" fontStyle="bold" fill={color} align="center" verticalAlign="middle" x={cx - r} y={cy - r} width={r * 2} height={r * 2} />
            {/* Status indicator */}
            <Circle x={cx + r * 0.6} y={cy - r * 0.6} radius={4} fill={color} />
            {/* RPM text */}
            {(p.showRPM ?? true) && (
              <Text text={isRunning ? `${p.ratedRPM || 1800} RPM` : 'STOPPED'} fontSize={8} fill="#6B7280" align="center" width={W} y={cy + r + 2} />
            )}
          </Group>
        );
      }

      /* ── Pipe ── */
      case 'pipe': {
        const pw = p.pipeWidth ?? 8;
        const pipeClr = p.pipeColor || '#6B7280';
        const flowClr = p.flowColor || '#3B82F6';
        const isHorizontal = p.flowDirection === 'left-to-right' || p.flowDirection === 'right-to-left';
        return (
          <Group key={w.id} {...cp}>
            {isHorizontal ? (
              <>
                {/* Pipe body */}
                <Rect x={0} y={H / 2 - pw / 2} width={W} height={pw} fill={pipeClr} cornerRadius={2} />
                {/* Flow indicator line */}
                <Rect x={0} y={H / 2 - pw / 4} width={W} height={pw / 2} fill={flowClr} opacity={0.4} cornerRadius={1} />
                {/* Flow arrows */}
                {(p.showFlow ?? true) && [0.25, 0.5, 0.75].map((f) => (
                  <Text key={f} text={p.flowDirection === 'right-to-left' ? '◂' : '▸'} fontSize={pw + 2} fill="#FFF" x={W * f - 4} y={H / 2 - pw / 2 - 1} />
                ))}
              </>
            ) : (
              <>
                <Rect x={W / 2 - pw / 2} y={0} width={pw} height={H} fill={pipeClr} cornerRadius={2} />
                <Rect x={W / 2 - pw / 4} y={0} width={pw / 2} height={H} fill={flowClr} opacity={0.4} cornerRadius={1} />
                {(p.showFlow ?? true) && [0.25, 0.5, 0.75].map((f) => (
                  <Text key={f} text={p.flowDirection === 'bottom-to-top' ? '▴' : '▾'} fontSize={pw + 2} fill="#FFF" x={W / 2 - pw / 2} y={H * f - 4} />
                ))}
              </>
            )}
          </Group>
        );
      }

      /* ── Pump ── */
      case 'pump': {
        const rtVal = isRuntimeMode ? resolveBindingValue(w, realtimeData) : undefined;
        const isRunning = rtVal !== undefined ? Boolean(rtVal) && rtVal !== '0' && rtVal !== 'false' && rtVal !== 'STOPPED' : true;
        const color = isRunning ? (p.runningColor || '#22C55E') : (p.stoppedColor || '#6B7280');
        const cx = W / 2, cy = H / 2;
        const r = Math.min(W, H) / 2 - 6;
        return (
          <Group key={w.id} {...cp}>
            {/* Pump body - circle with triangle */}
            <Circle x={cx} y={cy} radius={r} fill="#F9FAFB" stroke={color} strokeWidth={2.5} />
            {/* Impeller triangle */}
            <Line points={[cx - r * 0.5, cy + r * 0.4, cx, cy - r * 0.5, cx + r * 0.5, cy + r * 0.4]} fill={color} stroke={color} strokeWidth={1} closed />
            {/* Inlet/outlet pipes */}
            <Rect x={0} y={cy - 3} width={cx - r} height={6} fill="#9CA3AF" />
            <Rect x={cx + r} y={cy - 3} width={cx - r} height={6} fill="#9CA3AF" />
            {/* Label */}
            {p.label && <Text text={p.label} fontSize={8} fill="#6B7280" align="center" width={W} y={H - 10} />}
          </Group>
        );
      }

      /* ── Indicator ── */
      case 'indicator': {
        const states = p.states || [{ value: 0, label: 'Off', color: '#6B7280' }];
        const rtVal = isRuntimeMode ? resolveBindingValue(w, realtimeData) : undefined;
        const stateVal = rtVal !== undefined ? rtVal : 0;
        const currentState = states.find((st: any) => String(st.value) === String(stateVal)) || states[0] || { label: 'Unknown', color: '#6B7280' };
        const cx = W / 2, cy = H / 2;
        if (p.indicatorType === 'traffic-light') {
          const lightR = Math.min(W / 2 - 4, H / 8);
          return (
            <Group key={w.id} {...cp}>
              <Rect width={W} height={H} fill="#1F2937" cornerRadius={lightR + 4} />
              {[{ y: lightR + 6, color: '#EF4444' }, { y: H / 2, color: '#F59E0B' }, { y: H - lightR - 6, color: '#22C55E' }].map((light, i) => (
                <Circle key={i} x={cx} y={light.y} radius={lightR} fill={i === 0 ? light.color : '#374151'} shadowBlur={i === 0 ? 6 : 0} shadowColor={light.color} />
              ))}
            </Group>
          );
        }
        return (
          <Group key={w.id} {...cp}>
            <Circle x={cx} y={cy - (p.showLabel ? 6 : 0)} radius={Math.min(W, H) / 2 - 4} fill={currentState.color} shadowBlur={6} shadowColor={currentState.color} stroke="#E5E7EB" strokeWidth={1} />
            {(p.showLabel ?? true) && (
              <Text text={currentState.label} fontSize={9} fill="#6B7280" align="center" width={W} y={H - 14} />
            )}
          </Group>
        );
      }

      /* ── Alarm ── */
      case 'alarm':
        return (
          <Group key={w.id} {...cp}>
            <Rect width={W} height={H} fill="#FEF2F2" stroke="#FCA5A5" strokeWidth={1} cornerRadius={6} />
            <Text text="🚨 ALARMS" fontSize={11} fontStyle="bold" fill="#991B1B" align="center" width={W} y={8} />
            <Text text="No active alarms" fontSize={10} fill="#6B7280" align="center" verticalAlign="middle" width={W} y={H * 0.3} height={H * 0.5} />
          </Group>
        );

      /* ── Chart placeholder ── */
      case 'chart':
        return (
          <Group key={w.id} {...cp}>
            <Rect width={W} height={H} fill={s.backgroundColor || '#FFFFFF'} stroke={s.borderColor || '#E5E7EB'} strokeWidth={1} cornerRadius={6} />
            <Text text={`📈 ${p.chartType || 'Line'} Chart`} fontSize={11} fontStyle="bold" fill="#374151" align="center" width={W} y={8} />
            {/* Fake chart lines */}
            <Line points={[20, H * 0.7, W * 0.25, H * 0.5, W * 0.5, H * 0.6, W * 0.75, H * 0.3, W - 20, H * 0.45]} stroke="#3B82F6" strokeWidth={2} tension={0.3} />
            <Line points={[20, H * 0.8, W * 0.3, H * 0.65, W * 0.55, H * 0.7, W * 0.8, H * 0.5, W - 20, H * 0.6]} stroke="#22C55E" strokeWidth={2} tension={0.3} opacity={0.6} />
          </Group>
        );

      /* ── Table placeholder ── */
      case 'table':
        return (
          <Group key={w.id} {...cp}>
            <Rect width={W} height={H} fill="#FFFFFF" stroke="#E5E7EB" strokeWidth={1} cornerRadius={4} />
            <Rect width={W} height={28} fill="#F9FAFB" stroke="#E5E7EB" strokeWidth={1} cornerRadius={[4, 4, 0, 0] as any} />
            <Text text="📋 Data Table" fontSize={11} fontStyle="bold" fill="#374151" align="center" width={W} y={6} />
            {[0, 1, 2].map((row) => (
              <Line key={row} points={[0, 28 + row * 24, W, 28 + row * 24]} stroke="#F3F4F6" strokeWidth={1} />
            ))}
          </Group>
        );

      /* ── Image placeholder ── */
      case 'image':
        return (
          <Group key={w.id} {...cp}>
            <Rect width={W} height={H} fill="#F3F4F6" stroke="#D1D5DB" strokeWidth={1} cornerRadius={4} />
            <Text text={p.src ? '🖼️' : '🖼️ No Image'} fontSize={Math.max(12, Math.min(W, H) * 0.2)} fill="#9CA3AF" align="center" verticalAlign="middle" width={W} height={H} />
          </Group>
        );

      /* ── Container ── */
      case 'container':
        return (
          <Group key={w.id} {...cp}>
            <Rect width={W} height={H} fill={s.backgroundColor || 'transparent'} stroke={s.borderColor || '#E5E7EB'} strokeWidth={s.borderWidth || 1} cornerRadius={s.borderRadius || 0} dash={[6, 3]} />
            <Text text="📦 Container" fontSize={10} fill="#9CA3AF" align="center" width={W} y={4} />
          </Group>
        );

      /* ── Default / Custom ── */
      case 'video':
        return (
          <Group key={w.id} {...cp}>
            <Rect width={W} height={H} fill="#1F2937" stroke="#374151" strokeWidth={1} cornerRadius={4} />
            <Text text="🎬 Video" fontSize={Math.max(12, Math.min(W, H) * 0.15)} fill="#9CA3AF" align="center" verticalAlign="middle" width={W} height={H} />
          </Group>
        );
      case 'map':
        return (
          <Group key={w.id} {...cp}>
            <Rect width={W} height={H} fill="#E8F5E9" stroke="#A5D6A7" strokeWidth={1} cornerRadius={4} />
            <Text text="🗺️ Map" fontSize={Math.max(12, Math.min(W, H) * 0.15)} fill="#4CAF50" align="center" verticalAlign="middle" width={W} height={H} />
          </Group>
        );
      case 'custom':
      default:
        return (
          <Group key={w.id} {...cp}>
            <Rect width={W} height={H} fill="#F9FAFB" stroke="#D1D5DB" strokeWidth={1} dash={[5, 5]} cornerRadius={4} />
            <Text text={`🧩 ${(w.type as string).toUpperCase()}`} fontSize={11} fontFamily="Arial" fill="#6B7280" align="center" verticalAlign="middle" width={W} height={H} />
          </Group>
        );
    }
  };

  /* ── Grid (memoized to avoid re-creating hundreds of Line elements) ── */
  const gridElements = useMemo(() => {
    if (!editorState?.showGrid || isRuntimeMode) return null;
    const settings = currentDashboard?.settings as any;
    const gridSize = settings?.grid?.size || 20;
    const gridColor = settings?.grid?.color || '#E5E7EB';
    const cs = currentDashboard?.canvasSize as any;
    const cw = cs?.width || 1920, ch = cs?.height || 1080;
    const lines: React.ReactElement[] = [];
    for (let i = 0; i <= cw; i += gridSize) {
      lines.push(<Line key={`v-${i}`} points={[i, 0, i, ch]} stroke={gridColor} strokeWidth={1} opacity={0.3} listening={false} />);
    }
    for (let i = 0; i <= ch; i += gridSize) {
      lines.push(<Line key={`h-${i}`} points={[0, i, cw, i]} stroke={gridColor} strokeWidth={1} opacity={0.3} listening={false} />);
    }
    return lines;
  }, [editorState?.showGrid, isRuntimeMode, currentDashboard?.settings, currentDashboard?.canvasSize]);

  /* ── Render ── */
  if (!currentDashboard) {
    return <div className="flex items-center justify-center w-full h-full bg-gray-100"><div className="text-gray-500">No dashboard loaded</div></div>;
  }

  const zoom = editorState?.viewport?.zoom ?? 1;
  const vp = editorState?.viewport?.position ?? { x: 0, y: 0 };
  const cs = currentDashboard?.canvasSize as any;
  const dashW = cs?.width || 1920, dashH = cs?.height || 1080;
  const widgets: Widget[] = (currentDashboard as any)?.widgets ?? (currentDashboard as any)?.scadaWidgets ?? [];
  const layers: any[] = (currentDashboard as any)?.layers ?? [];
  const bg: string = (currentDashboard as any)?.backgroundColor || '#FFFFFF';

  return (
    <div className={`relative w-full h-full overflow-hidden ${isRuntimeMode ? '' : 'bg-gray-200'}`}
         style={isRuntimeMode ? { backgroundColor: bg } : undefined}>
      <Stage ref={stageRef} width={width} height={height} draggable={!isRuntimeMode} onClick={handleStageClick} onMouseDown={handleStageMouseDown} onMouseMove={handleStageMouseMove} onMouseUp={handleStageMouseUp} onDragEnd={() => {}} scale={{ x: zoom, y: zoom }} x={-vp.x * zoom} y={-vp.y * zoom}>
        <Layer listening={false}>
          <Rect x={0} y={0} width={dashW} height={dashH} fill={bg} {...(isRuntimeMode ? {} : { shadowBlur: 8, shadowColor: 'rgba(0,0,0,0.08)' })} listening={false} />
          {gridElements}
        </Layer>
        {layers.map((layer: any) => (
          <Layer key={layer.id} visible={layer.visible} opacity={layer.opacity}>
            {widgets.filter((w: any) => w.layerId === layer.id || (!w.layerId && layer.order === 0)).filter((w: any) => w.visible !== false).sort((a: any, b: any) => (a.transform?.zIndex || 0) - (b.transform?.zIndex || 0)).map(renderWidget)}
          </Layer>
        ))}
        <Layer>
          {widgets.filter((w: any) => !w.layerId).filter((w: any) => w.visible !== false).sort((a: any, b: any) => (a.transform?.zIndex || 0) - (b.transform?.zIndex || 0)).map(renderWidget)}
        </Layer>
        {!isRuntimeMode && (
          <Layer>
            <Transformer ref={transformerRef} rotateEnabled={true} borderStroke="#2563EB" borderStrokeWidth={2} anchorStroke="#2563EB" anchorFill="#FFFFFF" anchorStrokeWidth={2} anchorSize={8} keepRatio={false} enabledAnchors={['top-left','top-center','top-right','middle-left','middle-right','bottom-left','bottom-center','bottom-right']} />
          </Layer>
        )}
        {/* Rubber-band selection rectangle */}
        {selectionRect && (
          <Layer>
            <Rect
              x={selectionRect.x}
              y={selectionRect.y}
              width={selectionRect.width}
              height={selectionRect.height}
              fill="rgba(37,99,235,0.08)"
              stroke="#2563EB"
              strokeWidth={1}
              dash={[6, 3]}
              listening={false}
            />
          </Layer>
        )}
      </Stage>
      {isRuntimeMode && <div className="absolute top-2 right-2 bg-green-500 text-white px-2 py-1 rounded text-xs font-medium shadow">▶ Runtime</div>}
      <div className="absolute bottom-2 right-2 bg-white/90 border border-gray-300 px-2 py-0.5 rounded text-[10px] text-gray-600 font-mono">{Math.round(zoom * 100)}%</div>
    </div>
  );
};

/* ── Helper: get gauge color from ranges or default gradient ── */
function getGaugeColor(pct: number, ranges?: Array<{ from: number; to: number; color: string }>): string {
  if (ranges && ranges.length > 0) {
    const val = pct * 100;
    for (const r of ranges) {
      if (val >= r.from && val <= r.to) return r.color;
    }
  }
  if (pct > 0.8) return '#EF4444';
  if (pct > 0.6) return '#F59E0B';
  return '#22C55E';
}
