/**
 * Project Validator - Validates SCADA project configuration before deploy.
 * 
 * Checks for:
 * - Invalid page references in navigation actions
 * - Missing required action parameters
 * - Orphaned widget bindings
 * - Other configuration issues
 */

import type { ScadaProject, ScadaAction, WidgetEvent } from '../types/project.types';
import type { WidgetInstance } from '../types';
import { ACTION_TYPES } from '../types/project.types';

export interface ValidationError {
  type: 'error' | 'warning';
  code: string;
  message: string;
  widgetId?: string;
  widgetName?: string;
  pageId?: string;
  pageName?: string;
  actionId?: string;
}

export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
  warnings: ValidationError[];
}

/**
 * Validate a SCADA project before deployment.
 */
export function validateProject(project: ScadaProject): ValidationResult {
  const errors: ValidationError[] = [];
  const warnings: ValidationError[] = [];

  const pageIds = new Set(project.pages.map(p => p.id));
  const normalPageIds = new Set(project.pages.filter(p => p.pageType === 'normal').map(p => p.id));
  const popupPageIds = new Set(project.pages.filter(p => p.pageType === 'popup').map(p => p.id));

  // Validate home page exists
  if (!pageIds.has(project.homePageId)) {
    errors.push({
      type: 'error',
      code: 'INVALID_HOME_PAGE',
      message: `Home page "${project.homePageId}" does not exist in the project.`,
    });
  }

  // Validate each page
  for (const page of project.pages) {
    // Validate each widget
    for (const widget of page.widgets) {
      const widgetWithEvents = widget as WidgetInstance & { events?: WidgetEvent[] };
      const events = widgetWithEvents.events ?? [];

      // Validate widget events/actions
      for (const event of events) {
        for (const action of event.actions) {
          validateAction(action, widget, page.id, page.name, pageIds, normalPageIds, popupPageIds, errors, warnings);
        }
      }

      // Validate legacy actions
      for (const legacyAction of widget.actions) {
        if (legacyAction.actionType === 'navigate' && legacyAction.config.targetWindowId) {
          if (!pageIds.has(legacyAction.config.targetWindowId)) {
            warnings.push({
              type: 'warning',
              code: 'INVALID_LEGACY_NAVIGATION',
              message: `Widget "${widget.name}" has a legacy navigation action pointing to non-existent page.`,
              widgetId: widget.id,
              widgetName: widget.name,
              pageId: page.id,
              pageName: page.name,
            });
          }
        }
      }

      // Validate bindings
      for (const binding of widget.bindings) {
        if ((binding.source.type === 'telemetry' || binding.source.type === 'attribute') && !binding.source.entityId) {
          warnings.push({
            type: 'warning',
            code: 'INCOMPLETE_BINDING',
            message: `Widget "${widget.name}" has a ${binding.source.type} binding without a device/entity configured.`,
            widgetId: widget.id,
            widgetName: widget.name,
            pageId: page.id,
            pageName: page.name,
          });
        }
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

function validateAction(
  action: ScadaAction,
  widget: WidgetInstance,
  pageId: string,
  pageName: string,
  _pageIds: Set<string>,
  normalPageIds: Set<string>,
  popupPageIds: Set<string>,
  errors: ValidationError[],
  warnings: ValidationError[],
): void {
  switch (action.type) {
    case ACTION_TYPES.NAVIGATE_TO_PAGE:
      if (!action.targetPageId) {
        warnings.push({
          type: 'warning',
          code: 'MISSING_TARGET_PAGE',
          message: `Widget "${widget.name}" has a navigation action without a target page selected.`,
          widgetId: widget.id,
          widgetName: widget.name,
          pageId,
          pageName,
          actionId: action.id,
        });
      } else if (!normalPageIds.has(action.targetPageId)) {
        errors.push({
          type: 'error',
          code: 'INVALID_TARGET_PAGE',
          message: `Widget "${widget.name}" navigates to non-existent page "${action.targetPageId}".`,
          widgetId: widget.id,
          widgetName: widget.name,
          pageId,
          pageName,
          actionId: action.id,
        });
      }
      break;

    case ACTION_TYPES.OPEN_POPUP:
      if (!action.popupPageId) {
        warnings.push({
          type: 'warning',
          code: 'MISSING_POPUP_PAGE',
          message: `Widget "${widget.name}" has an open popup action without a popup page selected.`,
          widgetId: widget.id,
          widgetName: widget.name,
          pageId,
          pageName,
          actionId: action.id,
        });
      } else if (!popupPageIds.has(action.popupPageId)) {
        errors.push({
          type: 'error',
          code: 'INVALID_POPUP_PAGE',
          message: `Widget "${widget.name}" opens non-existent popup "${action.popupPageId}".`,
          widgetId: widget.id,
          widgetName: widget.name,
          pageId,
          pageName,
          actionId: action.id,
        });
      }
      break;

    case ACTION_TYPES.RPC_CALL:
      if (!action.deviceId) {
        warnings.push({
          type: 'warning',
          code: 'MISSING_DEVICE_ID',
          message: `Widget "${widget.name}" has an RPC call action without a device ID.`,
          widgetId: widget.id,
          widgetName: widget.name,
          pageId,
          pageName,
          actionId: action.id,
        });
      }
      if (!action.rpcMethod) {
        warnings.push({
          type: 'warning',
          code: 'MISSING_RPC_METHOD',
          message: `Widget "${widget.name}" has an RPC call action without a method name.`,
          widgetId: widget.id,
          widgetName: widget.name,
          pageId,
          pageName,
          actionId: action.id,
        });
      }
      break;

    case ACTION_TYPES.SET_ATTRIBUTE:
      if (!action.deviceId) {
        warnings.push({
          type: 'warning',
          code: 'MISSING_DEVICE_ID',
          message: `Widget "${widget.name}" has a set attribute action without a device ID.`,
          widgetId: widget.id,
          widgetName: widget.name,
          pageId,
          pageName,
          actionId: action.id,
        });
      }
      if (!action.attributeKey) {
        warnings.push({
          type: 'warning',
          code: 'MISSING_ATTRIBUTE_KEY',
          message: `Widget "${widget.name}" has a set attribute action without an attribute key.`,
          widgetId: widget.id,
          widgetName: widget.name,
          pageId,
          pageName,
          actionId: action.id,
        });
      }
      break;

    case ACTION_TYPES.SET_VARIABLE:
      if (!action.variableName) {
        warnings.push({
          type: 'warning',
          code: 'MISSING_VARIABLE_NAME',
          message: `Widget "${widget.name}" has a set variable action without a variable name.`,
          widgetId: widget.id,
          widgetName: widget.name,
          pageId,
          pageName,
          actionId: action.id,
        });
      }
      break;
  }
}

/**
 * Format validation result as a human-readable string.
 */
export function formatValidationResult(result: ValidationResult): string {
  if (result.valid && result.warnings.length === 0) {
    return 'Project validation passed. No issues found.';
  }

  const lines: string[] = [];

  if (result.errors.length > 0) {
    lines.push(`ERRORS (${result.errors.length}):`);
    for (const err of result.errors) {
      lines.push(`  [${err.code}] ${err.message}`);
    }
  }

  if (result.warnings.length > 0) {
    lines.push(`WARNINGS (${result.warnings.length}):`);
    for (const warn of result.warnings) {
      lines.push(`  [${warn.code}] ${warn.message}`);
    }
  }

  return lines.join('\n');
}
