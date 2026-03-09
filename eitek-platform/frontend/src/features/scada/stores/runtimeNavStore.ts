/**
 * SCADA Runtime Navigation Store — Internal page navigation for runtime mode.
 *
 * This is completely independent of the web app's URL router.
 * It manages:
 *   - Current page in runtime
 *   - Navigation history stack (for goBack())
 *   - Popup stack (overlay pages)
 *   - Page transition type
 */

import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import type { PageTransition } from '../core/types/project.types';

// ─── State Shape ─────────────────────────────────────────────────────────────

interface RuntimeNavState {
  /** Currently displayed page ID */
  currentPageId: string | null;
  /** Navigation history (for goBack) — stack of page IDs */
  historyStack: string[];
  /** Home page ID (set when project loads) */
  homePageId: string | null;
  /** Popup overlay stack — each entry is a page ID */
  popupStack: string[];
  /** Current transition type */
  transition: PageTransition;

  // ── Actions ──
  /** Initialize navigation with a project */
  init: (homePageId: string, transition?: PageTransition) => void;
  /** Navigate to a page (pushes current to history) */
  navigate: (pageId: string) => void;
  /** Replace current page (no history push) */
  replace: (pageId: string) => void;
  /** Go back to the previous page */
  goBack: () => void;
  /** Go to the home page (clears history) */
  goHome: () => void;
  /** Open a popup page */
  openPopup: (pageId: string) => void;
  /** Close a specific popup (or topmost if no ID given) */
  closePopup: (pageId?: string) => void;
  /** Close all popups */
  closeAllPopups: () => void;
  /** Check if can go back */
  canGoBack: () => boolean;
  /** Reset navigation state */
  reset: () => void;
}

// ─── Store ───────────────────────────────────────────────────────────────────

export const useRuntimeNavStore = create<RuntimeNavState>()(
  devtools(
    immer((set, get) => ({
      currentPageId: null,
      historyStack: [],
      homePageId: null,
      popupStack: [],
      transition: 'none' as PageTransition,

      init: (homePageId, transition = 'none') =>
        set((s) => {
          s.currentPageId = homePageId;
          s.homePageId = homePageId;
          s.historyStack = [];
          s.popupStack = [];
          s.transition = transition;
        }),

      navigate: (pageId) =>
        set((s) => {
          if (s.currentPageId === pageId) return;
          if (s.currentPageId) {
            s.historyStack.push(s.currentPageId);
          }
          s.currentPageId = pageId;
        }),

      replace: (pageId) =>
        set((s) => {
          s.currentPageId = pageId;
        }),

      goBack: () =>
        set((s) => {
          if (s.historyStack.length === 0) return;
          s.currentPageId = s.historyStack.pop()!;
        }),

      goHome: () =>
        set((s) => {
          if (!s.homePageId) return;
          s.currentPageId = s.homePageId;
          s.historyStack = [];
          s.popupStack = [];
        }),

      openPopup: (pageId) =>
        set((s) => {
          if (!s.popupStack.includes(pageId)) {
            s.popupStack.push(pageId);
          }
        }),

      closePopup: (pageId?) =>
        set((s) => {
          if (pageId) {
            s.popupStack = s.popupStack.filter((id) => id !== pageId);
          } else if (s.popupStack.length > 0) {
            s.popupStack.pop();
          }
        }),

      closeAllPopups: () =>
        set((s) => {
          s.popupStack = [];
        }),

      canGoBack: () => get().historyStack.length > 0,

      reset: () =>
        set((s) => {
          s.currentPageId = null;
          s.historyStack = [];
          s.homePageId = null;
          s.popupStack = [];
          s.transition = 'none';
        }),
    })),
    { name: 'scada-runtime-nav-store' },
  ),
);
