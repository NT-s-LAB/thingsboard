# EITEK Platform Frontend Data Models

## Core Entity Types

### 1. User & Authentication Types

```typescript
// shared/types/auth.types.ts
export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  avatar?: string;
  isActive: boolean;
  lastLoginAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  
  // Relations
  tenantId: string;
  roleId: string;
  role: Role;
  tenant: Tenant;
}

export interface Tenant {
  id: string;
  name: string;
  code: string;
  logo?: string;
  isActive: boolean;
  subscriptionPlan: SubscriptionPlan;
  createdAt: Date;
  updatedAt: Date;
}

export interface Role {
  id: string;
  name: string;
  description?: string;
  permissions: Permission[];
  isSystemRole: boolean;
}

export interface Permission {
  id: string;
  name: string;
  resource: string;
  action: string;
  description?: string;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  user: User;
  permissions: string[];
}
```

### 2. Project Hierarchy Types

```typescript
// shared/types/project.types.ts
export interface Project {
  id: string;
  name: string;
  description?: string;
  code: string;
  status: ProjectStatus;
  startDate?: Date;
  endDate?: Date;
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
  
  // Relations
  tenantId: string;
  sites: Site[];
  
  // Computed
  siteCount: number;
  deviceCount: number;
  lastActivity?: Date;
}

export interface Site {
  id: string;
  name: string;
  description?: string;
  code: string;
  address?: string;
  coordinates?: Coordinates;
  timeZone: string;
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
  
  // Relations
  projectId: string;
  project: Project;
  areas: Area[];
  
  // Computed
  areaCount: number;
  deviceCount: number;
}

export interface Area {
  id: string;
  name: string;
  description?: string;
  code: string;
  type: AreaType;
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
  
  // Relations
  siteId: string;
  site: Site;
  devices: Device[];
  scadaViews: ScadaView[];
  
  // Computed
  deviceCount: number;
  alarmCount: number;
}

export type ProjectStatus = 'PLANNING' | 'ACTIVE' | 'MAINTENANCE' | 'COMPLETED' | 'ARCHIVED';
export type AreaType = 'PRODUCTION' | 'WAREHOUSE' | 'OFFICE' | 'UTILITY' | 'OUTDOOR';

export interface Coordinates {
  latitude: number;
  longitude: number;
}
```

### 3. Device & IoT Types

```typescript
// shared/types/device.types.ts
export interface Device {
  id: string;
  name: string;
  description?: string;
  code: string;
  type: string;
  category: DeviceCategory;
  status: DeviceStatus;
  isOnline: boolean;
  lastSeenAt?: Date;
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
  
  // ThingsBoard Integration
  thingsBoardDeviceId?: string;
  thingsBoardToken?: string;
  
  // Relations
  areaId: string;
  area: Area;
  deviceTemplateId?: string;
  deviceTemplate?: DeviceTemplate;
  
  // Computed
  telemetryKeys: string[];
  attributeKeys: string[];
  alarmCount: number;
  
  // Real-time data (not persisted)
  telemetry?: Record<string, TelemetryValue>;
  attributes?: Record<string, AttributeValue>;
  alarms?: Alarm[];
}

export interface DeviceTemplate {
  id: string;
  name: string;
  description?: string;
  category: DeviceCategory;
  manufacturer?: string;
  model?: string;
  version?: string;
  isBuiltIn: boolean;
  
  // Configuration
  telemetryConfig: TelemetryConfig[];
  attributeConfig: AttributeConfig[];
  commandConfig: CommandConfig[];
  alarmConfig: AlarmConfig[];
  
  // UI Configuration
  deviceUIConfig: DeviceUIConfig;
  iconUrl?: string;
  symbolUrl?: string;
  
  createdAt: Date;
  updatedAt: Date;
}

export type DeviceCategory = 
  | 'SENSOR'
  | 'ACTUATOR' 
  | 'CONTROLLER'
  | 'GATEWAY'
  | 'DISPLAY'
  | 'CAMERA'
  | 'METER'
  | 'OTHER';

export type DeviceStatus = 
  | 'ACTIVE'
  | 'INACTIVE'
  | 'MAINTENANCE'
  | 'ERROR'
  | 'OFFLINE';

export interface TelemetryValue {
  value: any;
  timestamp: number;
  unit?: string;
}

export interface AttributeValue {
  value: any;
  lastUpdateTs: number;
}

export interface TelemetryConfig {
  key: string;
  name: string;
  type: DataType;
  unit?: string;
  minValue?: number;
  maxValue?: number;
  precision?: number;
  description?: string;
}

export interface AttributeConfig {
  key: string;
  name: string;
  type: DataType;
  isReadOnly: boolean;
  defaultValue?: any;
  description?: string;
}

export interface CommandConfig {
  name: string;
  method: string;
  parameters: ParameterConfig[];
  description?: string;
}

export interface ParameterConfig {
  name: string;
  type: DataType;
  required: boolean;
  defaultValue?: any;
  validation?: ValidationRule[];
}

export type DataType = 
  | 'BOOLEAN'
  | 'INTEGER'
  | 'DOUBLE'
  | 'STRING'
  | 'JSON'
  | 'DATETIME';
```

### 4. SCADA & Widget Types

```typescript
// shared/types/scada.types.ts
export interface ScadaView {
  id: string;
  name: string;
  description?: string;
  type: ScadaViewType;
  isPublic: boolean;
  configuration: ScadaConfiguration;
  createdAt: Date;
  updatedAt: Date;
  
  // Relations
  areaId: string;
  area: Area;
  createdByUserId: string;
  createdBy: User;
}

export interface ScadaConfiguration {
  canvas: CanvasConfiguration;
  widgets: WidgetConfiguration[];
  connections: WidgetConnection[];
  layers: Layer[];
  settings: ScadaSettings;
}

export interface CanvasConfiguration {
  width: number;
  height: number;
  backgroundColor: string;
  backgroundImage?: string;
  grid: GridConfiguration;
  zoom: ZoomConfiguration;
}

export interface GridConfiguration {
  enabled: boolean;
  size: number;
  color: string;
  snapToGrid: boolean;
}

export interface ZoomConfiguration {
  min: number;
  max: number;
  current: number;
  center: Point;
}

export interface WidgetConfiguration {
  id: string;
  type: WidgetType;
  position: Position;
  size: Size;
  rotation: number;
  zIndex: number;
  visible: boolean;
  locked: boolean;
  
  // Widget-specific configuration
  properties: Record<string, any>;
  
  // Data binding
  dataSources: DataSource[];
  
  // Styling
  style: WidgetStyle;
  
  // Interactions
  interactions: WidgetInteraction[];
}

export interface Layer {
  id: string;
  name: string;
  visible: boolean;
  locked: boolean;
  opacity: number;
  widgetIds: string[];
}

export interface Position {
  x: number;
  y: number;
}

export interface Size {
  width: number;
  height: number;
}

export interface Point {
  x: number;
  y: number;
}

export type ScadaViewType = 'OVERVIEW' | 'DETAIL' | 'CONTROL' | 'MONITORING';

export type WidgetType = 
  | 'TEXT'
  | 'IMAGE'
  | 'BUTTON'
  | 'GAUGE'
  | 'CHART'
  | 'TANK'
  | 'PIPE'
  | 'VALVE'
  | 'PUMP'
  | 'MOTOR'
  | 'INDICATOR'
  | 'ALARM_PANEL'
  | 'CUSTOM';

export interface DataSource {
  id: string;
  type: DataSourceType;
  deviceId?: string;
  telemetryKey?: string;
  attributeKey?: string;
  expression?: string;
  aggregation?: AggregationType;
  interval?: number;
}

export type DataSourceType = 'TELEMETRY' | 'ATTRIBUTE' | 'ALARM' | 'CALCULATION';
export type AggregationType = 'AVG' | 'MIN' | 'MAX' | 'SUM' | 'COUNT' | 'NONE';

export interface WidgetStyle {
  backgroundColor?: string;
  borderColor?: string;
  borderWidth?: number;
  borderRadius?: number;
  opacity?: number;
  fontSize?: number;
  fontFamily?: string;
  fontWeight?: string;
  color?: string;
  
  // Custom CSS
  customCSS?: string;
}

export interface WidgetInteraction {
  trigger: InteractionTrigger;
  action: InteractionAction;
  condition?: string;
  parameters?: Record<string, any>;
}

export type InteractionTrigger = 'CLICK' | 'DOUBLE_CLICK' | 'HOVER' | 'VALUE_CHANGE' | 'ALARM';
export type InteractionAction = 'NAVIGATE' | 'SEND_COMMAND' | 'SHOW_POPUP' | 'CHANGE_COLOR' | 'ANIMATE';

export interface WidgetConnection {
  id: string;
  fromWidgetId: string;
  toWidgetId: string;
  fromPoint: ConnectionPoint;
  toPoint: ConnectionPoint;
  style: ConnectionStyle;
}

export interface ConnectionPoint {
  x: number;
  y: number;
  direction: 'TOP' | 'RIGHT' | 'BOTTOM' | 'LEFT';
}

export interface ConnectionStyle {
  color: string;
  width: number;
  style: 'SOLID' | 'DASHED' | 'DOTTED';
  animated: boolean;
}

export interface ScadaSettings {
  autoRefresh: boolean;
  refreshInterval: number;
  showGrid: boolean;
  snapToGrid: boolean;
  allowEdit: boolean;
  showAlarms: boolean;
  playSound: boolean;
}
```

### 5. Alarm & Event Types

```typescript
// shared/types/alarm.types.ts
export interface Alarm {
  id: string;
  type: string;
  severity: AlarmSeverity;
  status: AlarmStatus;
  title: string;
  message: string;
  details?: Record<string, any>;
  
  // Timestamps
  startTs: number;
  endTs?: number;
  ackTs?: number;
  clearTs?: number;
  
  // Relations
  deviceId: string;
  device: Device;
  ackByUserId?: string;
  ackByUser?: User;
  
  // ThingsBoard Integration
  thingsBoardAlarmId?: string;
}

export interface AlarmRule {
  id: string;
  name: string;
  description?: string;
  type: string;
  severity: AlarmSeverity;
  condition: AlarmCondition;
  isActive: boolean;
  
  // Relations
  deviceTemplateId: string;
  deviceTemplate: DeviceTemplate;
}

export interface AlarmCondition {
  key: string;
  operation: AlarmOperation;
  value: any;
  threshold?: AlarmThreshold;
}

export interface AlarmThreshold {
  warning?: number;
  minor?: number;
  major?: number;
  critical?: number;
}

export type AlarmSeverity = 'CRITICAL' | 'MAJOR' | 'MINOR' | 'WARNING' | 'INDETERMINATE';
export type AlarmStatus = 'ACTIVE_UNACK' | 'ACTIVE_ACK' | 'CLEARED_UNACK' | 'CLEARED_ACK';
export type AlarmOperation = 'GREATER' | 'GREATER_OR_EQUAL' | 'LESS' | 'LESS_OR_EQUAL' | 'EQUAL' | 'NOT_EQUAL';

export interface Event {
  id: string;
  type: EventType;
  level: EventLevel;
  message: string;
  details?: Record<string, any>;
  timestamp: number;
  
  // Relations
  userId?: string;
  deviceId?: string;
  entityId?: string;
  entityType?: string;
}

export type EventType = 
  | 'USER_LOGIN'
  | 'USER_LOGOUT'
  | 'DEVICE_CONNECTED'
  | 'DEVICE_DISCONNECTED'
  | 'DATA_RECEIVED'
  | 'COMMAND_SENT'
  | 'ALARM_CREATED'
  | 'ALARM_ACKNOWLEDGED'
  | 'ALARM_CLEARED'
  | 'SYSTEM_ERROR';

export type EventLevel = 'INFO' | 'WARNING' | 'ERROR' | 'DEBUG';
```

### 6. UI State Types

```typescript
// shared/types/ui.types.ts
export interface UIState {
  // Layout
  sidebarCollapsed: boolean;
  theme: Theme;
  language: Language;
  
  // Navigation
  currentProject?: Project;
  currentSite?: Site;
  currentArea?: Area;
  breadcrumbs: Breadcrumb[];
  
  // Modals & Dialogs
  modals: ModalState[];
  notifications: Notification[];
  
  // Loading states
  isLoading: boolean;
  loadingMessage?: string;
  
  // Error handling
  errors: ErrorState[];
}

export interface ModalState {
  id: string;
  type: string;
  isOpen: boolean;
  data?: any;
  options?: ModalOptions;
}

export interface ModalOptions {
  closable?: boolean;
  maskClosable?: boolean;
  keyboard?: boolean;
  width?: number;
  height?: number;
}

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message?: string;
  duration?: number;
  actions?: NotificationAction[];
  timestamp: number;
}

export type NotificationType = 'SUCCESS' | 'INFO' | 'WARNING' | 'ERROR';

export interface NotificationAction {
  label: string;
  action: () => void;
}

export interface ErrorState {
  id: string;
  code: string;
  message: string;
  details?: any;
  timestamp: number;
  acknowledged: boolean;
}

export interface Breadcrumb {
  label: string;
  href?: string;
  icon?: string;
}

export type Theme = 'LIGHT' | 'DARK' | 'AUTO';
export type Language = 'vi' | 'en';

// Form state types
export interface FormState<T = any> {
  data: T;
  errors: Record<string, string>;
  touched: Record<string, boolean>;
  isSubmitting: boolean;
  isValid: boolean;
}

export interface ValidationRule {
  type: 'REQUIRED' | 'MIN' | 'MAX' | 'PATTERN' | 'CUSTOM';
  value?: any;
  message: string;
}

// Table state types
export interface TableState<T = any> {
  data: T[];
  pagination: PaginationState;
  sorting: SortingState;
  filters: FilterState;
  selection: SelectionState;
  isLoading: boolean;
}

export interface PaginationState {
  page: number;
  pageSize: number;
  total: number;
}

export interface SortingState {
  field?: string;
  direction: 'ASC' | 'DESC';
}

export interface FilterState {
  [key: string]: any;
}

export interface SelectionState {
  selectedRowKeys: string[];
  selectedRows: any[];
}
```

## Type Utilities

```typescript
// shared/types/utils.ts
export type ApiResponse<T> = {
  data: T;
  success: boolean;
  message?: string;
  errors?: string[];
  meta?: {
    total?: number;
    page?: number;
    pageSize?: number;
  };
};

export type PaginatedResponse<T> = {
  data: T[];
  meta: {
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
};

export type AsyncState<T> = {
  data: T | null;
  isLoading: boolean;
  error: string | null;
  lastUpdated?: number;
};

export type EntityWithTimestamps = {
  createdAt: Date;
  updatedAt: Date;
};

export type EntityWithSoftDelete = EntityWithTimestamps & {
  deletedAt?: Date;
  isDeleted: boolean;
};

// Utility types for forms
export type FormData<T> = Omit<T, 'id' | 'createdAt' | 'updatedAt'>;
export type UpdateFormData<T> = Partial<FormData<T>>;

// Utility types for API
export type CreateRequest<T> = Omit<T, 'id' | 'createdAt' | 'updatedAt'>;
export type UpdateRequest<T> = Partial<Omit<T, 'id' | 'createdAt' | 'updatedAt'>>;

// Utility types for stores
export type StoreActions<T> = {
  [K in keyof T as K extends `set${string}` ? K : never]: T[K];
};

export type StoreState<T> = {
  [K in keyof T as K extends `set${string}` ? never : K]: T[K];
};
```