'use client';

import React, { useState } from 'react';
import { Section, Field, inputCls, selectCls, numCls, btnSmCls } from '../PropertyPanel';
import type { Widget, WidgetAction, EventType, ActionType, TbAttributeScope, TbAlarmSeverity } from '../../types';

interface ActionsTabProps {
  widget: Widget;
  onUpdate: (updates: Partial<Widget>) => void;
}

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

export const ActionsTab: React.FC<ActionsTabProps> = ({ widget, onUpdate }) => {
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
