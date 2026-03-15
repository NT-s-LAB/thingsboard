/**
 * Export Chart Dialog
 *
 * Dialog for exporting chart data to Excel with time range selection.
 * Supports fetching data from API for custom time ranges.
 */

'use client';

import React, { useState, useCallback, useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/shared/components/ui/Dialog';
import { FileSpreadsheet, Download, Loader2 } from 'lucide-react';
import type { ChartSeriesData, ChartWidgetConfig, ChartSeriesConfig } from '../core/types';
import { getTimeseriesTelemetry } from '@/features/scada/services/thingsboardApi';
import type { TbEntityType } from '@/features/scada/types';

// ─── Props ───────────────────────────────────────────────────────────────────

/** Callback to fetch data for a specific time range */
export type FetchExportDataFn = (startTs: number, endTs: number) => Promise<ChartSeriesData[]>;

export interface ExportChartDialogProps {
  open: boolean;
  onClose: () => void;
  config: ChartWidgetConfig;
  seriesData: ChartSeriesData[];
  /** Callback to fetch data for export - if provided, will be used instead of internal fetch */
  onFetchExportData?: FetchExportDataFn | undefined;
}

// ─── Time Presets ────────────────────────────────────────────────────────────

const TIME_PRESETS = [
  { label: 'Last 1 hour', value: 1 * 60 * 60 * 1000 },
  { label: 'Last 6 hours', value: 6 * 60 * 60 * 1000 },
  { label: 'Last 12 hours', value: 12 * 60 * 60 * 1000 },
  { label: 'Last 24 hours', value: 24 * 60 * 60 * 1000 },
  { label: 'Last 7 days', value: 7 * 24 * 60 * 60 * 1000 },
  { label: 'Last 30 days', value: 30 * 24 * 60 * 60 * 1000 },
  { label: 'Custom', value: -1 },
];

// ─── Component ───────────────────────────────────────────────────────────────

export const ExportChartDialog: React.FC<ExportChartDialogProps> = ({
  open,
  onClose,
  config,
  seriesData,
  onFetchExportData,
}) => {
  const [selectedPreset, setSelectedPreset] = useState(TIME_PRESETS[3]!.value); // Default: Last 24 hours
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');
  const [isExporting, setIsExporting] = useState(false);
  const [exportMode, setExportMode] = useState<'current' | 'range'>('current');

  // Initialize custom dates
  const initCustomDates = useCallback(() => {
    const now = new Date();
    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    setCustomEnd(formatDateTimeLocal(now));
    setCustomStart(formatDateTimeLocal(yesterday));
  }, []);

  // Calculate time range based on selection
  const timeRange = useMemo(() => {
    if (exportMode === 'current') {
      // Use current data's time range
      let minTs = Infinity;
      let maxTs = -Infinity;
      for (const series of seriesData) {
        for (const point of series.data) {
          if (point.ts < minTs) minTs = point.ts;
          if (point.ts > maxTs) maxTs = point.ts;
        }
      }
      if (minTs === Infinity || maxTs === -Infinity) {
        const now = Date.now();
        return { startTs: now - 24 * 60 * 60 * 1000, endTs: now };
      }
      return { startTs: minTs, endTs: maxTs };
    }

    if (selectedPreset === -1) {
      // Custom range
      const startTs = customStart ? new Date(customStart).getTime() : Date.now() - 24 * 60 * 60 * 1000;
      const endTs = customEnd ? new Date(customEnd).getTime() : Date.now();
      return { startTs, endTs };
    }

    // Preset
    const now = Date.now();
    return { startTs: now - selectedPreset, endTs: now };
  }, [exportMode, selectedPreset, customStart, customEnd, seriesData]);

  // Handle export
  const handleExport = useCallback(async () => {
    setIsExporting(true);
    try {
      let dataToExport: ChartSeriesData[];

      if (exportMode === 'current') {
        // Export current chart data
        dataToExport = seriesData;
      } else {
        // Fetch data for the selected time range
        // Use provided callback if available, otherwise use internal fetch
        if (onFetchExportData) {
          console.log('Fetching export data with callback:', { startTs: timeRange.startTs, endTs: timeRange.endTs });
          dataToExport = await onFetchExportData(timeRange.startTs, timeRange.endTs);
        } else {
          console.log('Fetching export data with internal function:', { startTs: timeRange.startTs, endTs: timeRange.endTs });
          dataToExport = await fetchDataForExport(config, timeRange.startTs, timeRange.endTs);
        }
        
        // Fallback to current data if fetch fails or returns empty
        if (dataToExport.length === 0) {
          console.warn('No data fetched, using current chart data');
          dataToExport = seriesData;
        }
      }

      console.log('Exporting data:', { recordCount: dataToExport.reduce((sum, s) => sum + s.data.length, 0) });

      // Generate Excel-compatible CSV
      const csv = generateCSV(dataToExport, config);
      const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });

      // Download file
      const fileName = `${config.display.title || 'chart'}_${formatDateForFileName(new Date())}.csv`;
      downloadBlob(blob, fileName);

      onClose();
    } catch (error) {
      console.error('Export failed:', error);
    } finally {
      setIsExporting(false);
    }
  }, [exportMode, seriesData, timeRange, config, onClose, onFetchExportData]);

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5 text-green-600" />
            Export Chart Data
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Export Mode */}
          <div>
            <label className="text-sm font-medium text-gray-700 mb-2 block">
              Export Mode
            </label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setExportMode('current')}
                className={`flex-1 px-4 py-2 text-sm rounded-lg border transition-colors ${
                  exportMode === 'current'
                    ? 'bg-blue-50 border-blue-500 text-blue-700'
                    : 'border-gray-200 hover:bg-gray-50'
                }`}
              >
                Current View
              </button>
              <button
                type="button"
                onClick={() => {
                  setExportMode('range');
                  initCustomDates();
                }}
                className={`flex-1 px-4 py-2 text-sm rounded-lg border transition-colors ${
                  exportMode === 'range'
                    ? 'bg-blue-50 border-blue-500 text-blue-700'
                    : 'border-gray-200 hover:bg-gray-50'
                }`}
              >
                Custom Range
              </button>
            </div>
          </div>

          {/* Time Range Selection - only for range mode */}
          {exportMode === 'range' && (
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">
                Time Range
              </label>
              <select
                value={selectedPreset}
                onChange={(e) => setSelectedPreset(Number(e.target.value))}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {TIME_PRESETS.map((preset) => (
                  <option key={preset.value} value={preset.value}>
                    {preset.label}
                  </option>
                ))}
              </select>

              {/* Custom Range Inputs */}
              {selectedPreset === -1 && (
                <div className="mt-3 space-y-3">
                  <div>
                    <label className="text-xs text-gray-500 mb-1 block">Start Time</label>
                    <input
                      type="datetime-local"
                      value={customStart}
                      onChange={(e) => setCustomStart(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 mb-1 block">End Time</label>
                    <input
                      type="datetime-local"
                      value={customEnd}
                      onChange={(e) => setCustomEnd(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Preview Info */}
          <div className="bg-gray-50 rounded-lg p-3">
            <div className="text-xs text-gray-500 mb-1">Export Preview</div>
            <div className="text-sm">
              <div>
                <span className="text-gray-600">Series: </span>
                <span className="font-medium">{seriesData.length}</span>
              </div>
              <div>
                <span className="text-gray-600">Time: </span>
                <span className="font-medium">
                  {formatDateTime(new Date(timeRange.startTs))} - {formatDateTime(new Date(timeRange.endTs))}
                </span>
              </div>
              {exportMode === 'current' && (
                <div>
                  <span className="text-gray-600">Data Points: </span>
                  <span className="font-medium">
                    {seriesData.reduce((sum, s) => sum + s.data.length, 0)}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleExport}
            disabled={isExporting}
            className="px-4 py-2 text-sm bg-green-600 text-white hover:bg-green-700 rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50"
          >
            {isExporting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Exporting...
              </>
            ) : (
              <>
                <Download className="w-4 h-4" />
                Export CSV
              </>
            )}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

// ─── Helper Functions ────────────────────────────────────────────────────────

function formatDateTimeLocal(date: Date): string {
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

function formatDateTime(date: Date): string {
  const day = date.getDate().toString().padStart(2, '0');
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const year = date.getFullYear();
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  return `${day}/${month}/${year} ${hours}:${minutes}`;
}

function formatDateForFileName(date: Date): string {
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  return `${year}${month}${day}_${hours}${minutes}`;
}

// ─── Fetch Data for Export ───────────────────────────────────────────────────

async function fetchDataForExport(
  config: ChartWidgetConfig,
  startTs: number,
  endTs: number
): Promise<ChartSeriesData[]> {
  const result: ChartSeriesData[] = [];

  // Group series by entity
  const entityMap = new Map<string, { entityType: TbEntityType; entityId: string; seriesConfigs: ChartSeriesConfig[] }>();

  for (const seriesConfig of config.data.series) {
    if (seriesConfig.sourceType !== 'telemetry') continue;
    
    const entityId = seriesConfig.entityId || seriesConfig.deviceId;
    const entityType = (seriesConfig.entityType || 'DEVICE') as TbEntityType;
    
    if (!entityId) continue;

    const entityKey = `${entityType}:${entityId}`;
    if (!entityMap.has(entityKey)) {
      entityMap.set(entityKey, { entityType, entityId, seriesConfigs: [] });
    }
    entityMap.get(entityKey)!.seriesConfigs.push(seriesConfig);
  }

  // Fetch data for each entity
  const entityEntries = Array.from(entityMap.entries());
  for (const [, { entityType, entityId, seriesConfigs }] of entityEntries) {
    const keys = seriesConfigs.map((s: ChartSeriesConfig) => s.key);
    
    try {
      const telemetryData = await getTimeseriesTelemetry(
        entityType,
        entityId,
        keys,
        startTs,
        endTs,
        'NONE', // No aggregation for export
        undefined,
        50000 // Higher limit for export
      );

      // Transform to ChartSeriesData
      for (const seriesConfig of seriesConfigs) {
        const keyData = telemetryData[seriesConfig.key];
        if (!keyData) continue;

        const seriesData: ChartSeriesData = {
          seriesId: seriesConfig.id,
          name: seriesConfig.label,
          color: seriesConfig.color,
          unit: seriesConfig.unit,
          data: keyData.map((point) => ({
            ts: point.ts,
            value: parseFloat(point.value) || 0,
          })),
        };

        result.push(seriesData);
      }
    } catch (error) {
      console.error(`Failed to fetch data for ${entityType}:${entityId}:`, error);
    }
  }

  return result;
}

function generateCSV(seriesData: ChartSeriesData[], _config: ChartWidgetConfig): string {
  // Collect all timestamps
  const timestampsSet = new Set<number>();
  for (const series of seriesData) {
    for (const point of series.data) {
      timestampsSet.add(point.ts);
    }
  }

  const timestamps = Array.from(timestampsSet).sort((a, b) => a - b);

  // Build data map
  const dataMap = new Map<number, Record<string, number | null>>();
  for (const ts of timestamps) {
    dataMap.set(ts, {});
  }

  for (const series of seriesData) {
    for (const point of series.data) {
      const row = dataMap.get(point.ts);
      if (row) {
        row[series.seriesId] = typeof point.value === 'number' ? point.value : null;
      }
    }
  }

  // Build CSV
  const headers = ['Timestamp', 'Date', 'Time', ...seriesData.map((s) => s.name || s.seriesId)];
  const rows: string[] = [headers.join(',')];

  for (const ts of timestamps) {
    const date = new Date(ts);
    const row = dataMap.get(ts)!;
    const dateStr = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')}`;
    const timeStr = `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}:${date.getSeconds().toString().padStart(2, '0')}`;
    
    const values = seriesData.map((s) => {
      const val = row[s.seriesId];
      return val !== null && val !== undefined ? val.toString() : '';
    });

    rows.push([ts.toString(), dateStr, timeStr, ...values].join(','));
  }

  return rows.join('\n');
}

function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export default ExportChartDialog;
