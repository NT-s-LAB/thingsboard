/**
 * ThingsBoard WebSocket Service
 * 
 * Subscribes to ThingsBoard's native WebSocket API for real-time telemetry updates.
 * This replaces the polling-based approach for better scalability with 1000+ devices.
 * 
 * ThingsBoard WebSocket Protocol:
 * - Connect to: ws://{TB_HOST}/api/ws/plugins/telemetry?token={JWT_TOKEN}
 * - Subscribe to telemetry: { "tsSubCmds": [...], "attrSubCmds": [...] }
 * - Receive updates in real-time instead of polling
 */

import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EventEmitter2 } from '@nestjs/event-emitter';
import WebSocket from 'ws';
import { ThingsBoardClientService } from './thingsboard-client.service';

export interface TbWebSocketSubscription {
  entityType: 'DEVICE' | 'ASSET';
  entityId: string;
  scope?: 'LATEST_TELEMETRY' | 'CLIENT_SCOPE' | 'SERVER_SCOPE' | 'SHARED_SCOPE';
  keys?: string[];
}

export interface TbTelemetryUpdate {
  subscriptionId: number;
  entityId: string;
  entityType: string;
  data: Record<string, Array<{ ts: number; value: any }>>;
  latestValues: Record<string, any>;
}

export interface TbAttributeUpdate {
  subscriptionId: number;
  entityId: string;
  entityType: string;
  scope: string;
  data: Record<string, any>;
}

@Injectable()
export class ThingsBoardWebSocketService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(ThingsBoardWebSocketService.name);
  
  // Connection pool for scalability (round-robin)
  private wsPool: (WebSocket | null)[] = [];
  private wsConnected: boolean[] = [];
  private readonly POOL_SIZE: number;
  private baseUrl: string;
  private reconnectTimers: (NodeJS.Timeout | null)[] = [];
  private heartbeatTimers: (NodeJS.Timeout | null)[] = [];
  private isReconnecting: boolean[] = [];
  
  // Exponential backoff for reconnection
  private reconnectAttempts: number[] = [];
  private readonly RECONNECT_BASE_DELAY = 1000;
  private readonly RECONNECT_MAX_DELAY = 60000;
  private readonly RECONNECT_MAX_ATTEMPTS = 10;
  
  // Subscription management (shared across pool)
  private subscriptions = new Map<number, TbWebSocketSubscription>();
  private entitySubscriptions = new Map<string, Set<number>>();
  private nextSubscriptionId = 1;
  // Track which pool index owns each subscription
  private subscriptionToPool = new Map<number, number>();
  // Round-robin counter
  private nextPoolIndex = 0;
  
  // Pending subscriptions (queued while connecting)
  private pendingSubscriptions: Array<{ sub: TbWebSocketSubscription; resolve: (id: number) => void }> = [];

  constructor(
    private readonly configService: ConfigService,
    private readonly tbClient: ThingsBoardClientService,
    private readonly eventEmitter: EventEmitter2,
  ) {
    const tbUrl = this.configService.get<string>('THINGSBOARD_URL', 'http://localhost:8080');
    this.baseUrl = tbUrl.replace(/^http/, 'ws');
    this.POOL_SIZE = this.configService.get<number>('TB_WS_POOL_SIZE', 3);
    
    // Initialize pool arrays
    for (let i = 0; i < this.POOL_SIZE; i++) {
      this.wsPool.push(null);
      this.wsConnected.push(false);
      this.isReconnecting.push(false);
      this.reconnectAttempts.push(0);
      this.reconnectTimers.push(null);
      this.heartbeatTimers.push(null);
    }
  }

  async onModuleInit(): Promise<void> {
    this.logger.log(`Initializing ThingsBoard WebSocket pool (${this.POOL_SIZE} connections)...`);
    const connectPromises = [];
    for (let i = 0; i < this.POOL_SIZE; i++) {
      connectPromises.push(this.connectOne(i));
    }
    await Promise.allSettled(connectPromises);
  }

  onModuleDestroy(): void {
    this.disconnect();
  }

  /**
   * Connect a single pool member
   */
  private async connectOne(index: number): Promise<void> {
    if (this.wsConnected[index] || this.isReconnecting[index]) return;

    try {
      const token = await this.tbClient.getAccessToken();
      const wsUrl = `${this.baseUrl}/api/ws/plugins/telemetry?token=${token}`;

      this.logger.log(`Connecting WS pool[${index}] to ThingsBoard...`);

      const ws = new WebSocket(wsUrl);
      this.wsPool[index] = ws;

      ws.on('open', () => this.handleOpen(index));
      ws.on('message', (data) => this.handleMessage(data));
      ws.on('error', (error) => this.handleError(index, error));
      ws.on('close', (code, reason) => this.handleClose(index, code, reason));
    } catch (error) {
      this.logger.error(`Failed to connect WS pool[${index}]: ${error.message}`);
      this.scheduleReconnect(index);
    }
  }

  /**
   * Disconnect all pool members
   */
  disconnect(): void {
    for (let i = 0; i < this.POOL_SIZE; i++) {
      this.clearTimers(i);
      if (this.wsPool[i]) {
        this.wsPool[i]!.close();
        this.wsPool[i] = null;
      }
      this.wsConnected[i] = false;
    }
    
    this.subscriptions.clear();
    this.entitySubscriptions.clear();
    this.subscriptionToPool.clear();
    this.pendingSubscriptions = [];
    
    this.logger.log('Disconnected all ThingsBoard WebSocket pool members');
  }

  /**
   * Subscribe to telemetry updates for an entity
   */
  async subscribeTelemetry(
    entityId: string,
    entityType: 'DEVICE' | 'ASSET' = 'DEVICE',
    keys?: string[],
  ): Promise<number> {
    const sub: TbWebSocketSubscription = {
      entityType,
      entityId,
      scope: 'LATEST_TELEMETRY',
      keys,
    };

    return this.subscribe(sub);
  }

  /**
   * Subscribe to attribute updates for an entity
   */
  async subscribeAttributes(
    entityId: string,
    scope: 'CLIENT_SCOPE' | 'SERVER_SCOPE' | 'SHARED_SCOPE',
    entityType: 'DEVICE' | 'ASSET' = 'DEVICE',
    keys?: string[],
  ): Promise<number> {
    const sub: TbWebSocketSubscription = {
      entityType,
      entityId,
      scope,
      keys,
    };

    return this.subscribe(sub);
  }

  /**
   * Unsubscribe from updates
   */
  unsubscribe(subscriptionId: number): void {
    const sub = this.subscriptions.get(subscriptionId);
    if (!sub) return;

    const poolIndex = this.subscriptionToPool.get(subscriptionId);

    // Remove from maps
    this.subscriptions.delete(subscriptionId);
    this.subscriptionToPool.delete(subscriptionId);
    const entitySubs = this.entitySubscriptions.get(sub.entityId);
    if (entitySubs) {
      entitySubs.delete(subscriptionId);
      if (entitySubs.size === 0) {
        this.entitySubscriptions.delete(sub.entityId);
      }
    }

    // Send unsubscribe command to the right pool member
    if (poolIndex !== undefined && this.wsConnected[poolIndex] && this.wsPool[poolIndex]) {
      const cmd = {
        tsSubCmds: [],
        historyCmds: [],
        attrSubCmds: [],
        unsubscribeCmds: [{ cmdId: subscriptionId }],
      };
      this.wsPool[poolIndex]!.send(JSON.stringify(cmd));
      this.logger.debug(`Unsubscribed from ${sub.entityId} (cmdId: ${subscriptionId}, pool: ${poolIndex})`);
    }
  }

  /**
   * Unsubscribe from all updates for an entity
   */
  unsubscribeEntity(entityId: string): void {
    const subs = this.entitySubscriptions.get(entityId);
    if (!subs) return;

    for (const subId of subs) {
      this.unsubscribe(subId);
    }
  }

  /**
   * Get subscription count
   */
  getSubscriptionCount(): number {
    return this.subscriptions.size;
  }

  /**
   * Check if at least one pool member is connected
   */
  isWebSocketConnected(): boolean {
    return this.wsConnected.some((c) => c);
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // Private methods
  // ─────────────────────────────────────────────────────────────────────────────

  private async subscribe(sub: TbWebSocketSubscription): Promise<number> {
    const subscriptionId = this.nextSubscriptionId++;

    // Store subscription
    this.subscriptions.set(subscriptionId, sub);
    if (!this.entitySubscriptions.has(sub.entityId)) {
      this.entitySubscriptions.set(sub.entityId, new Set());
    }
    this.entitySubscriptions.get(sub.entityId)!.add(subscriptionId);

    // Find a connected pool member (round-robin)
    const poolIndex = this.pickPoolIndex();
    if (poolIndex !== null) {
      this.subscriptionToPool.set(subscriptionId, poolIndex);
      this.sendSubscriptionCommand(poolIndex, subscriptionId, sub);
    } else {
      // Queue for when connected
      this.pendingSubscriptions.push({ sub, resolve: () => {} });
    }

    return subscriptionId;
  }

  /**
   * Pick next connected pool member via round-robin
   */
  private pickPoolIndex(): number | null {
    for (let i = 0; i < this.POOL_SIZE; i++) {
      const idx = (this.nextPoolIndex + i) % this.POOL_SIZE;
      if (this.wsConnected[idx] && this.wsPool[idx]) {
        this.nextPoolIndex = (idx + 1) % this.POOL_SIZE;
        return idx;
      }
    }
    return null;
  }

  private sendSubscriptionCommand(poolIndex: number, cmdId: number, sub: TbWebSocketSubscription): void {
    const ws = this.wsPool[poolIndex];
    if (!ws || ws.readyState !== WebSocket.OPEN) return;

    const cmd: any = {
      tsSubCmds: [],
      historyCmds: [],
      attrSubCmds: [],
    };

    if (sub.scope === 'LATEST_TELEMETRY') {
      cmd.tsSubCmds.push({
        entityType: sub.entityType,
        entityId: sub.entityId,
        scope: 'LATEST_TELEMETRY',
        cmdId,
        keys: sub.keys?.join(',') || '',
      });
    } else {
      cmd.attrSubCmds.push({
        entityType: sub.entityType,
        entityId: sub.entityId,
        scope: sub.scope,
        cmdId,
        keys: sub.keys?.join(',') || '',
      });
    }

    ws.send(JSON.stringify(cmd));
    this.logger.debug(`Sent subscription for ${sub.entityId} (${sub.scope}, cmdId: ${cmdId}, pool: ${poolIndex})`);
  }

  private handleOpen(index: number): void {
    this.wsConnected[index] = true;
    this.isReconnecting[index] = false;
    this.reconnectAttempts[index] = 0;
    this.logger.log(`WS pool[${index}] connected to ThingsBoard`);

    // Start heartbeat for this connection
    this.startHeartbeat(index);

    // On first connection ready: flush pending subscriptions
    if (this.pendingSubscriptions.length > 0) {
      const pending = [...this.pendingSubscriptions];
      this.pendingSubscriptions = [];
      for (const { sub, resolve } of pending) {
        const cmdId = this.nextSubscriptionId++;
        this.subscriptions.set(cmdId, sub);
        if (!this.entitySubscriptions.has(sub.entityId)) {
          this.entitySubscriptions.set(sub.entityId, new Set());
        }
        this.entitySubscriptions.get(sub.entityId)!.add(cmdId);
        this.subscriptionToPool.set(cmdId, index);
        this.sendSubscriptionCommand(index, cmdId, sub);
        resolve(cmdId);
      }
    }

    // Re-subscribe subscriptions that belonged to this pool index (after reconnect)
    for (const [cmdId, sub] of this.subscriptions) {
      if (this.subscriptionToPool.get(cmdId) === index) {
        this.sendSubscriptionCommand(index, cmdId, sub);
      }
    }

    this.eventEmitter.emit('tb.websocket.connected');
  }

  private handleMessage(data: WebSocket.Data): void {
    try {
      const message = JSON.parse(data.toString());

      if (message.subscriptionId !== undefined) {
        this.handleSubscriptionUpdate(message);
      }

      if (message.errorCode) {
        this.logger.error(`ThingsBoard WebSocket error: ${message.errorMsg || message.errorCode}`);
      }
    } catch (error) {
      this.logger.error(`Failed to parse WebSocket message: ${error.message}`);
    }
  }

  private handleSubscriptionUpdate(message: any): void {
    const sub = this.subscriptions.get(message.subscriptionId);
    if (!sub) return;

    if (message.data) {
      const update: TbTelemetryUpdate = {
        subscriptionId: message.subscriptionId,
        entityId: sub.entityId,
        entityType: sub.entityType,
        data: message.data,
        latestValues: message.latestValues || {},
      };

      this.eventEmitter.emit('tb.telemetry.update', update);
      this.eventEmitter.emit(`tb.telemetry.${sub.entityId}`, update);
    }
  }

  private handleError(index: number, error: Error): void {
    this.logger.error(`WS pool[${index}] error: ${error.message}`);
  }

  private handleClose(index: number, code: number, reason: Buffer): void {
    this.wsConnected[index] = false;
    this.clearTimers(index);

    this.logger.warn(`WS pool[${index}] closed: code=${code}, reason=${reason?.toString() || 'N/A'}`);

    if (code !== 1000) {
      this.scheduleReconnect(index);
    }
  }

  private scheduleReconnect(index: number): void {
    if (this.isReconnecting[index]) return;

    if (this.reconnectAttempts[index] >= this.RECONNECT_MAX_ATTEMPTS) {
      this.logger.error(`WS pool[${index}] exceeded max reconnect attempts. Giving up.`);
      this.isReconnecting[index] = false;
      return;
    }

    this.isReconnecting[index] = true;
    this.reconnectAttempts[index]++;

    const exponentialDelay = this.RECONNECT_BASE_DELAY * Math.pow(2, this.reconnectAttempts[index] - 1);
    const jitter = Math.random() * 1000;
    const delay = Math.min(exponentialDelay + jitter, this.RECONNECT_MAX_DELAY);

    this.logger.log(`WS pool[${index}] reconnecting in ${Math.round(delay)}ms (attempt ${this.reconnectAttempts[index]}/${this.RECONNECT_MAX_ATTEMPTS})...`);

    this.reconnectTimers[index] = setTimeout(async () => {
      this.isReconnecting[index] = false;
      await this.connectOne(index);
    }, delay);
  }

  private startHeartbeat(index: number): void {
    this.heartbeatTimers[index] = setInterval(() => {
      const ws = this.wsPool[index];
      if (ws && ws.readyState === WebSocket.OPEN) {
        ws.ping();
      }
    }, 30000);
  }

  private clearTimers(index: number): void {
    if (this.reconnectTimers[index]) {
      clearTimeout(this.reconnectTimers[index]!);
      this.reconnectTimers[index] = null;
    }
    if (this.heartbeatTimers[index]) {
      clearInterval(this.heartbeatTimers[index]!);
      this.heartbeatTimers[index] = null;
    }
  }
}
