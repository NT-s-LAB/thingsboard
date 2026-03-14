// SCADA Editor Types for EITEK Platform
// ============================================================
// ThingsBoard Entity & API Types
// ============================================================

export type TbEntityType = 'DEVICE' | 'ASSET' | 'ENTITY_VIEW' | 'CUSTOMER' | 'TENANT' | 'DASHBOARD';
export type TbAttributeScope = 'SERVER_SCOPE' | 'CLIENT_SCOPE' | 'SHARED_SCOPE';
export type TbAggregation = 'NONE' | 'AVG' | 'MIN' | 'MAX' | 'SUM' | 'COUNT';
export type TbAlarmSeverity = 'CRITICAL' | 'MAJOR' | 'MINOR' | 'WARNING' | 'INDETERMINATE';
export type TbAlarmStatus = 'ACTIVE_UNACK' | 'ACTIVE_ACK' | 'CLEARED_UNACK' | 'CLEARED_ACK';

export interface TbEntityId {
  id: string;
  entityType: TbEntityType;
}

export interface TbRpcConfig {
  method: string;
  params?: Record<string, any>;
  timeout?: number;
  persistent?: boolean;
  oneWay: boolean;
  additionalInfo?: Record<string, any>;
}

export interface TbTimeWindow {
  type: 'realtime' | 'history';
  realtimeMs?: number;
  historyFrom?: number;
  historyTo?: number;
  aggregation?: TbAggregation;
  interval?: number;
}

export interface TbTelemetrySubscription {
  entityType: TbEntityType;
  entityId: string;
  keys: string[];
  timeWindow?: TbTimeWindow;
  latestOnly?: boolean;
}

export interface TbAlarmFilter {
  typeList?: string[];
  severityList?: TbAlarmSeverity[];
  statusList?: TbAlarmStatus[];
  searchPropagatedAlarms?: boolean;
}

// ============================================================
// Widget System Types
// ============================================================

export type WidgetType =
  | 'button'
  | 'gauge'
  | 'chart'
  | 'text'
  | 'image'
  | 'shape'
  | 'container'
  | 'table'
  | 'video'
  | 'map'
  | 'alarm'
  | 'custom'
  | 'switch'
  | 'slider'
  | 'led'
  | 'valueDisplay'
  | 'valve'
  | 'tank'
  | 'motor'
  | 'pipe'
  | 'pump'
  | 'indicator';

export type DataBindingType = 'static' | 'telemetry' | 'attribute' | 'calculation' | 'rpc' | 'function';

export type EventType =
  | 'onClick'
  | 'onDoubleClick'
  | 'onMouseEnter'
  | 'onMouseLeave'
  | 'onChange'
  | 'onDataChange'
  | 'onAlarm'
  | 'onTimer'
  | 'onRpcResponse'
  | 'onConnectionStatus'
  | 'onToggle'
  | 'onTurnOn'
  | 'onTurnOff';

export type ActionType =
  | 'navigate'
  | 'rpcCall'
  | 'updateAttribute'
  | 'showDialog'
  | 'openDashboard'
  | 'custom'
  | 'setVariable'
  | 'sendTelemetry'
  | 'triggerAlarm'
  | 'clearAlarm'
  | 'showNotification';

export interface Point { x: number; y: number; }
export interface Size { width: number; height: number; }
export interface Position extends Point {}

export interface Transform {
  position: Position;
  size: Size;
  rotation?: number;
  scale?: number;
  zIndex?: number;
}

// ============================================================
// Data Binding (ThingsBoard-compatible)
// ============================================================

export interface DataBinding {
  id: string;
  type: DataBindingType;
  label?: string;
  entityType?: TbEntityType;
  entityId?: string;
  entityName?: string;
  telemetryKey?: string;
  aggregation?: TbAggregation;
  timeWindow?: TbTimeWindow;
  postProcessingFn?: string;
  attributeScope?: TbAttributeScope;
  attributeKey?: string;
  rpcConfig?: TbRpcConfig;
  staticValue?: any;
  calculation?: string;
  defaultValue?: any;
  format?: {
    type: 'number' | 'string' | 'date' | 'boolean';
    decimals?: number;
    unit?: string;
    dateFormat?: string;
    prefix?: string;
    suffix?: string;
  };
  thresholds?: Array<{
    id: string;
    operator: 'lt' | 'lte' | 'eq' | 'gte' | 'gt' | 'ne' | 'between';
    value: number;
    valueTo?: number;
    color?: string;
    backgroundColor?: string;
    icon?: string;
    label?: string;
    animation?: string;
  }>;
  updateInterval?: number;
}

// ============================================================
// Widget Actions
// ============================================================

export interface WidgetAction {
  id: string;
  type: ActionType;
  trigger: EventType;
  enabled: boolean;
  name?: string;
  parameters: {
    url?: string;
    targetDashboard?: string;
    targetState?: any;
    openInNewTab?: boolean;
    deviceId?: string;
    method?: string;
    params?: any;
    rpcOneWay?: boolean;
    rpcTimeout?: number;
    rpcPersistent?: boolean;
    attributeScope?: TbAttributeScope;
    attributeKey?: string;
    attributeValue?: any;
    dialogTitle?: string;
    dialogContent?: string;
    dialogType?: 'info' | 'warning' | 'error' | 'confirm';
    script?: string;
    variableName?: string;
    variableValue?: any;
    notificationTitle?: string;
    notificationMessage?: string;
    notificationType?: 'success' | 'info' | 'warning' | 'error';
    alarmType?: string;
    alarmSeverity?: TbAlarmSeverity;
    alarmDetails?: string;
  };
  conditions?: Array<{
    field: string;
    operator: 'eq' | 'ne' | 'gt' | 'gte' | 'lt' | 'lte' | 'contains' | 'startsWith' | 'endsWith';
    value: any;
  }>;
}

// ============================================================
// Widget Styles
// ============================================================

export interface WidgetStyle {
  backgroundColor?: string;
  borderColor?: string;
  borderWidth?: number;
  borderRadius?: number;
  borderStyle?: 'solid' | 'dashed' | 'dotted' | 'none';
  opacity?: number;
  boxShadow?: string;
  fontFamily?: string;
  fontSize?: number;
  fontWeight?: 'normal' | 'bold' | '100' | '200' | '300' | '400' | '500' | '600' | '700' | '800' | '900';
  fontStyle?: 'normal' | 'italic';
  textColor?: string;
  textAlign?: 'left' | 'center' | 'right' | 'justify';
  textDecoration?: 'none' | 'underline' | 'overline' | 'line-through';
  padding?: number;
  animation?: {
    type: 'none' | 'blink' | 'rotate' | 'bounce' | 'fade' | 'slide' | 'pulse' | 'glow';
    duration?: number;
    infinite?: boolean;
  };
}

// ============================================================
// Base Widget & Type-Specific Widgets
// ============================================================

export interface BaseWidget {
  id: string;
  type: WidgetType;
  name: string;
  description?: string;
  transform: Transform;
  style: WidgetStyle;
  visible: boolean;
  enabled: boolean;
  locked: boolean;
  groupId?: string;
  layerId?: string;
  dataBindings: DataBinding[];
  actions: WidgetAction[];
  properties: Record<string, any>;
  createdTime: string;
  updatedTime: string;
  createdBy: string;
}

export interface ButtonWidget extends BaseWidget {
  type: 'button';
  properties: { text: string; icon?: string; variant: 'primary' | 'secondary' | 'success' | 'warning' | 'danger'; size: 'sm' | 'md' | 'lg'; loading?: boolean; rpcMethod?: string; rpcParams?: Record<string, any>; };
}

export interface GaugeWidget extends BaseWidget {
  type: 'gauge';
  properties: { min: number; max: number; value: number; unit?: string; showValue: boolean; showMinMax: boolean; gaugeType: 'circular' | 'linear' | 'donut'; ranges?: Array<{ from: number; to: number; color: string; label?: string }>; needle?: { color: string; width: number }; ticks?: { count: number; showLabels: boolean; color: string }; telemetryKey?: string; };
}

export interface ChartWidget extends BaseWidget {
  type: 'chart';
  properties: { chartType: 'line' | 'bar' | 'pie' | 'doughnut' | 'area' | 'scatter'; datasets: Array<{ label: string; telemetryKey: string; color: string; borderColor?: string; backgroundColor?: string; fill?: boolean; }>; xAxis: { type: 'time' | 'category' | 'linear'; title?: string; min?: any; max?: any }; yAxis: { type: 'linear' | 'logarithmic'; title?: string; min?: number; max?: number }; timeRange?: { duration: number; unit: 'minutes' | 'hours' | 'days'; realtime: boolean }; legend: { show: boolean; position: 'top' | 'bottom' | 'left' | 'right' }; grid: { show: boolean; color: string }; };
}

export interface TextWidget extends BaseWidget {
  type: 'text';
  properties: { text: string; html?: boolean; markdown?: boolean; autoSize?: boolean; wordWrap?: boolean; maxLength?: number; placeholder?: string; readonly?: boolean; telemetryPattern?: string; };
}

export interface ImageWidget extends BaseWidget {
  type: 'image';
  properties: { src: string; alt?: string; objectFit: 'contain' | 'cover' | 'fill' | 'none' | 'scale-down'; loading: 'eager' | 'lazy'; clickable?: boolean; overlay?: { show: boolean; content: string; position: 'top' | 'bottom' | 'left' | 'right' | 'center' }; };
}

export interface ShapeWidget extends BaseWidget {
  type: 'shape';
  properties: { shape: 'rectangle' | 'circle' | 'ellipse' | 'polygon' | 'line' | 'arrow'; fill: boolean; fillColor?: string; strokeColor?: string; strokeWidth?: number; strokeStyle?: 'solid' | 'dashed' | 'dotted'; points?: Point[]; radius?: number; radiusX?: number; radiusY?: number; };
}

export interface ContainerWidget extends BaseWidget {
  type: 'container';
  properties: { layout: 'free' | 'grid' | 'flex'; padding: number; gap?: number; scrollable: boolean; children: string[]; gridColumns?: number; gridRows?: number; flexDirection?: 'row' | 'column'; justifyContent?: 'flex-start' | 'center' | 'flex-end' | 'space-between' | 'space-around'; alignItems?: 'flex-start' | 'center' | 'flex-end' | 'stretch'; };
}

export interface SwitchWidget extends BaseWidget {
  type: 'switch';
  properties: { onLabel: string; offLabel: string; onValue: any; offValue: any; onColor: string; offColor: string; rpcMethod?: string; telemetryKey?: string; attributeKey?: string; onImageUrl?: string; offImageUrl?: string; };
}

export interface SliderWidget extends BaseWidget {
  type: 'slider';
  properties: { min: number; max: number; step: number; value: number; showValue: boolean; orientation: 'horizontal' | 'vertical'; trackColor: string; thumbColor: string; rpcMethod?: string; telemetryKey?: string; unit?: string; };
}

export interface LedWidget extends BaseWidget {
  type: 'led';
  properties: { onColor: string; offColor: string; blinkOnAlarm: boolean; size: 'sm' | 'md' | 'lg'; shape: 'circle' | 'square'; telemetryKey?: string; onValue?: any; label?: string; };
}

export interface ValueDisplayWidget extends BaseWidget {
  type: 'valueDisplay';
  properties: { value: string; label: string; unit: string; decimals: number; prefix: string; suffix: string; showTrend: boolean; trendUpColor: string; trendDownColor: string; telemetryKey?: string; thresholds?: Array<{ value: number; color: string }>; };
}

export interface ValveWidget extends BaseWidget {
  type: 'valve';
  properties: { valveType: 'gate' | 'butterfly' | 'ball' | 'check'; openColor: string; closedColor: string; faultColor: string; transitColor: string; showLabel: boolean; label?: string; orientation: 'horizontal' | 'vertical'; telemetryKey?: string; rpcMethodOpen?: string; rpcMethodClose?: string; states: Array<{ value: any; label: string; color: string }>; };
}

export interface TankWidget extends BaseWidget {
  type: 'tank';
  properties: { minLevel: number; maxLevel: number; showLevel: boolean; showScale: boolean; fillColor: string; emptyColor: string; warningLevel: number; criticalLevel: number; warningColor: string; criticalColor: string; unit: string; label?: string; telemetryKey?: string; };
}

export interface MotorWidget extends BaseWidget {
  type: 'motor';
  properties: { showRPM: boolean; showStatus: boolean; runningColor: string; stoppedColor: string; faultColor: string; ratedRPM: number; ratedPower: string; label?: string; telemetryKeyStatus?: string; telemetryKeyRPM?: string; rpcMethodStart?: string; rpcMethodStop?: string; };
}

export interface PipeWidget extends BaseWidget {
  type: 'pipe';
  properties: { flowDirection: 'left-to-right' | 'right-to-left' | 'top-to-bottom' | 'bottom-to-top'; showFlow: boolean; flowSpeed: number; pipeWidth: number; pipeColor: string; flowColor: string; fluidColor: string; connectorType: 'none' | 'flange' | 'threaded' | 'welded'; telemetryKeyFlow?: string; telemetryKeyPressure?: string; };
}

export interface PumpWidget extends BaseWidget {
  type: 'pump';
  properties: { pumpType: 'centrifugal' | 'reciprocating' | 'submersible'; runningColor: string; stoppedColor: string; faultColor: string; showStatus: boolean; showFlow: boolean; label?: string; telemetryKeyStatus?: string; telemetryKeyFlow?: string; rpcMethodStart?: string; rpcMethodStop?: string; };
}

export interface IndicatorWidget extends BaseWidget {
  type: 'indicator';
  properties: { indicatorType: 'status' | 'traffic-light' | 'bar' | 'ring'; states: Array<{ value: any; label: string; color: string; icon?: string }>; telemetryKey?: string; label?: string; showLabel: boolean; showValue: boolean; };
}

export interface AlarmWidget extends BaseWidget {
  type: 'alarm';
  properties: { severityFilter: TbAlarmSeverity[]; soundEnabled: boolean; autoAcknowledge: boolean; showTimestamp: boolean; };
}

export interface TableWidget extends BaseWidget {
  type: 'table';
  properties: { columns: Array<{ key: string; label: string; width?: number }>; pageSize: number; sortable: boolean; filterable: boolean; };
}

export interface VideoWidget extends BaseWidget {
  type: 'video';
  properties: { url: string; autoplay: boolean; controls: boolean; loop: boolean; };
}

export interface MapWidget extends BaseWidget {
  type: 'map';
  properties: { center: { lat: number; lng: number }; zoom: number; mapType: 'roadmap' | 'satellite' | 'hybrid' | 'terrain'; markers: Array<{ lat: number; lng: number; title?: string; color?: string }>; };
}

export interface CustomWidget extends BaseWidget {
  type: 'custom';
  properties: Record<string, any>;
}

export type Widget =
  | ButtonWidget | GaugeWidget | ChartWidget | TextWidget | ImageWidget
  | ShapeWidget | ContainerWidget | SwitchWidget | SliderWidget | LedWidget
  | ValueDisplayWidget | ValveWidget | TankWidget | MotorWidget | PipeWidget
  | PumpWidget | IndicatorWidget | AlarmWidget | TableWidget | VideoWidget
  | MapWidget | CustomWidget;

// ============================================================
// Dashboard & Editor Types
// ============================================================

export interface ScadaLayer { id: string; name: string; visible: boolean; locked: boolean; opacity: number; order: number; widgets: string[]; }

export interface ScadaVariable { id: string; name: string; type: 'string' | 'number' | 'boolean' | 'object'; value: any; description?: string; scope: 'global' | 'dashboard' | 'widget'; }

export interface ScadaScript { id: string; name: string; description?: string; content: string; language: 'javascript' | 'typescript'; triggers: Array<{ type: 'startup' | 'shutdown' | 'interval' | 'dataChange' | 'custom'; condition?: string; interval?: number; }>; enabled: boolean; }

export interface ScadaDashboard {
  id: string;
  name: string;
  description?: string;
  icon?: string;
  projectId: string;
  canvasSize: Size;
  backgroundColor?: string;
  backgroundImage?: string;
  widgets: Widget[];
  layers: ScadaLayer[];
  variables: ScadaVariable[];
  scripts: ScadaScript[];
  settings: {
    grid: { enabled: boolean; size: number; color: string; snap: boolean };
    zoom: { min: number; max: number; default: number };
    runtime: { autoStart: boolean; refreshRate: number; maxDataPoints: number };
    security: { readonly: boolean; allowedUsers?: string[]; allowedRoles?: string[] };
  };
  version: string;
  versionHistory?: Array<{ version: string; timestamp: string; author: string; changes: string }>;
  tags?: string[];
  createdTime: string;
  updatedTime: string;
  createdBy: string;
  lastModifiedBy: string;
}

export interface ScadaTemplate {
  id: string; name: string; description?: string; category: string; thumbnail?: string;
  widgets: Widget[]; variables: ScadaVariable[]; preview?: string;
  metadata: { author: string; version: string; tags: string[]; compatibility: string[]; documentation?: string; };
  createdTime: string; updatedTime: string;
}

export interface EditorViewport { position: Point; zoom: number; size: Size; }
export interface EditorSelection { selectedWidgetIds: string[]; selectionBounds?: { x: number; y: number; width: number; height: number }; }
export interface EditorClipboard { widgets: Widget[]; operation: 'copy' | 'cut'; timestamp: string; }
export interface EditorHistory { past: Array<{ action: string; data: any; timestamp: string }>; future: Array<{ action: string; data: any; timestamp: string }>; maxSize: number; }

export interface EditorState {
  mode: 'design' | 'runtime' | 'debug';
  viewport: EditorViewport;
  selection: EditorSelection;
  clipboard: EditorClipboard | null;
  history: EditorHistory;
  showGrid: boolean;
  snapToGrid: boolean;
  showRulers: boolean;
  showGuides: boolean;
  leftPanelWidth: number;
  rightPanelWidth: number;
  bottomPanelHeight: number;
  activeTool: 'select' | 'pan' | 'zoom' | 'draw' | 'text' | 'measure';
  drawingShape?: WidgetType;
}

// ============================================================
// Custom Widget Registry
// ============================================================

export interface CustomWidgetDefinition {
  id: string;
  name: string;
  description?: string;
  category: string;
  icon?: string;
  svgContent?: string;
  defaultSize: Size;
  defaultProperties: Record<string, any>;
  defaultStyle: Partial<WidgetStyle>;
  propertySchema: Array<{
    key: string; label: string;
    type: 'string' | 'number' | 'boolean' | 'color' | 'select' | 'json';
    defaultValue?: any;
    options?: Array<{ label: string; value: any }>;
    min?: number; max?: number;
  }>;
  dataBindingSupport: boolean;
  rpcSupport: boolean;
  createdTime: string;
  createdBy: string;
}

// ============================================================
// Default Widget Properties & Size Helpers
// ============================================================

export function getDefaultWidgetProperties(type: WidgetType): Record<string, any> {
  const defaults: Record<string, Record<string, any>> = {
    button: { text: 'Button', variant: 'primary', size: 'md' },
    text: { text: 'Text Label', html: false, wordWrap: true, autoSize: false },
    gauge: { min: 0, max: 100, value: 0, unit: '', gaugeType: 'circular', showValue: true, showMinMax: true, ranges: [] },
    chart: { chartType: 'line', datasets: [], xAxis: { type: 'time' }, yAxis: { type: 'linear' }, legend: { show: true, position: 'top' }, grid: { show: true, color: '#E5E7EB' } },
    image: { src: '', alt: '', objectFit: 'contain', loading: 'lazy' },
    shape: { shape: 'rectangle', fill: true, fillColor: '#E5E7EB', strokeColor: '#374151', strokeWidth: 1, strokeStyle: 'solid' },
    container: { layout: 'free', padding: 8, scrollable: false, children: [] },
    switch: { onLabel: 'ON', offLabel: 'OFF', onValue: true, offValue: false, onColor: '#22C55E', offColor: '#9CA3AF' },
    slider: { min: 0, max: 100, step: 1, value: 50, showValue: true, orientation: 'horizontal', trackColor: '#E5E7EB', thumbColor: '#3B82F6' },
    led: { onColor: '#22C55E', offColor: '#6B7280', blinkOnAlarm: false, size: 'md', shape: 'circle', label: '' },
    valueDisplay: { value: '0', label: 'Value', unit: '', decimals: 2, prefix: '', suffix: '', showTrend: false, trendUpColor: '#22C55E', trendDownColor: '#EF4444' },
    valve: { valveType: 'gate', openColor: '#22C55E', closedColor: '#EF4444', faultColor: '#F59E0B', transitColor: '#3B82F6', showLabel: true, orientation: 'horizontal', states: [{ value: 0, label: 'Closed', color: '#EF4444' }, { value: 1, label: 'Open', color: '#22C55E' }] },
    tank: { minLevel: 0, maxLevel: 100, showLevel: true, showScale: true, fillColor: '#3B82F6', emptyColor: '#F3F4F6', warningLevel: 80, criticalLevel: 95, warningColor: '#F59E0B', criticalColor: '#EF4444', unit: '%' },
    motor: { showRPM: true, showStatus: true, runningColor: '#22C55E', stoppedColor: '#6B7280', faultColor: '#EF4444', ratedRPM: 1800, ratedPower: '5.5 kW' },
    pipe: { flowDirection: 'left-to-right', showFlow: true, flowSpeed: 1, pipeWidth: 8, pipeColor: '#6B7280', flowColor: '#3B82F6', fluidColor: '#60A5FA', connectorType: 'none' },
    pump: { pumpType: 'centrifugal', runningColor: '#22C55E', stoppedColor: '#6B7280', faultColor: '#EF4444', showStatus: true, showFlow: false },
    indicator: { indicatorType: 'status', states: [{ value: 0, label: 'Off', color: '#6B7280' }, { value: 1, label: 'On', color: '#22C55E' }, { value: 2, label: 'Fault', color: '#EF4444' }], showLabel: true, showValue: false },
    alarm: { severityFilter: ['CRITICAL', 'MAJOR', 'MINOR', 'WARNING'], soundEnabled: false, autoAcknowledge: false, showTimestamp: true },
    table: { columns: [], pageSize: 10, sortable: true, filterable: true },
    video: { url: '', autoplay: false, controls: true, loop: false },
    map: { center: { lat: 10.762622, lng: 106.660172 }, zoom: 13, mapType: 'roadmap' },
    custom: {},
  };
  return defaults[type] || {};
}

export function getDefaultWidgetSize(type: WidgetType): Size {
  const sizes: Record<string, Size> = {
    button: { width: 120, height: 40 }, text: { width: 150, height: 30 },
    gauge: { width: 200, height: 200 }, chart: { width: 400, height: 250 },
    image: { width: 200, height: 150 }, shape: { width: 100, height: 100 },
    container: { width: 300, height: 200 }, switch: { width: 80, height: 40 },
    slider: { width: 200, height: 30 }, led: { width: 40, height: 40 },
    valueDisplay: { width: 160, height: 80 }, valve: { width: 60, height: 60 },
    tank: { width: 100, height: 180 }, motor: { width: 80, height: 80 },
    pipe: { width: 200, height: 20 }, pump: { width: 80, height: 80 },
    indicator: { width: 80, height: 80 }, alarm: { width: 300, height: 200 },
    table: { width: 400, height: 300 },
  };
  return sizes[type] || { width: 100, height: 100 };
}

// ============================================================
// API Types
// ============================================================

export interface DashboardCreateRequest { name: string; description?: string; icon?: string; projectId: string; templateId?: string; canvasSize?: Size; }
export interface DashboardUpdateRequest { id: string; name?: string; description?: string; icon?: string; widgets?: Widget[]; layers?: ScadaLayer[]; variables?: ScadaVariable[]; scripts?: ScadaScript[]; settings?: ScadaDashboard['settings']; }
export interface DashboardListParams { projectId?: string; search?: string; tags?: string[]; createdBy?: string; page?: number; pageSize?: number; }
export interface DashboardListResponse { data: ScadaDashboard[]; totalElements: number; totalPages: number; hasNext: boolean; }
