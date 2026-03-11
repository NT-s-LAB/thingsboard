/**
 * Context Menu Registry
 * 
 * Extensible registry for registering context menu items.
 * Widget plugins can use this to add custom menu items.
 * 
 * @example
 * // Register custom menu items for a widget type
 * contextMenuRegistry.registerItems([
 *   {
 *     type: 'item',
 *     id: 'chart-refresh',
 *     label: 'Refresh Data',
 *     icon: 'RefreshCw',
 *     action: (ctx) => refreshChartData(ctx.widget?.id)
 *   }
 * ], {
 *   groupId: 'chart-actions',
 *   priority: 50,
 *   widgetTypes: ['chart', 'gauge']
 * });
 */

import type {
  ContextMenuItem,
  ContextMenuGroup,
  ContextMenuContext,
  RegisterMenuOptions,
} from './types';
import { resolveCondition, isSeparator, isSubmenu } from './types';

class ContextMenuRegistryImpl {
  private groups: Map<string, ContextMenuGroup> = new Map();
  private listeners: Set<() => void> = new Set();

  /**
   * Register menu items
   */
  registerItems(items: ContextMenuItem[], options: RegisterMenuOptions): void {
    const { groupId, priority = 100, contextTypes = ['canvas', 'widget', 'multiselect'], widgetTypes } = options;

    let group = this.groups.get(groupId);
    if (!group) {
      group = {
        id: groupId,
        priority,
        contextTypes,
        items: [],
      };
      // Add widgetTypes only if defined
      if (widgetTypes) {
        group.widgetTypes = widgetTypes;
      }
      this.groups.set(groupId, group);
    }

    // Add items to group
    group.items.push(...items);
    
    // Notify listeners
    this.notifyListeners();
  }

  /**
   * Unregister items by group ID
   */
  unregisterGroup(groupId: string): void {
    this.groups.delete(groupId);
    this.notifyListeners();
  }

  /**
   * Unregister specific items by ID
   */
  unregisterItems(itemIds: string[]): void {
    const idSet = new Set(itemIds);
    
    Array.from(this.groups.values()).forEach(group => {
      group.items = group.items.filter(item => !idSet.has(item.id));
    });
    
    this.notifyListeners();
  }

  /**
   * Get menu items for a specific context
   */
  getItemsForContext(context: ContextMenuContext): ContextMenuItem[] {
    // Get all applicable groups
    const applicableGroups = this.getApplicableGroups(context);
    
    // Sort groups by priority
    const sortedGroups = applicableGroups.sort((a, b) => a.priority - b.priority);
    
    // Combine items from all groups, adding separators between groups
    const items: ContextMenuItem[] = [];
    
    for (let i = 0; i < sortedGroups.length; i++) {
      const group = sortedGroups[i];
      if (!group) continue;
      
      const visibleItems = this.filterVisibleItems(group.items, context);
      
      if (visibleItems.length > 0) {
        // Add separator between groups (not before first)
        if (items.length > 0) {
          items.push({ type: 'separator', id: `sep-${group.id}` });
        }
        items.push(...visibleItems);
      }
    }
    
    return items;
  }

  /**
   * Get groups applicable to context
   */
  private getApplicableGroups(context: ContextMenuContext): ContextMenuGroup[] {
    const result: ContextMenuGroup[] = [];
    const groups = Array.from(this.groups.values());
    
    for (let i = 0; i < groups.length; i++) {
      const group = groups[i];
      if (!group) continue;
      
      // Check context type
      if (!group.contextTypes.includes(context.type)) {
        continue;
      }
      
      // Check widget types (for widget context)
      if (context.type === 'widget' && group.widgetTypes && group.widgetTypes.length > 0) {
        const widgetType = context.widget?.type;
        if (!widgetType || !group.widgetTypes.includes(widgetType)) {
          continue;
        }
      }
      
      result.push(group);
    }
    
    return result;
  }

  /**
   * Filter items by visibility
   */
  private filterVisibleItems(items: ContextMenuItem[], context: ContextMenuContext): ContextMenuItem[] {
    return items.filter(item => {
      if (isSeparator(item)) return true;
      
      const visible = resolveCondition(item.visible, context, true);
      if (!visible) return false;
      
      // For submenus, also check if any children are visible
      if (isSubmenu(item)) {
        const visibleChildren = this.filterVisibleItems(item.children, context);
        return visibleChildren.length > 0;
      }
      
      return true;
    }).map(item => {
      // Process submenu children recursively
      if (isSubmenu(item)) {
        return {
          ...item,
          children: this.filterVisibleItems(item.children, context),
        };
      }
      return item;
    });
  }

  /**
   * Subscribe to registry changes
   */
  subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notifyListeners(): void {
    this.listeners.forEach(listener => listener());
  }

  /**
   * Clear all registered items (mainly for testing)
   */
  clear(): void {
    this.groups.clear();
    this.notifyListeners();
  }

  /**
   * Get all registered groups (for debugging)
   */
  getGroups(): ContextMenuGroup[] {
    return Array.from(this.groups.values());
  }
}

// Singleton instance
export const contextMenuRegistry = new ContextMenuRegistryImpl();

// ─── Helper Functions ────────────────────────────────────────────────────────

/**
 * Convenience function for registering widget-specific menu items
 */
export function registerWidgetContextMenu(
  widgetTypes: string | string[],
  items: ContextMenuItem[],
  options?: Partial<RegisterMenuOptions>
): void {
  const types = Array.isArray(widgetTypes) ? widgetTypes : [widgetTypes];
  const groupId = options?.groupId ?? `widget-${types.join('-')}`;
  
  contextMenuRegistry.registerItems(items, {
    groupId,
    contextTypes: ['widget'],
    widgetTypes: types,
    ...options,
  });
}

/**
 * Convenience function for registering canvas-only menu items
 */
export function registerCanvasContextMenu(
  items: ContextMenuItem[],
  options?: Partial<RegisterMenuOptions>
): void {
  const groupId = options?.groupId ?? 'canvas-custom';
  
  contextMenuRegistry.registerItems(items, {
    groupId,
    contextTypes: ['canvas'],
    ...options,
  });
}

/**
 * Convenience function for registering multi-select menu items
 */
export function registerMultiSelectContextMenu(
  items: ContextMenuItem[],
  options?: Partial<RegisterMenuOptions>
): void {
  const groupId = options?.groupId ?? 'multiselect-custom';
  
  contextMenuRegistry.registerItems(items, {
    groupId,
    contextTypes: ['multiselect'],
    ...options,
  });
}
