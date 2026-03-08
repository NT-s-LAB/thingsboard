'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { Button } from '@/shared/components/ui/Button';
import { deviceService } from '../../services/deviceService';
import { useDeviceRealtime } from '../../hooks/useDeviceRealtime';

interface TelemetryEntry {
  key: string;
  ts: number;
  value: string;
}

interface DeviceTelemetryTabProps {
  deviceId: string;
}

type TimeRange = '1h' | '6h' | '24h' | '7d' | '30d' | 'custom';

const timeRanges: { key: TimeRange; label: string }[] = [
  { key: '1h', label: '1 Hour' },
  { key: '6h', label: '6 Hours' },
  { key: '24h', label: '24 Hours' },
  { key: '7d', label: '7 Days' },
  { key: '30d', label: '30 Days' },
];

const aggTypes = ['NONE', 'MIN', 'MAX', 'AVG', 'SUM', 'COUNT'];

function getTimeMs(range: TimeRange): number {
  switch (range) {
    case '1h': return 60 * 60 * 1000;
    case '6h': return 6 * 60 * 60 * 1000;
    case '24h': return 24 * 60 * 60 * 1000;
    case '7d': return 7 * 24 * 60 * 60 * 1000;
    case '30d': return 30 * 24 * 60 * 60 * 1000;
    default: return 24 * 60 * 60 * 1000;
  }
}

export const DeviceTelemetryTab: React.FC<DeviceTelemetryTabProps> = ({ deviceId }) => {
  const [latestData, setLatestData] = useState<TelemetryEntry[]>([]);
  const [timeseriesData, setTimeseriesData] = useState<Record<string, Array<{ ts: number; value: string }>>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'latest' | 'timeseries'>('latest');
  const [timeRange, setTimeRange] = useState<TimeRange>('24h');
  const [agg, setAgg] = useState('NONE');
  const [selectedKeys, setSelectedKeys] = useState<string[]>([]);
  const [autoRefresh, setAutoRefresh] = useState(false);

  const currentSelectedKeys = selectedKeys;

  // Real-time WebSocket updates
  const { connected: wsConnected } = useDeviceRealtime({
    deviceId,
    onTelemetry: useCallback((event) => {
      if (!event.data || typeof event.data !== 'object') return;
      setLatestData(prev => {
        const updated = [...prev];
        Object.entries(event.data).forEach(([key, values]) => {
          const arr = values as Array<{ ts: number; value: string }>;
          if (arr.length > 0) {
            const latest = arr[0]!;
            const existingIdx = updated.findIndex(e => e.key === key);
            if (existingIdx >= 0) {
              updated[existingIdx] = { key, ts: latest.ts, value: latest.value };
            } else {
              updated.push({ key, ts: latest.ts, value: latest.value });
              updated.sort((a, b) => a.key.localeCompare(b.key));
            }
          }
        });
        return updated;
      });
    }, []),
  });

  const fetchLatest = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await deviceService.getDeviceTelemetry(deviceId);
      const entries: TelemetryEntry[] = [];
      if (data && typeof data === 'object') {
        Object.entries(data).forEach(([key, values]) => {
          const arr = values as Array<{ ts: number; value: string }>;
          if (arr.length > 0) {
            const first = arr[0]!;
            entries.push({ key, ts: first.ts, value: first.value });
          }
        });
      }
      entries.sort((a, b) => a.key.localeCompare(b.key));
      setLatestData(entries);

      // Auto-select all keys if none selected
      if (currentSelectedKeys.length === 0 && entries.length > 0) {
        setSelectedKeys(entries.map(e => e.key));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load telemetry');
    } finally {
      setLoading(false);
    }
  }, [deviceId, currentSelectedKeys.length]);

  const fetchTimeseries = useCallback(async () => {
    if (selectedKeys.length === 0) return;
    try {
      setLoading(true);
      setError(null);
      const now = Date.now();
      const start = now - getTimeMs(timeRange);
      const data = await deviceService.getDeviceTimeseries(
        deviceId,
        selectedKeys,
        start,
        now,
        { ...(agg !== 'NONE' ? { agg } : {}), limit: 500 },
      );
      setTimeseriesData(data || {});
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load timeseries');
    } finally {
      setLoading(false);
    }
  }, [deviceId, selectedKeys, timeRange, agg]);

  useEffect(() => {
    fetchLatest();
  }, [fetchLatest]);

  useEffect(() => {
    if (viewMode === 'timeseries' && selectedKeys.length > 0) {
      fetchTimeseries();
    }
  }, [viewMode, fetchTimeseries, selectedKeys.length]);

  // Auto-refresh
  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(() => {
      if (viewMode === 'latest') fetchLatest();
      else fetchTimeseries();
    }, 5000);
    return () => clearInterval(interval);
  }, [autoRefresh, viewMode, fetchLatest, fetchTimeseries]);

  const toggleKey = (key: string) => {
    setSelectedKeys(prev => 
      prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]
    );
  };

  const formatValue = (value: string): string => {
    const num = Number(value);
    if (!isNaN(num) && value.trim() !== '') {
      return num % 1 === 0 ? num.toString() : num.toFixed(4);
    }
    return value;
  };

  return (
    <div className="p-6 space-y-4">
      {/* Controls */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setViewMode('latest')}
            className={`px-3 py-1.5 text-sm font-medium rounded-md ${
              viewMode === 'latest' ? 'bg-primary-100 text-primary-700' : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            Latest Values
          </button>
          <button
            onClick={() => setViewMode('timeseries')}
            className={`px-3 py-1.5 text-sm font-medium rounded-md ${
              viewMode === 'timeseries' ? 'bg-primary-100 text-primary-700' : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            Timeseries
          </button>
        </div>

        <div className="flex items-center space-x-2">
          {viewMode === 'timeseries' && (
            <>
              {/* Time Range */}
              <select
                value={timeRange}
                onChange={(e) => setTimeRange(e.target.value as TimeRange)}
                className="px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
              >
                {timeRanges.map(r => (
                  <option key={r.key} value={r.key}>{r.label}</option>
                ))}
              </select>
              {/* Aggregation */}
              <select
                value={agg}
                onChange={(e) => setAgg(e.target.value)}
                className="px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
              >
                {aggTypes.map(a => (
                  <option key={a} value={a}>{a}</option>
                ))}
              </select>
            </>
          )}
          <label className="flex items-center space-x-1 text-sm text-gray-600 cursor-pointer">
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
              className="rounded border-gray-300"
            />
            <span>Auto-refresh</span>
          </label>
          {wsConnected && (
            <span className="flex items-center space-x-1 text-xs text-green-600">
              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              <span>Live</span>
            </span>
          )}
          <Button variant="outline" size="sm" onClick={viewMode === 'latest' ? fetchLatest : fetchTimeseries}>
            Refresh
          </Button>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-600">{error}</div>
      )}

      {/* Latest Values */}
      {viewMode === 'latest' && (
        loading ? (
          <div className="text-center py-8 text-gray-500">Loading telemetry...</div>
        ) : latestData.length === 0 ? (
          <div className="text-center py-8 text-gray-500">No telemetry data available</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Key</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Value</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {latestData.map((entry) => (
                  <tr key={entry.key} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-mono text-gray-900">{entry.key}</td>
                    <td className="px-4 py-3 font-mono text-gray-700">{formatValue(entry.value)}</td>
                    <td className="px-4 py-3 text-gray-500">{new Date(entry.ts).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      )}

      {/* Timeseries View */}
      {viewMode === 'timeseries' && (
        <div className="space-y-4">
          {/* Key Selector */}
          <div className="flex flex-wrap gap-2">
            {latestData.map(entry => (
              <button
                key={entry.key}
                onClick={() => toggleKey(entry.key)}
                className={`px-3 py-1 text-xs rounded-full border transition-colors ${
                  selectedKeys.includes(entry.key)
                    ? 'bg-primary-100 text-primary-700 border-primary-300'
                    : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'
                }`}
              >
                {entry.key}
              </button>
            ))}
          </div>

          {/* Timeseries Data Table */}
          {loading ? (
            <div className="text-center py-8 text-gray-500">Loading timeseries...</div>
          ) : Object.keys(timeseriesData).length === 0 ? (
            <div className="text-center py-8 text-gray-500">No timeseries data available for the selected range</div>
          ) : (
            <div className="space-y-4">
              {Object.entries(timeseriesData).map(([key, values]) => (
                <div key={key} className="border rounded-lg">
                  <div className="bg-gray-50 px-4 py-2 border-b">
                    <span className="font-medium text-sm text-gray-900">{key}</span>
                    <span className="text-xs text-gray-500 ml-2">({values.length} data points)</span>
                  </div>
                  <div className="overflow-x-auto max-h-64 overflow-y-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50 sticky top-0">
                        <tr>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Timestamp</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Value</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {values.slice(0, 100).map((v, i) => (
                          <tr key={i} className="hover:bg-gray-50">
                            <td className="px-4 py-1.5 text-gray-500">{new Date(v.ts).toLocaleString()}</td>
                            <td className="px-4 py-1.5 font-mono text-gray-700">{formatValue(v.value)}</td>
                          </tr>
                        ))}
                        {values.length > 100 && (
                          <tr>
                            <td className="px-4 py-2 text-gray-400 text-center" colSpan={2}>
                              ... and {values.length - 100} more data points
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
