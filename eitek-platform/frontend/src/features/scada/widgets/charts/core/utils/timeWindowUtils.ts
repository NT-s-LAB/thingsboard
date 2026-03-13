/**
 * Time Window Utils
 * 
 * Utilities for resolving and computing time window ranges.
 */

import type { 
  ChartTimeWindowConfig, 
  ChartWidgetConfig,
} from '../types';
import type { DashboardTimeWindow } from '../../../../core/types/timeWindow.types';

// ─── Time Range Interface ────────────────────────────────────────────────────

export interface TimeRange {
  startTs: number;
  endTs: number;
}

// ─── Time Unit Conversion ────────────────────────────────────────────────────

export function timeUnitToMs(value: number, unit: 'seconds' | 'minutes' | 'hours' | 'days'): number {
  switch (unit) {
    case 'seconds': return value * 1000;
    case 'minutes': return value * 60 * 1000;
    case 'hours': return value * 60 * 60 * 1000;
    case 'days': return value * 24 * 60 * 60 * 1000;
    default: return value * 60 * 1000; // default to minutes
  }
}

// ─── Resolve Chart Time Window ───────────────────────────────────────────────

/**
 * Resolve the effective time window for a chart widget.
 * 
 * If widget uses 'dashboard' mode, it will use the dashboard time window.
 * If widget uses 'widget' mode, it will use its own configuration.
 * Always returns valid numeric timestamps (never NaN).
 */
export function resolveChartTimeWindow(
  widgetConfig: ChartWidgetConfig,
  dashboardTimeWindow?: DashboardTimeWindow
): TimeRange {
  const tw = widgetConfig?.timeWindow;
  const now = Date.now();
  const defaultDuration = 15 * 60 * 1000; // 15 minutes default

  // Use dashboard time window if configured
  if (tw?.mode === 'dashboard' && dashboardTimeWindow) {
    const result = resolveDashboardTimeWindow(dashboardTimeWindow);
    // Validate result
    if (isValidTimeRange(result)) {
      return result;
    }
  }

  // Use widget-specific time window
  if (tw?.absolute?.startTs && tw?.absolute?.endTs) {
    const startTs = Number(tw.absolute.startTs);
    const endTs = Number(tw.absolute.endTs);
    if (!isNaN(startTs) && !isNaN(endTs) && startTs > 0 && endTs > startTs) {
      return { startTs, endTs };
    }
  }

  // Use relative time
  if (tw?.relative?.value && tw?.relative?.unit) {
    const value = Number(tw.relative.value);
    if (!isNaN(value) && value > 0) {
      const durationMs = timeUnitToMs(value, tw.relative.unit);
      if (!isNaN(durationMs) && durationMs > 0) {
        return {
          startTs: now - durationMs,
          endTs: now,
        };
      }
    }
  }

  // Default: last 15 minutes
  return {
    startTs: now - defaultDuration,
    endTs: now,
  };
}

/**
 * Validate that a time range has valid numeric timestamps.
 */
function isValidTimeRange(range: TimeRange): boolean {
  return (
    typeof range.startTs === 'number' &&
    typeof range.endTs === 'number' &&
    !isNaN(range.startTs) &&
    !isNaN(range.endTs) &&
    range.startTs > 0 &&
    range.endTs > range.startTs
  );
}

/**
 * Resolve time range from dashboard time window config.
 * Always returns valid numeric timestamps.
 */
export function resolveDashboardTimeWindow(tw: DashboardTimeWindow): TimeRange {
  const now = Date.now();
  const defaultDuration = 15 * 60 * 1000;

  if (tw?.mode === 'history' && tw.history) {
    const startTs = Number(tw.history.startTs);
    const endTs = Number(tw.history.endTs);
    if (!isNaN(startTs) && !isNaN(endTs) && startTs > 0 && endTs > startTs) {
      return { startTs, endTs };
    }
  }

  // Realtime mode
  if (tw?.realtime?.type === 'last' && tw.realtime.lastValue && tw.realtime.lastUnit) {
    const lastValue = Number(tw.realtime.lastValue);
    if (!isNaN(lastValue) && lastValue > 0) {
      const durationMs = dashboardTimeUnitToMs(lastValue, tw.realtime.lastUnit);
      if (!isNaN(durationMs) && durationMs > 0) {
        return {
          startTs: now - durationMs,
          endTs: now,
        };
      }
    }
  }

  // Relative mode
  if (tw?.realtime?.relativeStartMs !== undefined && tw?.realtime?.relativeEndMs !== undefined) {
    const relStart = Number(tw.realtime.relativeStartMs);
    const relEnd = Number(tw.realtime.relativeEndMs);
    if (!isNaN(relStart) && !isNaN(relEnd)) {
      const startTs = now + relStart;
      const endTs = now + relEnd;
      if (startTs > 0 && endTs > startTs) {
        return { startTs, endTs };
      }
    }
  }

  // Default: last 15 minutes
  return {
    startTs: now - defaultDuration,
    endTs: now,
  };
}

/**
 * Convert dashboard time unit to milliseconds.
 */
function dashboardTimeUnitToMs(
  value: number, 
  unit: 'SECOND' | 'MINUTE' | 'HOUR' | 'DAY' | 'WEEK' | 'MONTH' | 'YEAR'
): number {
  switch (unit) {
    case 'SECOND': return value * 1000;
    case 'MINUTE': return value * 60 * 1000;
    case 'HOUR': return value * 60 * 60 * 1000;
    case 'DAY': return value * 24 * 60 * 60 * 1000;
    case 'WEEK': return value * 7 * 24 * 60 * 60 * 1000;
    case 'MONTH': return value * 30 * 24 * 60 * 60 * 1000;
    case 'YEAR': return value * 365 * 24 * 60 * 60 * 1000;
    default: return value * 60 * 1000;
  }
}

// ─── Format Time Window Label ────────────────────────────────────────────────

export function formatTimeWindowLabel(twConfig: ChartTimeWindowConfig): string {
  if (twConfig.mode === 'dashboard') {
    return 'Dashboard time window';
  }

  if (twConfig.absolute?.startTs && twConfig.absolute?.endTs) {
    const start = new Date(twConfig.absolute.startTs);
    const end = new Date(twConfig.absolute.endTs);
    return `${formatDate(start)} - ${formatDate(end)}`;
  }

  if (twConfig.relative) {
    return `Last ${twConfig.relative.value} ${twConfig.relative.unit}`;
  }

  return 'Unknown';
}

function formatDate(date: Date): string {
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

// ─── Time Window Badge Text ──────────────────────────────────────────────────

export function getTimeWindowBadgeText(
  twConfig: ChartTimeWindowConfig, 
  isRealtime: boolean
): string {
  if (isRealtime) {
    if (twConfig.relative) {
      return `Realtime - Last ${twConfig.relative.value} ${twConfig.relative.unit}`;
    }
    return 'Realtime';
  }

  if (twConfig.absolute?.startTs && twConfig.absolute?.endTs) {
    return 'Historical';
  }

  return formatTimeWindowLabel(twConfig);
}

// ─── Should Auto Refresh ─────────────────────────────────────────────────────

export function shouldAutoRefresh(twConfig: ChartTimeWindowConfig, dataMode: 'realtime' | 'historical' | 'hybrid'): boolean {
  if (dataMode === 'historical' && !twConfig.realtime) {
    return false;
  }
  return Boolean(twConfig.autoRefreshMs && twConfig.autoRefreshMs > 0);
}

// ─── Get Aggregation Interval ────────────────────────────────────────────────

/**
 * Compute optimal aggregation interval based on time range and max data points.
 */
export function computeAggregationInterval(
  timeRange: TimeRange, 
  maxDataPoints: number = 500
): number {
  const durationMs = timeRange.endTs - timeRange.startTs;
  const idealInterval = Math.ceil(durationMs / maxDataPoints);
  
  // Round to nice interval values
  const intervals = [
    1000,      // 1 second
    5000,      // 5 seconds
    10000,     // 10 seconds
    30000,     // 30 seconds
    60000,     // 1 minute
    300000,    // 5 minutes
    600000,    // 10 minutes
    1800000,   // 30 minutes
    3600000,   // 1 hour
    86400000,  // 1 day
  ];

  for (const interval of intervals) {
    if (interval >= idealInterval) {
      return interval;
    }
  }

  return intervals[intervals.length - 1] ?? 86400000; // Default to 1 day
}
