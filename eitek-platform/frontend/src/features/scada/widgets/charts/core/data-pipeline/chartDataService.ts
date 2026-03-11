/**
 * Chart Data Service
 * 
 * Service for fetching telemetry data for charts.
 * Supports both realtime and historical queries.
 */

import type { 
  ChartSeriesConfig, 
  ChartDataPoint, 
  ChartSeriesData,
  AggregationConfig,
} from '../types';
import type { TimeRange } from '../utils/timeWindowUtils';
import { CHART_COLOR_PALETTE } from '../constants';

// ─── API Base URL ────────────────────────────────────────────────────────────

const TB_API_BASE = process.env.NEXT_PUBLIC_THINGSBOARD_API_URL || 'http://localhost:8080';

// ─── Auth Token ──────────────────────────────────────────────────────────────

function getAuthToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('token') || localStorage.getItem('tb_token');
}

function getHeaders(): HeadersInit {
  const token = getAuthToken();
  return {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
  };
}

// ─── Latest Values API ───────────────────────────────────────────────────────

export interface LatestValueResult {
  key: string;
  ts: number;
  value: string | number | boolean;
}

/**
 * Fetch latest telemetry values for multiple keys.
 */
export async function fetchLatestValues(
  entityType: string,
  entityId: string,
  keys: string[]
): Promise<Record<string, ChartDataPoint>> {
  if (!entityId || keys.length === 0) {
    return {};
  }

  try {
    const keysParam = keys.join(',');
    const res = await fetch(
      `${TB_API_BASE}/api/plugins/telemetry/${entityType}/${entityId}/values/timeseries?keys=${keysParam}`,
      { headers: getHeaders() }
    );

    if (!res.ok) {
      throw new Error(`Failed to fetch latest values: ${res.status}`);
    }

    const data: Record<string, Array<{ ts: number; value: string }>> = await res.json();
    
    const result: Record<string, ChartDataPoint> = {};
    for (const [key, values] of Object.entries(data)) {
      const latest = values?.[0];
      if (latest) {
        result[key] = {
          ts: latest.ts,
          value: parseValue(latest.value),
        };
      }
    }

    return result;
  } catch (error) {
    console.error('Error fetching latest values:', error);
    return {};
  }
}

// ─── Historical Data API ─────────────────────────────────────────────────────

/**
 * Fetch historical timeseries data.
 */
export async function fetchHistoricalData(
  entityType: string,
  entityId: string,
  keys: string[],
  timeRange: TimeRange,
  aggregation?: AggregationConfig,
  limit?: number
): Promise<Record<string, ChartDataPoint[]>> {
  if (!entityId || keys.length === 0) {
    return {};
  }

  try {
    const params = new URLSearchParams({
      keys: keys.join(','),
      startTs: String(timeRange.startTs),
      endTs: String(timeRange.endTs),
      agg: aggregation?.type || 'NONE',
    });

    if (aggregation?.interval) {
      params.set('interval', String(aggregation.interval));
    }
    if (limit) {
      params.set('limit', String(limit));
    }

    const res = await fetch(
      `${TB_API_BASE}/api/plugins/telemetry/${entityType}/${entityId}/values/timeseries?${params}`,
      { headers: getHeaders() }
    );

    if (!res.ok) {
      throw new Error(`Failed to fetch historical data: ${res.status}`);
    }

    const data: Record<string, Array<{ ts: number; value: string }>> = await res.json();
    
    const result: Record<string, ChartDataPoint[]> = {};
    for (const [key, values] of Object.entries(data)) {
      result[key] = (values || [])
        .map(v => ({
          ts: v.ts,
          value: parseValue(v.value),
        }))
        .sort((a, b) => a.ts - b.ts);
    }

    return result;
  } catch (error) {
    console.error('Error fetching historical data:', error);
    return {};
  }
}

// ─── Multi-Entity Data Fetch ─────────────────────────────────────────────────

interface EntityDataRequest {
  entityType: string;
  entityId: string;
  keys: string[];
}

/**
 * Fetch data for multiple entities at once.
 */
export async function fetchMultiEntityData(
  requests: EntityDataRequest[],
  timeRange: TimeRange,
  aggregation?: AggregationConfig
): Promise<Map<string, Record<string, ChartDataPoint[]>>> {
  const result = new Map<string, Record<string, ChartDataPoint[]>>();

  // Parallel fetch for all entities
  const promises = requests.map(async (req) => {
    const data = await fetchHistoricalData(
      req.entityType,
      req.entityId,
      req.keys,
      timeRange,
      aggregation
    );
    return { entityId: req.entityId, data };
  });

  const results = await Promise.all(promises);
  
  for (const { entityId, data } of results) {
    result.set(entityId, data);
  }

  return result;
}

// ─── Build Series Data ───────────────────────────────────────────────────────

/**
 * Convert raw data to ChartSeriesData format.
 */
export function buildSeriesData(
  seriesConfigs: ChartSeriesConfig[],
  rawData: Map<string, Record<string, ChartDataPoint[]>>
): ChartSeriesData[] {
  return seriesConfigs
    .filter(s => s.visible !== false)
    .map((series, index) => {
      const entityId = series.entityId || series.deviceId || '';
      const entityData = rawData.get(entityId) || {};
      const data = entityData[series.key] || [];

      return {
        seriesId: series.id,
        name: series.label,
        color: series.color ?? CHART_COLOR_PALETTE[index % CHART_COLOR_PALETTE.length] ?? '#5470C6',
        data,
        unit: series.unit ?? undefined,
      };
    });
}

// ─── Mock Data Generator ─────────────────────────────────────────────────────

/**
 * Generate mock data for testing/preview.
 */
export function generateMockData(
  seriesConfigs: ChartSeriesConfig[],
  timeRange: TimeRange,
  pointCount: number = 100
): ChartSeriesData[] {
  const interval = (timeRange.endTs - timeRange.startTs) / pointCount;

  return seriesConfigs.map((series, index) => {
    const data: ChartDataPoint[] = [];
    let baseValue = 50 + Math.random() * 100;

    for (let i = 0; i < pointCount; i++) {
      const ts = timeRange.startTs + i * interval;
      // Random walk with slight trend
      baseValue += (Math.random() - 0.5) * 10;
      baseValue = Math.max(0, Math.min(200, baseValue));
      
      data.push({
        ts,
        value: Math.round(baseValue * 100) / 100,
      });
    }

    return {
      seriesId: series.id,
      name: series.label,
      color: series.color ?? CHART_COLOR_PALETTE[index % CHART_COLOR_PALETTE.length] ?? '#5470C6',
      data,
      unit: series.unit ?? undefined,
    };
  });
}

/**
 * Generate mock latest values for pie/doughnut charts.
 */
export function generateMockLatestValues(
  seriesConfigs: ChartSeriesConfig[]
): Record<string, ChartDataPoint> {
  const result: Record<string, ChartDataPoint> = {};
  const now = Date.now();

  for (const series of seriesConfigs) {
    result[series.key] = {
      ts: now,
      value: Math.round(Math.random() * 100),
    };
  }

  return result;
}

// ─── Helper Functions ────────────────────────────────────────────────────────

function parseValue(value: string | number | boolean | null): number | null {
  if (value === null || value === undefined) return null;
  if (typeof value === 'number') return value;
  if (typeof value === 'boolean') return value ? 1 : 0;
  
  const num = parseFloat(value);
  return isNaN(num) ? null : num;
}

// ─── Data Decimation ─────────────────────────────────────────────────────────

/**
 * Downsample data using LTTB algorithm.
 * Largest Triangle Three Buckets - preserves visual appearance.
 */
export function decimateData(
  data: ChartDataPoint[], 
  threshold: number
): ChartDataPoint[] {
  if (data.length <= threshold) return data;
  
  const firstPoint = data[0];
  const lastPoint = data[data.length - 1];
  if (!firstPoint || !lastPoint) return data;

  const decimated: ChartDataPoint[] = [];
  const bucketSize = (data.length - 2) / (threshold - 2);

  // Always include first point
  decimated.push(firstPoint);

  for (let i = 0; i < threshold - 2; i++) {
    const bucketStart = Math.floor(i * bucketSize) + 1;
    const bucketEnd = Math.floor((i + 1) * bucketSize) + 1;
    
    // Calculate average in next bucket
    let avgX = 0;
    let avgY = 0;
    const nextBucketStart = Math.floor((i + 1) * bucketSize) + 1;
    const nextBucketEnd = Math.floor((i + 2) * bucketSize) + 1;
    const nextBucketSize = Math.min(nextBucketEnd, data.length) - nextBucketStart;

    for (let j = nextBucketStart; j < nextBucketEnd && j < data.length; j++) {
      const point = data[j];
      if (point) {
        avgX += point.ts;
        avgY += (point.value as number) || 0;
      }
    }
    avgX /= nextBucketSize || 1;
    avgY /= nextBucketSize || 1;

    // Find point in current bucket with largest triangle area
    let maxArea = -1;
    let maxIndex = bucketStart;
    const prevPoint = decimated[decimated.length - 1];
    if (!prevPoint) continue;

    for (let j = bucketStart; j < bucketEnd && j < data.length; j++) {
      const currentPoint = data[j];
      if (!currentPoint) continue;
      
      const area = Math.abs(
        (prevPoint.ts - avgX) * ((currentPoint.value as number) || 0 - ((prevPoint.value as number) || 0)) -
        (prevPoint.ts - currentPoint.ts) * (avgY - ((prevPoint.value as number) || 0))
      );

      if (area > maxArea) {
        maxArea = area;
        maxIndex = j;
      }
    }

    const maxPoint = data[maxIndex];
    if (maxPoint) {
      decimated.push(maxPoint);
    }
  }

  // Always include last point
  decimated.push(lastPoint);

  return decimated;
}

// ─── Merge Realtime Point ────────────────────────────────────────────────────

/**
 * Append new realtime point to existing data.
 */
export function appendRealtimePoint(
  existingData: ChartDataPoint[],
  newPoint: ChartDataPoint,
  maxPoints: number = 500
): ChartDataPoint[] {
  const result = [...existingData, newPoint];
  
  // Trim old data if exceeds max
  if (result.length > maxPoints) {
    return result.slice(result.length - maxPoints);
  }
  
  return result;
}

/**
 * Trim data points that are older than the time window.
 */
export function trimDataToTimeWindow(
  data: ChartDataPoint[],
  timeRange: TimeRange
): ChartDataPoint[] {
  return data.filter(p => p.ts >= timeRange.startTs && p.ts <= timeRange.endTs);
}
