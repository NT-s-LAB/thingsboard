/**
 * Value Chart Card Renderer
 * 
 * Displays a card with latest value, delta indicator, and mini sparkline.
 * Similar to ThingsBoard's value + chart card widget.
 */

'use client';

import React, { memo, useMemo } from 'react';
import {
  AreaChart,
  Area,
  ResponsiveContainer,
} from 'recharts';
import type { ChartWidgetConfig, ChartDataPoint, LatestValueCardConfig } from '../core/types';
import { useChartData } from '../core/data-pipeline';
import { CHART_COLOR_PALETTE } from '../core/constants';
import type { WidgetRendererProps } from '../../../core/types';

// Default card config
const DEFAULT_CARD_CONFIG: LatestValueCardConfig = {
  showLatestValue: true,
  latestValueFontSize: 32,
  latestValueColor: '#1f2937',
  showDelta: true,
  deltaTimeRange: 60000,
  deltaFormat: 'percent',
  showSparkline: true,
  sparklineHeight: 40,
  showUnit: true,
  showLabel: true,
  labelFontSize: 12,
  unitFontSize: 14,
};

// ─── Props ───────────────────────────────────────────────────────────────────

interface ValueChartCardRendererProps extends WidgetRendererProps {
  chartConfig?: ChartWidgetConfig;
}

// ─── Compute Delta ───────────────────────────────────────────────────────────

interface DeltaInfo {
  value: number;
  percent: number;
  direction: 'up' | 'down' | 'neutral';
}

function computeDelta(data: ChartDataPoint[], currentValue: number, timeRange: number): DeltaInfo {
  if (data.length < 2) {
    return { value: 0, percent: 0, direction: 'neutral' };
  }

  const now = Date.now();
  const compareTs = now - timeRange;
  
  // Find value closest to compareTs
  const firstPoint = data[0];
  let compareValue = (firstPoint?.value as number) ?? 0;
  for (const point of data) {
    if (point.ts <= compareTs) {
      compareValue = point.value as number;
    } else {
      break;
    }
  }

  const deltaValue = currentValue - compareValue;
  const deltaPercent = compareValue !== 0 ? (deltaValue / compareValue) * 100 : 0;

  return {
    value: deltaValue,
    percent: deltaPercent,
    direction: deltaValue > 0 ? 'up' : deltaValue < 0 ? 'down' : 'neutral',
  };
}

// ─── Format Value ────────────────────────────────────────────────────────────

function formatValue(value: number, decimals: number = 2): string {
  if (value >= 1000000) {
    return (value / 1000000).toFixed(1) + 'M';
  }
  if (value >= 1000) {
    return (value / 1000).toFixed(1) + 'K';
  }
  return value.toFixed(decimals);
}

// ─── Delta Arrow Icon ────────────────────────────────────────────────────────

const DeltaArrow: React.FC<{ direction: 'up' | 'down' | 'neutral' }> = ({ direction }) => {
  if (direction === 'neutral') return null;

  const color = direction === 'up' ? '#22c55e' : '#ef4444';
  const rotation = direction === 'up' ? 0 : 180;

  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 24 24"
      fill={color}
      style={{ transform: `rotate(${rotation}deg)` }}
    >
      <path d="M12 4l-8 8h6v8h4v-8h6z" />
    </svg>
  );
};

// ─── Component ───────────────────────────────────────────────────────────────

export const ValueChartCardRenderer = memo<ValueChartCardRendererProps>(function ValueChartCardRenderer({
  properties,
  width,
  height,
  isRuntime,
}) {
  // Get chart config from properties
  const chartConfig = (properties.chartConfig as ChartWidgetConfig) || getDefaultConfig();
  const cardConfig: LatestValueCardConfig = { ...DEFAULT_CARD_CONFIG, ...chartConfig.latestValueCard };

  // Get the first series for display
  const primarySeries = chartConfig.data.series[0];
  const primaryColor = primarySeries?.color || CHART_COLOR_PALETTE[0] || '#3b82f6';
  const unit = primarySeries?.unit || '';
  const label = primarySeries?.label || '';

  // Fetch chart data
  const { state } = useChartData({
    config: chartConfig,
    isRuntime,
    isPreview: !isRuntime,
  });

  // Get primary series data
  const seriesData = useMemo(() => {
    if (state.seriesData.length === 0) return [];
    return state.seriesData[0]?.data || [];
  }, [state.seriesData]);

  // Get latest value
  const latestValue = useMemo(() => {
    if (seriesData.length === 0) return null;
    return seriesData[seriesData.length - 1]?.value as number;
  }, [seriesData]);

  // Compute delta
  const delta = useMemo(() => {
    if (latestValue === null || seriesData.length < 2) {
      return { value: 0, percent: 0, direction: 'neutral' as const };
    }
    return computeDelta(seriesData, latestValue, cardConfig.deltaTimeRange || 60000);
  }, [seriesData, latestValue, cardConfig.deltaTimeRange]);

  // Sparkline data
  const sparklineData = useMemo(() => {
    return seriesData.map(p => ({ value: p.value as number }));
  }, [seriesData]);

  // Computed styles
  const valueFontSize = cardConfig.latestValueFontSize || 32;
  const valueColor = cardConfig.latestValueColor || '#1f2937';
  const showDelta = cardConfig.showDelta ?? true;
  const showSparkline = cardConfig.showSparkline ?? true;
  const sparklineHeight = cardConfig.sparklineHeight || 40;
  const showUnit = cardConfig.showUnit ?? true;
  const showLabel = cardConfig.showLabel ?? true;

  return (
    <div
      style={{
        width,
        height,
        backgroundColor: chartConfig.display.backgroundColor || '#ffffff',
        borderRadius: chartConfig.display.borderRadius || 8,
        padding: chartConfig.display.padding || 16,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        overflow: 'hidden',
      }}
    >
      {/* Title / Label */}
      {showLabel && label && (
        <div
          style={{
            fontSize: cardConfig.labelFontSize || 12,
            color: '#6b7280',
            fontWeight: 500,
            marginBottom: 4,
          }}
        >
          {label}
        </div>
      )}

      {/* Main Value */}
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
        {latestValue !== null ? (
          <>
            <span
              style={{
                fontSize: valueFontSize,
                fontWeight: 600,
                color: valueColor,
                lineHeight: 1,
              }}
            >
              {formatValue(latestValue)}
            </span>
            {showUnit && unit && (
              <span
                style={{
                  fontSize: cardConfig.unitFontSize || 14,
                  color: '#9ca3af',
                  fontWeight: 500,
                }}
              >
                {unit}
              </span>
            )}
          </>
        ) : (
          <span
            style={{
              fontSize: valueFontSize,
              color: '#d1d5db',
            }}
          >
            --
          </span>
        )}
      </div>

      {/* Delta Indicator */}
      {showDelta && latestValue !== null && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 4,
            marginTop: 4,
          }}
        >
          <DeltaArrow direction={delta.direction} />
          <span
            style={{
              fontSize: 12,
              fontWeight: 500,
              color: delta.direction === 'up' ? '#22c55e' : delta.direction === 'down' ? '#ef4444' : '#9ca3af',
            }}
          >
            {cardConfig.deltaFormat === 'percent' 
              ? `${delta.percent >= 0 ? '+' : ''}${delta.percent.toFixed(1)}%`
              : `${delta.value >= 0 ? '+' : ''}${delta.value.toFixed(2)}`
            }
          </span>
        </div>
      )}

      {/* Sparkline */}
      {showSparkline && sparklineData.length > 1 && (
        <div style={{ height: sparklineHeight, marginTop: 8 }}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={sparklineData}>
              <defs>
                <linearGradient id={`sparkGradient-${primarySeries?.id}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={primaryColor} stopOpacity={0.3} />
                  <stop offset="95%" stopColor={primaryColor} stopOpacity={0} />
                </linearGradient>
              </defs>
              <Area
                type="monotone"
                dataKey="value"
                stroke={primaryColor}
                strokeWidth={1.5}
                fill={`url(#sparkGradient-${primarySeries?.id})`}
                isAnimationActive={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Loading overlay */}
      {state.loadingState === 'loading' && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundColor: 'rgba(255,255,255,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <div
            style={{
              width: 16,
              height: 16,
              border: '2px solid #e5e7eb',
              borderTopColor: primaryColor,
              borderRadius: '50%',
              animation: 'spin 1s linear infinite',
            }}
          />
        </div>
      )}
    </div>
  );
});

// ─── Default Config ──────────────────────────────────────────────────────────

function getDefaultConfig(): ChartWidgetConfig {
  return {
    data: {
      mode: 'realtime',
      series: [
        {
          id: 'value',
          label: 'Value',
          sourceType: 'telemetry',
          key: 'value',
          color: '#3b82f6',
        },
      ],
    },
    timeWindow: {
      mode: 'dashboard',
      realtime: true,
      relative: { value: 15, unit: 'minutes' },
      autoRefreshMs: 5000,
    },
    display: {
      showTitle: false,
      backgroundColor: '#ffffff',
      borderRadius: 8,
      padding: 16,
      animation: true,
    },
    latestValueCard: {
      showLatestValue: true,
      latestValueFontSize: 32,
      latestValueColor: '#1f2937',
      showDelta: true,
      deltaTimeRange: 60000,
      deltaFormat: 'percent',
      showSparkline: true,
      sparklineHeight: 40,
      showUnit: true,
      showLabel: true,
    },
  };
}

export default ValueChartCardRenderer;
