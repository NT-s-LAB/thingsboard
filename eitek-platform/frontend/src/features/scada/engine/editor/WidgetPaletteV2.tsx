/**
 * WidgetPaletteV2 — Tabbed palette: Built-in widgets + Widget Library.
 * Supports drag-and-drop, search, category grouping, and library integration.
 */

'use client';

import React, { useCallback, useMemo, useState } from 'react';
import { widgetRegistry } from '../../core/registry';
import type { WidgetCategory, WidgetDefinition } from '../../core/types';
import { WidgetLibraryPanel } from './WidgetLibraryPanel';
import type { WidgetItem } from '../../services/widgetLibraryService';
import { ChevronRightIcon } from './EditorIcons';
import '../../styles/scada.css';

const CATEGORY_LABELS: Record<WidgetCategory, string> = {
  shapes: 'Shapes',
  display: 'Display',
  control: 'Control',
  indicator: 'Indicators',
  industrial: 'Industrial',
  layout: 'Layout',
  chart: 'Charts',
  custom: 'Custom / SVG',
};

const CATEGORY_ORDER: WidgetCategory[] = [
  'shapes',
  'display',
  'industrial',
  'indicator',
  'control',
  'chart',
  'layout',
  'custom',
];

type PaletteTab = 'builtin' | 'library';

interface WidgetPaletteV2Props {
  onAddWidget: (type: string) => void;
  onAddLibraryWidget?: (widget: WidgetItem) => void;
  onCreateWidget?: () => void;
}

export const WidgetPaletteV2: React.FC<WidgetPaletteV2Props> = ({
  onAddWidget,
  onAddLibraryWidget,
  onCreateWidget,
}) => {
  const [activeTab, setActiveTab] = useState<PaletteTab>('builtin');
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
    <div className="scada-panel" style={{ width: 220, flexShrink: 0, display: 'flex', flexDirection: 'column' }}>
      <div className="scada-panel__header" style={{ padding: 0 }}>
        {/* Tab bar */}
        <div style={{ display: 'flex', width: '100%' }}>
          <button
            onClick={() => setActiveTab('builtin')}
            style={{
              flex: 1, padding: '8px 0', fontSize: 11, fontWeight: activeTab === 'builtin' ? 700 : 400,
              color: activeTab === 'builtin' ? '#2563EB' : '#6B7280',
              background: activeTab === 'builtin' ? '#EFF6FF' : 'transparent',
              border: 'none', borderBottom: activeTab === 'builtin' ? '2px solid #2563EB' : '2px solid transparent',
              cursor: 'pointer',
            }}
          >
            Built-in
          </button>
          <button
            onClick={() => setActiveTab('library')}
            style={{
              flex: 1, padding: '8px 0', fontSize: 11, fontWeight: activeTab === 'library' ? 700 : 400,
              color: activeTab === 'library' ? '#2563EB' : '#6B7280',
              background: activeTab === 'library' ? '#EFF6FF' : 'transparent',
              border: 'none', borderBottom: activeTab === 'library' ? '2px solid #2563EB' : '2px solid transparent',
              cursor: 'pointer',
            }}
          >
            Library
          </button>
        </div>
      </div>

      {/* ── Built-in Tab ── */}
      {activeTab === 'builtin' && (
        <>
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
          <div className="scada-panel__body" style={{ flex: 1, maxHeight: 'calc(100vh - 200px)' }}>
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
                    <span style={{ transform: expanded ? 'rotate(90deg)' : undefined, transition: 'transform 0.15s', fontSize: 10, display: 'flex', alignItems: 'center' }}><ChevronRightIcon size={10} /></span>
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
        </>
      )}

      {/* ── Library Tab ── */}
      {activeTab === 'library' && (
        <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          <WidgetLibraryPanel
            onAddLibraryWidget={onAddLibraryWidget ?? (() => {})}
            onCreateWidget={onCreateWidget}
          />
        </div>
      )}
    </div>
  );
};
