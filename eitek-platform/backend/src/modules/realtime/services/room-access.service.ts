import { Injectable, Logger } from '@nestjs/common';
import { WsException } from '@nestjs/websockets';
import { PrismaService } from '@/database/prisma.service';

/**
 * Room types that require access validation
 */
export type RoomType = 'device' | 'area' | 'project' | 'devices:project' | 'devices:area';

/**
 * Parsed room information
 */
export interface ParsedRoom {
  type: RoomType;
  id: string;
}

/**
 * User context for access validation
 */
export interface UserContext {
  id: string;
  tenantId: string;
  role: string;
}

/**
 * RoomAccessService - Validates tenant-scoped access to WebSocket rooms
 * 
 * This service ensures:
 * - Users can only subscribe to rooms within their tenant
 * - Device access is validated through the hierarchy: Device → Area → Site → Project → Tenant
 * - Area/Project access is validated against tenant ownership
 */
@Injectable()
export class RoomAccessService {
  private readonly logger = new Logger(RoomAccessService.name);

  // Cache for access validation results (TTL: 60 seconds)
  private readonly accessCache = new Map<string, { allowed: boolean; expires: number }>();
  private readonly CACHE_TTL_MS = 60000; // 1 minute

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Parse room name into type and ID
   */
  parseRoom(room: string): ParsedRoom | null {
    // Pattern: type:id or type:subtype:id
    const patterns: Record<string, RegExp> = {
      'device': /^device:(.+)$/,
      'area': /^area:(.+)$/,
      'project': /^project:(.+)$/,
      'devices:project': /^devices:project:(.+)$/,
      'devices:area': /^devices:area:(.+)$/,
    };

    for (const [type, pattern] of Object.entries(patterns)) {
      const match = room.match(pattern);
      if (match) {
        return { type: type as RoomType, id: match[1] };
      }
    }

    return null;
  }

  /**
   * Validate if user can access a room
   * Throws WsException if access denied
   */
  async validateRoomAccess(user: UserContext, room: string): Promise<void> {
    const parsed = this.parseRoom(room);
    
    if (!parsed) {
      // Unknown room type - check if it's a legacy room
      if (room === 'devices:list') {
        // Legacy global room - allow but log warning
        this.logger.warn(`User ${user.id} accessing deprecated global room: ${room}`);
        return;
      }
      throw new WsException(`Invalid room format: ${room}`);
    }

    // Check cache first
    const cacheKey = `${user.tenantId}:${room}`;
    const cached = this.accessCache.get(cacheKey);
    if (cached && cached.expires > Date.now()) {
      if (!cached.allowed) {
        throw new WsException(`Access denied to room: ${room}`);
      }
      return;
    }

    // Validate based on room type
    let allowed = false;
    try {
      switch (parsed.type) {
        case 'device':
          allowed = await this.validateDeviceAccess(user.tenantId, parsed.id);
          break;
        case 'area':
        case 'devices:area':
          allowed = await this.validateAreaAccess(user.tenantId, parsed.id);
          break;
        case 'project':
        case 'devices:project':
          allowed = await this.validateProjectAccess(user.tenantId, parsed.id);
          break;
        default:
          allowed = false;
      }
    } catch (error) {
      this.logger.error(`Error validating room access: ${error.message}`);
      allowed = false;
    }

    // Update cache
    this.accessCache.set(cacheKey, {
      allowed,
      expires: Date.now() + this.CACHE_TTL_MS,
    });

    if (!allowed) {
      this.logger.warn(`Access denied for user ${user.id} (tenant: ${user.tenantId}) to room: ${room}`);
      throw new WsException(`Access denied to room: ${room}`);
    }
  }

  /**
   * Validate device access through hierarchy:
   * Device → Area → Site → Project → Tenant
   */
  private async validateDeviceAccess(tenantId: string, deviceId: string): Promise<boolean> {
    const device = await this.prisma.device.findFirst({
      where: {
        id: deviceId,
        area: {
          site: {
            project: {
              tenantId,
            },
          },
        },
      },
      select: { id: true },
    });

    return !!device;
  }

  /**
   * Validate area access through hierarchy:
   * Area → Site → Project → Tenant
   */
  private async validateAreaAccess(tenantId: string, areaId: string): Promise<boolean> {
    const area = await this.prisma.area.findFirst({
      where: {
        id: areaId,
        site: {
          project: {
            tenantId,
          },
        },
      },
      select: { id: true },
    });

    return !!area;
  }

  /**
   * Validate project access:
   * Project → Tenant
   */
  private async validateProjectAccess(tenantId: string, projectId: string): Promise<boolean> {
    const project = await this.prisma.project.findFirst({
      where: {
        id: projectId,
        tenantId,
      },
      select: { id: true },
    });

    return !!project;
  }

  /**
   * Batch validate multiple rooms for a user
   * Returns array of rooms that are accessible
   */
  async filterAccessibleRooms(user: UserContext, rooms: string[]): Promise<string[]> {
    const results = await Promise.allSettled(
      rooms.map(async (room) => {
        try {
          await this.validateRoomAccess(user, room);
          return room;
        } catch {
          return null;
        }
      })
    );

    return results
      .filter((r): r is PromiseFulfilledResult<string> => 
        r.status === 'fulfilled' && r.value !== null
      )
      .map(r => r.value);
  }

  /**
   * Clear cache for a specific tenant (call when permissions change)
   */
  clearTenantCache(tenantId: string): void {
    for (const key of this.accessCache.keys()) {
      if (key.startsWith(`${tenantId}:`)) {
        this.accessCache.delete(key);
      }
    }
  }

  /**
   * Clear all cache entries
   */
  clearAllCache(): void {
    this.accessCache.clear();
  }

  /**
   * Cleanup expired cache entries (call periodically)
   */
  cleanupExpiredCache(): void {
    const now = Date.now();
    for (const [key, value] of this.accessCache.entries()) {
      if (value.expires < now) {
        this.accessCache.delete(key);
      }
    }
  }
}
