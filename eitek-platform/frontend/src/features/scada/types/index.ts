// SCADA Editor Types for EITEK Platform
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
  | 'custom';

export type DataBindingType = 'static' | 'telemetry' | 'attribute' | 'calculation' | 'rpc';

export type EventType = 
  | 'onClick'
  | 'onDoubleClick'
  | 'onMouseEnter'
  | 'onMouseLeave'
  | 'onChange'
  | 'onDataChange'
  | 'onAlarm'
  | 'onTimer';

export type ActionType = 
  | 'navigate'
  | 'rpcCall'
  | 'updateAttribute'
  | 'showDialog'
  | 'openDashboard'
  | 'custom'
  | 'setVariable';

export interface Point {
  x: number;
  y: number;
}

export interface Size {
  width: number;
  height: number;
}

export interface Position extends Point {}

export interface Transform {
  position: Position;
  size: Size;
  rotation?: number;
  scale?: number;
  zIndex?: number;
}

export interface DataBinding {
  id: string;
  type: DataBindingType;
  deviceId?: string;
  attributeKey?: string;
  telemetryKey?: string;
  calculation?: string;
  defaultValue?: any;
  format?: {
    type: 'number' | 'string' | 'date' | 'boolean';
    decimals?: number;
    unit?: string;
    dateFormat?: string;
  };
  conditions?: Array<{
    condition: string;
    value: any;
    style?: any;
  }>;
}

export interface WidgetAction {
  id: string;
  type: ActionType;
  trigger: EventType;
  enabled: boolean;
  parameters: {
    // Navigation
    url?: string;
    targetDashboard?: string;
    targetState?: any;
    
    // RPC
    deviceId?: string;
    method?: string;
    params?: any;
    
    // Attribute update
    attributeScope?: 'SERVER_SCOPE' | 'CLIENT_SCOPE' | 'SHARED_SCOPE';
    attributeKey?: string;
    attributeValue?: any;
    
    // Dialog
    dialogTitle?: string;
    dialogContent?: string;
    dialogType?: 'info' | 'warning' | 'error' | 'confirm';
    
    // Custom script
    script?: string;
    
    // Variable
    variableName?: string;
    variableValue?: any;
  };
  conditions?: Array<{
    field: string;
    operator: 'eq' | 'ne' | 'gt' | 'gte' | 'lt' | 'lte' | 'contains';
    value: any;
  }>;
}

export interface WidgetStyle {
  // Common styles
  backgroundColor?: string;
  borderColor?: string;
  borderWidth?: number;
  borderRadius?: number;
  opacity?: number;
  boxShadow?: string;
  
  // Text styles
  fontFamily?: string;
  fontSize?: number;
  fontWeight?: 'normal' | 'bold' | '100' | '200' | '300' | '400' | '500' | '600' | '700' | '800' | '900';
  fontStyle?: 'normal' | 'italic';
  textColor?: string;
  textAlign?: 'left' | 'center' | 'right' | 'justify';
  textDecoration?: 'none' | 'underline' | 'overline' | 'line-through';
  
  // Animation
  animation?: {
    type: 'none' | 'blink' | 'rotate' | 'bounce' | 'fade' | 'slide';
    duration?: number;
    infinite?: boolean;
  };
}

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
  
  // Data bindings
  dataBindings: DataBinding[];
  
  // Actions and events
  actions: WidgetAction[];
  
  // Custom properties specific to widget type
  properties: Record<string, any>;
  
  // Metadata
  createdTime: string;
  updatedTime: string;
  createdBy: string;
}

// Specific widget types
export interface ButtonWidget extends BaseWidget {
  type: 'button';
  properties: {
    text: string;
    icon?: string;
    variant: 'primary' | 'secondary' | 'success' | 'warning' | 'danger';
    size: 'sm' | 'md' | 'lg';
    loading?: boolean;
  };
}

export interface GaugeWidget extends BaseWidget {
  type: 'gauge';
  properties: {
    min: number;
    max: number;
    value: number;
    unit?: string;
    showValue: boolean;
    showMinMax: boolean;
    gaugeType: 'circular' | 'linear' | 'donut';
    ranges?: Array<{
      from: number;
      to: number;
      color: string;
      label?: string;
    }>;
    needle?: {
      color: string;
      width: number;
    };
    ticks?: {
      count: number;
      showLabels: boolean;
      color: string;
    };
  };
}

export interface ChartWidget extends BaseWidget {
  type: 'chart';
  properties: {
    chartType: 'line' | 'bar' | 'pie' | 'doughnut' | 'area' | 'scatter';
    datasets: Array<{
      label: string;
      dataBinding: string;
      color: string;
      borderColor?: string;
      backgroundColor?: string;
      fill?: boolean;
    }>;
    xAxis: {
      type: 'time' | 'category' | 'linear';
      title?: string;
      min?: any;
      max?: any;
    };
    yAxis: {
      type: 'linear' | 'logarithmic';
      title?: string;
      min?: number;
      max?: number;
    };
    timeRange?: {
      duration: number;
      unit: 'minutes' | 'hours' | 'days';
      realtime: boolean;
    };
    legend: {
      show: boolean;
      position: 'top' | 'bottom' | 'left' | 'right';
    };
    grid: {
      show: boolean;
      color: string;
    };
  };
}

export interface TextWidget extends BaseWidget {
  type: 'text';
  properties: {
    text: string;
    html?: boolean;
    markdown?: boolean;
    autoSize?: boolean;
    wordWrap?: boolean;
    maxLength?: number;
    placeholder?: string;
    readonly?: boolean;
  };
}

export interface ImageWidget extends BaseWidget {
  type: 'image';
  properties: {
    src: string;
    alt?: string;
    objectFit: 'contain' | 'cover' | 'fill' | 'none' | 'scale-down';
    loading: 'eager' | 'lazy';
    clickable?: boolean;
    overlay?: {
      show: boolean;
      content: string;
      position: 'top' | 'bottom' | 'left' | 'right' | 'center';
    };
  };
}

export interface ShapeWidget extends BaseWidget {
  type: 'shape';
  properties: {
    shape: 'rectangle' | 'circle' | 'ellipse' | 'polygon' | 'line' | 'arrow';
    fill: boolean;
    fillColor?: string;
    strokeColor?: string;
    strokeWidth?: number;
    strokeStyle?: 'solid' | 'dashed' | 'dotted';
    points?: Point[]; // For polygon and line
    radius?: number; // For circle
    radiusX?: number; // For ellipse
    radiusY?: number; // For ellipse
  };
}

export interface ContainerWidget extends BaseWidget {
  type: 'container';
  properties: {
    layout: 'free' | 'grid' | 'flex';
    padding: number;
    gap?: number;
    scrollable: boolean;
    children: string[]; // Widget IDs
    
    // Grid layout specific
    gridColumns?: number;
    gridRows?: number;
    
    // Flex layout specific
    flexDirection?: 'row' | 'column';
    justifyContent?: 'flex-start' | 'center' | 'flex-end' | 'space-between' | 'space-around';
    alignItems?: 'flex-start' | 'center' | 'flex-end' | 'stretch';
  };
}

export type Widget = ButtonWidget | GaugeWidget | ChartWidget | TextWidget | ImageWidget | ShapeWidget | ContainerWidget;

export interface ScadaLayer {
  id: string;
  name: string;
  visible: boolean;
  locked: boolean;
  opacity: number;
  order: number;
  widgets: string[]; // Widget IDs
}

export interface ScadaVariable {
  id: string;
  name: string;
  type: 'string' | 'number' | 'boolean' | 'object';
  value: any;
  description?: string;
  scope: 'global' | 'dashboard' | 'widget';
}

export interface ScadaScript {
  id: string;
  name: string;
  description?: string;
  content: string;
  language: 'javascript' | 'typescript';
  triggers: Array<{
    type: 'startup' | 'shutdown' | 'interval' | 'dataChange' | 'custom';
    condition?: string;
    interval?: number;
  }>;
  enabled: boolean;
}

export interface ScadaDashboard {
  id: string;
  name: string;
  description?: string;
  projectId: string;
  
  // Layout
  canvasSize: Size;
  backgroundColor?: string;
  backgroundImage?: string;
  
  // Content
  widgets: Widget[];
  layers: ScadaLayer[];
  variables: ScadaVariable[];
  scripts: ScadaScript[];
  
  // Settings
  settings: {
    grid: {
      enabled: boolean;
      size: number;
      color: string;
      snap: boolean;
    };
    zoom: {
      min: number;
      max: number;
      default: number;
    };
    runtime: {
      autoStart: boolean;
      refreshRate: number;
      maxDataPoints: number;
    };
    security: {
      readonly: boolean;
      allowedUsers?: string[];
      allowedRoles?: string[];
    };
  };
  
  // Version control
  version: string;
  versionHistory?: Array<{
    version: string;
    timestamp: string;
    author: string;
    changes: string;
  }>;
  
  // Metadata
  tags?: string[];
  createdTime: string;
  updatedTime: string;
  createdBy: string;
  lastModifiedBy: string;
}

export interface ScadaTemplate {
  id: string;
  name: string;
  description?: string;
  category: string;
  thumbnail?: string;
  widgets: Widget[];
  variables: ScadaVariable[];
  preview?: string;
  
  metadata: {
    author: string;
    version: string;
    tags: string[];
    compatibility: string[];
    documentation?: string;
  };
  
  createdTime: string;
  updatedTime: string;
}

// Editor state and UI types
export interface EditorViewport {
  position: Point;
  zoom: number;
  size: Size;
}

export interface EditorSelection {
  selectedWidgetIds: string[];
  selectionBounds?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

export interface EditorClipboard {
  widgets: Widget[];
  operation: 'copy' | 'cut';
  timestamp: string;
}

export interface EditorHistory {
  past: Array<{
    action: string;
    data: any;
    timestamp: string;
  }>;
  future: Array<{
    action: string;
    data: any;
    timestamp: string;
  }>;
  maxSize: number;
}

export interface EditorState {
  mode: 'design' | 'runtime' | 'debug';
  viewport: EditorViewport;
  selection: EditorSelection;
  clipboard: EditorClipboard | null;
  history: EditorHistory;
  
  // UI state
  showGrid: boolean;
  snapToGrid: boolean;
  showRulers: boolean;
  showGuides: boolean;
  
  // Panels
  leftPanelWidth: number;
  rightPanelWidth: number;
  bottomPanelHeight: number;
  
  // Tools
  activeTool: 'select' | 'pan' | 'zoom' | 'draw' | 'text' | 'measure';
  drawingShape?: WidgetType;
}

// API types
export interface DashboardCreateRequest {
  name: string;
  description?: string;
  projectId: string;
  templateId?: string;
  canvasSize?: Size;
}

export interface DashboardUpdateRequest {
  id: string;
  name?: string;
  description?: string;
  widgets?: Widget[];
  layers?: ScadaLayer[];
  variables?: ScadaVariable[];
  scripts?: ScadaScript[];
  settings?: ScadaDashboard['settings'];
}

export interface DashboardListParams {
  projectId?: string;
  search?: string;
  tags?: string[];
  createdBy?: string;
  page?: number;
  pageSize?: number;
}

export interface DashboardListResponse {
  data: ScadaDashboard[];
  totalElements: number;
  totalPages: number;
  hasNext: boolean;
}