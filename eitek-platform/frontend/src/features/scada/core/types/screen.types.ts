/**
 * SCADA Screen Definition Types
 *
 * A Screen is the top-level container — analogous to a "display" in traditional
 * SCADA / HMI systems (e.g. Wonderware InTouch, Ignition Perspective).
 *
 * Screens are persisted as JSON, enabling version-control, export/import, and
 * diffing.  The runtime engine hydrates a Screen JSON into live SVG widgets.
 */

// ─── Geometry ────────────────────────────────────────────────────────────────

export interface Point {
  x: number;
  y: number;
}

export interface Size {
  width: number;
  height: number;
}

export interface Transform {
  /** Position on the screen canvas (px) */
  position: Point;
  /** Dimensions (px) */
  size: Size;
  /** Rotation in degrees, default 0 */
  rotation: number;
  /** Render order; higher = in front */
  zIndex: number;
}

// ─── Background ──────────────────────────────────────────────────────────────

export type BackgroundType = 'color' | 'image' | 'svg';

export interface ScreenBackground {
  type: BackgroundType;
  /** Solid colour, or gradient CSS string */
  color?: string;
  /** URL to a raster/SVG background image */
  imageUrl?: string;
  /** ID of an uploaded SVG asset from the Symbol Library */
  svgAssetId?: string;
  /** Fit mode when using image/SVG */
  fit?: 'contain' | 'cover' | 'fill' | 'none';
  opacity?: number;
}

// ─── Screen ──────────────────────────────────────────────────────────────────

export interface ScreenDefinition {
  id: string;
  /** Version counter — incremented on each save */
  version: number;
  name: string;
  description?: string;

  /** Canvas size in logical px */
  canvasSize: Size;
  background: ScreenBackground;

  /** Ordered list of layers — widgets belong to layers */
  layers: ScreenLayer[];

  /** Flat list of widget instances */
  widgets: WidgetInstance[];

  /** Screen-level variables (e.g. selectedDevice) */
  variables: ScreenVariable[];

  /** Multi-window / sub-screen definitions */
  windows?: ScadaWindow[];

  /** Metadata — timestamps, creator, tags */
  metadata: ScreenMetadata;
}

export interface ScreenLayer {
  id: string;
  name: string;
  visible: boolean;
  locked: boolean;
  opacity: number;
  /** Order index (lower = further back) */
  order: number;
}

export interface ScreenVariable {
  id: string;
  name: string;
  type: 'string' | 'number' | 'boolean' | 'json';
  defaultValue: unknown;
  currentValue?: unknown;
}

export interface ScreenMetadata {
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  tags: string[];
  /** Navigation hierarchy */
  projectId?: string;
  areaId?: string;
}

// ─── Windows (Sub-Screens) ───────────────────────────────────────────────────

/**
 * A ScadaWindow is a sub-screen / overlay that can be shown via navigation
 * actions on widgets (e.g. click button → open pop-up window).
 *
 * Each window has its own set of widgets, layers, background, and canvas size.
 * One window is designated as `isMain` — the primary visible screen on load.
 */
export interface ScadaWindow {
  /** Unique within the ScreenDefinition */
  id: string;
  /** User-visible name */
  name: string;
  /** Only one window can be "main" — the default screen shown on load */
  isMain: boolean;
  /** Canvas size for this window */
  canvasSize: Size;
  /** Background for this window */
  background: ScreenBackground;
  /** Layers within this window */
  layers: ScreenLayer[];
  /** Widgets placed in this window */
  widgets: WidgetInstance[];
}

// ─── Widget Instance ─────────────────────────────────────────────────────────

/**
 * A concrete widget placed on a screen.
 * It references a WidgetDefinition via `type` and an optional SVG asset
 * via `svgAssetId`.
 */
export interface WidgetInstance {
  /** Unique within the screen */
  id: string;
  /** Must match a registered WidgetDefinition.type */
  type: string;
  /** User-visible label in the editor */
  name: string;
  /** Assigned layer */
  layerId: string;

  /** Position, size, rotation, zIndex */
  transform: Transform;

  /** Widget-specific properties (values according to the propSchema) */
  properties: Record<string, unknown>;

  /** Data bindings — connect datasources to widget props */
  bindings: WidgetBinding[];

  /** Interactive actions (onClick → rpcCall, navigate, etc.) */
  actions: WidgetActionInstance[];

  /** Event-action bindings for the new multi-page event system */
  events?: import('./project.types').WidgetEvent[];

  /** If the widget renders a user-uploaded SVG */
  svgAssetId?: string;

  /** Lock editing */
  locked?: boolean;
  visible?: boolean;
}

// ─── Binding ─────────────────────────────────────────────────────────────────

export type BindingSourceType =
  | 'telemetry'
  | 'attribute'
  | 'alarm'
  | 'variable'
  | 'calculated'
  | 'static';

export interface WidgetBinding {
  id: string;
  /** Which widget property this binding writes to (e.g. "level", "state") */
  targetProperty: string;

  source: BindingSource;

  /** Optional post-processing  —  a safe expression string */
  transform?: string;

  /** Format options */
  format?: BindingFormat;

  /** Default value when source is unavailable */
  defaultValue?: unknown;
}

export interface BindingSource {
  type: BindingSourceType;

  /** ThingsBoard entity reference */
  entityType?: 'DEVICE' | 'ASSET';
  entityId?: string;
  entityName?: string;

  /** Key to read (telemetry key, attribute key, variable name) */
  key?: string;

  /** Attribute scope */
  attributeScope?: 'SERVER_SCOPE' | 'CLIENT_SCOPE' | 'SHARED_SCOPE';

  /** Alarm filter */
  alarmType?: string;
  alarmSeverity?: string[];

  /** Static / literal value */
  staticValue?: unknown;

  /** Calculated expression */
  expression?: string;
}

export interface BindingFormat {
  type: 'number' | 'string' | 'date' | 'boolean';
  decimals?: number;
  unit?: string;
  prefix?: string;
  suffix?: string;
  dateFormat?: string;
  /** Map value → display string (e.g. { "0": "OFF", "1": "ON" }) */
  valueMap?: Record<string, string>;
}

// ─── Actions ─────────────────────────────────────────────────────────────────

export type ActionTrigger =
  | 'click'
  | 'doubleClick'
  | 'mouseEnter'
  | 'mouseLeave'
  | 'valueChange'
  | 'alarmActive'
  | 'alarmCleared'
  | 'toggle'
  | 'turnOn'
  | 'turnOff'
  | 'start'
  | 'stop'
  | 'open'
  | 'close'
  | 'change';

export type ActionType =
  | 'navigate'
  | 'rpcCall'
  | 'setAttribute'
  | 'setVariable'
  | 'showDialog'
  | 'showNotification'
  | 'custom';

export interface WidgetActionInstance {
  id: string;
  trigger: ActionTrigger;
  actionType: ActionType;
  /** Type-specific configuration */
  config: ActionConfig;
  /** Whether to show a confirmation dialog first */
  requireConfirm?: boolean;
  confirmMessage?: string;
}

export interface ActionConfig {
  // navigate
  targetScreenId?: string;
  /** Navigate to a window within the same screen */
  targetWindowId?: string;
  url?: string;
  openInNewTab?: boolean;

  // rpcCall
  deviceId?: string;
  rpcMethod?: string;
  rpcParams?: Record<string, unknown>;
  rpcOneWay?: boolean;
  rpcTimeout?: number;

  // setAttribute
  attributeScope?: 'SERVER_SCOPE' | 'CLIENT_SCOPE' | 'SHARED_SCOPE';
  attributeKey?: string;
  attributeValue?: unknown;

  // setVariable
  variableName?: string;
  variableValue?: unknown;

  // showDialog
  dialogTitle?: string;
  dialogContent?: string;
  dialogType?: 'info' | 'warning' | 'error' | 'confirm';

  // showNotification
  notificationMessage?: string;
  notificationType?: 'success' | 'info' | 'warning' | 'error';

  // custom
  script?: string;
}
