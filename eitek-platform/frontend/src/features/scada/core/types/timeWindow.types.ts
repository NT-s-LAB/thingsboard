/**
 * Time Window Types — For dashboard-level time range selection (similar to ThingsBoard)
 */

// ─── Time Window Mode ────────────────────────────────────────────────────────

export type TimeWindowMode = 'realtime' | 'history';

// ─── Aggregation Types ───────────────────────────────────────────────────────

export type AggregationType = 
  | 'NONE'
  | 'AVG'
  | 'MIN'
  | 'MAX'
  | 'SUM'
  | 'COUNT'
  | 'FIRST'
  | 'LAST';

// ─── Time Units ──────────────────────────────────────────────────────────────

export type TimeUnit = 'SECOND' | 'MINUTE' | 'HOUR' | 'DAY' | 'WEEK' | 'MONTH' | 'YEAR';

// ─── Interval Presets ────────────────────────────────────────────────────────

export interface IntervalOption {
  label: string;
  value: number;
  unit: TimeUnit;
}

export const LAST_INTERVAL_OPTIONS: IntervalOption[] = [
  { label: '1 minute', value: 1, unit: 'MINUTE' },
  { label: '5 minutes', value: 5, unit: 'MINUTE' },
  { label: '10 minutes', value: 10, unit: 'MINUTE' },
  { label: '15 minutes', value: 15, unit: 'MINUTE' },
  { label: '30 minutes', value: 30, unit: 'MINUTE' },
  { label: '1 hour', value: 1, unit: 'HOUR' },
  { label: '2 hours', value: 2, unit: 'HOUR' },
  { label: '6 hours', value: 6, unit: 'HOUR' },
  { label: '12 hours', value: 12, unit: 'HOUR' },
  { label: '1 day', value: 1, unit: 'DAY' },
  { label: '7 days', value: 7, unit: 'DAY' },
  { label: '30 days', value: 30, unit: 'DAY' },
];

export const GROUPING_INTERVAL_OPTIONS: IntervalOption[] = [
  { label: 'None', value: 0, unit: 'SECOND' },
  { label: '1 second', value: 1, unit: 'SECOND' },
  { label: '5 seconds', value: 5, unit: 'SECOND' },
  { label: '10 seconds', value: 10, unit: 'SECOND' },
  { label: '30 seconds', value: 30, unit: 'SECOND' },
  { label: '1 minute', value: 1, unit: 'MINUTE' },
  { label: '5 minutes', value: 5, unit: 'MINUTE' },
  { label: '10 minutes', value: 10, unit: 'MINUTE' },
  { label: '30 minutes', value: 30, unit: 'MINUTE' },
  { label: '1 hour', value: 1, unit: 'HOUR' },
  { label: '1 day', value: 1, unit: 'DAY' },
];

export const AGGREGATION_OPTIONS: { label: string; value: AggregationType }[] = [
  { label: 'None', value: 'NONE' },
  { label: 'Average', value: 'AVG' },
  { label: 'Min', value: 'MIN' },
  { label: 'Max', value: 'MAX' },
  { label: 'Sum', value: 'SUM' },
  { label: 'Count', value: 'COUNT' },
  { label: 'First', value: 'FIRST' },
  { label: 'Last', value: 'LAST' },
];

// ─── Realtime Window (last X time) ───────────────────────────────────────────

export interface RealtimeWindow {
  type: 'last' | 'relative';
  /** Value for "last" mode (e.g., 12 for "last 12 hours") */
  lastValue: number;
  lastUnit: TimeUnit;
  /** For "relative" mode — ms offset from now */
  relativeStartMs?: number;
  relativeEndMs?: number;
}

// ─── History Window (fixed date range) ───────────────────────────────────────

export interface HistoryWindow {
  /** Start timestamp (ms) */
  startTs: number;
  /** End timestamp (ms) */
  endTs: number;
}

// ─── Combined Time Window ────────────────────────────────────────────────────

export interface DashboardTimeWindow {
  mode: TimeWindowMode;
  /** Realtime settings (last X time) */
  realtime: RealtimeWindow;
  /** History settings (fixed date range) */
  history: HistoryWindow;
  /** Aggregation type */
  aggregation: AggregationType;
  /** Grouping interval in milliseconds (0 = none) */
  groupingIntervalMs: number;
  /** Timezone offset string (e.g., "UTC+07:00") */
  timezone: string;
}

// ─── Helper Functions ────────────────────────────────────────────────────────

export function timeUnitToMs(value: number, unit: TimeUnit): number {
  switch (unit) {
    case 'SECOND': return value * 1000;
    case 'MINUTE': return value * 60 * 1000;
    case 'HOUR': return value * 60 * 60 * 1000;
    case 'DAY': return value * 24 * 60 * 60 * 1000;
    case 'WEEK': return value * 7 * 24 * 60 * 60 * 1000;
    case 'MONTH': return value * 30 * 24 * 60 * 60 * 1000;
    case 'YEAR': return value * 365 * 24 * 60 * 60 * 1000;
  }
}

export function formatTimeUnit(value: number, unit: TimeUnit): string {
  const unitLabels: Record<TimeUnit, string> = {
    SECOND: 'second',
    MINUTE: 'minute',
    HOUR: 'hour',
    DAY: 'day',
    WEEK: 'week',
    MONTH: 'month',
    YEAR: 'year',
  };
  const label = unitLabels[unit];
  return `${value} ${label}${value !== 1 ? 's' : ''}`;
}

export function getTimeWindowRange(tw: DashboardTimeWindow): { startTs: number; endTs: number } {
  const now = Date.now();
  
  if (tw.mode === 'history') {
    return { startTs: tw.history.startTs, endTs: tw.history.endTs };
  }
  
  // Realtime mode
  if (tw.realtime.type === 'last') {
    const durationMs = timeUnitToMs(tw.realtime.lastValue, tw.realtime.lastUnit);
    return { startTs: now - durationMs, endTs: now };
  }
  
  // Relative mode
  return {
    startTs: now - (tw.realtime.relativeStartMs ?? 0),
    endTs: now - (tw.realtime.relativeEndMs ?? 0),
  };
}

export function getDefaultTimeWindow(): DashboardTimeWindow {
  const now = Date.now();
  const tzOffset = -new Date().getTimezoneOffset();
  const hours = Math.floor(Math.abs(tzOffset) / 60);
  const mins = Math.abs(tzOffset) % 60;
  const sign = tzOffset >= 0 ? '+' : '-';
  const tz = `UTC${sign}${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;
  
  return {
    mode: 'realtime',
    realtime: {
      type: 'last',
      lastValue: 12,
      lastUnit: 'HOUR',
    },
    history: {
      startTs: now - 24 * 60 * 60 * 1000,
      endTs: now,
    },
    aggregation: 'AVG',
    groupingIntervalMs: 5 * 60 * 1000, // 5 minutes
    timezone: tz,
  };
}
