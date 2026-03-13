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
  
  private ws: WebSocket | null = null;
  private baseUrl: string;
  private reconnectTimer: NodeJS.Timeout | null = null;
  private heartbeatTimer: NodeJS.Timeout | null = null;
  private isConnected = false;
  private isReconnecting = false;
  
  // Exponential backoff for reconnection
  private reconnectAttempts = 0;
  private readonly RECONNECT_BASE_DELAY = 1000; // 1 second
  private readonly RECONNECT_MAX_DELAY = 60000; // 60 seconds max
  private readonly RECONNECT_MAX_ATTEMPTS = 10; // Max attempts before giving up
  
  // Subscription management
  private subscriptions = new Map<number, TbWebSocketSubscription>();
  private entitySubscriptions = new Map<string, Set<number>>(); // entityId -> subscriptionIds
  private nextSubscriptionId = 1;
  
  // Pending subscriptions (queued while connecting)
  private pendingSubscriptions: Array<{ sub: TbWebSocketSubscription; resolve: (id: number) => void }> = [];

  constructor(
    private readonly configService: ConfigService,
    private readonly tbClient: ThingsBoardClientService,
    private readonly eventEmitter: EventEmitter2,
  ) {
    const tbUrl = this.configService.get<string>('THINGSBOARD_URL', 'http://localhost:8080');
    // Convert HTTP to WebSocket URL
    this.baseUrl = tbUrl.replace(/^http/, 'ws');
  }

  async onModuleInit(): Promise<void> {
    this.logger.log('Initializing ThingsBoard WebSocket connection...');
    await this.connect();
  }

  onModuleDestroy(): void {
    this.disconnect();
  }

  /**
   * Connect to ThingsBoard WebSocket API
   */
  async connect(): Promise<void> {
    if (this.isConnected || this.isReconnecting) {
      return;
    }

    try {
      // Get fresh token from TB client
      const token = await this.tbClient.getAccessToken();
      const wsUrl = `${this.baseUrl}/api/ws/plugins/telemetry?token=${token}`;

      this.logger.log(`Connecting to ThingsBoard WebSocket: ${this.baseUrl}/api/ws/plugins/telemetry`);

      this.ws = new WebSocket(wsUrl);

      this.ws.on('open', () => this.handleOpen());
      this.ws.on('message', (data) => this.handleMessage(data));
      this.ws.on('error', (error) => this.handleError(error));
      this.ws.on('close', (code, reason) => this.handleClose(code, reason));

    } catch (error) {
      this.logger.error(`Failed to connect to ThingsBoard WebSocket: ${error.message}`);
      this.scheduleReconnect();
    }
  }

  /**
   * Disconnect from ThingsBoard WebSocket
   */
  disconnect(): void {
    this.clearTimers();
    
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    
    this.isConnected = false;
    this.subscriptions.clear();
    this.entitySubscriptions.clear();
    this.pendingSubscriptions = [];
    
    this.logger.log('Disconnected from ThingsBoard WebSocket');
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

    // Remove from maps
    this.subscriptions.delete(subscriptionId);
    const entitySubs = this.entitySubscriptions.get(sub.entityId);
    if (entitySubs) {
      entitySubs.delete(subscriptionId);
      if (entitySubs.size === 0) {
        this.entitySubscriptions.delete(sub.entityId);
      }
    }

    // Send unsubscribe command
    if (this.isConnected && this.ws) {
      const cmd = {
        tsSubCmds: [],
        historyCmds: [],
        attrSubCmds: [],
        unsubscribeCmds: [{ cmdId: subscriptionId }],
      };
      this.ws.send(JSON.stringify(cmd));
      this.logger.debug(`Unsubscribed from ${sub.entityId} (cmdId: ${subscriptionId})`);
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
   * Check if connected
   */
  isWebSocketConnected(): boolean {
    return this.isConnected;
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

    // If connected, send subscription command immediately
    if (this.isConnected && this.ws) {
      this.sendSubscriptionCommand(subscriptionId, sub);
    } else {
      // Queue for when connected
      this.pendingSubscriptions.push({
        sub,
        resolve: () => {},
      });
    }

    return subscriptionId;
  }

  private sendSubscriptionCommand(cmdId: number, sub: TbWebSocketSubscription): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return;

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

    this.ws.send(JSON.stringify(cmd));
    this.logger.debug(`Sent subscription for ${sub.entityId} (${sub.scope}, cmdId: ${cmdId})`);
  }

  private handleOpen(): void {
    this.isConnected = true;
    this.isReconnecting = false;
    this.resetReconnectAttempts(); // Reset on successful connection
    this.logger.log('Connected to ThingsBoard WebSocket');

    // Start heartbeat
    this.startHeartbeat();

    // Send pending subscriptions
    for (const { sub, resolve } of this.pendingSubscriptions) {
      const cmdId = this.nextSubscriptionId++;
      this.subscriptions.set(cmdId, sub);
      this.sendSubscriptionCommand(cmdId, sub);
      resolve(cmdId);
    }
    this.pendingSubscriptions = [];

    // Re-subscribe existing subscriptions (after reconnect)
    for (const [cmdId, sub] of this.subscriptions) {
      this.sendSubscriptionCommand(cmdId, sub);
    }

    // Emit connected event
    this.eventEmitter.emit('tb.websocket.connected');
  }

  private handleMessage(data: WebSocket.Data): void {
    try {
      const message = JSON.parse(data.toString());

      // Handle subscription updates
      if (message.subscriptionId !== undefined) {
        this.handleSubscriptionUpdate(message);
      }

      // Handle errors
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
      // Telemetry or attribute update
      const update: TbTelemetryUpdate = {
        subscriptionId: message.subscriptionId,
        entityId: sub.entityId,
        entityType: sub.entityType,
        data: message.data,
        latestValues: message.latestValues || {},
      };

      // Emit event for listeners
      this.eventEmitter.emit('tb.telemetry.update', update);
      this.eventEmitter.emit(`tb.telemetry.${sub.entityId}`, update);

      this.logger.debug(`Received telemetry update for ${sub.entityId}: ${Object.keys(message.data).join(', ')}`);
    }
  }

  private handleError(error: Error): void {
    this.logger.error(`ThingsBoard WebSocket error: ${error.message}`);
  }

  private handleClose(code: number, reason: Buffer): void {
    this.isConnected = false;
    this.clearTimers();

    this.logger.warn(`ThingsBoard WebSocket closed: code=${code}, reason=${reason?.toString() || 'N/A'}`);

    // Auto-reconnect unless intentionally closed
    if (code !== 1000) {
      this.scheduleReconnect();
    }
  }

  private scheduleReconnect(): void {
    if (this.isReconnecting) return;

    // Check if we've exceeded max attempts
    if (this.reconnectAttempts >= this.RECONNECT_MAX_ATTEMPTS) {
      this.logger.error(`Exceeded max reconnect attempts (${this.RECONNECT_MAX_ATTEMPTS}). Giving up.`);
      this.isReconnecting = false;
      return;
    }

    this.isReconnecting = true;
    this.reconnectAttempts++;

    // Calculate delay with exponential backoff + jitter
    // Formula: min(baseDelay * 2^attempts + jitter, maxDelay)
    const exponentialDelay = this.RECONNECT_BASE_DELAY * Math.pow(2, this.reconnectAttempts - 1);
    const jitter = Math.random() * 1000; // 0-1000ms jitter
    const delay = Math.min(exponentialDelay + jitter, this.RECONNECT_MAX_DELAY);

    this.logger.log(`Scheduling reconnect in ${Math.round(delay)}ms (attempt ${this.reconnectAttempts}/${this.RECONNECT_MAX_ATTEMPTS})...`);

    this.reconnectTimer = setTimeout(async () => {
      this.isReconnecting = false;
      await this.connect();
    }, delay);
  }

  /**
   * Reset reconnect attempts on successful connection
   */
  private resetReconnectAttempts(): void {
    this.reconnectAttempts = 0;
  }

  private startHeartbeat(): void {
    // Send ping every 30 seconds to keep connection alive
    this.heartbeatTimer = setInterval(() => {
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        this.ws.ping();
      }
    }, 30000);
  }

  private clearTimers(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
  }
}
