/**
 * ActionPanelV2 — Behavior configuration for control widgets (Toggle Switch, etc.)
 *
 * Provides ThingsBoard-like behavior settings:
 *   - Device ID   → searchable dropdown to pick a device
 *   - Initial state → telemetry / attribute key for the initial ON/OFF
 *   - Turn On      → RPC method to execute when turned ON
 *   - Turn Off     → RPC method to execute when turned OFF
 *   - Disabled state
 *
 * Data is stored on `widget.actions` (WidgetActionInstance[]) and
 * `widget.bindings` for the initial-state data source.
 */

'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { widgetRegistry } from '../../core/registry';
import { useScadaRuntimeStore } from '../../stores/scadaRuntimeStore';
import { useScadaProjectStore } from '../../stores/scadaProjectStore';
import { deviceService } from '@/features/devices/services/deviceService';
import type { Device } from '@/features/devices/types';
import type {
  WidgetActionInstance,
  WidgetBinding,
  ActionTrigger,
  ActionType,
  BindingSourceType,
} from '../../core/types';
import '../../styles/scada.css';

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Ensure an action for a given trigger exists, return it. */
function ensureAction(actions: WidgetActionInstance[], trigger: ActionTrigger): WidgetActionInstance[] {
  if (actions.some((a) => a.trigger === trigger)) return actions;
  return [
    ...actions,
    {
      id: `action_${trigger}_${Date.now()}`,
      trigger,
      actionType: 'rpcCall' as ActionType,
      config: {},
    },
  ];
}

/**
 * Format RPC params for display in the input field.
 * - Simple values (boolean, number, string): show as-is
 * - Objects/arrays: JSON.stringify
 * - undefined: show empty string
 */
function formatParamsForDisplay(params: unknown): string {
  if (params === undefined || params === null) return '';
  if (typeof params === 'boolean') return String(params);
  if (typeof params === 'number') return String(params);
  if (typeof params === 'string') {
    // If it's a string that looks like JSON, show it
    if (params.startsWith('{') || params.startsWith('[')) return params;
    return params;
  }
  // Object or array
  return JSON.stringify(params);
}

/**
 * Parse user input for RPC params.
 * Tries JSON parse first, then falls back to interpreting as literal value.
 */
function parseParamsInput(input: string): unknown {
  const trimmed = input.trim();
  if (!trimmed) return undefined;

  // Try JSON parse (for objects, arrays, or JSON-encoded values)
  try {
    return JSON.parse(trimmed);
  } catch {
    // Handle boolean-like strings
    if (trimmed.toLowerCase() === 'true') return true;
    if (trimmed.toLowerCase() === 'false') return false;
    // Handle numbers
    if (/^-?\d+(\.\d+)?$/.test(trimmed)) return Number(trimmed);
    // Return as string
    return trimmed;
  }
}

// ─── Main Component ──────────────────────────────────────────────────────────

export const ActionPanelV2: React.FC = () => {
  const screen = useScadaRuntimeStore((s) => s.screen);
  const selectedWidgetIds = useScadaRuntimeStore((s) => s.selectedWidgetIds);
  const updateWidgetRuntime = useScadaRuntimeStore((s) => s.updateWidget);
  const updateWidgetProject = useScadaProjectStore((s) => s.updateWidgetInPage);

  // Update both stores for persistence
  const updateWidget = useCallback(
    (id: string, patch: Parameters<typeof updateWidgetRuntime>[1]) => {
      updateWidgetRuntime(id, patch);
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

  // ── Action / binding updaters ──

  const updateAction = useCallback(
    (trigger: ActionTrigger, patch: Partial<WidgetActionInstance>) => {
      if (!selectedWidget) return;
      let actions = ensureAction([...selectedWidget.actions], trigger);
      actions = actions.map((a) =>
        a.trigger === trigger ? { ...a, ...patch, config: { ...a.config, ...(patch.config ?? {}) } } : a,
      );
      updateWidget(selectedWidget.id, { actions });
    },
    [selectedWidget, updateWidget],
  );

  const getAction = useCallback(
    (trigger: ActionTrigger): WidgetActionInstance | undefined =>
      selectedWidget?.actions.find((a) => a.trigger === trigger),
    [selectedWidget],
  );

  const updateBindings = useCallback(
    (targetProperty: string, sourcePatch: Partial<WidgetBinding['source']>) => {
      if (!selectedWidget) return;
      const bindings = [...selectedWidget.bindings];
      const idx = bindings.findIndex((b) => b.targetProperty === targetProperty);
      if (idx >= 0) {
        const existing = bindings[idx]!;
        bindings[idx] = {
          ...existing,
          source: { ...existing.source, ...sourcePatch },
        };
      } else {
        bindings.push({
          id: `binding_${Date.now()}`,
          targetProperty,
          source: {
            type: 'telemetry' as BindingSourceType,
            entityType: 'DEVICE',
            entityId: '',
            key: '',
            ...sourcePatch,
          },
        });
      }
      updateWidget(selectedWidget.id, { bindings });
    },
    [selectedWidget, updateWidget],
  );

  // ── Derive current device ID from bindings or actions ──
  const deviceId = useMemo(() => {
    if (!selectedWidget) return '';
    // Try bindings first
    const binding = selectedWidget.bindings.find((b) => b.targetProperty === 'state');
    if (binding?.source.entityId) return binding.source.entityId;
    // Try actions
    for (const a of selectedWidget.actions) {
      if (a.config.deviceId) return a.config.deviceId;
    }
    return '';
  }, [selectedWidget]);

  const handleDeviceSelect = useCallback(
    (device: Device) => {
      if (!selectedWidget) return;

      // Update all bindings' entityId — use internal device ID (backend maps to TB)
      const bindings = selectedWidget.bindings.map((b) => ({
        ...b,
        source: { ...b.source, entityId: device.id, entityName: device.name },
      }));

      // Also ensure state binding exists
      if (!bindings.some((b) => b.targetProperty === 'state')) {
        bindings.push({
          id: `binding_state_${Date.now()}`,
          targetProperty: 'state',
          source: {
            type: 'telemetry' as BindingSourceType,
            entityType: 'DEVICE',
            entityId: device.id,
            entityName: device.name,
            key: '',
          },
        });
      }

      // Update all actions' deviceId — use internal device ID (backend maps to TB)
      const actions = selectedWidget.actions.map((a) => ({
        ...a,
        config: { ...a.config, deviceId: device.id },
      }));

      updateWidget(selectedWidget.id, { bindings, actions });
    },
    [selectedWidget, updateWidget],
  );

  // Get binding for initial state
  const stateBinding = useMemo(
    () => selectedWidget?.bindings.find((b) => b.targetProperty === 'state'),
    [selectedWidget],
  );

  // ── No selection ──

  if (!selectedWidget || !definition) {
    return (
      <div className="scada-panel" style={{ width: 260, flexShrink: 0 }}>
        <div className="scada-panel__header">Actions</div>
        <div
          className="scada-panel__body"
          style={{ color: '#9CA3AF', fontSize: 12, textAlign: 'center', padding: 16 }}
        >
          Select a widget
        </div>
      </div>
    );
  }

  if (definition.actionSchema.length === 0) {
    return (
      <div className="scada-panel" style={{ width: 260, flexShrink: 0 }}>
        <div className="scada-panel__header">Actions</div>
        <div
          className="scada-panel__body"
          style={{ color: '#9CA3AF', fontSize: 12, textAlign: 'center', padding: 16 }}
        >
          This widget has no configurable actions
        </div>
      </div>
    );
  }

  const turnOnAction = getAction('turnOn');
  const turnOffAction = getAction('turnOff');

  // Check if this is a "control" widget that needs behavior config
  const hasToggle = definition.actionSchema.some((a) => a.trigger === 'toggle' || a.trigger === 'turnOn');

  return (
    <div className="scada-panel" style={{ width: 260, flexShrink: 0 }}>
      <div className="scada-panel__header">Actions</div>
      <div className="scada-panel__body" style={{ maxHeight: 'calc(100vh - 200px)' }}>
        {/* ── Target Device ── */}
        <FieldGroup label="Target Device">
          <Row label="Device">
            <DeviceSearchDropdown
              selectedDeviceId={deviceId}
              onSelect={handleDeviceSelect}
            />
          </Row>
        </FieldGroup>

        {/* ── Behavior (for toggle switch etc.) ── */}
        {hasToggle && (
          <FieldGroup label="Behavior">
            {/* Initial State */}
            <BehaviorRow
              label="Initial state"
              tooltip="Determines the initial ON/OFF state from a data source"
              summary={
                stateBinding?.source.key
                  ? `Use time series '${stateBinding.source.key}'`
                  : 'Not configured'
              }
            >
              <Row label="Action">
                <select
                  value={stateBinding?.source.type ?? 'telemetry'}
                  onChange={(e) =>
                    updateBindings('state', { type: e.target.value as BindingSourceType })
                  }
                  style={inputStyle}
                >
                  <option value="telemetry">Get time series</option>
                  <option value="attribute">Get attribute value</option>
                  <option value="static">Static value</option>
                </select>
              </Row>
              {(stateBinding?.source.type === 'telemetry' || !stateBinding?.source.type) && (
                <Row label="Time series key*">
                  <TelemetryKeyInput
                    deviceId={deviceId}
                    value={stateBinding?.source.key ?? ''}
                    onChange={(key) => updateBindings('state', { key })}
                  />
                </Row>
              )}
              {stateBinding?.source.type === 'attribute' && (
                <>
                  <Row label="Scope">
                    <select
                      value={stateBinding.source.attributeScope ?? 'SERVER_SCOPE'}
                      onChange={(e) =>
                        updateBindings('state', {
                          attributeScope: e.target.value as 'SERVER_SCOPE' | 'CLIENT_SCOPE' | 'SHARED_SCOPE',
                        })
                      }
                      style={inputStyle}
                    >
                      <option value="SERVER_SCOPE">Server</option>
                      <option value="CLIENT_SCOPE">Client</option>
                      <option value="SHARED_SCOPE">Shared</option>
                    </select>
                  </Row>
                  <Row label="Attribute key*">
                    <input
                      type="text"
                      value={stateBinding.source.key ?? ''}
                      placeholder="attribute key..."
                      onChange={(e) => updateBindings('state', { key: e.target.value })}
                      style={inputStyle}
                    />
                  </Row>
                </>
              )}
              {stateBinding?.source.type === 'static' && (
                <Row label="Value">
                  <select
                    value={String(stateBinding.source.staticValue ?? 'false')}
                    onChange={(e) =>
                      updateBindings('state', { staticValue: e.target.value === 'true' })
                    }
                    style={inputStyle}
                  >
                    <option value="true">True (ON)</option>
                    <option value="false">False (OFF)</option>
                  </select>
                </Row>
              )}
              {/* Action result converter - ThingsBoard style */}
              {stateBinding?.source.type !== 'static' && (
                <>
                  <Row label="Action result converter">
                    <div style={{ display: 'flex', gap: 4 }}>
                      <button
                        type="button"
                        onClick={() => updateBindings('state', { converterEnabled: false })}
                        style={{
                          ...toggleButtonStyle,
                          background: !stateBinding?.source.converterEnabled ? '#3B82F6' : '#E5E7EB',
                          color: !stateBinding?.source.converterEnabled ? '#fff' : '#6B7280',
                        }}
                      >
                        None
                      </button>
                      <button
                        type="button"
                        onClick={() => updateBindings('state', { converterEnabled: true })}
                        style={{
                          ...toggleButtonStyle,
                          background: stateBinding?.source.converterEnabled ? '#3B82F6' : '#E5E7EB',
                          color: stateBinding?.source.converterEnabled ? '#fff' : '#6B7280',
                        }}
                      >
                        Function
                      </button>
                    </div>
                  </Row>
                  {stateBinding?.source.converterEnabled && (
                    <Row label="Converter function">
                      <textarea
                        value={stateBinding?.source.converterFunction ?? 'return data;'}
                        placeholder="return data === 'on' || data === 1;"
                        onChange={(e) => updateBindings('state', { converterFunction: e.target.value })}
                        style={{ ...inputStyle, minHeight: 48, fontFamily: 'monospace', fontSize: 10 }}
                      />
                    </Row>
                  )}
                  <Row label="'On' when result is">
                    <select
                      value={stateBinding?.source.onWhenResultType ?? 'boolean'}
                      onChange={(e) =>
                        updateBindings('state', {
                          onWhenResultType: e.target.value as 'string' | 'integer' | 'double' | 'boolean' | 'json',
                        })
                      }
                      style={inputStyle}
                    >
                      <option value="boolean">Boolean</option>
                      <option value="string">String</option>
                      <option value="integer">Integer</option>
                      <option value="double">Double</option>
                      <option value="json">JSON</option>
                    </select>
                  </Row>
                </>
              )}
            </BehaviorRow>

            {/* Turn On */}
            <BehaviorRow
              label="Turn 'On'"
              tooltip="Action to execute when the switch is turned ON"
              summary={
                turnOnAction?.config.rpcMethod
                  ? `Execute RPC method '${turnOnAction.config.rpcMethod}'`
                  : 'Not configured'
              }
            >
              <Row label="Action">
                <select
                  value={turnOnAction?.actionType ?? 'rpcCall'}
                  onChange={(e) =>
                    updateAction('turnOn', { actionType: e.target.value as ActionType })
                  }
                  style={inputStyle}
                >
                  <option value="rpcCall">Execute RPC</option>
                  <option value="setAttribute">Set Attribute</option>
                </select>
              </Row>
              {(turnOnAction?.actionType === 'rpcCall' || !turnOnAction) && (
                <>
                  <Row label="Method">
                    <input
                      type="text"
                      value={turnOnAction?.config.rpcMethod ?? ''}
                      placeholder="e.g. setState"
                      onChange={(e) =>
                        updateAction('turnOn', { config: { rpcMethod: e.target.value } })
                      }
                      style={inputStyle}
                    />
                  </Row>
                  <Row label="Params">
                    <input
                      type="text"
                      value={formatParamsForDisplay(turnOnAction?.config.rpcParams)}
                      placeholder="true or {&quot;pin&quot;: 1}"
                      onChange={(e) => {
                        const parsed = parseParamsInput(e.target.value);
                        updateAction('turnOn', { config: { rpcParams: parsed } });
                      }}
                      style={inputStyle}
                    />
                  </Row>
                </>
              )}
              {turnOnAction?.actionType === 'setAttribute' && (
                <>
                  <Row label="Key">
                    <input
                      type="text"
                      value={turnOnAction.config.attributeKey ?? ''}
                      placeholder="attribute key"
                      onChange={(e) =>
                        updateAction('turnOn', { config: { attributeKey: e.target.value } })
                      }
                      style={inputStyle}
                    />
                  </Row>
                  <Row label="Value">
                    <input
                      type="text"
                      value={String(turnOnAction.config.attributeValue ?? 'true')}
                      placeholder="true"
                      onChange={(e) =>
                        updateAction('turnOn', { config: { attributeValue: e.target.value } })
                      }
                      style={inputStyle}
                    />
                  </Row>
                </>
              )}
            </BehaviorRow>

            {/* Turn Off */}
            <BehaviorRow
              label="Turn 'Off'"
              tooltip="Action to execute when the switch is turned OFF"
              summary={
                turnOffAction?.config.rpcMethod
                  ? `Execute RPC method '${turnOffAction.config.rpcMethod}'`
                  : 'Not configured'
              }
            >
              <Row label="Action">
                <select
                  value={turnOffAction?.actionType ?? 'rpcCall'}
                  onChange={(e) =>
                    updateAction('turnOff', { actionType: e.target.value as ActionType })
                  }
                  style={inputStyle}
                >
                  <option value="rpcCall">Execute RPC</option>
                  <option value="setAttribute">Set Attribute</option>
                </select>
              </Row>
              {(turnOffAction?.actionType === 'rpcCall' || !turnOffAction) && (
                <>
                  <Row label="Method">
                    <input
                      type="text"
                      value={turnOffAction?.config.rpcMethod ?? ''}
                      placeholder="e.g. setState"
                      onChange={(e) =>
                        updateAction('turnOff', { config: { rpcMethod: e.target.value } })
                      }
                      style={inputStyle}
                    />
                  </Row>
                  <Row label="Params">
                    <input
                      type="text"
                      value={formatParamsForDisplay(turnOffAction?.config.rpcParams)}
                      placeholder="false or {&quot;pin&quot;: 0}"
                      onChange={(e) => {
                        const parsed = parseParamsInput(e.target.value);
                        updateAction('turnOff', { config: { rpcParams: parsed } });
                      }}
                      style={inputStyle}
                    />
                  </Row>
                </>
              )}
              {turnOffAction?.actionType === 'setAttribute' && (
                <>
                  <Row label="Key">
                    <input
                      type="text"
                      value={turnOffAction.config.attributeKey ?? ''}
                      placeholder="attribute key"
                      onChange={(e) =>
                        updateAction('turnOff', { config: { attributeKey: e.target.value } })
                      }
                      style={inputStyle}
                    />
                  </Row>
                  <Row label="Value">
                    <input
                      type="text"
                      value={String(turnOffAction.config.attributeValue ?? 'false')}
                      placeholder="false"
                      onChange={(e) =>
                        updateAction('turnOff', { config: { attributeValue: e.target.value } })
                      }
                      style={inputStyle}
                    />
                  </Row>
                </>
              )}
            </BehaviorRow>

            {/* Disabled state */}
            <BehaviorRow
              label="Disabled state"
              tooltip="Whether the widget is disabled (non-interactive)"
              summary={selectedWidget.properties.disabled ? 'True' : 'False'}
            >
              <Row label="Disabled">
                <select
                  value={String(selectedWidget.properties.disabled ?? false)}
                  onChange={(e) => {
                    const props = { ...selectedWidget.properties, disabled: e.target.value === 'true' };
                    updateWidget(selectedWidget.id, { properties: props });
                  }}
                  style={inputStyle}
                >
                  <option value="false">False</option>
                  <option value="true">True</option>
                </select>
              </Row>
            </BehaviorRow>
          </FieldGroup>
        )}

        {/* ── Generic actions for non-toggle widgets ── */}
        {!hasToggle && (
          <FieldGroup label="Event Actions">
            {definition.actionSchema.map((schema) => {
              const action = selectedWidget.actions.find((a) => a.trigger === schema.trigger);
              return (
                <GenericActionEditor
                  key={schema.trigger}
                  label={schema.label}
                  description={schema.description}
                  trigger={schema.trigger as ActionTrigger}
                  action={action}
                  deviceId={deviceId}
                  onUpdate={(patch) => updateAction(schema.trigger as ActionTrigger, patch)}
                />
              );
            })}
          </FieldGroup>
        )}
      </div>
    </div>
  );
};

// ─── Sub-components ──────────────────────────────────────────────────────────

const FieldGroup: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
  <div style={{ marginBottom: 12 }}>
    <div
      style={{
        fontSize: 10,
        fontWeight: 600,
        color: '#9CA3AF',
        textTransform: 'uppercase',
        marginBottom: 6,
      }}
    >
      {label}
    </div>
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>{children}</div>
  </div>
);

const Row: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
    <label style={{ fontSize: 11, color: '#6B7280', width: 60, flexShrink: 0 }}>{label}</label>
    <div style={{ flex: 1 }}>{children}</div>
  </div>
);

/** Expandable behavior row — resembles the ThingsBoard behavior card */
const BehaviorRow: React.FC<{
  label: string;
  tooltip?: string;
  summary: string;
  children: React.ReactNode;
}> = ({ label, tooltip, summary, children }) => {
  const [expanded, setExpanded] = useState(false);

  return (
    <div
      style={{
        border: '1px solid #e5e7eb',
        borderRadius: 8,
        overflow: 'hidden',
        background: '#fff',
      }}
    >
      {/* Header */}
      <div
        onClick={() => setExpanded(!expanded)}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '8px 10px',
          cursor: 'pointer',
          userSelect: 'none',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: 12, fontWeight: 500, color: '#374151' }}>{label}</span>
          {tooltip && (
            <span
              title={tooltip}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 14,
                height: 14,
                borderRadius: '50%',
                background: '#E5E7EB',
                color: '#9CA3AF',
                fontSize: 9,
                fontWeight: 700,
                cursor: 'help',
              }}
            >
              i
            </span>
          )}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span
            style={{
              fontSize: 11,
              color: '#3B82F6',
              maxWidth: 120,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
            title={summary}
          >
            {summary}
          </span>
          <span style={{ fontSize: 10, color: '#9CA3AF' }}>✏️</span>
        </div>
      </div>

      {/* Expandable body */}
      {expanded && (
        <div
          style={{
            borderTop: '1px solid #F3F4F6',
            padding: '8px 10px',
            display: 'flex',
            flexDirection: 'column',
            gap: 6,
            background: '#F9FAFB',
          }}
        >
          {children}
        </div>
      )}
    </div>
  );
};

// ─── Device Search Dropdown ──────────────────────────────────────────────────

const DeviceSearchDropdown: React.FC<{
  selectedDeviceId: string;
  onSelect: (device: Device) => void;
}> = ({ selectedDeviceId, onSelect }) => {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [devices, setDevices] = useState<Device[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedName, setSelectedName] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Resolve device name from ID on mount
  useEffect(() => {
    if (!selectedDeviceId) {
      setSelectedName('');
      return;
    }
    deviceService
      .getDevices({ pageSize: 100 })
      .then((res) => {
        const d = (res.data || []).find(
          (dev: Device) => dev.tbDeviceId === selectedDeviceId || dev.id === selectedDeviceId,
        );
        if (d) setSelectedName(d.name);
      })
      .catch(() => {});
  }, [selectedDeviceId]);

  const fetchDevices = useCallback(async (query: string) => {
    try {
      setLoading(true);
      const params: Record<string, unknown> = { page: 1, pageSize: 20 };
      if (query) (params as Record<string, unknown>).textSearch = query;
      const res = await deviceService.getDevices(params as Parameters<typeof deviceService.getDevices>[0]);
      setDevices(res.data || []);
    } catch {
      setDevices([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (open) fetchDevices(search);
  }, [open, search, fetchDevices]);

  useEffect(() => {
    if (!open) return;
    const handleClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open]);

  return (
    <div ref={containerRef} style={{ position: 'relative' }}>
      <button
        type="button"
        onClick={() => {
          setOpen(!open);
          setTimeout(() => inputRef.current?.focus(), 50);
        }}
        style={{
          ...inputStyle,
          textAlign: 'left',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          cursor: 'pointer',
          color: selectedDeviceId ? '#111827' : '#9CA3AF',
        }}
      >
        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {selectedName || (selectedDeviceId ? `ID: ${selectedDeviceId.slice(0, 8)}...` : 'Select device...')}
        </span>
        <span style={{ fontSize: 10, color: '#9CA3AF' }}>{open ? '▲' : '▼'}</span>
      </button>

      {open && (
        <div
          style={{
            position: 'absolute',
            zIndex: 50,
            marginTop: 2,
            width: '100%',
            background: '#fff',
            border: '1px solid #e5e7eb',
            borderRadius: 6,
            boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
            maxHeight: 240,
            overflow: 'hidden',
          }}
        >
          <div style={{ padding: 6, borderBottom: '1px solid #f3f4f6' }}>
            <input
              ref={inputRef}
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search devices..."
              style={{
                width: '100%',
                padding: '4px 8px',
                fontSize: 11,
                border: '1px solid #e5e7eb',
                borderRadius: 4,
                outline: 'none',
              }}
            />
          </div>
          <div style={{ maxHeight: 180, overflowY: 'auto' }}>
            {loading ? (
              <div style={{ padding: '8px 12px', fontSize: 10, color: '#9CA3AF', textAlign: 'center' }}>
                Loading...
              </div>
            ) : devices.length === 0 ? (
              <div style={{ padding: '8px 12px', fontSize: 10, color: '#9CA3AF', textAlign: 'center' }}>
                No devices found
              </div>
            ) : (
              devices.map((device) => (
                <button
                  key={device.id}
                  type="button"
                  onClick={() => {
                    onSelect(device);
                    setSelectedName(device.name);
                    setOpen(false);
                    setSearch('');
                  }}
                  style={{
                    width: '100%',
                    textAlign: 'left',
                    padding: '6px 10px',
                    fontSize: 11,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    border: 'none',
                    background:
                      device.tbDeviceId === selectedDeviceId || device.id === selectedDeviceId
                        ? '#EFF6FF'
                        : 'transparent',
                    color: '#374151',
                    cursor: 'pointer',
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLElement).style.background = '#F0F9FF';
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLElement).style.background =
                      (device.id === selectedDeviceId || device.tbDeviceId === selectedDeviceId) ? '#EFF6FF' : 'transparent';
                  }}
                >
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {device.name}
                    </div>
                    <div style={{ fontSize: 10, color: '#9CA3AF' }}>
                      {device.deviceType?.name || device.model || 'Device'}
                    </div>
                  </div>
                  <span
                    style={{
                      width: 7,
                      height: 7,
                      borderRadius: '50%',
                      background: device.isOnline ? '#22C55E' : '#D1D5DB',
                      flexShrink: 0,
                      marginLeft: 6,
                    }}
                  />
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

// ─── Telemetry Key Input with autocomplete ───────────────────────────────────

const TelemetryKeyInput: React.FC<{
  deviceId: string;
  value: string;
  onChange: (key: string) => void;
}> = ({ deviceId, value, onChange }) => {
  const [open, setOpen] = useState(false);
  const [keys, setKeys] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open || !deviceId) return;
    setLoading(true);
    deviceService
      .getDeviceTelemetry(deviceId)
      .then((data: unknown) => {
        if (data && typeof data === 'object') {
          setKeys(Object.keys(data as Record<string, unknown>).sort());
        }
      })
      .catch(() => setKeys([]))
      .finally(() => setLoading(false));
  }, [open, deviceId]);

  useEffect(() => {
    if (!open) return;
    const handleClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open]);

  return (
    <div ref={containerRef} style={{ position: 'relative' }}>
      <input
        type="text"
        value={value}
        placeholder="telemetry key..."
        onClick={() => setOpen(true)}
        onChange={(e) => {
          onChange(e.target.value);
          setOpen(true);
        }}
        style={inputStyle}
      />
      {open && keys.length > 0 && (
        <div
          style={{
            position: 'absolute',
            zIndex: 50,
            marginTop: 2,
            width: '100%',
            background: '#fff',
            border: '1px solid #e5e7eb',
            borderRadius: 4,
            boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
            maxHeight: 150,
            overflowY: 'auto',
          }}
        >
          {loading ? (
            <div style={{ padding: 6, fontSize: 10, color: '#9CA3AF', textAlign: 'center' }}>
              Loading...
            </div>
          ) : (
            keys
              .filter((k) => !value || k.toLowerCase().includes(value.toLowerCase()))
              .map((k) => (
                <button
                  key={k}
                  type="button"
                  onClick={() => {
                    onChange(k);
                    setOpen(false);
                  }}
                  style={{
                    width: '100%',
                    textAlign: 'left',
                    padding: '4px 8px',
                    fontSize: 11,
                    border: 'none',
                    background: k === value ? '#EFF6FF' : 'transparent',
                    color: '#374151',
                    cursor: 'pointer',
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLElement).style.background = '#F0F9FF';
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLElement).style.background = k === value ? '#EFF6FF' : 'transparent';
                  }}
                >
                  {k}
                </button>
              ))
          )}
        </div>
      )}
    </div>
  );
};

// ─── Generic Action Editor (for non-toggle widgets) ──────────────────────────

const GenericActionEditor: React.FC<{
  label: string;
  description?: string | undefined;
  trigger: ActionTrigger;
  action: WidgetActionInstance | undefined;
  deviceId: string;
  onUpdate: (patch: Partial<WidgetActionInstance>) => void;
}> = ({ label, description, action, onUpdate }) => {
  const [expanded, setExpanded] = useState(false);
  const windows = useScadaRuntimeStore((s) => s.screen?.windows ?? []);

  return (
    <div style={{ border: '1px solid #e5e7eb', borderRadius: 6, overflow: 'hidden' }}>
      <div
        onClick={() => setExpanded(!expanded)}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '6px 8px',
          cursor: 'pointer',
          background: '#FAFBFC',
        }}
      >
        <span style={{ fontSize: 11, fontWeight: 500, color: '#374151' }}>
          {label}
          {action?.config.rpcMethod && (
            <span style={{ color: '#22C55E', marginLeft: 4, fontSize: 9 }}>●</span>
          )}
        </span>
        <span style={{ fontSize: 10, color: '#9CA3AF' }}>{expanded ? '▲' : '▼'}</span>
      </div>

      {expanded && (
        <div
          style={{
            padding: '8px',
            borderTop: '1px solid #f3f4f6',
            display: 'flex',
            flexDirection: 'column',
            gap: 6,
          }}
        >
          {description && (
            <div style={{ fontSize: 10, color: '#9CA3AF', fontStyle: 'italic' }}>{description}</div>
          )}
          <Row label="Type">
            <select
              value={action?.actionType ?? 'rpcCall'}
              onChange={(e) => onUpdate({ actionType: e.target.value as ActionType })}
              style={inputStyle}
            >
              <option value="rpcCall">RPC Call</option>
              <option value="setAttribute">Set Attribute</option>
              <option value="setVariable">Set Variable</option>
              <option value="navigate">Navigate</option>
            </select>
          </Row>
          {(action?.actionType === 'rpcCall' || !action?.actionType) && (
            <>
              <Row label="Method">
                <input
                  type="text"
                  value={action?.config.rpcMethod ?? ''}
                  placeholder="RPC method..."
                  onChange={(e) => onUpdate({ config: { rpcMethod: e.target.value } })}
                  style={inputStyle}
                />
              </Row>
              <Row label="Params">
                <input
                  type="text"
                  value={action?.config.rpcParams ? JSON.stringify(action.config.rpcParams) : ''}
                  placeholder="{}"
                  onChange={(e) => {
                    try {
                      onUpdate({ config: { rpcParams: JSON.parse(e.target.value) } });
                    } catch {
                      /* keep raw until valid */
                    }
                  }}
                  style={inputStyle}
                />
              </Row>
            </>
          )}
          {action?.actionType === 'navigate' && (
            <Row label="Window">
              <select
                value={action?.config.targetWindowId ?? ''}
                onChange={(e) => onUpdate({ config: { targetWindowId: e.target.value } })}
                style={inputStyle}
              >
                <option value="">-- Select window --</option>
                {windows.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.name}{w.isMain ? ' ★' : ''}
                  </option>
                ))}
              </select>
            </Row>
          )}
        </div>
      )}
    </div>
  );
};

// ─── Styles ──────────────────────────────────────────────────────────────────

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '4px 6px',
  border: '1px solid #e5e7eb',
  borderRadius: 4,
  fontSize: 11,
  outline: 'none',
  background: '#fff',
};

const toggleButtonStyle: React.CSSProperties = {
  flex: 1,
  padding: '4px 8px',
  border: 'none',
  borderRadius: 4,
  fontSize: 11,
  fontWeight: 500,
  cursor: 'pointer',
  transition: 'all 0.15s ease',
};
