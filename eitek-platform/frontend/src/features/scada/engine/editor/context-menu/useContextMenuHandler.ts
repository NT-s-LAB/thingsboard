/**
 * useContextMenuHandler Hook
 * 
 * Hook to handle context menu events on the SCADA canvas.
 * Determines context type and opens the appropriate menu.
 */

import { useCallback } from 'react';
import { useContextMenuStore } from './contextMenuStore';
import { contextMenuRegistry } from './contextMenuRegistry';
import type { ContextMenuContext, ContextMenuType } from './types';
import type { WidgetInstance } from '../../../core/types';

interface UseContextMenuHandlerOptions {
  /** Get currently selected widget IDs */
  getSelectedWidgetIds: () => string[];
  /** Get all widgets in current layer/page */
  getWidgets: () => WidgetInstance[];
  /** Find widget at position */
  findWidgetAtPosition?: (x: number, y: number) => WidgetInstance | undefined;
  /** Select a widget */
  selectWidget: (id: string, addToSelection?: boolean) => void;
  /** Current zoom level */
  zoom: number;
  /** Current pan offset */
  panOffset: { x: number; y: number };
}

/**
 * Hook to handle context menu for SCADA canvas
 */
export function useContextMenuHandler(options: UseContextMenuHandlerOptions) {
  const {
    getSelectedWidgetIds,
    getWidgets,
    findWidgetAtPosition,
    selectWidget,
    zoom,
    panOffset,
  } = options;

  const openMenu = useContextMenuStore((s) => s.open);

  /**
   * Convert screen coordinates to canvas coordinates
   */
  const screenToCanvas = useCallback(
    (screenX: number, screenY: number, canvasRect: DOMRect) => {
      const x = (screenX - canvasRect.left - panOffset.x) / zoom;
      const y = (screenY - canvasRect.top - panOffset.y) / zoom;
      return { x, y };
    },
    [zoom, panOffset]
  );

  /**
   * Find widget at screen position
   */
  const getWidgetAtPosition = useCallback(
    (canvasX: number, canvasY: number): WidgetInstance | undefined => {
      if (findWidgetAtPosition) {
        return findWidgetAtPosition(canvasX, canvasY);
      }

      // Default: check all widgets
      const widgets = getWidgets();
      // Reverse to check top-most widgets first (assuming higher index = on top)
      for (let i = widgets.length - 1; i >= 0; i--) {
        const widget = widgets[i];
        if (!widget) continue;
        const { position, size } = widget.transform;
        const { x, y } = position;
        const { width, height } = size;
        if (
          canvasX >= x &&
          canvasX <= x + width &&
          canvasY >= y &&
          canvasY <= y + height
        ) {
          return widget;
        }
      }
      return undefined;
    },
    [findWidgetAtPosition, getWidgets]
  );

  /**
   * Handle right-click context menu
   */
  const handleContextMenu = useCallback(
    (event: React.MouseEvent, canvasElement: HTMLElement | null) => {
      event.preventDefault();
      event.stopPropagation();

      if (!canvasElement) return;

      const canvasRect = canvasElement.getBoundingClientRect();
      const screenPosition = { x: event.clientX, y: event.clientY };
      const canvasPosition = screenToCanvas(event.clientX, event.clientY, canvasRect);

      const selectedIds = getSelectedWidgetIds();
      const widgets = getWidgets();
      const selectedWidgets = widgets.filter((w) => selectedIds.includes(w.id));

      // Check if we clicked on a widget
      const clickedWidget = getWidgetAtPosition(canvasPosition.x, canvasPosition.y);

      let contextType: ContextMenuType;
      let targetWidget: WidgetInstance | undefined;

      if (clickedWidget) {
        // Clicked on a widget
        const isSelected = selectedIds.includes(clickedWidget.id);

        if (!isSelected) {
          // Select the clicked widget if not already selected
          selectWidget(clickedWidget.id, false);
        }

        // Determine context type based on selection count
        if (selectedIds.length > 1 && isSelected) {
          // Multiple widgets selected and clicked on one of them
          contextType = 'multiselect';
        } else {
          // Single widget
          contextType = 'widget';
          targetWidget = clickedWidget;
        }
      } else {
        // Clicked on empty canvas
        contextType = 'canvas';
      }

      // Build context
      const context: ContextMenuContext = {
        type: contextType,
        selectedWidgets:
          contextType === 'canvas'
            ? []
            : contextType === 'widget'
              ? targetWidget
                ? [targetWidget]
                : []
              : selectedWidgets,
        ...(targetWidget && { widget: targetWidget }),
        position: screenPosition,
        canvasPosition,
        zoom,
      };

      // Get menu items from registry
      const items = contextMenuRegistry.getItemsForContext(context);

      // Open the menu
      openMenu(screenPosition, context, items);
    },
    [
      screenToCanvas,
      getSelectedWidgetIds,
      getWidgets,
      getWidgetAtPosition,
      selectWidget,
      zoom,
      openMenu,
    ]
  );

  return {
    handleContextMenu,
    screenToCanvas,
  };
}

export default useContextMenuHandler;
