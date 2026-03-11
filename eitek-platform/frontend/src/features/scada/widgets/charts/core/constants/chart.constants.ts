/**
 * Chart Widget Constants
 * 
 * Default values, presets, and color palettes for charts.
 */

import type { 
  ChartTimeWindowConfig, 
  ChartDisplayConfig, 
  ChartLegendConfig,
  ChartTooltipConfig,
  ChartAxesConfig,
  ChartAdvancedConfig,
  ChartDataConfig,
  ValueFormatterConfig,
  ChartWidgetConfig,
} from '../types/chart.types';

// ─── Color Palettes ──────────────────────────────────────────────────────────

export const CHART_COLOR_PALETTE = [
  '#5470C6', // blue
  '#91CC75', // green
  '#FAC858', // yellow
  '#EE6666', // red
  '#73C0DE', // cyan
  '#3BA272', // dark green
  '#FC8452', // orange
  '#9A60B4', // purple
  '#EA7CCC', // pink
  '#5D93CA', // light blue
];

export const THRESHOLD_COLORS = {
  info: '#3B82F6',
  warning: '#F59E0B',
  critical: '#EF4444',
};

export const STATE_COLORS = {
  running: '#22C55E',
  stopped: '#6B7280',
  fault: '#EF4444',
  warning: '#F59E0B',
  idle: '#94A3B8',
  maintenance: '#8B5CF6',
};

// ─── Time Window Presets ─────────────────────────────────────────────────────

export const TIME_WINDOW_PRESETS = [
  { label: 'Last 1 minute', value: 1, unit: 'minutes' as const },
  { label: 'Last 5 minutes', value: 5, unit: 'minutes' as const },
  { label: 'Last 15 minutes', value: 15, unit: 'minutes' as const },
  { label: 'Last 30 minutes', value: 30, unit: 'minutes' as const },
  { label: 'Last 1 hour', value: 1, unit: 'hours' as const },
  { label: 'Last 6 hours', value: 6, unit: 'hours' as const },
  { label: 'Last 12 hours', value: 12, unit: 'hours' as const },
  { label: 'Last 24 hours', value: 24, unit: 'hours' as const },
  { label: 'Last 7 days', value: 7, unit: 'days' as const },
  { label: 'Last 30 days', value: 30, unit: 'days' as const },
];

export const REFRESH_INTERVALS = [
  { label: 'Off', value: 0 },
  { label: '1 second', value: 1000 },
  { label: '5 seconds', value: 5000 },
  { label: '10 seconds', value: 10000 },
  { label: '30 seconds', value: 30000 },
  { label: '1 minute', value: 60000 },
  { label: '5 minutes', value: 300000 },
];

// ─── Default Configurations ──────────────────────────────────────────────────

export const DEFAULT_TIME_WINDOW_CONFIG: ChartTimeWindowConfig = {
  mode: 'dashboard',
  displayTimeWindow: true,
  realtime: true,
  relative: {
    value: 15,
    unit: 'minutes',
  },
  autoRefreshMs: 5000,
};

export const DEFAULT_DISPLAY_CONFIG: ChartDisplayConfig = {
  showTitle: true,
  titleFontSize: 14,
  titleColor: '#374151',
  showLegend: true,
  legendPosition: 'bottom',
  showTooltip: true,
  tooltipTrigger: 'axis',
  showGrid: true,
  gridColor: '#E5E7EB',
  showXAxis: true,
  showYAxis: true,
  backgroundColor: '#FFFFFF',
  borderRadius: 8,
  padding: 16,
  animation: true,
  animationDuration: 300,
  emptyStateText: 'No data available',
};

export const DEFAULT_LEGEND_CONFIG: ChartLegendConfig = {
  show: true,
  position: 'bottom',
  orient: 'horizontal',
  align: 'auto',
  itemWidth: 25,
  itemHeight: 14,
  selectedMode: 'multiple',
};

export const DEFAULT_TOOLTIP_CONFIG: ChartTooltipConfig = {
  show: true,
  trigger: 'axis',
  showCrosshair: true,
  confine: true,
};

export const DEFAULT_AXES_CONFIG: ChartAxesConfig = {
  xAxis: {
    id: 'x',
    showGrid: true,
    showTicks: true,
    showLine: true,
    position: 'bottom',
  },
  yAxes: [
    {
      id: 'y1',
      showGrid: true,
      showTicks: true,
      showLine: true,
      position: 'left',
      min: 'auto',
      max: 'auto',
    },
  ],
};

export const DEFAULT_ADVANCED_CONFIG: ChartAdvancedConfig = {
  maxDataPoints: 1000,
  decimation: true,
  decimationThreshold: 500,
  interpolation: 'linear',
  nullHandling: 'connect',
  refreshStrategy: 'append',
  enableZoom: false,
  enableDataZoom: true,
};

export const DEFAULT_DATA_CONFIG: ChartDataConfig = {
  mode: 'realtime',
  series: [],
  maxDataPoints: 500,
  aggregation: {
    type: 'NONE',
  },
};

export const DEFAULT_VALUE_FORMATTER: ValueFormatterConfig = {
  type: 'number',
  decimals: 2,
};

// ─── Chart Type Default Configs ──────────────────────────────────────────────

export function getDefaultChartConfig(chartType: string): ChartWidgetConfig {
  const base: ChartWidgetConfig = {
    data: { ...DEFAULT_DATA_CONFIG },
    timeWindow: { ...DEFAULT_TIME_WINDOW_CONFIG },
    display: { ...DEFAULT_DISPLAY_CONFIG },
    axes: { ...DEFAULT_AXES_CONFIG },
    legend: { ...DEFAULT_LEGEND_CONFIG },
    tooltip: { ...DEFAULT_TOOLTIP_CONFIG },
    advanced: { ...DEFAULT_ADVANCED_CONFIG },
    thresholds: [],
  };

  switch (chartType) {
    case 'time-series':
    case 'line':
      return {
        ...base,
        data: {
          ...base.data,
          mode: 'realtime',
          series: [
            {
              id: 'series-1',
              label: 'Series 1',
              sourceType: 'telemetry',
              key: 'temperature',
              color: CHART_COLOR_PALETTE[0] ?? '#5470C6',
              chartStyle: 'line',
              lineWidth: 2,
              showSymbol: false,
              fill: false,
            },
          ],
        },
      };

    case 'bar':
    case 'bar-with-labels':
      return {
        ...base,
        data: {
          ...base.data,
          mode: 'historical',
          series: [
            {
              id: 'series-1',
              label: 'Series 1',
              sourceType: 'telemetry',
              key: 'value',
              color: CHART_COLOR_PALETTE[0] ?? '#5470C6',
              chartStyle: 'bar',
            },
          ],
        },
      };

    case 'pie':
      return {
        ...base,
        data: {
          ...base.data,
          mode: 'historical',
          series: [],
        },
        pieChart: {
          innerRadius: 0,
          outerRadius: 80,
          showLabels: true,
          labelPosition: 'outside',
          showPercent: true,
          showValue: false,
        },
        legend: {
          ...DEFAULT_LEGEND_CONFIG,
          position: 'right',
          orient: 'vertical',
        },
      };

    case 'doughnut':
      return {
        ...base,
        data: {
          ...base.data,
          mode: 'historical',
          series: [],
        },
        pieChart: {
          innerRadius: 50,
          outerRadius: 80,
          showLabels: true,
          labelPosition: 'outside',
          showPercent: true,
          centerText: '',
        },
        legend: {
          ...DEFAULT_LEGEND_CONFIG,
          position: 'right',
          orient: 'vertical',
        },
      };

    case 'point':
      return {
        ...base,
        data: {
          ...base.data,
          mode: 'historical',
          series: [
            {
              id: 'series-1',
              label: 'Series 1',
              sourceType: 'telemetry',
              key: 'value',
              color: CHART_COLOR_PALETTE[0] ?? '#5470C6',
              chartStyle: 'scatter',
              showSymbol: true,
              symbolSize: 6,
            },
          ],
        },
      };

    case 'value-chart-card':
      return {
        ...base,
        data: {
          ...base.data,
          mode: 'realtime',
          series: [
            {
              id: 'series-1',
              label: 'Value',
              sourceType: 'telemetry',
              key: 'value',
              color: CHART_COLOR_PALETTE[0] ?? '#5470C6',
              chartStyle: 'line',
            },
          ],
        },
        latestValueCard: {
          showLatestValue: true,
          latestValueFontSize: 32,
          latestValueColor: '#1F2937',
          showDelta: true,
          deltaTimeRange: 60000,
          deltaFormat: 'percent',
          showSparkline: true,
          sparklineHeight: 40,
          showUnit: true,
        },
      };

    case 'radar':
      return {
        ...base,
        data: {
          ...base.data,
          mode: 'historical',
          series: [],
        },
        radarChart: {
          shape: 'polygon',
          indicators: [],
          splitNumber: 5,
        },
      };

    case 'polar-area':
      return {
        ...base,
        data: {
          ...base.data,
          mode: 'historical',
          series: [],
        },
        pieChart: {
          innerRadius: 0,
          outerRadius: 80,
          roseType: 'area',
        },
      };

    case 'state':
      return {
        ...base,
        data: {
          ...base.data,
          mode: 'historical',
          series: [
            {
              id: 'state-series',
              label: 'State',
              sourceType: 'telemetry',
              key: 'state',
            },
          ],
        },
        stateChart: {
          states: [
            { value: 'running', label: 'Running', color: STATE_COLORS.running },
            { value: 'stopped', label: 'Stopped', color: STATE_COLORS.stopped },
            { value: 'fault', label: 'Fault', color: STATE_COLORS.fault },
          ],
          showDuration: true,
        },
      };

    default:
      return base;
  }
}

// ─── Chart Size Defaults ─────────────────────────────────────────────────────

export const CHART_DEFAULT_SIZES: Record<string, { width: number; height: number }> = {
  'time-series': { width: 480, height: 280 },
  'line': { width: 400, height: 240 },
  'bar': { width: 400, height: 280 },
  'point': { width: 400, height: 280 },
  'state': { width: 480, height: 120 },
  'bar-with-labels': { width: 400, height: 280 },
  'range': { width: 480, height: 280 },
  'value-chart-card': { width: 200, height: 140 },
  'bars': { width: 300, height: 200 },
  'pie': { width: 300, height: 280 },
  'doughnut': { width: 300, height: 280 },
  'horizontal-doughnut': { width: 400, height: 200 },
  'polar-area': { width: 300, height: 280 },
  'radar': { width: 320, height: 320 },
};
