/**
 * @deprecated V1 SCADA — This file belongs to the legacy V1 engine (Konva-based).
 * Replaced by V2 engine in /engine/ and /core/. Scheduled for removal.
 */
'use client';

import React, { useState } from 'react';
import { useScadaStore } from '../stores/scadaStore';
import { GeneralTab } from './properties/GeneralTab';
import { DataBindingTab } from './properties/DataBindingTab';
import { AppearanceTab } from './properties/AppearanceTab';
import { ActionsTab } from './properties/ActionsTab';
import type { Widget } from '../types';

type TabId = 'general' | 'data' | 'appearance' | 'actions';

const TABS: { id: TabId; label: string; icon: string }[] = [
  { id: 'general', label: 'General', icon: '⚙️' },
  { id: 'data', label: 'Data', icon: '📊' },
  { id: 'appearance', label: 'Style', icon: '🎨' },
  { id: 'actions', label: 'Actions', icon: '⚡' },
];

const WIDGET_ICONS: Record<string, string> = {
  button: '🔘', text: '📝', image: '🖼️', shape: '⬜', gauge: '🎛️',
  chart: '📈', table: '📋', container: '📦', video: '🎬', map: '🗺️',
  alarm: '🚨', custom: '🧩', switch: '🔀', slider: '📏', led: '💡',
  valueDisplay: '🔢', valve: '🔧', tank: '🪣', motor: '⚙️', pipe: '🔗',
  pump: '⛽', indicator: '🚦',
};

export const PropertyPanel: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabId>('general');
  const {
    selectedWidget,
    updateWidgetLocal,
    deleteWidget,
    duplicateWidget,
    togglePanel,
  } = useScadaStore();

  const widget = selectedWidget;

  const handleWidgetUpdate = (updates: Partial<Widget>) => {
    if (!widget) return;
    updateWidgetLocal(widget.id, updates);
  };

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-gray-200 flex-shrink-0">
        <h3 className="font-semibold text-gray-900 text-sm">Properties</h3>
        <button onClick={() => togglePanel('right')} className="text-gray-400 hover:text-gray-600 p-1 rounded hover:bg-gray-100 text-xs">✕</button>
      </div>

      {!widget ? (
        <DashboardPropertiesPanel />
      ) : (
        <>
          {/* Widget info bar */}
          <div className="px-3 py-2 border-b border-gray-200 bg-gray-50 flex-shrink-0">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 min-w-0">
                <span className="text-base flex-shrink-0">{WIDGET_ICONS[widget.type] || '📦'}</span>
                <div className="min-w-0">
                  <p className="text-xs font-medium text-gray-900 truncate">{widget.name}</p>
                  <p className="text-[10px] text-gray-500 uppercase">{widget.type}</p>
                </div>
              </div>
              <div className="flex gap-0.5 flex-shrink-0">
                <button onClick={() => duplicateWidget(widget.id)} title="Duplicate" className="p-1 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded text-xs">📋</button>
                <button onClick={() => deleteWidget(widget.id)} title="Delete" className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded text-xs">🗑️</button>
              </div>
            </div>
          </div>

          {/* Tab navigation */}
          <div className="flex border-b border-gray-200 bg-white flex-shrink-0">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 py-1.5 px-1 text-[10px] font-medium border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600 bg-blue-50/50'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <span className="block text-sm leading-tight">{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </div>

          {/* Tab content */}
          <div className="flex-1 overflow-y-auto min-h-0">
            {activeTab === 'general' && <GeneralTab widget={widget} onUpdate={handleWidgetUpdate} />}
            {activeTab === 'data' && <DataBindingTab widget={widget} onUpdate={handleWidgetUpdate} />}
            {activeTab === 'appearance' && <AppearanceTab widget={widget} onUpdate={handleWidgetUpdate} />}
            {activeTab === 'actions' && <ActionsTab widget={widget} onUpdate={handleWidgetUpdate} />}
          </div>
        </>
      )}
    </div>
  );
};

/* Dashboard-level properties when no widget is selected */
const DashboardPropertiesPanel: React.FC = () => {
  const { currentDashboard, editorState } = useScadaStore();
  if (!currentDashboard) {
    return (
      <div className="flex-1 flex items-center justify-center p-4">
        <p className="text-xs text-gray-500 text-center">No dashboard loaded</p>
      </div>
    );
  }

  const widgets = currentDashboard.widgets ?? [];
  const cs = currentDashboard.canvasSize as any;

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="p-3 space-y-3">
        <Section title="Dashboard Info">
          <Field label="Name"><p className="text-xs text-gray-900 font-medium">{currentDashboard.name}</p></Field>
          {currentDashboard.description && <Field label="Description"><p className="text-xs text-gray-600">{currentDashboard.description}</p></Field>}
          <Field label="Canvas"><p className="text-xs text-gray-700">{cs?.width ?? 1920} × {cs?.height ?? 1080} px</p></Field>
          <Field label="Widgets"><p className="text-xs text-gray-700">{widgets.length} widget(s)</p></Field>
        </Section>

        <Section title="Editor Settings">
          <Field label="Grid">{editorState?.showGrid ? '✅ Enabled' : '❌ Disabled'}</Field>
          <Field label="Snap">{editorState?.snapToGrid ? '✅ Enabled' : '❌ Disabled'}</Field>
          <Field label="Zoom">{Math.round((editorState?.viewport?.zoom ?? 1) * 100)}%</Field>
        </Section>

        <div className="text-center py-6">
          <div className="text-gray-300 mb-2">
            <svg className="w-10 h-10 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" />
            </svg>
          </div>
          <p className="text-xs text-gray-500">Select a widget to edit properties</p>
          <p className="text-[10px] text-gray-400 mt-1">Click on a widget in the canvas</p>
        </div>
      </div>
    </div>
  );
};

/* ────── Reusable layout helpers ────── */

export const Section: React.FC<{
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
  actions?: React.ReactNode;
}> = ({ title, children, defaultOpen = true, actions }) => {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border border-gray-200 rounded-md overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-3 py-1.5 bg-gray-50 hover:bg-gray-100 transition-colors"
      >
        <span className="text-[11px] font-semibold text-gray-700 uppercase tracking-wider">{title}</span>
        <div className="flex items-center gap-1">
          {actions}
          <span className="text-gray-400 text-[10px]">{open ? '▼' : '▶'}</span>
        </div>
      </button>
      {open && <div className="px-3 py-2 space-y-2 bg-white">{children}</div>}
    </div>
  );
};

export const Field: React.FC<{
  label: string;
  children: React.ReactNode;
  inline?: boolean;
}> = ({ label, children, inline }) => {
  if (inline) {
    return (
      <div className="flex items-center justify-between gap-2">
        <label className="text-[11px] text-gray-600 font-medium whitespace-nowrap flex-shrink-0">{label}</label>
        <div className="flex-1 flex justify-end min-w-0">{children}</div>
      </div>
    );
  }
  return (
    <div>
      <label className="block text-[11px] text-gray-600 font-medium mb-0.5">{label}</label>
      <div>{children}</div>
    </div>
  );
};

/* ────── Shared input class names ────── */
export const inputCls = 'w-full px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white';
export const selectCls = 'w-full px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 outline-none bg-white';
export const numCls = 'w-16 px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 outline-none text-center bg-white';
export const checkCls = 'rounded border-gray-300 text-blue-600 focus:ring-blue-500 h-3.5 w-3.5';
export const colorCls = 'w-7 h-7 rounded border border-gray-300 cursor-pointer p-0.5';
export const btnSmCls = 'px-2 py-1 text-[10px] font-medium rounded border transition-colors';
