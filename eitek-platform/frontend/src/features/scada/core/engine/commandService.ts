/**
 * Command Service
 *
 * All control actions flow through this service:
 *   Widget click → CommandService.execute() → Backend API → ThingsBoard RPC/Attribute → Device
 *
 * Features:
 *   • Confirmation dialog (optional per-action)
 *   • Loading state tracking
 *   • Success / failure callbacks
 *   • Command history for audit
 *   • Timeout handling
 */

import { apiClient } from '@/shared/services/api';
import type {
  CommandRequest,
  CommandResult,
  CommandHistoryEntry,
  CommandStatus,
} from '../types/command.types';

export type CommandStatusCallback = (
  commandId: string,
  status: CommandStatus,
  result?: CommandResult,
) => void;

export class CommandService {
  private history: CommandHistoryEntry[] = [];
  private pendingCommands = new Map<string, CommandRequest>();
  private statusCallbacks = new Set<CommandStatusCallback>();
  private maxHistorySize: number;

  constructor(maxHistorySize = 100) {
    this.maxHistorySize = maxHistorySize;
  }

  /** Register a listener to be notified of command status changes. */
  onStatusChange(callback: CommandStatusCallback): () => void {
    this.statusCallbacks.add(callback);
    return () => {
      this.statusCallbacks.delete(callback);
    };
  }

  /**
   * Execute a command.
   * Returns the CommandResult when complete.
   */
  async execute(request: CommandRequest): Promise<CommandResult> {
    this.pendingCommands.set(request.id, request);
    this.notifyStatus(request.id, 'executing');

    const startTime = Date.now();

    try {
      let response: any;

      if (request.type === 'rpc') {
        response = await this.executeRpc(request);
      } else if (request.type === 'attribute') {
        response = await this.executeAttribute(request);
      } else {
        throw new Error(`Unknown command type: ${request.type}`);
      }

      const result: CommandResult = {
        commandId: request.id,
        status: 'success',
        response,
        duration: Date.now() - startTime,
        timestamp: new Date().toISOString(),
      };

      this.addToHistory(request, result);
      this.notifyStatus(request.id, 'success', result);
      return result;
    } catch (error) {
      const errMsg =
        error instanceof Error ? error.message : 'Command execution failed';

      const result: CommandResult = {
        commandId: request.id,
        status: 'failed',
        error: errMsg,
        duration: Date.now() - startTime,
        timestamp: new Date().toISOString(),
      };

      this.addToHistory(request, result);
      this.notifyStatus(request.id, 'failed', result);
      return result;
    } finally {
      this.pendingCommands.delete(request.id);
    }
  }

  /** Check if a command is currently executing. */
  isPending(commandId: string): boolean {
    return this.pendingCommands.has(commandId);
  }

  /** Retrieve command history (most recent first). */
  getHistory(): ReadonlyArray<CommandHistoryEntry> {
    return this.history;
  }

  /** Clear command history. */
  clearHistory(): void {
    this.history = [];
  }

  // ── Private ──────────────────────────────────────────────────────────────

  private async executeRpc(request: CommandRequest): Promise<unknown> {
    const endpoint = request.rpcOneWay
      ? `/devices/${request.entityId}/rpc/oneway`
      : `/devices/${request.entityId}/rpc/twoway`;

    const body = {
      method: request.rpcMethod,
      params: request.rpcParams ?? {},
      timeout: request.rpcTimeout ?? 10_000,
    };

    return apiClient.post(endpoint, body);
  }

  private async executeAttribute(request: CommandRequest): Promise<unknown> {
    const scope = request.attributeScope ?? 'SHARED_SCOPE';
    const body = {
      [request.attributeKey!]: request.attributeValue,
    };

    return apiClient.post(
      `/devices/${request.entityId}/attributes/${scope}`,
      body,
    );
  }

  private addToHistory(request: CommandRequest, result: CommandResult): void {
    this.history.unshift({ request, result });
    if (this.history.length > this.maxHistorySize) {
      this.history.pop();
    }
  }

  private notifyStatus(
    commandId: string,
    status: CommandStatus,
    result?: CommandResult,
  ): void {
    this.statusCallbacks.forEach((cb) => {
      try {
        cb(commandId, status, result);
      } catch {
        // listener error — don't break iteration
      }
    });
  }
}

/** Singleton command service for the application. */
export const commandService = new CommandService();
