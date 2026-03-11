/**
 * Bar Chart Renderer
 * 
 * Renders bar charts for categorical or time-based data.
 */

'use client';

import React, { memo, useMemo } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LabelList,
  ReferenceLine,
} from 'recharts';
import type { ChartWidgetConfig, ChartSeriesData } from '../core/types';
import { BaseChart, ChartEmptyState } from '../components/base/BaseChart';
import { useChartData } from '../core/data-pipeline';
import type { WidgetRendererProps } from '../../../core/types';

// ─── Props ───────────────────────────────────────────────────────────────────

interface BarChartRendererProps extends WidgetRendererProps {
  chartConfig?: ChartWidgetConfig;
  showLabels?: boolean;
}

// ─── Merge Data for Recharts ─────────────────────────────────────────────────

function mergeSeriesDataForRecharts(seriesData: ChartSeriesData[]): Array<Record<string, unknown>> {
  const timestamps = new Set<number>();
  
  for (const series of seriesData) {
    for (const point of series.data) {
      timestamps.add(point.ts);
    }
  }

  const sortedTs = Array.from(timestamps).sort((a, b) => a - b);
  const dataByTs = new Map<number, Record<string, unknown>>();
  
  for (const ts of sortedTs) {
    dataByTs.set(ts, { ts });
  }

  for (const series of seriesData) {
    for (const point of series.data) {
      const row = dataByTs.get(point.ts)!;
      row[series.seriesId] = point.value;
    }
  }

  return sortedTs.map(ts => dataByTs.get(ts)!);
}

// ─── Format Functions ────────────────────────────────────────────────────────

function formatTimestamp(ts: number): string {
  const date = new Date(ts);
  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatShortTimestamp(ts: number): string {
  const date = new Date(ts);
  return date.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

// ─── Custom Tooltip ──────────────────────────────────────────────────────────

interface ChartTooltipEntry {
  name: string;
  value: number | string | null;
  color?: string;
  dataKey?: string;
  payload?: Record<string, unknown>;
}

const CustomTooltip = ({ 
  active, 
  payload, 
  label,
  seriesData,
}: { 
  active?: boolean; 
  payload?: ChartTooltipEntry[]; 
  label?: number;
  seriesData: ChartSeriesData[];
}) => {
  if (!active || !payload?.length) return null;

  const seriesMap = new Map(seriesData.map(s => [s.seriesId, s]));

  return (
    <div
      style={{
        backgroundColor: '#fff',
        border: '1px solid #e5e7eb',
        borderRadius: 6,
        padding: 8,
        fontSize: 12,
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
      }}
    >
      <div style={{ marginBottom: 4, fontWeight: 500, color: '#6b7280' }}>
        {label ? formatTimestamp(label) : ''}
      </div>
      {payload.map((entry, index) => {
        const series = entry.dataKey ? seriesMap.get(entry.dataKey) : undefined;
        const unit = series?.unit || '';
        return (
          <div key={index} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div
              style={{
                width: 8,
                height: 8,
                borderRadius: 2,
                backgroundColor: entry.color,
              }}
            />
            <span style={{ color: '#374151' }}>
              {entry.name}: {typeof entry.value === 'number' ? entry.value.toFixed(2) : entry.value}
              {unit && ` ${unit}`}
            </span>
          </div>
        );
      })}
    </div>
  );
};

// ─── Component ───────────────────────────────────────────────────────────────

export const BarChartRenderer = memo<BarChartRendererProps>(function BarChartRenderer({
  properties,
  width,
  height,
  isRuntime,
}) {
  // Get chart config from properties
  const chartConfig = (properties.chartConfig as ChartWidgetConfig) || getDefaultConfig();
  const showLabels = (properties.showLabels as boolean) ?? false;

  // Fetch chart data
  const { state, error } = useChartData({
    config: chartConfig,
    isRuntime,
    isPreview: !isRuntime,
  });

  // Merge data for recharts
  const chartData = useMemo(() => {
    if (state.seriesData.length === 0) return [];
    return mergeSeriesDataForRecharts(state.seriesData);
  }, [state.seriesData]);

  // Check if has data
  const hasData = chartData.length > 0;

  return (
    <BaseChart
      config={chartConfig}
      seriesData={state.seriesData}
      width={width}
      height={height}
      loadingState={state.loadingState}
      error={error ?? ''}
    >
      {!hasData && <ChartEmptyState message={chartConfig.display.emptyStateText ?? 'No data'} />}
      
      {hasData && (
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={chartData}
            margin={{ top: 5, right: 20, left: 0, bottom: 5 }}
          >
            {chartConfig.display.showGrid && (
              <CartesianGrid
                strokeDasharray="3 3"
                stroke={chartConfig.display.gridColor || '#e5e7eb'}
                vertical={false}
              />
            )}
            
            {chartConfig.display.showXAxis && (
              <XAxis
                dataKey="ts"
                tickFormatter={formatShortTimestamp}
                tick={{ fontSize: 10, fill: '#6b7280' }}
                stroke="#e5e7eb"
              />
            )}
            
            {chartConfig.display.showYAxis && (
              <YAxis
                tick={{ fontSize: 10, fill: '#6b7280' }}
                stroke="#e5e7eb"
                width={40}
              />
            )}
            
            {chartConfig.display.showTooltip && (
              <Tooltip
                content={(props) => (
                  <CustomTooltip 
                    active={props.active ?? false} 
                    payload={props.payload as ChartTooltipEntry[]} 
                    label={props.label as number} 
                    seriesData={state.seriesData} 
                  />
                )}
              />
            )}
            
            {chartConfig.display.showLegend && (
              <Legend
                wrapperStyle={{ fontSize: 12 }}
                verticalAlign={chartConfig.legend?.position === 'top' ? 'top' : 'bottom'}
              />
            )}

            {/* Threshold lines */}
            {chartConfig.thresholds?.map((threshold) => (
              <ReferenceLine
                key={threshold.id}
                y={threshold.value}
                stroke={threshold.color || '#ef4444'}
                strokeDasharray={threshold.lineStyle === 'dashed' ? '5 5' : threshold.lineStyle === 'dotted' ? '2 2' : '0'}
                strokeWidth={threshold.lineWidth || 1}
              />
            ))}

            {/* Series bars */}
            {state.seriesData.map((series) => {
              const seriesConfig = chartConfig.data.series.find(s => s.id === series.seriesId);
              const stackId = seriesConfig?.stackGroup || undefined;
              
              return (
                <Bar
                  key={series.seriesId}
                  dataKey={series.seriesId}
                  name={series.name}
                  fill={series.color}
                  {...(stackId ? { stackId } : {})}
                  radius={[4, 4, 0, 0]}
                  isAnimationActive={chartConfig.display.animation !== false}
                  animationDuration={chartConfig.display.animationDuration || 300}
                >
                  {showLabels && (
                    <LabelList
                      dataKey={series.seriesId}
                      position="top"
                      style={{ fontSize: 10, fill: '#6b7280' }}
                      formatter={(value: number) => value.toFixed(1)}
                    />
                  )}
                </Bar>
              );
            })}
          </BarChart>
        </ResponsiveContainer>
      )}
    </BaseChart>
  );
});

// ─── Default Config ──────────────────────────────────────────────────────────

function getDefaultConfig(): ChartWidgetConfig {
  return {
    data: {
      mode: 'historical',
      series: [],
    },
    timeWindow: {
      mode: 'dashboard',
      realtime: false,
      relative: { value: 24, unit: 'hours' },
      autoRefreshMs: 60000,
    },
    display: {
      showTitle: true,
      title: 'Bar Chart',
      showLegend: true,
      showTooltip: true,
      showGrid: true,
      showXAxis: true,
      showYAxis: true,
      backgroundColor: '#ffffff',
      borderRadius: 8,
      padding: 16,
      animation: true,
    },
    thresholds: [],
  };
}

export default BarChartRenderer;
