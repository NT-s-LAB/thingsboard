/**
 * Status Indicator Renderer — Multi-state indicator with configurable states (SVG).
 */

import React from 'react';
import type { WidgetRendererProps } from '../../core/types';

export const IndicatorRenderer: React.FC<WidgetRendererProps> = ({
  properties: p,
  width,
  height,
  alarmState,
}) => {
  const value = p.value as string | number;
  const label = (p.label as string) || '';
  const shape = (p.shape as string) || 'circle'; // circle | rectangle | diamond
  const showValue = (p.showValue as boolean) ?? true;

  // State map: e.g. [{ value: "running", color: "#22C55E", label: "Running" }, ...]
  const states = (p.states as Array<{ value: string; color: string; label?: string }>) || [];

  const strVal = String(value ?? '');
  const matched = states.find((s) => String(s.value) === strVal);
  const color = matched?.color || '#9CA3AF';
  const stateLabel = matched?.label || strVal;

  const cx = width / 2;
  const labelH = label ? 16 : 0;
  const valueH = showValue ? 14 : 0;
  const cy = (height - labelH - valueH) / 2;
  const r = Math.min(cx, cy) - 6;

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      className={alarmState?.active ? 'scada-alarm-blink' : undefined}
    >
      {shape === 'circle' && (
        <circle cx={cx} cy={cy} r={r} fill={color} stroke={color} strokeWidth={1.5} opacity={0.9} />
      )}
      {shape === 'rectangle' && (
        <rect x={cx - r} y={cy - r * 0.7} width={r * 2} height={r * 1.4} rx={3} fill={color} opacity={0.9} />
      )}
      {shape === 'diamond' && (
        <polygon
          points={`${cx},${cy - r} ${cx + r},${cy} ${cx},${cy + r} ${cx - r},${cy}`}
          fill={color}
          opacity={0.9}
        />
      )}

      {/* State label */}
      {showValue && (
        <text x={cx} y={height - labelH - 4} textAnchor="middle" fontSize={10} fontWeight={600} fill="#374151" fontFamily="Arial, sans-serif">
          {stateLabel}
        </text>
      )}

      {/* Widget label */}
      {label && (
        <text x={cx} y={height - 3} textAnchor="middle" fontSize={10} fill="#6B7280" fontFamily="Arial, sans-serif">
          {label}
        </text>
      )}
    </svg>
  );
};
