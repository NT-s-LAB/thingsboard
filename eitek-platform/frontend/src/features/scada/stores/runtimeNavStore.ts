/**
 * SCADA Runtime Navigation Store — Internal page navigation for runtime mode.
 *
 * This is completely independent of the web app's URL router.
 * It manages:
 *   - Current page in runtime
 *   - Navigation history stack (for goBack())
 *   - Popup stack (overlay pages)
 *   - Page transition type
 *   - Dashboard time window (for charts/data queries)
 */

import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import type { PageTransition } from '../core/types/project.types';
import type { DashboardTimeWindow, AggregationType, TimeUnit } from '../core/types/timeWindow.types';
import { getDefaultTimeWindow, timeUnitToMs } from '../core/types/timeWindow.types';

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
  /** Dashboard time window for charts and data queries */
  timeWindow: DashboardTimeWindow;
  /** Whether time window panel is open */
  timeWindowPanelOpen: boolean;

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

  // ── Time Window Actions ──
  /** Update the entire time window */
  setTimeWindow: (tw: DashboardTimeWindow) => void;
  /** Set mode (realtime or history) */
  setTimeWindowMode: (mode: 'realtime' | 'history') => void;
  /** Set realtime "last X time" */
  setRealtimeLast: (value: number, unit: TimeUnit) => void;
  /** Set history date range */
  setHistoryRange: (startTs: number, endTs: number) => void;
  /** Set aggregation type */
  setAggregation: (agg: AggregationType) => void;
  /** Set grouping interval in milliseconds */
  setGroupingInterval: (ms: number) => void;
  /** Toggle time window panel */
  toggleTimeWindowPanel: () => void;
  /** Get computed time range (startTs, endTs) */
  getTimeRange: () => { startTs: number; endTs: number };
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
      timeWindow: getDefaultTimeWindow(),
      timeWindowPanelOpen: false,

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
          s.timeWindow = getDefaultTimeWindow();
          s.timeWindowPanelOpen = false;
        }),

      // ── Time Window Actions ──
      setTimeWindow: (tw) =>
        set((s) => {
          s.timeWindow = tw;
        }),

      setTimeWindowMode: (mode) =>
        set((s) => {
          s.timeWindow.mode = mode;
        }),

      setRealtimeLast: (value, unit) =>
        set((s) => {
          s.timeWindow.realtime.type = 'last';
          s.timeWindow.realtime.lastValue = value;
          s.timeWindow.realtime.lastUnit = unit;
        }),

      setHistoryRange: (startTs, endTs) =>
        set((s) => {
          s.timeWindow.history.startTs = startTs;
          s.timeWindow.history.endTs = endTs;
        }),

      setAggregation: (agg) =>
        set((s) => {
          s.timeWindow.aggregation = agg;
        }),

      setGroupingInterval: (ms) =>
        set((s) => {
          s.timeWindow.groupingIntervalMs = ms;
        }),

      toggleTimeWindowPanel: () =>
        set((s) => {
          s.timeWindowPanelOpen = !s.timeWindowPanelOpen;
        }),

      getTimeRange: () => {
        const { timeWindow } = get();
        const now = Date.now();
        
        if (timeWindow.mode === 'history') {
          return { startTs: timeWindow.history.startTs, endTs: timeWindow.history.endTs };
        }
        
        // Realtime mode
        if (timeWindow.realtime.type === 'last') {
          const durationMs = timeUnitToMs(timeWindow.realtime.lastValue, timeWindow.realtime.lastUnit);
          return { startTs: now - durationMs, endTs: now };
        }
        
        // Relative mode
        return {
          startTs: now - (timeWindow.realtime.relativeStartMs ?? 0),
          endTs: now - (timeWindow.realtime.relativeEndMs ?? 0),
        };
      },
    })),
    { name: 'scada-runtime-nav-store' },
  ),
);
