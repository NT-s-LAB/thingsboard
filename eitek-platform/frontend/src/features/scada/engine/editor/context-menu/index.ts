/**
 * Context Menu Module
 * 
 * Professional context menu system for SCADA editor.
 * 
 * @example
 * // Using the context menu
 * import { ContextMenu, useContextMenu, contextMenuRegistry } from './context-menu';
 * 
 * // Register custom menu items for a widget type
 * import { registerWidgetContextMenu } from './context-menu';
 * 
 * registerWidgetContextMenu('chart', [
 *   {
 *     type: 'item',
 *     id: 'refresh-chart',
 *     label: 'Refresh Data',
 *     icon: 'RefreshCw',
 *     action: (ctx) => refreshChartData(ctx.widget?.id)
 *   }
 * ]);
 */

// Types
export * from './types';

// Registry
export {
  contextMenuRegistry,
  registerWidgetContextMenu,
  registerCanvasContextMenu,
  registerMultiSelectContextMenu,
} from './contextMenuRegistry';

// Store
export {
  useContextMenuStore,
  useContextMenu,
  useContextMenuOpen,
} from './contextMenuStore';

// Components
export { ContextMenu } from './ContextMenu';
export { ContextMenuItem } from './ContextMenuItem';

// Default items (auto-registers on import)
export { registerDefaultMenuItems } from './defaultMenuItems';

// Hook
export { useContextMenuHandler } from './useContextMenuHandler';
