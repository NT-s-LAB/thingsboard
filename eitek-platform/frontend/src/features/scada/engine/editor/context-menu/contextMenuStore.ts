/**
 * Context Menu Store
 * 
 * Zustand store for managing context menu state.
 */

import { create } from 'zustand';
import type {
  ContextMenuState,
  ContextMenuActions,
} from './types';

interface ContextMenuStore extends ContextMenuState, ContextMenuActions {}

export const useContextMenuStore = create<ContextMenuStore>((set, get) => ({
  // State
  isOpen: false,
  position: { x: 0, y: 0 },
  context: null,
  items: [],
  activeSubmenuPath: [],

  // Actions
  open: (position, context, items) => {
    set({
      isOpen: true,
      position,
      context,
      items,
      activeSubmenuPath: [],
    });
  },

  close: () => {
    set({
      isOpen: false,
      context: null,
      items: [],
      activeSubmenuPath: [],
    });
  },

  setActiveSubmenuPath: (path) => {
    set({ activeSubmenuPath: path });
  },

  executeAction: (item) => {
    const { context, close } = get();
    if (!context) return;

    try {
      item.action(context);
    } catch (error) {
      console.error('Context menu action error:', error);
    }
    
    close();
  },
}));

// ─── Hooks ───────────────────────────────────────────────────────────────────

/**
 * Hook to access context menu state
 */
export function useContextMenu() {
  return useContextMenuStore();
}

/**
 * Hook to check if context menu is open
 */
export function useContextMenuOpen() {
  return useContextMenuStore((state) => state.isOpen);
}
