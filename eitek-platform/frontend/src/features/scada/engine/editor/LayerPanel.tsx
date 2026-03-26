/**
 * LayerPanel — Manage screen layers: reorder, toggle visibility, lock, rename.
 */

'use client';

import React, { useCallback } from 'react';
import { useScadaRuntimeStore } from '../../stores/scadaRuntimeStore';
import type { ScreenLayer } from '../../core/types';
import { EyeIcon, EyeOffIcon, LockIcon, UnlockIcon } from './EditorIcons';
import '../../styles/scada.css';

export const LayerPanel: React.FC = () => {
  const screen = useScadaRuntimeStore((s) => s.screen);
  const addLayer = useScadaRuntimeStore((s) => s.addLayer);
  const updateLayer = useScadaRuntimeStore((s) => s.updateLayer);
  const removeLayer = useScadaRuntimeStore((s) => s.removeLayer);

  const layers = screen?.layers ?? [];

  const handleAddLayer = useCallback(() => {
    const newLayer: ScreenLayer = {
      id: `layer_${Date.now()}`,
      name: `Layer ${layers.length + 1}`,
      visible: true,
      locked: false,
      opacity: 1,
      order: layers.length,
    };
    addLayer(newLayer);
  }, [layers.length, addLayer]);

  const handleToggleVisible = useCallback(
    (id: string) => {
      const layer = layers.find((l) => l.id === id);
      if (layer) updateLayer(id, { visible: !layer.visible });
    },
    [layers, updateLayer],
  );

  const handleToggleLock = useCallback(
    (id: string) => {
      const layer = layers.find((l) => l.id === id);
      if (layer) updateLayer(id, { locked: !layer.locked });
    },
    [layers, updateLayer],
  );

  const handleRename = useCallback(
    (id: string, name: string) => {
      updateLayer(id, { name });
    },
    [updateLayer],
  );

  const handleDelete = useCallback(
    (id: string) => {
      if (layers.length <= 1) return; // Keep at least one layer
      removeLayer(id);
    },
    [layers.length, removeLayer],
  );

  const sorted = [...layers].sort((a, b) => b.order - a.order);

  return (
    <div className="scada-panel" style={{ width: '100%' }}>
      <div className="scada-panel__header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span>Layers</span>
        <button
          onClick={handleAddLayer}
          style={{ fontSize: 14, cursor: 'pointer', background: 'none', border: 'none', color: '#3B82F6' }}
          title="Add layer"
        >
          +
        </button>
      </div>
      <div className="scada-panel__body" style={{ maxHeight: 200 }}>
        {sorted.map((layer) => (
          <div
            key={layer.id}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              padding: '4px 0',
              borderBottom: '1px solid #f3f4f6',
              opacity: layer.visible ? 1 : 0.5,
            }}
          >
            <button
              onClick={() => handleToggleVisible(layer.id)}
              title={layer.visible ? 'Hide' : 'Show'}
              style={iconBtnStyle}
            >
              {layer.visible ? <EyeIcon size={12} /> : <EyeOffIcon size={12} />}
            </button>
            <button
              onClick={() => handleToggleLock(layer.id)}
              title={layer.locked ? 'Unlock' : 'Lock'}
              style={iconBtnStyle}
            >
              {layer.locked ? <LockIcon size={12} /> : <UnlockIcon size={12} />}
            </button>
            <input
              type="text"
              value={layer.name}
              onChange={(e) => handleRename(layer.id, e.target.value)}
              style={{
                flex: 1,
                border: 'none',
                fontSize: 11,
                padding: '2px 4px',
                background: 'transparent',
                outline: 'none',
              }}
            />
            {layers.length > 1 && (
              <button
                onClick={() => handleDelete(layer.id)}
                title="Delete layer"
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
