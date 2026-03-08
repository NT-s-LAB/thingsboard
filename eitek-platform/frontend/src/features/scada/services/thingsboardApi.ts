/**
 * ThingsBoard API Integration Service
 * Handles telemetry subscriptions, attribute reads/writes, RPC calls
 * Compatible with ThingsBoard REST API and WebSocket API
 */

import type {
  TbEntityType,
  TbAttributeScope,
  TbAggregation,
  TbRpcConfig,
  TbTimeWindow,
  TbAlarmSeverity,
} from '../types';

// ThingsBoard API base URL (configure via environment)
const TB_API_BASE = process.env.NEXT_PUBLIC_THINGSBOARD_API_URL || 'http://localhost:8080';

interface TbAuthToken {
  token: string;
  refreshToken: string;
}

/** Get cached ThingsBoard auth token */
function getTbToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('tb_token');
}

/** Set ThingsBoard auth token */
function setTbToken(token: string, refreshToken: string) {
  localStorage.setItem('tb_token', token);
  localStorage.setItem('tb_refresh_token', refreshToken);
}

/** Common fetch headers */
function tbHeaders(): HeadersInit {
  const token = getTbToken();
  return {
    'Content-Type': 'application/json',
    ...(token ? { 'X-Authorization': `Bearer ${token}` } : {}),
  };
}

// ============================================================
// Authentication
// ============================================================

export async function tbLogin(username: string, password: string): Promise<TbAuthToken> {
  const res = await fetch(`${TB_API_BASE}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  });
  if (!res.ok) throw new Error(`ThingsBoard login failed: ${res.status}`);
  const data = await res.json();
  setTbToken(data.token, data.refreshToken);
  return data;
}

// ============================================================
// Telemetry
// ============================================================

/** Get latest telemetry values for an entity */
export async function getLatestTelemetry(
  entityType: TbEntityType,
  entityId: string,
  keys?: string[]
): Promise<Record<string, Array<{ ts: number; value: string }>>> {
  const keysParam = keys?.length ? `?keys=${keys.join(',')}` : '';
  const res = await fetch(
    `${TB_API_BASE}/api/plugins/telemetry/${entityType}/${entityId}/values/timeseries${keysParam}`,
    { headers: tbHeaders() }
  );
  if (!res.ok) throw new Error(`Failed to get telemetry: ${res.status}`);
  return res.json();
}

/** Get timeseries telemetry for an entity */
export async function getTimeseriesTelemetry(
  entityType: TbEntityType,
  entityId: string,
  keys: string[],
  startTs: number,
  endTs: number,
  aggregation: TbAggregation = 'NONE',
  interval?: number,
  limit?: number
): Promise<Record<string, Array<{ ts: number; value: string }>>> {
  const params = new URLSearchParams({
    keys: keys.join(','),
    startTs: String(startTs),
    endTs: String(endTs),
    agg: aggregation,
  });
  if (interval) params.set('interval', String(interval));
  if (limit) params.set('limit', String(limit));

  const res = await fetch(
    `${TB_API_BASE}/api/plugins/telemetry/${entityType}/${entityId}/values/timeseries?${params}`,
    { headers: tbHeaders() }
  );
  if (!res.ok) throw new Error(`Failed to get timeseries: ${res.status}`);
  return res.json();
}

// ============================================================
// Attributes
// ============================================================

/** Get entity attributes */
export async function getAttributes(
  entityType: TbEntityType,
  entityId: string,
  scope: TbAttributeScope,
  keys?: string[]
): Promise<Array<{ key: string; value: any; lastUpdateTs: number }>> {
  const keysParam = keys?.length ? `?keys=${keys.join(',')}` : '';
  const res = await fetch(
    `${TB_API_BASE}/api/plugins/telemetry/${entityType}/${entityId}/values/attributes/${scope}${keysParam}`,
    { headers: tbHeaders() }
  );
  if (!res.ok) throw new Error(`Failed to get attributes: ${res.status}`);
  return res.json();
}

/** Save entity attributes */
export async function saveAttributes(
  entityType: TbEntityType,
  entityId: string,
  scope: TbAttributeScope,
  attributes: Record<string, any>
): Promise<void> {
  const res = await fetch(
    `${TB_API_BASE}/api/plugins/telemetry/${entityType}/${entityId}/${scope}`,
    {
      method: 'POST',
      headers: tbHeaders(),
      body: JSON.stringify(attributes),
    }
  );
  if (!res.ok) throw new Error(`Failed to save attributes: ${res.status}`);
}

// ============================================================
// RPC
// ============================================================

/** Send one-way RPC command to device */
export async function sendOneWayRpc(
  deviceId: string,
  config: TbRpcConfig
): Promise<void> {
  const res = await fetch(
    `${TB_API_BASE}/api/rpc/oneway/${deviceId}`,
    {
      method: 'POST',
      headers: tbHeaders(),
      body: JSON.stringify({
        method: config.method,
        params: config.params || {},
        timeout: config.timeout || 5000,
        persistent: config.persistent || false,
        additionalInfo: config.additionalInfo,
      }),
    }
  );
  if (!res.ok) throw new Error(`RPC one-way call failed: ${res.status}`);
}

/** Send two-way RPC command to device (returns response) */
export async function sendTwoWayRpc(
  deviceId: string,
  config: TbRpcConfig
): Promise<any> {
  const res = await fetch(
    `${TB_API_BASE}/api/rpc/twoway/${deviceId}`,
    {
      method: 'POST',
      headers: tbHeaders(),
      body: JSON.stringify({
        method: config.method,
        params: config.params || {},
        timeout: config.timeout || 5000,
        persistent: config.persistent || false,
        additionalInfo: config.additionalInfo,
      }),
    }
  );
  if (!res.ok) throw new Error(`RPC two-way call failed: ${res.status}`);
  return res.json();
}

// ============================================================
// Devices & Assets
// ============================================================

/** Get list of devices */
export async function getDevices(
  pageSize: number = 20,
  page: number = 0,
  textSearch?: string
): Promise<{ data: any[]; totalPages: number; totalElements: number }> {
  const params = new URLSearchParams({
    pageSize: String(pageSize),
    page: String(page),
    sortProperty: 'name',
    sortOrder: 'ASC',
  });
  if (textSearch) params.set('textSearch', textSearch);

  const res = await fetch(
    `${TB_API_BASE}/api/tenant/devices?${params}`,
    { headers: tbHeaders() }
  );
  if (!res.ok) throw new Error(`Failed to get devices: ${res.status}`);
  return res.json();
}

/** Get list of assets */
export async function getAssets(
  pageSize: number = 20,
  page: number = 0,
  textSearch?: string
): Promise<{ data: any[]; totalPages: number; totalElements: number }> {
  const params = new URLSearchParams({
    pageSize: String(pageSize),
    page: String(page),
    sortProperty: 'name',
    sortOrder: 'ASC',
  });
  if (textSearch) params.set('textSearch', textSearch);

  const res = await fetch(
    `${TB_API_BASE}/api/tenant/assets?${params}`,
    { headers: tbHeaders() }
  );
  if (!res.ok) throw new Error(`Failed to get assets: ${res.status}`);
  return res.json();
}

/** Get device telemetry keys */
export async function getDeviceTelemetryKeys(deviceId: string): Promise<string[]> {
  const res = await fetch(
    `${TB_API_BASE}/api/plugins/telemetry/DEVICE/${deviceId}/keys/timeseries`,
    { headers: tbHeaders() }
  );
  if (!res.ok) throw new Error(`Failed to get telemetry keys: ${res.status}`);
  return res.json();
}

/** Get device attribute keys */
export async function getDeviceAttributeKeys(
  deviceId: string,
  scope: TbAttributeScope = 'SERVER_SCOPE'
): Promise<string[]> {
  const res = await fetch(
    `${TB_API_BASE}/api/plugins/telemetry/DEVICE/${deviceId}/keys/attributes/${scope}`,
    { headers: tbHeaders() }
  );
  if (!res.ok) throw new Error(`Failed to get attribute keys: ${res.status}`);
  return res.json();
}

// ============================================================
// Alarms
// ============================================================

/** Get alarms for an entity */
export async function getAlarms(
  entityType: TbEntityType,
  entityId: string,
  pageSize: number = 20,
  page: number = 0,
  severities?: TbAlarmSeverity[]
): Promise<{ data: any[]; totalPages: number; totalElements: number }> {
  const params = new URLSearchParams({
    pageSize: String(pageSize),
    page: String(page),
    sortProperty: 'createdTime',
    sortOrder: 'DESC',
  });
  if (severities?.length) {
    params.set('severityList', severities.join(','));
  }

  const res = await fetch(
    `${TB_API_BASE}/api/alarm/${entityType}/${entityId}?${params}`,
    { headers: tbHeaders() }
  );
  if (!res.ok) throw new Error(`Failed to get alarms: ${res.status}`);
  return res.json();
}

// ============================================================
// WebSocket Telemetry Subscription
// ============================================================

export class TbWebSocketSubscription {
  private ws: WebSocket | null = null;
  private cmdId = 0;
  private subscriptions: Map<number, {
    entityType: TbEntityType;
    entityId: string;
    keys: string[];
    callback: (data: Record<string, Array<{ ts: number; value: string }>>) => void;
  }> = new Map();

  constructor(private wsUrl: string = TB_API_BASE.replace('http', 'ws') + '/api/ws/plugins/telemetry') {}

  connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      const token = getTbToken();
      if (!token) {
        reject(new Error('No ThingsBoard token'));
        return;
      }

      this.ws = new WebSocket(`${this.wsUrl}?token=${token}`);

      this.ws.onopen = () => resolve();
      this.ws.onerror = (err) => reject(err);

      this.ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          if (message.subscriptionId !== undefined) {
            const sub = this.subscriptions.get(message.subscriptionId);
            if (sub) {
              sub.callback(message.data);
            }
          }
        } catch {
          console.error('Failed to parse WS message');
        }
      };

      this.ws.onclose = () => {
        // Auto-reconnect after 3 seconds
        setTimeout(() => this.connect().catch(console.error), 3000);
      };
    });
  }

  /** Subscribe to telemetry updates for an entity */
  subscribeTelemetry(
    entityType: TbEntityType,
    entityId: string,
    keys: string[],
    callback: (data: Record<string, Array<{ ts: number; value: string }>>) => void,
    timeWindow?: TbTimeWindow
  ): number {
    const id = ++this.cmdId;
    this.subscriptions.set(id, { entityType, entityId, keys, callback });

    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({
        tsSubCmds: [{
          entityType,
          entityId,
          scope: 'LATEST_TELEMETRY',
          cmdId: id,
          keys: keys.join(','),
          ...(timeWindow?.realtimeMs ? { timeWindow: timeWindow.realtimeMs } : {}),
        }],
        historyCmds: [],
        attrSubCmds: [],
      }));
    }

    return id;
  }

  /** Subscribe to attribute updates */
  subscribeAttributes(
    entityType: TbEntityType,
    entityId: string,
    keys: string[],
    callback: (data: Record<string, Array<{ ts: number; value: string }>>) => void
  ): number {
    const id = ++this.cmdId;
    this.subscriptions.set(id, { entityType, entityId, keys, callback });

    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({
        tsSubCmds: [],
        historyCmds: [],
        attrSubCmds: [{
          entityType,
          entityId,
          scope: 'CLIENT_SCOPE',
          cmdId: id,
          keys: keys.join(','),
        }],
      }));
    }

    return id;
  }

  /** Unsubscribe */
  unsubscribe(cmdId: number) {
    this.subscriptions.delete(cmdId);
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({
        tsSubCmds: [{ entityType: '', entityId: '', scope: '', cmdId, unsubscribe: true }],
        historyCmds: [],
        attrSubCmds: [],
      }));
    }
  }

  /** Disconnect WebSocket */
  disconnect() {
    this.subscriptions.clear();
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }
}

/** Singleton WebSocket subscription manager */
let wsInstance: TbWebSocketSubscription | null = null;

export function getTbWebSocket(): TbWebSocketSubscription {
  if (!wsInstance) {
    wsInstance = new TbWebSocketSubscription();
  }
  return wsInstance;
}
