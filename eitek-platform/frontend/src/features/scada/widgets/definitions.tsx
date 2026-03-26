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

import React from 'react';
import type { WidgetDefinition } from '../core/types';
import { widgetRegistry } from '../core/registry';

import { ValueDisplayRenderer } from './renderers/ValueDisplayRenderer';
import { GaugeWidgetRenderer } from './gauge';
import { TankRenderer } from './renderers/TankRenderer';
import { PumpRenderer } from './renderers/PumpRenderer';
import { ValveRenderer } from './renderers/ValveRenderer';
import { MotorRenderer } from './renderers/MotorRenderer';
import { LedRenderer } from './renderers/LedRenderer';
import { SwitchRenderer } from './renderers/SwitchRenderer';
import { SliderRenderer } from './renderers/SliderRenderer';
import { ButtonRenderer } from './renderers/ButtonRenderer';
import { PipeRenderer } from './renderers/PipeRenderer';
import { SvgSymbolRenderer } from './renderers/SvgSymbolRenderer';
import { IndicatorRenderer } from './renderers/IndicatorRenderer';
import { ProgressBarRenderer } from './renderers/ProgressBarRenderer';
import { ImageWidgetRenderer } from './renderers/ImageWidgetRenderer';
import { NumberInputRenderer } from './renderers/NumberInputRenderer';
import { CustomWidgetRenderer } from './renderers/CustomWidgetRenderer';
import {
  ValueDisplayIcon,
  GaugeMeterIcon,
  TankIcon,
  PumpIcon,
  ValveIcon,
  MotorIcon,
  LedIcon,
  SwitchIcon,
  SliderIcon,
  ButtonIcon,
  PipeIcon,
  SvgSymbolIcon,
  StatusIndicatorIcon,
  ProgressBarIcon,
  ImageWidgetIcon,
  NumberInputIcon,
  CustomWidgetIcon,
} from '../engine/editor/EditorIcons';

// ─── VALUE DISPLAY ───────────────────────────────────────────────────────────

const valueDisplay: WidgetDefinition = {
  type: 'valueDisplay',
  name: 'Value Display',
  icon: <ValueDisplayIcon size={16} />,
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
    { key: 'icon', label: 'Icon', type: 'image', defaultValue: '', group: 'Appearance' },
    { key: 'showTrend', label: 'Show Trend', type: 'boolean', defaultValue: false, group: 'Appearance' },
    { key: 'thresholds', label: 'Thresholds', type: 'json', defaultValue: [], group: 'Thresholds', description: '[{ value: 80, color: "#EF4444" }]' },
    { key: 'bgColor', label: 'Background Color', type: 'color', defaultValue: '#FFFFFF', group: 'Appearance' },
    { key: 'bgImage', label: 'Background Image', type: 'image', defaultValue: '', group: 'Appearance' },
    { key: 'bgImageSize', label: 'Image Fit', type: 'select', defaultValue: 'cover', options: [
      { value: 'cover', label: 'Cover' },
      { value: 'contain', label: 'Contain' },
      { value: 'fill', label: 'Fill' },
      { value: '100% 100%', label: 'Stretch' },
    ], group: 'Appearance' },
    { key: 'textColor', label: 'Text Color', type: 'color', defaultValue: '#1F2937', group: 'Appearance' },
    { key: 'fontFamily', label: 'Font', type: 'select', defaultValue: 'Arial, sans-serif', options: [
      { value: 'Arial, sans-serif', label: 'Arial (Default)' },
      { value: 'Inter, Arial, sans-serif', label: 'Inter' },
      { value: 'Courier New, monospace', label: 'Courier New' },
      { value: 'Orbitron, sans-serif', label: '⚙ Orbitron (Kỹ thuật)' },
      { value: 'Rajdhani, sans-serif', label: '⚙ Rajdhani (Công nghiệp)' },
      { value: 'Share Tech Mono, monospace', label: '⚙ Share Tech Mono (Terminal)' },
      { value: 'B612 Mono, monospace', label: '⚙ B612 Mono (Hàng không)' },
      { value: 'VT323, monospace', label: '⚙ VT323 (Retro Digital)' },
    ], group: 'Appearance' },
    { key: 'borderRadius', label: 'Border Radius', type: 'number', defaultValue: 6, min: 0, max: 30, group: 'Appearance' },
    { key: 'borderColor', label: 'Border Color', type: 'color', defaultValue: '#E5E7EB', group: 'Appearance' },
    { key: 'borderWidth', label: 'Border Width', type: 'number', defaultValue: 1, min: 0, max: 6, group: 'Appearance' },
  ],
  bindingSchema: [
    { key: 'value', label: 'Value', valueType: 'number', suggestedKey: 'temperature' },
    { key: 'icon', label: 'Icon', valueType: 'string' },
    { key: 'bgColor', label: 'Background', valueType: 'string' },
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
  icon: <GaugeMeterIcon size={16} />,
  category: 'display',
  defaultSize: { width: 160, height: 160 },
  supportsSvg: false,
  propSchema: [
    // Variant
    { key: 'variant', label: 'Variant', type: 'select', defaultValue: 'radial', options: [
      { value: 'radial', label: 'Radial (270°)' },
      { value: 'semicircle', label: 'Semicircle (180°)' },
      { value: 'arc', label: 'Arc (240°)' },
      { value: 'linear', label: 'Linear Bar' },
    ]},
    // Data
    { key: 'min', label: 'Min', type: 'number', defaultValue: 0 },
    { key: 'max', label: 'Max', type: 'number', defaultValue: 100 },
    { key: 'value', label: 'Value', type: 'number', defaultValue: 0 },
    { key: 'unit', label: 'Unit', type: 'string', defaultValue: '' },
    { key: 'precision', label: 'Decimals', type: 'number', defaultValue: 0, min: 0, max: 6 },
    // Display
    { key: 'title', label: 'Title', type: 'string', defaultValue: '', group: 'Display' },
    { key: 'showTitle', label: 'Show Title', type: 'boolean', defaultValue: false, group: 'Display' },
    { key: 'showValue', label: 'Show Value', type: 'boolean', defaultValue: true, group: 'Display' },
    { key: 'showUnit', label: 'Show Unit', type: 'boolean', defaultValue: true, group: 'Display' },
    { key: 'showMinMax', label: 'Show Min/Max', type: 'boolean', defaultValue: true, group: 'Display' },
    { key: 'showNeedle', label: 'Show Needle', type: 'boolean', defaultValue: true, group: 'Display' },
    // Geometry
    { key: 'thickness', label: 'Thickness', type: 'number', defaultValue: 12, min: 4, max: 40, group: 'Geometry' },
    { key: 'startAngle', label: 'Start Angle', type: 'number', defaultValue: 135, min: 0, max: 360, group: 'Geometry' },
    { key: 'endAngle', label: 'End Angle', type: 'number', defaultValue: 405, min: 0, max: 720, group: 'Geometry' },
    // Colors
    { key: 'trackColor', label: 'Track Color', type: 'color', defaultValue: '#E5E7EB', group: 'Appearance' },
    { key: 'fillColor', label: 'Fill Color', type: 'color', defaultValue: '#3B82F6', group: 'Appearance' },
    { key: 'needleColor', label: 'Needle Color', type: 'color', defaultValue: '#374151', group: 'Appearance' },
    { key: 'textColor', label: 'Text Color', type: 'color', defaultValue: '#1F2937', group: 'Appearance' },
    { key: 'titleColor', label: 'Title Color', type: 'color', defaultValue: '#6B7280', group: 'Appearance' },
    { key: 'backgroundColor', label: 'Background', type: 'color', defaultValue: 'transparent', group: 'Appearance' },
    // Thresholds
    { key: 'thresholdEnabled', label: 'Enable Thresholds', type: 'boolean', defaultValue: true, group: 'Thresholds' },
    { key: 'thresholds', label: 'Thresholds', type: 'json', defaultValue: [
      { value: 0, color: '#22C55E', label: 'Normal' },
      { value: 60, color: '#F59E0B', label: 'Warning' },
      { value: 80, color: '#EF4444', label: 'Critical' },
    ], group: 'Thresholds', description: '[{ value, color, label }]' },
  ],
  bindingSchema: [
    { key: 'value', label: 'Value', valueType: 'number', suggestedKey: 'temperature' },
    { key: 'min', label: 'Min', valueType: 'number' },
    { key: 'max', label: 'Max', valueType: 'number' },
  ],
  actionSchema: [
    { trigger: 'click', label: 'On Click' },
  ],
  renderer: GaugeWidgetRenderer,
};

// ─── TANK ────────────────────────────────────────────────────────────────────

const tank: WidgetDefinition = {
  type: 'tank',
  name: 'Tank',
  icon: <TankIcon size={16} />,
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
    { key: 'warningLevel', label: 'Warning Level', type: 'number', defaultValue: 80, min: 0, max: 100, group: 'Thresholds' },
    { key: 'criticalLevel', label: 'Critical Level', type: 'number', defaultValue: 95, min: 0, max: 100, group: 'Thresholds' },
    { key: 'warningColor', label: 'Warning Color', type: 'color', defaultValue: '#F59E0B', group: 'Thresholds' },
    { key: 'criticalColor', label: 'Critical Color', type: 'color', defaultValue: '#EF4444', group: 'Thresholds' },
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
  icon: <PumpIcon size={16} />,
  category: 'industrial',
  defaultSize: { width: 100, height: 100 },
  supportsSvg: false,
  propSchema: [
    { key: 'state', label: 'State', type: 'select', defaultValue: 'stopped', options: [{ value: 'running', label: 'Running' }, { value: 'stopped', label: 'Stopped' }, { value: 'fault', label: 'Fault' }] },
    { key: 'label', label: 'Label', type: 'string', defaultValue: '' },
    { key: 'showLabel', label: 'Show Label', type: 'boolean', defaultValue: true, group: 'Layout' },
    { key: 'labelColor', label: 'Label Color', type: 'color', defaultValue: '#6B7280', group: 'Layout' },
    { key: 'runningColor', label: 'Running Color', type: 'color', defaultValue: '#22C55E', group: 'Appearance' },
    { key: 'stoppedColor', label: 'Stopped Color', type: 'color', defaultValue: '#6B7280', group: 'Appearance' },
    { key: 'faultColor', label: 'Fault Color', type: 'color', defaultValue: '#EF4444', group: 'Appearance' },
    { key: 'runningImage', label: 'Running Image', type: 'image', defaultValue: '', group: 'Image', description: 'Custom image for running state' },
    { key: 'stoppedImage', label: 'Stopped Image', type: 'image', defaultValue: '', group: 'Image', description: 'Custom image for stopped state' },
    { key: 'faultImage', label: 'Fault Image', type: 'image', defaultValue: '', group: 'Image', description: 'Custom image for fault state' },
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
  icon: <ValveIcon size={16} />,
  category: 'industrial',
  defaultSize: { width: 80, height: 80 },
  supportsSvg: false,
  propSchema: [
    { key: 'state', label: 'State', type: 'select', defaultValue: 'closed', options: [{ value: 'open', label: 'Open' }, { value: 'closed', label: 'Closed' }, { value: 'partial', label: 'Partial' }, { value: 'fault', label: 'Fault' }] },
    { key: 'openPercent', label: 'Open %', type: 'number', defaultValue: 0, min: 0, max: 100 },
    { key: 'label', label: 'Label', type: 'string', defaultValue: '' },
    { key: 'showLabel', label: 'Show Label', type: 'boolean', defaultValue: true, group: 'Layout' },
    { key: 'labelColor', label: 'Label Color', type: 'color', defaultValue: '#6B7280', group: 'Layout' },
    { key: 'valveType', label: 'Valve Type', type: 'select', defaultValue: 'gate', options: [{ value: 'gate', label: 'Gate' }, { value: 'ball', label: 'Ball' }, { value: 'butterfly', label: 'Butterfly' }] },
    { key: 'openColor', label: 'Open Color', type: 'color', defaultValue: '#22C55E', group: 'Appearance' },
    { key: 'closedColor', label: 'Closed Color', type: 'color', defaultValue: '#EF4444', group: 'Appearance' },
    { key: 'openImage', label: 'Open Image', type: 'image', defaultValue: '', group: 'Image', description: 'Custom image for open state' },
    { key: 'closedImage', label: 'Closed Image', type: 'image', defaultValue: '', group: 'Image', description: 'Custom image for closed state' },
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
  icon: <MotorIcon size={16} />,
  category: 'industrial',
  defaultSize: { width: 100, height: 100 },
  supportsSvg: false,
  propSchema: [
    { key: 'state', label: 'State', type: 'select', defaultValue: 'stopped', options: [{ value: 'running', label: 'Running' }, { value: 'stopped', label: 'Stopped' }, { value: 'fault', label: 'Fault' }] },
    { key: 'rpm', label: 'RPM', type: 'number', defaultValue: 0, min: 0, max: 10000 },
    { key: 'label', label: 'Label', type: 'string', defaultValue: '' },
    { key: 'showLabel', label: 'Show Label', type: 'boolean', defaultValue: true, group: 'Layout' },
    { key: 'labelColor', label: 'Label Color', type: 'color', defaultValue: '#6B7280', group: 'Layout' },
    { key: 'showRPM', label: 'Show RPM', type: 'boolean', defaultValue: true },
    { key: 'showPower', label: 'Show Power', type: 'boolean', defaultValue: false, group: 'Display' },
    { key: 'power', label: 'Power', type: 'number', defaultValue: 0, group: 'Display' },
    { key: 'powerUnit', label: 'Power Unit', type: 'string', defaultValue: 'kW', group: 'Display' },
    { key: 'runningColor', label: 'Running Color', type: 'color', defaultValue: '#22C55E', group: 'Appearance' },
    { key: 'stoppedColor', label: 'Stopped Color', type: 'color', defaultValue: '#6B7280', group: 'Appearance' },
    { key: 'faultColor', label: 'Fault Color', type: 'color', defaultValue: '#EF4444', group: 'Appearance' },
    { key: 'runningImage', label: 'Running Image', type: 'image', defaultValue: '', group: 'Image', description: 'Custom image for running state' },
    { key: 'stoppedImage', label: 'Stopped Image', type: 'image', defaultValue: '', group: 'Image', description: 'Custom image for stopped state' },
    { key: 'faultImage', label: 'Fault Image', type: 'image', defaultValue: '', group: 'Image', description: 'Custom image for fault state' },
  ],
  bindingSchema: [
    { key: 'state', label: 'State', valueType: 'string', suggestedKey: 'motorState' },
    { key: 'rpm', label: 'RPM', valueType: 'number', suggestedKey: 'rpm' },
    { key: 'power', label: 'Power', valueType: 'number', suggestedKey: 'power' },
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
  icon: <LedIcon size={16} />,
  category: 'indicator',
  defaultSize: { width: 50, height: 60 },
  supportsSvg: false,
  propSchema: [
    { key: 'state', label: 'State', type: 'boolean', defaultValue: false },
    { key: 'label', label: 'Label', type: 'string', defaultValue: '' },
    { key: 'showLabel', label: 'Show Label', type: 'boolean', defaultValue: true, group: 'Layout' },
    { key: 'labelColor', label: 'Label Color', type: 'color', defaultValue: '#6B7280', group: 'Layout' },
    { key: 'onColor', label: 'On Color', type: 'color', defaultValue: '#22C55E', group: 'Appearance' },
    { key: 'offColor', label: 'Off Color', type: 'color', defaultValue: '#6B7280', group: 'Appearance' },
    { key: 'shape', label: 'Shape', type: 'select', defaultValue: 'circle', options: [{ value: 'circle', label: 'Circle' }, { value: 'square', label: 'Square' }] },
    { key: 'blinkWhenOn', label: 'Blink When On', type: 'boolean', defaultValue: false, group: 'Behavior' },
    { key: 'onImage', label: 'On Image', type: 'image', defaultValue: '', group: 'Image', description: 'Custom image for ON state' },
    { key: 'offImage', label: 'Off Image', type: 'image', defaultValue: '', group: 'Image', description: 'Custom image for OFF state' },
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
  icon: <SwitchIcon size={16} />,
  category: 'control',
  defaultSize: { width: 80, height: 80 },
  supportsSvg: false,
  propSchema: [
    { key: 'state', label: 'State', type: 'boolean', defaultValue: false },
    { key: 'label', label: 'Label', type: 'string', defaultValue: '' },
    // Image mode (auto-activates when on/off images are set)
    { key: 'onImage', label: 'On Image', type: 'image', defaultValue: '', group: 'Image', description: 'Image shown when state is ON (PNG/SVG)' },
    { key: 'offImage', label: 'Off Image', type: 'image', defaultValue: '', group: 'Image', description: 'Image shown when state is OFF (PNG/SVG)' },
    // Classic toggle colors (used when no images set)
    { key: 'onColor', label: 'On Color', type: 'color', defaultValue: '#22C55E', group: 'Appearance' },
    { key: 'offColor', label: 'Off Color', type: 'color', defaultValue: '#9CA3AF', group: 'Appearance' },
    // Layout & style
    { key: 'showLabel', label: 'Show Label', type: 'boolean', defaultValue: true, group: 'Layout' },
    { key: 'labelPosition', label: 'Label Pos', type: 'select', defaultValue: 'bottom', options: [{ value: 'top', label: 'Top' }, { value: 'bottom', label: 'Bottom' }, { value: 'left', label: 'Left' }, { value: 'right', label: 'Right' }], group: 'Layout' },
    { key: 'labelColor', label: 'Label Color', type: 'color', defaultValue: '#6B7280', group: 'Layout' },
    { key: 'labelSize', label: 'Label Size', type: 'number', defaultValue: 11, min: 8, max: 24, group: 'Layout' },
    // Behavior
    { key: 'disabled', label: 'Disabled', type: 'boolean', defaultValue: false, group: 'Behavior' },
    { key: 'confirmRequired', label: 'Require Confirm', type: 'boolean', defaultValue: false, group: 'Behavior', description: 'Show confirmation before toggling' },
    { key: 'confirmMessage', label: 'Confirm Msg', type: 'string', defaultValue: 'Are you sure?', group: 'Behavior' },
  ],
  bindingSchema: [
    { key: 'state', label: 'State', valueType: 'boolean', suggestedKey: 'active' },
    { key: 'disabled', label: 'Disabled', valueType: 'boolean', suggestedKey: 'disabled' },
    { key: 'label', label: 'Label', valueType: 'string' },
  ],
  actionSchema: [
    { trigger: 'toggle', label: 'On Toggle', description: 'Fired when user toggles the switch' },
    { trigger: 'turnOn', label: 'Turn On', description: 'Fired when switch is turned ON' },
    { trigger: 'turnOff', label: 'Turn Off', description: 'Fired when switch is turned OFF' },
  ],
  renderer: SwitchRenderer,
};

// ─── SLIDER ──────────────────────────────────────────────────────────────────

const slider: WidgetDefinition = {
  type: 'slider',
  name: 'Slider',
  icon: <SliderIcon size={16} />,
  category: 'control',
  defaultSize: { width: 200, height: 60 },
  supportsSvg: false,
  propSchema: [
    { key: 'value', label: 'Value', type: 'number', defaultValue: 50 },
    { key: 'min', label: 'Min', type: 'number', defaultValue: 0 },
    { key: 'max', label: 'Max', type: 'number', defaultValue: 100 },
    { key: 'step', label: 'Step', type: 'number', defaultValue: 1, min: 0.01, max: 100 },
    { key: 'label', label: 'Label', type: 'string', defaultValue: '' },
    { key: 'unit', label: 'Unit', type: 'string', defaultValue: '' },
    { key: 'showValue', label: 'Show Value', type: 'boolean', defaultValue: true },
    { key: 'showMinMax', label: 'Show Min/Max', type: 'boolean', defaultValue: false, group: 'Display' },
    { key: 'orientation', label: 'Orientation', type: 'select', defaultValue: 'horizontal', options: [{ value: 'horizontal', label: 'Horizontal' }, { value: 'vertical', label: 'Vertical' }] },
    { key: 'trackColor', label: 'Track Color', type: 'color', defaultValue: '#E5E7EB', group: 'Appearance' },
    { key: 'fillColor', label: 'Fill Color', type: 'color', defaultValue: '#3B82F6', group: 'Appearance' },
    { key: 'disabled', label: 'Disabled', type: 'boolean', defaultValue: false, group: 'Behavior' },
  ],
  bindingSchema: [
    { key: 'value', label: 'Value', valueType: 'number', suggestedKey: 'setpoint' },
    { key: 'disabled', label: 'Disabled', valueType: 'boolean' },
  ],
  actionSchema: [
    { trigger: 'change', label: 'On Change', description: 'Fired when slider value changes' },
  ],
  renderer: SliderRenderer,
};

// ─── BUTTON ──────────────────────────────────────────────────────────────────

const button: WidgetDefinition = {
  type: 'button',
  name: 'Button',
  icon: <ButtonIcon size={16} />,
  category: 'control',
  defaultSize: { width: 120, height: 40 },
  supportsSvg: false,
  propSchema: [
    { key: 'label', label: 'Label', type: 'string', defaultValue: 'Button' },
    { key: 'icon', label: 'Icon', type: 'image', defaultValue: '', group: 'Appearance', description: 'Button icon (PNG/SVG)' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#3B82F6', group: 'Appearance' },
    { key: 'hoverColor', label: 'Hover Color', type: 'color', defaultValue: '#2563EB', group: 'Appearance' },
    { key: 'textColor', label: 'Text Color', type: 'color', defaultValue: '#FFFFFF', group: 'Appearance' },
    { key: 'fontSize', label: 'Font Size', type: 'number', defaultValue: 12, min: 8, max: 24 },
    { key: 'borderRadius', label: 'Border Radius', type: 'number', defaultValue: 6, min: 0, max: 20 },
    { key: 'disabled', label: 'Disabled', type: 'boolean', defaultValue: false, group: 'Behavior' },
    { key: 'confirmRequired', label: 'Require Confirm', type: 'boolean', defaultValue: false, group: 'Behavior', description: 'Show confirmation dialog before action' },
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
  icon: <PipeIcon size={16} />,
  category: 'industrial',
  defaultSize: { width: 200, height: 30 },
  supportsSvg: false,
  propSchema: [
    { key: 'orientation', label: 'Orientation', type: 'select', defaultValue: 'horizontal', options: [{ value: 'horizontal', label: 'Horizontal' }, { value: 'vertical', label: 'Vertical' }] },
    { key: 'flowActive', label: 'Flow Active', type: 'boolean', defaultValue: false },
    { key: 'pipeColor', label: 'Pipe Color', type: 'color', defaultValue: '#94A3B8', group: 'Appearance' },
    { key: 'flowColor', label: 'Flow Color', type: 'color', defaultValue: '#3B82F6', group: 'Appearance' },
    { key: 'pipeWidth', label: 'Pipe Width', type: 'number', defaultValue: 12, min: 4, max: 30 },
    { key: 'flowSpeed', label: 'Flow Speed', type: 'number', defaultValue: 1, min: 0.1, max: 5, group: 'Behavior', description: 'Animation speed multiplier' },
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
  icon: <SvgSymbolIcon size={16} />,
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
  icon: <StatusIndicatorIcon size={16} />,
  category: 'indicator',
  defaultSize: { width: 60, height: 80 },
  supportsSvg: false,
  propSchema: [
    { key: 'value', label: 'Value', type: 'string', defaultValue: '' },
    { key: 'label', label: 'Label', type: 'string', defaultValue: '' },
    { key: 'shape', label: 'Shape', type: 'select', defaultValue: 'circle', options: [{ value: 'circle', label: 'Circle' }, { value: 'rectangle', label: 'Rectangle' }, { value: 'diamond', label: 'Diamond' }] },
    { key: 'showValue', label: 'Show Value', type: 'boolean', defaultValue: true },
    { key: 'blinkWhenActive', label: 'Blink Active', type: 'boolean', defaultValue: false, group: 'Behavior', description: 'Blink when state matches running/active' },
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

// ─── PROGRESS BAR ────────────────────────────────────────────────────────────

const progressBar: WidgetDefinition = {
  type: 'progressBar',
  name: 'Progress Bar',
  icon: <ProgressBarIcon size={16} />,
  category: 'display',
  defaultSize: { width: 200, height: 40 },
  supportsSvg: false,
  propSchema: [
    { key: 'value', label: 'Value', type: 'number', defaultValue: 50 },
    { key: 'min', label: 'Min', type: 'number', defaultValue: 0 },
    { key: 'max', label: 'Max', type: 'number', defaultValue: 100 },
    { key: 'label', label: 'Label', type: 'string', defaultValue: '' },
    { key: 'unit', label: 'Unit', type: 'string', defaultValue: '%' },
    { key: 'decimals', label: 'Decimals', type: 'number', defaultValue: 0, min: 0, max: 4 },
    { key: 'showValue', label: 'Show Value', type: 'boolean', defaultValue: true },
    { key: 'showMinMax', label: 'Show Min/Max', type: 'boolean', defaultValue: false },
    { key: 'orientation', label: 'Orientation', type: 'select', defaultValue: 'horizontal', options: [{ value: 'horizontal', label: 'Horizontal' }, { value: 'vertical', label: 'Vertical' }] },
    { key: 'barColor', label: 'Bar Color', type: 'color', defaultValue: '#3B82F6', group: 'Appearance' },
    { key: 'trackColor', label: 'Track Color', type: 'color', defaultValue: '#E5E7EB', group: 'Appearance' },
    { key: 'barRadius', label: 'Bar Radius', type: 'number', defaultValue: 4, min: 0, max: 20, group: 'Appearance' },
    { key: 'barHeight', label: 'Bar Height', type: 'number', defaultValue: 12, min: 4, max: 40, group: 'Appearance' },
    { key: 'thresholds', label: 'Thresholds', type: 'json', defaultValue: [], group: 'Thresholds', description: '[{ value: 80, color: "#F59E0B" }, { value: 95, color: "#EF4444" }]' },
  ],
  bindingSchema: [
    { key: 'value', label: 'Value', valueType: 'number', suggestedKey: 'progress' },
    { key: 'min', label: 'Min', valueType: 'number' },
    { key: 'max', label: 'Max', valueType: 'number' },
  ],
  actionSchema: [
    { trigger: 'click', label: 'On Click' },
  ],
  renderer: ProgressBarRenderer,
};

// ─── IMAGE WIDGET ────────────────────────────────────────────────────────────

const imageWidget: WidgetDefinition = {
  type: 'imageWidget',
  name: 'Image',
  icon: <ImageWidgetIcon size={16} />,
  category: 'display',
  defaultSize: { width: 120, height: 120 },
  supportsSvg: false,
  propSchema: [
    { key: 'imageUrl', label: 'Image URL', type: 'image', defaultValue: '', description: 'Select or enter image URL' },
    { key: 'label', label: 'Label', type: 'string', defaultValue: '' },
    { key: 'objectFit', label: 'Fit', type: 'select', defaultValue: 'contain', options: [{ value: 'contain', label: 'Contain' }, { value: 'cover', label: 'Cover' }, { value: 'fill', label: 'Fill' }, { value: 'none', label: 'None' }] },
    { key: 'borderRadius', label: 'Border Radius', type: 'number', defaultValue: 0, min: 0, max: 50, group: 'Appearance' },
    { key: 'borderWidth', label: 'Border Width', type: 'number', defaultValue: 0, min: 0, max: 10, group: 'Appearance' },
    { key: 'borderColor', label: 'Border Color', type: 'color', defaultValue: '#E5E7EB', group: 'Appearance' },
    { key: 'opacity', label: 'Opacity', type: 'number', defaultValue: 1, min: 0, max: 1, group: 'Appearance' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: 'transparent', group: 'Appearance' },
    { key: 'labelSize', label: 'Label Size', type: 'number', defaultValue: 10, min: 8, max: 20, group: 'Layout' },
    { key: 'labelColor', label: 'Label Color', type: 'color', defaultValue: '#6B7280', group: 'Layout' },
  ],
  bindingSchema: [
    { key: 'imageUrl', label: 'Image URL', valueType: 'string', suggestedKey: 'imageUrl' },
    { key: 'opacity', label: 'Opacity', valueType: 'number' },
  ],
  actionSchema: [
    { trigger: 'click', label: 'On Click' },
  ],
  renderer: ImageWidgetRenderer,
};

// ─── NUMBER INPUT ────────────────────────────────────────────────────────────

const numberInput: WidgetDefinition = {
  type: 'numberInput',
  name: 'Number Input',
  icon: <NumberInputIcon size={16} />,
  category: 'control',
  defaultSize: { width: 140, height: 50 },
  supportsSvg: false,
  propSchema: [
    { key: 'value', label: 'Value', type: 'number', defaultValue: 0 },
    { key: 'min', label: 'Min', type: 'number', defaultValue: 0 },
    { key: 'max', label: 'Max', type: 'number', defaultValue: 100 },
    { key: 'step', label: 'Step', type: 'number', defaultValue: 1, min: 0.01, max: 100 },
    { key: 'label', label: 'Label', type: 'string', defaultValue: '' },
    { key: 'unit', label: 'Unit', type: 'string', defaultValue: '' },
    { key: 'decimals', label: 'Decimals', type: 'number', defaultValue: 0, min: 0, max: 4 },
    { key: 'disabled', label: 'Disabled', type: 'boolean', defaultValue: false, group: 'Behavior' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#FFFFFF', group: 'Appearance' },
    { key: 'textColor', label: 'Text Color', type: 'color', defaultValue: '#1F2937', group: 'Appearance' },
    { key: 'accentColor', label: 'Accent Color', type: 'color', defaultValue: '#3B82F6', group: 'Appearance' },
  ],
  bindingSchema: [
    { key: 'value', label: 'Value', valueType: 'number', suggestedKey: 'setpoint' },
    { key: 'min', label: 'Min', valueType: 'number' },
    { key: 'max', label: 'Max', valueType: 'number' },
    { key: 'disabled', label: 'Disabled', valueType: 'boolean' },
  ],
  actionSchema: [
    { trigger: 'change', label: 'On Change', description: 'Fired when value changes' },
    { trigger: 'increment', label: 'On Increment' },
    { trigger: 'decrement', label: 'On Decrement' },
  ],
  renderer: NumberInputRenderer,
};

// ─── CUSTOM WIDGET (library) ─────────────────────────────────────────────────

const customWidget: WidgetDefinition = {
  type: 'customWidget',
  name: 'Custom Widget',
  icon: <CustomWidgetIcon size={16} />,
  category: 'custom',
  defaultSize: { width: 120, height: 80 },
  supportsSvg: true,
  propSchema: [
    { key: 'label', label: 'Label', type: 'string', defaultValue: '' },
    { key: '_svgContent', label: 'SVG Content', type: 'string', defaultValue: '', group: 'Internal' },
    { key: '_imageUrl', label: 'Image URL', type: 'image', defaultValue: '', group: 'Internal' },
    { key: '_libraryId', label: 'Library ID', type: 'string', defaultValue: '', group: 'Internal' },
    { key: '_libraryName', label: 'Library Name', type: 'string', defaultValue: '', group: 'Internal' },
    { key: 'fillColor', label: 'Fill Color', type: 'color', defaultValue: '', group: 'Appearance' },
    { key: 'strokeColor', label: 'Stroke Color', type: 'color', defaultValue: '', group: 'Appearance' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: 'transparent', group: 'Appearance' },
    { key: 'labelColor', label: 'Label Color', type: 'color', defaultValue: '#6B7280', group: 'Appearance' },
    { key: 'borderRadius', label: 'Border Radius', type: 'number', defaultValue: 0, min: 0, max: 30, group: 'Appearance' },
    { key: 'borderWidth', label: 'Border Width', type: 'number', defaultValue: 0, min: 0, max: 6, group: 'Appearance' },
    { key: 'borderColor', label: 'Border Color', type: 'color', defaultValue: '#E5E7EB', group: 'Appearance' },
    { key: 'opacity', label: 'Opacity', type: 'range', defaultValue: 1, min: 0, max: 1, step: 0.05, group: 'Appearance' },
  ],
  bindingSchema: [
    { key: 'value', label: 'Value', valueType: 'number', suggestedKey: '' },
    { key: 'label', label: 'Label', valueType: 'string' },
  ],
  actionSchema: [
    { trigger: 'click', label: 'On Click' },
  ],
  renderer: CustomWidgetRenderer,
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
  button,
  pipe,
  svgSymbol,
  indicator,
  progressBar,
  imageWidget,
  numberInput,
  customWidget,
];

// Import shape widget definitions
import { registerShapeWidgets } from './shapes';
// Import chart widget definitions
import { registerChartWidgets } from './charts';

/**
 * Register all built-in widget definitions with the global widget registry.
 * Call once at application startup.
 */
export function registerBuiltinWidgets(): void {
  widgetRegistry.registerAll(builtinWidgets);
  // Register shape widgets
  registerShapeWidgets();
  // Register chart widgets
  registerChartWidgets();
}

export { builtinWidgets };
