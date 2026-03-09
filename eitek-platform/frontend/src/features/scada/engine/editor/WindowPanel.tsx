/**
 * WindowPanel — Manage SCADA windows/screens: add, rename, set main, delete.
 * Click a window row to switch the active canvas to that window.
 */

'use client';

import React, { useCallback } from 'react';
import { useScadaRuntimeStore } from '../../stores/scadaRuntimeStore';
import type { ScadaWindow } from '../../core/types';
import '../../styles/scada.css';

export const WindowPanel: React.FC = () => {
  const screen = useScadaRuntimeStore((s) => s.screen);
  const activeWindowId = useScadaRuntimeStore((s) => s.activeWindowId);
  const addWindow = useScadaRuntimeStore((s) => s.addWindow);
  const updateWindow = useScadaRuntimeStore((s) => s.updateWindow);
  const removeWindow = useScadaRuntimeStore((s) => s.removeWindow);
  const setMainWindow = useScadaRuntimeStore((s) => s.setMainWindow);
  const setActiveWindowId = useScadaRuntimeStore((s) => s.setActiveWindowId);

  const windows = screen?.windows ?? [];

  const handleAddWindow = useCallback(() => {
    const newWindow: ScadaWindow = {
      id: `win_${Date.now()}`,
      name: `Window ${windows.length + 1}`,
      isMain: windows.length === 0,
      canvasSize: screen?.canvasSize ?? { width: 1920, height: 1080 },
      background: screen?.background ?? { type: 'color', color: '#ffffff' },
      layers: [
        {
          id: `layer_${Date.now()}`,
          name: 'Layer 1',
          visible: true,
          locked: false,
          opacity: 1,
          order: 0,
        },
      ],
      widgets: [],
    };
    addWindow(newWindow);
  }, [windows.length, screen?.canvasSize, screen?.background, addWindow]);

  const handleRename = useCallback(
    (id: string, name: string) => {
      updateWindow(id, { name });
    },
    [updateWindow],
  );

  const handleSetMain = useCallback(
    (id: string) => {
      setMainWindow(id);
    },
    [setMainWindow],
  );

  const handleDelete = useCallback(
    (id: string) => {
      if (windows.length <= 1) return;
      removeWindow(id);
    },
    [windows.length, removeWindow],
  );

  const handleSelect = useCallback(
    (id: string) => {
      setActiveWindowId(id);
    },
    [setActiveWindowId],
  );

  return (
    <div className="scada-panel" style={{ width: '100%' }}>
      <div
        className="scada-panel__header"
        style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
      >
        <span>Windows</span>
        <button
          onClick={handleAddWindow}
          style={{ fontSize: 14, cursor: 'pointer', background: 'none', border: 'none', color: '#3B82F6' }}
          title="Add window"
        >
          +
        </button>
      </div>
      <div className="scada-panel__body" style={{ maxHeight: 240 }}>
        {windows.length === 0 && (
          <div style={{ fontSize: 10, color: '#9CA3AF', padding: '8px 4px', textAlign: 'center' }}>
            No windows yet. Click + to add one.
          </div>
        )}
        {windows.map((win) => (
          <div
            key={win.id}
            onClick={() => handleSelect(win.id)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              padding: '5px 4px',
              borderBottom: '1px solid #f3f4f6',
              cursor: 'pointer',
              background: activeWindowId === win.id ? '#EFF6FF' : 'transparent',
              borderLeft: activeWindowId === win.id ? '2px solid #3B82F6' : '2px solid transparent',
            }}
          >
            {/* Main indicator / toggle */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleSetMain(win.id);
              }}
              title={win.isMain ? 'Main window' : 'Set as main'}
              style={{
                ...iconBtnStyle,
                color: win.isMain ? '#F59E0B' : '#D1D5DB',
                fontSize: 13,
              }}
            >
              {win.isMain ? '★' : '☆'}
            </button>

            {/* Name input */}
            <input
              type="text"
              value={win.name}
              onClick={(e) => e.stopPropagation()}
              onChange={(e) => handleRename(win.id, e.target.value)}
              style={{
                flex: 1,
                border: 'none',
                fontSize: 11,
                padding: '2px 4px',
                background: 'transparent',
                outline: 'none',
                fontWeight: win.isMain ? 600 : 400,
              }}
            />

            {/* ID badge */}
            <span
              style={{
                fontSize: 9,
                color: '#9CA3AF',
                fontFamily: 'monospace',
                whiteSpace: 'nowrap',
              }}
              title={win.id}
            >
              {win.id.slice(0, 8)}
            </span>

            {/* Delete */}
            {windows.length > 1 && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleDelete(win.id);
                }}
                title="Delete window"
                style={{ ...iconBtnStyle, color: '#EF4444' }}
              >
                ×
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

const iconBtnStyle: React.CSSProperties = {
  background: 'none',
  border: 'none',
  cursor: 'pointer',
  fontSize: 12,
  padding: '2px 4px',
};
