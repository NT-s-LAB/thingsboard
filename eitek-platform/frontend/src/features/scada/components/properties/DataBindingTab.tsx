'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Section, Field, inputCls, selectCls, numCls, checkCls, btnSmCls } from '../PropertyPanel';
import type { Widget, DataBinding, DataBindingType, TbEntityType, TbAttributeScope, TbAggregation } from '../../types';
import { deviceService } from '@/features/devices/services/deviceService';
import type { Device } from '@/features/devices/types';

interface DataBindingTabProps {
  widget: Widget;
  onUpdate: (updates: Partial<Widget>) => void;
}

export const DataBindingTab: React.FC<DataBindingTabProps> = ({ widget, onUpdate }) => {
  const bindings: DataBinding[] = widget.dataBindings ?? [];
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const addBinding = (type: DataBindingType = 'telemetry') => {
    const newBinding: DataBinding = {
      id: crypto.randomUUID(),
      type,
      label: `Binding ${bindings.length + 1}`,
      entityType: 'DEVICE',
      entityId: '',
      entityName: '',
      telemetryKey: '',
      defaultValue: 0,
      thresholds: [],
    };
    onUpdate({ dataBindings: [...bindings, newBinding] });
    setExpandedId(newBinding.id);
  };

  const updateBinding = (id: string, updates: Partial<DataBinding>) => {
    onUpdate({
      dataBindings: bindings.map((b) => (b.id === id ? { ...b, ...updates } : b)),
    });
  };

  const removeBinding = (id: string) => {
    onUpdate({ dataBindings: bindings.filter((b) => b.id !== id) });
    if (expandedId === id) setExpandedId(null);
  };

  const addThreshold = (bindingId: string) => {
    const binding = bindings.find((b) => b.id === bindingId);
    if (!binding) return;
    const threshold = {
      id: crypto.randomUUID(),
      operator: 'gte' as const,
      value: 0,
      color: '#EF4444',
    };
    updateBinding(bindingId, { thresholds: [...(binding.thresholds ?? []), threshold] });
  };

  const updateThreshold = (bindingId: string, thresholdId: string, updates: any) => {
    const binding = bindings.find((b) => b.id === bindingId);
    if (!binding) return;
    updateBinding(bindingId, {
      thresholds: (binding.thresholds ?? []).map((t) => (t.id === thresholdId ? { ...t, ...updates } : t)),
    });
  };

  const removeThreshold = (bindingId: string, thresholdId: string) => {
    const binding = bindings.find((b) => b.id === bindingId);
    if (!binding) return;
    updateBinding(bindingId, {
      thresholds: (binding.thresholds ?? []).filter((t) => t.id !== thresholdId),
    });
  };

  return (
    <div className="p-3 space-y-3">
      {/* Quick add buttons */}
      <div className="flex flex-wrap gap-1">
        <button onClick={() => addBinding('telemetry')} className={btnSmCls + ' border-blue-300 text-blue-700 hover:bg-blue-50'}>
          + Telemetry
        </button>
        <button onClick={() => addBinding('attribute')} className={btnSmCls + ' border-green-300 text-green-700 hover:bg-green-50'}>
          + Attribute
        </button>
        <button onClick={() => addBinding('rpc')} className={btnSmCls + ' border-purple-300 text-purple-700 hover:bg-purple-50'}>
          + RPC
        </button>
        <button onClick={() => addBinding('static')} className={btnSmCls + ' border-gray-300 text-gray-700 hover:bg-gray-50'}>
          + Static
        </button>
        <button onClick={() => addBinding('calculation')} className={btnSmCls + ' border-orange-300 text-orange-700 hover:bg-orange-50'}>
          + Calculation
        </button>
        <button onClick={() => addBinding('function')} className={btnSmCls + ' border-pink-300 text-pink-700 hover:bg-pink-50'}>
          + Function
        </button>
      </div>

      {bindings.length === 0 ? (
        <div className="text-center py-6">
          <p className="text-xs text-gray-500">No data bindings configured</p>
          <p className="text-[10px] text-gray-400 mt-1">Add a binding to connect widget to device data</p>
        </div>
      ) : (
        <div className="space-y-2">
          {bindings.map((binding, index) => (
            <BindingEditor
              key={binding.id}
              binding={binding}
              index={index}
              expanded={expandedId === binding.id}
              onToggle={() => setExpandedId(expandedId === binding.id ? null : binding.id)}
              onUpdate={(updates) => updateBinding(binding.id, updates)}
              onRemove={() => removeBinding(binding.id)}
              onAddThreshold={() => addThreshold(binding.id)}
              onUpdateThreshold={(tid, u) => updateThreshold(binding.id, tid, u)}
              onRemoveThreshold={(tid) => removeThreshold(binding.id, tid)}
            />
          ))}
        </div>
      )}

      {/* ThingsBoard API Info */}
      <Section title="ThingsBoard API Reference" defaultOpen={false}>
        <div className="space-y-2 text-[10px] text-gray-600">
          <div className="bg-blue-50 p-2 rounded">
            <p className="font-bold text-blue-700 mb-1">📡 Telemetry</p>
            <p>GET /api/plugins/telemetry/DEVICE/&#123;deviceId&#125;/values/timeseries?keys=&#123;key&#125;</p>
            <p className="mt-1">WS: /api/ws/plugins/telemetry</p>
          </div>
          <div className="bg-green-50 p-2 rounded">
            <p className="font-bold text-green-700 mb-1">📋 Attributes</p>
            <p>GET /api/plugins/telemetry/DEVICE/&#123;deviceId&#125;/values/attributes/&#123;scope&#125;</p>
            <p>POST /api/plugins/telemetry/DEVICE/&#123;deviceId&#125;/attributes/&#123;scope&#125;</p>
          </div>
          <div className="bg-purple-50 p-2 rounded">
            <p className="font-bold text-purple-700 mb-1">🔌 RPC</p>
            <p>POST /api/rpc/oneway/&#123;deviceId&#125;</p>
            <p>POST /api/rpc/twoway/&#123;deviceId&#125;</p>
            <p className="mt-1">Body: &#123; &quot;method&quot;: &quot;...&quot;, &quot;params&quot;: &#123;...&#125; &#125;</p>
          </div>
        </div>
      </Section>
    </div>
  );
};

/* ────── Single Binding Editor ────── */

const TYPE_COLORS: Record<string, string> = {
  telemetry: 'border-l-blue-500 bg-blue-50/30',
  attribute: 'border-l-green-500 bg-green-50/30',
  rpc: 'border-l-purple-500 bg-purple-50/30',
  static: 'border-l-gray-400 bg-gray-50/30',
  calculation: 'border-l-orange-500 bg-orange-50/30',
  function: 'border-l-pink-500 bg-pink-50/30',
};

const TYPE_LABELS: Record<string, string> = {
  telemetry: '📡 Telemetry',
  attribute: '📋 Attribute',
  rpc: '🔌 RPC',
  static: '📌 Static',
  calculation: '🧮 Calculation',
  function: '𝑓(x) Function',
};

/* ────── Device Search Dropdown ────── */
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
    if (open) {
      fetchDevices(search);
    }
  }, [open, search, fetchDevices]);

  // Close on outside click
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
                  onClick={() => {
                    onSelect(device);
                    setOpen(false);
                    setSearch('');
                  }}
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

/* ────── Telemetry/Attribute Key Dropdown ────── */
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

  // Close on outside click
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
                  onClick={() => {
                    onChange(key);
                    setOpen(false);
                  }}
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

const BindingEditor: React.FC<{
  binding: DataBinding;
  index: number;
  expanded: boolean;
  onToggle: () => void;
  onUpdate: (updates: Partial<DataBinding>) => void;
  onRemove: () => void;
  onAddThreshold: () => void;
  onUpdateThreshold: (id: string, updates: any) => void;
  onRemoveThreshold: (id: string) => void;
}> = ({ binding, index, expanded, onToggle, onUpdate, onRemove, onAddThreshold, onUpdateThreshold, onRemoveThreshold }) => {
  return (
    <div className={`border-l-4 border rounded-r-md overflow-hidden ${TYPE_COLORS[binding.type] || 'border-l-gray-400'}`}>
      {/* Header */}
      <div className="flex items-center justify-between px-2 py-1.5 cursor-pointer hover:bg-gray-50/50" onClick={onToggle}>
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-[10px] font-mono text-gray-400">#{index + 1}</span>
          <span className="text-xs font-medium text-gray-800 truncate">{binding.label || `Binding ${index + 1}`}</span>
          <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-white border text-gray-500">{TYPE_LABELS[binding.type] || binding.type}</span>
        </div>
        <div className="flex items-center gap-1 flex-shrink-0">
          <button onClick={(e) => { e.stopPropagation(); onRemove(); }} className="text-gray-400 hover:text-red-500 p-0.5 text-[10px]">✕</button>
          <span className="text-gray-400 text-[10px]">{expanded ? '▼' : '▶'}</span>
        </div>
      </div>

      {/* Body */}
      {expanded && (
        <div className="px-3 py-2 space-y-2 bg-white border-t border-gray-100">
          <Field label="Label">
            <input className={inputCls} value={binding.label || ''} placeholder="Binding name" onChange={(e) => onUpdate({ label: e.target.value })} />
          </Field>

          <Field label="Type">
            <select className={selectCls} value={binding.type} onChange={(e) => onUpdate({ type: e.target.value as DataBindingType })}>
              <option value="telemetry">📡 Telemetry</option>
              <option value="attribute">📋 Attribute</option>
              <option value="rpc">🔌 RPC</option>
              <option value="static">📌 Static Value</option>
              <option value="calculation">🧮 Calculation</option>
              <option value="function">𝑓(x) Function</option>
            </select>
          </Field>

          {/* Entity selection (for telemetry/attribute/rpc) */}
          {['telemetry', 'attribute', 'rpc'].includes(binding.type) && (
            <>
              <div className="border-t border-gray-100 pt-2 mt-2">
                <p className="text-[10px] font-semibold text-gray-500 uppercase mb-1.5">ThingsBoard Entity</p>
              </div>
              <Field label="Entity Type">
                <select className={selectCls} value={binding.entityType || 'DEVICE'} onChange={(e) => onUpdate({ entityType: e.target.value as TbEntityType, entityId: '', entityName: '' })}>
                  <option value="DEVICE">Device</option>
                  <option value="ASSET">Asset</option>
                  <option value="ENTITY_VIEW">Entity View</option>
                  <option value="CUSTOMER">Customer</option>
                  <option value="DASHBOARD">Dashboard</option>
                </select>
              </Field>
              {(binding.entityType || 'DEVICE') === 'DEVICE' ? (
                <Field label="Device">
                  <DeviceSearchDropdown
                    selectedDeviceId={binding.entityId}
                    selectedDeviceName={binding.entityName}
                    onSelect={(device) => onUpdate({
                      entityId: device.id,
                      entityName: device.name,
                    })}
                  />
                </Field>
              ) : (
                <>
                  <Field label="Entity ID">
                    <input className={inputCls} value={binding.entityId || ''} placeholder="Asset/Entity UUID" onChange={(e) => onUpdate({ entityId: e.target.value })} />
                  </Field>
                  <Field label="Entity Name">
                    <input className={inputCls} value={binding.entityName || ''} placeholder="Display name (optional)" onChange={(e) => onUpdate({ entityName: e.target.value })} />
                  </Field>
                </>
              )}
            </>
          )}

          {/* Telemetry-specific */}
          {binding.type === 'telemetry' && (
            <>
              <div className="border-t border-gray-100 pt-2 mt-2">
                <p className="text-[10px] font-semibold text-blue-600 uppercase mb-1.5">📡 Telemetry Configuration</p>
              </div>
              <Field label="Telemetry Key">
                <KeyDropdown
                  deviceId={binding.entityId}
                  value={binding.telemetryKey || ''}
                  onChange={(key) => onUpdate({ telemetryKey: key })}
                  keyType="telemetry"
                  placeholder="e.g. temperature, humidity, pressure"
                />
              </Field>
              <Field label="Aggregation">
                <select className={selectCls} value={binding.aggregation || 'NONE'} onChange={(e) => onUpdate({ aggregation: e.target.value as TbAggregation })}>
                  <option value="NONE">None (Latest)</option>
                  <option value="AVG">Average</option>
                  <option value="MIN">Minimum</option>
                  <option value="MAX">Maximum</option>
                  <option value="SUM">Sum</option>
                  <option value="COUNT">Count</option>
                </select>
              </Field>
              <Field label="Time Window">
                <select className={selectCls} value={binding.timeWindow?.type || 'realtime'} onChange={(e) => onUpdate({ timeWindow: { ...binding.timeWindow, type: e.target.value as any } })}>
                  <option value="realtime">Realtime</option>
                  <option value="history">Historical</option>
                </select>
              </Field>
              {binding.timeWindow?.type === 'realtime' && (
                <Field label="Window (ms)">
                  <input type="number" className={numCls + ' w-full'} value={binding.timeWindow?.realtimeMs ?? 60000} min={1000} step={1000} onChange={(e) => onUpdate({ timeWindow: { ...binding.timeWindow, type: 'realtime', realtimeMs: Number(e.target.value) } })} />
                </Field>
              )}
              <Field label="Update Interval (ms)">
                <input type="number" className={numCls + ' w-full'} value={binding.updateInterval ?? 1000} min={100} step={100} onChange={(e) => onUpdate({ updateInterval: Number(e.target.value) })} />
              </Field>
            </>
          )}

          {/* Attribute-specific */}
          {binding.type === 'attribute' && (
            <>
              <div className="border-t border-gray-100 pt-2 mt-2">
                <p className="text-[10px] font-semibold text-green-600 uppercase mb-1.5">📋 Attribute Configuration</p>
              </div>
              <Field label="Scope">
                <select className={selectCls} value={binding.attributeScope || 'SERVER_SCOPE'} onChange={(e) => onUpdate({ attributeScope: e.target.value as TbAttributeScope })}>
                  <option value="SERVER_SCOPE">Server Attributes</option>
                  <option value="CLIENT_SCOPE">Client Attributes</option>
                  <option value="SHARED_SCOPE">Shared Attributes</option>
                </select>
              </Field>
              <Field label="Attribute Key">
                <KeyDropdown
                  deviceId={binding.entityId}
                  value={binding.attributeKey || ''}
                  onChange={(key) => onUpdate({ attributeKey: key })}
                  keyType="attribute"
                  attributeScope={binding.attributeScope || 'SERVER_SCOPE'}
                  placeholder="e.g. firmwareVersion, config"
                />
              </Field>
            </>
          )}

          {/* RPC-specific */}
          {binding.type === 'rpc' && (
            <>
              <div className="border-t border-gray-100 pt-2 mt-2">
                <p className="text-[10px] font-semibold text-purple-600 uppercase mb-1.5">🔌 RPC Configuration</p>
              </div>
              <Field label="Method Name">
                <input className={inputCls} value={binding.rpcConfig?.method || ''} placeholder="e.g. setValue, getStatus, toggleRelay" onChange={(e) => onUpdate({ rpcConfig: { ...binding.rpcConfig, method: e.target.value, oneWay: binding.rpcConfig?.oneWay ?? false } })} />
              </Field>
              <Field label="Direction">
                <select className={selectCls} value={binding.rpcConfig?.oneWay ? 'oneway' : 'twoway'} onChange={(e) => onUpdate({ rpcConfig: { ...binding.rpcConfig, method: binding.rpcConfig?.method || '', oneWay: e.target.value === 'oneway' } })}>
                  <option value="twoway">Two-way (request/response)</option>
                  <option value="oneway">One-way (fire & forget)</option>
                </select>
              </Field>
              <Field label="Timeout (ms)">
                <input type="number" className={numCls + ' w-full'} value={binding.rpcConfig?.timeout ?? 5000} min={100} step={100} onChange={(e) => onUpdate({ rpcConfig: { ...binding.rpcConfig, method: binding.rpcConfig?.method || '', oneWay: binding.rpcConfig?.oneWay ?? false, timeout: Number(e.target.value) } })} />
              </Field>
              <Field label="Parameters (JSON)">
                <textarea
                  className={inputCls + ' min-h-[50px] resize-y font-mono'}
                  value={JSON.stringify(binding.rpcConfig?.params ?? {}, null, 2)}
                  placeholder='{"key": "value"}'
                  onChange={(e) => {
                    try {
                      const params = JSON.parse(e.target.value);
                      onUpdate({ rpcConfig: { ...binding.rpcConfig, method: binding.rpcConfig?.method || '', oneWay: binding.rpcConfig?.oneWay ?? false, params } });
                    } catch { /* ignore parse errors while typing */ }
                  }}
                />
              </Field>
              <label className="flex items-center gap-2">
                <input type="checkbox" className={checkCls} checked={binding.rpcConfig?.persistent ?? false} onChange={(e) => onUpdate({ rpcConfig: { ...binding.rpcConfig, method: binding.rpcConfig?.method || '', oneWay: binding.rpcConfig?.oneWay ?? false, persistent: e.target.checked } })} />
                <span className="text-xs text-gray-700">Persistent RPC</span>
              </label>
            </>
          )}

          {/* Static value */}
          {binding.type === 'static' && (
            <Field label="Static Value">
              <input className={inputCls} value={binding.staticValue ?? ''} onChange={(e) => onUpdate({ staticValue: e.target.value })} />
            </Field>
          )}

          {/* Calculation */}
          {binding.type === 'calculation' && (
            <Field label="Expression">
              <textarea className={inputCls + ' min-h-[50px] resize-y font-mono'} value={binding.calculation || ''} placeholder="e.g. ${temperature} * 1.8 + 32" onChange={(e) => onUpdate({ calculation: e.target.value })} />
            </Field>
          )}

          {/* Function */}
          {binding.type === 'function' && (
            <Field label="Post-processing Function">
              <textarea
                className={inputCls + ' min-h-[60px] resize-y font-mono'}
                value={binding.postProcessingFn || ''}
                placeholder={'// Transform the value\nreturn value * 1.8 + 32;'}
                onChange={(e) => onUpdate({ postProcessingFn: e.target.value })}
              />
            </Field>
          )}

          {/* Format section */}
          <div className="border-t border-gray-100 pt-2 mt-2">
            <p className="text-[10px] font-semibold text-gray-500 uppercase mb-1.5">Value Format</p>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <Field label="Decimals">
              <input type="number" className={numCls + ' w-full'} value={binding.format?.decimals ?? 2} min={0} max={10} onChange={(e) => onUpdate({ format: { ...binding.format, type: binding.format?.type || 'number', decimals: Number(e.target.value) } })} />
            </Field>
            <Field label="Unit">
              <input className={inputCls} value={binding.format?.unit || ''} placeholder="°C, %, kPa" onChange={(e) => onUpdate({ format: { ...binding.format, type: binding.format?.type || 'number', unit: e.target.value } })} />
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <Field label="Prefix">
              <input className={inputCls} value={binding.format?.prefix || ''} onChange={(e) => onUpdate({ format: { ...binding.format, type: binding.format?.type || 'number', prefix: e.target.value } })} />
            </Field>
            <Field label="Suffix">
              <input className={inputCls} value={binding.format?.suffix || ''} onChange={(e) => onUpdate({ format: { ...binding.format, type: binding.format?.type || 'number', suffix: e.target.value } })} />
            </Field>
          </div>
          <Field label="Default Value">
            <input className={inputCls} value={binding.defaultValue ?? ''} onChange={(e) => onUpdate({ defaultValue: e.target.value })} />
          </Field>

          {/* Thresholds / Conditional Styling */}
          <div className="border-t border-gray-100 pt-2 mt-2">
            <div className="flex items-center justify-between mb-1.5">
              <p className="text-[10px] font-semibold text-gray-500 uppercase">Thresholds</p>
              <button onClick={onAddThreshold} className="text-[10px] text-blue-600 hover:text-blue-800 font-medium">+ Add</button>
            </div>
          </div>
          {(binding.thresholds ?? []).length === 0 ? (
            <p className="text-[10px] text-gray-400 italic">No thresholds defined</p>
          ) : (
            <div className="space-y-1.5">
              {(binding.thresholds ?? []).map((threshold) => (
                <div key={threshold.id} className="flex items-center gap-1.5 bg-gray-50 p-1.5 rounded">
                  <select className="text-[10px] border rounded px-1 py-0.5 w-12" value={threshold.operator} onChange={(e) => onUpdateThreshold(threshold.id, { operator: e.target.value })}>
                    <option value="lt">&lt;</option><option value="lte">≤</option><option value="eq">=</option>
                    <option value="gte">≥</option><option value="gt">&gt;</option><option value="ne">≠</option>
                  </select>
                  <input type="number" className="text-[10px] border rounded px-1 py-0.5 w-14 text-center" value={threshold.value} onChange={(e) => onUpdateThreshold(threshold.id, { value: Number(e.target.value) })} />
                  <input type="color" className="w-5 h-5 rounded border cursor-pointer" value={threshold.color || '#EF4444'} onChange={(e) => onUpdateThreshold(threshold.id, { color: e.target.value })} />
                  <input className="text-[10px] border rounded px-1 py-0.5 flex-1 min-w-0" value={threshold.label || ''} placeholder="Label" onChange={(e) => onUpdateThreshold(threshold.id, { label: e.target.value })} />
                  <button onClick={() => onRemoveThreshold(threshold.id)} className="text-gray-400 hover:text-red-500 text-[10px] flex-shrink-0">✕</button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
