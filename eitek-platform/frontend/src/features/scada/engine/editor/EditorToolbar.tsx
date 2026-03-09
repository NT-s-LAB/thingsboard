/**
 * EditorToolbar — Top toolbar for the SCADA editor.
 * Zoom, grid, runtime toggle, save, undo/redo, fullscreen.
 */

'use client';

import React, { useCallback, useEffect } from 'react';
import { useScadaRuntimeStore } from '../../stores/scadaRuntimeStore';

interface EditorToolbarProps {
  onSave?: () => void;
  screenName?: string;
}

export const EditorToolbar: React.FC<EditorToolbarProps> = ({ onSave, screenName }) => {
  const isRuntime = useScadaRuntimeStore((s) => s.isRuntime);
  const isFullscreen = useScadaRuntimeStore((s) => s.isFullscreen);
  const zoom = useScadaRuntimeStore((s) => s.zoom);
  const showGrid = useScadaRuntimeStore((s) => s.showGrid);
  const snapToGrid = useScadaRuntimeStore((s) => s.snapToGrid);
  const isDirty = useScadaRuntimeStore((s) => s.isDirty);

  const toggleRuntime = useScadaRuntimeStore((s) => s.toggleRuntime);
  const setFullscreen = useScadaRuntimeStore((s) => s.setFullscreen);
  const setZoom = useScadaRuntimeStore((s) => s.setZoom);
  const toggleGrid = useScadaRuntimeStore((s) => s.toggleGrid);
  const toggleSnap = useScadaRuntimeStore((s) => s.toggleSnap);

  const handleFullscreen = useCallback(() => {
    const containerEl = document.getElementById('scada-v2-fullscreen-root');
    if (!document.fullscreenElement) {
      (containerEl ?? document.documentElement).requestFullscreen().catch(() => {});
      setFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setFullscreen(false);
    }
  }, [setFullscreen]);

  // Sync fullscreen state when user presses Escape
  useEffect(() => {
    const onFsChange = () => {
      const fs = !!document.fullscreenElement;
      setFullscreen(fs);
    };
    document.addEventListener('fullscreenchange', onFsChange);
    return () => document.removeEventListener('fullscreenchange', onFsChange);
  }, [setFullscreen]);

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        padding: '6px 12px',
        borderBottom: '1px solid #e5e7eb',
        background: '#fff',
        fontSize: 12,
        flexShrink: 0,
      }}
    >
      {/* Screen name */}
      <span style={{ fontWeight: 600, color: '#1F2937', marginRight: 8 }}>
        {screenName ?? 'SCADA Editor'}
        {isDirty && <span style={{ color: '#F59E0B', marginLeft: 4 }}>●</span>}
      </span>

      <Separator />

      {/* Zoom */}
      <ToolBtn onClick={() => setZoom(zoom - 0.1)} title="Zoom Out">−</ToolBtn>
      <span style={{ minWidth: 45, textAlign: 'center', color: '#6B7280' }}>
        {Math.round(zoom * 100)}%
      </span>
      <ToolBtn onClick={() => setZoom(zoom + 0.1)} title="Zoom In">+</ToolBtn>
      <ToolBtn onClick={() => setZoom(1)} title="Reset Zoom">1:1</ToolBtn>

      <Separator />

      {/* Grid & Snap */}
      <ToolBtn onClick={toggleGrid} title="Toggle Grid" active={showGrid}>
        ⊞
      </ToolBtn>
      <ToolBtn onClick={toggleSnap} title="Toggle Snap" active={snapToGrid}>
        ⊡
      </ToolBtn>

      <Separator />

      {/* Save */}
      {onSave && (
        <ToolBtn onClick={onSave} title="Save (Ctrl+S)">
          💾 Save
        </ToolBtn>
      )}

      <div style={{ flex: 1 }} />

      {/* Runtime toggle */}
      <ToolBtn onClick={toggleRuntime} active={isRuntime} title={isRuntime ? 'Stop Runtime' : 'Start Runtime'}>
        {isRuntime ? '⏹ Stop' : '▶ Run'}
      </ToolBtn>

      {/* Fullscreen */}
      <ToolBtn onClick={handleFullscreen} title="Fullscreen">
        {isFullscreen ? '⊠' : '⊞'}
      </ToolBtn>
    </div>
  );
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

const ToolBtn: React.FC<{
  onClick: () => void;
  title?: string;
  active?: boolean;
  children: React.ReactNode;
}> = ({ onClick, title, active, children }) => (
  <button
    onClick={onClick}
    title={title}
    style={{
      padding: '4px 8px',
      border: '1px solid',
      borderColor: active ? '#3B82F6' : '#e5e7eb',
      borderRadius: 4,
      background: active ? '#EFF6FF' : '#fff',
      color: active ? '#2563EB' : '#374151',
      cursor: 'pointer',
      fontSize: 11,
      fontWeight: 500,
      lineHeight: 1,
    }}
  >
    {children}
  </button>
);

const Separator: React.FC = () => (
  <div style={{ width: 1, height: 20, background: '#e5e7eb' }} />
);
