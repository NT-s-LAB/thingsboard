/**
 * Command Service Types
 *
 * All control actions from the SCADA HMI go through the command service:
 *    Widget → CommandService → Backend → ThingsBoard RPC / Attribute
 */

export type CommandStatus = 'pending' | 'executing' | 'success' | 'failed' | 'timeout';

export interface CommandRequest {
  id: string;
  /** Which widget initiated the command */
  widgetId: string;
  /** Target device / entity */
  entityId: string;
  entityType: 'DEVICE' | 'ASSET';
  /** Command type */
  type: 'rpc' | 'attribute';

  // RPC fields
  rpcMethod?: string;
  rpcParams?: Record<string, unknown>;
  rpcOneWay?: boolean;
  rpcTimeout?: number;

  // Attribute fields
  attributeScope?: 'SERVER_SCOPE' | 'CLIENT_SCOPE' | 'SHARED_SCOPE';
  attributeKey?: string;
  attributeValue?: unknown;

  /** ISO timestamp of when the command was issued */
  timestamp: string;
}

export interface CommandResult {
  commandId: string;
  status: CommandStatus;
  /** RPC two-way response */
  response?: unknown;
  error?: string;
  /** Duration in ms */
  duration?: number;
  timestamp: string;
}

export interface CommandHistoryEntry {
  request: CommandRequest;
  result: CommandResult;
}
