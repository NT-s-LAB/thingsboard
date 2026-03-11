/**
 * Chart Widget Definitions
 * 
 * Defines all chart widgets and registers them with the WidgetRegistry.
 * Each definition includes:
 * - Widget metadata
 * - Property schema
 * - Binding schema
 * - Action schema
 * - Renderer component
 */

import type { WidgetDefinition, PropField, BindingField, ActionField } from '../../core/types';
import { widgetRegistry } from '../../core/registry';

import { TimeSeriesChartRenderer } from './renderers/TimeSeriesChartRenderer';
import { PieChartRenderer } from './renderers/PieChartRenderer';
import { BarChartRenderer } from './renderers/BarChartRenderer';
import { ValueChartCardRenderer } from './renderers/ValueChartCardRenderer';

import { CHART_DEFAULT_SIZES } from './core/constants';

// ─── Default Size Fallback ───────────────────────────────────────────────────
const getDefaultSize = (key: string) => CHART_DEFAULT_SIZES[key] ?? { width: 300, height: 200 };

// ─── Common Property Schemas ─────────────────────────────────────────────────

const chartTitleProps: PropField[] = [
  { key: 'chartConfig.display.showTitle', label: 'Show Title', type: 'boolean', defaultValue: true, group: 'Display' },
  { key: 'chartConfig.display.title', label: 'Title', type: 'string', defaultValue: '', group: 'Display' },
  { key: 'chartConfig.display.titleFontSize', label: 'Title Font Size', type: 'number', defaultValue: 14, min: 10, max: 24, group: 'Display' },
  { key: 'chartConfig.display.titleColor', label: 'Title Color', type: 'color', defaultValue: '#374151', group: 'Display' },
];

const chartDisplayProps: PropField[] = [
  { key: 'chartConfig.display.showLegend', label: 'Show Legend', type: 'boolean', defaultValue: true, group: 'Display' },
  { key: 'chartConfig.display.legendPosition', label: 'Legend Position', type: 'select', defaultValue: 'bottom', options: [
    { value: 'top', label: 'Top' },
    { value: 'bottom', label: 'Bottom' },
    { value: 'left', label: 'Left' },
    { value: 'right', label: 'Right' },
  ], group: 'Display' },
  { key: 'chartConfig.display.showTooltip', label: 'Show Tooltip', type: 'boolean', defaultValue: true, group: 'Display' },
  { key: 'chartConfig.display.showGrid', label: 'Show Grid', type: 'boolean', defaultValue: true, group: 'Display' },
  { key: 'chartConfig.display.gridColor', label: 'Grid Color', type: 'color', defaultValue: '#E5E7EB', group: 'Display' },
];

const chartAxisProps: PropField[] = [
  { key: 'chartConfig.display.showXAxis', label: 'Show X Axis', type: 'boolean', defaultValue: true, group: 'Axis' },
  { key: 'chartConfig.display.showYAxis', label: 'Show Y Axis', type: 'boolean', defaultValue: true, group: 'Axis' },
];

const chartStyleProps: PropField[] = [
  { key: 'chartConfig.display.backgroundColor', label: 'Background', type: 'color', defaultValue: '#FFFFFF', group: 'Style' },
  { key: 'chartConfig.display.borderRadius', label: 'Border Radius', type: 'number', defaultValue: 8, min: 0, max: 24, group: 'Style' },
  { key: 'chartConfig.display.padding', label: 'Padding', type: 'number', defaultValue: 16, min: 0, max: 32, group: 'Style' },
  { key: 'chartConfig.display.animation', label: 'Enable Animation', type: 'boolean', defaultValue: true, group: 'Style' },
];

const chartTimeWindowProps: PropField[] = [
  { key: 'chartConfig.timeWindow.mode', label: 'Time Window Mode', type: 'select', defaultValue: 'dashboard', options: [
    { value: 'dashboard', label: 'Use Dashboard' },
    { value: 'widget', label: 'Widget Specific' },
  ], group: 'Time' },
  { key: 'chartConfig.timeWindow.realtime', label: 'Realtime Mode', type: 'boolean', defaultValue: true, group: 'Time' },
  { key: 'chartConfig.timeWindow.relative.value', label: 'Time Range Value', type: 'number', defaultValue: 15, min: 1, group: 'Time' },
  { key: 'chartConfig.timeWindow.relative.unit', label: 'Time Range Unit', type: 'select', defaultValue: 'minutes', options: [
    { value: 'seconds', label: 'Seconds' },
    { value: 'minutes', label: 'Minutes' },
    { value: 'hours', label: 'Hours' },
    { value: 'days', label: 'Days' },
  ], group: 'Time' },
  { key: 'chartConfig.timeWindow.autoRefreshMs', label: 'Auto Refresh (ms)', type: 'number', defaultValue: 5000, min: 0, step: 1000, group: 'Time', description: '0 to disable' },
];

const chartDataProps: PropField[] = [
  { key: 'chartConfig.data.mode', label: 'Data Mode', type: 'select', defaultValue: 'realtime', options: [
    { value: 'realtime', label: 'Realtime' },
    { value: 'historical', label: 'Historical' },
    { value: 'hybrid', label: 'Hybrid' },
  ], group: 'Data' },
  { key: 'chartConfig.data.maxDataPoints', label: 'Max Data Points', type: 'number', defaultValue: 500, min: 10, max: 5000, group: 'Data' },
  { key: 'chartConfig.data.aggregation.type', label: 'Aggregation', type: 'select', defaultValue: 'NONE', options: [
    { value: 'NONE', label: 'None' },
    { value: 'AVG', label: 'Average' },
    { value: 'MIN', label: 'Min' },
    { value: 'MAX', label: 'Max' },
    { value: 'SUM', label: 'Sum' },
    { value: 'COUNT', label: 'Count' },
  ], group: 'Data' },
];

const chartSeriesProps: PropField[] = [
  { key: 'chartConfig.data.series', label: 'Series Config', type: 'json', defaultValue: [], group: 'Series', description: 'Configure data series' },
];

const chartThresholdProps: PropField[] = [
  { key: 'chartConfig.thresholds', label: 'Thresholds', type: 'json', defaultValue: [], group: 'Thresholds', description: '[{id, value, color, label}]' },
];

// ─── Binding Schemas ──────────────────────────────────────────────────────────

// Chart bindings - each series can be bound to a telemetry key
// When bound, the entityId and key are stored in chartConfig.data.series[N]
const chartBindingSchema: BindingField[] = [
  { key: 'chartConfig.data.series[0].key', label: 'Series 1', valueType: 'number', suggestedKey: 'temperature', description: 'Bind to device telemetry for series 1' },
  { key: 'chartConfig.data.series[1].key', label: 'Series 2', valueType: 'number', description: 'Bind to device telemetry for series 2' },
  { key: 'chartConfig.data.series[2].key', label: 'Series 3', valueType: 'number', description: 'Bind to device telemetry for series 3' },
];

// ─── Action Schemas ──────────────────────────────────────────────────────────

const chartActionSchema: ActionField[] = [
  { trigger: 'click', label: 'On Click' },
  { trigger: 'dataPointClick', label: 'On Data Point Click' },
];

// ─── TIME SERIES CHART ───────────────────────────────────────────────────────

const timeSeriesChart: WidgetDefinition = {
  type: 'time-series-chart',
  name: 'Time Series Chart',
  icon: '📈',
  category: 'chart',
  defaultSize: getDefaultSize('time-series'),
  supportsSvg: false,
  propSchema: [
    ...chartTitleProps,
    ...chartDisplayProps,
    ...chartAxisProps,
    ...chartStyleProps,
    ...chartTimeWindowProps,
    ...chartDataProps,
    ...chartSeriesProps,
    ...chartThresholdProps,
  ],
  bindingSchema: chartBindingSchema,
  actionSchema: chartActionSchema,
  renderer: TimeSeriesChartRenderer,
  previewSvg: `<svg viewBox="0 0 100 60" fill="none">
    <rect x="5" y="5" width="90" height="50" rx="4" fill="#f3f4f6"/>
    <polyline points="10,45 25,35 40,40 55,25 70,30 85,15" stroke="#3b82f6" stroke-width="2" fill="none"/>
  </svg>`,
};

// ─── LINE CHART ──────────────────────────────────────────────────────────────

const lineChart: WidgetDefinition = {
  type: 'line-chart',
  name: 'Line Chart',
  icon: '📊',
  category: 'chart',
  defaultSize: getDefaultSize('line'),
  supportsSvg: false,
  propSchema: [
    ...chartTitleProps,
    ...chartDisplayProps,
    ...chartAxisProps,
    ...chartStyleProps,
    ...chartTimeWindowProps,
    ...chartDataProps,
    ...chartSeriesProps,
  ],
  bindingSchema: chartBindingSchema,
  actionSchema: chartActionSchema,
  renderer: TimeSeriesChartRenderer,
  previewSvg: `<svg viewBox="0 0 100 60" fill="none">
    <rect x="5" y="5" width="90" height="50" rx="4" fill="#f3f4f6"/>
    <polyline points="10,40 30,30 50,35 70,20 90,25" stroke="#10b981" stroke-width="2" fill="none"/>
  </svg>`,
};

// ─── BAR CHART ───────────────────────────────────────────────────────────────

const barChart: WidgetDefinition = {
  type: 'bar-chart',
  name: 'Bar Chart',
  icon: '📊',
  category: 'chart',
  defaultSize: getDefaultSize('bar'),
  supportsSvg: false,
  propSchema: [
    ...chartTitleProps,
    ...chartDisplayProps,
    ...chartAxisProps,
    ...chartStyleProps,
    ...chartTimeWindowProps,
    ...chartDataProps,
    ...chartSeriesProps,
    ...chartThresholdProps,
  ],
  bindingSchema: chartBindingSchema,
  actionSchema: chartActionSchema,
  renderer: BarChartRenderer,
  previewSvg: `<svg viewBox="0 0 100 60" fill="none">
    <rect x="5" y="5" width="90" height="50" rx="4" fill="#f3f4f6"/>
    <rect x="15" y="30" width="12" height="20" rx="2" fill="#3b82f6"/>
    <rect x="32" y="20" width="12" height="30" rx="2" fill="#3b82f6"/>
    <rect x="49" y="25" width="12" height="25" rx="2" fill="#3b82f6"/>
    <rect x="66" y="15" width="12" height="35" rx="2" fill="#3b82f6"/>
  </svg>`,
};

// ─── BAR CHART WITH LABELS ───────────────────────────────────────────────────

const barChartWithLabels: WidgetDefinition = {
  type: 'bar-chart-labels',
  name: 'Bar Chart with Labels',
  icon: '📊',
  category: 'chart',
  defaultSize: getDefaultSize('bar-with-labels'),
  supportsSvg: false,
  propSchema: [
    { key: 'showLabels', label: 'Show Labels', type: 'boolean', defaultValue: true, group: 'Display' },
    ...chartTitleProps,
    ...chartDisplayProps,
    ...chartAxisProps,
    ...chartStyleProps,
    ...chartTimeWindowProps,
    ...chartDataProps,
    ...chartSeriesProps,
  ],
  bindingSchema: chartBindingSchema,
  actionSchema: chartActionSchema,
  renderer: BarChartRenderer,
  previewSvg: `<svg viewBox="0 0 100 60" fill="none">
    <rect x="5" y="5" width="90" height="50" rx="4" fill="#f3f4f6"/>
    <rect x="15" y="30" width="12" height="20" rx="2" fill="#f59e0b"/>
    <text x="21" y="27" font-size="6" text-anchor="middle" fill="#6b7280">45</text>
    <rect x="32" y="20" width="12" height="30" rx="2" fill="#f59e0b"/>
    <text x="38" y="17" font-size="6" text-anchor="middle" fill="#6b7280">72</text>
  </svg>`,
};

// ─── PIE CHART ───────────────────────────────────────────────────────────────

const pieChartProps: PropField[] = [
  { key: 'chartConfig.pieChart.innerRadius', label: 'Inner Radius', type: 'number', defaultValue: 0, min: 0, max: 100, group: 'Pie' },
  { key: 'chartConfig.pieChart.outerRadius', label: 'Outer Radius', type: 'number', defaultValue: 80, min: 20, max: 100, group: 'Pie' },
  { key: 'chartConfig.pieChart.showLabels', label: 'Show Labels', type: 'boolean', defaultValue: true, group: 'Pie' },
  { key: 'chartConfig.pieChart.labelPosition', label: 'Label Position', type: 'select', defaultValue: 'outside', options: [
    { value: 'outside', label: 'Outside' },
    { value: 'inside', label: 'Inside' },
  ], group: 'Pie' },
  { key: 'chartConfig.pieChart.showPercent', label: 'Show Percent', type: 'boolean', defaultValue: true, group: 'Pie' },
  { key: 'chartConfig.pieChart.showValue', label: 'Show Value', type: 'boolean', defaultValue: false, group: 'Pie' },
];

const pieChart: WidgetDefinition = {
  type: 'pie-chart',
  name: 'Pie Chart',
  icon: '🥧',
  category: 'chart',
  defaultSize: getDefaultSize('pie'),
  supportsSvg: false,
  propSchema: [
    ...chartTitleProps,
    ...chartDisplayProps,
    ...chartStyleProps,
    ...chartDataProps,
    ...chartSeriesProps,
    ...pieChartProps,
  ],
  bindingSchema: [
    { key: 'series[0]', label: 'Slice 1 Value', valueType: 'number' },
    { key: 'series[1]', label: 'Slice 2 Value', valueType: 'number' },
    { key: 'series[2]', label: 'Slice 3 Value', valueType: 'number' },
  ],
  actionSchema: [
    { trigger: 'click', label: 'On Click' },
    { trigger: 'sliceClick', label: 'On Slice Click' },
  ],
  renderer: PieChartRenderer,
  previewSvg: `<svg viewBox="0 0 100 60" fill="none">
    <circle cx="50" cy="30" r="20" fill="#f3f4f6"/>
    <path d="M50 30 L50 10 A20 20 0 0 1 67 20 Z" fill="#3b82f6"/>
    <path d="M50 30 L67 20 A20 20 0 0 1 60 48 Z" fill="#10b981"/>
    <path d="M50 30 L60 48 A20 20 0 1 1 50 10 Z" fill="#f59e0b"/>
  </svg>`,
};

// ─── DOUGHNUT CHART ──────────────────────────────────────────────────────────

const doughnutChartProps: PropField[] = [
  ...pieChartProps,
  { key: 'chartConfig.pieChart.centerText', label: 'Center Text', type: 'string', defaultValue: '', group: 'Pie' },
];

const doughnutChart: WidgetDefinition = {
  type: 'doughnut-chart',
  name: 'Doughnut Chart',
  icon: '🍩',
  category: 'chart',
  defaultSize: getDefaultSize('doughnut'),
  supportsSvg: false,
  propSchema: [
    ...chartTitleProps,
    ...chartDisplayProps,
    ...chartStyleProps,
    ...chartDataProps,
    ...chartSeriesProps,
    ...doughnutChartProps.map(p => 
      p.key === 'chartConfig.pieChart.innerRadius' 
        ? { ...p, defaultValue: 50 } 
        : p
    ),
  ],
  bindingSchema: [
    { key: 'series[0]', label: 'Slice 1 Value', valueType: 'number' },
    { key: 'series[1]', label: 'Slice 2 Value', valueType: 'number' },
    { key: 'series[2]', label: 'Slice 3 Value', valueType: 'number' },
  ],
  actionSchema: [
    { trigger: 'click', label: 'On Click' },
    { trigger: 'sliceClick', label: 'On Slice Click' },
  ],
  renderer: PieChartRenderer,
  previewSvg: `<svg viewBox="0 0 100 60" fill="none">
    <circle cx="50" cy="30" r="20" fill="#f3f4f6"/>
    <circle cx="50" cy="30" r="10" fill="#fff"/>
    <path d="M50 30 L50 10 A20 20 0 0 1 67 20 Z" fill="#3b82f6"/>
    <path d="M50 30 L67 20 A20 20 0 0 1 60 48 Z" fill="#10b981"/>
    <path d="M50 30 L60 48 A20 20 0 1 1 50 10 Z" fill="#f59e0b"/>
    <circle cx="50" cy="30" r="10" fill="#fff"/>
  </svg>`,
};

// ─── VALUE CHART CARD ────────────────────────────────────────────────────────

const valueChartCardProps: PropField[] = [
  { key: 'chartConfig.latestValueCard.showLatestValue', label: 'Show Value', type: 'boolean', defaultValue: true, group: 'Value' },
  { key: 'chartConfig.latestValueCard.latestValueFontSize', label: 'Value Font Size', type: 'number', defaultValue: 32, min: 14, max: 72, group: 'Value' },
  { key: 'chartConfig.latestValueCard.latestValueColor', label: 'Value Color', type: 'color', defaultValue: '#1f2937', group: 'Value' },
  { key: 'chartConfig.latestValueCard.showDelta', label: 'Show Delta', type: 'boolean', defaultValue: true, group: 'Delta' },
  { key: 'chartConfig.latestValueCard.deltaTimeRange', label: 'Delta Time Range (ms)', type: 'number', defaultValue: 60000, min: 1000, group: 'Delta' },
  { key: 'chartConfig.latestValueCard.deltaFormat', label: 'Delta Format', type: 'select', defaultValue: 'percent', options: [
    { value: 'percent', label: 'Percent' },
    { value: 'absolute', label: 'Absolute' },
  ], group: 'Delta' },
  { key: 'chartConfig.latestValueCard.showSparkline', label: 'Show Sparkline', type: 'boolean', defaultValue: true, group: 'Sparkline' },
  { key: 'chartConfig.latestValueCard.sparklineHeight', label: 'Sparkline Height', type: 'number', defaultValue: 40, min: 20, max: 80, group: 'Sparkline' },
  { key: 'chartConfig.latestValueCard.showUnit', label: 'Show Unit', type: 'boolean', defaultValue: true, group: 'Label' },
  { key: 'chartConfig.latestValueCard.showLabel', label: 'Show Label', type: 'boolean', defaultValue: true, group: 'Label' },
];

const valueChartCard: WidgetDefinition = {
  type: 'value-chart-card',
  name: 'Value Chart Card',
  icon: '📋',
  category: 'chart',
  defaultSize: getDefaultSize('value-chart-card'),
  supportsSvg: false,
  propSchema: [
    ...chartStyleProps,
    ...chartTimeWindowProps,
    ...chartDataProps,
    ...chartSeriesProps,
    ...valueChartCardProps,
  ],
  bindingSchema: [
    { key: 'chartConfig.data.series[0].key', label: 'Value Key', valueType: 'number', suggestedKey: 'temperature' },
  ],
  actionSchema: [
    { trigger: 'click', label: 'On Click' },
  ],
  renderer: ValueChartCardRenderer,
  previewSvg: `<svg viewBox="0 0 100 70" fill="none">
    <rect x="5" y="5" width="90" height="60" rx="6" fill="#f3f4f6"/>
    <text x="15" y="22" font-size="8" fill="#6b7280">Temperature</text>
    <text x="15" y="40" font-size="18" font-weight="bold" fill="#1f2937">24.5</text>
    <text x="60" y="40" font-size="8" fill="#9ca3af">°C</text>
    <text x="15" y="52" font-size="7" fill="#22c55e">↑ +2.3%</text>
    <polyline points="15,58 25,55 35,57 45,52 55,54 65,50 75,52 85,48" stroke="#3b82f6" stroke-width="1.5" fill="none"/>
  </svg>`,
};

// ─── ALL CHART DEFINITIONS ───────────────────────────────────────────────────

export const chartDefinitions: WidgetDefinition[] = [
  timeSeriesChart,
  lineChart,
  barChart,
  barChartWithLabels,
  pieChart,
  doughnutChart,
  valueChartCard,
];

// ─── REGISTRATION ────────────────────────────────────────────────────────────

/**
 * Register all chart widgets with the Widget Registry.
 * Call this once at app initialization.
 */
export function registerChartWidgets(): void {
  widgetRegistry.registerAll(chartDefinitions);
  console.log(`[ChartWidgets] Registered ${chartDefinitions.length} chart widgets`);
}

export default chartDefinitions;
