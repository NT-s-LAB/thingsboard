/**
 * WidgetEditorDialog — Professional full-featured dialog for creating and editing
 * custom widgets.  Three-tab interface:
 *
 *   1. **Basic** — Name, description, type, category, size
 *   2. **Visual** — SVG / image content editor with live preview
 *   3. **Properties** — Visual property schema builder
 *
 * Saves to the backend `/widgets` API and optionally refreshes the widget library panel.
 */

'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { widgetService, widgetCategoryService } from '../../services/widgetLibraryService';
import type { WidgetItem, WidgetCategoryItem } from '../../services/widgetLibraryService';
import type { PropFieldType } from '../../core/types';

// ─── Types ───────────────────────────────────────────────────────────────────

interface PropEntry {
  id: string;
  key: string;
  label: string;
  type: PropFieldType;
  defaultValue: string;
  group: string;
  description: string;
  options: string; // JSON for select options
  min: string;
  max: string;
  step: string;
}

interface WidgetEditorDialogProps {
  open: boolean;
  onClose: () => void;
  onSaved?: (widget: WidgetItem) => void;
  /** If provided, the dialog edits this widget. Otherwise creates new. */
  editWidget?: WidgetItem | null;
}

type EditorTab = 'basic' | 'visual' | 'properties' | 'config';

const FIELD_TYPES: { value: PropFieldType; label: string }[] = [
  { value: 'string', label: 'Text' },
  { value: 'number', label: 'Number' },
  { value: 'boolean', label: 'Boolean' },
  { value: 'color', label: 'Color' },
  { value: 'select', label: 'Select' },
  { value: 'range', label: 'Range' },
  { value: 'image', label: 'Image' },
  { value: 'json', label: 'JSON' },
];

function uid(): string {
  return `p_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
}

function emptyPropEntry(): PropEntry {
  return {
    id: uid(),
    key: '',
    label: '',
    type: 'string',
    defaultValue: '',
    group: '',
    description: '',
    options: '',
    min: '',
    max: '',
    step: '',
  };
}

// ─── Component ───────────────────────────────────────────────────────────────

export const WidgetEditorDialog: React.FC<WidgetEditorDialogProps> = ({
  open,
  onClose,
  onSaved,
  editWidget,
}) => {
  const [tab, setTab] = useState<EditorTab>('basic');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ── Basic Info ──
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [widgetType, setWidgetType] = useState('custom');
  const [defaultWidth, setDefaultWidth] = useState(120);
  const [defaultHeight, setDefaultHeight] = useState(80);
  const [categoryId, setCategoryId] = useState('');
  const [icon, setIcon] = useState('📦');

  // ── Visual ──
  const [svgContent, setSvgContent] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [previewSvg, setPreviewSvg] = useState('');

  // ── Config (JSON) ──
  const [rawConfig, setRawConfig] = useState('{}');
  const [rawTemplate, setRawTemplate] = useState('{}');
  const [configError, setConfigError] = useState<string | null>(null);
  const [useRawConfig, setUseRawConfig] = useState(false);

  // ── Properties ──
  const [propEntries, setPropEntries] = useState<PropEntry[]>([]);

  // ── Categories ──
  const [categories, setCategories] = useState<WidgetCategoryItem[]>([]);

  // Load categories
  useEffect(() => {
    if (open) {
      widgetCategoryService.list({ pageSize: 100 }).then((res) => {
        setCategories(res.data);
      }).catch(() => {});
    }
  }, [open]);

  // Populate from editWidget
  useEffect(() => {
    if (!open) return;
    if (editWidget) {
      setName(editWidget.name);
      setDescription(editWidget.description || '');
      setWidgetType(editWidget.type || 'custom');
      setCategoryId(editWidget.categoryId || '');

      const cfg = (editWidget.config || {}) as Record<string, unknown>;
      const tpl = (editWidget.template || {}) as Record<string, unknown>;

      setDefaultWidth((cfg.defaultWidth as number) || 120);
      setDefaultHeight((cfg.defaultHeight as number) || 80);
      setIcon((cfg.icon as string) || '📦');
      setSvgContent((tpl.svg as string) || '');
      setImageUrl((tpl.imageUrl as string) || '');
      setPreviewSvg(editWidget.preview || '');

      // Populate raw JSON fields
      setRawConfig(JSON.stringify(editWidget.config || {}, null, 2));
      setRawTemplate(JSON.stringify(editWidget.template || {}, null, 2));
      setUseRawConfig(false);
      setConfigError(null);

      // Rebuild prop entries from config.propSchema
      const schema = (cfg.propSchema as Array<Record<string, unknown>>) || [];
      setPropEntries(
        schema.map((s) => ({
          id: uid(),
          key: String(s.key || ''),
          label: String(s.label || ''),
          type: (s.type as PropFieldType) || 'string',
          defaultValue: String(s.defaultValue ?? ''),
          group: String(s.group || ''),
          description: String(s.description || ''),
          options: s.options ? JSON.stringify(s.options) : '',
          min: s.min !== undefined ? String(s.min) : '',
          max: s.max !== undefined ? String(s.max) : '',
          step: s.step !== undefined ? String(s.step) : '',
        })),
      );
    } else {
      // Reset for new widget
      setName('');
      setDescription('');
      setWidgetType('custom');
      setCategoryId('');
      setDefaultWidth(120);
      setDefaultHeight(80);
      setIcon('📦');
      setSvgContent('');
      setImageUrl('');
      setPreviewSvg('');
      setPropEntries([]);
      setRawConfig('{}');
      setRawTemplate('{}');
      setUseRawConfig(false);
      setConfigError(null);
      setTab('basic');
    }
    setError(null);
  }, [open, editWidget]);

  // ── Property helpers ──
  const addProp = useCallback(() => {
    setPropEntries((prev) => [...prev, emptyPropEntry()]);
  }, []);

  const removeProp = useCallback((id: string) => {
    setPropEntries((prev) => prev.filter((p) => p.id !== id));
  }, []);

  const updateProp = useCallback((id: string, field: keyof PropEntry, value: string) => {
    setPropEntries((prev) =>
      prev.map((p) => (p.id === id ? { ...p, [field]: value } : p)),
    );
  }, []);

  const moveProp = useCallback((idx: number, dir: -1 | 1) => {
    setPropEntries((prev) => {
      const arr = [...prev];
      const target = idx + dir;
      if (target < 0 || target >= arr.length) return arr;
      const temp = arr[idx]!;
      arr[idx] = arr[target]!;
      arr[target] = temp;
      return arr;
    });
  }, []);

  // ── Build config & template objects ──
  const buildPayload = useCallback(() => {
    const propSchema = propEntries
      .filter((p) => p.key.trim())
      .map((p) => {
        const entry: Record<string, unknown> = {
          key: p.key.trim(),
          label: p.label.trim() || p.key.trim(),
          type: p.type,
          defaultValue: parseDefault(p.defaultValue, p.type),
        };
        if (p.group) entry.group = p.group;
        if (p.description) entry.description = p.description;
        if (p.type === 'select' && p.options) {
          try { entry.options = JSON.parse(p.options); } catch { /* skip */ }
        }
        if (p.type === 'number' || p.type === 'range') {
          if (p.min) entry.min = Number(p.min);
          if (p.max) entry.max = Number(p.max);
          if (p.step) entry.step = Number(p.step);
        }
        return entry;
      });

    const config: Record<string, unknown> = {
      propSchema,
      defaultWidth,
      defaultHeight,
      icon,
      bindingSchema: [
        { key: 'value', label: 'Value', valueType: 'number', suggestedKey: '' },
      ],
      actionSchema: [
        { trigger: 'click', label: 'On Click' },
      ],
    };

    const template: Record<string, unknown> = {};
    if (svgContent.trim()) template.svg = svgContent.trim();
    if (imageUrl.trim()) template.imageUrl = imageUrl.trim();

    return { config, template };
  }, [propEntries, svgContent, imageUrl, defaultWidth, defaultHeight, icon]);

  // ── Build payload from raw JSON (Config tab override) ──
  const buildRawPayload = useCallback((): { config: Record<string, unknown>; template: Record<string, unknown> } | null => {
    try {
      const parsedConfig = JSON.parse(rawConfig);
      const parsedTemplate = JSON.parse(rawTemplate);
      setConfigError(null);
      return { config: parsedConfig, template: parsedTemplate };
    } catch (err) {
      setConfigError(err instanceof Error ? err.message : 'Invalid JSON');
      return null;
    }
  }, [rawConfig, rawTemplate]);

  // ── Save ──
  const handleSave = useCallback(async () => {
    if (!name.trim()) {
      setError('Name is required.');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      let config: Record<string, unknown>;
      let template: Record<string, unknown>;

      if (useRawConfig) {
        const raw = buildRawPayload();
        if (!raw) {
          setSaving(false);
          return;
        }
        config = raw.config;
        template = raw.template;
      } else {
        const built = buildPayload();
        config = built.config;
        template = built.template;
      }
      const payload = {
        name: name.trim(),
        description: description.trim() || undefined,
        type: widgetType || 'custom',
        config,
        template,
        preview: previewSvg || undefined,
        categoryId: categoryId || undefined,
      };

      let result: WidgetItem;
      if (editWidget) {
        result = await widgetService.update(editWidget.id, payload);
      } else {
        result = await widgetService.create(payload as Parameters<typeof widgetService.create>[0]);
      }

      onSaved?.(result);
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Save failed';
      setError(msg);
    } finally {
      setSaving(false);
    }
  }, [name, description, widgetType, categoryId, previewSvg, buildPayload, buildRawPayload, useRawConfig, editWidget, onClose, onSaved]);

  // ── Sync visual tab → raw JSON when switching to config tab ──
  const handleTabChange = useCallback((newTab: EditorTab) => {
    if (newTab === 'config' && !useRawConfig) {
      const { config, template } = buildPayload();
      setRawConfig(JSON.stringify(config, null, 2));
      setRawTemplate(JSON.stringify(template, null, 2));
    }
    setTab(newTab);
  }, [buildPayload, useRawConfig]);

  // ── SVG preview (replace {{placeholders}} with safe defaults) ──
  const previewHtml = useMemo(() => {
    const sanitize = (s: string) => s.replace(/\{\{(\w+)\}\}/g, '0');
    if (svgContent.trim()) return sanitize(svgContent);
    if (imageUrl) return `<div style="display:flex;align-items:center;justify-content:center;width:100%;height:100%"><img src="${imageUrl}" style="max-width:100%;max-height:100%;object-fit:contain" /></div>`;
    return '<div style="display:flex;align-items:center;justify-content:center;width:100%;height:100%;color:#ccc;font-size:14px">No visual content</div>';
  }, [svgContent, imageUrl]);

  if (!open) return null;

  return (
    <div style={OVERLAY}>
      <div style={DIALOG}>
        {/* Header */}
        <div style={HEADER}>
          <span style={{ fontSize: 16, fontWeight: 700 }}>
            {editWidget ? 'Edit Widget' : 'Create Widget'}
          </span>
          <button onClick={onClose} style={CLOSE_BTN}>✕</button>
        </div>

        {/* Error banner */}
        {error && (
          <div style={{ padding: '8px 20px', background: '#FEF2F2', color: '#DC2626', fontSize: 12 }}>
            {error}
          </div>
        )}

        {/* Tabs */}
        <div style={{ display: 'flex', borderBottom: '1px solid #E5E7EB', padding: '0 20px' }}>
          {(['basic', 'visual', 'properties', 'config'] as EditorTab[]).map((t) => (
            <button
              key={t}
              onClick={() => handleTabChange(t)}
              style={{
                padding: '10px 16px', fontSize: 13, fontWeight: tab === t ? 600 : 400,
                color: tab === t ? '#2563EB' : '#6B7280',
                borderBottom: tab === t ? '2px solid #2563EB' : '2px solid transparent',
                background: 'none', border: 'none', borderBottomStyle: 'solid',
                cursor: 'pointer', textTransform: 'capitalize',
              }}
            >
              {t === 'basic' ? '📝 Basic' : t === 'visual' ? '🎨 Visual' : t === 'properties' ? '⚙️ Properties' : '{ } Config'}
            </button>
          ))}
        </div>

        {/* Body */}
        <div style={BODY}>
          {tab === 'basic' && (
            <BasicTab
              name={name} setName={setName}
              description={description} setDescription={setDescription}
              widgetType={widgetType} setWidgetType={setWidgetType}
              categoryId={categoryId} setCategoryId={setCategoryId}
              categories={categories}
              icon={icon} setIcon={setIcon}
              defaultWidth={defaultWidth} setDefaultWidth={setDefaultWidth}
              defaultHeight={defaultHeight} setDefaultHeight={setDefaultHeight}
            />
          )}
          {tab === 'visual' && (
            <VisualTab
              svgContent={svgContent} setSvgContent={setSvgContent}
              imageUrl={imageUrl} setImageUrl={setImageUrl}
              previewHtml={previewHtml}
              defaultWidth={defaultWidth} defaultHeight={defaultHeight}
            />
          )}
          {tab === 'properties' && (
            <PropertiesTab
              entries={propEntries}
              onAdd={addProp}
              onRemove={removeProp}
              onUpdate={updateProp}
              onMove={moveProp}
            />
          )}
          {tab === 'config' && (
            <ConfigTab
              rawConfig={rawConfig}
              setRawConfig={setRawConfig}
              rawTemplate={rawTemplate}
              setRawTemplate={setRawTemplate}
              configError={configError}
              useRawConfig={useRawConfig}
              setUseRawConfig={setUseRawConfig}
            />
          )}
        </div>

        {/* Footer */}
        <div style={FOOTER}>
          <button onClick={onClose} style={CANCEL_BTN}>Cancel</button>
          <button onClick={handleSave} disabled={saving} style={SAVE_BTN}>
            {saving ? 'Saving...' : editWidget ? 'Update Widget' : 'Create Widget'}
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── Basic Tab ───────────────────────────────────────────────────────────────

const BasicTab: React.FC<{
  name: string; setName: (v: string) => void;
  description: string; setDescription: (v: string) => void;
  widgetType: string; setWidgetType: (v: string) => void;
  categoryId: string; setCategoryId: (v: string) => void;
  categories: WidgetCategoryItem[];
  icon: string; setIcon: (v: string) => void;
  defaultWidth: number; setDefaultWidth: (v: number) => void;
  defaultHeight: number; setDefaultHeight: (v: number) => void;
}> = ({
  name, setName, description, setDescription, widgetType, setWidgetType,
  categoryId, setCategoryId, categories, icon, setIcon,
  defaultWidth, setDefaultWidth, defaultHeight, setDefaultHeight,
}) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
    <Field label="Widget Name *">
      <input value={name} onChange={(e) => setName(e.target.value)} placeholder="My Custom Widget" style={INPUT} />
    </Field>
    <Field label="Description">
      <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} placeholder="Optional description..." style={{ ...INPUT, resize: 'vertical' }} />
    </Field>
    <div style={{ display: 'flex', gap: 12 }}>
      <Field label="Type" style={{ flex: 1 }}>
        <input value={widgetType} onChange={(e) => setWidgetType(e.target.value)} placeholder="custom" style={INPUT} />
      </Field>
      <Field label="Icon" style={{ width: 80 }}>
        <input value={icon} onChange={(e) => setIcon(e.target.value)} style={INPUT} />
      </Field>
    </div>
    <Field label="Category">
      <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)} style={INPUT}>
        <option value="">— None —</option>
        {categories.map((c) => (
          <option key={c.id} value={c.id}>{c.icon || '📁'} {c.name}</option>
        ))}
      </select>
    </Field>
    <div style={{ display: 'flex', gap: 12 }}>
      <Field label="Default Width" style={{ flex: 1 }}>
        <input type="number" value={defaultWidth} onChange={(e) => setDefaultWidth(Number(e.target.value))} min={20} max={1000} style={INPUT} />
      </Field>
      <Field label="Default Height" style={{ flex: 1 }}>
        <input type="number" value={defaultHeight} onChange={(e) => setDefaultHeight(Number(e.target.value))} min={20} max={1000} style={INPUT} />
      </Field>
    </div>
  </div>
);

// ─── Visual Tab ──────────────────────────────────────────────────────────────

const VisualTab: React.FC<{
  svgContent: string; setSvgContent: (v: string) => void;
  imageUrl: string; setImageUrl: (v: string) => void;
  previewHtml: string;
  defaultWidth: number; defaultHeight: number;
}> = ({ svgContent, setSvgContent, imageUrl, setImageUrl, previewHtml, defaultWidth, defaultHeight }) => {
  const handleSvgFile = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (reader.result) setSvgContent(reader.result as string);
    };
    reader.readAsText(file);
  }, [setSvgContent]);

  const handleImageFile = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (reader.result) setImageUrl(reader.result as string);
    };
    reader.readAsDataURL(file);
  }, [setImageUrl]);

  return (
    <div style={{ display: 'flex', gap: 16, height: '100%' }}>
      {/* Editor */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 10 }}>
        <Field label="SVG Content">
          <textarea
            value={svgContent}
            onChange={(e) => setSvgContent(e.target.value)}
            rows={10}
            placeholder='<svg viewBox="0 0 100 100">...</svg>'
            style={{ ...INPUT, fontFamily: 'monospace', fontSize: 11, resize: 'vertical', minHeight: 160 }}
          />
        </Field>
        <div style={{ display: 'flex', gap: 8 }}>
          <label style={{
            padding: '5px 12px', fontSize: 11, border: '1px solid #D1D5DB',
            borderRadius: 4, background: '#F9FAFB', cursor: 'pointer',
          }}>
            📎 Upload SVG
            <input type="file" accept=".svg" onChange={handleSvgFile} style={{ display: 'none' }} />
          </label>
          <label style={{
            padding: '5px 12px', fontSize: 11, border: '1px solid #D1D5DB',
            borderRadius: 4, background: '#F9FAFB', cursor: 'pointer',
          }}>
            🖼️ Upload Image
            <input type="file" accept="image/*" onChange={handleImageFile} style={{ display: 'none' }} />
          </label>
          {svgContent && (
            <button
              onClick={() => setSvgContent('')}
              style={{
                padding: '5px 12px', fontSize: 11, border: '1px solid #FCA5A5',
                borderRadius: 4, background: '#FEF2F2', color: '#DC2626', cursor: 'pointer',
              }}
            >
              Clear SVG
            </button>
          )}
        </div>
        <Field label="Image URL (alternative to SVG)">
          <input value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} placeholder="https://..." style={INPUT} />
        </Field>
        <div style={{ fontSize: 10, color: '#9CA3AF', lineHeight: 1.5 }}>
          <strong>Tip:</strong> Use placeholders like <code>{'{{value}}'}</code>, <code>{'{{label}}'}</code>, <code>{'{{fillColor}}'}</code> in your SVG.
          They will be replaced with actual property values at runtime.
        </div>
      </div>

      {/* Preview */}
      <div style={{ width: 240, display: 'flex', flexDirection: 'column', gap: 8 }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: '#374151' }}>Live Preview</div>
        <div style={{
          width: 220, height: 180, border: '1px solid #E5E7EB', borderRadius: 8,
          background: '#FAFBFC', display: 'flex', alignItems: 'center', justifyContent: 'center',
          overflow: 'hidden', padding: 8,
        }}>
          <div
            style={{ width: defaultWidth, height: defaultHeight, maxWidth: 200, maxHeight: 160 }}
            dangerouslySetInnerHTML={{ __html: previewHtml }}
          />
        </div>
        <div style={{ fontSize: 10, color: '#9CA3AF', textAlign: 'center' }}>
          {defaultWidth} × {defaultHeight} px
        </div>
      </div>
    </div>
  );
};

// ─── Properties Tab ──────────────────────────────────────────────────────────

const PropertiesTab: React.FC<{
  entries: PropEntry[];
  onAdd: () => void;
  onRemove: (id: string) => void;
  onUpdate: (id: string, field: keyof PropEntry, value: string) => void;
  onMove: (idx: number, dir: -1 | 1) => void;
}> = ({ entries, onAdd, onRemove, onUpdate, onMove }) => (
  <div>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
      <div style={{ fontSize: 12, color: '#374151', fontWeight: 600 }}>
        Property Schema ({entries.length} {entries.length === 1 ? 'field' : 'fields'})
      </div>
      <button onClick={onAdd} style={{
        padding: '4px 12px', fontSize: 11, background: '#2563EB', color: '#fff',
        border: 'none', borderRadius: 4, cursor: 'pointer', fontWeight: 600,
      }}>
        + Add Property
      </button>
    </div>

    {entries.length === 0 ? (
      <div style={{ padding: 24, textAlign: 'center', color: '#9CA3AF', fontSize: 12, border: '1px dashed #E5E7EB', borderRadius: 8 }}>
        No properties defined yet. Add properties to make your widget configurable.
      </div>
    ) : (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {entries.map((entry, idx) => (
          <PropEntryRow
            key={entry.id}
            entry={entry}
            index={idx}
            total={entries.length}
            onUpdate={(field, value) => onUpdate(entry.id, field, value)}
            onRemove={() => onRemove(entry.id)}
            onMove={(dir) => onMove(idx, dir)}
          />
        ))}
      </div>
    )}

    {entries.length > 0 && (
      <div style={{ marginTop: 12, fontSize: 10, color: '#9CA3AF' }}>
        <strong>Tip:</strong> Property keys become available as <code>{'{{key}}'}</code> placeholders in SVG and as bindable data points.
      </div>
    )}
  </div>
);

// ─── Single Property Row ─────────────────────────────────────────────────────

const PropEntryRow: React.FC<{
  entry: PropEntry;
  index: number;
  total: number;
  onUpdate: (field: keyof PropEntry, value: string) => void;
  onRemove: () => void;
  onMove: (dir: -1 | 1) => void;
}> = ({ entry, index, total, onUpdate, onRemove, onMove }) => {
  const [expanded, setExpanded] = useState(false);

  return (
    <div style={{
      border: '1px solid #E5E7EB', borderRadius: 6, background: '#FAFBFC', overflow: 'hidden',
    }}>
      {/* Collapsed row */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 6, padding: '6px 10px',
      }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          <button onClick={() => onMove(-1)} disabled={index === 0} style={MOVE_BTN}>▲</button>
          <button onClick={() => onMove(1)} disabled={index === total - 1} style={MOVE_BTN}>▼</button>
        </div>

        <input
          value={entry.key}
          onChange={(e) => onUpdate('key', e.target.value)}
          placeholder="key"
          style={{ ...MINI_INPUT, width: 80 }}
        />
        <input
          value={entry.label}
          onChange={(e) => onUpdate('label', e.target.value)}
          placeholder="Label"
          style={{ ...MINI_INPUT, flex: 1 }}
        />
        <select
          value={entry.type}
          onChange={(e) => onUpdate('type', e.target.value)}
          style={{ ...MINI_INPUT, width: 80 }}
        >
          {FIELD_TYPES.map((ft) => (
            <option key={ft.value} value={ft.value}>{ft.label}</option>
          ))}
        </select>
        <input
          value={entry.defaultValue}
          onChange={(e) => onUpdate('defaultValue', e.target.value)}
          placeholder="default"
          style={{ ...MINI_INPUT, width: 70 }}
        />

        <button onClick={() => setExpanded(!expanded)} style={{ ...MOVE_BTN, fontSize: 10 }}>
          {expanded ? '▾' : '▸'}
        </button>
        <button onClick={onRemove} style={{ ...MOVE_BTN, color: '#EF4444', fontSize: 12 }}>✕</button>
      </div>

      {/* Expanded details */}
      {expanded && (
        <div style={{
          padding: '8px 10px', borderTop: '1px solid #E5E7EB', background: '#fff',
          display: 'flex', gap: 8, flexWrap: 'wrap',
        }}>
          <div style={{ flex: '1 1 120px' }}>
            <label style={MINI_LABEL}>Group</label>
            <input value={entry.group} onChange={(e) => onUpdate('group', e.target.value)} placeholder="Appearance" style={MINI_INPUT} />
          </div>
          <div style={{ flex: '1 1 200px' }}>
            <label style={MINI_LABEL}>Description</label>
            <input value={entry.description} onChange={(e) => onUpdate('description', e.target.value)} placeholder="Helper text" style={MINI_INPUT} />
          </div>
          {(entry.type === 'number' || entry.type === 'range') && (
            <>
              <div style={{ flex: '0 0 60px' }}>
                <label style={MINI_LABEL}>Min</label>
                <input type="number" value={entry.min} onChange={(e) => onUpdate('min', e.target.value)} style={MINI_INPUT} />
              </div>
              <div style={{ flex: '0 0 60px' }}>
                <label style={MINI_LABEL}>Max</label>
                <input type="number" value={entry.max} onChange={(e) => onUpdate('max', e.target.value)} style={MINI_INPUT} />
              </div>
              <div style={{ flex: '0 0 60px' }}>
                <label style={MINI_LABEL}>Step</label>
                <input type="number" value={entry.step} onChange={(e) => onUpdate('step', e.target.value)} style={MINI_INPUT} />
              </div>
            </>
          )}
          {entry.type === 'select' && (
            <div style={{ flex: '1 1 100%' }}>
              <label style={MINI_LABEL}>Options (JSON array)</label>
              <input
                value={entry.options}
                onChange={(e) => onUpdate('options', e.target.value)}
                placeholder='[{"value":"a","label":"Option A"}]'
                style={{ ...MINI_INPUT, fontFamily: 'monospace', fontSize: 10 }}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// ─── Config (JSON) Tab ───────────────────────────────────────────────────────

const ConfigTab: React.FC<{
  rawConfig: string;
  setRawConfig: (v: string) => void;
  rawTemplate: string;
  setRawTemplate: (v: string) => void;
  configError: string | null;
  useRawConfig: boolean;
  setUseRawConfig: (v: boolean) => void;
}> = ({ rawConfig, setRawConfig, rawTemplate, setRawTemplate, configError, useRawConfig, setUseRawConfig }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
    {/* Override toggle */}
    <div style={{
      display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px',
      background: useRawConfig ? '#FEF3C7' : '#F0F9FF', borderRadius: 6,
      border: '1px solid', borderColor: useRawConfig ? '#FCD34D' : '#BFDBFE',
    }}>
      <input
        type="checkbox"
        checked={useRawConfig}
        onChange={(e) => setUseRawConfig(e.target.checked)}
        id="use-raw-config"
      />
      <label htmlFor="use-raw-config" style={{ fontSize: 12, color: '#374151', cursor: 'pointer' }}>
        <strong>Use raw JSON for save</strong>
        <span style={{ color: '#6B7280' }}> — Override values from Properties/Visual tabs with raw JSON below</span>
      </label>
    </div>

    {configError && (
      <div style={{ padding: '6px 12px', background: '#FEF2F2', color: '#DC2626', fontSize: 12, borderRadius: 4 }}>
        JSON Error: {configError}
      </div>
    )}

    {/* Config JSON */}
    <div>
      <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 4 }}>
        Configuration (JSON)
      </label>
      <textarea
        value={rawConfig}
        onChange={(e) => setRawConfig(e.target.value)}
        rows={12}
        placeholder='{ "propSchema": [...], "defaultWidth": 120, ... }'
        style={{
          width: '100%', padding: '8px 10px',
          border: '1px solid #E5E7EB', borderRadius: 6,
          fontSize: 11, fontFamily: 'monospace',
          outline: 'none', resize: 'vertical',
          lineHeight: 1.5,
          background: useRawConfig ? '#FFFBEB' : '#fff',
        }}
      />
      <div style={{ fontSize: 10, color: '#9CA3AF', marginTop: 4, lineHeight: 1.5 }}>
        <strong>Config</strong> chứa: <code>propSchema</code>, <code>defaultWidth</code>, <code>defaultHeight</code>, <code>icon</code>, <code>bindingSchema</code>, <code>actionSchema</code>, và các key tùy chỉnh.
      </div>
    </div>

    {/* Template JSON */}
    <div>
      <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 4 }}>
        Template (JSON)
      </label>
      <textarea
        value={rawTemplate}
        onChange={(e) => setRawTemplate(e.target.value)}
        rows={6}
        placeholder='{ "svg": "<svg>...</svg>", "imageUrl": "..." }'
        style={{
          width: '100%', padding: '8px 10px',
          border: '1px solid #E5E7EB', borderRadius: 6,
          fontSize: 11, fontFamily: 'monospace',
          outline: 'none', resize: 'vertical',
          lineHeight: 1.5,
          background: useRawConfig ? '#FFFBEB' : '#fff',
        }}
      />
      <div style={{ fontSize: 10, color: '#9CA3AF', marginTop: 4, lineHeight: 1.5 }}>
        <strong>Template</strong> chứa: <code>svg</code> (nội dung SVG), <code>imageUrl</code> (URL ảnh).
      </div>
    </div>

    {/* Example */}
    <details style={{ fontSize: 11, color: '#6B7280' }}>
      <summary style={{ cursor: 'pointer', fontWeight: 600, marginBottom: 6 }}>📖 Ví dụ Config JSON</summary>
      <pre style={{
        background: '#F3F4F6', padding: 10, borderRadius: 6,
        fontSize: 10, lineHeight: 1.5, overflow: 'auto', maxHeight: 200,
      }}>{`{
  "propSchema": [
    { "key": "label", "label": "Label", "type": "string", "defaultValue": "Sensor" },
    { "key": "value", "label": "Value", "type": "number", "defaultValue": 0 },
    { "key": "unit", "label": "Unit", "type": "string", "defaultValue": "°C" },
    { "key": "barColor", "label": "Bar Color", "type": "color", "defaultValue": "#3B82F6", "group": "Appearance" },
    { "key": "max", "label": "Max", "type": "number", "defaultValue": 100, "min": 0, "max": 1000 }
  ],
  "defaultWidth": 160,
  "defaultHeight": 90,
  "icon": "🌡️",
  "bindingSchema": [
    { "key": "value", "label": "Value", "valueType": "number", "suggestedKey": "temperature" },
    { "key": "label", "label": "Label", "valueType": "string" }
  ],
  "actionSchema": [
    { "trigger": "click", "label": "On Click" },
    { "trigger": "doubleClick", "label": "On Double Click" }
  ]
}`}</pre>
    </details>
  </div>
);

// ─── Helpers ─────────────────────────────────────────────────────────────────

function parseDefault(value: string, type: PropFieldType): unknown {
  if (!value && value !== '0') {
    if (type === 'number' || type === 'range') return 0;
    if (type === 'boolean') return false;
    if (type === 'json') return {};
    return '';
  }
  if (type === 'number' || type === 'range') return Number(value) || 0;
  if (type === 'boolean') return value === 'true' || value === '1';
  if (type === 'json') {
    try { return JSON.parse(value); } catch { return {}; }
  }
  return value;
}

const Field: React.FC<{ label: string; style?: React.CSSProperties; children: React.ReactNode }> = ({
  label, style, children,
}) => (
  <div style={style}>
    <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: '#374151', marginBottom: 4 }}>
      {label}
    </label>
    {children}
  </div>
);

// ─── Styles ──────────────────────────────────────────────────────────────────

const OVERLAY: React.CSSProperties = {
  position: 'fixed', inset: 0, zIndex: 9999,
  background: 'rgba(0,0,0,0.5)', display: 'flex',
  alignItems: 'center', justifyContent: 'center',
};

const DIALOG: React.CSSProperties = {
  width: 820, maxWidth: '94vw', maxHeight: '90vh',
  background: '#fff', borderRadius: 12,
  boxShadow: '0 20px 60px rgba(0,0,0,0.25)',
  display: 'flex', flexDirection: 'column',
  overflow: 'hidden',
};

const HEADER: React.CSSProperties = {
  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
  padding: '16px 20px', borderBottom: '1px solid #E5E7EB',
};

const BODY: React.CSSProperties = {
  flex: 1, padding: 20, overflowY: 'auto', minHeight: 300,
};

const FOOTER: React.CSSProperties = {
  display: 'flex', justifyContent: 'flex-end', gap: 8,
  padding: '12px 20px', borderTop: '1px solid #E5E7EB',
};

const CLOSE_BTN: React.CSSProperties = {
  background: 'none', border: 'none', fontSize: 18, color: '#9CA3AF',
  cursor: 'pointer', padding: 4,
};

const CANCEL_BTN: React.CSSProperties = {
  padding: '8px 20px', fontSize: 13, border: '1px solid #D1D5DB',
  borderRadius: 6, background: '#fff', cursor: 'pointer', color: '#374151',
};

const SAVE_BTN: React.CSSProperties = {
  padding: '8px 20px', fontSize: 13, border: 'none',
  borderRadius: 6, background: '#2563EB', color: '#fff',
  cursor: 'pointer', fontWeight: 600,
};

const INPUT: React.CSSProperties = {
  width: '100%', padding: '7px 10px', border: '1px solid #E5E7EB',
  borderRadius: 6, fontSize: 13, outline: 'none',
  background: '#fff',
};

const MINI_INPUT: React.CSSProperties = {
  padding: '4px 6px', border: '1px solid #E5E7EB',
  borderRadius: 4, fontSize: 11, outline: 'none',
  width: '100%',
};

const MINI_LABEL: React.CSSProperties = {
  display: 'block', fontSize: 10, color: '#9CA3AF', marginBottom: 2,
};

const MOVE_BTN: React.CSSProperties = {
  background: 'none', border: 'none', cursor: 'pointer',
  fontSize: 9, color: '#9CA3AF', padding: 0, lineHeight: 1,
};
