// Base entity interface
export interface BaseEntity {
  id: string;
  createdAt: string;
  updatedAt: string;
}

// User & Auth types
export interface User extends BaseEntity {
  email: string;
  username?: string;
  firstName: string;
  lastName: string;
  avatar?: string;
  phone?: string;
  isActive: boolean;
  lastLogin?: string;
  tenantId: string;
  tenant: Tenant;
  userRoles: UserRole[];
}

export interface UserRole {
  userId: string;
  roleId: string;
  role: Role;
}

export interface Role extends BaseEntity {
  name: string;
  description?: string;
  permissions: string[];
  isActive: boolean;
}

export interface Tenant extends BaseEntity {
  name: string;
  code: string;
  description?: string;
  settings?: Record<string, any>;
  isActive: boolean;
}

// Organizational types
export interface Project extends BaseEntity {
  name: string;
  description?: string;
  settings?: Record<string, any>;
  isActive: boolean;
  tenantId: string;
  tenant: Tenant;
  sites: Site[];
}

export interface Site extends BaseEntity {
  name: string;
  description?: string;
  address?: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
  metadata?: Record<string, any>;
  isActive: boolean;
  projectId: string;
  project: Project;
  areas: Area[];
}

export interface Area extends BaseEntity {
  name: string;
  description?: string;
  metadata?: Record<string, any>;
  isActive: boolean;
  siteId: string;
  site: Site;
  devices: Device[];
  scadaViews: ScadaView[];
}

// Device types
export interface DeviceType extends BaseEntity {
  name: string;
  description?: string;
  category: string;
  metadata?: Record<string, any>;
  isActive: boolean;
  devices: Device[];
  deviceTemplates: DeviceTemplate[];
}

export interface Device extends BaseEntity {
  name: string;
  description?: string;
  tbDeviceId: string; // ThingsBoard device ID
  tbEntityId?: string; // ThingsBoard entity ID
  serialNumber?: string;
  model?: string;
  firmware?: string;
  metadata?: Record<string, any>;
  isActive: boolean;
  isOnline: boolean;
  lastSeen?: string;
  areaId: string;
  deviceTypeId: string;
  area: Area;
  deviceType: DeviceType;
  deviceState?: DeviceState;
}

export interface DeviceState extends BaseEntity {
  telemetryData?: Record<string, any>;
  attributes?: Record<string, any>;
  alarms?: Record<string, any>;
  lastUpdate: string;
  deviceId: string;
  device: Device;
}

export interface DeviceTemplate extends BaseEntity {
  name: string;
  description?: string;
  template: Record<string, any>; // Device UI template JSON
  preview?: string;
  version: string;
  isActive: boolean;
  deviceTypeId: string;
  deviceType: DeviceType;
}

// SCADA types
export interface ScadaView extends BaseEntity {
  name: string;
  description?: string;
  layout: Record<string, any>; // SCADA layout JSON
  background?: string;
  canvasSize: {
    width: number;
    height: number;
  };
  settings?: Record<string, any>;
  isActive: boolean;
  areaId: string;
  area: Area;
  scadaWidgets: ScadaWidget[];
}

export interface ScadaWidget extends BaseEntity {
  position: {
    x: number;
    y: number;
    width: number;
    height: number;
    rotation?: number;
    zIndex?: number;
  };
  properties: Record<string, any>;
  bindings: {
    deviceId?: string;
    telemetryKeys?: string[];
    attributeKeys?: string[];
  };
  styles?: Record<string, any>;
  isVisible: boolean;
  scadaViewId: string;
  widgetId: string;
  scadaView: ScadaView;
  widget: Widget;
}

// Widget system types
export interface WidgetCategory extends BaseEntity {
  name: string;
  description?: string;
  icon?: string;
  order: number;
  isActive: boolean;
  widgets: Widget[];
}

export interface Widget extends BaseEntity {
  name: string;
  description?: string;
  type: string; // "chart", "gauge", "button", "switch", "symbol", etc.
  config: Record<string, any>; // Widget configuration schema
  template: Record<string, any>; // Widget template/definition
  preview?: string;
  version: string;
  isActive: boolean;
  categoryId?: string;
  symbolId?: string;
  category?: WidgetCategory;
  symbol?: Symbol;
  scadaWidgets: ScadaWidget[];
}

export interface Symbol extends BaseEntity {
  name: string;
  description?: string;
  svg: string; // SVG content or URL
  metadata?: Record<string, any>;
  tags: string[];
  isActive: boolean;
  widgets: Widget[];
}

export interface WidgetTemplate extends BaseEntity {
  name: string;
  description?: string;
  template: Record<string, any>;
  preview?: string;
  tags: string[];
  isActive: boolean;
}

// API types
export interface PaginationParams {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface ApiError {
  message: string;
  status?: number;
  code?: string;
  details?: any;
}

// Telemetry types
export interface TelemetryData {
  [key: string]: Array<{
    ts: number;
    value: any;
  }>;
}

export interface AttributeData {
  [key: string]: {
    lastUpdateTs: number;
    value: any;
  };
}

// RPC types
export interface RpcRequest {
  method: string;
  params: any;
  timeout?: number;
}

export interface RpcResponse {
  requestId: string;
  response?: any;
  error?: string;
  timeout: boolean;
}

// Authentication Request/Response types
export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  refreshToken: string;
  user: User;
}

export interface RegisterRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
}

// API Response types
export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
}

export interface PaginatedResponse<T = any> {
  data: T[];
  totalElements: number;
  totalPages: number;
  page: number;
  pageSize: number;
  hasNext: boolean;
}

// UI types
export type Theme = 'light' | 'dark' | 'system';

export type Language = 'en' | 'vi' | 'ja' | 'zh';

export interface Notification {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error';
  title: string;
  message: string;
  read?: boolean;
  timestamp?: string;
  createdAt?: string;
}

export interface ModalState {
  id?: string;
  isOpen: boolean;
  type?: string;
  data?: any;
}