/**
 * SCADA Project Types — Multi-page project architecture.
 *
 * A ScadaProject is the top-level container that holds multiple pages,
 * global variables, global assets, and project-level settings.
 *
 * Schema versioning enables backward-compatible migration from the
 * legacy single-page ScreenDefinition format.
 */

import type { ScreenBackground, ScreenLayer, ScreenVariable, Size, WidgetInstance } from './screen.types';

// ─── Schema Version ──────────────────────────────────────────────────────────

/** Schema version 1 = legacy single-page ScreenDefinition */
/** Schema version 2 = multi-page ScadaProject */
export const CURRENT_SCHEMA_VERSION = 2;

// ─── Project ─────────────────────────────────────────────────────────────────

export interface ScadaProject {
  id: string;
  schemaVersion: number;
  name: string;
  description?: string;
  /** The default page to display on runtime startup */
  homePageId: string;
  /** Ordered list of pages */
  pages: ScadaPage[];
  /** Global variables shared across all pages */
  globalVariables: ScreenVariable[];
  /** Project-level metadata */
  metadata: ProjectMetadata;
  /** Project-level settings */
  settings: ProjectSettings;
}

export interface ProjectMetadata {
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  tags: string[];
  /** Version counter — incremented on each save */
  version: number;
}

export interface ProjectSettings {
  /** Default canvas size for new pages */
  defaultCanvasSize: Size;
  /** Default background for new pages */
  defaultBackground: ScreenBackground;
  /** Page navigation transition */
  transition: PageTransition;
}

export type PageTransition = 'none' | 'fade' | 'slide';

// ─── Page ────────────────────────────────────────────────────────────────────

export type PageType = 'normal' | 'popup';

export interface ScadaPage {
  id: string;
  /** User-visible name */
  name: string;
  /** URL-safe key for bookmarking / deep-linking (optional) */
  key?: string;
  /** Normal page or popup/dialog page */
  pageType: PageType;
  /** Canvas size for this page */
  canvasSize: Size;
  /** Background for this page */
  background: ScreenBackground;
  /** Layers within this page */
  layers: ScreenLayer[];
  /** Widgets placed in this page */
  widgets: WidgetInstance[];
  /** Page-level variables (scoped to this page) */
  variables: ScreenVariable[];
  /** Page-level events (onPageLoad, onPageUnload, etc.) */
  events: PageEvent[];
  /** Display order (lower = earlier in the page list) */
  order: number;
  /** Popup-specific settings */
  popupSettings?: PopupSettings;
  /** Timestamps */
  createdAt: string;
  updatedAt: string;
}

export interface PopupSettings {
  /** Width/height of the popup dialog overlay (deprecated - use canvasSize instead) */
  width?: number;
  height?: number;
  /** Whether clicking backdrop closes the popup */
  closeOnBackdropClick: boolean;
  /** Whether to show a title bar */
  showTitleBar: boolean;
  /** Optional title for the popup */
  title?: string;
}

// ─── Page Events ─────────────────────────────────────────────────────────────

export type PageEventTrigger = 'onPageLoad' | 'onPageUnload';

export interface PageEvent {
  id: string;
  trigger: PageEventTrigger;
  actions: ScadaAction[];
}

// ─── Action System (Discriminated Union) ─────────────────────────────────────

/**
 * Unified action types for the SCADA platform.
 *
 * Each action is a discriminated union member keyed on `type`.
 * This ensures type-safe payloads and config — no loose `any`.
 */

export type ScadaAction =
  | NavigateToPageAction
  | GoBackAction
  | GoHomeAction
  | OpenPopupAction
  | ClosePopupAction
  | RpcCallAction
  | SetAttributeAction
  | SetVariableAction
  | ShowNotificationAction
  | CustomScriptAction;

// ── Action Type Constants ──

export const ACTION_TYPES = {
  NAVIGATE_TO_PAGE: 'navigateToPage',
  GO_BACK: 'goBack',
  GO_HOME: 'goHome',
  OPEN_POPUP: 'openPopup',
  CLOSE_POPUP: 'closePopup',
  RPC_CALL: 'rpcCall',
  SET_ATTRIBUTE: 'setAttribute',
  SET_VARIABLE: 'setVariable',
  SHOW_NOTIFICATION: 'showNotification',
  CUSTOM_SCRIPT: 'customScript',
} as const;

export type ActionTypeKey = typeof ACTION_TYPES[keyof typeof ACTION_TYPES];

// ── Individual Action Interfaces ──

interface BaseAction {
  id: string;
  /** Whether to show a confirmation dialog before executing */
  requireConfirm?: boolean;
  confirmMessage?: string;
}

export interface NavigateToPageAction extends BaseAction {
  type: typeof ACTION_TYPES.NAVIGATE_TO_PAGE;
  targetPageId: string;
  /** Transition override for this specific navigation */
  transition?: PageTransition;
}

export interface GoBackAction extends BaseAction {
  type: typeof ACTION_TYPES.GO_BACK;
}

export interface GoHomeAction extends BaseAction {
  type: typeof ACTION_TYPES.GO_HOME;
}

export interface OpenPopupAction extends BaseAction {
  type: typeof ACTION_TYPES.OPEN_POPUP;
  /** ID of a popup-type page */
  popupPageId: string;
  /** Optional parameters to pass to the popup */
  params?: Record<string, unknown>;
}

export interface ClosePopupAction extends BaseAction {
  type: typeof ACTION_TYPES.CLOSE_POPUP;
  /** If omitted, closes the topmost popup */
  popupPageId?: string;
}

export interface RpcCallAction extends BaseAction {
  type: typeof ACTION_TYPES.RPC_CALL;
  deviceId: string;
  rpcMethod: string;
  /** RPC params - can be any JSON value (object, array, string, number, boolean, null) */
  rpcParams?: unknown;
  rpcOneWay?: boolean;
  rpcTimeout?: number;
}

export interface SetAttributeAction extends BaseAction {
  type: typeof ACTION_TYPES.SET_ATTRIBUTE;
  deviceId: string;
  attributeScope: 'SERVER_SCOPE' | 'CLIENT_SCOPE' | 'SHARED_SCOPE';
  attributeKey: string;
  attributeValue: unknown;
}

export interface SetVariableAction extends BaseAction {
  type: typeof ACTION_TYPES.SET_VARIABLE;
  variableName: string;
  variableValue: unknown;
  /** 'page' = page-scoped, 'global' = project-scoped */
  scope: 'page' | 'global';
}

export interface ShowNotificationAction extends BaseAction {
  type: typeof ACTION_TYPES.SHOW_NOTIFICATION;
  message: string;
  level: 'success' | 'info' | 'warning' | 'error';
  durationMs?: number;
}

export interface CustomScriptAction extends BaseAction {
  type: typeof ACTION_TYPES.CUSTOM_SCRIPT;
  /** JavaScript expression string (sandboxed) */
  script: string;
}

// ─── Widget Event System ─────────────────────────────────────────────────────

/**
 * Widget-level event binding. Each event trigger can have multiple actions.
 */

export const WIDGET_EVENT_TRIGGERS = {
  ON_CLICK: 'onClick',
  ON_DOUBLE_CLICK: 'onDoubleClick',
  ON_MOUSE_DOWN: 'onMouseDown',
  ON_MOUSE_UP: 'onMouseUp',
  ON_MOUSE_ENTER: 'onMouseEnter',
  ON_MOUSE_LEAVE: 'onMouseLeave',
  ON_VALUE_CHANGE: 'onValueChange',
} as const;

export type WidgetEventTrigger = typeof WIDGET_EVENT_TRIGGERS[keyof typeof WIDGET_EVENT_TRIGGERS];

export interface WidgetEvent {
  id: string;
  trigger: WidgetEventTrigger;
  /** Actions to execute in order when this event fires */
  actions: ScadaAction[];
  /** Whether this event is enabled */
  enabled: boolean;
}

// ─── Type Guards ─────────────────────────────────────────────────────────────

export function isNavigateAction(action: ScadaAction): action is NavigateToPageAction {
  return action.type === ACTION_TYPES.NAVIGATE_TO_PAGE;
}
export function isGoBackAction(action: ScadaAction): action is GoBackAction {
  return action.type === ACTION_TYPES.GO_BACK;
}
export function isOpenPopupAction(action: ScadaAction): action is OpenPopupAction {
  return action.type === ACTION_TYPES.OPEN_POPUP;
}
export function isClosePopupAction(action: ScadaAction): action is ClosePopupAction {
  return action.type === ACTION_TYPES.CLOSE_POPUP;
}
export function isRpcCallAction(action: ScadaAction): action is RpcCallAction {
  return action.type === ACTION_TYPES.RPC_CALL;
}
export function isSetVariableAction(action: ScadaAction): action is SetVariableAction {
  return action.type === ACTION_TYPES.SET_VARIABLE;
}

// ─── Action Factory Helpers ──────────────────────────────────────────────────

let _actionId = 0;
function nextActionId(): string {
  return `action_${Date.now()}_${++_actionId}`;
}

export function createNavigateAction(targetPageId: string): NavigateToPageAction {
  return { id: nextActionId(), type: ACTION_TYPES.NAVIGATE_TO_PAGE, targetPageId };
}
export function createGoBackAction(): GoBackAction {
  return { id: nextActionId(), type: ACTION_TYPES.GO_BACK };
}
export function createGoHomeAction(): GoHomeAction {
  return { id: nextActionId(), type: ACTION_TYPES.GO_HOME };
}
export function createOpenPopupAction(popupPageId: string): OpenPopupAction {
  return { id: nextActionId(), type: ACTION_TYPES.OPEN_POPUP, popupPageId };
}
export function createClosePopupAction(): ClosePopupAction {
  return { id: nextActionId(), type: ACTION_TYPES.CLOSE_POPUP };
}
export function createRpcCallAction(deviceId: string, rpcMethod: string): RpcCallAction {
  return { id: nextActionId(), type: ACTION_TYPES.RPC_CALL, deviceId, rpcMethod };
}
export function createSetVariableAction(variableName: string, variableValue: unknown): SetVariableAction {
  return { id: nextActionId(), type: ACTION_TYPES.SET_VARIABLE, variableName, variableValue, scope: 'page' };
}
export function createShowNotificationAction(message: string, level: 'success' | 'info' | 'warning' | 'error' = 'info'): ShowNotificationAction {
  return { id: nextActionId(), type: ACTION_TYPES.SHOW_NOTIFICATION, message, level };
}

// ─── Default Factories ──────────────────────────────────────────────────────

export function createDefaultPage(name: string, order: number): ScadaPage {
  return {
    id: `page_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    name,
    pageType: 'normal',
    canvasSize: { width: 1920, height: 1080 },
    background: { type: 'color', color: '#f8fafc' },
    layers: [{ id: `layer_${Date.now()}`, name: 'Default', visible: true, locked: false, opacity: 1, order: 0 }],
    widgets: [],
    variables: [],
    events: [],
    order,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

export function createPopupPage(name: string, order: number): ScadaPage {
  return {
    ...createDefaultPage(name, order),
    id: `popup_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    pageType: 'popup',
    canvasSize: { width: 400, height: 300 },
    popupSettings: {
      closeOnBackdropClick: true,
      showTitleBar: true,
      title: name,
    },
  };
}

export function createDefaultProject(name: string): ScadaProject {
  const homePage = createDefaultPage('Main Page', 0);
  return {
    id: `proj_${Date.now()}`,
    schemaVersion: CURRENT_SCHEMA_VERSION,
    name,
    homePageId: homePage.id,
    pages: [homePage],
    globalVariables: [],
    metadata: {
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdBy: '',
      tags: [],
      version: 1,
    },
    settings: {
      defaultCanvasSize: { width: 1920, height: 1080 },
      defaultBackground: { type: 'color', color: '#f8fafc' },
      transition: 'none',
    },
  };
}
