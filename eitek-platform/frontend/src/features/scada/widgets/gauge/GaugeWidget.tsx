/**
 * Gauge Widget Component
 *
 * SVG-based gauge renderer supporting radial, semicircle, arc, and linear variants.
 * Designed to match the Flutter implementation for cross-platform consistency.
 */

import React, { useMemo } from 'react';
import type { GaugeConfig, GaugeThreshold } from './types';
import type { WidgetRendererProps } from '../../core/types';
import {
  normalizeGaugeConfig,
  getColorForValue,
  calculateFraction,
  valueToAngle,
} from './defaults';

// ────────────────────────────────────────────────────────────────────────────────
// SVG Geometry Helpers
// ────────────────────────────────────────────────────────────────────────────────

/** Convert degrees to radians */
function degToRad(deg: number): number {
  return (deg * Math.PI) / 180;
}

/** Convert polar coordinates to cartesian */
function polarToCartesian(
  cx: number,
  cy: number,
  radius: number,
  angleInDegrees: number
): { x: number; y: number } {
  const rad = degToRad(angleInDegrees);
  return {
    x: cx + radius * Math.cos(rad),
    y: cy + radius * Math.sin(rad),
  };
}

/** Generate SVG arc path */
function describeArc(
  cx: number,
  cy: number,
  radius: number,
  startAngle: number,
  endAngle: number
): string {
  // Normalize angles
  const start = startAngle;
  const end = endAngle;
  const sweep = end - start;

  if (Math.abs(sweep) >= 360) {
    // Full circle - need two arcs
    const mid = start + 180;
    const p1 = polarToCartesian(cx, cy, radius, start);
    const p2 = polarToCartesian(cx, cy, radius, mid);
    const p3 = polarToCartesian(cx, cy, radius, end);
    return `M ${p1.x} ${p1.y} A ${radius} ${radius} 0 0 1 ${p2.x} ${p2.y} A ${radius} ${radius} 0 0 1 ${p3.x} ${p3.y}`;
  }

  const startPoint = polarToCartesian(cx, cy, radius, start);
  const endPoint = polarToCartesian(cx, cy, radius, end);
  const largeArcFlag = Math.abs(sweep) > 180 ? 1 : 0;
  const sweepFlag = sweep > 0 ? 1 : 0;

  return `M ${startPoint.x} ${startPoint.y} A ${radius} ${radius} 0 ${largeArcFlag} ${sweepFlag} ${endPoint.x} ${endPoint.y}`;
}

// ────────────────────────────────────────────────────────────────────────────────
// Radial Gauge Component
// ────────────────────────────────────────────────────────────────────────────────

interface RadialGaugeProps {
  config: GaugeConfig;
  cx: number;
  cy: number;
  radius: number;
}

const RadialGauge: React.FC<RadialGaugeProps> = ({ config, cx, cy, radius }) => {
  const { min, max, value, startAngle, endAngle, thickness, trackColor, thresholdEnabled, thresholds, fillColor, showNeedle, needleColor, needleWidth, showMinMax, textColor, showValue, showUnit, unit, precision } = config;

  const fraction = calculateFraction(value, min, max);
  const valueAngle = valueToAngle(value, min, max, startAngle, endAngle);
  const currentColor = thresholdEnabled
    ? getColorForValue(value, thresholds, fillColor)
    : fillColor;

  // Arc paths
  const trackPath = describeArc(cx, cy, radius, startAngle, endAngle);
  const fillPath = fraction > 0.001
    ? describeArc(cx, cy, radius, startAngle, valueAngle)
    : '';

  // Needle endpoint
  const needleEnd = polarToCartesian(cx, cy, radius - thickness / 2 - 4, valueAngle);

  // Min/Max label positions
  const minPos = polarToCartesian(cx, cy, radius + 16, startAngle);
  const maxPos = polarToCartesian(cx, cy, radius + 16, endAngle);

  return (
    <g className="gauge-radial">
      {/* Background track */}
      <path
        d={trackPath}
        fill="none"
        stroke={trackColor}
        strokeWidth={thickness}
        strokeLinecap="round"
      />

      {/* Value arc */}
      {fillPath && (
        <path
          d={fillPath}
          fill="none"
          stroke={currentColor}
          strokeWidth={thickness}
          strokeLinecap="round"
          style={{ transition: 'stroke-dasharray 0.3s ease' }}
        />
      )}

      {/* Needle */}
      {showNeedle && (
        <g className="gauge-needle" style={{ transition: 'transform 0.3s ease' }}>
          <line
            x1={cx}
            y1={cy}
            x2={needleEnd.x}
            y2={needleEnd.y}
            stroke={needleColor}
            strokeWidth={needleWidth}
            strokeLinecap="round"
          />
          {/* Needle cap */}
          <circle cx={cx} cy={cy} r={needleWidth + 2} fill={needleColor} />
        </g>
      )}

      {/* Min/Max labels */}
      {showMinMax && (
        <>
          <text
            x={minPos.x}
            y={minPos.y}
            textAnchor="middle"
            dominantBaseline="middle"
            fontSize={10}
            fill={textColor}
            fontFamily="Arial, sans-serif"
          >
            {min}
          </text>
          <text
            x={maxPos.x}
            y={maxPos.y}
            textAnchor="middle"
            dominantBaseline="middle"
            fontSize={10}
            fill={textColor}
            fontFamily="Arial, sans-serif"
          >
            {max}
          </text>
        </>
      )}

      {/* Value display */}
      {showValue && (
        <text
          x={cx}
          y={cy + radius * 0.25}
          textAnchor="middle"
          dominantBaseline="middle"
          fontSize={Math.max(14, radius * 0.3)}
          fontWeight={700}
          fill={textColor}
          fontFamily="Arial, sans-serif"
        >
          {value.toFixed(precision)}
          {showUnit && unit && <tspan fontSize="60%" fill={textColor}> {unit}</tspan>}
        </text>
      )}
    </g>
  );
};

// ────────────────────────────────────────────────────────────────────────────────
// Semicircle Gauge Component
// ────────────────────────────────────────────────────────────────────────────────

const SemicircleGauge: React.FC<RadialGaugeProps> = ({ config, cx, cy, radius }) => {
  const { min, max, value, thickness, trackColor, thresholdEnabled, thresholds, fillColor, showNeedle, needleColor, needleWidth, showMinMax, textColor, showValue, showUnit, unit, precision } = config;

  // Fixed angles for semicircle (top half)
  const startAngle = 180;
  const endAngle = 360;

  const fraction = calculateFraction(value, min, max);
  const valueAngle = valueToAngle(value, min, max, startAngle, endAngle);
  const currentColor = thresholdEnabled
    ? getColorForValue(value, thresholds, fillColor)
    : fillColor;

  const trackPath = describeArc(cx, cy, radius, startAngle, endAngle);
  const fillPath = fraction > 0.001
    ? describeArc(cx, cy, radius, startAngle, valueAngle)
    : '';

  const needleEnd = polarToCartesian(cx, cy, radius - thickness / 2 - 4, valueAngle);

  return (
    <g className="gauge-semicircle">
      {/* Background track */}
      <path
        d={trackPath}
        fill="none"
        stroke={trackColor}
        strokeWidth={thickness}
        strokeLinecap="round"
      />

      {/* Value arc */}
      {fillPath && (
        <path
          d={fillPath}
          fill="none"
          stroke={currentColor}
          strokeWidth={thickness}
          strokeLinecap="round"
        />
      )}

      {/* Needle */}
      {showNeedle && (
        <g className="gauge-needle">
          <line
            x1={cx}
            y1={cy}
            x2={needleEnd.x}
            y2={needleEnd.y}
            stroke={needleColor}
            strokeWidth={needleWidth}
            strokeLinecap="round"
          />
          <circle cx={cx} cy={cy} r={needleWidth + 2} fill={needleColor} />
        </g>
      )}

      {/* Min/Max labels */}
      {showMinMax && (
        <>
          <text
            x={cx - radius - 8}
            y={cy + 4}
            textAnchor="end"
            fontSize={10}
            fill={textColor}
            fontFamily="Arial, sans-serif"
          >
            {min}
          </text>
          <text
            x={cx + radius + 8}
            y={cy + 4}
            textAnchor="start"
            fontSize={10}
            fill={textColor}
            fontFamily="Arial, sans-serif"
          >
            {max}
          </text>
        </>
      )}

      {/* Value display */}
      {showValue && (
        <text
          x={cx}
          y={cy - 8}
          textAnchor="middle"
          dominantBaseline="middle"
          fontSize={Math.max(14, radius * 0.35)}
          fontWeight={700}
          fill={textColor}
          fontFamily="Arial, sans-serif"
        >
          {value.toFixed(precision)}
          {showUnit && unit && <tspan fontSize="60%"> {unit}</tspan>}
        </text>
      )}
    </g>
  );
};

// ────────────────────────────────────────────────────────────────────────────────
// Arc Gauge Component
// ────────────────────────────────────────────────────────────────────────────────

const ArcGauge: React.FC<RadialGaugeProps> = ({ config, cx, cy, radius }) => {
  // Arc gauge is similar to radial but typically without needle
  // Uses the configured start/end angles (default 150-390, 240° sweep)
  const { min, max, value, startAngle, endAngle, thickness, trackColor, thresholdEnabled, thresholds, fillColor, showMinMax, textColor, showValue, showUnit, unit, precision } = config;

  const fraction = calculateFraction(value, min, max);
  const valueAngle = valueToAngle(value, min, max, startAngle, endAngle);
  const currentColor = thresholdEnabled
    ? getColorForValue(value, thresholds, fillColor)
    : fillColor;

  const trackPath = describeArc(cx, cy, radius, startAngle, endAngle);
  const fillPath = fraction > 0.001
    ? describeArc(cx, cy, radius, startAngle, valueAngle)
    : '';

  const minPos = polarToCartesian(cx, cy, radius + 18, startAngle);
  const maxPos = polarToCartesian(cx, cy, radius + 18, endAngle);

  return (
    <g className="gauge-arc">
      {/* Background track */}
      <path
        d={trackPath}
        fill="none"
        stroke={trackColor}
        strokeWidth={thickness}
        strokeLinecap="round"
      />

      {/* Value arc */}
      {fillPath && (
        <path
          d={fillPath}
          fill="none"
          stroke={currentColor}
          strokeWidth={thickness}
          strokeLinecap="round"
        />
      )}

      {/* Min/Max labels */}
      {showMinMax && (
        <>
          <text
            x={minPos.x}
            y={minPos.y}
            textAnchor="middle"
            dominantBaseline="middle"
            fontSize={10}
            fill={textColor}
            fontFamily="Arial, sans-serif"
          >
            {min}
          </text>
          <text
            x={maxPos.x}
            y={maxPos.y}
            textAnchor="middle"
            dominantBaseline="middle"
            fontSize={10}
            fill={textColor}
            fontFamily="Arial, sans-serif"
          >
            {max}
          </text>
        </>
      )}

      {/* Value display */}
      {showValue && (
        <text
          x={cx}
          y={cy}
          textAnchor="middle"
          dominantBaseline="middle"
          fontSize={Math.max(16, radius * 0.4)}
          fontWeight={700}
          fill={textColor}
          fontFamily="Arial, sans-serif"
        >
          {value.toFixed(precision)}
          {showUnit && unit && <tspan fontSize="60%"> {unit}</tspan>}
        </text>
      )}
    </g>
  );
};

// ────────────────────────────────────────────────────────────────────────────────
// Linear Gauge Component
// ────────────────────────────────────────────────────────────────────────────────

interface LinearGaugeProps {
  config: GaugeConfig;
  x: number;
  y: number;
  barWidth: number;
}

const LinearGauge: React.FC<LinearGaugeProps> = ({ config, x, y, barWidth }) => {
  const { min, max, value, thickness, trackColor, thresholdEnabled, thresholds, fillColor, showMinMax, textColor, showValue, showUnit, unit, precision } = config;

  const fraction = calculateFraction(value, min, max);
  const fillWidth = barWidth * fraction;
  const currentColor = thresholdEnabled
    ? getColorForValue(value, thresholds, fillColor)
    : fillColor;

  const barHeight = thickness;
  const borderRadius = barHeight / 2;

  return (
    <g className="gauge-linear">
      {/* Background track */}
      <rect
        x={x}
        y={y}
        width={barWidth}
        height={barHeight}
        rx={borderRadius}
        ry={borderRadius}
        fill={trackColor}
      />

      {/* Fill bar */}
      {fillWidth > 0 && (
        <rect
          x={x}
          y={y}
          width={fillWidth}
          height={barHeight}
          rx={borderRadius}
          ry={borderRadius}
          fill={currentColor}
          style={{ transition: 'width 0.3s ease' }}
        />
      )}

      {/* Min/Max labels */}
      {showMinMax && (
        <>
          <text
            x={x}
            y={y - 6}
            textAnchor="start"
            fontSize={10}
            fill={textColor}
            fontFamily="Arial, sans-serif"
          >
            {min}
          </text>
          <text
            x={x + barWidth}
            y={y - 6}
            textAnchor="end"
            fontSize={10}
            fill={textColor}
            fontFamily="Arial, sans-serif"
          >
            {max}
          </text>
        </>
      )}

      {/* Value display */}
      {showValue && (
        <text
          x={x + barWidth / 2}
          y={y + barHeight + 18}
          textAnchor="middle"
          fontSize={14}
          fontWeight={700}
          fill={textColor}
          fontFamily="Arial, sans-serif"
        >
          {value.toFixed(precision)}
          {showUnit && unit && <tspan fontSize="80%"> {unit}</tspan>}
        </text>
      )}
    </g>
  );
};

// ────────────────────────────────────────────────────────────────────────────────
// Main GaugeWidget Component
// ────────────────────────────────────────────────────────────────────────────────

interface GaugeWidgetProps {
  /** Partial or full gauge configuration */
  config: Partial<GaugeConfig>;
  /** Override width */
  width?: number;
  /** Override height */
  height?: number;
  /** Preview value (for editor) */
  previewValue?: number;
}

export const GaugeWidget: React.FC<GaugeWidgetProps> = ({
  config: partialConfig,
  width: overrideWidth,
  height: overrideHeight,
  previewValue,
}) => {
  // Normalize config with defaults
  const config = useMemo(() => {
    const normalized = normalizeGaugeConfig(partialConfig);
    return {
      ...normalized,
      value: previewValue ?? normalized.value,
      width: overrideWidth ?? normalized.width,
      height: overrideHeight ?? normalized.height,
    };
  }, [partialConfig, previewValue, overrideWidth, overrideHeight]);

  const { variant, width, height, backgroundColor, showTitle, title, titleColor } = config;

  // Calculate layout
  const padding = 12;
  const titleHeight = showTitle && title ? 20 : 0;
  const availableWidth = width - padding * 2;
  const availableHeight = height - padding * 2 - titleHeight;

  // Radial gauge dimensions
  const cx = width / 2;
  const cy = variant === 'semicircle'
    ? height - padding - 10
    : height / 2 + titleHeight / 2;
  const radius = Math.min(availableWidth, availableHeight) / 2 - config.thickness / 2 - 8;

  // Linear gauge dimensions
  const linearX = padding;
  const linearY = (height - config.thickness) / 2 + titleHeight / 2;
  const linearWidth = availableWidth;

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      className="scada-gauge-widget"
    >
      {/* Background */}
      {backgroundColor && backgroundColor !== 'transparent' && (
        <rect
          x={0}
          y={0}
          width={width}
          height={height}
          fill={backgroundColor}
          rx={4}
          ry={4}
        />
      )}

      {/* Title */}
      {showTitle && title && (
        <text
          x={cx}
          y={padding + 8}
          textAnchor="middle"
          fontSize={12}
          fontWeight={500}
          fill={titleColor}
          fontFamily="Arial, sans-serif"
        >
          {title}
        </text>
      )}

      {/* Render appropriate gauge variant */}
      {variant === 'radial' && (
        <RadialGauge config={config} cx={cx} cy={cy} radius={radius} />
      )}
      {variant === 'semicircle' && (
        <SemicircleGauge config={config} cx={cx} cy={cy} radius={radius} />
      )}
      {variant === 'arc' && (
        <ArcGauge config={config} cx={cx} cy={cy} radius={radius} />
      )}
      {variant === 'linear' && (
        <LinearGauge config={config} x={linearX} y={linearY} barWidth={linearWidth} />
      )}
    </svg>
  );
};

// ────────────────────────────────────────────────────────────────────────────────
// Widget Renderer (for SCADA integration)
// ────────────────────────────────────────────────────────────────────────────────

/**
 * SCADA Widget Renderer for Gauge
 *
 * Integrates with the widget registry using standard WidgetRendererProps.
 */
export const GaugeWidgetRenderer: React.FC<WidgetRendererProps> = ({
  properties,
  width,
  height,
}) => {
  const config = useMemo(() => {
    // Map flat properties to GaugeConfig structure
    return {
      variant: (properties.variant as GaugeConfig['variant']) || 'radial',
      title: (properties.title as string) || (properties.label as string) || '',
      value: (properties.value as number) ?? 0,
      min: (properties.min as number) ?? 0,
      max: (properties.max as number) ?? 100,
      unit: (properties.unit as string) || '',
      precision: (properties.precision as number) ?? (properties.decimals as number) ?? 0,
      showTitle: (properties.showTitle as boolean) ?? !!properties.label,
      showValue: (properties.showValue as boolean) ?? true,
      showUnit: (properties.showUnit as boolean) ?? true,
      showMinMax: (properties.showMinMax as boolean) ?? true,
      startAngle: (properties.startAngle as number) ?? 135,
      endAngle: (properties.endAngle as number) ?? 405,
      thickness: (properties.thickness as number) ?? 12,
      trackColor: (properties.trackColor as string) || '#E5E7EB',
      fillColor: (properties.fillColor as string) || '#3B82F6',
      backgroundColor: (properties.backgroundColor as string) || 'transparent',
      needleColor: (properties.needleColor as string) || '#374151',
      textColor: (properties.textColor as string) || '#1F2937',
      titleColor: (properties.titleColor as string) || '#6B7280',
      thresholdEnabled: (properties.thresholdEnabled as boolean) ?? true,
      thresholds: (properties.thresholds as GaugeThreshold[]) ||
        (properties.ranges as Array<{ from?: number; value?: number; to?: number; color: string }>)?.map(r => ({
          value: r.from ?? r.value ?? 0,
          color: r.color,
        })) ||
        [],
      showNeedle: (properties.showNeedle as boolean) ?? true,
      needleWidth: (properties.needleWidth as number) ?? 3,
    };
  }, [properties]);

  return <GaugeWidget config={config} width={width} height={height} />;
};

export default GaugeWidget;
