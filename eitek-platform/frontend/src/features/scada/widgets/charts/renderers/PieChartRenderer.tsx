/**
 * Pie Chart Renderer
 * 
 * Renders pie/doughnut charts for distribution data.
 * Uses latest values from each series.
 */

'use client';

import React, { memo, useMemo } from 'react';
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import type { ChartWidgetConfig } from '../core/types';
import { BaseChart, ChartEmptyState } from '../components/base/BaseChart';
import { useLatestValues } from '../core/data-pipeline';
import { CHART_COLOR_PALETTE } from '../core/constants';
import type { WidgetRendererProps } from '../../../core/types';

// ─── Props ───────────────────────────────────────────────────────────────────

interface PieChartRendererProps extends WidgetRendererProps {
  chartConfig?: ChartWidgetConfig;
  isDoughnut?: boolean;
}

// ─── Pie Data Item ───────────────────────────────────────────────────────────

interface PieDataItem {
  name: string;
  value: number;
  color: string;
  unit?: string;
}

// ─── Custom Tooltip ──────────────────────────────────────────────────────────

interface TooltipPayload {
  name: string;
  value: number;
  payload: PieDataItem;
}

const CustomTooltip = ({ 
  active, 
  payload,
}: { 
  active?: boolean; 
  payload?: TooltipPayload[]; 
}) => {
  if (!active || !payload?.length) return null;

  const firstPayload = payload[0];
  if (!firstPayload) return null;
  
  const { name, value, payload: item } = firstPayload;
  const unit = item?.unit || '';

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
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <div
          style={{
            width: 8,
            height: 8,
            borderRadius: '50%',
            backgroundColor: item?.color,
          }}
        />
        <span style={{ color: '#374151' }}>
          {name}: {typeof value === 'number' ? value.toFixed(2) : value}
          {unit && ` ${unit}`}
        </span>
      </div>
    </div>
  );
};

// ─── Custom Label ────────────────────────────────────────────────────────────

interface LabelProps {
  cx: number;
  cy: number;
  midAngle: number;
  innerRadius: number;
  outerRadius: number;
  percent: number;
  name: string;
  value: number;
}

const RADIAN = Math.PI / 180;

const renderCustomLabel = (
  showPercent: boolean,
  showValue: boolean,
  labelPosition: 'outside' | 'inside' | 'center'
) => (props: LabelProps) => {
  const { cx, cy, midAngle, innerRadius, outerRadius, percent, name, value } = props;
  
  if (labelPosition === 'inside') {
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    return (
      <text
        x={x}
        y={y}
        fill="#fff"
        textAnchor="middle"
        dominantBaseline="central"
        fontSize={10}
        fontWeight={500}
      >
        {showPercent ? `${(percent * 100).toFixed(0)}%` : showValue ? value.toFixed(0) : ''}
      </text>
    );
  }

  // Outside label
  const radius = outerRadius + 15;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);

  const textAnchor = x > cx ? 'start' : 'end';

  return (
    <text
      x={x}
      y={y}
      fill="#6b7280"
      textAnchor={textAnchor}
      dominantBaseline="central"
      fontSize={11}
    >
      {name}{showPercent ? ` (${(percent * 100).toFixed(0)}%)` : ''}
    </text>
  );
};

// ─── Center Text (for Doughnut) ──────────────────────────────────────────────

interface CenterTextProps {
  cx: number;
  cy: number;
  text: string;
  total?: number;
  unit?: string;
}

const CenterText: React.FC<CenterTextProps> = ({ cx, cy, text, total, unit }) => {
  if (!text && total === undefined) return null;

  return (
    <g>
      {text && (
        <text
          x={cx}
          y={cy - (total !== undefined ? 8 : 0)}
          textAnchor="middle"
          dominantBaseline="central"
          fontSize={12}
          fill="#6b7280"
        >
          {text}
        </text>
      )}
      {total !== undefined && (
        <text
          x={cx}
          y={cy + 10}
          textAnchor="middle"
          dominantBaseline="central"
          fontSize={18}
          fontWeight={600}
          fill="#374151"
        >
          {total.toFixed(0)}
          {unit && (
            <tspan fontSize={10} fill="#9ca3af">
              {' '}{unit}
            </tspan>
          )}
        </text>
      )}
    </g>
  );
};

// ─── Component ───────────────────────────────────────────────────────────────

export const PieChartRenderer = memo<PieChartRendererProps>(function PieChartRenderer({
  properties,
  width,
  height,
  isRuntime,
}) {
  // Get chart config from properties
  const chartConfig = (properties.chartConfig as ChartWidgetConfig) || getDefaultConfig();
  const isDoughnut = chartConfig.pieChart?.innerRadius ? chartConfig.pieChart.innerRadius > 0 : false;

  // Fetch latest values
  const { latestValues, loading, error } = useLatestValues({
    config: chartConfig,
    isRuntime,
    isPreview: !isRuntime,
  });

  // Build pie data
  const pieData = useMemo<PieDataItem[]>(() => {
    return chartConfig.data.series
      .filter(s => s.visible !== false)
      .map((series, index) => ({
        name: series.label,
        value: (latestValues[series.key]?.value as number) || 0,
        color: series.color ?? CHART_COLOR_PALETTE[index % CHART_COLOR_PALETTE.length] ?? '#5470C6',
        unit: series.unit ?? '',
      }))
      .filter(item => item.value > 0);
  }, [chartConfig.data.series, latestValues]);

  // Compute total
  const total = useMemo(() => pieData.reduce((sum, item) => sum + item.value, 0), [pieData]);

  // Chart dimensions
  const pieConfig = chartConfig.pieChart || {};
  const innerRadius = pieConfig.innerRadius || 0;
  const outerRadiusPercent = pieConfig.outerRadius || 80;
  const showLabels = pieConfig.showLabels ?? true;
  const labelPosition = pieConfig.labelPosition || 'outside';
  const showPercent = pieConfig.showPercent ?? true;
  const showValue = pieConfig.showValue ?? false;
  const centerText = pieConfig.centerText || '';

  // Check if has data
  const hasData = pieData.length > 0;

  return (
    <BaseChart
      config={chartConfig}
      seriesData={[]}
      width={width}
      height={height}
      loadingState={loading ? 'loading' : hasData ? 'success' : 'idle'}
      error={error ?? ''}
    >
      {!hasData && !loading && (
        <ChartEmptyState message={chartConfig.display.emptyStateText ?? 'No data'} />
      )}
      
      {hasData && (
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={pieData}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              innerRadius={isDoughnut ? `${innerRadius}%` : 0}
              outerRadius={`${outerRadiusPercent}%`}
              paddingAngle={pieData.length > 1 ? 2 : 0}
              startAngle={pieConfig.startAngle || 90}
              endAngle={pieConfig.endAngle || -270}
              label={showLabels ? renderCustomLabel(showPercent, showValue, labelPosition) : false}
              labelLine={showLabels && labelPosition === 'outside'}
              isAnimationActive={chartConfig.display.animation !== false}
              animationDuration={chartConfig.display.animationDuration || 300}
            >
              {pieData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
              ))}
            </Pie>

            {chartConfig.display.showTooltip && (
              <Tooltip content={<CustomTooltip />} />
            )}

            {chartConfig.display.showLegend && (
              <Legend
                layout={chartConfig.legend?.orient || 'horizontal'}
                verticalAlign={
                  chartConfig.legend?.position === 'top' ? 'top' :
                  chartConfig.legend?.position === 'bottom' ? 'bottom' : 'middle'
                }
                align={
                  chartConfig.legend?.position === 'left' ? 'left' :
                  chartConfig.legend?.position === 'right' ? 'right' : 'center'
                }
                wrapperStyle={{ fontSize: 12 }}
                formatter={(value) => (
                  <span style={{ color: '#374151' }}>{value}</span>
                )}
              />
            )}

            {/* Center text for doughnut */}
            {isDoughnut && (centerText || chartConfig.pieChart?.showValue) && (
              <g>
                <CenterText
                  cx={width / 2}
                  cy={height / 2}
                  text={centerText}
                  total={chartConfig.pieChart?.showValue ? total : 0}
                  unit={chartConfig.data.series[0]?.unit ?? ''}
                />
              </g>
            )}
          </PieChart>
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
      autoRefreshMs: 30000,
    },
    display: {
      showTitle: true,
      title: 'Distribution',
      showLegend: true,
      legendPosition: 'right',
      showTooltip: true,
      showGrid: false,
      backgroundColor: '#ffffff',
      borderRadius: 8,
      padding: 16,
      animation: true,
    },
    pieChart: {
      innerRadius: 0,
      outerRadius: 80,
      showLabels: true,
      labelPosition: 'outside',
      showPercent: true,
    },
  };
}

export default PieChartRenderer;
