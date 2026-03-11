/**
 * Widget Definition Types — the registry schema.
 *
 * Every widget type must provide a WidgetDefinition:
 *   • PropSchema   — describes what props the widget accepts
 *   • BindingSchema — describes what dynamic data it can consume
 *   • ActionSchema  — describes what triggers it exposes
 *   • Renderer      — the React component that draws the widget
 */

import type { Size } from './screen.types';

// ─── JSON-Schema-like property descriptor ────────────────────────────────────

export type PropFieldType =
  | 'string'
  | 'number'
  | 'boolean'
  | 'color'
  | 'select'
  | 'range'
  | 'json'
  | 'svgAsset'
  | 'image';

export interface PropField {
  key: string;
  label: string;
  type: PropFieldType;
  defaultValue: unknown;
  required?: boolean;
  /** For 'select' type */
  options?: Array<{ value: string; label: string }>;
  /** For 'number' / 'range' type */
  min?: number;
  max?: number;
  step?: number;
  /** UI grouping */
  group?: string;
  /** Tooltip / description */
  description?: string;
}

// ─── Binding Schema ──────────────────────────────────────────────────────────

/** Describes ONE bindable property of a widget (e.g. "level", "state"). */
export interface BindingField {
  /** The property name this binding writes to */
  key: string;
  label: string;
  /** Expected data type */
  valueType: 'number' | 'string' | 'boolean';
  /** Suggested default key for quick binding (e.g. "temperature") */
  suggestedKey?: string;
  description?: string;
}

// ─── Action Schema ───────────────────────────────────────────────────────────

export interface ActionField {
  trigger: string;
  label: string;
  description?: string;
}

// ─── Widget Definition (Registry entry) ──────────────────────────────────────

export type WidgetCategory =
  | 'display'
  | 'control'
  | 'indicator'
  | 'industrial'
  | 'layout'
  | 'chart'
  | 'shapes'
  | 'custom';

export interface WidgetDefinition {
  /** Unique type key, e.g. "tank", "pump", "valueDisplay" */
  type: string;
  /** Display name shown in the palette */
  name: string;
  /** Emoji or icon identifier */
  icon: string;
  category: WidgetCategory;

  /** Default dimensions when first dropped on canvas */
  defaultSize: Size;

  /** Property schema — drives the property panel */
  propSchema: PropField[];
  /** Binding schema — drives the binding panel */
  bindingSchema: BindingField[];
  /** Action schema — drives the action panel */
  actionSchema: ActionField[];

  /** Whether the widget supports rendering an uploaded SVG */
  supportsSvg: boolean;

  /** Optional preview SVG string for the widget palette */
  previewSvg?: string;

  /**
   * The React component that renders this widget.
   * Receives WidgetRendererProps.
   */
  renderer: React.ComponentType<WidgetRendererProps>;
}

// ─── Renderer Props ──────────────────────────────────────────────────────────

export interface WidgetRendererProps {
  /** The resolved properties (static merged with bound values) */
  properties: Record<string, unknown>;
  /** Width/Height of the widget (in logical px) */
  width: number;
  height: number;
  /** Whether the dashboard is in runtime mode */
  isRuntime: boolean;
  /** Alarm state for this widget's entity (if any) */
  alarmState?: AlarmState;
  /** Callback for action triggers */
  onAction?: (trigger: string, payload?: Record<string, unknown>) => void;
}

// ─── Alarm State ─────────────────────────────────────────────────────────────

export type AlarmSeverity = 'CRITICAL' | 'MAJOR' | 'MINOR' | 'WARNING' | 'NORMAL';

export interface AlarmState {
  active: boolean;
  severity: AlarmSeverity;
  type?: string;
  message?: string;
  timestamp?: string;
}
