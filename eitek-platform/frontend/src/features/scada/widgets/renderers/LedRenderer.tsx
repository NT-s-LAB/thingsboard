/**
 * LED Indicator Renderer — Simple on/off indicator light (SVG).
 */

import React from 'react';
import type { WidgetRendererProps } from '../../core/types';

export const LedRenderer: React.FC<WidgetRendererProps> = ({
  properties: p,
  width,
  height,
  isRuntime,
  alarmState,
}) => {
  const state = Boolean(p.state);
  const label = (p.label as string) || '';
  const onColor = (p.onColor as string) || '#22C55E';
  const offColor = (p.offColor as string) || '#6B7280';
  const shape = (p.shape as string) || 'circle'; // circle | square
  const blinkWhenOn = (p.blinkWhenOn as boolean) ?? false;

  const color = state ? onColor : offColor;
  const cx = width / 2;
  const labelH = label ? 16 : 0;
  const cy = (height - labelH) / 2;
  const r = Math.min(cx, cy) - 4;

  const shouldBlink = isRuntime && state && blinkWhenOn;

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      className={alarmState?.active ? 'scada-alarm-blink' : undefined}
    >
      <defs>
        <radialGradient id={`led-grad-${state ? 'on' : 'off'}`} cx="30%" cy="30%">
          <stop offset="0%" stopColor="#fff" stopOpacity={0.7} />
          <stop offset="100%" stopColor={color} />
        </radialGradient>
      </defs>

      {shape === 'circle' ? (
        <circle
          cx={cx}
          cy={cy}
          r={r}
          fill={`url(#led-grad-${state ? 'on' : 'off'})`}
          stroke={color}
          strokeWidth={1.5}
          opacity={shouldBlink ? undefined : 1}
          style={shouldBlink ? { animation: 'scada-pulse 1s ease infinite' } : undefined}
        />
      ) : (
        <rect
          x={cx - r}
          y={cy - r}
          width={r * 2}
          height={r * 2}
          rx={3}
          fill={`url(#led-grad-${state ? 'on' : 'off'})`}
          stroke={color}
          strokeWidth={1.5}
          opacity={shouldBlink ? undefined : 1}
          style={shouldBlink ? { animation: 'scada-pulse 1s ease infinite' } : undefined}
        />
      )}

      {/* Status glow */}
      {state && (
        <circle cx={cx} cy={cy} r={r + 3} fill="none" stroke={onColor} strokeWidth={1} opacity={0.3} />
      )}

      {label && (
        <text x={cx} y={height - 3} textAnchor="middle" fontSize={10} fill="#6B7280" fontFamily="Arial, sans-serif">
          {label}
        </text>
      )}
    </svg>
  );
};
