export const API_ENDPOINTS = {
  // Authentication
  auth: {
    login: '/v1/auth/login',
    register: '/v1/auth/register',
    logout: '/v1/auth/logout',
    refresh: '/v1/auth/refresh',
    profile: '/v1/auth/profile',
  },

  // Users
  users: {
    base: '/v1/users',
    profile: '/v1/users/profile',
    byId: (id: string) => `/v1/users/${id}`,
  },

  // Tenants
  tenants: {
    base: '/v1/tenants',
    byId: (id: string) => `/v1/tenants/${id}`,
  },

  // Projects
  projects: {
    base: '/v1/projects',
    byId: (id: string) => `/v1/projects/${id}`,
    byTenant: (tenantId: string) => `/v1/tenants/${tenantId}/projects`,
  },

  // Sites
  sites: {
    base: '/v1/sites',
    byId: (id: string) => `/v1/sites/${id}`,
    byProject: (projectId: string) => `/v1/projects/${projectId}/sites`,
  },

  // Areas
  areas: {
    base: '/v1/areas',
    byId: (id: string) => `/v1/areas/${id}`,
    bySite: (siteId: string) => `/v1/sites/${siteId}/areas`,
  },

  // Device Types
  deviceTypes: {
    base: '/v1/device-types',
    byId: (id: string) => `/v1/device-types/${id}`,
  },

  // Devices
  devices: {
    base: '/v1/devices',
    byId: (id: string) => `/v1/devices/${id}`,
    byArea: (areaId: string) => `/v1/areas/${areaId}/devices`,
    telemetry: (deviceId: string) => `/v1/devices/${deviceId}/telemetry`,
    attributes: (deviceId: string) => `/v1/devices/${deviceId}/attributes`,
    rpc: (deviceId: string) => `/v1/devices/${deviceId}/rpc`,
  },

  // Device Templates
  deviceTemplates: {
    base: '/v1/device-templates',
    byId: (id: string) => `/v1/device-templates/${id}`,
    byDeviceType: (deviceTypeId: string) => `/v1/device-types/${deviceTypeId}/templates`,
  },

  // SCADA Views
  scadaViews: {
    base: '/v1/scada-views',
    byId: (id: string) => `/v1/scada-views/${id}`,
    byArea: (areaId: string) => `/v1/areas/${areaId}/scada-views`,
    widgets: (viewId: string) => `/v1/scada-views/${viewId}/widgets`,
  },

  // SCADA Widgets
  scadaWidgets: {
    base: '/v1/scada-widgets',
    byId: (id: string) => `/v1/scada-widgets/${id}`,
  },

  // Widgets
  widgets: {
    base: '/v1/widgets',
    byId: (id: string) => `/v1/widgets/${id}`,
    categories: '/v1/widget-categories',
    byCategory: (categoryId: string) => `/v1/widget-categories/${categoryId}/widgets`,
  },

  // Symbols
  symbols: {
    base: '/v1/symbols',
    byId: (id: string) => `/v1/symbols/${id}`,
    upload: '/v1/symbols/upload',
  },

  // Widget Templates
  widgetTemplates: {
    base: '/v1/widget-templates',
    byId: (id: string) => `/v1/widget-templates/${id}`,
  },

  // Files
  files: {
    upload: '/v1/files/upload',
    download: (fileId: string) => `/v1/files/${fileId}`,
    delete: (fileId: string) => `/v1/files/${fileId}`,
  },

  // Real-time
  realtime: {
    websocket: '/socket.io',
  },
} as const;

export type ApiEndpoints = typeof API_ENDPOINTS;