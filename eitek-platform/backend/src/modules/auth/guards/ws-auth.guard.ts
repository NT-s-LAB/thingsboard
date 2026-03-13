import {
  CanActivate,
  ExecutionContext,
  Injectable,
  Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { WsException } from '@nestjs/websockets';
import { Socket } from 'socket.io';
import { AuthService } from '../auth.service';
import { JwtPayload } from '../strategies/jwt.strategy';

export interface AuthenticatedSocket extends Socket {
  user: {
    id: string;
    email: string;
    tenantId: string;
    role: string;
  };
}

/**
 * WebSocket Authentication Guard
 * 
 * Validates JWT token from WebSocket handshake and attaches user to socket.
 * Token can be provided via:
 * - Query parameter: ?token=xxx
 * - Auth header in handshake: auth.token or authorization
 */
@Injectable()
export class WsAuthGuard implements CanActivate {
  private readonly logger = new Logger(WsAuthGuard.name);

  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly authService: AuthService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const client = context.switchToWs().getClient<AuthenticatedSocket>();

    // Skip if already authenticated
    if (client.user) {
      return true;
    }

    try {
      const token = this.extractToken(client);
      
      if (!token) {
        throw new WsException('No authentication token provided');
      }

      const payload = await this.verifyToken(token);
      
      // Validate user exists and is active
      const user = await this.authService.validateUser(payload.sub);
      
      if (!user) {
        throw new WsException('User not found or inactive');
      }

      // Attach user to socket
      client.user = {
        id: user.id,
        email: user.email,
        tenantId: user.tenantId,
        role: user.role,
      };

      this.logger.debug(`WebSocket authenticated: ${user.email} (tenant: ${user.tenantId})`);
      return true;
    } catch (error) {
      this.logger.warn(`WebSocket auth failed: ${error.message}`);
      throw new WsException(error.message || 'Authentication failed');
    }
  }

  /**
   * Extract JWT token from socket handshake
   */
  private extractToken(client: Socket): string | null {
    // Method 1: Query parameter
    const queryToken = client.handshake.query?.token;
    if (queryToken && typeof queryToken === 'string') {
      return queryToken;
    }

    // Method 2: Auth object in handshake
    const authToken = client.handshake.auth?.token;
    if (authToken && typeof authToken === 'string') {
      return authToken;
    }

    // Method 3: Authorization header
    const authHeader = client.handshake.headers?.authorization;
    if (authHeader && typeof authHeader === 'string') {
      const [type, token] = authHeader.split(' ');
      if (type === 'Bearer' && token) {
        return token;
      }
    }

    return null;
  }

  /**
   * Verify JWT token
   */
  private async verifyToken(token: string): Promise<JwtPayload> {
    try {
      const payload = this.jwtService.verify<JwtPayload>(token, {
        secret: this.configService.get<string>('JWT_ACCESS_SECRET'),
      });

      // Check token expiration
      if (payload.exp && Date.now() >= payload.exp * 1000) {
        throw new WsException('Token expired');
      }

      return payload;
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        throw new WsException('Token expired');
      }
      if (error.name === 'JsonWebTokenError') {
        throw new WsException('Invalid token');
      }
      throw error;
    }
  }
}

/**
 * Utility to validate socket has user attached
 * Use after WsAuthGuard has been applied
 */
export function isAuthenticated(client: Socket): client is AuthenticatedSocket {
  return !!(client as AuthenticatedSocket).user;
}

/**
 * Get user from authenticated socket
 * Throws if not authenticated
 */
export function getSocketUser(client: Socket): AuthenticatedSocket['user'] {
  if (!isAuthenticated(client)) {
    throw new WsException('Not authenticated');
  }
  return client.user;
}
