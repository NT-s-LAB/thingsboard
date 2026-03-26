/**
 * PropertyPanelV2 — Drives property editing from the widget's propSchema.
 *
 * For each PropField in the selected widget's definition, renders
 * the appropriate input control (string, number, boolean, color, select, etc.).
 * Also provides widget identity, style, and appearance controls.
 */

'use client';

import React, { useCallback, useEffect, useMemo, useState, useRef } from 'react';
import { widgetRegistry } from '../../core/registry';
import { useScadaRuntimeStore } from '../../stores/scadaRuntimeStore';
import { useScadaProjectStore } from '../../stores/scadaProjectStore';
import { imageLibraryService } from '../../services/imageLibraryService';
import type { ImageItem, ImageCategoryItem } from '../../services/imageLibraryService';
import type { PropField } from '../../core/types';
import type { ScreenBackground, BackgroundType } from '../../core/types';
import { LinkIcon, GridIcon, PageIcon, FolderIcon, WindowIcon } from './EditorIcons';
import '../../styles/scada.css';

/** Sanitize a color value for <input type="color"> — must be #rrggbb */
function toColorHex(v: unknown): string {
  const s = String(v ?? '');
  if (/^#[0-9a-fA-F]{6}$/.test(s)) return s;
  if (/^#[0-9a-fA-F]{3}$/.test(s)) {
    return '#' + s[1]! + s[1]! + s[2]! + s[2]! + s[3]! + s[3]!;
  }
  return '#000000';
}

/**
 * Get a value from a nested object using dot notation path.
 * E.g., getNestedValue({ a: { b: 1 } }, 'a.b') returns 1
 */
function getNestedValue(obj: Record<string, unknown>, path: string): unknown {
  const keys = path.split('.');
  let current: unknown = obj;
  for (const key of keys) {
    if (current === null || current === undefined) return undefined;
    // Handle array index notation like "series[0]"
    const arrayMatch = key.match(/^(.+)\[(\d+)\]$/);
    if (arrayMatch) {
      const [, prop, idx] = arrayMatch;
      current = (current as Record<string, unknown>)[prop ?? ''];
      if (Array.isArray(current)) {
        current = current[parseInt(idx ?? '0', 10)];
      } else {
        return undefined;
      }
    } else {
      current = (current as Record<string, unknown>)[key];
    }
  }
  return current;
}

/**
 * Set a value in a nested object using dot notation path.
 * Creates intermediate objects/arrays as needed.
 * Returns a new object (immutable).
 */
function setNestedValue(obj: Record<string, unknown>, path: string, value: unknown): Record<string, unknown> {
  const keys = path.split('.');
  const result = JSON.parse(JSON.stringify(obj ?? {})) as Record<string, unknown>;
  let current = result;
  
  for (let i = 0; i < keys.length - 1; i++) {
    const key = keys[i]!;
    const nextKey = keys[i + 1]!;
    
    // Handle array index notation
    const arrayMatch = key.match(/^(.+)\[(\d+)\]$/);
    if (arrayMatch) {
      const [, prop, idx] = arrayMatch;
      const index = parseInt(idx ?? '0', 10);
      if (!Array.isArray(current[prop ?? ''])) {
        current[prop ?? ''] = [];
      }
      const arr = current[prop ?? ''] as unknown[];
      while (arr.length <= index) arr.push({});
      if (typeof arr[index] !== 'object' || arr[index] === null) {
        arr[index] = {};
      }
      current = arr[index] as Record<string, unknown>;
    } else {
      // Check if next key is array or object
      const isNextArray = /^.+\[\d+\]$/.test(nextKey) || /^\d+$/.test(nextKey);
      if (current[key] === undefined || current[key] === null) {
        current[key] = isNextArray ? [] : {};
      } else if (typeof current[key] !== 'object') {
        current[key] = isNextArray ? [] : {};
      }
      current = current[key] as Record<string, unknown>;
    }
  }
  
  // Set the final value
  const lastKey = keys[keys.length - 1]!;
  const lastArrayMatch = lastKey.match(/^(.+)\[(\d+)\]$/);
  if (lastArrayMatch) {
    const [, prop, idx] = lastArrayMatch;
    const index = parseInt(idx ?? '0', 10);
    if (!Array.isArray(current[prop ?? ''])) {
      current[prop ?? ''] = [];
    }
    const arr = current[prop ?? ''] as unknown[];
    while (arr.length <= index) arr.push(null);
    arr[index] = value;
  } else {
    current[lastKey] = value;
  }
  
  return result;
}

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001';
const resolveImgUrl = (url: string | null | undefined): string => {
  if (!url) return '';
  return url.startsWith('http') ? url : `${API_BASE}${url}`;
};

export const PropertyPanelV2: React.FC = () => {
  const screen = useScadaRuntimeStore((s) => s.screen);
  const selectedWidgetIds = useScadaRuntimeStore((s) => s.selectedWidgetIds);
  const updateWidgetRuntime = useScadaRuntimeStore((s) => s.updateWidget);
  const updateWidgetTransformRuntime = useScadaRuntimeStore((s) => s.updateWidgetTransform);
  const updateScreenBackground = useScadaRuntimeStore((s) => s.updateScreenBackground);
  const updateScreenCanvasSize = useScadaRuntimeStore((s) => s.updateScreenCanvasSize);

  // Use project store for page-level properties (name/description edits)
  const project = useScadaProjectStore((s) => s.project);
  const activePageId = useScadaProjectStore((s) => s.activePageId);
  const renamePage = useScadaProjectStore((s) => s.renamePage);
  const updatePageBackground = useScadaProjectStore((s) => s.updatePageBackground);
  const updatePageCanvasSize = useScadaProjectStore((s) => s.updatePageCanvasSize);
  const updateWidgetProject = useScadaProjectStore((s) => s.updateWidgetInPage);

  // Update both stores for widget changes
  const updateWidget = useCallback(
    (id: string, patch: Parameters<typeof updateWidgetRuntime>[1]) => {
      updateWidgetRuntime(id, patch);
      updateWidgetProject(id, patch);
    },
    [updateWidgetRuntime, updateWidgetProject],
  );

  const updateWidgetTransform = useCallback(
    (id: string, transform: Parameters<typeof updateWidgetTransformRuntime>[1]) => {
      updateWidgetTransformRuntime(id, transform);
      updateWidgetProject(id, { transform: { ...screen?.widgets.find((w) => w.id === id)?.transform, ...transform } as any });
    },
    [updateWidgetTransformRuntime, updateWidgetProject, screen],
  );

  const groupWidgets = useScadaRuntimeStore((s) => s.groupWidgets);
  const ungroupWidgets = useScadaRuntimeStore((s) => s.ungroupWidgets);

  const activePage = useMemo(() => {
    if (!project || !activePageId) return null;
    return project.pages.find((p) => p.id === activePageId) ?? null;
  }, [project, activePageId]);

  const selectedWidget = useMemo(() => {
    if (!screen || selectedWidgetIds.length !== 1) return null;
    return screen.widgets.find((w) => w.id === selectedWidgetIds[0]) ?? null;
  }, [screen, selectedWidgetIds]);

  const definition = useMemo(() => {
    if (!selectedWidget) return null;
    return widgetRegistry.get(selectedWidget.type) ?? null;
  }, [selectedWidget]);

  const handlePropertyChange = useCallback(
    (key: string, value: unknown) => {
      if (!selectedWidget) return;
      // Support nested property paths like "chartConfig.display.title"
      const newProps = key.includes('.')
        ? setNestedValue(selectedWidget.properties, key, value)
        : { ...selectedWidget.properties, [key]: value };
      updateWidget(selectedWidget.id, { properties: newProps });
    },
    [selectedWidget, updateWidget],
  );

  const handleTransformChange = useCallback(
    (field: string, value: number) => {
      if (!selectedWidget) return;
      if (field === 'x' || field === 'y') {
        updateWidgetTransform(selectedWidget.id, {
          position: {
            ...selectedWidget.transform.position,
            [field]: value,
          },
        });
      } else if (field === 'width' || field === 'height') {
        updateWidgetTransform(selectedWidget.id, {
          size: {
            ...selectedWidget.transform.size,
            [field]: value,
          },
        });
      } else if (field === 'rotation') {
        updateWidgetTransform(selectedWidget.id, { rotation: value });
      } else if (field === 'zIndex') {
        updateWidgetTransform(selectedWidget.id, { zIndex: value });
      }
    },
    [selectedWidget, updateWidgetTransform],
  );

  const handleNameChange = useCallback(
    (name: string) => {
      if (!selectedWidget) return;
      updateWidget(selectedWidget.id, { name });
    },
    [selectedWidget, updateWidget],
  );

  // Check if selected widgets are grouped
  const selectedWidgetObjects = useMemo(() => {
    if (!screen) return [];
    return screen.widgets.filter((w) => selectedWidgetIds.includes(w.id));
  }, [screen, selectedWidgetIds]);

  const groupInfo = useMemo(() => {
    const groupIds = new Set(selectedWidgetObjects.map((w) => w.groupId).filter(Boolean));
    const allGrouped = selectedWidgetObjects.length > 0 && selectedWidgetObjects.every((w) => w.groupId);
    const anyGrouped = selectedWidgetObjects.some((w) => w.groupId);
    const sameGroup = groupIds.size === 1 && allGrouped;
    return { groupIds, allGrouped, anyGrouped, sameGroup, groupId: sameGroup ? Array.from(groupIds)[0] : null };
  }, [selectedWidgetObjects]);

  const handleGroup = useCallback(() => {
    if (selectedWidgetIds.length >= 2) {
      groupWidgets(selectedWidgetIds);
    }
  }, [groupWidgets, selectedWidgetIds]);

  const handleUngroup = useCallback(() => {
    ungroupWidgets(selectedWidgetIds);
  }, [ungroupWidgets, selectedWidgetIds]);

  if (!selectedWidget || !definition) {
    return (
      <div className="scada-panel" style={{ width: 260, flexShrink: 0 }}>
        <div className="scada-panel__header">
          {selectedWidgetIds.length > 1 
            ? groupInfo.sameGroup 
              ? <><LinkIcon size={12} /> Group Selected</> 
              : <><GridIcon size={12} /> {selectedWidgetIds.length} Widgets Selected</>
            : <><PageIcon size={12} /> Page: {activePage?.name || 'Properties'}</>}
        </div>
        {selectedWidgetIds.length > 1 ? (
          <div className="scada-panel__body" style={{ padding: 16 }}>
            <div style={{ color: '#374151', fontSize: 12, marginBottom: 12, textAlign: 'center' }}>
              <strong>{selectedWidgetIds.length}</strong> widgets selected
              {groupInfo.sameGroup && (
                <div style={{ color: '#8B5CF6', marginTop: 4 }}>
                  (Grouped)
                </div>
              )}
            </div>

            {/* Group/Ungroup buttons */}
            <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
              {!groupInfo.sameGroup && selectedWidgetIds.length >= 2 && (
                <button
                  onClick={handleGroup}
                  style={{
                    flex: 1,
                    padding: '6px 12px',
                    fontSize: 11,
                    fontWeight: 500,
                    color: '#fff',
                    background: '#8B5CF6',
                    border: 'none',
                    borderRadius: 4,
                    cursor: 'pointer',
                  }}
                  title="Ctrl+G"
                >
                  Group
                </button>
              )}
              {groupInfo.anyGrouped && (
                <button
                  onClick={handleUngroup}
                  style={{
                    flex: 1,
                    padding: '6px 12px',
                    fontSize: 11,
                    fontWeight: 500,
                    color: '#8B5CF6',
                    background: '#fff',
                    border: '1px solid #8B5CF6',
                    borderRadius: 4,
                    cursor: 'pointer',
                  }}
                  title="Ctrl+Shift+G"
                >
                  Ungroup
                </button>
              )}
            </div>

            <div style={{ fontSize: 11, color: '#6B7280', marginBottom: 8 }}>
              <strong>Tips:</strong>
            </div>
            <ul style={{ fontSize: 11, color: '#6B7280', paddingLeft: 16, margin: 0, lineHeight: 1.6 }}>
              <li>Drag any selected widget to move all</li>
              <li>Use alignment toolbar above canvas</li>
              <li>Press Delete to remove all</li>
              <li>Ctrl+D to duplicate all</li>
              <li>Ctrl+G to group widgets</li>
              <li>Click empty area to deselect</li>
            </ul>
          </div>
        ) : activePage ? (
          <PagePropertiesPanel
            page={activePage}
            onBackgroundChange={(bg) => {
              updateScreenBackground(bg);
              updatePageBackground(activePageId!, bg);
            }}
            onCanvasSizeChange={(size) => {
              updateScreenCanvasSize(size);
              updatePageCanvasSize(activePageId!, size);
            }}
            onNameChange={(name) => renamePage(activePageId!, name)}
          />
        ) : screen ? (
          <ScreenPropertiesPanel
            screen={screen}
            onBackgroundChange={updateScreenBackground}
            onCanvasSizeChange={updateScreenCanvasSize}
            onNameChange={() => {}}
            onDescriptionChange={() => {}}
          />
        ) : (
          <div className="scada-panel__body" style={{ color: '#9CA3AF', fontSize: 12, textAlign: 'center', padding: 16 }}>
            No screen loaded
          </div>
        )}
      </div>
    );
  }

  // Group propSchema fields
  const groups = new Map<string, PropField[]>();
  for (const field of definition.propSchema) {
    const group = field.group ?? 'General';
    const arr = groups.get(group) ?? [];
    arr.push(field);
    groups.set(group, arr);
  }

  // Shape widgets manage fill/stroke/radius/opacity via their own SVG propSchema.
  // Hiding the CSS-wrapper-based Appearance fields prevents conflicts.
  const isShapeWidget = selectedWidget.type.startsWith('shape-');

  // Widgets that declare their own bgColor / borderWidth in propSchema render
  // border & background internally. Showing the CSS-wrapper Appearance fields
  // for these widgets would create a double-border / double-bg conflict.
  const hasOwnAppearance =
    !isShapeWidget &&
    definition.propSchema.some((f) => f.key === 'bgColor' || f.key === 'borderWidth');

  // Combined flag: hide CSS-wrapper Appearance fields when the widget manages
  // its own appearance (shapes via SVG, others via own propSchema).
  const hideCssAppearance = isShapeWidget || hasOwnAppearance;

  return (
    <div className="scada-panel" style={{ width: 260, flexShrink: 0 }}>
      <div className="scada-panel__header">
        {definition.icon} {selectedWidget.name || definition.name}
      </div>
      <div className="scada-panel__body" style={{ maxHeight: 'calc(100vh - 200px)' }}>
        {/* Identity section */}
        <FieldGroup label="Identity">
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <label style={{ fontSize: 11, color: '#6B7280', width: 70, flexShrink: 0 }}>Name</label>
            <input
              type="text"
              value={selectedWidget.name}
              onChange={(e) => handleNameChange(e.target.value)}
              placeholder={definition.name}
              style={{ ...inputStyle, flex: 1 }}
            />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <label style={{ fontSize: 11, color: '#6B7280', width: 70, flexShrink: 0 }}>Type</label>
            <span style={{ fontSize: 11, color: '#9CA3AF' }}>{definition.name}</span>
          </div>
        </FieldGroup>

        {/* Transform section */}
        <FieldGroup label="Transform">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4 }}>
            <NumberInput label="X" value={selectedWidget.transform.position.x} onChange={(v) => handleTransformChange('x', v)} />
            <NumberInput label="Y" value={selectedWidget.transform.position.y} onChange={(v) => handleTransformChange('y', v)} />
            <NumberInput label="W" value={selectedWidget.transform.size.width} onChange={(v) => handleTransformChange('width', v)} min={10} />
            <NumberInput label="H" value={selectedWidget.transform.size.height} onChange={(v) => handleTransformChange('height', v)} min={10} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4 }}>
            <NumberInput label="Rot" value={selectedWidget.transform.rotation} onChange={(v) => handleTransformChange('rotation', v)} step={15} />
            <NumberInput label="Z" value={selectedWidget.transform.zIndex} onChange={(v) => handleTransformChange('zIndex', v)} />
          </div>
        </FieldGroup>

        {/* Appearance section */}
        {/* Shape widgets and widgets with own bgColor/borderWidth in propSchema manage  */}
        {/* appearance internally. CSS-wrapper fields are hidden for those to avoid conflict. */}
        <FieldGroup label="Appearance">
          {!hideCssAppearance && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <label style={{ fontSize: 11, color: '#6B7280', width: 70, flexShrink: 0 }}>Opacity</label>
              <input
                type="range"
                value={Number(selectedWidget.properties._opacity ?? 1)}
                min={0} max={1} step={0.05}
                onChange={(e) => handlePropertyChange('_opacity', Number(e.target.value))}
                style={{ flex: 1 }}
              />
              <span style={{ fontSize: 10, color: '#9CA3AF', width: 28, textAlign: 'right' }}>
                {Math.round(Number(selectedWidget.properties._opacity ?? 1) * 100)}%
              </span>
            </div>
          )}
          {!hideCssAppearance && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <label style={{ fontSize: 11, color: '#6B7280', width: 70, flexShrink: 0 }}>Border W</label>
              <input
                type="number"
                value={Number(selectedWidget.properties._borderWidth ?? 0)}
                min={0} max={20} step={1}
                onChange={(e) => handlePropertyChange('_borderWidth', Number(e.target.value))}
                style={{ ...inputStyle, flex: 1 }}
              />
            </div>
          )}
          {!hideCssAppearance && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <label style={{ fontSize: 11, color: '#6B7280', width: 70, flexShrink: 0 }}>Border C</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4, flex: 1 }}>
                <input
                  type="color"
                  value={toColorHex(selectedWidget.properties._borderColor)}
                  onChange={(e) => handlePropertyChange('_borderColor', e.target.value)}
                  style={{ width: 28, height: 24, border: 'none', cursor: 'pointer', padding: 0 }}
                />
                <input
                  type="text"
                  value={String(selectedWidget.properties._borderColor ?? '')}
                  onChange={(e) => handlePropertyChange('_borderColor', e.target.value)}
                  style={{ ...inputStyle, flex: 1 }}
                />
              </div>
            </div>
          )}
          {!hideCssAppearance && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <label style={{ fontSize: 11, color: '#6B7280', width: 70, flexShrink: 0 }}>Radius</label>
              <input
                type="number"
                value={Number(selectedWidget.properties._borderRadius ?? 0)}
                min={0} max={999} step={1}
                onChange={(e) => handlePropertyChange('_borderRadius', Number(e.target.value))}
                style={{ ...inputStyle, flex: 1 }}
              />
            </div>
          )}
          {!hideCssAppearance && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <label style={{ fontSize: 11, color: '#6B7280', width: 70, flexShrink: 0 }}>Bg Color</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4, flex: 1 }}>
                <input
                  type="color"
                  value={toColorHex(selectedWidget.properties._bgColor || '#ffffff')}
                  onChange={(e) => handlePropertyChange('_bgColor', e.target.value)}
                  style={{ width: 28, height: 24, border: 'none', cursor: 'pointer', padding: 0 }}
                />
                <input
                  type="text"
                  value={String(selectedWidget.properties._bgColor ?? '')}
                  onChange={(e) => handlePropertyChange('_bgColor', e.target.value)}
                  placeholder="transparent"
                  style={{ ...inputStyle, flex: 1 }}
                />
              </div>
            </div>
          )}
          {!hideCssAppearance && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <label style={{ fontSize: 11, color: '#6B7280', width: 70, flexShrink: 0 }}>Bg Image</label>
              <div style={{ flex: 1 }}>
                <ImagePicker
                  value={String(selectedWidget.properties._bgImage ?? '')}
                  onChange={(url) => handlePropertyChange('_bgImage', url)}
                />
              </div>
            </div>
          )}
          {hideCssAppearance && (
            <div style={{ fontSize: 11, color: '#9CA3AF', fontStyle: 'italic', padding: '4px 0' }}>
              {isShapeWidget
                ? 'Fill, stroke & radius are in the Style / Shape groups below.'
                : 'Background & border are in the Appearance group below.'}
            </div>
          )}
        </FieldGroup>

        {/* Property fields by group */}
        {Array.from(groups.entries()).map(([group, fields]) => (
          <FieldGroup key={group} label={group}>
            {fields.map((field) => {
              // Support nested property paths like "chartConfig.display.title"
              const value = field.key.includes('.')
                ? getNestedValue(selectedWidget.properties, field.key)
                : selectedWidget.properties[field.key];
              return (
                <PropFieldInput
                  key={field.key}
                  field={field}
                  value={value}
                  onChange={(v) => handlePropertyChange(field.key, v)}
                />
              );
            })}
          </FieldGroup>
        ))}
      </div>
    </div>
  );
};

// ─── Sub-components ──────────────────────────────────────────────────────────

const FieldGroup: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
  <div style={{ marginBottom: 12 }}>
    <div style={{ fontSize: 10, fontWeight: 600, color: '#9CA3AF', textTransform: 'uppercase', marginBottom: 4 }}>
      {label}
    </div>
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>{children}</div>
  </div>
);

interface PropFieldInputProps {
  field: PropField;
  value: unknown;
  onChange: (value: unknown) => void;
}

const PropFieldInput: React.FC<PropFieldInputProps> = ({ field, value, onChange }) => {
  const effectiveValue = value ?? field.defaultValue;

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
      <label style={{ fontSize: 11, color: '#6B7280', width: 70, flexShrink: 0 }} title={field.description}>
        {field.label}
      </label>
      <div style={{ flex: 1 }}>
        {field.type === 'string' && (
          <input
            type="text"
            value={String(effectiveValue ?? '')}
            onChange={(e) => onChange(e.target.value)}
            style={inputStyle}
          />
        )}
        {field.type === 'number' && (
          <input
            type="number"
            value={Number(effectiveValue ?? 0)}
            min={field.min}
            max={field.max}
            step={field.step ?? 1}
            onChange={(e) => onChange(Number(e.target.value))}
            style={inputStyle}
          />
        )}
        {field.type === 'range' && (
          <input
            type="range"
            value={Number(effectiveValue ?? field.min ?? 0)}
            min={field.min ?? 0}
            max={field.max ?? 100}
            step={field.step ?? 1}
            onChange={(e) => onChange(Number(e.target.value))}
            style={{ width: '100%' }}
          />
        )}
        {field.type === 'boolean' && (
          <input
            type="checkbox"
            checked={Boolean(effectiveValue)}
            onChange={(e) => onChange(e.target.checked)}
          />
        )}
        {field.type === 'color' && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <input
              type="color"
              value={toColorHex(effectiveValue)}
              onChange={(e) => onChange(e.target.value)}
              style={{ width: 28, height: 24, border: 'none', cursor: 'pointer', padding: 0 }}
            />
            <input
              type="text"
              value={String(effectiveValue ?? '')}
              onChange={(e) => onChange(e.target.value)}
              style={{ ...inputStyle, flex: 1 }}
            />
          </div>
        )}
        {field.type === 'select' && (
          <select
            value={String(effectiveValue ?? '')}
            onChange={(e) => onChange(e.target.value)}
            style={inputStyle}
          >
            {field.options?.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        )}
        {field.type === 'json' && (
          <textarea
            value={typeof effectiveValue === 'string' ? effectiveValue : JSON.stringify(effectiveValue, null, 2)}
            onChange={(e) => {
              try {
                onChange(JSON.parse(e.target.value));
              } catch {
                // Keep raw text until valid
              }
            }}
            rows={3}
            style={{ ...inputStyle, resize: 'vertical', fontFamily: 'monospace', fontSize: 10 }}
          />
        )}
        {field.type === 'svgAsset' && (
          <input
            type="text"
            value={String(effectiveValue ?? '')}
            onChange={(e) => onChange(e.target.value)}
            placeholder="SVG Asset ID..."
            style={inputStyle}
          />
        )}
        {field.type === 'image' && (
          <ImagePicker
            value={String(effectiveValue ?? '')}
            onChange={(url) => onChange(url)}
          />
        )}
      </div>
    </div>
  );
};

// ─── Image Picker (popup version with image library) ─────────────────────────

const ImagePicker: React.FC<{ value: string; onChange: (url: string) => void }> = ({ value, onChange }) => {
  const [showPopup, setShowPopup] = useState(false);

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Image URL..."
          style={{ ...inputStyle, flex: 1 }}
        />
        <button
          onClick={() => setShowPopup(true)}
          style={{
            padding: '3px 6px', border: '1px solid #d1d5db', borderRadius: 4,
            background: '#fff', cursor: 'pointer', fontSize: 11, display: 'flex', alignItems: 'center',
          }}
          title="Browse image library"
        >
          <FolderIcon size={12} />
        </button>
      </div>
      {value && (
        <div style={{ marginTop: 4, border: '1px solid #e5e7eb', borderRadius: 4, overflow: 'hidden', maxHeight: 60, position: 'relative' }}>
          <img src={resolveImgUrl(value)} alt="" style={{ width: '100%', height: 60, objectFit: 'contain', display: 'block' }} />
          <button
            onClick={() => onChange('')}
            style={{
              position: 'absolute', top: 2, right: 2, width: 18, height: 18,
              background: 'rgba(0,0,0,0.5)', color: '#fff', border: 'none',
              borderRadius: '50%', cursor: 'pointer', fontSize: 10, lineHeight: '18px',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
            title="Remove image"
          >
            ✕
          </button>
        </div>
      )}
      {showPopup && (
        <ImagePickerPopup
          value={value}
          onSelect={(url) => { onChange(url); setShowPopup(false); }}
          onClose={() => setShowPopup(false)}
        />
      )}
    </div>
  );
};

// ─── Image Picker Popup (full overlay dialog) ────────────────────────────────

const ImagePickerPopup: React.FC<{
  value: string;
  onSelect: (url: string) => void;
  onClose: () => void;
}> = ({ value, onSelect, onClose }) => {
  const [categories, setCategories] = useState<ImageCategoryItem[]>([]);
  const [images, setImages] = useState<ImageItem[]>([]);
  const [selectedCat, setSelectedCat] = useState<string | undefined>(undefined);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    imageLibraryService.getCategories().then(setCategories).catch(() => {});
  }, []);

  useEffect(() => {
    setLoading(true);
    const params: { categoryId?: string; search?: string; limit: number } = { limit: 100 };
    if (selectedCat) params.categoryId = selectedCat;
    if (search) params.search = search;
    imageLibraryService
      .getImages(params)
      .then((r) => setImages(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [selectedCat, search]);

  return (
    <div
      ref={overlayRef}
      onClick={(e) => { if (e.target === overlayRef.current) onClose(); }}
      style={{
        position: 'fixed', inset: 0, zIndex: 10000,
        background: 'rgba(0,0,0,0.4)', display: 'flex',
        alignItems: 'center', justifyContent: 'center',
      }}
    >
      <div style={{
        background: '#fff', borderRadius: 10, width: 560, maxHeight: '80vh',
        display: 'flex', flexDirection: 'column', boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
        overflow: 'hidden',
      }}>
        {/* Header */}
        <div style={{
          padding: '12px 16px', borderBottom: '1px solid #e5e7eb',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        }}>
          <span style={{ fontSize: 14, fontWeight: 600, color: '#111827', display: 'flex', alignItems: 'center', gap: 6 }}><FolderIcon size={14} /> Select Image</span>
          <button onClick={onClose} style={{
            background: 'none', border: 'none', fontSize: 18, cursor: 'pointer', color: '#6B7280',
          }}>✕</button>
        </div>

        {/* Search */}
        <div style={{ padding: '8px 16px', borderBottom: '1px solid #e5e7eb' }}>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search images..."
            style={{ ...inputStyle, width: '100%', padding: '6px 10px', fontSize: 12 }}
            autoFocus
          />
        </div>

        {/* Category filter */}
        <div style={{ display: 'flex', gap: 4, padding: '8px 16px', flexWrap: 'wrap', borderBottom: '1px solid #f3f4f6' }}>
          <CatButton active={!selectedCat} onClick={() => setSelectedCat(undefined)}>All</CatButton>
          {categories.map((c) => (
            <CatButton key={c.id} active={selectedCat === c.id} onClick={() => setSelectedCat(c.id)}>
              {c.name}
            </CatButton>
          ))}
        </div>

        {/* Image grid */}
        <div style={{ flex: 1, overflowY: 'auto', padding: 12 }}>
          {loading ? (
            <div style={{ textAlign: 'center', color: '#9CA3AF', padding: 24, fontSize: 12 }}>Loading...</div>
          ) : images.length === 0 ? (
            <div style={{ textAlign: 'center', color: '#9CA3AF', padding: 24, fontSize: 12 }}>No images found</div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 8 }}>
              {images.map((img) => (
                <div
                  key={img.id}
                  onClick={() => onSelect(resolveImgUrl(img.url))}
                  style={{
                    border: resolveImgUrl(img.url) === value ? '2px solid #3B82F6' : '1px solid #e5e7eb',
                    borderRadius: 6, cursor: 'pointer', overflow: 'hidden',
                    aspectRatio: '1', display: 'flex', flexDirection: 'column',
                    alignItems: 'center', justifyContent: 'center',
                    background: resolveImgUrl(img.url) === value ? '#eff6ff' : '#f9fafb',
                    transition: 'border-color 0.15s, transform 0.1s',
                  }}
                  title={img.originalName}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderColor = '#93c5fd'; }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLElement).style.borderColor = resolveImgUrl(img.url) === value ? '#3B82F6' : '#e5e7eb';
                  }}
                >
                  <img src={resolveImgUrl(img.url)} alt={img.originalName} style={{ maxWidth: '85%', maxHeight: '70%', objectFit: 'contain' }} />
                  <span style={{ fontSize: 9, color: '#6B7280', marginTop: 2, maxWidth: '90%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', textAlign: 'center' }}>
                    {img.originalName?.replace(/\.[^.]+$/, '') ?? ''}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const CatButton: React.FC<{ active: boolean; onClick: () => void; children: React.ReactNode }> = ({ active, onClick, children }) => (
  <button
    onClick={onClick}
    style={{
      padding: '3px 10px', borderRadius: 4, fontSize: 11, cursor: 'pointer',
      border: '1px solid', fontWeight: active ? 600 : 400,
      borderColor: active ? '#3B82F6' : '#d1d5db',
      background: active ? '#3B82F6' : '#f9fafb',
      color: active ? '#fff' : '#374151',
    }}
  >
    {children}
  </button>
);

// ─── Screen Properties Panel (shown when no widget selected) ─────────────────

interface ScreenPropertiesPanelProps {
  screen: import('../../core/types').ScreenDefinition;
  onBackgroundChange: (bg: Partial<ScreenBackground>) => void;
  onCanvasSizeChange: (size: Partial<{ width: number; height: number }>) => void;
  onNameChange: (name: string) => void;
  onDescriptionChange: (description: string) => void;
}

const ScreenPropertiesPanel: React.FC<ScreenPropertiesPanelProps> = ({
  screen,
  onBackgroundChange,
  onCanvasSizeChange,
  onNameChange,
  onDescriptionChange,
}) => {
  const bg = screen.background ?? { type: 'color' as BackgroundType, color: '#f8fafc' };

  return (
    <div className="scada-panel__body" style={{ maxHeight: 'calc(100vh - 200px)' }}>
      {/* Screen Identity */}
      <FieldGroup label="Screen">
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <label style={{ fontSize: 11, color: '#6B7280', width: 70, flexShrink: 0 }}>Name</label>
          <input
            type="text"
            value={screen.name}
            onChange={(e) => onNameChange(e.target.value)}
            style={{ ...inputStyle, flex: 1 }}
          />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <label style={{ fontSize: 11, color: '#6B7280', width: 70, flexShrink: 0 }}>Desc</label>
          <input
            type="text"
            value={screen.description ?? ''}
            onChange={(e) => onDescriptionChange(e.target.value)}
            placeholder="Description..."
            style={{ ...inputStyle, flex: 1 }}
          />
        </div>
      </FieldGroup>

      {/* Canvas Size */}
      <FieldGroup label="Canvas Size">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4 }}>
          <NumberInput label="W" value={screen.canvasSize.width} onChange={(v) => onCanvasSizeChange({ width: v })} min={100} />
          <NumberInput label="H" value={screen.canvasSize.height} onChange={(v) => onCanvasSizeChange({ height: v })} min={100} />
        </div>
        {/* Quick presets */}
        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
          {[
            { label: '1920×1080', w: 1920, h: 1080 },
            { label: '1280×720', w: 1280, h: 720 },
            { label: '1024×768', w: 1024, h: 768 },
            { label: '800×600', w: 800, h: 600 },
          ].map((p) => (
            <button
              key={p.label}
              onClick={() => onCanvasSizeChange({ width: p.w, height: p.h })}
              style={{
                padding: '2px 6px', borderRadius: 3, fontSize: 9, cursor: 'pointer',
                border: '1px solid #d1d5db',
                background: screen.canvasSize.width === p.w && screen.canvasSize.height === p.h ? '#3B82F6' : '#f9fafb',
                color: screen.canvasSize.width === p.w && screen.canvasSize.height === p.h ? '#fff' : '#6B7280',
              }}
            >
              {p.label}
            </button>
          ))}
        </div>
      </FieldGroup>

      {/* Background */}
      <FieldGroup label="Background">
        {/* Type selector */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <label style={{ fontSize: 11, color: '#6B7280', width: 70, flexShrink: 0 }}>Type</label>
          <select
            value={bg.type}
            onChange={(e) => onBackgroundChange({ type: e.target.value as BackgroundType })}
            style={{ ...inputStyle, flex: 1 }}
          >
            <option value="color">Solid Color</option>
            <option value="image">Image</option>
          </select>
        </div>

        {/* Color picker (always shown for base color) */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <label style={{ fontSize: 11, color: '#6B7280', width: 70, flexShrink: 0 }}>Color</label>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, flex: 1 }}>
            <input
              type="color"
              value={toColorHex(bg.color || '#f8fafc')}
              onChange={(e) => onBackgroundChange({ color: e.target.value })}
              style={{ width: 28, height: 24, border: 'none', cursor: 'pointer', padding: 0 }}
            />
            <input
              type="text"
              value={bg.color ?? ''}
              onChange={(e) => onBackgroundChange({ color: e.target.value })}
              placeholder="#f8fafc"
              style={{ ...inputStyle, flex: 1 }}
            />
          </div>
        </div>

        {/* Image URL + picker (for image type) */}
        {bg.type === 'image' && (
          <>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <label style={{ fontSize: 11, color: '#6B7280', width: 70, flexShrink: 0 }}>Image</label>
              <div style={{ flex: 1 }}>
                <ImagePicker
                  value={bg.imageUrl ?? ''}
                  onChange={(url) => onBackgroundChange({ imageUrl: url })}
                />
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <label style={{ fontSize: 11, color: '#6B7280', width: 70, flexShrink: 0 }}>Fit</label>
              <select
                value={bg.fit ?? 'cover'}
                onChange={(e) => onBackgroundChange({ fit: e.target.value as 'cover' | 'contain' | 'fill' | 'none' })}
                style={{ ...inputStyle, flex: 1 }}
              >
                <option value="cover">Cover</option>
                <option value="contain">Contain</option>
                <option value="fill">Fill (stretch)</option>
                <option value="none">None (original)</option>
              </select>
            </div>
          </>
        )}

        {/* Opacity */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <label style={{ fontSize: 11, color: '#6B7280', width: 70, flexShrink: 0 }}>Opacity</label>
          <input
            type="range"
            value={bg.opacity ?? 1}
            min={0} max={1} step={0.05}
            onChange={(e) => onBackgroundChange({ opacity: Number(e.target.value) })}
            style={{ flex: 1 }}
          />
          <span style={{ fontSize: 10, color: '#9CA3AF', width: 28, textAlign: 'right' }}>
            {Math.round((bg.opacity ?? 1) * 100)}%
          </span>
        </div>
      </FieldGroup>

      {/* Preview */}
      <FieldGroup label="Preview">
        <div style={{
          width: '100%', height: 80, borderRadius: 6, border: '1px solid #e5e7eb', overflow: 'hidden',
          ...(bg.type === 'color' ? { background: bg.color ?? '#f8fafc' } : {}),
          ...(bg.type === 'image' && bg.imageUrl ? {
            backgroundImage: `url(${bg.imageUrl})`,
            backgroundSize: bg.fit ?? 'cover',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat',
            backgroundColor: bg.color ?? '#f8fafc',
          } : {}),
          opacity: bg.opacity ?? 1,
        }}>
          {bg.type === 'image' && !bg.imageUrl && (
            <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9CA3AF', fontSize: 11 }}>
              No image selected
            </div>
          )}
        </div>
      </FieldGroup>
    </div>
  );
};

// ─── Page Properties Panel (multi-page: shown when no widget selected) ───────

interface PagePropertiesPanelProps {
  page: import('../../core/types/project.types').ScadaPage;
  onBackgroundChange: (bg: Partial<ScreenBackground>) => void;
  onCanvasSizeChange: (size: Partial<{ width: number; height: number }>) => void;
  onNameChange: (name: string) => void;
}

const PagePropertiesPanel: React.FC<PagePropertiesPanelProps> = ({
  page,
  onBackgroundChange,
  onCanvasSizeChange,
  onNameChange,
}) => {
  const bg = page.background ?? { type: 'color' as BackgroundType, color: '#f8fafc' };

  return (
    <div className="scada-panel__body" style={{ maxHeight: 'calc(100vh - 200px)' }}>
      {/* Page Identity */}
      <FieldGroup label="Page">
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <label style={{ fontSize: 11, color: '#6B7280', width: 70, flexShrink: 0 }}>Name</label>
          <input
            type="text"
            value={page.name}
            onChange={(e) => onNameChange(e.target.value)}
            style={{ ...inputStyle, flex: 1 }}
          />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <label style={{ fontSize: 11, color: '#6B7280', width: 70, flexShrink: 0 }}>Type</label>
          <span style={{ fontSize: 11, color: '#9CA3AF', textTransform: 'capitalize', display: 'flex', alignItems: 'center', gap: 4 }}>
            {page.pageType === 'popup' ? <><WindowIcon size={11} /> Popup</> : <><PageIcon size={11} /> Normal</>}
          </span>
        </div>
      </FieldGroup>

      {/* Canvas Size */}
      <FieldGroup label="Canvas Size">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4 }}>
          <NumberInput label="W" value={page.canvasSize.width} onChange={(v) => onCanvasSizeChange({ width: v })} min={100} />
          <NumberInput label="H" value={page.canvasSize.height} onChange={(v) => onCanvasSizeChange({ height: v })} min={100} />
        </div>
        {/* Quick presets */}
        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
          {[
            { label: '1920×1080', w: 1920, h: 1080 },
            { label: '1280×720', w: 1280, h: 720 },
            { label: '1024×768', w: 1024, h: 768 },
            { label: '800×600', w: 800, h: 600 },
          ].map((p) => (
            <button
              key={p.label}
              onClick={() => onCanvasSizeChange({ width: p.w, height: p.h })}
              style={{
                padding: '2px 6px', borderRadius: 3, fontSize: 9, cursor: 'pointer',
                border: '1px solid #d1d5db',
                background: page.canvasSize.width === p.w && page.canvasSize.height === p.h ? '#3B82F6' : '#f9fafb',
                color: page.canvasSize.width === p.w && page.canvasSize.height === p.h ? '#fff' : '#6B7280',
              }}
            >
              {p.label}
            </button>
          ))}
        </div>
      </FieldGroup>

      {/* Background */}
      <FieldGroup label="Background">
        {/* Type selector */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <label style={{ fontSize: 11, color: '#6B7280', width: 70, flexShrink: 0 }}>Type</label>
          <select
            value={bg.type}
            onChange={(e) => onBackgroundChange({ type: e.target.value as BackgroundType })}
            style={{ ...inputStyle, flex: 1 }}
          >
            <option value="color">Solid Color</option>
            <option value="image">Image</option>
          </select>
        </div>

        {/* Color picker */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <label style={{ fontSize: 11, color: '#6B7280', width: 70, flexShrink: 0 }}>Color</label>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, flex: 1 }}>
            <input
              type="color"
              value={toColorHex(bg.color || '#f8fafc')}
              onChange={(e) => onBackgroundChange({ color: e.target.value })}
              style={{ width: 28, height: 24, border: 'none', cursor: 'pointer', padding: 0 }}
            />
            <input
              type="text"
              value={bg.color ?? ''}
              onChange={(e) => onBackgroundChange({ color: e.target.value })}
              placeholder="#f8fafc"
              style={{ ...inputStyle, flex: 1 }}
            />
          </div>
        </div>

        {/* Image URL + picker (for image type) */}
        {bg.type === 'image' && (
          <>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <label style={{ fontSize: 11, color: '#6B7280', width: 70, flexShrink: 0 }}>Image</label>
              <div style={{ flex: 1 }}>
                <ImagePicker
                  value={bg.imageUrl ?? ''}
                  onChange={(url) => onBackgroundChange({ imageUrl: url })}
                />
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <label style={{ fontSize: 11, color: '#6B7280', width: 70, flexShrink: 0 }}>Fit</label>
              <select
                value={bg.fit ?? 'cover'}
                onChange={(e) => onBackgroundChange({ fit: e.target.value as 'cover' | 'contain' | 'fill' | 'none' })}
                style={{ ...inputStyle, flex: 1 }}
              >
                <option value="cover">Cover</option>
                <option value="contain">Contain</option>
                <option value="fill">Fill (stretch)</option>
                <option value="none">None (original)</option>
              </select>
            </div>
          </>
        )}

        {/* Opacity */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <label style={{ fontSize: 11, color: '#6B7280', width: 70, flexShrink: 0 }}>Opacity</label>
          <input
            type="range"
            value={bg.opacity ?? 1}
            min={0} max={1} step={0.05}
            onChange={(e) => onBackgroundChange({ opacity: Number(e.target.value) })}
            style={{ flex: 1 }}
          />
          <span style={{ fontSize: 10, color: '#9CA3AF', width: 28, textAlign: 'right' }}>
            {Math.round((bg.opacity ?? 1) * 100)}%
          </span>
        </div>
      </FieldGroup>

      {/* Preview */}
      <FieldGroup label="Preview">
        <div style={{
          width: '100%', height: 80, borderRadius: 6, border: '1px solid #e5e7eb', overflow: 'hidden',
          ...(bg.type === 'color' ? { background: bg.color ?? '#f8fafc' } : {}),
          ...(bg.type === 'image' && bg.imageUrl ? {
            backgroundImage: `url(${bg.imageUrl})`,
            backgroundSize: bg.fit ?? 'cover',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat',
            backgroundColor: bg.color ?? '#f8fafc',
          } : {}),
          opacity: bg.opacity ?? 1,
        }}>
          {bg.type === 'image' && !bg.imageUrl && (
            <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9CA3AF', fontSize: 11 }}>
              No image selected
            </div>
          )}
        </div>
      </FieldGroup>
    </div>
  );
};

const NumberInput: React.FC<{
  label: string;
  value: number;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
  step?: number;
}> = ({ label, value, onChange, min, max, step }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
    <label style={{ fontSize: 10, color: '#9CA3AF', width: 24, textAlign: 'right' }}>{label}</label>
    <input
      type="number"
      value={value}
      min={min}
      max={max}
      step={step ?? 1}
      onChange={(e) => onChange(Number(e.target.value))}
      style={{ ...inputStyle, width: 56 }}
    />
  </div>
);

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '4px 6px',
  border: '1px solid #e5e7eb',
  borderRadius: 4,
  fontSize: 11,
  outline: 'none',
  background: '#fff',
};
