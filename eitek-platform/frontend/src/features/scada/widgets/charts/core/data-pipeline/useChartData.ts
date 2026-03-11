/**
 * useChartData Hook
 * 
 * Main hook for managing chart data including:
 * - Historical data fetching
 * - Realtime subscription
 * - Auto refresh
 * - Data transformation
 */

import { useEffect, useState, useCallback, useRef, useMemo } from 'react';
import type { 
  ChartWidgetConfig, 
  ChartDataPoint,
  ChartRuntimeState,
} from '../types';
import type { DashboardTimeWindow } from '../../../../core/types/timeWindow.types';
import { 
  resolveChartTimeWindow, 
  shouldAutoRefresh,
  computeAggregationInterval,
} from '../utils/timeWindowUtils';
import {
  fetchHistoricalData,
  fetchLatestValues,
  buildSeriesData,
  generateMockData,
  decimateData,
} from './chartDataService';
import { CHART_COLOR_PALETTE } from '../constants';

// ─── Hook Options ────────────────────────────────────────────────────────────

export interface UseChartDataOptions {
  config: ChartWidgetConfig;
  dashboardTimeWindow?: DashboardTimeWindow;
  isRuntime?: boolean;
  isPreview?: boolean;
  onError?: (error: Error) => void;
}

// ─── Hook Result ─────────────────────────────────────────────────────────────

export interface UseChartDataResult {
  state: ChartRuntimeState;
  refresh: () => void;
  isLoading: boolean;
  error: string | undefined;
}

// ─── Main Hook ───────────────────────────────────────────────────────────────

export function useChartData(options: UseChartDataOptions): UseChartDataResult {
  const { config, dashboardTimeWindow, isRuntime = false, isPreview = false, onError } = options;

  // State
  const [state, setState] = useState<ChartRuntimeState>({
    loadingState: 'idle',
    seriesData: [],
  });

  // Refs for cleanup and stable references
  const refreshIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const subscriptionsRef = useRef<Set<string>>(new Set());
  const isMountedRef = useRef(true);
  const configRef = useRef(config);
  const onErrorRef = useRef(onError);
  
  // Update refs on each render
  configRef.current = config;
  onErrorRef.current = onError;

  // Stable serialized config key for dependency tracking
  const configKey = useMemo(() => {
    return JSON.stringify({
      series: config.data.series.map(s => ({ id: s.id, key: s.key, entityId: s.entityId || s.deviceId })),
      mode: config.data.mode,
      timeWindow: config.timeWindow,
      maxDataPoints: config.data.maxDataPoints,
    });
  }, [config.data.series, config.data.mode, config.timeWindow, config.data.maxDataPoints]);

  // Compute time range - use stable reference
  const timeRange = useMemo(() => {
    return resolveChartTimeWindow(configRef.current, dashboardTimeWindow);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [configKey, dashboardTimeWindow]);

  // ─── Fetch Data ──────────────────────────────────────────────────────────────

  const fetchData = useCallback(async () => {
    if (!isMountedRef.current) return;
    
    const config = configRef.current;

    // Preview mode: use mock data
    if (isPreview || config.data.series.length === 0) {
      const mockConfig = config.data.series.length > 0 ? config.data.series : [
        { id: 'mock-1', label: 'Series 1', key: 'value', sourceType: 'mock' as const, color: CHART_COLOR_PALETTE[0] ?? '#5470C6' },
      ];
      
      const mockData = generateMockData(mockConfig as any, timeRange, 50);
      setState({
        loadingState: 'success',
        seriesData: mockData,
        lastUpdate: Date.now(),
      });
      return;
    }

    // Group series by entity
    const entityGroups = new Map<string, { entityType: string; keys: string[] }>();
    
    for (const series of config.data.series) {
      if (series.sourceType === 'mock') continue;
      
      const entityId = series.entityId || series.deviceId;
      if (!entityId) continue;

      const key = entityId;
      if (!entityGroups.has(key)) {
        entityGroups.set(key, {
          entityType: series.entityType || 'DEVICE',
          keys: [],
        });
      }
      entityGroups.get(key)!.keys.push(series.key);
    }

    if (entityGroups.size === 0) {
      setState({
        loadingState: 'success',
        seriesData: [],
        lastUpdate: Date.now(),
      });
      return;
    }

    setState(prev => ({ ...prev, loadingState: 'loading' }));

    try {
      // Compute aggregation interval if needed
      const aggType = config.data.aggregation?.type;
      const aggregation = (aggType && aggType !== 'NONE') 
        ? {
            type: aggType,
            interval: computeAggregationInterval(timeRange, config.data.maxDataPoints || 500),
            intervalUnit: config.data.aggregation?.intervalUnit,
          }
        : undefined;

      // Fetch data for all entities
      const rawData = new Map<string, Record<string, ChartDataPoint[]>>();
      
      const fetchPromises = Array.from(entityGroups.entries()).map(async ([entityId, { entityType, keys }]) => {
        const data = await fetchHistoricalData(
          entityType,
          entityId,
          keys,
          timeRange,
          aggregation,
          config.data.maxDataPoints
        );
        return { entityId, data };
      });

      const results = await Promise.all(fetchPromises);
      
      for (const { entityId, data } of results) {
        rawData.set(entityId, data);
      }

      // Build chart series data
      const seriesData = buildSeriesData(config.data.series, rawData);

      // Apply decimation if needed
      const decimationThreshold = config.advanced?.decimationThreshold || 500;
      const decimatedSeriesData = config.advanced?.decimation !== false
        ? seriesData.map(s => ({
            ...s,
            data: s.data.length > decimationThreshold
              ? decimateData(s.data, decimationThreshold)
              : s.data,
          }))
        : seriesData;

      if (!isMountedRef.current) return;

      setState({
        loadingState: 'success',
        seriesData: decimatedSeriesData,
        lastUpdate: Date.now(),
      });

    } catch (error) {
      console.error('Error fetching chart data:', error);
      
      if (!isMountedRef.current) return;

      const errorMessage = error instanceof Error ? error.message : 'Failed to load data';
      setState(prev => ({
        ...prev,
        loadingState: 'error',
        error: errorMessage,
      }));

      onErrorRef.current?.(error instanceof Error ? error : new Error(errorMessage));
    }
  }, [timeRange, isPreview, configKey]);

  // ─── Refresh Handler ─────────────────────────────────────────────────────────

  const refresh = useCallback(() => {
    fetchData();
  }, [fetchData]);

  // ─── Auto Refresh ────────────────────────────────────────────────────────────

  useEffect(() => {
    const config = configRef.current;
    const shouldRefresh = shouldAutoRefresh(config.timeWindow, config.data.mode);
    const refreshMs = config.timeWindow.autoRefreshMs || 5000;

    if (isRuntime && shouldRefresh && refreshMs > 0) {
      refreshIntervalRef.current = setInterval(() => {
        fetchData();
      }, refreshMs);
    }

    return () => {
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
        refreshIntervalRef.current = null;
      }
    };
  }, [isRuntime, configKey, fetchData]);

  // ─── Initial Fetch ───────────────────────────────────────────────────────────

  useEffect(() => {
    isMountedRef.current = true;
    fetchData();

    return () => {
      isMountedRef.current = false;
    };
  }, [fetchData]);

  // ─── Cleanup ─────────────────────────────────────────────────────────────────

  useEffect(() => {
    return () => {
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
      }
      subscriptionsRef.current.clear();
    };
  }, []);

  return {
    state,
    refresh,
    isLoading: state.loadingState === 'loading',
    error: state.error,
  };
}

// ─── Use Latest Values Hook (for Pie/Doughnut) ───────────────────────────────

export interface UseLatestValuesOptions {
  config: ChartWidgetConfig;
  isRuntime?: boolean;
  isPreview?: boolean;
}

export function useLatestValues(options: UseLatestValuesOptions) {
  const { config, isRuntime = false, isPreview = false } = options;

  const [latestValues, setLatestValues] = useState<Record<string, ChartDataPoint>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>();
  
  const refreshIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const fetchLatest = useCallback(async () => {
    if (isPreview) {
      // Mock data for preview
      const mockValues: Record<string, ChartDataPoint> = {};
      const now = Date.now();
      for (const series of config.data.series) {
        mockValues[series.key] = {
          ts: now,
          value: Math.round(Math.random() * 100),
        };
      }
      setLatestValues(mockValues);
      return;
    }

    // Group by entity
    const entityGroups = new Map<string, { entityType: string; keys: string[] }>();
    
    for (const series of config.data.series) {
      const entityId = series.entityId || series.deviceId;
      if (!entityId) continue;

      if (!entityGroups.has(entityId)) {
        entityGroups.set(entityId, {
          entityType: series.entityType || 'DEVICE',
          keys: [],
        });
      }
      entityGroups.get(entityId)!.keys.push(series.key);
    }

    if (entityGroups.size === 0) {
      return;
    }

    setLoading(true);

    try {
      const allValues: Record<string, ChartDataPoint> = {};
      
      const entries = Array.from(entityGroups.entries());
      for (const [entityId, { entityType, keys }] of entries) {
        const values = await fetchLatestValues(entityType, entityId, keys);
        Object.assign(allValues, values);
      }

      setLatestValues(allValues);
      setError(undefined);
    } catch (err) {
      console.error('Error fetching latest values:', err);
      setError(err instanceof Error ? err.message : 'Failed to load');
    } finally {
      setLoading(false);
    }
  }, [config.data.series, isPreview]);

  // Auto refresh
  useEffect(() => {
    if (isRuntime && config.timeWindow.autoRefreshMs) {
      refreshIntervalRef.current = setInterval(fetchLatest, config.timeWindow.autoRefreshMs);
    }

    return () => {
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
      }
    };
  }, [isRuntime, config.timeWindow.autoRefreshMs, fetchLatest]);

  // Initial fetch
  useEffect(() => {
    fetchLatest();
  }, [fetchLatest]);

  return {
    latestValues,
    loading,
    error,
    refresh: fetchLatest,
  };
}
