/**
 * WidgetLibraryPanel — shows widgets from the backend Widget Library
 * inside the SCADA editor's palette.  Supports search, category filter,
 * drag-and-drop, click-to-add, plus a "Create Widget" button.
 */

'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { widgetService, widgetCategoryService } from '../../services/widgetLibraryService';
import type { WidgetItem, WidgetCategoryItem } from '../../services/widgetLibraryService';

interface WidgetLibraryPanelProps {
  onAddLibraryWidget: (widget: WidgetItem) => void;
  onCreateWidget?: (() => void) | undefined;
}

export const WidgetLibraryPanel: React.FC<WidgetLibraryPanelProps> = ({
  onAddLibraryWidget,
  onCreateWidget,
}) => {
  const [widgets, setWidgets] = useState<WidgetItem[]>([]);
  const [categories, setCategories] = useState<WidgetCategoryItem[]>([]);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedCats, setExpandedCats] = useState<Set<string>>(new Set());

  // ── Fetch data ─────────────────────────────────────────────────────────────
  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [wRes, cRes] = await Promise.all([
        widgetService.list({ pageSize: 100 }),
        widgetCategoryService.list({ pageSize: 100 }),
      ]);
      setWidgets(wRes.data.filter((w) => w.isActive));
      setCategories(cRes.data);
      // Expand all categories by default
      setExpandedCats(new Set(cRes.data.map((c) => c.id)));
    } catch (err) {
      console.warn('[WidgetLibraryPanel] Failed to load:', err);
      setError('Failed to load widget library');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // ── Filter widgets ─────────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    let list = widgets;
    if (selectedCategory) {
      list = list.filter((w) => w.categoryId === selectedCategory);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (w) =>
          w.name.toLowerCase().includes(q) ||
          w.type.toLowerCase().includes(q) ||
          (w.description || '').toLowerCase().includes(q),
      );
    }
    return list;
  }, [widgets, search, selectedCategory]);

  // ── Group by category ──────────────────────────────────────────────────────
  const grouped = useMemo(() => {
    const map = new Map<string, { label: string; widgets: WidgetItem[] }>();

    // "Uncategorized" bucket
    const uncategorized: WidgetItem[] = [];
    const catMap = new Map(categories.map((c) => [c.id, c]));

    for (const w of filtered) {
      if (w.categoryId && catMap.has(w.categoryId)) {
        const cat = catMap.get(w.categoryId)!;
        if (!map.has(cat.id)) {
          map.set(cat.id, { label: cat.name, widgets: [] });
        }
        map.get(cat.id)!.widgets.push(w);
      } else {
        uncategorized.push(w);
      }
    }

    if (uncategorized.length > 0) {
      map.set('_uncategorized', { label: 'Uncategorized', widgets: uncategorized });
    }

    return map;
  }, [filtered, categories]);

  // ── Drag start ─────────────────────────────────────────────────────────────
  const handleDragStart = useCallback((e: React.DragEvent, widget: WidgetItem) => {
    // Encode library widget data so CanvasEditor can read it
    e.dataTransfer.setData('library-widget-id', widget.id);
    e.dataTransfer.setData('library-widget-data', JSON.stringify(widget));
    e.dataTransfer.effectAllowed = 'copy';
  }, []);

  const toggleCat = useCallback((catId: string) => {
    setExpandedCats((prev) => {
      const next = new Set(prev);
      if (next.has(catId)) next.delete(catId);
      else next.add(catId);
      return next;
    });
  }, []);

  // ── Loading / Error ────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div style={{ padding: 16, textAlign: 'center', color: '#9CA3AF', fontSize: 12 }}>
        Loading library...
      </div>
    );
  }
  if (error) {
    return (
      <div style={{ padding: 12, textAlign: 'center' }}>
        <div style={{ fontSize: 12, color: '#EF4444', marginBottom: 8 }}>{error}</div>
        <button
          onClick={fetchData}
          style={{
            padding: '4px 12px', fontSize: 11, border: '1px solid #D1D5DB',
            borderRadius: 4, background: '#fff', cursor: 'pointer',
          }}
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Search */}
      <div style={{ padding: '4px 8px' }}>
        <input
          type="text"
          placeholder="Search library..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{
            width: '100%', padding: '5px 8px', border: '1px solid #e5e7eb',
            borderRadius: 6, fontSize: 12, outline: 'none',
          }}
        />
      </div>

      {/* Category filter chips */}
      {categories.length > 0 && (
        <div style={{ padding: '2px 8px 4px', display: 'flex', flexWrap: 'wrap', gap: 3 }}>
          <button
            onClick={() => setSelectedCategory(null)}
            style={{
              padding: '2px 8px', fontSize: 10, borderRadius: 10,
              border: '1px solid',
              borderColor: !selectedCategory ? '#3B82F6' : '#E5E7EB',
              background: !selectedCategory ? '#EFF6FF' : '#fff',
              color: !selectedCategory ? '#2563EB' : '#6B7280',
              cursor: 'pointer',
            }}
          >
            All
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id === selectedCategory ? null : cat.id)}
              style={{
                padding: '2px 8px', fontSize: 10, borderRadius: 10,
                border: '1px solid',
                borderColor: selectedCategory === cat.id ? '#3B82F6' : '#E5E7EB',
                background: selectedCategory === cat.id ? '#EFF6FF' : '#fff',
                color: selectedCategory === cat.id ? '#2563EB' : '#6B7280',
                cursor: 'pointer',
              }}
            >
              {cat.icon || '📁'} {cat.name}
            </button>
          ))}
        </div>
      )}

      {/* Widget list */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '0 4px' }}>
        {filtered.length === 0 ? (
          <div style={{ padding: 16, textAlign: 'center', color: '#9CA3AF', fontSize: 12 }}>
            No library widgets found.
          </div>
        ) : (
          Array.from(grouped.entries()).map(([catId, { label, widgets: catWidgets }]) => {
            const expanded = expandedCats.has(catId);
            return (
              <div key={catId} style={{ marginBottom: 4 }}>
                <div
                  onClick={() => toggleCat(catId)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 4,
                    padding: '4px 8px', fontSize: 11, fontWeight: 600,
                    color: '#6B7280', cursor: 'pointer', userSelect: 'none',
                  }}
                >
                  <span style={{
                    transform: expanded ? 'rotate(90deg)' : undefined,
                    transition: 'transform 0.15s', fontSize: 10,
                  }}>▶</span>
                  {label} ({catWidgets.length})
                </div>
                {expanded && catWidgets.map((w) => (
                  <div
                    key={w.id}
                    className="scada-palette-item"
                    draggable
                    onDragStart={(e) => handleDragStart(e, w)}
                    onClick={() => onAddLibraryWidget(w)}
                    title={w.description || w.name}
                  >
                    <span className="scada-palette-item__icon">
                      {getWidgetIcon(w)}
                    </span>
                    <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {w.name}
                    </span>
                    <span style={{ fontSize: 9, color: '#D1D5DB' }}>📦</span>
                  </div>
                ))}
              </div>
            );
          })
        )}
      </div>

      {/* Create Widget button */}
      {onCreateWidget && (
        <div style={{ padding: 8, borderTop: '1px solid #E5E7EB' }}>
          <button
            onClick={onCreateWidget}
            style={{
              width: '100%', padding: '7px 12px', fontSize: 12, fontWeight: 600,
              background: '#2563EB', color: '#fff', border: 'none',
              borderRadius: 6, cursor: 'pointer',
            }}
          >
            + Create Widget
          </button>
        </div>
      )}
    </div>
  );
};

function getWidgetIcon(w: WidgetItem): string {
  if (w.category?.icon) return w.category.icon;
  const t = (w.type || '').toLowerCase();
  if (t.includes('svg') || t.includes('symbol')) return '🎨';
  if (t.includes('chart') || t.includes('graph')) return '📊';
  if (t.includes('button') || t.includes('switch')) return '🔘';
  if (t.includes('gauge') || t.includes('meter')) return '⏱️';
  if (t.includes('pump') || t.includes('motor') || t.includes('valve')) return '⚙️';
  return '📦';
}
