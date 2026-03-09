/**
 * SCADA Action Engine — Executes widget/page actions in runtime.
 *
 * Processes the discriminated-union ScadaAction types:
 *   - navigateToPage → runtime nav store
 *   - goBack → runtime nav store
 *   - goHome → runtime nav store
 *   - openPopup → runtime nav store
 *   - closePopup → runtime nav store
 *   - rpcCall → command service
 *   - setAttribute → command service
 *   - setVariable → project store / runtime store
 *   - showNotification → toast/notification system
 *   - customScript → sandboxed eval (future)
 */

import type { ScadaAction } from '../../core/types/project.types';
import { ACTION_TYPES } from '../../core/types/project.types';
import { useRuntimeNavStore } from '../../stores/runtimeNavStore';
import { useScadaProjectStore } from '../../stores/scadaProjectStore';
import { commandService } from '../../core/engine/commandService';
import type { CommandRequest } from '../../core/types/command.types';

/**
 * Execute a list of actions sequentially.
 * Confirmation dialogs are handled externally before calling this.
 */
export async function executeActions(
  actions: ScadaAction[],
  context: ActionContext,
): Promise<void> {
  for (const action of actions) {
    await executeSingleAction(action, context);
  }
}

export interface ActionContext {
  /** ID of the widget that triggered the action (for logging/tracing) */
  widgetId?: string;
  /** Additional payload from the widget (e.g. toggle value) */
  payload?: Record<string, unknown>;
}

async function executeSingleAction(
  action: ScadaAction,
  ctx: ActionContext,
): Promise<void> {
  const nav = useRuntimeNavStore.getState();
  const projectStore = useScadaProjectStore.getState();

  switch (action.type) {
    case ACTION_TYPES.NAVIGATE_TO_PAGE: {
      nav.navigate(action.targetPageId);
      break;
    }
    case ACTION_TYPES.GO_BACK: {
      nav.goBack();
      break;
    }
    case ACTION_TYPES.GO_HOME: {
      nav.goHome();
      break;
    }
    case ACTION_TYPES.OPEN_POPUP: {
      nav.openPopup(action.popupPageId);
      break;
    }
    case ACTION_TYPES.CLOSE_POPUP: {
      nav.closePopup(action.popupPageId);
      break;
    }
    case ACTION_TYPES.RPC_CALL: {
      const req: CommandRequest = {
        id: `cmd_${Date.now()}`,
        widgetId: ctx.widgetId ?? '',
        entityId: action.deviceId,
        entityType: 'DEVICE',
        type: 'rpc',
        rpcMethod: action.rpcMethod,
        rpcParams: { ...(action.rpcParams ?? {}), ...(ctx.payload ?? {}) },
        timestamp: new Date().toISOString(),
      };
      await commandService.execute(req);
      break;
    }
    case ACTION_TYPES.SET_ATTRIBUTE: {
      const req: CommandRequest = {
        id: `cmd_${Date.now()}`,
        widgetId: ctx.widgetId ?? '',
        entityId: action.deviceId,
        entityType: 'DEVICE',
        type: 'attribute',
        attributeKey: action.attributeKey,
        attributeValue: action.attributeValue,
        attributeScope: action.attributeScope,
        timestamp: new Date().toISOString(),
      };
      await commandService.execute(req);
      break;
    }
    case ACTION_TYPES.SET_VARIABLE: {
      if (action.scope === 'global') {
        projectStore.setGlobalVariable(action.variableName, action.variableValue);
      } else {
        // Page-scoped: update the variable on the current page
        // For now, use global variable store as a flat namespace
        projectStore.setGlobalVariable(action.variableName, action.variableValue);
      }
      break;
    }
    case ACTION_TYPES.SHOW_NOTIFICATION: {
      // Simple console-based notification for now; can be replaced with toast
      const level = action.level ?? 'info';
      const consoleMethod = level === 'error' ? 'error' : level === 'warning' ? 'warn' : 'log';
      console[consoleMethod](`[SCADA Notification] ${action.message}`);
      break;
    }
    case ACTION_TYPES.CUSTOM_SCRIPT: {
      // Sandboxed script execution — placeholder
      console.warn('[SCADA] Custom script actions are not yet fully implemented');
      break;
    }
    default: {
      // Exhaustive check — if we add a new action type but forget the handler,
      // TypeScript will catch it here
      const _exhaustive: never = action;
      console.warn('[SCADA] Unknown action type:', (_exhaustive as ScadaAction).type);
    }
  }
}
