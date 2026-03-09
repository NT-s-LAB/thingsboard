/**
 * Widget Definitions — Register ALL built-in widgets with the WidgetRegistry.
 *
 * Each definition provides:
 *   propSchema    → drives the property panel in the editor
 *   bindingSchema → drives the binding panel
 *   actionSchema  → drives the action configuration
 *   renderer      → the React component that draws the widget
 *
 * Call `registerBuiltinWidgets()` once at app init.
 */

import type { WidgetDefinition } from '../core/types';
import { widgetRegistry } from '../core/registry';

import { ValueDisplayRenderer } from './renderers/ValueDisplayRenderer';
import { GaugeRenderer } from './renderers/GaugeRenderer';
import { TankRenderer } from './renderers/TankRenderer';
import { PumpRenderer } from './renderers/PumpRenderer';
import { ValveRenderer } from './renderers/ValveRenderer';
import { MotorRenderer } from './renderers/MotorRenderer';
import { LedRenderer } from './renderers/LedRenderer';
import { SwitchRenderer } from './renderers/SwitchRenderer';
import { SliderRenderer } from './renderers/SliderRenderer';
import { TextRenderer } from './renderers/TextRenderer';
import { ButtonRenderer } from './renderers/ButtonRenderer';
import { PipeRenderer } from './renderers/PipeRenderer';
import { SvgSymbolRenderer } from './renderers/SvgSymbolRenderer';
import { IndicatorRenderer } from './renderers/IndicatorRenderer';

// ─── VALUE DISPLAY ───────────────────────────────────────────────────────────

const valueDisplay: WidgetDefinition = {
  type: 'valueDisplay',
  name: 'Value Display',
  icon: '📊',
  category: 'display',
  defaultSize: { width: 160, height: 80 },
  supportsSvg: false,
  propSchema: [
    { key: 'label', label: 'Label', type: 'string', defaultValue: 'Value' },
    { key: 'value', label: 'Value', type: 'string', defaultValue: '--' },
    { key: 'unit', label: 'Unit', type: 'string', defaultValue: '' },
    { key: 'prefix', label: 'Prefix', type: 'string', defaultValue: '' },
    { key: 'suffix', label: 'Suffix', type: 'string', defaultValue: '' },
    { key: 'decimals', label: 'Decimals', type: 'number', defaultValue: 1, min: 0, max: 6 },
    { key: 'icon', label: 'Icon', type: 'string', defaultValue: '', group: 'Appearance' },
    { key: 'showTrend', label: 'Show Trend', type: 'boolean', defaultValue: false, group: 'Appearance' },
    { key: 'thresholds', label: 'Thresholds', type: 'json', defaultValue: [], group: 'Thresholds', description: '[{ value: 80, color: "#EF4444" }]' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#FFFFFF', group: 'Appearance' },
    { key: 'textColor', label: 'Text Color', type: 'color', defaultValue: '#1F2937', group: 'Appearance' },
  ],
  bindingSchema: [
    { key: 'value', label: 'Value', valueType: 'number', suggestedKey: 'temperature' },
    { key: 'icon', label: 'Icon', valueType: 'string' },
  ],
  actionSchema: [
    { trigger: 'click', label: 'On Click' },
  ],
  renderer: ValueDisplayRenderer,
};

// ─── GAUGE ───────────────────────────────────────────────────────────────────

const gauge: WidgetDefinition = {
  type: 'gauge',
  name: 'Gauge',
  icon: '🎯',
  category: 'display',
  defaultSize: { width: 160, height: 160 },
  supportsSvg: false,
  propSchema: [
    { key: 'min', label: 'Min', type: 'number', defaultValue: 0 },
    { key: 'max', label: 'Max', type: 'number', defaultValue: 100 },
    { key: 'value', label: 'Value', type: 'number', defaultValue: 0 },
    { key: 'unit', label: 'Unit', type: 'string', defaultValue: '' },
    { key: 'label', label: 'Label', type: 'string', defaultValue: '' },
    { key: 'showValue', label: 'Show Value', type: 'boolean', defaultValue: true },
    { key: 'showMinMax', label: 'Show Min/Max', type: 'boolean', defaultValue: true },
    { key: 'gaugeType', label: 'Gauge Type', type: 'select', defaultValue: 'circular', options: [{ value: 'circular', label: 'Circular' }, { value: 'linear', label: 'Linear' }] },
    { key: 'ranges', label: 'Ranges', type: 'json', defaultValue: [{ from: 0, to: 50, color: '#22C55E' }, { from: 50, to: 80, color: '#F59E0B' }, { from: 80, to: 100, color: '#EF4444' }], description: '[{ from, to, color }]' },
  ],
  bindingSchema: [
    { key: 'value', label: 'Value', valueType: 'number', suggestedKey: 'temperature' },
    { key: 'min', label: 'Min', valueType: 'number' },
    { key: 'max', label: 'Max', valueType: 'number' },
  ],
  actionSchema: [
    { trigger: 'click', label: 'On Click' },
  ],
  renderer: GaugeRenderer,
};

// ─── TANK ────────────────────────────────────────────────────────────────────

const tank: WidgetDefinition = {
  type: 'tank',
  name: 'Tank',
  icon: '🪣',
  category: 'industrial',
  defaultSize: { width: 100, height: 160 },
  supportsSvg: false,
  propSchema: [
    { key: 'minLevel', label: 'Min Level', type: 'number', defaultValue: 0 },
    { key: 'maxLevel', label: 'Max Level', type: 'number', defaultValue: 100 },
    { key: 'level', label: 'Level', type: 'number', defaultValue: 50 },
    { key: 'label', label: 'Label', type: 'string', defaultValue: '' },
    { key: 'unit', label: 'Unit', type: 'string', defaultValue: '%' },
    { key: 'showLevel', label: 'Show Level', type: 'boolean', defaultValue: true },
    { key: 'fillColor', label: 'Fill Color', type: 'color', defaultValue: '#3B82F6' },
    { key: 'outlineColor', label: 'Outline Color', type: 'color', defaultValue: '#64748B' },
    { key: 'tankShape', label: 'Shape', type: 'select', defaultValue: 'rectangular', options: [{ value: 'rectangular', label: 'Rectangular' }, { value: 'cylindrical', label: 'Cylindrical' }] },
  ],
  bindingSchema: [
    { key: 'level', label: 'Level', valueType: 'number', suggestedKey: 'level' },
  ],
  actionSchema: [
    { trigger: 'click', label: 'On Click' },
  ],
  renderer: TankRenderer,
};

// ─── PUMP ────────────────────────────────────────────────────────────────────

const pump: WidgetDefinition = {
  type: 'pump',
  name: 'Pump',
  icon: '⚙️',
  category: 'industrial',
  defaultSize: { width: 100, height: 100 },
  supportsSvg: false,
  propSchema: [
    { key: 'state', label: 'State', type: 'select', defaultValue: 'stopped', options: [{ value: 'running', label: 'Running' }, { value: 'stopped', label: 'Stopped' }, { value: 'fault', label: 'Fault' }] },
    { key: 'label', label: 'Label', type: 'string', defaultValue: '' },
    { key: 'runningColor', label: 'Running Color', type: 'color', defaultValue: '#22C55E' },
    { key: 'stoppedColor', label: 'Stopped Color', type: 'color', defaultValue: '#6B7280' },
    { key: 'faultColor', label: 'Fault Color', type: 'color', defaultValue: '#EF4444' },
  ],
  bindingSchema: [
    { key: 'state', label: 'State', valueType: 'string', suggestedKey: 'pumpState' },
  ],
  actionSchema: [
    { trigger: 'click', label: 'On Click' },
    { trigger: 'start', label: 'Start Pump' },
    { trigger: 'stop', label: 'Stop Pump' },
  ],
  renderer: PumpRenderer,
};

// ─── VALVE ───────────────────────────────────────────────────────────────────

const valve: WidgetDefinition = {
  type: 'valve',
  name: 'Valve',
  icon: '🔧',
  category: 'industrial',
  defaultSize: { width: 80, height: 80 },
  supportsSvg: false,
  propSchema: [
    { key: 'state', label: 'State', type: 'select', defaultValue: 'closed', options: [{ value: 'open', label: 'Open' }, { value: 'closed', label: 'Closed' }, { value: 'partial', label: 'Partial' }, { value: 'fault', label: 'Fault' }] },
    { key: 'openPercent', label: 'Open %', type: 'number', defaultValue: 0, min: 0, max: 100 },
    { key: 'label', label: 'Label', type: 'string', defaultValue: '' },
    { key: 'valveType', label: 'Valve Type', type: 'select', defaultValue: 'gate', options: [{ value: 'gate', label: 'Gate' }, { value: 'ball', label: 'Ball' }, { value: 'butterfly', label: 'Butterfly' }] },
    { key: 'openColor', label: 'Open Color', type: 'color', defaultValue: '#22C55E' },
    { key: 'closedColor', label: 'Closed Color', type: 'color', defaultValue: '#EF4444' },
  ],
  bindingSchema: [
    { key: 'state', label: 'State', valueType: 'string', suggestedKey: 'valveState' },
    { key: 'openPercent', label: 'Open %', valueType: 'number', suggestedKey: 'valvePosition' },
  ],
  actionSchema: [
    { trigger: 'click', label: 'On Click' },
    { trigger: 'open', label: 'Open Valve' },
    { trigger: 'close', label: 'Close Valve' },
  ],
  renderer: ValveRenderer,
};

// ─── MOTOR ───────────────────────────────────────────────────────────────────

const motor: WidgetDefinition = {
  type: 'motor',
  name: 'Motor',
  icon: '🔄',
  category: 'industrial',
  defaultSize: { width: 100, height: 100 },
  supportsSvg: false,
  propSchema: [
    { key: 'state', label: 'State', type: 'select', defaultValue: 'stopped', options: [{ value: 'running', label: 'Running' }, { value: 'stopped', label: 'Stopped' }, { value: 'fault', label: 'Fault' }] },
    { key: 'rpm', label: 'RPM', type: 'number', defaultValue: 0, min: 0, max: 10000 },
    { key: 'label', label: 'Label', type: 'string', defaultValue: '' },
    { key: 'showRPM', label: 'Show RPM', type: 'boolean', defaultValue: true },
    { key: 'runningColor', label: 'Running Color', type: 'color', defaultValue: '#22C55E' },
    { key: 'stoppedColor', label: 'Stopped Color', type: 'color', defaultValue: '#6B7280' },
    { key: 'faultColor', label: 'Fault Color', type: 'color', defaultValue: '#EF4444' },
  ],
  bindingSchema: [
    { key: 'state', label: 'State', valueType: 'string', suggestedKey: 'motorState' },
    { key: 'rpm', label: 'RPM', valueType: 'number', suggestedKey: 'rpm' },
  ],
  actionSchema: [
    { trigger: 'click', label: 'On Click' },
    { trigger: 'start', label: 'Start Motor' },
    { trigger: 'stop', label: 'Stop Motor' },
  ],
  renderer: MotorRenderer,
};

// ─── LED ─────────────────────────────────────────────────────────────────────

const led: WidgetDefinition = {
  type: 'led',
  name: 'LED Indicator',
  icon: '💡',
  category: 'indicator',
  defaultSize: { width: 50, height: 60 },
  supportsSvg: false,
  propSchema: [
    { key: 'state', label: 'State', type: 'boolean', defaultValue: false },
    { key: 'label', label: 'Label', type: 'string', defaultValue: '' },
    { key: 'onColor', label: 'On Color', type: 'color', defaultValue: '#22C55E' },
    { key: 'offColor', label: 'Off Color', type: 'color', defaultValue: '#6B7280' },
    { key: 'shape', label: 'Shape', type: 'select', defaultValue: 'circle', options: [{ value: 'circle', label: 'Circle' }, { value: 'square', label: 'Square' }] },
    { key: 'blinkWhenOn', label: 'Blink When On', type: 'boolean', defaultValue: false },
  ],
  bindingSchema: [
    { key: 'state', label: 'State', valueType: 'boolean', suggestedKey: 'active' },
  ],
  actionSchema: [],
  renderer: LedRenderer,
};

// ─── SWITCH ──────────────────────────────────────────────────────────────────

const switchWidget: WidgetDefinition = {
  type: 'switch',
  name: 'Toggle Switch',
  icon: '🔘',
  category: 'control',
  defaultSize: { width: 80, height: 60 },
  supportsSvg: false,
  propSchema: [
    { key: 'state', label: 'State', type: 'boolean', defaultValue: false },
    { key: 'label', label: 'Label', type: 'string', defaultValue: '' },
    { key: 'onColor', label: 'On Color', type: 'color', defaultValue: '#22C55E' },
    { key: 'offColor', label: 'Off Color', type: 'color', defaultValue: '#9CA3AF' },
    { key: 'showLabel', label: 'Show Label', type: 'boolean', defaultValue: true },
    { key: 'disabled', label: 'Disabled', type: 'boolean', defaultValue: false },
  ],
  bindingSchema: [
    { key: 'state', label: 'State', valueType: 'boolean', suggestedKey: 'active' },
  ],
  actionSchema: [
    { trigger: 'toggle', label: 'On Toggle', description: 'Fired when user toggles the switch' },
  ],
  renderer: SwitchRenderer,
};

// ─── SLIDER ──────────────────────────────────────────────────────────────────

const slider: WidgetDefinition = {
  type: 'slider',
  name: 'Slider',
  icon: '🎚️',
  category: 'control',
  defaultSize: { width: 200, height: 60 },
  supportsSvg: false,
  propSchema: [
    { key: 'value', label: 'Value', type: 'number', defaultValue: 50 },
    { key: 'min', label: 'Min', type: 'number', defaultValue: 0 },
    { key: 'max', label: 'Max', type: 'number', defaultValue: 100 },
    { key: 'label', label: 'Label', type: 'string', defaultValue: '' },
    { key: 'unit', label: 'Unit', type: 'string', defaultValue: '' },
    { key: 'showValue', label: 'Show Value', type: 'boolean', defaultValue: true },
    { key: 'orientation', label: 'Orientation', type: 'select', defaultValue: 'horizontal', options: [{ value: 'horizontal', label: 'Horizontal' }, { value: 'vertical', label: 'Vertical' }] },
    { key: 'trackColor', label: 'Track Color', type: 'color', defaultValue: '#E5E7EB' },
    { key: 'fillColor', label: 'Fill Color', type: 'color', defaultValue: '#3B82F6' },
    { key: 'disabled', label: 'Disabled', type: 'boolean', defaultValue: false },
  ],
  bindingSchema: [
    { key: 'value', label: 'Value', valueType: 'number', suggestedKey: 'setpoint' },
  ],
  actionSchema: [
    { trigger: 'change', label: 'On Change', description: 'Fired when slider value changes' },
  ],
  renderer: SliderRenderer,
};

// ─── TEXT ────────────────────────────────────────────────────────────────────

const text: WidgetDefinition = {
  type: 'text',
  name: 'Text',
  icon: '📝',
  category: 'display',
  defaultSize: { width: 150, height: 40 },
  supportsSvg: false,
  propSchema: [
    { key: 'text', label: 'Text', type: 'string', defaultValue: 'Label' },
    { key: 'fontSize', label: 'Font Size', type: 'number', defaultValue: 14, min: 8, max: 72 },
    { key: 'fontWeight', label: 'Font Weight', type: 'select', defaultValue: 'normal', options: [{ value: 'normal', label: 'Normal' }, { value: 'bold', label: 'Bold' }, { value: '600', label: 'Semi Bold' }] },
    { key: 'fontFamily', label: 'Font Family', type: 'string', defaultValue: 'Arial, sans-serif' },
    { key: 'textColor', label: 'Text Color', type: 'color', defaultValue: '#1F2937' },
    { key: 'align', label: 'Align', type: 'select', defaultValue: 'center', options: [{ value: 'left', label: 'Left' }, { value: 'center', label: 'Center' }, { value: 'right', label: 'Right' }] },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: 'transparent', group: 'Appearance' },
    { key: 'borderColor', label: 'Border Color', type: 'color', defaultValue: 'transparent', group: 'Appearance' },
    { key: 'borderWidth', label: 'Border Width', type: 'number', defaultValue: 0, min: 0, max: 10, group: 'Appearance' },
    { key: 'padding', label: 'Padding', type: 'number', defaultValue: 4, min: 0, max: 20, group: 'Appearance' },
  ],
  bindingSchema: [
    { key: 'text', label: 'Text', valueType: 'string' },
    { key: 'textColor', label: 'Text Color', valueType: 'string' },
  ],
  actionSchema: [
    { trigger: 'click', label: 'On Click' },
  ],
  renderer: TextRenderer,
};

// ─── BUTTON ──────────────────────────────────────────────────────────────────

const button: WidgetDefinition = {
  type: 'button',
  name: 'Button',
  icon: '🔲',
  category: 'control',
  defaultSize: { width: 120, height: 40 },
  supportsSvg: false,
  propSchema: [
    { key: 'label', label: 'Label', type: 'string', defaultValue: 'Button' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#3B82F6' },
    { key: 'textColor', label: 'Text Color', type: 'color', defaultValue: '#FFFFFF' },
    { key: 'fontSize', label: 'Font Size', type: 'number', defaultValue: 12, min: 8, max: 24 },
    { key: 'borderRadius', label: 'Border Radius', type: 'number', defaultValue: 6, min: 0, max: 20 },
    { key: 'disabled', label: 'Disabled', type: 'boolean', defaultValue: false },
    { key: 'confirmRequired', label: 'Require Confirm', type: 'boolean', defaultValue: false, description: 'Show confirmation dialog before action' },
  ],
  bindingSchema: [
    { key: 'disabled', label: 'Disabled', valueType: 'boolean' },
    { key: 'label', label: 'Label', valueType: 'string' },
  ],
  actionSchema: [
    { trigger: 'click', label: 'On Click', description: 'Fired when button is clicked' },
  ],
  renderer: ButtonRenderer,
};

// ─── PIPE ────────────────────────────────────────────────────────────────────

const pipe: WidgetDefinition = {
  type: 'pipe',
  name: 'Pipe',
  icon: '➖',
  category: 'industrial',
  defaultSize: { width: 200, height: 30 },
  supportsSvg: false,
  propSchema: [
    { key: 'orientation', label: 'Orientation', type: 'select', defaultValue: 'horizontal', options: [{ value: 'horizontal', label: 'Horizontal' }, { value: 'vertical', label: 'Vertical' }] },
    { key: 'flowActive', label: 'Flow Active', type: 'boolean', defaultValue: false },
    { key: 'pipeColor', label: 'Pipe Color', type: 'color', defaultValue: '#94A3B8' },
    { key: 'flowColor', label: 'Flow Color', type: 'color', defaultValue: '#3B82F6' },
    { key: 'pipeWidth', label: 'Pipe Width', type: 'number', defaultValue: 12, min: 4, max: 30 },
    { key: 'endCaps', label: 'End Caps', type: 'boolean', defaultValue: true },
    { key: 'label', label: 'Label', type: 'string', defaultValue: '' },
  ],
  bindingSchema: [
    { key: 'flowActive', label: 'Flow Active', valueType: 'boolean', suggestedKey: 'flowStatus' },
  ],
  actionSchema: [],
  renderer: PipeRenderer,
};

// ─── SVG SYMBOL ──────────────────────────────────────────────────────────────

const svgSymbol: WidgetDefinition = {
  type: 'svgSymbol',
  name: 'SVG Symbol',
  icon: '🖼️',
  category: 'custom',
  defaultSize: { width: 100, height: 100 },
  supportsSvg: true,
  propSchema: [
    { key: 'svgContent', label: 'SVG Content', type: 'string', defaultValue: '', description: 'Raw SVG content (auto-populated from Symbol Library)' },
    { key: 'fillOverride', label: 'Fill Override', type: 'color', defaultValue: '' },
    { key: 'strokeOverride', label: 'Stroke Override', type: 'color', defaultValue: '' },
    { key: 'label', label: 'Label', type: 'string', defaultValue: '' },
  ],
  bindingSchema: [
    { key: 'fillOverride', label: 'Fill Color', valueType: 'string' },
    { key: 'strokeOverride', label: 'Stroke Color', valueType: 'string' },
  ],
  actionSchema: [
    { trigger: 'click', label: 'On Click' },
  ],
  renderer: SvgSymbolRenderer,
};

// ─── INDICATOR ───────────────────────────────────────────────────────────────

const indicator: WidgetDefinition = {
  type: 'indicator',
  name: 'Status Indicator',
  icon: '🔶',
  category: 'indicator',
  defaultSize: { width: 60, height: 80 },
  supportsSvg: false,
  propSchema: [
    { key: 'value', label: 'Value', type: 'string', defaultValue: '' },
    { key: 'label', label: 'Label', type: 'string', defaultValue: '' },
    { key: 'shape', label: 'Shape', type: 'select', defaultValue: 'circle', options: [{ value: 'circle', label: 'Circle' }, { value: 'rectangle', label: 'Rectangle' }, { value: 'diamond', label: 'Diamond' }] },
    { key: 'showValue', label: 'Show Value', type: 'boolean', defaultValue: true },
    { key: 'states', label: 'States', type: 'json', defaultValue: [{ value: 'running', color: '#22C55E', label: 'Running' }, { value: 'stopped', color: '#6B7280', label: 'Stopped' }, { value: 'fault', color: '#EF4444', label: 'Fault' }], description: '[{ value, color, label }]' },
  ],
  bindingSchema: [
    { key: 'value', label: 'Value', valueType: 'string', suggestedKey: 'status' },
  ],
  actionSchema: [
    { trigger: 'click', label: 'On Click' },
  ],
  renderer: IndicatorRenderer,
};

// ─── All definitions ─────────────────────────────────────────────────────────

const builtinWidgets: WidgetDefinition[] = [
  valueDisplay,
  gauge,
  tank,
  pump,
  valve,
  motor,
  led,
  switchWidget,
  slider,
  text,
  button,
  pipe,
  svgSymbol,
  indicator,
];

/**
 * Register all built-in widget definitions with the global widget registry.
 * Call once at application startup.
 */
export function registerBuiltinWidgets(): void {
  widgetRegistry.registerAll(builtinWidgets);
}

export { builtinWidgets };
