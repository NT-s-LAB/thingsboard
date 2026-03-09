/**
 * WidgetPalette — Lists all registered widgets by category.
 * Supports drag-and-drop to add widgets onto the editor canvas.
 */

'use client';

import React, { useCallback, useMemo, useState } from 'react';
import { widgetRegistry } from '../../core/registry';
import type { WidgetCategory, WidgetDefinition } from '../../core/types';
import '../../styles/scada.css';

const CATEGORY_LABELS: Record<WidgetCategory, string> = {
  display: 'Display',
  control: 'Control',
  indicator: 'Indicators',
  industrial: 'Industrial',
  layout: 'Layout',
  chart: 'Charts',
  custom: 'Custom / SVG',
};

const CATEGORY_ORDER: WidgetCategory[] = [
  'display',
  'industrial',
  'indicator',
  'control',
  'chart',
  'layout',
  'custom',
];

interface WidgetPaletteV2Props {
  onAddWidget: (type: string) => void;
}

export const WidgetPaletteV2: React.FC<WidgetPaletteV2Props> = ({ onAddWidget }) => {
  const [search, setSearch] = useState('');
  const [expandedCategories, setExpandedCategories] = useState<Set<WidgetCategory>>(
    new Set(CATEGORY_ORDER),
  );

  const allDefs = useMemo(() => widgetRegistry.getAll(), []);

  const filtered = useMemo(() => {
    if (!search.trim()) return allDefs;
    const q = search.toLowerCase();
    return allDefs.filter(
      (d) =>
        d.name.toLowerCase().includes(q) ||
        d.type.toLowerCase().includes(q) ||
        d.category.toLowerCase().includes(q),
    );
  }, [allDefs, search]);

  const grouped = useMemo(() => {
    const map = new Map<WidgetCategory, WidgetDefinition[]>();
    for (const def of filtered) {
      const arr = map.get(def.category) ?? [];
      arr.push(def);
      map.set(def.category, arr);
    }
    return map;
  }, [filtered]);

  const toggleCategory = useCallback((cat: WidgetCategory) => {
    setExpandedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(cat)) next.delete(cat);
      else next.add(cat);
      return next;
    });
  }, []);

  const handleDragStart = useCallback((e: React.DragEvent, type: string) => {
    e.dataTransfer.setData('widget-type', type);
    e.dataTransfer.effectAllowed = 'copy';
  }, []);

  return (
    <div className="scada-panel" style={{ width: 220, flexShrink: 0 }}>
      <div className="scada-panel__header">Widgets</div>
      <div style={{ padding: 8 }}>
        <input
          type="text"
          placeholder="Search widgets..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{
            width: '100%',
            padding: '6px 8px',
            border: '1px solid #e5e7eb',
            borderRadius: 6,
            fontSize: 12,
            outline: 'none',
          }}
        />
      </div>
      <div className="scada-panel__body" style={{ maxHeight: 'calc(100vh - 200px)' }}>
        {CATEGORY_ORDER.map((cat) => {
          const defs = grouped.get(cat);
          if (!defs || defs.length === 0) return null;
          const expanded = expandedCategories.has(cat);
          return (
            <div key={cat} style={{ marginBottom: 4 }}>
              <div
                onClick={() => toggleCategory(cat)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                  padding: '4px 8px',
                  fontSize: 11,
                  fontWeight: 600,
                  color: '#6B7280',
                  cursor: 'pointer',
                  userSelect: 'none',
                }}
              >
                <span style={{ transform: expanded ? 'rotate(90deg)' : undefined, transition: 'transform 0.15s', fontSize: 10 }}>▶</span>
                {CATEGORY_LABELS[cat]} ({defs.length})
              </div>
              {expanded &&
                defs.map((def) => (
                  <div
                    key={def.type}
                    className="scada-palette-item"
                    draggable
                    onDragStart={(e) => handleDragStart(e, def.type)}
                    onClick={() => onAddWidget(def.type)}
                  >
                    <span className="scada-palette-item__icon">{def.icon}</span>
                    <span>{def.name}</span>
                  </div>
                ))}
            </div>
          );
        })}
      </div>
    </div>
  );
};
