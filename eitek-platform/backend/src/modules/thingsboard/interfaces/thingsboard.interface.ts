import { Injectable } from '@nestjs/common';

/**
 * ThingsBoard API Response Types
 */
export interface TBResponse<T = any> {
  data: T;
  totalPages?: number;
  totalElements?: number;
  hasNext?: boolean;
}

export interface TBDevice {
  id: {
    entityType: 'DEVICE';
    id: string;
  };
  name: string;
  type: string;
  label?: string;
  customerId?: {
    entityType: 'CUSTOMER';
    id: string;
  };
  additionalInfo?: Record<string, any>;
}

export interface TBTelemetry {
  [key: string]: Array<{
    ts: number;
    value: string | number | boolean;
  }>;
}

export interface TBAttributes {
  [key: string]: string | number | boolean;
}

export interface TBCredentials {
  credentialsType: 'ACCESS_TOKEN' | 'MQTT_BASIC' | 'X509_CERTIFICATE';
  credentialsId: string;
}

export interface TBAlarm {
  id: {
    entityType: 'ALARM';
    id: string;
  };
  type: string;
  severity: 'CRITICAL' | 'MAJOR' | 'MINOR' | 'WARNING' | 'INDETERMINATE';
  status: 'ACTIVE_UNACK' | 'ACTIVE_ACK' | 'CLEARED_UNACK' | 'CLEARED_ACK';
  startTs: number;
  endTs?: number;
  ackTs?: number;
  clearTs?: number;
  details: Record<string, any>;
  originator: {
    entityType: string;
    id: string;
  };
}

/**
 * ThingsBoard Integration Service Interface
 */
export interface IThingsBoardService {
  // Authentication
  login(username: string, password: string): Promise<string>;
  refreshToken(token: string): Promise<string>;
  
  // Devices
  createDevice(device: Partial<TBDevice>): Promise<TBDevice>;
  updateDevice(deviceId: string, device: Partial<TBDevice>): Promise<TBDevice>;
  deleteDevice(deviceId: string): Promise<void>;
  getDevice(deviceId: string): Promise<TBDevice>;
  getDevices(pageSize?: number, page?: number, textSearch?: string): Promise<TBResponse<TBDevice[]>>;
  
  // Device Credentials
  getDeviceCredentials(deviceId: string): Promise<TBCredentials>;
  updateDeviceCredentials(deviceId: string, credentials: Partial<TBCredentials>): Promise<TBCredentials>;
  
  // Telemetry
  getLatestTelemetry(deviceId: string, keys?: string[]): Promise<TBTelemetry>;
  getTelemetryHistory(
    deviceId: string, 
    keys: string[], 
    startTs: number, 
    endTs: number,
    interval?: number
  ): Promise<TBTelemetry>;
  
  // Attributes
  getDeviceAttributes(deviceId: string, scope?: 'CLIENT_SCOPE' | 'SERVER_SCOPE' | 'SHARED_SCOPE'): Promise<TBAttributes>;
  updateDeviceAttributes(deviceId: string, scope: string, attributes: Record<string, any>): Promise<void>;
  
  // RPC Commands
  sendRpcCommand(deviceId: string, method: string, params: Record<string, any>, timeout?: number): Promise<any>;
  
  // Alarms
  getDeviceAlarms(deviceId: string, status?: string, pageSize?: number, page?: number): Promise<TBResponse<TBAlarm[]>>;
  
  // Real-time subscriptions
  subscribeToTelemetry(deviceId: string, keys: string[], callback: (data: TBTelemetry) => void): string;
  subscribeToAttributes(deviceId: string, callback: (data: TBAttributes) => void): string;
  subscribeToAlarms(entityId: string, callback: (alarm: TBAlarm) => void): string;
  unsubscribe(subscriptionId: string): void;
}

/**
 * Device Synchronization Interface
 */
export interface IDeviceSyncService {
  // Sync operations
  syncDeviceFromTB(tbDeviceId: string): Promise<void>;
  syncDeviceToTB(deviceId: string): Promise<string>; // Returns TB device ID
  syncAllDevices(): Promise<void>;
  
  // Batch operations
  bulkSyncFromTB(tbDeviceIds: string[]): Promise<void>;
  bulkSyncToTB(deviceIds: string[]): Promise<string[]>;
  
  // Validation
  validateDeviceMapping(deviceId: string): Promise<boolean>;
  validateTBDeviceExists(tbDeviceId: string): Promise<boolean>;
}

/**
 * Real-time Data Integration Interface
 */
export interface IRealTimeService {
  // WebSocket connections
  initializeWebSocketConnection(): Promise<void>;
  closeWebSocketConnection(): Promise<void>;
  
  // Subscription management
  subscribeToDeviceTelemetry(deviceId: string): Promise<string>;
  subscribeToDeviceAlarms(deviceId: string): Promise<string>;
  unsubscribeFromDevice(deviceId: string): Promise<void>;
  
  // Data forwarding
  forwardTelemetryToClients(deviceId: string, data: TBTelemetry): Promise<void>;
  forwardAlarmsToClients(deviceId: string, alarm: TBAlarm): Promise<void>;
}

/**
 * Configuration for ThingsBoard Integration
 */
export interface TBConfig {
  baseUrl: string;
  username: string;
  password: string;
  timeout: number;
  retryAttempts: number;
  retryDelay: number;
  websocketUrl?: string;
  enableWebSocket?: boolean;
  telemetryBufferSize?: number;
  syncInterval?: number;
}

/**
 * Error Types for ThingsBoard Integration
 */
export enum TBErrorCode {
  AUTHENTICATION_FAILED = 'TB_AUTH_FAILED',
  DEVICE_NOT_FOUND = 'TB_DEVICE_NOT_FOUND',
  INVALID_CREDENTIALS = 'TB_INVALID_CREDENTIALS',
  CONNECTION_TIMEOUT = 'TB_CONNECTION_TIMEOUT',
  WEBSOCKET_ERROR = 'TB_WEBSOCKET_ERROR',
  SYNC_FAILED = 'TB_SYNC_FAILED',
  RATE_LIMIT_EXCEEDED = 'TB_RATE_LIMIT_EXCEEDED',
  UNKNOWN_ERROR = 'TB_UNKNOWN_ERROR'
}

export class TBError extends Error {
  constructor(
    public code: TBErrorCode,
    message: string,
    public originalError?: any
  ) {
    super(message);
    this.name = 'TBError';
  }
}