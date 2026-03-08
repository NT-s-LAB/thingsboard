import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { CustomWidgetDefinition } from '../types';

interface CustomWidgetRegistryState {
  customWidgets: CustomWidgetDefinition[];
  addCustomWidget: (widget: Omit<CustomWidgetDefinition, 'id' | 'createdTime' | 'createdBy'>) => void;
  updateCustomWidget: (id: string, updates: Partial<CustomWidgetDefinition>) => void;
  deleteCustomWidget: (id: string) => void;
  getCustomWidget: (id: string) => CustomWidgetDefinition | undefined;
  getCustomWidgetsByCategory: (category: string) => CustomWidgetDefinition[];
  exportCustomWidget: (id: string) => string | null;
  importCustomWidget: (json: string) => boolean;
}

export const useCustomWidgetRegistry = create<CustomWidgetRegistryState>()(
  persist(
    (set, get) => ({
      customWidgets: [],

      addCustomWidget: (widget) => {
        const newWidget: CustomWidgetDefinition = {
          ...widget,
          id: crypto.randomUUID(),
          createdTime: new Date().toISOString(),
          createdBy: 'current-user',
        };
        set((state) => ({
          customWidgets: [...state.customWidgets, newWidget],
        }));
      },

      updateCustomWidget: (id, updates) => {
        set((state) => ({
          customWidgets: state.customWidgets.map((w) =>
            w.id === id ? { ...w, ...updates } : w
          ),
        }));
      },

      deleteCustomWidget: (id) => {
        set((state) => ({
          customWidgets: state.customWidgets.filter((w) => w.id !== id),
        }));
      },

      getCustomWidget: (id) => {
        return get().customWidgets.find((w) => w.id === id);
      },

      getCustomWidgetsByCategory: (category) => {
        return get().customWidgets.filter((w) => w.category === category);
      },

      exportCustomWidget: (id) => {
        const widget = get().customWidgets.find((w) => w.id === id);
        if (!widget) return null;
        return JSON.stringify(widget, null, 2);
      },

      importCustomWidget: (json) => {
        try {
          const parsed = JSON.parse(json);
          if (!parsed.name || !parsed.category) return false;
          const newWidget: CustomWidgetDefinition = {
            ...parsed,
            id: crypto.randomUUID(),
            createdTime: new Date().toISOString(),
            createdBy: 'imported',
          };
          set((state) => ({
            customWidgets: [...state.customWidgets, newWidget],
          }));
          return true;
        } catch {
          return false;
        }
      },
    }),
    {
      name: 'eitek-custom-widgets',
    }
  )
);

/** Pre-built industrial SCADA widget templates */
export const BUILT_IN_CUSTOM_WIDGETS: Omit<CustomWidgetDefinition, 'id' | 'createdTime' | 'createdBy'>[] = [
  {
    name: 'Flowmeter',
    description: 'Industrial flowmeter display with current flow rate',
    category: 'Sensors',
    icon: '🌊',
    svgContent: `<svg viewBox="0 0 100 60" xmlns="http://www.w3.org/2000/svg">
      <rect x="5" y="15" width="90" height="30" rx="5" fill="#E2E8F0" stroke="#64748B" stroke-width="2"/>
      <polygon points="20,20 35,30 20,40" fill="#3B82F6"/>
      <text x="55" y="35" font-size="14" fill="#1E293B" text-anchor="middle" font-weight="bold">0.0 m³/h</text>
    </svg>`,
    defaultSize: { width: 160, height: 60 },
    defaultProperties: { flowRate: 0, unit: 'm³/h', maxFlow: 100 },
    defaultStyle: {},
    propertySchema: [
      { key: 'flowRate', label: 'Flow Rate', type: 'number', defaultValue: 0, min: 0 },
      { key: 'unit', label: 'Unit', type: 'select', defaultValue: 'm³/h', options: [{ label: 'm³/h', value: 'm³/h' }, { label: 'L/min', value: 'L/min' }, { label: 'GPM', value: 'GPM' }] },
      { key: 'maxFlow', label: 'Max Flow', type: 'number', defaultValue: 100, min: 0 },
    ],
    dataBindingSupport: true,
    rpcSupport: false,
  },
  {
    name: 'Temperature Sensor',
    description: 'Temperature sensor with configurable unit and thresholds',
    category: 'Sensors',
    icon: '🌡️',
    svgContent: `<svg viewBox="0 0 50 100" xmlns="http://www.w3.org/2000/svg">
      <rect x="18" y="5" width="14" height="65" rx="7" fill="#FEE2E2" stroke="#EF4444" stroke-width="2"/>
      <circle cx="25" cy="80" r="15" fill="#EF4444" stroke="#B91C1C" stroke-width="2"/>
      <rect x="21" y="35" width="8" height="40" rx="4" fill="#EF4444"/>
      <text x="25" y="85" font-size="10" fill="white" text-anchor="middle" font-weight="bold">°C</text>
    </svg>`,
    defaultSize: { width: 50, height: 100 },
    defaultProperties: { temperature: 25, unit: '°C', minTemp: -40, maxTemp: 150 },
    defaultStyle: {},
    propertySchema: [
      { key: 'temperature', label: 'Temperature', type: 'number', defaultValue: 25 },
      { key: 'unit', label: 'Unit', type: 'select', defaultValue: '°C', options: [{ label: '°C', value: '°C' }, { label: '°F', value: '°F' }, { label: 'K', value: 'K' }] },
      { key: 'minTemp', label: 'Min Temperature', type: 'number', defaultValue: -40 },
      { key: 'maxTemp', label: 'Max Temperature', type: 'number', defaultValue: 150 },
    ],
    dataBindingSupport: true,
    rpcSupport: false,
  },
  {
    name: 'Pressure Gauge',
    description: 'Industrial pressure gauge with configurable ranges',
    category: 'Sensors',
    icon: '⏲️',
    svgContent: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
      <circle cx="50" cy="50" r="45" fill="#F8FAFC" stroke="#334155" stroke-width="3"/>
      <circle cx="50" cy="50" r="40" fill="none" stroke="#E2E8F0" stroke-width="8"/>
      <path d="M 50 50 L 50 18" stroke="#EF4444" stroke-width="2" stroke-linecap="round"/>
      <circle cx="50" cy="50" r="4" fill="#334155"/>
      <text x="50" y="70" font-size="10" fill="#334155" text-anchor="middle" font-weight="bold">0 bar</text>
    </svg>`,
    defaultSize: { width: 100, height: 100 },
    defaultProperties: { pressure: 0, unit: 'bar', minPressure: 0, maxPressure: 10 },
    defaultStyle: {},
    propertySchema: [
      { key: 'pressure', label: 'Pressure', type: 'number', defaultValue: 0, min: 0 },
      { key: 'unit', label: 'Unit', type: 'select', defaultValue: 'bar', options: [{ label: 'bar', value: 'bar' }, { label: 'psi', value: 'psi' }, { label: 'kPa', value: 'kPa' }, { label: 'MPa', value: 'MPa' }] },
      { key: 'maxPressure', label: 'Max Pressure', type: 'number', defaultValue: 10, min: 0 },
    ],
    dataBindingSupport: true,
    rpcSupport: false,
  },
  {
    name: 'Circuit Breaker',
    description: 'Electrical circuit breaker with on/off control',
    category: 'Electrical',
    icon: '⚡',
    svgContent: `<svg viewBox="0 0 60 80" xmlns="http://www.w3.org/2000/svg">
      <rect x="10" y="5" width="40" height="70" rx="4" fill="#1E293B" stroke="#334155" stroke-width="2"/>
      <rect x="15" y="15" width="30" height="25" rx="2" fill="#22C55E"/>
      <text x="30" y="32" font-size="10" fill="white" text-anchor="middle" font-weight="bold">ON</text>
      <circle cx="30" cy="58" r="6" fill="#F59E0B" stroke="#D97706" stroke-width="1"/>
    </svg>`,
    defaultSize: { width: 60, height: 80 },
    defaultProperties: { state: 'on', label: 'CB-01' },
    defaultStyle: {},
    propertySchema: [
      { key: 'state', label: 'State', type: 'select', defaultValue: 'on', options: [{ label: 'ON', value: 'on' }, { label: 'OFF', value: 'off' }, { label: 'TRIP', value: 'trip' }] },
      { key: 'label', label: 'Label', type: 'string', defaultValue: 'CB-01' },
    ],
    dataBindingSupport: true,
    rpcSupport: true,
  },
];
