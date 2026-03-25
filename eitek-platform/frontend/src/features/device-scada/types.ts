import type { ScreenDefinition } from '@/features/scada/core/types/screen.types';

// ═══════════════════════════════════════════════════════════════════
// Device SCADA Template
// ═══════════════════════════════════════════════════════════════════

export interface DeviceScadaTemplate {
  id: string;
  name: string;
  description?: string;
  screenDefinition: ScreenDefinition;
  thumbnail?: string;
  version: number;
  isActive: boolean;
  tenantId: string;
  createdAt: string;
  updatedAt: string;
  /** Profiles using this template as default */
  profileDefaults?: { deviceProfileId: string }[];
  _count?: { overrides: number };
}

export interface CreateDeviceScadaTemplateRequest {
  name: string;
  description?: string;
  screenDefinition: Record<string, any>;
  thumbnail?: string;
  isActive?: boolean;
}

export interface UpdateDeviceScadaTemplateRequest {
  name?: string;
  description?: string;
  screenDefinition?: Record<string, any>;
  thumbnail?: string;
  isActive?: boolean;
  version?: number;
}

// ═══════════════════════════════════════════════════════════════════
// Profile Default Mapping
// ═══════════════════════════════════════════════════════════════════

export interface DeviceProfileScadaDefault {
  id: string;
  deviceProfileId: string;
  templateId: string;
  tenantId: string;
  createdAt: string;
  updatedAt: string;
  template?: {
    id: string;
    name: string;
    thumbnail?: string;
  };
}

// ═══════════════════════════════════════════════════════════════════
// Device Override
// ═══════════════════════════════════════════════════════════════════

export interface DeviceScadaOverride {
  id: string;
  deviceId: string;
  templateId: string;
  overrides: DeviceScadaOverrideData;
  createdAt: string;
  updatedAt: string;
}

export interface DeviceScadaOverrideData {
  widgets?: Record<string, {
    properties?: Record<string, unknown>;
    visible?: boolean;
    transform?: Record<string, unknown>;
    bindings?: any[];
  }>;
  variables?: Record<string, {
    defaultValue?: unknown;
  }>;
}

// ═══════════════════════════════════════════════════════════════════
// Resolved Device SCADA (Runtime)
// ═══════════════════════════════════════════════════════════════════

export interface ResolvedDeviceScada {
  hasTemplate: boolean;
  templateId?: string;
  templateName?: string;
  templateVersion?: number;
  hasOverride?: boolean;
  device: DeviceScadaContext;
  screen: ScreenDefinition | null;
}

export interface DeviceScadaContext {
  id: string;
  name: string;
  tbDeviceId: string;
  deviceProfileId: string | null;
  deviceTypeName: string | null;
  areaId: string | null;
  areaName: string | null;
  isOnline: boolean;
}

/**
 * The placeholder string used in template bindings to represent the
 * device being viewed. Replaced at runtime by the actual TB device ID.
 */
export const CURRENT_DEVICE_PLACEHOLDER = '$currentDevice';
export const CURRENT_DEVICE_NAME_PLACEHOLDER = '$currentDeviceName';
