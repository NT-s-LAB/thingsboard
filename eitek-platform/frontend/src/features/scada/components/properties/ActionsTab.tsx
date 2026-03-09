/**
 * @deprecated V1 SCADA - This file belongs to the legacy V1 engine (Konva-based).
 * Replaced by V2 engine in /engine/ and /core/. Scheduled for removal.
 */
'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Section, Field, inputCls, selectCls, numCls, btnSmCls, checkCls } from '../PropertyPanel';
import type { Widget, WidgetAction, EventType, ActionType, DataBinding, DataBindingType, TbAttributeScope, TbAlarmSeverity } from '../../types';
import { deviceService } from '@/features/devices/services/deviceService';
import type { Device } from '@/features/devices/types';

interface ActionsTabProps {
  widget: Widget;
  onUpdate: (updates: Partial<Widget>) => void;
}

/* ================================================================
   Control widget behavior configuration (ThingsBoard-style)
   ================================================================ */

const CONTROL_WIDGET_TYPES = ['switch', 'valve', 'motor', 'pump'] as const;

interface BehaviorLabels {
  onLabel: string;
  offLabel: string;
  onTrigger: EventType;
  offTrigger: EventType;
}

const BEHAVIOR_LABELS: Record<string, BehaviorLabels> = {
  switch: { onLabel: 'Turn On action', offLabel: 'Turn Off action', onTrigger: 'onTurnOn', offTrigger: 'onTurnOff' },
  valve:  { onLabel: 'Open action',    offLabel: 'Close action',    onTrigger: 'onTurnOn', offTrigger: 'onTurnOff' },
  motor:  { onLabel: 'Start action',   offLabel: 'Stop action',     onTrigger: 'onTurnOn', offTrigger: 'onTurnOff' },
  pump:   { onLabel: 'Start action',   offLabel: 'Stop action',     onTrigger: 'onTurnOn', offTrigger: 'onTurnOff' },
};

function isControlWidget(type: string): boolean {
  return (CONTROL_WIDGET_TYPES as readonly string[]).includes(type);
}

/* ================================================================
   Main ActionsTab - shows Behavior panel for control widgets,
   generic panel for others
   ================================================================ */

export const ActionsTab: React.FC<ActionsTabProps> = ({ widget, onUpdate }) => {
  if (isControlWidget(widget.type)) {
    return <BehaviorPanel widget={widget} onUpdate={onUpdate} />;
  }
  return <GenericActionsPanel widget={widget} onUpdate={onUpdate} />;
};

/* ================================================================
   BehaviorPanel – ThingsBoard-style for switch/valve/motor/pump
   ================================================================ */

type InitialStateSource = 'telemetry' | 'attribute' | 'static';
type BehaviorActionType = 'rpcCall' | 'updateAttribute';

const BehaviorPanel: React.FC<ActionsTabProps> = ({ widget, onUpdate }) => {
  const labels = BEHAVIOR_LABELS[widget.type] ?? BEHAVIOR_LABELS['switch']!;
  const actions: WidgetAction[] = widget.actions ?? [];
  const bindings: DataBinding[] = widget.dataBindings ?? [];

  // ── Find or derive device ID from existing bindings/actions ──
  const existingDeviceId =
    actions.find((a) => a.parameters.deviceId)?.parameters.deviceId ??
    bindings.find((b) => b.entityId)?.entityId ??
    '';
  const existingDeviceName =
    bindings.find((b) => b.entityName)?.entityName ?? '';

  // ── Find existing behavior actions ──
  const turnOnAction = actions.find((a) => a.trigger === labels.onTrigger);
  const turnOffAction = actions.find((a) => a.trigger === labels.offTrigger);

  // ── Find initial state binding (convention: label === '__initial_state') ──
  const stateBinding = bindings.find((b) => b.label === '__initial_state');

  // ── Expanded cards ──
  const [expandedCard, setExpandedCard] = useState<string | null>(null);
  const toggle = (card: string) => setExpandedCard(expandedCard === card ? null : card);

  // ── Device selection ──
  const handleDeviceSelect = (device: Device) => {
    // Update all actions' deviceId
    const updatedActions = actions.map((a) => ({
      ...a,
      parameters: { ...a.parameters, deviceId: device.id },
    }));
    // Update all bindings' entityId/entityName
    const updatedBindings = bindings.map((b) => ({
      ...b,
      entityId: device.id,
      entityName: device.name,
    }));
    onUpdate({ actions: updatedActions, dataBindings: updatedBindings });
  };

  // ── Upsert an action by trigger ──
  const upsertAction = (trigger: EventType, updates: Partial<WidgetAction>) => {
    const existing = actions.find((a) => a.trigger === trigger);
    if (existing) {
      onUpdate({
        actions: actions.map((a) =>
          a.trigger === trigger
            ? { ...a, ...updates, parameters: { ...a.parameters, ...(updates.parameters ?? {}) } }
            : a
        ),
      });
    } else {
      const newAction: WidgetAction = {
        id: crypto.randomUUID(),
        type: updates.type ?? 'rpcCall',
        trigger,
        enabled: true,
        name: updates.name ?? '',
        parameters: { deviceId: existingDeviceId, ...(updates.parameters ?? {}) },
      };
      onUpdate({ actions: [...actions, newAction] });
    }
  };

  // ── Upsert initial state binding ──
  const upsertStateBinding = (patch: Partial<DataBinding>) => {
    if (stateBinding) {
      onUpdate({
        dataBindings: bindings.map((b) =>
          b.label === '__initial_state' ? { ...b, ...patch } : b
        ),
      });
    } else {
      const newBinding: DataBinding = {
        id: crypto.randomUUID(),
        type: (patch.type as DataBindingType) ?? 'telemetry',
        label: '__initial_state',
        entityType: 'DEVICE',
        entityId: existingDeviceId,
        entityName: existingDeviceName,
        telemetryKey: '',
        defaultValue: false,
        thresholds: [],
        ...patch,
      };
      onUpdate({ dataBindings: [...bindings, newBinding] });
    }
  };

  return (
    <div className="p-3 space-y-3">
      {/* ── Target Device ── */}
      <Section title="Target Device">
        <Field label="Device">
          <DeviceSearchDropdown
            selectedDeviceId={existingDeviceId || undefined}
            selectedDeviceName={existingDeviceName || undefined}
            onSelect={handleDeviceSelect}
          />
        </Field>
      </Section>

      {/* ── Behavior Cards ── */}
      <Section title="Behavior">
        <div className="space-y-2">
          {/* Initial State */}
          <BehaviorCard
            label="Initial state"
            summary={stateBinding ? `${stateBinding.type}: ${stateBinding.telemetryKey || stateBinding.attributeKey || '—'}` : 'Not configured'}
            expanded={expandedCard === 'initialState'}
            onToggle={() => toggle('initialState')}
            color="blue"
          >
            <InitialStateEditor
              binding={stateBinding}
              deviceId={existingDeviceId}
              onUpdate={upsertStateBinding}
            />
          </BehaviorCard>

          {/* Turn On / Open / Start */}
          <BehaviorCard
            label={labels.onLabel}
            summary={turnOnAction ? `${turnOnAction.type === 'rpcCall' ? 'RPC' : 'Attribute'}: ${turnOnAction.parameters.method || turnOnAction.parameters.attributeKey || '—'}` : 'Not configured'}
            expanded={expandedCard === 'turnOn'}
            onToggle={() => toggle('turnOn')}
            color="green"
          >
            <BehaviorActionEditor
              action={turnOnAction}
              deviceId={existingDeviceId}
              triggerLabel={labels.onLabel}
              onUpdate={(updates) => upsertAction(labels.onTrigger, { name: labels.onLabel, ...updates })}
            />
          </BehaviorCard>

          {/* Turn Off / Close / Stop */}
          <BehaviorCard
            label={labels.offLabel}
            summary={turnOffAction ? `${turnOffAction.type === 'rpcCall' ? 'RPC' : 'Attribute'}: ${turnOffAction.parameters.method || turnOffAction.parameters.attributeKey || '—'}` : 'Not configured'}
            expanded={expandedCard === 'turnOff'}
            onToggle={() => toggle('turnOff')}
            color="red"
          >
            <BehaviorActionEditor
              action={turnOffAction}
              deviceId={existingDeviceId}
              triggerLabel={labels.offLabel}
              onUpdate={(updates) => upsertAction(labels.offTrigger, { name: labels.offLabel, ...updates })}
            />
          </BehaviorCard>

          {/* Disabled State */}
          <BehaviorCard
            label="Disabled state"
            summary={widget.enabled === false ? 'Disabled' : 'Enabled'}
            expanded={expandedCard === 'disabled'}
            onToggle={() => toggle('disabled')}
            color="gray"
          >
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                className={checkCls}
                checked={widget.enabled === false}
                onChange={(e) => onUpdate({ enabled: !e.target.checked })}
              />
              <span className="text-xs text-gray-700">Widget disabled (read-only in runtime)</span>
            </label>
          </BehaviorCard>
        </div>
      </Section>

      {/* ── Advanced Actions (existing generic editor) ── */}
      <Section title="Advanced Actions" defaultOpen={false}>
        <GenericActionsPanel widget={widget} onUpdate={onUpdate} />
      </Section>
    </div>
  );
};

/* ── Behavior Card (expandable row) ── */

const CARD_COLORS: Record<string, string> = {
  blue: 'border-l-blue-500',
  green: 'border-l-green-500',
  red: 'border-l-red-500',
  gray: 'border-l-gray-400',
};

const BehaviorCard: React.FC<{
  label: string;
  summary: string;
  expanded: boolean;
  onToggle: () => void;
  color: string;
  children: React.ReactNode;
}> = ({ label, summary, expanded, onToggle, color, children }) => (
  <div className={`border border-gray-200 rounded-md overflow-hidden border-l-4 ${CARD_COLORS[color] ?? ''}`}>
    <div
      className="flex items-center justify-between px-3 py-2 cursor-pointer hover:bg-gray-50 bg-gray-50/50"
      onClick={onToggle}
    >
      <div className="min-w-0">
        <div className="text-xs font-medium text-gray-800">{label}</div>
        <div className="text-[10px] text-gray-500 truncate">{summary}</div>
      </div>
      <div className="flex items-center gap-1 flex-shrink-0">
        <span className="text-gray-400 text-[10px]">{expanded ? '▼' : '▶'}</span>
      </div>
    </div>
    {expanded && (
      <div className="px-3 py-2 space-y-2 bg-white border-t border-gray-100">
        {children}
      </div>
    )}
  </div>
);

/* ── Initial State Editor ── */

const InitialStateEditor: React.FC<{
  binding: DataBinding | undefined;
  deviceId: string;
  onUpdate: (patch: Partial<DataBinding>) => void;
}> = ({ binding, deviceId, onUpdate }) => {
  const sourceType: InitialStateSource = (binding?.type as InitialStateSource) || 'telemetry';

  return (
    <div className="space-y-2">
      <Field label="Source">
        <select
          className={selectCls}
          value={sourceType}
          onChange={(e) => onUpdate({ type: e.target.value as DataBindingType })}
        >
          <option value="telemetry">Telemetry</option>
          <option value="attribute">Attribute</option>
          <option value="static">Static value</option>
        </select>
      </Field>

      {sourceType === 'telemetry' && (
        <Field label="Telemetry Key">
          <KeyDropdown
            deviceId={deviceId}
            value={binding?.telemetryKey ?? ''}
            onChange={(key) => onUpdate({ telemetryKey: key })}
            keyType="telemetry"
            placeholder="e.g. state, isOn"
          />
        </Field>
      )}

      {sourceType === 'attribute' && (
        <>
          <Field label="Scope">
            <select
              className={selectCls}
              value={binding?.attributeScope ?? 'SERVER_SCOPE'}
              onChange={(e) => onUpdate({ attributeScope: e.target.value as TbAttributeScope })}
            >
              <option value="SERVER_SCOPE">Server</option>
              <option value="CLIENT_SCOPE">Client</option>
              <option value="SHARED_SCOPE">Shared</option>
            </select>
          </Field>
          <Field label="Attribute Key">
            <KeyDropdown
              deviceId={deviceId}
              value={binding?.attributeKey ?? ''}
              onChange={(key) => onUpdate({ attributeKey: key })}
              keyType="attribute"
              attributeScope={binding?.attributeScope ?? 'SERVER_SCOPE'}
              placeholder="e.g. isActive"
            />
          </Field>
        </>
      )}

      {sourceType === 'static' && (
        <Field label="Static Value">
          <select
            className={selectCls}
            value={String(binding?.staticValue ?? 'false')}
            onChange={(e) => onUpdate({ staticValue: e.target.value === 'true' })}
          >
            <option value="true">ON (true)</option>
            <option value="false">OFF (false)</option>
          </select>
        </Field>
      )}
    </div>
  );
};

/* ── Behavior Action Editor (Turn On / Turn Off) ── */

const BehaviorActionEditor: React.FC<{
  action: WidgetAction | undefined;
  deviceId: string;
  triggerLabel: string;
  onUpdate: (updates: Partial<WidgetAction>) => void;
}> = ({ action, onUpdate }) => {
  const actionType: BehaviorActionType = (action?.type as BehaviorActionType) || 'rpcCall';
  const params = action?.parameters ?? {};

  const setParam = (key: string, value: any) => {
    onUpdate({ parameters: { ...params, [key]: value } });
  };

  return (
    <div className="space-y-2">
      <Field label="Action">
        <select
          className={selectCls}
          value={actionType}
          onChange={(e) => onUpdate({ type: e.target.value as ActionType })}
        >
          <option value="rpcCall">Execute RPC</option>
          <option value="updateAttribute">Set attribute</option>
        </select>
      </Field>

      {actionType === 'rpcCall' && (
        <>
          <Field label="RPC Method">
            <input
              className={inputCls}
              value={params.method ?? ''}
              placeholder="e.g. setValue, toggleRelay"
              onChange={(e) => setParam('method', e.target.value)}
            />
          </Field>
          <Field label="RPC Parameters (JSON)">
            <textarea
              className={inputCls + ' min-h-[40px] resize-y font-mono'}
              value={typeof params.params === 'string' ? params.params : JSON.stringify(params.params ?? {}, null, 2)}
              placeholder='{"pin": 1, "value": true}'
              onChange={(e) => {
                try { setParam('params', JSON.parse(e.target.value)); } catch { setParam('params', e.target.value); }
              }}
            />
          </Field>
          <Field label="Direction">
            <select
              className={selectCls}
              value={params.rpcOneWay ? 'oneway' : 'twoway'}
              onChange={(e) => setParam('rpcOneWay', e.target.value === 'oneway')}
            >
              <option value="twoway">Two-way (wait response)</option>
              <option value="oneway">One-way (fire & forget)</option>
            </select>
          </Field>
        </>
      )}

      {actionType === 'updateAttribute' && (
        <>
          <Field label="Scope">
            <select
              className={selectCls}
              value={params.attributeScope ?? 'SHARED_SCOPE'}
              onChange={(e) => setParam('attributeScope', e.target.value)}
            >
              <option value="SERVER_SCOPE">Server</option>
              <option value="SHARED_SCOPE">Shared</option>
            </select>
          </Field>
          <Field label="Key">
            <input
              className={inputCls}
              value={params.attributeKey ?? ''}
              placeholder="e.g. isOn"
              onChange={(e) => setParam('attributeKey', e.target.value)}
            />
          </Field>
          <Field label="Value">
            <input
              className={inputCls}
              value={params.attributeValue ?? ''}
              placeholder="e.g. true"
              onChange={(e) => setParam('attributeValue', e.target.value)}
            />
          </Field>
        </>
      )}
    </div>
  );
};

/* ================================================================
   Device Search Dropdown (inline, same pattern as DataBindingTab)
   ================================================================ */

const DeviceSearchDropdown: React.FC<{
  selectedDeviceId: string | undefined;
  selectedDeviceName: string | undefined;
  onSelect: (device: Device) => void;
}> = ({ selectedDeviceId, selectedDeviceName, onSelect }) => {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [devices, setDevices] = useState<Device[]>([]);
  const [loading, setLoading] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const fetchDevices = useCallback(async (query: string) => {
    try {
      setLoading(true);
      const params: Record<string, any> = { page: 1, pageSize: 20 };
      if (query) params.textSearch = query;
      const res = await deviceService.getDevices(params);
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
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => { setOpen(!open); setTimeout(() => inputRef.current?.focus(), 50); }}
        className={`${inputCls} text-left flex items-center justify-between cursor-pointer`}
      >
        <span className={selectedDeviceId ? 'text-gray-900' : 'text-gray-400'}>
          {selectedDeviceName || (selectedDeviceId ? `ID: ${selectedDeviceId.slice(0, 8)}...` : 'Select device...')}
        </span>
        <span className="text-gray-400 text-[10px]">{open ? '▲' : '▼'}</span>
      </button>

      {open && (
        <div className="absolute z-50 mt-1 w-full bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-hidden">
          <div className="p-1.5 border-b border-gray-100">
            <input
              ref={inputRef}
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search devices..."
              className="w-full px-2 py-1 text-xs border border-gray-200 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none"
            />
          </div>
          <div className="max-h-48 overflow-y-auto">
            {loading ? (
              <div className="px-3 py-2 text-[10px] text-gray-500 text-center">Loading...</div>
            ) : devices.length === 0 ? (
              <div className="px-3 py-2 text-[10px] text-gray-500 text-center">No devices found</div>
            ) : (
              devices.map((device) => (
                <button
                  key={device.id}
                  type="button"
                  onClick={() => { onSelect(device); setOpen(false); setSearch(''); }}
                  className={`w-full text-left px-3 py-1.5 text-xs hover:bg-blue-50 flex items-center justify-between transition-colors ${
                    device.id === selectedDeviceId ? 'bg-blue-50 text-blue-700' : 'text-gray-700'
                  }`}
                >
                  <div className="min-w-0">
                    <div className="font-medium truncate">{device.name}</div>
                    <div className="text-[10px] text-gray-400 truncate">
                      {device.deviceType?.name || device.model || 'Device'}
                    </div>
                  </div>
                  <span className={`w-2 h-2 rounded-full flex-shrink-0 ml-2 ${device.isOnline ? 'bg-green-500' : 'bg-gray-300'}`} />
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

/* ================================================================
   Key Dropdown (telemetry / attribute key autocomplete)
   ================================================================ */

const KeyDropdown: React.FC<{
  deviceId: string | undefined;
  value: string;
  onChange: (key: string) => void;
  keyType: 'telemetry' | 'attribute';
  attributeScope?: string;
  placeholder?: string;
}> = ({ deviceId, value, onChange, keyType, attributeScope, placeholder }) => {
  const [open, setOpen] = useState(false);
  const [keys, setKeys] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const fetchKeys = useCallback(async () => {
    if (!deviceId) { setKeys([]); return; }
    try {
      setLoading(true);
      if (keyType === 'telemetry') {
        const data = await deviceService.getDeviceTelemetry(deviceId);
        setKeys(data && typeof data === 'object' ? Object.keys(data).sort() : []);
      } else {
        const scope = attributeScope || 'SERVER_SCOPE';
        const data = await deviceService.getDeviceAttributes(deviceId, scope);
        setKeys(data && typeof data === 'object' ? Object.keys(data).sort() : []);
      }
    } catch {
      setKeys([]);
    } finally {
      setLoading(false);
    }
  }, [deviceId, keyType, attributeScope]);

  useEffect(() => {
    if (open) fetchKeys();
  }, [open, fetchKeys]);

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
    <div ref={containerRef} className="relative">
      <div className="flex items-center gap-1">
        <input
          type="text"
          className={inputCls}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder || (keyType === 'telemetry' ? 'e.g. temperature' : 'e.g. firmwareVersion')}
        />
        <button
          type="button"
          onClick={() => setOpen(!open)}
          disabled={!deviceId}
          className={`px-1.5 py-1 text-xs border rounded transition-colors flex-shrink-0 ${
            deviceId
              ? 'border-gray-300 text-gray-600 hover:bg-gray-100 cursor-pointer'
              : 'border-gray-200 text-gray-300 cursor-not-allowed'
          }`}
          title={deviceId ? 'Browse available keys' : 'Select a device first'}
        >
          ▼
        </button>
      </div>

      {open && deviceId && (
        <div className="absolute z-50 mt-1 w-full bg-white border border-gray-200 rounded-md shadow-lg max-h-48 overflow-hidden">
          <div className="max-h-48 overflow-y-auto">
            {loading ? (
              <div className="px-3 py-2 text-[10px] text-gray-500 text-center">Loading keys...</div>
            ) : keys.length === 0 ? (
              <div className="px-3 py-2 text-[10px] text-gray-500 text-center">No keys found</div>
            ) : (
              keys.map((key) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => { onChange(key); setOpen(false); }}
                  className={`w-full text-left px-3 py-1.5 text-xs hover:bg-blue-50 transition-colors font-mono ${
                    key === value ? 'bg-blue-50 text-blue-700 font-medium' : 'text-gray-700'
                  }`}
                >
                  {key}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

/* ================================================================
   Generic Actions Panel (existing editor for non-control widgets)
   ================================================================ */

const EVENT_TYPES: { value: EventType; label: string }[] = [
  { value: 'onClick', label: '🖱️ Click' },
  { value: 'onDoubleClick', label: '🖱️🖱️ Double Click' },
  { value: 'onMouseEnter', label: '➡️ Mouse Enter' },
  { value: 'onMouseLeave', label: '⬅️ Mouse Leave' },
  { value: 'onChange', label: '🔄 Value Change' },
  { value: 'onDataChange', label: '📡 Data Update' },
  { value: 'onAlarm', label: '🚨 Alarm' },
  { value: 'onTimer', label: '⏲️ Timer' },
  { value: 'onRpcResponse', label: '📥 RPC Response' },
  { value: 'onConnectionStatus', label: '🔌 Connection' },
  { value: 'onToggle', label: '🔀 Toggle' },
  { value: 'onTurnOn', label: '✅ Turn On' },
  { value: 'onTurnOff', label: '❌ Turn Off' },
];

const ACTION_TYPES: { value: ActionType; label: string; color: string }[] = [
  { value: 'rpcCall', label: '🔌 RPC Call', color: 'text-purple-700' },
  { value: 'updateAttribute', label: '📋 Update Attribute', color: 'text-green-700' },
  { value: 'sendTelemetry', label: '📡 Send Telemetry', color: 'text-blue-700' },
  { value: 'navigate', label: '🔗 Navigate', color: 'text-indigo-700' },
  { value: 'openDashboard', label: '📊 Open Dashboard', color: 'text-cyan-700' },
  { value: 'showDialog', label: '💬 Show Dialog', color: 'text-amber-700' },
  { value: 'showNotification', label: '🔔 Notification', color: 'text-yellow-700' },
  { value: 'setVariable', label: '📝 Set Variable', color: 'text-pink-700' },
  { value: 'triggerAlarm', label: '🚨 Trigger Alarm', color: 'text-red-700' },
  { value: 'clearAlarm', label: '✅ Clear Alarm', color: 'text-emerald-700' },
  { value: 'custom', label: '🧩 Custom Script', color: 'text-gray-700' },
];

const GenericActionsPanel: React.FC<ActionsTabProps> = ({ widget, onUpdate }) => {
  const actions: WidgetAction[] = widget.actions ?? [];
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const addAction = () => {
    const newAction: WidgetAction = {
      id: crypto.randomUUID(),
      type: 'rpcCall',
      trigger: 'onClick',
      enabled: true,
      name: `Action ${actions.length + 1}`,
      parameters: {},
    };
    onUpdate({ actions: [...actions, newAction] });
    setExpandedId(newAction.id);
  };

  const updateAction = (id: string, updates: Partial<WidgetAction>) => {
    onUpdate({
      actions: actions.map((a) => (a.id === id ? { ...a, ...updates } : a)),
    });
  };

  const removeAction = (id: string) => {
    onUpdate({ actions: actions.filter((a) => a.id !== id) });
    if (expandedId === id) setExpandedId(null);
  };

  const duplicateAction = (id: string) => {
    const orig = actions.find((a) => a.id === id);
    if (!orig) return;
    const dup: WidgetAction = { ...orig, id: crypto.randomUUID(), name: `${orig.name || 'Action'} (Copy)` };
    onUpdate({ actions: [...actions, dup] });
    setExpandedId(dup.id);
  };

  return (
    <div className="p-3 space-y-3">
      <button onClick={addAction} className={btnSmCls + ' w-full border-blue-300 text-blue-700 hover:bg-blue-50'}>
        + Add Action
      </button>

      {actions.length === 0 ? (
        <div className="text-center py-6">
          <p className="text-xs text-gray-500">No actions configured</p>
          <p className="text-[10px] text-gray-400 mt-1">Actions connect widget events to ThingsBoard operations</p>
        </div>
      ) : (
        <div className="space-y-2">
          {actions.map((action, index) => (
            <ActionEditor
              key={action.id}
              action={action}
              index={index}
              expanded={expandedId === action.id}
              onToggle={() => setExpandedId(expandedId === action.id ? null : action.id)}
              onUpdate={(updates) => updateAction(action.id, updates)}
              onRemove={() => removeAction(action.id)}
              onDuplicate={() => duplicateAction(action.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
};

/* ────── Single Action Editor ────── */

const ActionEditor: React.FC<{
  action: WidgetAction;
  index: number;
  expanded: boolean;
  onToggle: () => void;
  onUpdate: (updates: Partial<WidgetAction>) => void;
  onRemove: () => void;
  onDuplicate: () => void;
}> = ({ action, index, expanded, onToggle, onUpdate, onRemove, onDuplicate }) => {
  const params = action.parameters || {};
  const setParam = (key: string, value: any) => {
    onUpdate({ parameters: { ...params, [key]: value } });
  };

  return (
    <div className={`border rounded-md overflow-hidden ${action.enabled ? 'border-gray-200' : 'border-gray-200 opacity-60'}`}>
      {/* Header */}
      <div className="flex items-center justify-between px-2 py-1.5 cursor-pointer hover:bg-gray-50 bg-gray-50/70" onClick={onToggle}>
        <div className="flex items-center gap-2 min-w-0">
          <input type="checkbox" className="rounded border-gray-300 text-blue-600 h-3 w-3" checked={action.enabled} onClick={(e) => e.stopPropagation()} onChange={(e) => onUpdate({ enabled: e.target.checked })} />
          <span className="text-xs font-medium text-gray-800 truncate">{action.name || `Action ${index + 1}`}</span>
        </div>
        <div className="flex items-center gap-1 flex-shrink-0">
          <button onClick={(e) => { e.stopPropagation(); onDuplicate(); }} className="text-gray-400 hover:text-blue-500 p-0.5 text-[10px]" title="Duplicate">📋</button>
          <button onClick={(e) => { e.stopPropagation(); onRemove(); }} className="text-gray-400 hover:text-red-500 p-0.5 text-[10px]" title="Remove">✕</button>
          <span className="text-gray-400 text-[10px]">{expanded ? '▼' : '▶'}</span>
        </div>
      </div>

      {expanded && (
        <div className="px-3 py-2 space-y-2 bg-white border-t border-gray-100">
          <Field label="Name">
            <input className={inputCls} value={action.name || ''} onChange={(e) => onUpdate({ name: e.target.value })} />
          </Field>

          <Field label="Trigger Event">
            <select className={selectCls} value={action.trigger} onChange={(e) => onUpdate({ trigger: e.target.value as EventType })}>
              {EVENT_TYPES.map((et) => <option key={et.value} value={et.value}>{et.label}</option>)}
            </select>
          </Field>

          <Field label="Action Type">
            <select className={selectCls} value={action.type} onChange={(e) => onUpdate({ type: e.target.value as ActionType })}>
              {ACTION_TYPES.map((at) => <option key={at.value} value={at.value}>{at.label}</option>)}
            </select>
          </Field>

          {/* Action-type specific parameters */}
          {action.type === 'rpcCall' && (
            <div className="border-t border-gray-100 pt-2 space-y-2">
              <p className="text-[10px] font-semibold text-purple-600 uppercase">🔌 RPC Call Settings</p>
              <Field label="Device ID"><input className={inputCls} value={params.deviceId || ''} placeholder="Target device UUID" onChange={(e) => setParam('deviceId', e.target.value)} /></Field>
              <Field label="Method"><input className={inputCls} value={params.method || ''} placeholder="e.g. setValue, toggleRelay" onChange={(e) => setParam('method', e.target.value)} /></Field>
              <Field label="Parameters (JSON)">
                <textarea className={inputCls + ' min-h-[40px] resize-y font-mono'} value={typeof params.params === 'string' ? params.params : JSON.stringify(params.params ?? {}, null, 2)} placeholder='{"pin": 1, "value": true}' onChange={(e) => { try { setParam('params', JSON.parse(e.target.value)); } catch { setParam('params', e.target.value); } }} />
              </Field>
              <Field label="Direction">
                <select className={selectCls} value={params.rpcOneWay ? 'oneway' : 'twoway'} onChange={(e) => setParam('rpcOneWay', e.target.value === 'oneway')}>
                  <option value="twoway">Two-way (response)</option>
                  <option value="oneway">One-way (fire & forget)</option>
                </select>
              </Field>
              <Field label="Timeout (ms)">
                <input type="number" className={numCls + ' w-full'} value={params.rpcTimeout ?? 5000} min={100} onChange={(e) => setParam('rpcTimeout', Number(e.target.value))} />
              </Field>
              <label className="flex items-center gap-2">
                <input type="checkbox" className="rounded border-gray-300 text-blue-600 h-3 w-3" checked={params.rpcPersistent ?? false} onChange={(e) => setParam('rpcPersistent', e.target.checked)} />
                <span className="text-xs text-gray-700">Persistent RPC</span>
              </label>
            </div>
          )}

          {action.type === 'updateAttribute' && (
            <div className="border-t border-gray-100 pt-2 space-y-2">
              <p className="text-[10px] font-semibold text-green-600 uppercase">📋 Attribute Update</p>
              <Field label="Device ID"><input className={inputCls} value={params.deviceId || ''} placeholder="Device UUID" onChange={(e) => setParam('deviceId', e.target.value)} /></Field>
              <Field label="Scope">
                <select className={selectCls} value={params.attributeScope || 'SERVER_SCOPE'} onChange={(e) => setParam('attributeScope', e.target.value as TbAttributeScope)}>
                  <option value="SERVER_SCOPE">Server Attributes</option>
                  <option value="CLIENT_SCOPE">Client Attributes</option>
                  <option value="SHARED_SCOPE">Shared Attributes</option>
                </select>
              </Field>
              <Field label="Key"><input className={inputCls} value={params.attributeKey || ''} placeholder="e.g. setpoint, mode" onChange={(e) => setParam('attributeKey', e.target.value)} /></Field>
              <Field label="Value"><input className={inputCls} value={params.attributeValue ?? ''} placeholder="Value or expression" onChange={(e) => setParam('attributeValue', e.target.value)} /></Field>
            </div>
          )}

          {action.type === 'navigate' && (
            <div className="border-t border-gray-100 pt-2 space-y-2">
              <p className="text-[10px] font-semibold text-indigo-600 uppercase">🔗 Navigation</p>
              <Field label="URL"><input className={inputCls} value={params.url || ''} placeholder="https://... or /path" onChange={(e) => setParam('url', e.target.value)} /></Field>
              <label className="flex items-center gap-2">
                <input type="checkbox" className="rounded border-gray-300 text-blue-600 h-3 w-3" checked={params.openInNewTab ?? false} onChange={(e) => setParam('openInNewTab', e.target.checked)} />
                <span className="text-xs text-gray-700">Open in new tab</span>
              </label>
            </div>
          )}

          {action.type === 'openDashboard' && (
            <div className="border-t border-gray-100 pt-2 space-y-2">
              <p className="text-[10px] font-semibold text-cyan-600 uppercase">📊 Open Dashboard</p>
              <Field label="Dashboard ID"><input className={inputCls} value={params.targetDashboard || ''} placeholder="Target dashboard UUID" onChange={(e) => setParam('targetDashboard', e.target.value)} /></Field>
            </div>
          )}

          {action.type === 'showDialog' && (
            <div className="border-t border-gray-100 pt-2 space-y-2">
              <p className="text-[10px] font-semibold text-amber-600 uppercase">💬 Dialog</p>
              <Field label="Title"><input className={inputCls} value={params.dialogTitle || ''} onChange={(e) => setParam('dialogTitle', e.target.value)} /></Field>
              <Field label="Content"><textarea className={inputCls + ' min-h-[40px] resize-y'} value={params.dialogContent || ''} onChange={(e) => setParam('dialogContent', e.target.value)} /></Field>
              <Field label="Type">
                <select className={selectCls} value={params.dialogType || 'info'} onChange={(e) => setParam('dialogType', e.target.value)}>
                  <option value="info">ℹ️ Info</option><option value="warning">⚠️ Warning</option>
                  <option value="error">❌ Error</option><option value="confirm">❓ Confirm</option>
                </select>
              </Field>
            </div>
          )}

          {action.type === 'showNotification' && (
            <div className="border-t border-gray-100 pt-2 space-y-2">
              <p className="text-[10px] font-semibold text-yellow-600 uppercase">🔔 Notification</p>
              <Field label="Title"><input className={inputCls} value={params.notificationTitle || ''} onChange={(e) => setParam('notificationTitle', e.target.value)} /></Field>
              <Field label="Message"><input className={inputCls} value={params.notificationMessage || ''} onChange={(e) => setParam('notificationMessage', e.target.value)} /></Field>
              <Field label="Type">
                <select className={selectCls} value={params.notificationType || 'info'} onChange={(e) => setParam('notificationType', e.target.value)}>
                  <option value="success">✅ Success</option><option value="info">ℹ️ Info</option>
                  <option value="warning">⚠️ Warning</option><option value="error">❌ Error</option>
                </select>
              </Field>
            </div>
          )}

          {action.type === 'setVariable' && (
            <div className="border-t border-gray-100 pt-2 space-y-2">
              <p className="text-[10px] font-semibold text-pink-600 uppercase">📝 Set Variable</p>
              <Field label="Variable"><input className={inputCls} value={params.variableName || ''} placeholder="Variable name" onChange={(e) => setParam('variableName', e.target.value)} /></Field>
              <Field label="Value"><input className={inputCls} value={params.variableValue ?? ''} placeholder="Value or expression" onChange={(e) => setParam('variableValue', e.target.value)} /></Field>
            </div>
          )}

          {action.type === 'triggerAlarm' && (
            <div className="border-t border-gray-100 pt-2 space-y-2">
              <p className="text-[10px] font-semibold text-red-600 uppercase">🚨 Trigger Alarm</p>
              <Field label="Alarm Type"><input className={inputCls} value={params.alarmType || ''} placeholder="e.g. HighTemperature" onChange={(e) => setParam('alarmType', e.target.value)} /></Field>
              <Field label="Severity">
                <select className={selectCls} value={params.alarmSeverity || 'WARNING'} onChange={(e) => setParam('alarmSeverity', e.target.value as TbAlarmSeverity)}>
                  <option value="CRITICAL">🔴 Critical</option><option value="MAJOR">🟠 Major</option>
                  <option value="MINOR">🟡 Minor</option><option value="WARNING">🟢 Warning</option>
                  <option value="INDETERMINATE">⚪ Indeterminate</option>
                </select>
              </Field>
              <Field label="Details"><input className={inputCls} value={params.alarmDetails || ''} onChange={(e) => setParam('alarmDetails', e.target.value)} /></Field>
            </div>
          )}

          {action.type === 'custom' && (
            <div className="border-t border-gray-100 pt-2 space-y-2">
              <p className="text-[10px] font-semibold text-gray-600 uppercase">🧩 Custom Script</p>
              <Field label="JavaScript">
                <textarea
                  className={inputCls + ' min-h-[80px] resize-y font-mono'}
                  value={params.script || ''}
                  placeholder={'// Access widget data:\n// ctx.widget, ctx.value, ctx.device\n\nconsole.log("Action executed!");'}
                  onChange={(e) => setParam('script', e.target.value)}
                />
              </Field>
            </div>
          )}

          {action.type === 'sendTelemetry' && (
            <div className="border-t border-gray-100 pt-2 space-y-2">
              <p className="text-[10px] font-semibold text-blue-600 uppercase">📡 Send Telemetry</p>
              <Field label="Device ID"><input className={inputCls} value={params.deviceId || ''} placeholder="Device UUID" onChange={(e) => setParam('deviceId', e.target.value)} /></Field>
              <Field label="Data (JSON)">
                <textarea className={inputCls + ' min-h-[40px] resize-y font-mono'} value={typeof params.params === 'string' ? params.params : JSON.stringify(params.params ?? {}, null, 2)} placeholder='{"temperature": 25.5}' onChange={(e) => { try { setParam('params', JSON.parse(e.target.value)); } catch { setParam('params', e.target.value); } }} />
              </Field>
            </div>
          )}

          {/* Conditions */}
          <Section title="Conditions" defaultOpen={false}>
            <p className="text-[10px] text-gray-500 italic">Run this action only when conditions are met</p>
            <ConditionsEditor
              conditions={action.conditions ?? []}
              onChange={(conditions) => onUpdate({ conditions })}
            />
          </Section>
        </div>
      )}
    </div>
  );
};

/* ────── Conditions Editor ────── */

const ConditionsEditor: React.FC<{
  conditions: NonNullable<WidgetAction['conditions']>;
  onChange: (conditions: NonNullable<WidgetAction['conditions']>) => void;
}> = ({ conditions, onChange }) => {
  const addCondition = () => {
    onChange([...conditions, { field: '', operator: 'eq', value: '' }]);
  };
  const updateCondition = (index: number, updates: any) => {
    onChange(conditions.map((c, i) => (i === index ? { ...c, ...updates } : c)));
  };
  const removeCondition = (index: number) => {
    onChange(conditions.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-1.5">
      {conditions.map((cond, idx) => (
        <div key={idx} className="flex items-center gap-1 bg-gray-50 p-1.5 rounded">
          <input className="text-[10px] border rounded px-1 py-0.5 flex-1 min-w-0" value={cond.field} placeholder="field" onChange={(e) => updateCondition(idx, { field: e.target.value })} />
          <select className="text-[10px] border rounded px-1 py-0.5 w-10" value={cond.operator} onChange={(e) => updateCondition(idx, { operator: e.target.value })}>
            <option value="eq">=</option><option value="ne">≠</option><option value="gt">&gt;</option>
            <option value="gte">≥</option><option value="lt">&lt;</option><option value="lte">≤</option>
            <option value="contains">∋</option>
          </select>
          <input className="text-[10px] border rounded px-1 py-0.5 w-16" value={cond.value} placeholder="value" onChange={(e) => updateCondition(idx, { value: e.target.value })} />
          <button onClick={() => removeCondition(idx)} className="text-gray-400 hover:text-red-500 text-[10px]">✕</button>
        </div>
      ))}
      <button onClick={addCondition} className="text-[10px] text-blue-600 hover:text-blue-800 font-medium">+ Add Condition</button>
    </div>
  );
};
