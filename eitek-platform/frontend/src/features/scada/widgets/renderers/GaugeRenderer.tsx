/**
 * Gauge Widget Renderer
 *
 * Circular or linear gauge showing a value within a min–max range.
 * SVG-based rendering with gradient arcs and animated needle.
 */

import React from 'react';
import type { WidgetRendererProps } from '../../core/types';

export const GaugeRenderer: React.FC<WidgetRendererProps> = ({
  properties: p,
  width,
  height,
  isRuntime,
  alarmState,
}) => {
  const min = (p.min as number) ?? 0;
  const max = (p.max as number) ?? 100;
  const value = (p.value as number) ?? min;
  const unit = (p.unit as string) || '';
  const label = (p.label as string) || '';
  const showValue = (p.showValue as boolean) ?? true;
  const showMinMax = (p.showMinMax as boolean) ?? true;
  const ranges = (p.ranges as Array<{ from: number; to: number; color: string }>) || [];
  const gaugeType = (p.gaugeType as string) || 'circular';

  const clampedValue = Math.min(max, Math.max(min, Number(value)));
  const fraction = (clampedValue - min) / (max - min || 1);

  if (gaugeType === 'linear') {
    return (
      <div
        style={{
          width,
          height,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          padding: 8,
          fontFamily: 'Arial, sans-serif',
        }}
      >
        {label && <div style={{ fontSize: 11, color: '#6B7280', marginBottom: 4 }}>{label}</div>}
        <div
          style={{
            width: '100%',
            height: 12,
            background: '#E5E7EB',
            borderRadius: 6,
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              width: `${fraction * 100}%`,
              height: '100%',
              background: getColorForValue(clampedValue, ranges) || '#3B82F6',
              borderRadius: 6,
              transition: isRuntime ? 'width 0.5s ease' : undefined,
            }}
          />
        </div>
        {showValue && (
          <div style={{ fontSize: 13, fontWeight: 600, color: '#1F2937', marginTop: 4, textAlign: 'center' }}>
            {clampedValue.toFixed(1)}{unit ? ` ${unit}` : ''}
          </div>
        )}
        {showMinMax && (
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: '#9CA3AF', marginTop: 2 }}>
            <span>{min}</span>
            <span>{max}</span>
          </div>
        )}
      </div>
    );
  }

  // Circular gauge
  const cx = width / 2;
  const cy = height * 0.55;
  const radius = Math.min(width, height) * 0.38;
  const startAngle = -225;
  const endAngle = 45;
  const totalAngle = endAngle - startAngle;
  const needleAngle = startAngle + fraction * totalAngle;

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
      {/* Background arc */}
      <path
        d={describeArc(cx, cy, radius, startAngle, endAngle)}
        fill="none"
        stroke="#E5E7EB"
        strokeWidth={radius * 0.15}
        strokeLinecap="round"
      />

      {/* Range arcs */}
      {ranges.map((range, i) => {
        const fromFrac = Math.max(0, (range.from - min) / (max - min || 1));
        const toFrac = Math.min(1, (range.to - min) / (max - min || 1));
        const from = startAngle + fromFrac * totalAngle;
        const to = startAngle + toFrac * totalAngle;
        return (
          <path
            key={i}
            d={describeArc(cx, cy, radius, from, to)}
            fill="none"
            stroke={range.color}
            strokeWidth={radius * 0.15}
            strokeLinecap="round"
            opacity={0.8}
          />
        );
      })}

      {/* Value arc */}
      {fraction > 0.001 && (
        <path
          d={describeArc(cx, cy, radius, startAngle, needleAngle)}
          fill="none"
          stroke={getColorForValue(clampedValue, ranges) || '#3B82F6'}
          strokeWidth={radius * 0.15}
          strokeLinecap="round"
        />
      )}

      {/* Needle */}
      <line
        x1={cx}
        y1={cy}
        x2={cx + (radius - 8) * Math.cos((needleAngle * Math.PI) / 180)}
        y2={cy + (radius - 8) * Math.sin((needleAngle * Math.PI) / 180)}
        stroke="#374151"
        strokeWidth={2.5}
        strokeLinecap="round"
        style={isRuntime ? { transition: 'x2 0.5s ease, y2 0.5s ease' } : undefined}
      />

      {/* Center dot */}
      <circle cx={cx} cy={cy} r={4} fill="#374151" />

      {/* Value text */}
      {showValue && (
        <text
          x={cx}
          y={cy + radius * 0.45}
          textAnchor="middle"
          fontSize={Math.max(12, radius * 0.35)}
          fontWeight={700}
          fill="#1F2937"
          fontFamily="Arial, sans-serif"
        >
          {clampedValue.toFixed(1)}
          {unit ? ` ${unit}` : ''}
        </text>
      )}

      {/* Label */}
      {label && (
        <text x={cx} y={16} textAnchor="middle" fontSize={11} fill="#6B7280" fontFamily="Arial, sans-serif">
          {label}
        </text>
      )}

      {/* Min/Max */}
      {showMinMax && (
        <>
          <text
            x={cx + (radius + 12) * Math.cos((startAngle * Math.PI) / 180)}
            y={cy + (radius + 12) * Math.sin((startAngle * Math.PI) / 180)}
            textAnchor="middle"
            fontSize={10}
            fill="#9CA3AF"
            fontFamily="Arial, sans-serif"
          >
            {min}
          </text>
          <text
            x={cx + (radius + 12) * Math.cos((endAngle * Math.PI) / 180)}
            y={cy + (radius + 12) * Math.sin((endAngle * Math.PI) / 180)}
            textAnchor="middle"
            fontSize={10}
            fill="#9CA3AF"
            fontFamily="Arial, sans-serif"
          >
            {max}
          </text>
        </>
      )}

      {/* Alarm indicator */}
      {alarmState?.active && (
        <circle cx={width - 10} cy={10} r={6} fill={alarmState.severity === 'CRITICAL' ? '#EF4444' : '#F59E0B'} className="scada-alarm-blink" />
      )}
    </svg>
  );
};

// ── SVG arc helpers ──────────────────────────────────────────────────────────

function polarToCartesian(cx: number, cy: number, r: number, angleDeg: number) {
  const rad = (angleDeg * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

function describeArc(cx: number, cy: number, r: number, startAngle: number, endAngle: number): string {
  const start = polarToCartesian(cx, cy, r, endAngle);
  const end = polarToCartesian(cx, cy, r, startAngle);
  const largeArc = Math.abs(endAngle - startAngle) > 180 ? 1 : 0;
  return `M ${start.x} ${start.y} A ${r} ${r} 0 ${largeArc} 0 ${end.x} ${end.y}`;
}

function getColorForValue(value: number, ranges: Array<{ from: number; to: number; color: string }>): string | null {
  for (const range of ranges) {
    if (value >= range.from && value <= range.to) return range.color;
  }
  return null;
}
