/**
 * Context Menu Types
 * 
 * Data models for the professional context menu system.
 * Designed for extensibility - widget plugins can register custom menu items.
 */

import type { WidgetInstance } from '../../../core/types';

// ─── Menu Context Types ──────────────────────────────────────────────────────

/**
 * Type of context where the menu was triggered
 */
export type ContextMenuType = 'canvas' | 'widget' | 'multiselect';

/**
 * Context information passed to menu items
 */
export interface ContextMenuContext {
  /** Type of context */
  type: ContextMenuType;
  /** Currently selected widgets */
  selectedWidgets: WidgetInstance[];
  /** The specific widget that was right-clicked (for widget context) */
  widget?: WidgetInstance;
  /** Mouse position where menu was triggered */
  position: { x: number; y: number };
  /** Canvas position (transformed) */
  canvasPosition: { x: number; y: number };
  /** Current zoom level */
  zoom: number;
  /** Any additional context data */
  extra?: Record<string, unknown>;
}

// ─── Menu Item Types ─────────────────────────────────────────────────────────

/**
 * Menu item separator
 */
export interface ContextMenuSeparator {
  type: 'separator';
  id: string;
}

/**
 * Standard menu item
 */
export interface ContextMenuActionItem {
  type: 'item';
  /** Unique identifier */
  id: string;
  /** Display label */
  label: string;
  /** Optional icon (Lucide icon name or SVG path) */
  icon?: string;
  /** Keyboard shortcut display (e.g., "Ctrl+C") */
  shortcut?: string;
  /** Action to execute when clicked */
  action: (context: ContextMenuContext) => void;
  /** Whether this item is visible (default: true) */
  visible?: boolean | ((context: ContextMenuContext) => boolean);
  /** Whether this item is enabled (default: true) */
  enabled?: boolean | ((context: ContextMenuContext) => boolean);
  /** Danger/destructive action styling */
  danger?: boolean;
}

/**
 * Submenu item containing nested items
 */
export interface ContextMenuSubmenu {
  type: 'submenu';
  /** Unique identifier */
  id: string;
  /** Display label */
  label: string;
  /** Optional icon */
  icon?: string;
  /** Nested menu items */
  children: ContextMenuItem[];
  /** Whether this submenu is visible */
  visible?: boolean | ((context: ContextMenuContext) => boolean);
  /** Whether this submenu is enabled */
  enabled?: boolean | ((context: ContextMenuContext) => boolean);
}

/**
 * Union type for all menu item types
 */
export type ContextMenuItem = ContextMenuActionItem | ContextMenuSubmenu | ContextMenuSeparator;

// ─── Menu Group Types ────────────────────────────────────────────────────────

/**
 * A group of menu items with ordering priority
 */
export interface ContextMenuGroup {
  /** Unique group identifier */
  id: string;
  /** Group label (optional, for debugging) */
  label?: string;
  /** Sort priority (lower = higher in menu) */
  priority: number;
  /** Context types this group applies to */
  contextTypes: ContextMenuType[];
  /** Widget types this group applies to (for widget context, empty = all) */
  widgetTypes?: string[];
  /** Menu items in this group */
  items: ContextMenuItem[];
}

// ─── Registry Types ──────────────────────────────────────────────────────────

/**
 * Options for registering menu items
 */
export interface RegisterMenuOptions {
  /** Group to add items to (creates new group if doesn't exist) */
  groupId: string;
  /** Priority for the group (used when creating new group) */
  priority?: number;
  /** Context types (default: all) */
  contextTypes?: ContextMenuType[];
  /** Widget types (for widget-specific items) */
  widgetTypes?: string[];
}

// ─── Store Types ─────────────────────────────────────────────────────────────

/**
 * Context menu store state
 */
export interface ContextMenuState {
  /** Whether the menu is open */
  isOpen: boolean;
  /** Position to render the menu */
  position: { x: number; y: number };
  /** Current context */
  context: ContextMenuContext | null;
  /** Resolved menu items to display */
  items: ContextMenuItem[];
  /** Currently hovered submenu path */
  activeSubmenuPath: string[];
}

/**
 * Context menu store actions
 */
export interface ContextMenuActions {
  /** Open the context menu */
  open: (position: { x: number; y: number }, context: ContextMenuContext, items: ContextMenuItem[]) => void;
  /** Close the context menu */
  close: () => void;
  /** Set active submenu path */
  setActiveSubmenuPath: (path: string[]) => void;
  /** Execute a menu item action */
  executeAction: (item: ContextMenuActionItem) => void;
}

// ─── Helper Types ────────────────────────────────────────────────────────────

/**
 * Check if menu item is a separator
 */
export function isSeparator(item: ContextMenuItem): item is ContextMenuSeparator {
  return item.type === 'separator';
}

/**
 * Check if menu item is a submenu
 */
export function isSubmenu(item: ContextMenuItem): item is ContextMenuSubmenu {
  return item.type === 'submenu';
}

/**
 * Check if menu item is an action item
 */
export function isActionItem(item: ContextMenuItem): item is ContextMenuActionItem {
  return item.type === 'item';
}

/**
 * Resolve visibility/enabled state
 */
export function resolveCondition(
  condition: boolean | ((ctx: ContextMenuContext) => boolean) | undefined,
  context: ContextMenuContext,
  defaultValue: boolean = true
): boolean {
  if (condition === undefined) return defaultValue;
  if (typeof condition === 'boolean') return condition;
  return condition(context);
}
