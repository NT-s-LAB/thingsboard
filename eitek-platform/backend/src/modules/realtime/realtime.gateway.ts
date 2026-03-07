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
import { Logger } from '@nestjs/common';
import { Server, Socket } from 'socket.io';

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
  private connectedClients = new Map<string, Socket>();

  afterInit(server: Server) {
    this.logger.log('WebSocket Gateway initialized');
  }

  handleConnection(client: Socket) {
    this.connectedClients.set(client.id, client);
    this.logger.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.connectedClients.delete(client.id);
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  @SubscribeMessage('subscribe:device')
  handleSubscribeDevice(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { deviceId: string },
  ) {
    const room = `device:${data.deviceId}`;
    client.join(room);
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
    this.logger.debug(`Client ${client.id} unsubscribed from ${room}`);
    return { event: 'unsubscribed', data: { room } };
  }

  @SubscribeMessage('subscribe:area')
  handleSubscribeArea(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { areaId: string },
  ) {
    const room = `area:${data.areaId}`;
    client.join(room);
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
    this.logger.debug(`Client ${client.id} unsubscribed from ${room}`);
    return { event: 'unsubscribed', data: { room } };
  }

  /**
   * Broadcast telemetry data to subscribers
   */
  broadcastTelemetry(deviceId: string, data: any) {
    this.server.to(`device:${deviceId}`).emit('telemetry', {
      deviceId,
      data,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Broadcast device status update
   */
  broadcastDeviceStatus(deviceId: string, status: any) {
    this.server.to(`device:${deviceId}`).emit('device:status', {
      deviceId,
      status,
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

  /**
   * Get count of connected clients
   */
  getConnectedClientsCount(): number {
    return this.connectedClients.size;
  }
}
