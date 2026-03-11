/**
 * BindingPanelV2 — Configure data bindings for the selected widget.
 *
 * For each BindingField in the widget's definition, allows the user to
 * pick a data source (device + telemetry key, or attribute, or variable).
 */

'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { widgetRegistry } from '../../core/registry';
import { useScadaRuntimeStore } from '../../stores/scadaRuntimeStore';
import { useScadaProjectStore } from '../../stores/scadaProjectStore';
import type { WidgetBinding, BindingSourceType } from '../../core/types';
import { deviceService } from '../../../devices/services/deviceService';
import type { Device } from '../../../devices/types';
import '../../styles/scada.css';

const SOURCE_TYPES: { value: BindingSourceType; label: string }[] = [
  { value: 'telemetry', label: 'Telemetry' },
  { value: 'attribute', label: 'Attribute' },
  { value: 'alarm', label: 'Alarm' },
  { value: 'variable', label: 'Variable' },
  { value: 'static', label: 'Static' },
  { value: 'calculated', label: 'Calculated' },
];

export const BindingPanelV2: React.FC = () => {
  const screen = useScadaRuntimeStore((s) => s.screen);
  const selectedWidgetIds = useScadaRuntimeStore((s) => s.selectedWidgetIds);
  const updateWidgetRuntime = useScadaRuntimeStore((s) => s.updateWidget);
  const updateWidgetProject = useScadaProjectStore((s) => s.updateWidgetInPage);

  // Update both stores for persistence
  const updateWidget = useCallback(
    (id: string, patch: Parameters<typeof updateWidgetRuntime>[1]) => {
      // Update runtime store (for immediate UI)
      updateWidgetRuntime(id, patch);
      // Update project store (for deploy/save)
      updateWidgetProject(id, patch);
    },
    [updateWidgetRuntime, updateWidgetProject],
  );

  const selectedWidget = useMemo(() => {
    if (!screen || selectedWidgetIds.length !== 1) return null;
    return screen.widgets.find((w) => w.id === selectedWidgetIds[0]) ?? null;
  }, [screen, selectedWidgetIds]);

  const definition = useMemo(() => {
    if (!selectedWidget) return null;
    return widgetRegistry.get(selectedWidget.type) ?? null;
  }, [selectedWidget]);

  // Helper to update chart series config when binding changes
  const updateChartSeriesFromBinding = useCallback(
    (targetProperty: string, source: WidgetBinding['source']) => {
      if (!selectedWidget) return;
      
      // Check if this is a chart series binding (e.g., chartConfig.data.series[0].key)
      const seriesMatch = targetProperty.match(/^chartConfig\.data\.series\[(\d+)\]\.key$/);
      if (!seriesMatch || !seriesMatch[1]) return;
      
      const seriesIndex = parseInt(seriesMatch[1], 10);
      if (isNaN(seriesIndex)) return;
      
      // Get current chartConfig from properties
      const currentConfig = (selectedWidget.properties.chartConfig as Record<string, unknown>) || {
        data: { series: [], mode: 'realtime' },
        display: { showTitle: true, showLegend: true, showTooltip: true, showGrid: true, showXAxis: true, showYAxis: true },
        timeWindow: { mode: 'dashboard', realtime: true, relative: { value: 15, unit: 'minutes' } },
      };
      
      const currentData = (currentConfig.data as Record<string, unknown>) || { series: [] };
      const currentSeries = Array.isArray(currentData.series) ? [...currentData.series] : [];
      
      // Extend array if needed
      while (currentSeries.length <= seriesIndex) {
        currentSeries.push({
          id: `series-${currentSeries.length}`,
          label: `Series ${currentSeries.length + 1}`,
          sourceType: 'telemetry',
          key: '',
        });
      }
      
      // Update series with binding info
      currentSeries[seriesIndex] = {
        ...currentSeries[seriesIndex],
        entityId: source.entityId || '',
        entityType: source.entityType || 'DEVICE',
        key: source.key || '',
        sourceType: source.type === 'telemetry' ? 'telemetry' : (source.type === 'attribute' ? 'attribute' : 'telemetry'),
      };
      
      // Update widget properties
      const updatedConfig = {
        ...currentConfig,
        data: {
          ...currentData,
          series: currentSeries,
        },
      };
      
      updateWidget(selectedWidget.id, { 
        properties: { 
          ...selectedWidget.properties, 
          chartConfig: updatedConfig 
        } 
      });
    },
    [selectedWidget, updateWidget],
  );

  const handleBindingChange = useCallback(
    (targetProperty: string, updates: Partial<WidgetBinding>) => {
      if (!selectedWidget) return;
      const bindings = [...selectedWidget.bindings];
      const idx = bindings.findIndex((b) => b.targetProperty === targetProperty);
      
      let finalSource: WidgetBinding['source'] | undefined;
      
      if (idx >= 0) {
        const existing = { ...bindings[idx] } as Record<string, unknown>;
        for (const key of Object.keys(updates)) {
          existing[key] = (updates as Record<string, unknown>)[key];
        }
        bindings[idx] = existing as unknown as WidgetBinding;
        finalSource = (existing.source as WidgetBinding['source']) || undefined;
      } else {
        // Create new binding
        const newBinding: WidgetBinding = {
          id: `binding_${Date.now()}`,
          targetProperty,
          source: {
            type: 'telemetry',
            entityId: '',
            entityType: 'DEVICE',
            key: '',
          },
        };
        Object.assign(newBinding, updates);
        bindings.push(newBinding);
        finalSource = newBinding.source;
      }
      
      // Update both bindings and chart config if applicable
      updateWidget(selectedWidget.id, { bindings });
      
      // Also update chart series config if this is a chart binding
      if (finalSource && (finalSource.entityId || finalSource.key)) {
        updateChartSeriesFromBinding(targetProperty, finalSource);
      }
    },
    [selectedWidget, updateWidget, updateChartSeriesFromBinding],
  );

  const handleRemoveBinding = useCallback(
    (targetProperty: string) => {
      if (!selectedWidget) return;
      const bindings = selectedWidget.bindings.filter((b) => b.targetProperty !== targetProperty);
      updateWidget(selectedWidget.id, { bindings });
    },
    [selectedWidget, updateWidget],
  );

  if (!selectedWidget || !definition) {
    return (
      <div className="scada-panel" style={{ width: 260, flexShrink: 0 }}>
        <div className="scada-panel__header">Data Bindings</div>
        <div className="scada-panel__body" style={{ color: '#9CA3AF', fontSize: 12, textAlign: 'center', padding: 16 }}>
          Select a widget
        </div>
      </div>
    );
  }

  if (definition.bindingSchema.length === 0) {
    return (
      <div className="scada-panel" style={{ width: 260, flexShrink: 0 }}>
        <div className="scada-panel__header">Data Bindings</div>
        <div className="scada-panel__body" style={{ color: '#9CA3AF', fontSize: 12, textAlign: 'center', padding: 16 }}>
          No bindable properties
        </div>
      </div>
    );
  }

  return (
    <div className="scada-panel" style={{ width: 260, flexShrink: 0 }}>
      <div className="scada-panel__header">Data Bindings</div>
      <div className="scada-panel__body" style={{ maxHeight: 'calc(100vh - 200px)' }}>
        {definition.bindingSchema.map((field) => {
          const binding = selectedWidget.bindings.find((b) => b.targetProperty === field.key);
          return (
            <BindingFieldEditor
              key={field.key}
              label={field.label}
              {...(field.description ? { description: field.description } : {})}
              {...(field.suggestedKey ? { suggestedKey: field.suggestedKey } : {})}
              targetProperty={field.key}
              {...(binding ? { binding } : {})}
              onChange={(updates) => handleBindingChange(field.key, updates)}
              onRemove={() => handleRemoveBinding(field.key)}
            />
          );
        })}
      </div>
    </div>
  );
};

// ─── Single binding field editor ─────────────────────────────────────────────

interface BindingFieldEditorProps {
  label: string;
  description?: string;
  suggestedKey?: string;
  targetProperty: string;
  binding?: WidgetBinding;
  onChange: (updates: Partial<WidgetBinding>) => void;
  onRemove: () => void;
}

const BindingFieldEditor: React.FC<BindingFieldEditorProps> = ({
  label,
  description,
  suggestedKey,
  binding,
  onChange,
  onRemove,
}) => {
  const [expanded, setExpanded] = useState(!!binding);
  const sourceType = binding?.source.type ?? 'telemetry';

  // ── Device list from API ──
  const [devices, setDevices] = useState<Device[]>([]);
  const [devicesLoading, setDevicesLoading] = useState(false);

  // ── Telemetry keys for selected device ──
  const [telemetryKeys, setTelemetryKeys] = useState<string[]>([]);
  const [keysLoading, setKeysLoading] = useState(false);

  // ── Device search ──
  const [deviceSearch, setDeviceSearch] = useState('');

  // Fetch devices on expand
  useEffect(() => {
    if (!expanded) return;
    if (sourceType !== 'telemetry' && sourceType !== 'attribute') return;
    let cancelled = false;
    setDevicesLoading(true);
    deviceService.getDevices({ pageSize: 100 }).then((res) => {
      if (!cancelled) setDevices(res.data);
    }).catch(() => {
      // silently fail
    }).finally(() => {
      if (!cancelled) setDevicesLoading(false);
    });
    return () => { cancelled = true; };
  }, [expanded, sourceType]);

  // Fetch telemetry keys when device is selected
  useEffect(() => {
    const entityId = binding?.source.entityId;
    if (!entityId || !expanded) return;
    if (sourceType !== 'telemetry' && sourceType !== 'attribute') return;
    let cancelled = false;
    setKeysLoading(true);

    const fetchKeys = sourceType === 'attribute'
      ? deviceService.getDeviceAttributes(entityId, 'CLIENT_SCOPE')
      : deviceService.getDeviceTelemetry(entityId);

    fetchKeys.then((data: Record<string, unknown>) => {
      if (!cancelled) {
        setTelemetryKeys(Object.keys(data));
      }
    }).catch(() => {
      if (!cancelled) setTelemetryKeys([]);
    }).finally(() => {
      if (!cancelled) setKeysLoading(false);
    });
    return () => { cancelled = true; };
  }, [binding?.source.entityId, expanded, sourceType]);

  const filteredDevices = useMemo(() => {
    if (!deviceSearch) return devices;
    const lower = deviceSearch.toLowerCase();
    return devices.filter((d) => d.name.toLowerCase().includes(lower));
  }, [devices, deviceSearch]);

  return (
    <div style={{ marginBottom: 12, border: '1px solid #e5e7eb', borderRadius: 6, padding: 8 }}>
      <div
        style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}
        onClick={() => setExpanded(!expanded)}
      >
        <span style={{ fontSize: 11, fontWeight: 600, color: '#374151' }}>
          {label}
          {binding && <span style={{ color: '#22C55E', marginLeft: 4, fontSize: 9 }}>●</span>}
        </span>
        <span style={{ fontSize: 10, color: '#9CA3AF' }}>{expanded ? '▲' : '▼'}</span>
      </div>

      {expanded && (
        <div style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 6 }}>
          {/* Source type */}
          <Row label="Source">
            <select
              value={sourceType}
              onChange={(e) =>
                onChange({
                  source: {
                    ...(binding?.source ?? { entityId: '', key: '', entityType: 'DEVICE' as const }),
                    type: e.target.value as BindingSourceType,
                  },
                })
              }
              style={inputStyle}
            >
              {SOURCE_TYPES.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
          </Row>

          {/* Device picker (for telemetry/attribute) */}
          {(sourceType === 'telemetry' || sourceType === 'attribute') && (
            <>
              <Row label="Device">
                <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <input
                    type="text"
                    value={deviceSearch}
                    placeholder="Search device..."
                    onChange={(e) => setDeviceSearch(e.target.value)}
                    style={{ ...inputStyle, marginBottom: 2 }}
                  />
                  <select
                    value={binding?.source.entityId ?? ''}
                    onChange={(e) => {
                      setTelemetryKeys([]);
                      onChange({
                        source: {
                          ...(binding?.source ?? { type: 'telemetry' as const, key: '', entityType: 'DEVICE' as const }),
                          entityId: e.target.value,
                        },
                      });
                    }}
                    style={inputStyle}
                  >
                    <option value="">
                      {devicesLoading ? 'Loading...' : '-- Select device --'}
                    </option>
                    {filteredDevices.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name}{d.serialNumber ? ` (${d.serialNumber})` : ''}
                      </option>
                    ))}
                  </select>
                </div>
              </Row>

              <Row label="Key">
                {telemetryKeys.length > 0 ? (
                  <select
                    value={binding?.source.key ?? ''}
                    onChange={(e) =>
                      onChange({
                        source: {
                          ...(binding?.source ?? { type: 'telemetry' as const, entityId: '', entityType: 'DEVICE' as const }),
                          key: e.target.value,
                        },
                      })
                    }
                    style={inputStyle}
                  >
                    <option value="">
                      {keysLoading ? 'Loading...' : '-- Select key --'}
                    </option>
                    {telemetryKeys.map((k) => (
                      <option key={k} value={k}>{k}</option>
                    ))}
                  </select>
                ) : (
                  <input
                    type="text"
                    value={binding?.source.key ?? ''}
                    placeholder={keysLoading ? 'Loading keys...' : (suggestedKey ?? 'telemetry key...')}
                    onChange={(e) =>
                      onChange({
                        source: {
                          ...(binding?.source ?? { type: 'telemetry' as const, entityId: '', entityType: 'DEVICE' as const }),
                          key: e.target.value,
                        },
                      })
                    }
                    style={inputStyle}
                  />
                )}
              </Row>
            </>
          )}

          {/* Variable name */}
          {sourceType === 'variable' && (
            <Row label="Variable">
              <input
                type="text"
                value={binding?.source.key ?? ''}
                placeholder="variableName..."
                onChange={(e) =>
                  onChange({
                    source: {
                      ...(binding?.source ?? { type: 'variable' as const, entityId: '', entityType: 'DEVICE' as const }),
                      key: e.target.value,
                    },
                  })
                }
                style={inputStyle}
              />
            </Row>
          )}

          {/* Static value */}
          {sourceType === 'static' && (
            <Row label="Value">
              <input
                type="text"
                value={String(binding?.source.staticValue ?? '')}
                placeholder="static value..."
                onChange={(e) =>
                  onChange({
                    source: {
                      ...(binding?.source ?? { type: 'static' as const, entityId: '', key: '', entityType: 'DEVICE' as const }),
                      staticValue: e.target.value,
                    },
                  })
                }
                style={inputStyle}
              />
            </Row>
          )}

          {/* Calculated expression */}
          {sourceType === 'calculated' && (
            <Row label="Expression">
              <input
                type="text"
                value={binding?.source.expression ?? ''}
                placeholder="${deviceId::key} * 2"
                onChange={(e) =>
                  onChange({
                    source: {
                      ...(binding?.source ?? { type: 'calculated' as const, entityId: '', key: '', entityType: 'DEVICE' as const }),
                      expression: e.target.value,
                    },
                  })
                }
                style={inputStyle}
              />
            </Row>
          )}

          {/* Default value */}
          <Row label="Default">
            <input
              type="text"
              value={String(binding?.defaultValue ?? '')}
              placeholder="fallback value..."
              onChange={(e) => onChange({ defaultValue: e.target.value })}
              style={inputStyle}
            />
          </Row>

          {binding && (
            <button
              onClick={onRemove}
              style={{
                padding: '4px 8px',
                fontSize: 10,
                color: '#EF4444',
                background: '#FEF2F2',
                border: '1px solid #FECACA',
                borderRadius: 4,
                cursor: 'pointer',
                alignSelf: 'flex-end',
              }}
            >
              Remove Binding
            </button>
          )}

          {description && (
            <div style={{ fontSize: 9, color: '#9CA3AF', fontStyle: 'italic' }}>{description}</div>
          )}
        </div>
      )}
    </div>
  );
};

const Row: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
    <label style={{ fontSize: 10, color: '#6B7280', width: 60, flexShrink: 0 }}>{label}</label>
    <div style={{ flex: 1 }}>{children}</div>
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
