/**
 * EventActionEditor — Professional widget event & action configuration panel.
 *
 * Shows events (onClick, onDoubleClick, etc.) for the selected widget.
 * Each event can have multiple actions, ordered and editable.
 * Actions use discriminated unions for type-safe config.
 */

'use client';

import React, { useCallback, useMemo, useState } from 'react';
import { useScadaProjectStore } from '../../stores/scadaProjectStore';
import { useScadaRuntimeStore } from '../../stores/scadaRuntimeStore';
import type {
  WidgetEvent,
  WidgetEventTrigger,
  ScadaAction,
  ActionTypeKey,
  ScadaPage,
} from '../../core/types/project.types';
import {
  ACTION_TYPES,
  WIDGET_EVENT_TRIGGERS,
  createNavigateAction,
  createGoBackAction,
  createGoHomeAction,
  createOpenPopupAction,
  createClosePopupAction,
  createRpcCallAction,
  createSetVariableAction,
  createShowNotificationAction,
} from '../../core/types/project.types';
import type { WidgetInstance } from '../../core/types';

// ─── Trigger display names ──────────────────────────────────────────────────

const TRIGGER_LABELS: Record<WidgetEventTrigger, string> = {
  onClick: 'On Click',
  onDoubleClick: 'On Double Click',
  onMouseDown: 'On Mouse Down',
  onMouseUp: 'On Mouse Up',
  onMouseEnter: 'On Mouse Enter',
  onMouseLeave: 'On Mouse Leave',
  onValueChange: 'On Value Change',
};

const ACTION_TYPE_LABELS: Record<ActionTypeKey, string> = {
  navigateToPage: 'Navigate to Page',
  goBack: 'Go Back',
  goHome: 'Go Home',
  openPopup: 'Open Popup',
  closePopup: 'Close Popup',
  rpcCall: 'RPC Call',
  setAttribute: 'Set Attribute',
  setVariable: 'Set Variable',
  showNotification: 'Show Notification',
  customScript: 'Custom Script',
};

// ─── Main Component ─────────────────────────────────────────────────────────

export const EventActionEditor: React.FC = () => {
  const project = useScadaProjectStore((s) => s.project);
  const activePageId = useScadaProjectStore((s) => s.activePageId);
  const setWidgetEvents = useScadaProjectStore((s) => s.setWidgetEvents);
  const selectedWidgetIds = useScadaRuntimeStore((s) => s.selectedWidgetIds);

  const activePage = useMemo(() => {
    if (!project || !activePageId) return null;
    return project.pages.find((p) => p.id === activePageId) ?? null;
  }, [project, activePageId]);

  // Get the selected widget (only works for single selection)
  const selectedWidget = useMemo(() => {
    if (selectedWidgetIds.length !== 1 || !activePage) return null;
    const widget = activePage.widgets.find((w) => w.id === selectedWidgetIds[0]) ?? null;
    if (widget) {
      console.log('[EventActionEditor] Selected widget:', widget.id, widget.name);
      console.log('[EventActionEditor] Widget events:', (widget as any).events);
    }
    return widget;
  }, [selectedWidgetIds, activePage]);

  // Get events from the widget (stored as a property)
  const widgetEvents: WidgetEvent[] = useMemo(() => {
    if (!selectedWidget) return [];
    return (selectedWidget as WidgetInstance & { events?: WidgetEvent[] }).events ?? [];
  }, [selectedWidget]);

  const handleUpdateEvents = useCallback((events: WidgetEvent[]) => {
    if (!selectedWidget) return;
    setWidgetEvents(selectedWidget.id, events);
  }, [selectedWidget, setWidgetEvents]);

  if (selectedWidgetIds.length === 0) {
    return (
      <div style={emptyStyle}>
        Select a widget to configure events
      </div>
    );
  }

  if (selectedWidgetIds.length > 1) {
    return (
      <div style={emptyStyle}>
        Multi-selection: events not available
      </div>
    );
  }

  if (!selectedWidget) {
    return <div style={emptyStyle}>Widget not found</div>;
  }

  const allPages = project?.pages ?? [];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, padding: 4 }}>
      <div style={{ fontSize: 11, fontWeight: 600, color: '#374151', padding: '0 4px' }}>
        Events — {selectedWidget.name}
      </div>

      {Object.values(WIDGET_EVENT_TRIGGERS).map((trigger) => (
        <EventSection
          key={trigger}
          trigger={trigger}
          events={widgetEvents}
          allPages={allPages}
          onUpdateEvents={handleUpdateEvents}
        />
      ))}
    </div>
  );
};

// ─── Event Section (one trigger) ────────────────────────────────────────────

const EventSection: React.FC<{
  trigger: WidgetEventTrigger;
  events: WidgetEvent[];
  allPages: ScadaPage[];
  onUpdateEvents: (events: WidgetEvent[]) => void;
}> = ({ trigger, events, allPages, onUpdateEvents }) => {
  const [expanded, setExpanded] = useState(false);

  const event = events.find((e) => e.trigger === trigger);
  const actions = event?.actions ?? [];
  const hasActions = actions.length > 0;

  const handleAddAction = useCallback((actionType: ActionTypeKey) => {
    const newAction = createActionByType(actionType);
    const existingEvent = events.find((e) => e.trigger === trigger);
    if (existingEvent) {
      const updated = events.map((e) =>
        e.trigger === trigger
          ? { ...e, actions: [...e.actions, newAction] }
          : e,
      );
      onUpdateEvents(updated);
    } else {
      onUpdateEvents([
        ...events,
        {
          id: `evt_${Date.now()}`,
          trigger,
          actions: [newAction],
          enabled: true,
        },
      ]);
    }
  }, [events, trigger, onUpdateEvents]);

  const handleRemoveAction = useCallback((actionId: string) => {
    const updated = events.map((e) =>
      e.trigger === trigger
        ? { ...e, actions: e.actions.filter((a) => a.id !== actionId) }
        : e,
    );
    onUpdateEvents(updated);
  }, [events, trigger, onUpdateEvents]);

  const handleUpdateAction = useCallback((actionId: string, patch: Partial<ScadaAction>) => {
    const updated = events.map((e) =>
      e.trigger === trigger
        ? {
            ...e,
            actions: e.actions.map((a) =>
              a.id === actionId ? { ...a, ...patch } as ScadaAction : a,
            ),
          }
        : e,
    );
    onUpdateEvents(updated);
  }, [events, trigger, onUpdateEvents]);

  return (
    <div style={eventSectionStyle}>
      <div
        onClick={() => setExpanded(!expanded)}
        style={eventHeaderStyle}
      >
        <span style={{ fontSize: 11, fontWeight: 500, color: '#374151' }}>
          {TRIGGER_LABELS[trigger]}
          {hasActions && (
            <span style={{ color: '#22C55E', marginLeft: 4, fontSize: 9 }}>
              ● {actions.length}
            </span>
          )}
        </span>
        <span style={{ fontSize: 10, color: '#9CA3AF' }}>
          {expanded ? '▲' : '▼'}
        </span>
      </div>

      {expanded && (
        <div style={{ padding: 6, display: 'flex', flexDirection: 'column', gap: 6 }}>
          {/* Existing actions */}
          {actions.map((action, idx) => (
            <ActionRow
              key={action.id}
              index={idx}
              action={action}
              allPages={allPages}
              onUpdate={(patch) => handleUpdateAction(action.id, patch)}
              onRemove={() => handleRemoveAction(action.id)}
            />
          ))}

          {/* Add action dropdown */}
          <AddActionButton onAdd={handleAddAction} />
        </div>
      )}
    </div>
  );
};

// ─── Single Action Row ──────────────────────────────────────────────────────

const ActionRow: React.FC<{
  index: number;
  action: ScadaAction;
  allPages: ScadaPage[];
  onUpdate: (patch: Partial<ScadaAction>) => void;
  onRemove: () => void;
}> = ({ index, action, allPages, onUpdate, onRemove }) => (
  <div style={actionRowStyle}>
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
      <span style={{ fontSize: 10, color: '#6B7280', fontWeight: 500 }}>
        #{index + 1} {ACTION_TYPE_LABELS[action.type as ActionTypeKey] ?? action.type}
      </span>
      <button onClick={onRemove} style={removeActionBtnStyle} title="Remove action">
        ×
      </button>
    </div>

    {/* Type-specific config */}
    <ActionConfigEditor action={action} allPages={allPages} onUpdate={onUpdate} />
  </div>
);

// ─── Action Config Editor (type-specific fields) ────────────────────────────

const ActionConfigEditor: React.FC<{
  action: ScadaAction;
  allPages: ScadaPage[];
  onUpdate: (patch: Partial<ScadaAction>) => void;
}> = ({ action, allPages, onUpdate }) => {
  switch (action.type) {
    case ACTION_TYPES.NAVIGATE_TO_PAGE:
      return (
        <div style={configGroupStyle}>
          <ConfigRow label="Target Page">
            <select
              value={action.targetPageId}
              onChange={(e) => onUpdate({ targetPageId: e.target.value } as Partial<ScadaAction>)}
              style={inputStyle}
            >
              <option value="">-- Select page --</option>
              {allPages
                .filter((p) => p.pageType === 'normal')
                .map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
            </select>
          </ConfigRow>
        </div>
      );

    case ACTION_TYPES.OPEN_POPUP:
      return (
        <div style={configGroupStyle}>
          <ConfigRow label="Popup Page">
            <select
              value={action.popupPageId}
              onChange={(e) => onUpdate({ popupPageId: e.target.value } as Partial<ScadaAction>)}
              style={inputStyle}
            >
              <option value="">-- Select popup --</option>
              {allPages
                .filter((p) => p.pageType === 'popup')
                .map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
            </select>
          </ConfigRow>
        </div>
      );

    case ACTION_TYPES.CLOSE_POPUP:
      return (
        <div style={configGroupStyle}>
          <ConfigRow label="Popup (optional)">
            <select
              value={action.popupPageId ?? ''}
              onChange={(e) => onUpdate({ popupPageId: e.target.value || undefined } as Partial<ScadaAction>)}
              style={inputStyle}
            >
              <option value="">(Close topmost)</option>
              {allPages
                .filter((p) => p.pageType === 'popup')
                .map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
            </select>
          </ConfigRow>
        </div>
      );

    case ACTION_TYPES.RPC_CALL:
      return (
        <div style={configGroupStyle}>
          <ConfigRow label="Device ID">
            <input
              type="text"
              value={action.deviceId}
              onChange={(e) => onUpdate({ deviceId: e.target.value } as Partial<ScadaAction>)}
              placeholder="Device ID..."
              style={inputStyle}
            />
          </ConfigRow>
          <ConfigRow label="Method">
            <input
              type="text"
              value={action.rpcMethod}
              onChange={(e) => onUpdate({ rpcMethod: e.target.value } as Partial<ScadaAction>)}
              placeholder="RPC method..."
              style={inputStyle}
            />
          </ConfigRow>
          <ConfigRow label="Params">
            <input
              type="text"
              value={action.rpcParams ? JSON.stringify(action.rpcParams) : ''}
              placeholder='{"key": "value"}'
              onChange={(e) => {
                try {
                  onUpdate({ rpcParams: JSON.parse(e.target.value) } as Partial<ScadaAction>);
                } catch { /* wait for valid JSON */ }
              }}
              style={inputStyle}
            />
          </ConfigRow>
        </div>
      );

    case ACTION_TYPES.SET_ATTRIBUTE:
      return (
        <div style={configGroupStyle}>
          <ConfigRow label="Device ID">
            <input
              type="text"
              value={action.deviceId}
              onChange={(e) => onUpdate({ deviceId: e.target.value } as Partial<ScadaAction>)}
              placeholder="Device ID..."
              style={inputStyle}
            />
          </ConfigRow>
          <ConfigRow label="Scope">
            <select
              value={action.attributeScope}
              onChange={(e) => onUpdate({ attributeScope: e.target.value } as Partial<ScadaAction>)}
              style={inputStyle}
            >
              <option value="SHARED_SCOPE">Shared</option>
              <option value="SERVER_SCOPE">Server</option>
              <option value="CLIENT_SCOPE">Client</option>
            </select>
          </ConfigRow>
          <ConfigRow label="Key">
            <input
              type="text"
              value={action.attributeKey}
              onChange={(e) => onUpdate({ attributeKey: e.target.value } as Partial<ScadaAction>)}
              placeholder="Attribute key..."
              style={inputStyle}
            />
          </ConfigRow>
          <ConfigRow label="Value">
            <input
              type="text"
              value={String(action.attributeValue ?? '')}
              onChange={(e) => onUpdate({ attributeValue: e.target.value } as Partial<ScadaAction>)}
              placeholder="Value..."
              style={inputStyle}
            />
          </ConfigRow>
        </div>
      );

    case ACTION_TYPES.SET_VARIABLE:
      return (
        <div style={configGroupStyle}>
          <ConfigRow label="Variable">
            <input
              type="text"
              value={action.variableName}
              onChange={(e) => onUpdate({ variableName: e.target.value } as Partial<ScadaAction>)}
              placeholder="Variable name..."
              style={inputStyle}
            />
          </ConfigRow>
          <ConfigRow label="Value">
            <input
              type="text"
              value={String(action.variableValue ?? '')}
              onChange={(e) => onUpdate({ variableValue: e.target.value } as Partial<ScadaAction>)}
              placeholder="Value..."
              style={inputStyle}
            />
          </ConfigRow>
          <ConfigRow label="Scope">
            <select
              value={action.scope}
              onChange={(e) => onUpdate({ scope: e.target.value } as Partial<ScadaAction>)}
              style={inputStyle}
            >
              <option value="page">Page</option>
              <option value="global">Global</option>
            </select>
          </ConfigRow>
        </div>
      );

    case ACTION_TYPES.SHOW_NOTIFICATION:
      return (
        <div style={configGroupStyle}>
          <ConfigRow label="Message">
            <input
              type="text"
              value={action.message}
              onChange={(e) => onUpdate({ message: e.target.value } as Partial<ScadaAction>)}
              placeholder="Notification message..."
              style={inputStyle}
            />
          </ConfigRow>
          <ConfigRow label="Level">
            <select
              value={action.level}
              onChange={(e) => onUpdate({ level: e.target.value } as Partial<ScadaAction>)}
              style={inputStyle}
            >
              <option value="info">Info</option>
              <option value="success">Success</option>
              <option value="warning">Warning</option>
              <option value="error">Error</option>
            </select>
          </ConfigRow>
        </div>
      );

    case ACTION_TYPES.GO_BACK:
    case ACTION_TYPES.GO_HOME:
      // No config needed
      return (
        <div style={{ fontSize: 10, color: '#9CA3AF', fontStyle: 'italic', padding: '2px 0' }}>
          No configuration required
        </div>
      );

    case ACTION_TYPES.CUSTOM_SCRIPT:
      return (
        <div style={configGroupStyle}>
          <ConfigRow label="Script">
            <textarea
              value={(action as { script?: string }).script ?? ''}
              onChange={(e) => onUpdate({ script: e.target.value } as Partial<ScadaAction>)}
              placeholder="// JavaScript expression..."
              style={{ ...inputStyle, minHeight: 60, fontFamily: 'monospace', fontSize: 10, resize: 'vertical' }}
            />
          </ConfigRow>
        </div>
      );

    default:
      return null;
  }
};

// ─── Add Action Button ──────────────────────────────────────────────────────

const AddActionButton: React.FC<{
  onAdd: (type: ActionTypeKey) => void;
}> = ({ onAdd }) => {
  const [open, setOpen] = useState(false);

  return (
    <div>
      <button
        onClick={() => setOpen(!open)}
        style={{
          width: '100%',
          padding: '4px 8px',
          fontSize: 10,
          color: '#3B82F6',
          background: '#EFF6FF',
          border: '1px dashed #93C5FD',
          borderRadius: 4,
          cursor: 'pointer',
          fontWeight: 500,
        }}
      >
        {open ? '— Cancel' : '+ Add Action'}
      </button>
      {open && (
        <div style={{
          marginTop: 4,
          border: '1px solid #e5e7eb',
          borderRadius: 4,
          background: '#fff',
          overflow: 'hidden',
        }}>
          {Object.entries(ACTION_TYPE_LABELS).map(([type, label]) => (
            <button
              key={type}
              onClick={() => { onAdd(type as ActionTypeKey); setOpen(false); }}
              style={dropdownItemStyle}
              onMouseEnter={(e) => { e.currentTarget.style.background = '#F0F7FF'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = '#fff'; }}
            >
              {label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

const ConfigRow: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
    <span style={{ fontSize: 10, color: '#6B7280', minWidth: 60, flexShrink: 0 }}>{label}</span>
    <div style={{ flex: 1 }}>{children}</div>
  </div>
);

function createActionByType(type: ActionTypeKey): ScadaAction {
  switch (type) {
    case ACTION_TYPES.NAVIGATE_TO_PAGE: return createNavigateAction('');
    case ACTION_TYPES.GO_BACK: return createGoBackAction();
    case ACTION_TYPES.GO_HOME: return createGoHomeAction();
    case ACTION_TYPES.OPEN_POPUP: return createOpenPopupAction('');
    case ACTION_TYPES.CLOSE_POPUP: return createClosePopupAction();
    case ACTION_TYPES.RPC_CALL: return createRpcCallAction('', '');
    case ACTION_TYPES.SET_VARIABLE: return createSetVariableAction('', '');
    case ACTION_TYPES.SHOW_NOTIFICATION: return createShowNotificationAction('');
    case ACTION_TYPES.SET_ATTRIBUTE:
      return { id: `action_${Date.now()}`, type: ACTION_TYPES.SET_ATTRIBUTE, deviceId: '', attributeScope: 'SHARED_SCOPE', attributeKey: '', attributeValue: '' };
    case ACTION_TYPES.CUSTOM_SCRIPT:
      return { id: `action_${Date.now()}`, type: ACTION_TYPES.CUSTOM_SCRIPT, script: '' };
    default:
      return createShowNotificationAction('Unknown action');
  }
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const emptyStyle: React.CSSProperties = {
  padding: 16,
  fontSize: 11,
  color: '#9CA3AF',
  textAlign: 'center',
};

const eventSectionStyle: React.CSSProperties = {
  border: '1px solid #e5e7eb',
  borderRadius: 6,
};

const eventHeaderStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: '6px 8px',
  cursor: 'pointer',
  background: '#FAFBFC',
};

const actionRowStyle: React.CSSProperties = {
  padding: 6,
  background: '#F9FAFB',
  border: '1px solid #E5E7EB',
  borderRadius: 4,
};

const removeActionBtnStyle: React.CSSProperties = {
  background: 'none',
  border: 'none',
  color: '#EF4444',
  fontSize: 14,
  cursor: 'pointer',
  padding: '0 4px',
  lineHeight: 1,
};

const configGroupStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 4,
};

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '3px 6px',
  border: '1px solid #e5e7eb',
  borderRadius: 4,
  fontSize: 10,
  outline: 'none',
  background: '#fff',
};

const dropdownItemStyle: React.CSSProperties = {
  display: 'block',
  width: '100%',
  padding: '6px 10px',
  fontSize: 10,
  textAlign: 'left',
  background: '#fff',
  border: 'none',
  borderBottom: '1px solid #f3f4f6',
  cursor: 'pointer',
  color: '#374151',
  transition: 'background 0.1s',
};
