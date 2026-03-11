/**
 * Default Context Menu Items
 * 
 * Standard menu items for SCADA editor operations.
 * These are registered automatically when the editor loads.
 */

import type { ContextMenuItem } from './types';
import { contextMenuRegistry } from './contextMenuRegistry';

// ─── Menu Item Definitions ───────────────────────────────────────────────────

/**
 * Edit group items (Cut, Copy, Paste, Delete, Duplicate)
 */
const editItems: ContextMenuItem[] = [
  {
    type: 'item',
    id: 'cut',
    label: 'Cut',
    icon: 'Scissors',
    shortcut: 'Ctrl+X',
    action: (_ctx) => {
      const { copySelected, removeWidgets, selectedWidgetIds } = getStoreActions();
      copySelected();
      removeWidgets(selectedWidgetIds);
    },
    visible: (ctx) => ctx.type === 'widget' || ctx.type === 'multiselect',
  },
  {
    type: 'item',
    id: 'copy',
    label: 'Copy',
    icon: 'Copy',
    shortcut: 'Ctrl+C',
    action: (_ctx) => {
      const { copySelected } = getStoreActions();
      copySelected();
    },
    visible: (ctx) => ctx.type === 'widget' || ctx.type === 'multiselect',
  },
  {
    type: 'item',
    id: 'paste',
    label: 'Paste',
    icon: 'Clipboard',
    shortcut: 'Ctrl+V',
    action: (ctx) => {
      const { pasteClipboard } = getStoreActions();
      // Offset from the click position
      pasteClipboard({ x: ctx.canvasPosition.x, y: ctx.canvasPosition.y });
    },
    enabled: (_ctx) => hasClipboard(),
  },
  {
    type: 'item',
    id: 'duplicate',
    label: 'Duplicate',
    icon: 'CopyPlus',
    shortcut: 'Ctrl+D',
    action: (_ctx) => {
      const { duplicateWidgets, selectedWidgetIds } = getStoreActions();
      duplicateWidgets(selectedWidgetIds);
    },
    visible: (ctx) => ctx.type === 'widget' || ctx.type === 'multiselect',
  },
  {
    type: 'separator',
    id: 'sep-edit-delete',
  },
  {
    type: 'item',
    id: 'delete',
    label: 'Delete',
    icon: 'Trash2',
    shortcut: 'Delete',
    danger: true,
    action: (_ctx) => {
      const { removeWidgets, selectedWidgetIds } = getStoreActions();
      removeWidgets(selectedWidgetIds);
    },
    visible: (ctx) => ctx.type === 'widget' || ctx.type === 'multiselect',
  },
];

/**
 * Lock/Unlock items
 */
const lockItems: ContextMenuItem[] = [
  {
    type: 'item',
    id: 'lock',
    label: 'Lock',
    icon: 'Lock',
    shortcut: 'Ctrl+L',
    action: (_ctx) => {
      const { lockWidgets, selectedWidgetIds } = getStoreActions();
      lockWidgets?.(selectedWidgetIds);
    },
    visible: (ctx) => {
      if (ctx.type !== 'widget' && ctx.type !== 'multiselect') return false;
      // Show Lock only when NOT all widgets are locked
      return !isAllLocked(ctx.selectedWidgets);
    },
  },
  {
    type: 'item',
    id: 'unlock',
    label: 'Unlock',
    icon: 'Unlock',
    shortcut: 'Ctrl+L',
    action: (_ctx) => {
      const { unlockWidgets, selectedWidgetIds } = getStoreActions();
      unlockWidgets?.(selectedWidgetIds);
    },
    visible: (ctx) => {
      if (ctx.type !== 'widget' && ctx.type !== 'multiselect') return false;
      // Show Unlock when any widget is locked
      return isAnyLocked(ctx.selectedWidgets);
    },
  },
];

/**
 * Selection group items
 */
const selectionItems: ContextMenuItem[] = [
  {
    type: 'item',
    id: 'select-all',
    label: 'Select All',
    icon: 'BoxSelect',
    shortcut: 'Ctrl+A',
    action: (_ctx) => {
      const { selectAll } = getStoreActions();
      selectAll();
    },
  },
  {
    type: 'item',
    id: 'deselect-all',
    label: 'Deselect All',
    icon: 'Square',
    shortcut: 'Escape',
    action: (_ctx) => {
      const { clearSelection } = getStoreActions();
      clearSelection();
    },
    visible: (ctx) => ctx.selectedWidgets.length > 0,
  },
];

/**
 * Align submenu items
 */
const alignSubmenu: ContextMenuItem = {
  type: 'submenu',
  id: 'align',
  label: 'Align',
  icon: 'AlignHorizontalJustifyCenter',
  visible: (ctx) => ctx.type === 'multiselect' && ctx.selectedWidgets.length >= 2,
  children: [
    {
      type: 'item',
      id: 'align-left',
      label: 'Align Left',
      icon: 'AlignHorizontalJustifyStart',
      action: (_ctx) => {
        const { alignWidgets } = getStoreActions();
        alignWidgets('left');
      },
    },
    {
      type: 'item',
      id: 'align-center-h',
      label: 'Align Center Horizontally',
      icon: 'AlignHorizontalJustifyCenter',
      action: (_ctx) => {
        const { alignWidgets } = getStoreActions();
        alignWidgets('centerH');
      },
    },
    {
      type: 'item',
      id: 'align-right',
      label: 'Align Right',
      icon: 'AlignHorizontalJustifyEnd',
      action: (_ctx) => {
        const { alignWidgets } = getStoreActions();
        alignWidgets('right');
      },
    },
    {
      type: 'separator',
      id: 'sep-align-v',
    },
    {
      type: 'item',
      id: 'align-top',
      label: 'Align Top',
      icon: 'AlignVerticalJustifyStart',
      action: (_ctx) => {
        const { alignWidgets } = getStoreActions();
        alignWidgets('top');
      },
    },
    {
      type: 'item',
      id: 'align-center-v',
      label: 'Align Center Vertically',
      icon: 'AlignVerticalJustifyCenter',
      action: (_ctx) => {
        const { alignWidgets } = getStoreActions();
        alignWidgets('centerV');
      },
    },
    {
      type: 'item',
      id: 'align-bottom',
      label: 'Align Bottom',
      icon: 'AlignVerticalJustifyEnd',
      action: (_ctx) => {
        const { alignWidgets } = getStoreActions();
        alignWidgets('bottom');
      },
    },
  ],
};

/**
 * Distribute submenu items
 */
const distributeSubmenu: ContextMenuItem = {
  type: 'submenu',
  id: 'distribute',
  label: 'Distribute',
  icon: 'Ratio',
  visible: (ctx) => ctx.type === 'multiselect' && ctx.selectedWidgets.length >= 3,
  children: [
    {
      type: 'item',
      id: 'distribute-h',
      label: 'Distribute Horizontally',
      icon: 'AlignHorizontalSpaceAround',
      action: (_ctx) => {
        const { alignWidgets } = getStoreActions();
        alignWidgets('distributeH');
      },
    },
    {
      type: 'item',
      id: 'distribute-v',
      label: 'Distribute Vertically',
      icon: 'AlignVerticalSpaceAround',
      action: (_ctx) => {
        const { alignWidgets } = getStoreActions();
        alignWidgets('distributeV');
      },
    },
  ],
};

/**
 * Arrange group items (Align, Distribute, Order)
 */
const arrangeItems: ContextMenuItem[] = [
  alignSubmenu,
  distributeSubmenu,
  {
    type: 'submenu',
    id: 'order',
    label: 'Order',
    icon: 'Layers',
    visible: (ctx) => ctx.type === 'widget' || ctx.type === 'multiselect',
    children: [
      {
        type: 'item',
        id: 'bring-to-front',
        label: 'Bring to Front',
        icon: 'ArrowUpToLine',
        shortcut: 'Ctrl+]',
        action: (_ctx) => {
          const { bringToFront } = getStoreActions();
          bringToFront?.();
        },
      },
      {
        type: 'item',
        id: 'send-to-back',
        label: 'Send to Back',
        icon: 'ArrowDownToLine',
        shortcut: 'Ctrl+[',
        action: (_ctx) => {
          const { sendToBack } = getStoreActions();
          sendToBack?.();
        },
      },
      {
        type: 'separator',
        id: 'sep-order-step',
      },
      {
        type: 'item',
        id: 'bring-forward',
        label: 'Bring Forward',
        icon: 'ArrowUp',
        action: (_ctx) => {
          const { bringForward } = getStoreActions();
          bringForward?.();
        },
      },
      {
        type: 'item',
        id: 'send-backward',
        label: 'Send Backward',
        icon: 'ArrowDown',
        action: (_ctx) => {
          const { sendBackward } = getStoreActions();
          sendBackward?.();
        },
      },
    ],
  },
];

/**
 * Properties items - Edit widget properties, bindings, events
 */
const propertiesItems: ContextMenuItem[] = [
  {
    type: 'separator',
    id: 'sep-properties',
  },
  {
    type: 'item',
    id: 'edit-properties',
    label: 'Properties...',
    icon: 'Settings',
    action: (_ctx) => {
      // TODO: Integrate with editor panel system
      // For now, dispatch custom event that panel can listen to
      window.dispatchEvent(new CustomEvent('scada:open-panel', { detail: { panel: 'properties' } }));
    },
    visible: (ctx) => ctx.type === 'widget',
  },
  {
    type: 'item',
    id: 'edit-bindings',
    label: 'Data Bindings...',
    icon: 'Link',
    action: (_ctx) => {
      window.dispatchEvent(new CustomEvent('scada:open-panel', { detail: { panel: 'bindings' } }));
    },
    visible: (ctx) => ctx.type === 'widget',
  },
  {
    type: 'item',
    id: 'edit-events',
    label: 'Event Handlers...',
    icon: 'Zap',
    action: (_ctx) => {
      window.dispatchEvent(new CustomEvent('scada:open-panel', { detail: { panel: 'events' } }));
    },
    visible: (ctx) => ctx.type === 'widget',
  },
];

/**
 * Helper to add widget at context menu position
 */
function addWidgetAtPosition(ctx: import('./types').ContextMenuContext, widgetType: string, defaultSize?: { width: number; height: number }) {
  const { addWidget } = getStoreActions();
  const size = defaultSize || { width: 100, height: 100 };
  
  // Create a new widget instance
  const widget: import('../../../core/types').WidgetInstance = {
    id: `widget-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
    type: widgetType,
    name: widgetType.split('-').map(s => s.charAt(0).toUpperCase() + s.slice(1)).join(' '),
    layerId: 'default',
    transform: {
      position: { x: ctx.canvasPosition.x, y: ctx.canvasPosition.y },
      size: { width: size.width, height: size.height },
      rotation: 0,
      zIndex: 1000 + Date.now() % 1000,
    },
    properties: {},
    bindings: [],
    actions: [],
  };
  
  addWidget?.(widget);
}

/**
 * Canvas-only items
 */
const canvasItems: ContextMenuItem[] = [
  {
    type: 'submenu',
    id: 'add-widget',
    label: 'Add Widget',
    icon: 'Plus',
    visible: (ctx) => ctx.type === 'canvas',
    children: [
      // ─── Shapes ───
      {
        type: 'submenu',
        id: 'add-shapes',
        label: 'Shapes',
        icon: 'Shapes',
        children: [
          {
            type: 'item',
            id: 'add-rectangle',
            label: 'Rectangle',
            icon: 'Square',
            action: (ctx) => addWidgetAtPosition(ctx, 'shape-rectangle'),
          },
          {
            type: 'item',
            id: 'add-rounded-rectangle',
            label: 'Rounded Rectangle',
            icon: 'RectangleHorizontal',
            action: (ctx) => addWidgetAtPosition(ctx, 'shape-rounded-rectangle'),
          },
          {
            type: 'item',
            id: 'add-circle',
            label: 'Circle',
            icon: 'Circle',
            action: (ctx) => addWidgetAtPosition(ctx, 'shape-circle'),
          },
          {
            type: 'item',
            id: 'add-ellipse',
            label: 'Ellipse',
            icon: 'CircleDot',
            action: (ctx) => addWidgetAtPosition(ctx, 'shape-ellipse'),
          },
          {
            type: 'separator',
            id: 'sep-shapes-lines',
          },
          {
            type: 'item',
            id: 'add-line',
            label: 'Line',
            icon: 'Minus',
            action: (ctx) => addWidgetAtPosition(ctx, 'shape-line'),
          },
          {
            type: 'item',
            id: 'add-arrow',
            label: 'Arrow',
            icon: 'MoveRight',
            action: (ctx) => addWidgetAtPosition(ctx, 'shape-arrow'),
          },
          {
            type: 'separator',
            id: 'sep-shapes-poly',
          },
          {
            type: 'item',
            id: 'add-triangle',
            label: 'Triangle',
            icon: 'Triangle',
            action: (ctx) => addWidgetAtPosition(ctx, 'shape-triangle'),
          },
          {
            type: 'item',
            id: 'add-diamond',
            label: 'Diamond',
            icon: 'Diamond',
            action: (ctx) => addWidgetAtPosition(ctx, 'shape-diamond'),
          },
          {
            type: 'item',
            id: 'add-polygon',
            label: 'Polygon',
            icon: 'Hexagon',
            action: (ctx) => addWidgetAtPosition(ctx, 'shape-polygon'),
          },
        ],
      },
      // ─── Text ───
      {
        type: 'item',
        id: 'add-text',
        label: 'Text',
        icon: 'Type',
        action: (ctx) => addWidgetAtPosition(ctx, 'shape-text', { width: 150, height: 40 }),
      },
      {
        type: 'separator',
        id: 'sep-add-categories',
      },
      // ─── Display Widgets ───
      {
        type: 'submenu',
        id: 'add-display',
        label: 'Display',
        icon: 'Monitor',
        children: [
          {
            type: 'item',
            id: 'add-label',
            label: 'Label',
            icon: 'Tag',
            action: (ctx) => addWidgetAtPosition(ctx, 'label'),
          },
          {
            type: 'item',
            id: 'add-value-display',
            label: 'Value Display',
            icon: 'Hash',
            action: (ctx) => addWidgetAtPosition(ctx, 'value-display'),
          },
          {
            type: 'item',
            id: 'add-image',
            label: 'Image',
            icon: 'Image',
            action: (ctx) => addWidgetAtPosition(ctx, 'image'),
          },
        ],
      },
      // ─── Control Widgets ───
      {
        type: 'submenu',
        id: 'add-control',
        label: 'Control',
        icon: 'ToggleLeft',
        children: [
          {
            type: 'item',
            id: 'add-button-widget',
            label: 'Button',
            icon: 'MousePointerClick',
            action: (ctx) => addWidgetAtPosition(ctx, 'button'),
          },
          {
            type: 'item',
            id: 'add-switch',
            label: 'Switch',
            icon: 'ToggleRight',
            action: (ctx) => addWidgetAtPosition(ctx, 'switch'),
          },
          {
            type: 'item',
            id: 'add-slider',
            label: 'Slider',
            icon: 'SlidersHorizontal',
            action: (ctx) => addWidgetAtPosition(ctx, 'slider'),
          },
          {
            type: 'item',
            id: 'add-input',
            label: 'Input Field',
            icon: 'TextCursorInput',
            action: (ctx) => addWidgetAtPosition(ctx, 'input'),
          },
        ],
      },
      // ─── Indicator Widgets ───
      {
        type: 'submenu',
        id: 'add-indicator',
        label: 'Indicators',
        icon: 'Gauge',
        children: [
          {
            type: 'item',
            id: 'add-led',
            label: 'LED Indicator',
            icon: 'Lightbulb',
            action: (ctx) => addWidgetAtPosition(ctx, 'led-indicator'),
          },
          {
            type: 'item',
            id: 'add-gauge',
            label: 'Gauge',
            icon: 'Gauge',
            action: (ctx) => addWidgetAtPosition(ctx, 'gauge'),
          },
          {
            type: 'item',
            id: 'add-progress',
            label: 'Progress Bar',
            icon: 'BarChart3',
            action: (ctx) => addWidgetAtPosition(ctx, 'progress-bar'),
          },
        ],
      },
    ],
  },
  // ─── View Submenu ───
  {
    type: 'submenu',
    id: 'view-options',
    label: 'View',
    icon: 'Eye',
    visible: (ctx) => ctx.type === 'canvas',
    children: [
      {
        type: 'item',
        id: 'zoom-in',
        label: 'Zoom In',
        icon: 'ZoomIn',
        shortcut: 'Ctrl++',
        action: (_ctx) => {
          const { setZoom, zoom } = getStoreActions();
          const newZoom = Math.min((zoom || 1) * 1.25, 4);
          setZoom?.(newZoom);
        },
      },
      {
        type: 'item',
        id: 'zoom-out',
        label: 'Zoom Out',
        icon: 'ZoomOut',
        shortcut: 'Ctrl+-',
        action: (_ctx) => {
          const { setZoom, zoom } = getStoreActions();
          const newZoom = Math.max((zoom || 1) / 1.25, 0.1);
          setZoom?.(newZoom);
        },
      },
      {
        type: 'item',
        id: 'zoom-100',
        label: 'Zoom to 100%',
        icon: 'Maximize',
        shortcut: 'Ctrl+0',
        action: (_ctx) => {
          const { setZoom } = getStoreActions();
          setZoom?.(1);
        },
      },
      {
        type: 'item',
        id: 'zoom-fit',
        label: 'Fit to Window',
        icon: 'Maximize2',
        action: (_ctx) => {
          // TODO: Implement fitToWindow in store
          window.dispatchEvent(new CustomEvent('scada:fit-to-window'));
        },
      },
      {
        type: 'separator',
        id: 'sep-view-grid',
      },
      {
        type: 'item',
        id: 'toggle-grid',
        label: 'Toggle Grid',
        icon: 'Grid3x3',
        shortcut: 'Ctrl+G',
        action: (_ctx) => {
          const { toggleGrid } = getStoreActions();
          toggleGrid?.();
        },
      },
      {
        type: 'item',
        id: 'toggle-snap',
        label: 'Toggle Snap to Grid',
        icon: 'Magnet',
        action: (_ctx) => {
          const { toggleSnap } = getStoreActions();
          toggleSnap?.();
        },
      },
      {
        type: 'separator',
        id: 'sep-view-reset',
      },
      {
        type: 'item',
        id: 'reset-view',
        label: 'Reset View',
        icon: 'RotateCcw',
        action: (_ctx) => {
          // Reset zoom to 1 and dispatch event for pan reset
          const { setZoom } = getStoreActions();
          setZoom?.(1);
          window.dispatchEvent(new CustomEvent('scada:reset-view'));
        },
      },
    ],
  },
];

/**
 * Undo/Redo items
 */
const historyItems: ContextMenuItem[] = [
  {
    type: 'item',
    id: 'undo',
    label: 'Undo',
    icon: 'Undo2',
    shortcut: 'Ctrl+Z',
    action: (_ctx) => {
      const { undo } = getStoreActions();
      undo();
    },
    enabled: (_ctx) => canUndo(),
  },
  {
    type: 'item',
    id: 'redo',
    label: 'Redo',
    icon: 'Redo2',
    shortcut: 'Ctrl+Y',
    action: (_ctx) => {
      const { redo } = getStoreActions();
      redo();
    },
    enabled: (_ctx) => canRedo(),
  },
];

// ─── Store Access Helpers ────────────────────────────────────────────────────

// Lazy import to avoid circular dependencies
let storeModule: typeof import('../../../stores/scadaRuntimeStore') | null = null;

function getStore() {
  if (!storeModule) {
    // Dynamic import will be resolved at runtime
    storeModule = require('../../../stores/scadaRuntimeStore');
  }
  return storeModule!.useScadaRuntimeStore;
}

function getStoreActions() {
  const store = getStore();
  return store.getState();
}

function hasClipboard(): boolean {
  try {
    const state = getStoreActions();
    return state.clipboardWidgets && state.clipboardWidgets.length > 0;
  } catch {
    return false;
  }
}

function canUndo(): boolean {
  try {
    const state = getStoreActions();
    return state.canUndo();
  } catch {
    return false;
  }
}

function canRedo(): boolean {
  try {
    const state = getStoreActions();
    return state.canRedo();
  } catch {
    return false;
  }
}

function isAnyLocked(widgets: import('../../../core/types').WidgetInstance[]): boolean {
  try {
    return widgets.some(w => w.locked === true);
  } catch {
    return false;
  }
}

function isAllLocked(widgets: import('../../../core/types').WidgetInstance[]): boolean {
  try {
    return widgets.length > 0 && widgets.every(w => w.locked === true);
  } catch {
    return false;
  }
}

// ─── Registration ────────────────────────────────────────────────────────────

/**
 * Register all default menu items
 */
export function registerDefaultMenuItems(): void {
  // Edit group (highest priority)
  contextMenuRegistry.registerItems(editItems, {
    groupId: 'edit',
    priority: 10,
    contextTypes: ['canvas', 'widget', 'multiselect'],
  });

  // Lock group
  contextMenuRegistry.registerItems(lockItems, {
    groupId: 'lock',
    priority: 12,
    contextTypes: ['widget', 'multiselect'],
  });

  // History group
  contextMenuRegistry.registerItems(historyItems, {
    groupId: 'history',
    priority: 15,
    contextTypes: ['canvas', 'widget', 'multiselect'],
  });

  // Selection group
  contextMenuRegistry.registerItems(selectionItems, {
    groupId: 'selection',
    priority: 20,
    contextTypes: ['canvas', 'widget', 'multiselect'],
  });

  // Arrange group
  contextMenuRegistry.registerItems(arrangeItems, {
    groupId: 'arrange',
    priority: 30,
    contextTypes: ['widget', 'multiselect'],
  });

  // Properties group (widget properties, bindings, events)
  contextMenuRegistry.registerItems(propertiesItems, {
    groupId: 'properties',
    priority: 35,
    contextTypes: ['widget'],
  });

  // Canvas group
  contextMenuRegistry.registerItems(canvasItems, {
    groupId: 'canvas',
    priority: 40,
    contextTypes: ['canvas'],
  });
}

// Auto-register on module load
registerDefaultMenuItems();
