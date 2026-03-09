/**
 * Motor Widget Renderer — SVG motor symbol with rotation animation.
 */

import React from 'react';
import type { WidgetRendererProps } from '../../core/types';

export const MotorRenderer: React.FC<WidgetRendererProps> = ({
  properties: p,
  width,
  height,
  isRuntime,
  alarmState,
}) => {
  const state = (p.state as string) || 'stopped';
  const rpm = (p.rpm as number) ?? 0;
  const label = (p.label as string) || '';
  const showRPM = (p.showRPM as boolean) ?? true;
  const runningColor = (p.runningColor as string) || '#22C55E';
  const stoppedColor = (p.stoppedColor as string) || '#6B7280';
  const faultColor = (p.faultColor as string) || '#EF4444';

  const isRunning = state === 'running' || state === 'on' || state === '1' || state === 'true';
  const isFault = state === 'fault' || state === 'alarm';
  const color = isFault ? faultColor : isRunning ? runningColor : stoppedColor;
  const cx = width / 2;
  const cy = (height - (label ? 16 : 0)) / 2;
  const r = Math.min(cx, cy) - 4;

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      className={alarmState?.active ? 'scada-alarm-blink' : undefined}
    >
      {/* Motor body circle */}
      <circle cx={cx} cy={cy} r={r} fill="none" stroke={color} strokeWidth={2.5} />

      {/* M letter (motor symbol) */}
      <text x={cx} y={cy + 1} textAnchor="middle" dominantBaseline="central" fontSize={r * 0.9} fontWeight={700} fill={color} fontFamily="Arial, sans-serif">
        M
      </text>

      {/* Shaft */}
      <line x1={cx + r} y1={cy} x2={cx + r + 10} y2={cy} stroke={color} strokeWidth={3} strokeLinecap="round" />

      {/* Rotation indicator */}
      {isRuntime && isRunning && (
        <circle
          cx={cx + r + 10}
          cy={cy}
          r={4}
          fill={color}
          style={{ animation: 'scada-pulse 1s ease infinite' }}
        />
      )}

      {/* RPM text */}
      {showRPM && isRunning && rpm > 0 && (
        <text x={cx} y={cy + r + 14} textAnchor="middle" fontSize={9} fill="#6B7280" fontFamily="Arial, sans-serif">
          {rpm} RPM
        </text>
      )}

      {/* Label */}
      {label && (
        <text x={cx} y={height - 4} textAnchor="middle" fontSize={10} fill="#6B7280" fontFamily="Arial, sans-serif">
          {label}
        </text>
      )}
    </svg>
  );
};
