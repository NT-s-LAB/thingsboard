/**
 * Subscription Manager
 *
 * Central data layer that sits between the SCADA runtime and data sources.
 *
 * Responsibilities:
 *   1. Collect all data points that the current screen needs.
 *   2. Open a single WebSocket subscription for all devices.
 *   3. Poll via HTTP as a fallback.
 *   4. Cache the latest value per (entityId, key).
 *   5. Notify listeners when a value changes.
 *
 * Design:
 *   • Widgets do NOT open their own connections.
 *   • The runtime engine calls `subscribe(points)` once after resolving
 *     all bindings, and receives updates via the `onUpdate` callback.
 *   • When the screen is unloaded or runtime is stopped, `unsubscribeAll()``
 *     is called to clean up.
 */

import { deviceService } from '@/features/devices/services/deviceService';

// Debug logging - disabled in production build
const DEBUG = process.env.NODE_ENV !== 'production';
const log = (...args: any[]) => DEBUG && console.log('[SubscriptionManager]', ...args);

// ─── Public types ────────────────────────────────────────────────────────────

export interface DataPoint {
  entityId: string;
  entityType: 'DEVICE' | 'ASSET';
  key: string;
  /** 'telemetry' | 'attribute' */
  kind: 'telemetry' | 'attribute';
  attributeScope?: string;
}

export type DataValue = string | number | boolean | null;

export interface DataUpdate {
  entityId: string;
  key: string;
  value: DataValue;
  timestamp: number;
}

export type DataUpdateCallback = (updates: DataUpdate[]) => void;

// ─── Subscription Manager ────────────────────────────────────────────────────

export class SubscriptionManager {
  /** Latest cached values keyed by `entityId::key` */
  private cache = new Map<string, DataUpdate>();

  /** Currently subscribed points */
  private points: DataPoint[] = [];

  /** Polling timer handle */
  private pollTimer: ReturnType<typeof setInterval> | null = null;

  /** External listener */
  private listener: DataUpdateCallback | null = null;

  /** WebSocket — we receive a handle from outside via `setWebSocket` */
  private ws: {
    subscribe: (event: string, handler: (...args: any[]) => void) => void;
    unsubscribe: (event: string, handler: (...args: any[]) => void) => void;
    emit: (event: string, data: any) => void;
    connected: boolean;
  } | null = null;

  private wsHandler: ((event: any) => void) | null = null;

  /** Polling interval in ms */
  private pollIntervalMs: number;

  constructor(pollIntervalMs = 5_000) {
    this.pollIntervalMs = pollIntervalMs;
  }

  // ── Public API ───────────────────────────────────────────────────────────

  /** Provide the WebSocket handle (from WebSocketProvider). */
  setWebSocket(ws: SubscriptionManager['ws']): void {
    this.ws = ws;
  }

  /** Register a callback that receives data updates.  Only one listener. */
  onUpdate(callback: DataUpdateCallback): void {
    this.listener = callback;
  }

  /**
   * Subscribe to a set of data points.
   * Previous subscriptions are replaced.
   */
  subscribe(points: DataPoint[]): void {
    log('subscribe() called with', points.length, 'points');
    
    // Unsubscribe existing first
    this.teardown();

    // De-duplicate points
    const seen = new Set<string>();
    this.points = [];
    for (const p of points) {
      const key = `${p.entityId}::${p.key}::${p.kind}`;
      if (!seen.has(key)) {
        seen.add(key);
        this.points.push(p);
      }
    }

    log('After dedup:', this.points.length, 'points');
    log('Device IDs:', Array.from(new Set(this.points.map(p => p.entityId))));

    if (this.points.length === 0) {
      log('No points to subscribe, returning');
      return;
    }

    // Initial fetch via HTTP - ALWAYS run to get current state
    this.fetchAll(true);

    // WebSocket subscriptions
    this.setupWebSocket();

    // HTTP polling as fallback (only runs if WS disconnected)
    this.pollTimer = setInterval(() => this.fetchAll(false), this.pollIntervalMs);
  }

  /** Stop all subscriptions and clear cache. */
  unsubscribeAll(): void {
    this.teardown();
    this.cache.clear();
    this.points = [];
  }

  /** Read the latest cached value for a given entity + key. */
  getLatest(entityId: string, key: string): DataValue | undefined {
    return this.cache.get(`${entityId}::${key}`)?.value;
  }

  /** Read all cached values for a given entity. */
  getEntityValues(entityId: string): Record<string, DataValue> {
    const result: Record<string, DataValue> = {};
    this.cache.forEach((update, cacheKey) => {
      if (cacheKey.startsWith(`${entityId}::`)) {
        result[update.key] = update.value;
      }
    });
    return result;
  }

  /** Destroy — call when unmounting. */
  destroy(): void {
    this.unsubscribeAll();
    this.listener = null;
    this.ws = null;
  }

  // ── Internal ─────────────────────────────────────────────────────────────

  private teardown(): void {
    // Clear polling
    if (this.pollTimer) {
      clearInterval(this.pollTimer);
      this.pollTimer = null;
    }

    // Unsubscribe WebSocket
    if (this.ws && this.wsHandler) {
      this.ws.unsubscribe('telemetry', this.wsHandler);
      // Emit unsubscribe for each device
      const deviceIds = new Set(
        this.points.filter((p) => p.entityType === 'DEVICE').map((p) => p.entityId),
      );
      Array.from(deviceIds).forEach((id) => {
        this.ws!.emit('unsubscribe:device', { deviceId: id });
      });
      this.wsHandler = null;
    }
  }

  private setupWebSocket(): void {
    log('setupWebSocket() called');
    log('ws exists:', !!this.ws);
    log('ws.connected:', this.ws?.connected);
    
    if (!this.ws || !this.ws.connected) {
      log('WebSocket not ready, skipping WS subscription');
      return;
    }

    this.wsHandler = (event: any) => {
      log('RAW Telemetry Event:', JSON.stringify(event, null, 2));

      if (!event?.deviceId || !event?.data) return;

      const updates: DataUpdate[] = [];

      log('Telemetry Data Structure:', {
        deviceId: event.deviceId,
        dataKeys: Object.keys(event.data),
        rawData: event.data,
        timestamp: event.timestamp,
      });

      for (const [key, values] of Object.entries(event.data)) {
        let value: DataValue = null;
        let timestamp: number = Date.now();

        log(`Key "${key}" raw value:`, {
          type: typeof values,
          isArray: Array.isArray(values),
          rawValue: values,
        });

        // Handle object format from backend: { value: ..., timestamp: ... }
        if (values && typeof values === 'object' && !Array.isArray(values) && 'value' in (values as any)) {
          value = (values as any).value;
          timestamp = (values as any).timestamp || Date.now();
          log(`Key "${key}" extracted value (object format):`, value, 'ts:', timestamp);
        }
        // Handle array format: [{ value: ..., timestamp: ... }]
        else if (Array.isArray(values) && values.length > 0) {
          value = (values[0] as any).value ?? null;
          timestamp = (values[0] as any).ts || (values[0] as any).timestamp || Date.now();
          log(`Key "${key}" extracted value (array format):`, value, 'ts:', timestamp);
        }

        const cacheKey = `${event.deviceId}::${key}`;
        const existing = this.cache.get(cacheKey);
        
        // Only update if new data is newer than cached data
        if (existing && existing.timestamp >= timestamp) {
          log(`Key "${key}" skipped - cached data is newer (cached: ${existing.timestamp}, new: ${timestamp})`);
          continue;
        }

        const update: DataUpdate = {
          entityId: event.deviceId,
          key,
          value,
          timestamp,
        };

        this.cache.set(cacheKey, update);
        updates.push(update);
      }

      if (updates.length > 0) {
        log('Final Updates to UI:', updates);
        this.listener?.(updates);
      }
    };

    this.ws.subscribe('telemetry', this.wsHandler);
    log('Subscribed to telemetry event');

    // Subscribe to each device
    const deviceIds = new Set(
      this.points.filter((p) => p.entityType === 'DEVICE').map((p) => p.entityId),
    );
    log('Device IDs to subscribe:', Array.from(deviceIds));
    Array.from(deviceIds).forEach((id) => {
      log('Emitting subscribe:device for:', id);
      this.ws!.emit('subscribe:device', { deviceId: id });
    });
  }

  private async fetchAll(isInitial: boolean = false): Promise<void> {
    // Skip HTTP polling if WebSocket is connected - but ALWAYS run initial fetch
    if (!isInitial && this.ws?.connected) {
      log('fetchAll() skipped - WebSocket connected');
      return;
    }
    log(`fetchAll() running - ${isInitial ? 'initial fetch' : 'HTTP fallback'}`);

    // Group points by entityId
    const byEntity = new Map<string, DataPoint[]>();
    for (const p of this.points) {
      const existing = byEntity.get(p.entityId) ?? [];
      existing.push(p);
      byEntity.set(p.entityId, existing);
    }

    const allUpdates: DataUpdate[] = [];
    const now = Date.now();

    const entries = Array.from(byEntity.entries());
    for (const [entityId, entityPoints] of entries) {
      try {
        // Fetch telemetry points
        const telemetryKeys = entityPoints
          .filter((p: DataPoint) => p.kind === 'telemetry')
          .map((p: DataPoint) => p.key);

        if (telemetryKeys.length > 0) {
          const data = await deviceService.getDeviceTelemetry(
            entityId,
            telemetryKeys,
          );

          if (data && typeof data === 'object') {
            for (const [key, values] of Object.entries(data)) {
              let value: DataValue = null;
              if (Array.isArray(values) && values.length > 0) {
                value = (values[0] as any).value ?? null;
              } else {
                value = values as any;
              }

              const update: DataUpdate = { entityId, key, value, timestamp: now };
              this.cache.set(`${entityId}::${key}`, update);
              allUpdates.push(update);
            }
          }
        }

        // Fetch attribute points
        const attrPoints = entityPoints.filter((p: DataPoint) => p.kind === 'attribute');
        const byScope = new Map<string, string[]>();
        for (const ap of attrPoints) {
          const scope = ap.attributeScope || 'SERVER_SCOPE';
          const existing = byScope.get(scope) ?? [];
          existing.push(ap.key);
          byScope.set(scope, existing);
        }

        for (const [scope, keys] of Array.from(byScope.entries())) {
          try {
            const data = await deviceService.getDeviceAttributes(entityId, scope, keys);
            if (data && typeof data === 'object') {
              for (const [key, attrValue] of Object.entries(data)) {
                const value =
                  attrValue && typeof attrValue === 'object' && 'value' in attrValue
                    ? (attrValue as any).value
                    : (attrValue as any);
                const update: DataUpdate = { entityId, key, value, timestamp: now };
                this.cache.set(`${entityId}::${key}`, update);
                allUpdates.push(update);
              }
            }
          } catch {
            // attribute fetch error — ignore
          }
        }
      } catch {
        // entity fetch error — ignore, device might be offline
      }
    }

    if (allUpdates.length > 0) {
      this.listener?.(allUpdates);
    }
  }
}
