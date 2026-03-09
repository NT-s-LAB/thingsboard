/**
 * PropertyPanelV2 — Drives property editing from the widget's propSchema.
 *
 * For each PropField in the selected widget's definition, renders
 * the appropriate input control (string, number, boolean, color, select, etc.).
 */

'use client';

import React, { useCallback, useMemo } from 'react';
import { widgetRegistry } from '../../core/registry';
import { useScadaRuntimeStore } from '../../stores/scadaRuntimeStore';
import type { PropField } from '../../core/types';
import '../../styles/scada.css';

export const PropertyPanelV2: React.FC = () => {
  const screen = useScadaRuntimeStore((s) => s.screen);
  const selectedWidgetIds = useScadaRuntimeStore((s) => s.selectedWidgetIds);
  const updateWidget = useScadaRuntimeStore((s) => s.updateWidget);
  const updateWidgetTransform = useScadaRuntimeStore((s) => s.updateWidgetTransform);

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
      const newProps = { ...selectedWidget.properties, [key]: value };
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

  if (!selectedWidget || !definition) {
    return (
      <div className="scada-panel" style={{ width: 260, flexShrink: 0 }}>
        <div className="scada-panel__header">Properties</div>
        <div className="scada-panel__body" style={{ color: '#9CA3AF', fontSize: 12, textAlign: 'center', padding: 16 }}>
          {selectedWidgetIds.length > 1 ? 'Multiple widgets selected' : 'Select a widget'}
        </div>
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

  return (
    <div className="scada-panel" style={{ width: 260, flexShrink: 0 }}>
      <div className="scada-panel__header">
        {definition.icon} {selectedWidget.name || definition.name}
      </div>
      <div className="scada-panel__body" style={{ maxHeight: 'calc(100vh - 200px)' }}>
        {/* Transform section */}
        <FieldGroup label="Transform">
          <NumberInput label="X" value={selectedWidget.transform.position.x} onChange={(v) => handleTransformChange('x', v)} />
          <NumberInput label="Y" value={selectedWidget.transform.position.y} onChange={(v) => handleTransformChange('y', v)} />
          <NumberInput label="W" value={selectedWidget.transform.size.width} onChange={(v) => handleTransformChange('width', v)} min={10} />
          <NumberInput label="H" value={selectedWidget.transform.size.height} onChange={(v) => handleTransformChange('height', v)} min={10} />
          <NumberInput label="Rot" value={selectedWidget.transform.rotation} onChange={(v) => handleTransformChange('rotation', v)} step={15} />
          <NumberInput label="Z" value={selectedWidget.transform.zIndex} onChange={(v) => handleTransformChange('zIndex', v)} />
        </FieldGroup>

        {/* Property fields by group */}
        {Array.from(groups.entries()).map(([group, fields]) => (
          <FieldGroup key={group} label={group}>
            {fields.map((field) => (
              <PropFieldInput
                key={field.key}
                field={field}
                value={selectedWidget.properties[field.key]}
                onChange={(value) => handlePropertyChange(field.key, value)}
              />
            ))}
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
              value={String(effectiveValue ?? '#000000')}
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
      </div>
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
