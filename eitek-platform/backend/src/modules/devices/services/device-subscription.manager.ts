/**
 * Device Subscription Manager
 * 
 * Manages on-demand device subscriptions for real-time telemetry updates.
 * Only subscribes to ThingsBoard WebSocket for devices that have active client viewers.
 * 
 * Key features:
 * - On-demand subscription: Only sync devices that clients are actively viewing
 * - Batch initial data fetch: Efficiently load initial state for multiple devices
 * - TB WebSocket integration: Real-time updates instead of polling
 * - Reference counting: Unsubscribe when no clients are watching
 * - Debounced subscriptions: Prevent subscription storm on rapid navigation
 * - Delayed cleanup: Allow re-subscription without TB WebSocket churn
 */

import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { PrismaService } from '../../../database/prisma.service';
import { ThingsBoardWebSocketService, TbTelemetryUpdate } from '../../thingsboard-integration/services/thingsboard-websocket.service';
import { ThingsBoardTelemetryApiService } from '../../thingsboard-integration/services/telemetry-api.service';
import { DeviceMapper } from '../../thingsboard-integration/mappers/device.mapper';
import { RealtimeGateway } from '../../realtime/realtime.gateway';

interface DeviceSubscriptionState {
  deviceId: string;
  tbDeviceId: string;
  areaId?: string;
  projectId?: string;
  clientCount: number;
  tbTelemetrySubId?: number;
  tbAttributesSubId?: number;
  lastUpdate?: Date;
  cleanupTimer?: NodeJS.Timeout; // Timer for delayed cleanup
}

@Injectable()
export class DeviceSubscriptionManager implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(DeviceSubscriptionManager.name);
  
  // Active device subscriptions
  private subscriptions = new Map<string, DeviceSubscriptionState>();
  
  // Reverse index: tbDeviceId → deviceId for O(1) lookup on telemetry updates
  private tbDeviceIdIndex = new Map<string, string>();
  
  // Batch queue for initial data fetch
  private batchQueue: string[] = [];
  private batchTimer: NodeJS.Timeout | null = null;
  private readonly BATCH_DELAY = 100; // ms to wait before processing batch
  private readonly BATCH_SIZE = 50; // Max devices per batch

  // Subscription storm prevention
  private readonly CLEANUP_DELAY = 5000; // ms - delay before actual cleanup
  private pendingCleanups = new Map<string, NodeJS.Timeout>(); // deviceId -> cleanup timer

  // Serialization locks to prevent race conditions
  private operationLocks = new Map<string, Promise<void>>();

  constructor(
    private readonly prisma: PrismaService,
    private readonly tbWebSocket: ThingsBoardWebSocketService,
    private readonly tbTelemetryApi: ThingsBoardTelemetryApiService,
    private readonly deviceMapper: DeviceMapper,
    private readonly realtimeGateway: RealtimeGateway,
  ) {}

  async onModuleInit(): Promise<void> {
    this.logger.log('Device Subscription Manager initialized');
  }

  /**
   * Handle client subscription event from RealtimeGateway
   * This bridges the gap between Socket.io rooms and ThingsBoard WebSocket
   */
  @OnEvent('device.client.subscribed')
  async handleClientSubscribed(payload: { deviceId: string }): Promise<void> {
    this.logger.debug(`Received device.client.subscribed event for ${payload.deviceId}`);
    await this.subscribeDevice(payload.deviceId);
  }

  /**
   * Handle client unsubscription event from RealtimeGateway
   */
  @OnEvent('device.client.unsubscribed')
  handleClientUnsubscribed(payload: { deviceId: string }): void {
    this.logger.debug(`Received device.client.unsubscribed event for ${payload.deviceId}`);
    this.unsubscribeDevice(payload.deviceId);
  }

  /**
   * Clean up on module destroy - clear all timers and subscriptions
   */
  async onModuleDestroy(): Promise<void> {
    this.logger.log('Device Subscription Manager shutting down...');

    // Clear batch timer
    if (this.batchTimer) {
      clearTimeout(this.batchTimer);
      this.batchTimer = null;
    }

    // Clear all pending cleanup timers
    for (const timer of this.pendingCleanups.values()) {
      clearTimeout(timer);
    }
    this.pendingCleanups.clear();

    // Unsubscribe all from TB WebSocket
    const cleanupPromises: Promise<void>[] = [];
    for (const [deviceId, state] of this.subscriptions.entries()) {
      cleanupPromises.push(this.performCleanup(deviceId, state));
    }
    
    await Promise.allSettled(cleanupPromises);
    this.subscriptions.clear();
    this.tbDeviceIdIndex.clear();
    
    this.logger.log('Device Subscription Manager shutdown complete');
  }

  /**
   * Acquire a lock for a specific device operation to prevent race conditions
   */
  private async withLock<T>(deviceId: string, fn: () => Promise<T>): Promise<T> {
    // Wait for any existing operation on this device
    const existingLock = this.operationLocks.get(deviceId);
    if (existingLock) {
      await existingLock;
    }

    // Create a new lock
    let releaseLock: () => void;
    const lockPromise = new Promise<void>((resolve) => {
      releaseLock = resolve;
    });
    this.operationLocks.set(deviceId, lockPromise);

    try {
      return await fn();
    } finally {
      releaseLock!();
      this.operationLocks.delete(deviceId);
    }
  }

  /**
   * Subscribe to a device's real-time updates.
   * Called when a client subscribes to a device.
   * If device is pending cleanup, cancel cleanup and reuse subscription.
   */
  async subscribeDevice(deviceId: string): Promise<void> {
    console.log('\n[SUBSCRIBE] subscribeDevice called for:', deviceId);
    
    return this.withLock(deviceId, async () => {
      // Cancel any pending cleanup for this device
      const pendingCleanup = this.pendingCleanups.get(deviceId);
      if (pendingCleanup) {
        clearTimeout(pendingCleanup);
        this.pendingCleanups.delete(deviceId);
        this.logger.debug(`Cancelled pending cleanup for device ${deviceId}`);
      }

      // Check if already subscribed (or subscription is being kept warm)
      const existing = this.subscriptions.get(deviceId);
      if (existing) {
        existing.clientCount++;
        console.log('[SUBSCRIBE] Already subscribed, clientCount:', existing.clientCount);
        // Clear cleanup timer if any
        if (existing.cleanupTimer) {
          clearTimeout(existing.cleanupTimer);
          existing.cleanupTimer = undefined;
        }
        this.logger.debug(`Device ${deviceId} subscription count: ${existing.clientCount}`);
        return;
      }

      // Get device info from database
      const device = await this.prisma.device.findUnique({
        where: { id: deviceId },
        include: {
          area: {
            include: {
              site: {
                select: { projectId: true },
              },
            },
          },
        },
      });

      if (!device || !device.tbDeviceId) {
        this.logger.warn(`Cannot subscribe to device ${deviceId}: device not found or no TB device ID`);
        return;
      }

      console.log('[SUBSCRIBE] Found device, tbDeviceId:', device.tbDeviceId);

      // Create subscription state
      const state: DeviceSubscriptionState = {
        deviceId,
        tbDeviceId: device.tbDeviceId,
        areaId: device.areaId ?? undefined,
        projectId: device.area?.site?.projectId ?? undefined,
        clientCount: 1,
      };

      this.subscriptions.set(deviceId, state);
      this.tbDeviceIdIndex.set(device.tbDeviceId, deviceId);

      // Subscribe to TB WebSocket for real-time updates
      try {
        // Subscribe to ALL telemetry
        console.log('[SUBSCRIBE] Subscribing to telemetry for:', device.tbDeviceId);
        state.tbTelemetrySubId = await this.tbWebSocket.subscribeTelemetry(
          device.tbDeviceId,
          'DEVICE',
        );
        console.log('[SUBSCRIBE] Telemetry subId:', state.tbTelemetrySubId);
        // Subscribe to server scope attributes (device status)
        state.tbAttributesSubId = await this.tbWebSocket.subscribeAttributes(
          device.tbDeviceId,
          'SERVER_SCOPE',
          'DEVICE',
          ['active', 'lastActivityTime'],
        );

        // Subscribe to shared scope attributes (device may store relay state here)
        await this.tbWebSocket.subscribeAttributes(
          device.tbDeviceId,
          'SHARED_SCOPE',
          'DEVICE',
        );

        // Subscribe to client scope attributes (device-published attributes)
        await this.tbWebSocket.subscribeAttributes(
          device.tbDeviceId,
          'CLIENT_SCOPE', 
          'DEVICE',
        );

        this.logger.log(`Subscribed to device ${deviceId} (TB: ${device.tbDeviceId}) - telemetry + all attribute scopes`);
      } catch (error) {
        this.logger.error(`Failed to subscribe to TB WebSocket for device ${deviceId}: ${error.message}`);
        // Clean up zombie subscription to prevent memory leak
        this.subscriptions.delete(deviceId);
        this.tbDeviceIdIndex.delete(device.tbDeviceId);
        return;
      }

      // Queue for batch initial data fetch
      this.queueBatchFetch(deviceId);
    });
  }

  /**
   * Unsubscribe from a device's updates.
   * Called when a client unsubscribes from a device.
   * Uses delayed cleanup to allow quick re-subscription without TB WebSocket churn.
   */
  unsubscribeDevice(deviceId: string): void {
    const state = this.subscriptions.get(deviceId);
    if (!state) return;

    // Safely decrement, prevent negative
    state.clientCount = Math.max(0, state.clientCount - 1);

    if (state.clientCount === 0) {
      // No more clients watching - schedule delayed cleanup
      // This allows quick re-subscription without TB WebSocket overhead
      if (this.pendingCleanups.has(deviceId)) {
        // Already scheduled
        return;
      }

      this.logger.debug(`Scheduling cleanup for device ${deviceId} in ${this.CLEANUP_DELAY}ms`);
      
      const cleanupTimer = setTimeout(() => {
        this.pendingCleanups.delete(deviceId);
        
        // Re-check clientCount in case new subscriptions arrived
        const currentState = this.subscriptions.get(deviceId);
        if (currentState && currentState.clientCount === 0) {
          this.performCleanup(deviceId, currentState).catch(err => {
            this.logger.error(`Error during cleanup for device ${deviceId}: ${err.message}`);
          });
        }
      }, this.CLEANUP_DELAY);

      this.pendingCleanups.set(deviceId, cleanupTimer);
      state.cleanupTimer = cleanupTimer;
    } else {
      this.logger.debug(`Device ${deviceId} subscription count: ${state.clientCount}`);
    }
  }

  /**
   * Perform actual cleanup - unsubscribe from TB WebSocket and remove state
   */
  private async performCleanup(deviceId: string, state: DeviceSubscriptionState): Promise<void> {
    try {
      if (state.tbTelemetrySubId) {
        this.tbWebSocket.unsubscribe(state.tbTelemetrySubId);
      }
      if (state.tbAttributesSubId) {
        this.tbWebSocket.unsubscribe(state.tbAttributesSubId);
      }

      this.subscriptions.delete(deviceId);
      this.tbDeviceIdIndex.delete(state.tbDeviceId);
      this.logger.log(`Unsubscribed from device ${deviceId}`);
    } catch (error) {
      this.logger.error(`Error cleaning up subscription for device ${deviceId}: ${error.message}`);
      // Still remove from maps to prevent state leak
      this.subscriptions.delete(deviceId);
      this.tbDeviceIdIndex.delete(state.tbDeviceId);
    }
  }


  /**
   * Handle telemetry updates from TB WebSocket
   */
  @OnEvent('tb.telemetry.update')
  handleTelemetryUpdate(update: TbTelemetryUpdate): void {
    console.log('\n╔════════════════════════════════════════════════╗');
    console.log('║  TELEMETRY FROM THINGSBOARD                   ║');
    console.log('╠════════════════════════════════════════════════╣');
    console.log('TB Entity ID:', update.entityId);
    console.log('Raw Data from TB:');
    console.log(JSON.stringify(update.data, null, 2));
    console.log('╚════════════════════════════════════════════════╝\n');
    
    // Find the device by TB entity ID
    const state = this.findByTbEntityId(update.entityId);
    if (!state) {
      console.log('[WARNING] No subscription found for TB entity:', update.entityId);
      return;
    }
    
    console.log('Mapped to internal device:', state.deviceId);

    // Map telemetry data
    const mappedData = this.deviceMapper.mapTelemetryData(update.data);
    console.log('Mapped Data:', JSON.stringify(mappedData, null, 2));

    // Broadcast to connected clients with scoping (no DB write)
    this.realtimeGateway.broadcastTelemetryScoped(
      state.deviceId,
      mappedData,
      { areaId: state.areaId, projectId: state.projectId },
    );
  }

  /**
   * Get subscription statistics
   */
  getStats(): {
    activeSubscriptions: number;
    totalClientCount: number;
    tbWebSocketConnected: boolean;
  } {
    let totalClientCount = 0;
    for (const state of this.subscriptions.values()) {
      totalClientCount += state.clientCount;
    }

    return {
      activeSubscriptions: this.subscriptions.size,
      totalClientCount,
      tbWebSocketConnected: this.tbWebSocket.isWebSocketConnected(),
    };
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // Batch fetching for initial data
  // ─────────────────────────────────────────────────────────────────────────────

  private queueBatchFetch(deviceId: string): void {
    this.batchQueue.push(deviceId);

    // Reset timer
    if (this.batchTimer) {
      clearTimeout(this.batchTimer);
    }

    // If batch is full, process immediately
    if (this.batchQueue.length >= this.BATCH_SIZE) {
      this.processBatchQueue();
      return;
    }

    // Otherwise wait for more devices
    this.batchTimer = setTimeout(() => this.processBatchQueue(), this.BATCH_DELAY);
  }

  private async processBatchQueue(): Promise<void> {
    if (this.batchQueue.length === 0) return;

    const deviceIds = [...this.batchQueue];
    this.batchQueue = [];
    this.batchTimer = null;

    this.logger.log(`Batch fetching initial data for ${deviceIds.length} devices`);

    // Fetch data in parallel batches
    const batchPromises = deviceIds.map(async (deviceId) => {
      const state = this.subscriptions.get(deviceId);
      if (!state) return;

      try {
        await this.fetchAndBroadcastDeviceData(state);
      } catch (error) {
        this.logger.error(`Failed to fetch initial data for device ${deviceId}: ${error.message}`);
      }
    });

    await Promise.allSettled(batchPromises);
    this.logger.log(`Batch fetch completed for ${deviceIds.length} devices`);
  }

  private async fetchAndBroadcastDeviceData(state: DeviceSubscriptionState): Promise<void> {
    console.log('\n╔════════════════════════════════════════════════╗');
    console.log('║  INITIAL FETCH FOR DEVICE                      ║');
    console.log('╠════════════════════════════════════════════════╣');
    console.log('Device ID:', state.deviceId);
    console.log('TB Device ID:', state.tbDeviceId);
    
    // Fetch latest telemetry
    const telemetryData = await this.tbTelemetryApi.getLatestTelemetry(state.tbDeviceId);
    console.log('Raw Telemetry from TB API:');
    console.log(JSON.stringify(telemetryData, null, 2));

    // Fetch server attributes for online status
    const serverAttributes = await this.tbTelemetryApi.getAttributes(
      state.tbDeviceId,
      'SERVER_SCOPE',
      ['active', 'lastActivityTime'],
    );

    const isOnline = serverAttributes['active']?.value === true;
    const lastActivityTime = serverAttributes['lastActivityTime']?.value as number | undefined;

    // Map telemetry
    const mappedTelemetry = this.deviceMapper.mapTelemetryData(telemetryData);
    console.log('Mapped Telemetry:');
    console.log(JSON.stringify(mappedTelemetry, null, 2));
    console.log('╚════════════════════════════════════════════════╝\n');

    // Broadcast to clients (no DB write — TB is source of truth)
    this.realtimeGateway.broadcastTelemetryScoped(
      state.deviceId,
      mappedTelemetry,
      { areaId: state.areaId, projectId: state.projectId },
    );

    this.realtimeGateway.broadcastDeviceStatus(
      state.deviceId,
      { isOnline, lastActivityTime },
      { areaId: state.areaId, projectId: state.projectId },
    );

    state.lastUpdate = new Date();
  }

  private findByTbEntityId(tbEntityId: string): DeviceSubscriptionState | undefined {
    const deviceId = this.tbDeviceIdIndex.get(tbEntityId);
    if (!deviceId) return undefined;
    return this.subscriptions.get(deviceId);
  }
}
