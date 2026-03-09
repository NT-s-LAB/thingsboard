/**
 * Pump Widget Renderer — SVG-based pump symbol with animated rotation.
 */

import React from 'react';
import type { WidgetRendererProps } from '../../core/types';

export const PumpRenderer: React.FC<WidgetRendererProps> = ({
  properties: p,
  width,
  height,
  isRuntime,
  alarmState,
}) => {
  const state = (p.state as string) || 'stopped';
  const label = (p.label as string) || '';
  const runningColor = (p.runningColor as string) || '#22C55E';
  const stoppedColor = (p.stoppedColor as string) || '#6B7280';
  const faultColor = (p.faultColor as string) || '#EF4444';

  const isRunning = state === 'running' || state === 'on' || state === '1' || state === 'true';
  const isFault = state === 'fault' || state === 'alarm' || state === 'error';
  const color = isFault ? faultColor : isRunning ? runningColor : stoppedColor;
  const cx = width / 2;
  const cy = (height - (label ? 16 : 0)) / 2;
  const r = Math.min(cx, cy) - 4;

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
      {/* Body circle */}
      <circle
        cx={cx}
        cy={cy}
        r={r}
        fill="none"
        stroke={alarmState?.active ? '#EF4444' : color}
        strokeWidth={2}
        className={alarmState?.active ? 'scada-alarm-blink' : undefined}
      />

      {/* Impeller (triangle) */}
      <g
        transform={`translate(${cx}, ${cy})`}
        style={isRuntime && isRunning ? { animation: 'scada-rotate 1.5s linear infinite' } : undefined}
      >
        <polygon
          points={`0,${-r * 0.6} ${r * 0.5},${r * 0.35} ${-r * 0.5},${r * 0.35}`}
          fill={color}
          opacity={0.7}
        />
      </g>

      {/* Discharge pipe indicator */}
      <line
        x1={cx + r}
        y1={cy}
        x2={width - 2}
        y2={cy}
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
      />

      {/* Status dot */}
      <circle cx={cx + r - 4} cy={cy - r + 4} r={4} fill={color} />

      {/* Label */}
      {label && (
        <text x={cx} y={height - 4} textAnchor="middle" fontSize={10} fill="#6B7280" fontFamily="Arial, sans-serif">
          {label}
        </text>
      )}
    </svg>
  );
};
