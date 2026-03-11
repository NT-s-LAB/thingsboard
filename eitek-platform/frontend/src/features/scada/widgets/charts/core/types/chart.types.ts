/**
 * Chart Widget Core Types
 * 
 * Type definitions for Chart Widget System.
 * Follows ThingsBoard-like architecture with typed configs.
 */

import type { AggregationType, TimeUnit } from '../../../../core/types/timeWindow.types';

// ─── Chart Widget Type ───────────────────────────────────────────────────────

export type ChartWidgetType =
  | 'time-series'
  | 'line'
  | 'bar'
  | 'point'
  | 'state'
  | 'bar-with-labels'
  | 'range'
  | 'value-chart-card'
  | 'bars'
  | 'pie'
  | 'doughnut'
  | 'horizontal-doughnut'
  | 'polar-area'
  | 'radar';

// ─── Series Style ────────────────────────────────────────────────────────────

export type SeriesChartStyle = 
  | 'line' 
  | 'bar' 
  | 'area' 
  | 'scatter' 
  | 'step' 
  | 'stepAfter'
  | 'stepBefore';

export type LineStyle = 'solid' | 'dashed' | 'dotted';

// ─── Data Source Types ───────────────────────────────────────────────────────

export type ChartDataSourceType = 
  | 'telemetry' 
  | 'attribute' 
  | 'computed' 
  | 'api' 
  | 'mock';

export type ChartDataMode = 'realtime' | 'historical' | 'hybrid';

// ─── Data Point ──────────────────────────────────────────────────────────────

export interface ChartDataPoint {
  ts: number;
  value: number | string | null;
}

export interface ChartSeriesData {
  seriesId: string;
  name: string;
  color?: string | undefined;
  data: ChartDataPoint[];
  unit?: string | undefined;
}

// ─── Series Configuration ────────────────────────────────────────────────────

export interface ChartSeriesConfig {
  id: string;
  label: string;
  sourceType: ChartDataSourceType;
  
  // Entity reference
  deviceId?: string;
  entityId?: string;
  entityType?: 'DEVICE' | 'ASSET' | 'ENTITY_VIEW';
  
  // Data key
  key: string;
  
  // Visual styling
  color?: string;
  unit?: string;
  chartStyle?: SeriesChartStyle;
  
  // Line options
  lineWidth?: number;
  lineStyle?: LineStyle;
  showSymbol?: boolean;
  symbolSize?: number;
  
  // Area options
  fill?: boolean;
  fillOpacity?: number;
  
  // Axis assignment
  yAxisId?: string;
  
  // Visibility
  visible?: boolean;
  
  // Stacking
  stackGroup?: string;
  
  // Value formatting
  formatter?: ValueFormatterConfig;
}

// ─── Value Formatter ─────────────────────────────────────────────────────────

export interface ValueFormatterConfig {
  type: 'number' | 'percent' | 'bytes' | 'duration' | 'custom';
  decimals?: number;
  prefix?: string;
  suffix?: string;
  multiplier?: number;
  customFormat?: string;
}

// ─── Aggregation Configuration ───────────────────────────────────────────────

export interface AggregationConfig {
  type: AggregationType;
  interval?: number | undefined;
  intervalUnit?: TimeUnit | undefined;
}

// ─── Sampling Configuration ──────────────────────────────────────────────────

export interface SamplingConfig {
  enabled: boolean;
  maxPoints?: number;
  method?: 'lttb' | 'average' | 'minmax' | 'first';
}

// ─── Data Configuration ──────────────────────────────────────────────────────

export interface ChartDataConfig {
  mode: ChartDataMode;
  series: ChartSeriesConfig[];
  aggregation?: AggregationConfig;
  maxDataPoints?: number;
  sampling?: SamplingConfig;
}

// ─── Time Window Configuration ───────────────────────────────────────────────

export type TimeWindowModeWidget = 'dashboard' | 'widget';

export interface ChartTimeWindowConfig {
  /** Use dashboard time window or widget-specific */
  mode: TimeWindowModeWidget;
  
  /** Display time window badge in header */
  displayTimeWindow?: boolean;
  
  /** Enable realtime mode */
  realtime?: boolean;
  
  /** Relative time range (for widget mode) */
  relative?: {
    value: number;
    unit: 'seconds' | 'minutes' | 'hours' | 'days';
  };
  
  /** Absolute time range */
  absolute?: {
    startTs: number;
    endTs: number;
  };
  
  /** Auto refresh interval in milliseconds */
  autoRefreshMs?: number;
}

// ─── Display Configuration ───────────────────────────────────────────────────

export interface ChartDisplayConfig {
  title?: string;
  showTitle?: boolean;
  titleFontSize?: number;
  titleColor?: string;
  
  showLegend?: boolean;
  legendPosition?: 'top' | 'bottom' | 'left' | 'right';
  
  showTooltip?: boolean;
  tooltipTrigger?: 'axis' | 'item';
  
  showGrid?: boolean;
  gridColor?: string;
  
  showXAxis?: boolean;
  showYAxis?: boolean;
  
  backgroundColor?: string;
  borderRadius?: number;
  padding?: number;
  
  animation?: boolean;
  animationDuration?: number;
  
  emptyStateText?: string;
}

// ─── Axis Configuration ──────────────────────────────────────────────────────

export interface AxisConfig {
  id: string;
  label?: string;
  unit?: string;
  min?: number | 'auto';
  max?: number | 'auto';
  position?: 'left' | 'right' | 'top' | 'bottom';
  showGrid?: boolean;
  showTicks?: boolean;
  showLine?: boolean;
  tickCount?: number;
  formatter?: ValueFormatterConfig;
}

export interface ChartAxesConfig {
  xAxis?: AxisConfig;
  yAxes?: AxisConfig[];
}

// ─── Legend Configuration ────────────────────────────────────────────────────

export interface ChartLegendConfig {
  show: boolean;
  position: 'top' | 'bottom' | 'left' | 'right';
  orient?: 'horizontal' | 'vertical';
  align?: 'auto' | 'left' | 'right';
  itemWidth?: number;
  itemHeight?: number;
  formatter?: string;
  selectedMode?: boolean | 'single' | 'multiple';
}

// ─── Tooltip Configuration ───────────────────────────────────────────────────

export interface ChartTooltipConfig {
  show: boolean;
  trigger: 'axis' | 'item';
  showCrosshair?: boolean;
  confine?: boolean;
  formatter?: string;
  valueFormatter?: ValueFormatterConfig;
}

// ─── Threshold Line Configuration ────────────────────────────────────────────

export type ThresholdSeverity = 'info' | 'warning' | 'critical';

export interface ThresholdLineConfig {
  id: string;
  label?: string;
  value: number;
  color?: string;
  lineStyle?: LineStyle;
  lineWidth?: number;
  severity?: ThresholdSeverity;
  showLabel?: boolean;
  labelPosition?: 'start' | 'middle' | 'end';
  yAxisId?: string;
}

// ─── Latest Value Card Configuration ─────────────────────────────────────────

export interface LatestValueCardConfig {
  showLatestValue: boolean;
  latestValueFontSize?: number;
  latestValueColor?: string;
  
  showDelta?: boolean;
  deltaTimeRange?: number; // in ms, compare with value N ms ago
  deltaFormat?: 'absolute' | 'percent';
  
  showSparkline?: boolean;
  sparklineHeight?: number;
  sparklineColor?: string;
  
  showUnit?: boolean;
  unitFontSize?: number;
  
  showLabel?: boolean;
  labelFontSize?: number;
}

// ─── State Chart Configuration ───────────────────────────────────────────────

export interface StateChartConfig {
  states: StateDefinition[];
  showDuration?: boolean;
  showTransitions?: boolean;
}

export interface StateDefinition {
  value: string | number;
  label: string;
  color: string;
}

// ─── Pie/Doughnut Configuration ──────────────────────────────────────────────

export interface PieChartConfig {
  innerRadius?: number; // 0 for pie, >0 for doughnut
  outerRadius?: number;
  startAngle?: number;
  endAngle?: number;
  showLabels?: boolean;
  labelPosition?: 'outside' | 'inside' | 'center';
  showPercent?: boolean;
  showValue?: boolean;
  centerText?: string;
  roseType?: boolean | 'radius' | 'area';
}

// ─── Radar Configuration ─────────────────────────────────────────────────────

export interface RadarChartConfig {
  shape?: 'polygon' | 'circle';
  indicators: RadarIndicator[];
  startAngle?: number;
  splitNumber?: number;
  scale?: boolean;
}

export interface RadarIndicator {
  name: string;
  max: number;
  min?: number;
  color?: string;
}

// ─── Advanced Configuration ──────────────────────────────────────────────────

export interface ChartAdvancedConfig {
  maxDataPoints?: number;
  decimation?: boolean;
  decimationThreshold?: number;
  interpolation?: 'linear' | 'smooth' | 'step';
  nullHandling?: 'connect' | 'break' | 'zero';
  refreshStrategy?: 'append' | 'replace';
  enableZoom?: boolean;
  enableDataZoom?: boolean;
}

// ─── Complete Chart Widget Configuration ─────────────────────────────────────

export interface ChartWidgetConfig {
  /** Data source and series configuration */
  data: ChartDataConfig;
  
  /** Time window settings */
  timeWindow: ChartTimeWindowConfig;
  
  /** Display/visual settings */
  display: ChartDisplayConfig;
  
  /** Axis configuration */
  axes?: ChartAxesConfig;
  
  /** Legend configuration */
  legend?: ChartLegendConfig;
  
  /** Tooltip configuration */
  tooltip?: ChartTooltipConfig;
  
  /** Threshold lines */
  thresholds?: ThresholdLineConfig[];
  
  /** For value-chart-card type */
  latestValueCard?: LatestValueCardConfig;
  
  /** For state chart */
  stateChart?: StateChartConfig;
  
  /** For pie/doughnut charts */
  pieChart?: PieChartConfig;
  
  /** For radar chart */
  radarChart?: RadarChartConfig;
  
  /** Advanced settings */
  advanced?: ChartAdvancedConfig;
}

// ─── Chart Metadata (for registry) ────────────────────────────────────────────

export type ChartTag = 
  | 'series' 
  | 'latest' 
  | 'actual' 
  | 'historical' 
  | 'realtime' 
  | 'comparison'
  | 'distribution'
  | 'deprecated';

export interface ChartWidgetMetadata {
  type: ChartWidgetType;
  name: string;
  description: string;
  icon: string;
  tags: ChartTag[];
  previewImage?: string;
  defaultConfig: ChartWidgetConfig;
}

// ─── Runtime State ───────────────────────────────────────────────────────────

export type ChartLoadingState = 'idle' | 'loading' | 'success' | 'error';

export interface ChartRuntimeState {
  loadingState: ChartLoadingState;
  error?: string;
  lastUpdate?: number;
  seriesData: ChartSeriesData[];
  latestValues?: Record<string, ChartDataPoint>;
}
