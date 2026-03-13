import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayInit,
  OnGatewayConnection,
  OnGatewayDisconnect,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Injectable, Logger } from '@nestjs/common';
import { Server, Socket } from 'socket.io';

/**
 * Room naming conventions for scoped subscriptions:
 * - device:{deviceId}         → Single device telemetry/status
 * - area:{areaId}             → All devices in an area
 * - project:{projectId}       → All devices in a project  
 * - devices:list              → Global device list updates (DEPRECATED - use scoped rooms)
 * - devices:project:{projectId} → Device list for a specific project
 * - devices:area:{areaId}     → Device list for a specific area
 */

interface SubscriptionTracker {
  deviceId: string;
  clients: Set<string>;
  tbSubscriptionId?: number;
}

@Injectable()
@WebSocketGateway({
  cors: {
    origin: '*',
  },
  namespace: '/realtime',
})
export class RealtimeGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(RealtimeGateway.name);
  
  // Track connected clients
  private connectedClients = new Map<string, Socket>();
  
  // Track client subscriptions for cleanup
  private clientSubscriptions = new Map<string, Set<string>>(); // clientId -> Set<room>
  
  // Track device subscriptions for TB WebSocket management
  private deviceSubscriptions = new Map<string, SubscriptionTracker>();

  afterInit(server: Server) {
    this.logger.log('WebSocket Gateway initialized');
  }

  handleConnection(client: Socket) {
    this.connectedClients.set(client.id, client);
    this.clientSubscriptions.set(client.id, new Set());
    this.logger.log(`Client connected: ${client.id} (total: ${this.connectedClients.size})`);
  }

  handleDisconnect(client: Socket) {
    // Clean up all subscriptions for this client
    const rooms = this.clientSubscriptions.get(client.id);
    if (rooms) {
      for (const room of rooms) {
        // If it's a device room, update tracker
        if (room.startsWith('device:')) {
          const deviceId = room.replace('device:', '');
          this.removeClientFromDeviceTracking(deviceId, client.id);
        }
      }
    }
    
    this.connectedClients.delete(client.id);
    this.clientSubscriptions.delete(client.id);
    this.logger.log(`Client disconnected: ${client.id} (total: ${this.connectedClients.size})`);
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // Device subscriptions
  // ─────────────────────────────────────────────────────────────────────────────

  @SubscribeMessage('subscribe:device')
  handleSubscribeDevice(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { deviceId: string },
  ) {
    const room = `device:${data.deviceId}`;
    client.join(room);
    this.trackClientSubscription(client.id, room);
    this.addClientToDeviceTracking(data.deviceId, client.id);
    
    this.logger.debug(`Client ${client.id} subscribed to ${room}`);
    return { event: 'subscribed', data: { room } };
  }

  @SubscribeMessage('unsubscribe:device')
  handleUnsubscribeDevice(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { deviceId: string },
  ) {
    const room = `device:${data.deviceId}`;
    client.leave(room);
    this.untrackClientSubscription(client.id, room);
    this.removeClientFromDeviceTracking(data.deviceId, client.id);
    
    this.logger.debug(`Client ${client.id} unsubscribed from ${room}`);
    return { event: 'unsubscribed', data: { room } };
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // Area subscriptions (scoped)
  // ─────────────────────────────────────────────────────────────────────────────

  @SubscribeMessage('subscribe:area')
  handleSubscribeArea(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { areaId: string },
  ) {
    const room = `area:${data.areaId}`;
    client.join(room);
    this.trackClientSubscription(client.id, room);
    this.logger.debug(`Client ${client.id} subscribed to ${room}`);
    return { event: 'subscribed', data: { room } };
  }

  @SubscribeMessage('unsubscribe:area')
  handleUnsubscribeArea(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { areaId: string },
  ) {
    const room = `area:${data.areaId}`;
    client.leave(room);
    this.untrackClientSubscription(client.id, room);
    this.logger.debug(`Client ${client.id} unsubscribed from ${room}`);
    return { event: 'unsubscribed', data: { room } };
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // Project subscriptions (scoped)
  // ─────────────────────────────────────────────────────────────────────────────

  @SubscribeMessage('subscribe:project')
  handleSubscribeProject(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { projectId: string },
  ) {
    const room = `project:${data.projectId}`;
    client.join(room);
    this.trackClientSubscription(client.id, room);
    this.logger.debug(`Client ${client.id} subscribed to ${room}`);
    return { event: 'subscribed', data: { room } };
  }

  @SubscribeMessage('unsubscribe:project')
  handleUnsubscribeProject(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { projectId: string },
  ) {
    const room = `project:${data.projectId}`;
    client.leave(room);
    this.untrackClientSubscription(client.id, room);
    this.logger.debug(`Client ${client.id} unsubscribed from ${room}`);
    return { event: 'unsubscribed', data: { room } };
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // Scoped device list subscriptions (replaces global devices:list)
  // ─────────────────────────────────────────────────────────────────────────────

  @SubscribeMessage('subscribe:devices:project')
  handleSubscribeDevicesProject(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { projectId: string },
  ) {
    const room = `devices:project:${data.projectId}`;
    client.join(room);
    this.trackClientSubscription(client.id, room);
    this.logger.debug(`Client ${client.id} subscribed to ${room}`);
    return { event: 'subscribed', data: { room } };
  }

  @SubscribeMessage('unsubscribe:devices:project')
  handleUnsubscribeDevicesProject(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { projectId: string },
  ) {
    const room = `devices:project:${data.projectId}`;
    client.leave(room);
    this.untrackClientSubscription(client.id, room);
    this.logger.debug(`Client ${client.id} unsubscribed from ${room}`);
    return { event: 'unsubscribed', data: { room } };
  }

  @SubscribeMessage('subscribe:devices:area')
  handleSubscribeDevicesArea(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { areaId: string },
  ) {
    const room = `devices:area:${data.areaId}`;
    client.join(room);
    this.trackClientSubscription(client.id, room);
    this.logger.debug(`Client ${client.id} subscribed to ${room}`);
    return { event: 'subscribed', data: { room } };
  }

  @SubscribeMessage('unsubscribe:devices:area')
  handleUnsubscribeDevicesArea(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { areaId: string },
  ) {
    const room = `devices:area:${data.areaId}`;
    client.leave(room);
    this.untrackClientSubscription(client.id, room);
    this.logger.debug(`Client ${client.id} unsubscribed from ${room}`);
    return { event: 'unsubscribed', data: { room } };
  }

  // Legacy global subscription (deprecated but kept for backward compatibility)
  @SubscribeMessage('subscribe:devices:list')
  handleSubscribeDevicesList(
    @ConnectedSocket() client: Socket,
  ) {
    const room = 'devices:list';
    client.join(room);
    this.trackClientSubscription(client.id, room);
    this.logger.debug(`Client ${client.id} subscribed to ${room} (deprecated - use scoped rooms)`);
    return { event: 'subscribed', data: { room } };
  }

  @SubscribeMessage('unsubscribe:devices:list')
  handleUnsubscribeDevicesList(
    @ConnectedSocket() client: Socket,
  ) {
    const room = 'devices:list';
    client.leave(room);
    this.untrackClientSubscription(client.id, room);
    this.logger.debug(`Client ${client.id} unsubscribed from ${room}`);
    return { event: 'unsubscribed', data: { room } };
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // Broadcast methods
  // ─────────────────────────────────────────────────────────────────────────────

  /**
   * Broadcast telemetry data to device subscribers
   */
  broadcastTelemetry(deviceId: string, data: any) {
    this.server.to(`device:${deviceId}`).emit('telemetry', {
      deviceId,
      data,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Broadcast telemetry to device AND to scoped rooms (area/project)
   */
  broadcastTelemetryScoped(
    deviceId: string,
    data: any,
    context: { areaId?: string; projectId?: string },
  ) {
    const payload = {
      deviceId,
      data,
      timestamp: new Date().toISOString(),
    };

    // Broadcast to device room
    this.server.to(`device:${deviceId}`).emit('telemetry', payload);

    // Broadcast to area room if provided
    if (context.areaId) {
      this.server.to(`area:${context.areaId}`).emit('telemetry', payload);
    }

    // Broadcast to project room if provided
    if (context.projectId) {
      this.server.to(`project:${context.projectId}`).emit('telemetry', payload);
    }
  }

  /**
   * Broadcast device status update with scoping
   */
  broadcastDeviceStatus(
    deviceId: string,
    status: any,
    context?: { areaId?: string; projectId?: string },
  ) {
    const payload = {
      deviceId,
      status,
      timestamp: new Date().toISOString(),
    };

    // Always broadcast to device-specific room
    this.server.to(`device:${deviceId}`).emit('device:status', payload);

    // Broadcast to scoped device list rooms
    if (context?.areaId) {
      this.server.to(`devices:area:${context.areaId}`).emit('device:status', payload);
    }
    if (context?.projectId) {
      this.server.to(`devices:project:${context.projectId}`).emit('device:status', payload);
    }

    // Legacy: also broadcast to global room (for backward compatibility)
    this.server.to('devices:list').emit('device:status', payload);
  }

  /**
   * Broadcast attribute update to device subscribers
   */
  broadcastAttributes(deviceId: string, scope: string, data: any) {
    this.server.to(`device:${deviceId}`).emit('attributes', {
      deviceId,
      scope,
      data,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Broadcast alarm to area subscribers
   */
  broadcastAlarm(areaId: string, alarm: any) {
    this.server.to(`area:${areaId}`).emit('alarm', {
      areaId,
      alarm,
      timestamp: new Date().toISOString(),
    });
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // Tracking helpers
  // ─────────────────────────────────────────────────────────────────────────────

  private trackClientSubscription(clientId: string, room: string): void {
    const rooms = this.clientSubscriptions.get(clientId);
    if (rooms) {
      rooms.add(room);
    }
  }

  private untrackClientSubscription(clientId: string, room: string): void {
    const rooms = this.clientSubscriptions.get(clientId);
    if (rooms) {
      rooms.delete(room);
    }
  }

  private addClientToDeviceTracking(deviceId: string, clientId: string): void {
    let tracker = this.deviceSubscriptions.get(deviceId);
    if (!tracker) {
      tracker = { deviceId, clients: new Set() };
      this.deviceSubscriptions.set(deviceId, tracker);
    }
    tracker.clients.add(clientId);
  }

  private removeClientFromDeviceTracking(deviceId: string, clientId: string): void {
    const tracker = this.deviceSubscriptions.get(deviceId);
    if (tracker) {
      tracker.clients.delete(clientId);
      // If no more clients subscribed, we could unsubscribe from TB WebSocket
      if (tracker.clients.size === 0) {
        this.deviceSubscriptions.delete(deviceId);
        // TODO: Emit event to unsubscribe from TB WebSocket
      }
    }
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // Stats and monitoring
  // ─────────────────────────────────────────────────────────────────────────────

  /**
   * Get count of connected clients
   */
  getConnectedClientsCount(): number {
    return this.connectedClients.size;
  }

  /**
   * Get list of actively subscribed devices
   */
  getActiveDeviceSubscriptions(): string[] {
    return Array.from(this.deviceSubscriptions.keys());
  }

  /**
   * Get subscription stats
   */
  getStats(): {
    connectedClients: number;
    activeDeviceSubscriptions: number;
    totalRooms: number;
  } {
    return {
      connectedClients: this.connectedClients.size,
      activeDeviceSubscriptions: this.deviceSubscriptions.size,
      totalRooms: Array.from(this.clientSubscriptions.values()).reduce(
        (acc, set) => acc + set.size,
        0,
      ),
    };
  }
}
