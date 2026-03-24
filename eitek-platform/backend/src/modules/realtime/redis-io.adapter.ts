/**
 * Redis Adapter Configuration for Socket.io
 * 
 * Enables horizontal scaling by sharing WebSocket state across multiple backend instances.
 * All instances will receive and emit events to all connected clients.
 * 
 * Usage:
 * - Set REDIS_URL in environment variables
 * - If REDIS_URL is not set, falls back to in-memory adapter (single instance mode)
 */

import { Logger } from '@nestjs/common';
import { IoAdapter } from '@nestjs/platform-socket.io';
import { createAdapter } from '@socket.io/redis-adapter';
import { createClient } from 'redis';
import { ServerOptions } from 'socket.io';

export class RedisIoAdapter extends IoAdapter {
  private readonly logger = new Logger(RedisIoAdapter.name);
  private adapterConstructor: ReturnType<typeof createAdapter> | null = null;

  async connectToRedis(): Promise<void> {
    const redisUrl = process.env.REDIS_URL;

    if (!redisUrl) {
      this.logger.warn(
        'REDIS_URL not configured. Using in-memory adapter (single instance mode only).',
      );
      return;
    }

    const pubClient = createClient({ url: redisUrl, socket: { reconnectStrategy: false } });
    const subClient = pubClient.duplicate();

    pubClient.on('error', (err) => this.logger.error('Redis Pub Client Error', (err as Error).message));
    subClient.on('error', (err) => this.logger.error('Redis Sub Client Error', (err as Error).message));

    try {
      await Promise.all([pubClient.connect(), subClient.connect()]);
      this.adapterConstructor = createAdapter(pubClient, subClient);
      this.logger.log('Connected to Redis for Socket.io clustering');
    } catch (error) {
      this.logger.error(`Failed to connect to Redis: ${(error as Error).message}`);
      this.logger.warn('Falling back to in-memory adapter (single instance mode)');
      // Disconnect clients to stop retry spam
      await pubClient.quit().catch(() => {});
      await subClient.quit().catch(() => {});
    }
  }

  createIOServer(port: number, options?: ServerOptions): any {
    const server = super.createIOServer(port, {
      ...options,
      cors: {
        origin: '*',
        methods: ['GET', 'POST'],
      },
      transports: ['websocket', 'polling'],
      pingTimeout: 60000,
      pingInterval: 25000,
    });

    if (this.adapterConstructor) {
      server.adapter(this.adapterConstructor);
      this.logger.log('Socket.io server using Redis adapter');
    }

    return server;
  }
}
