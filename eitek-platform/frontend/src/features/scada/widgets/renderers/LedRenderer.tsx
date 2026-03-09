/**
 * LED Indicator Renderer — Simple on/off indicator light (SVG).
 * Supports custom on/off images for professional HMI panels.
 */

import React from 'react';
import type { WidgetRendererProps } from '../../core/types';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001';
const resolveUrl = (url: string | undefined | null): string => {
  if (!url) return '';
  return url.startsWith('http') || url.startsWith('data:') ? url : `${API_BASE}${url}`;
};

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
  const onImage = resolveUrl(p.onImage as string);
  const offImage = resolveUrl(p.offImage as string);
  const showLabel = (p.showLabel as boolean) ?? true;
  const labelColor = (p.labelColor as string) || '#6B7280';

  const color = state ? onColor : offColor;
  const cx = width / 2;
  const hasLabel = showLabel && !!label;
  const labelH = hasLabel ? 16 : 0;
  const cy = (height - labelH) / 2;
  const r = Math.min(cx, cy) - 4;

  const shouldBlink = isRuntime && state && blinkWhenOn;

  const currentImage = state ? (onImage || offImage) : (offImage || onImage);
  const useImageMode = !!(onImage || offImage);

  // ─── Image Mode ───
  if (useImageMode && currentImage) {
    return (
      <div
        className={alarmState?.active ? 'scada-alarm-blink' : undefined}
        style={{
          width, height,
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          userSelect: 'none',
        }}
      >
        <div style={{
          width, height: height - labelH,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          overflow: 'hidden',
        }}>
          <img src={currentImage} alt={state ? 'on' : 'off'}
            style={{
              width: '100%', height: '100%',
              objectFit: 'contain',
              transition: 'all 0.2s ease',
              ...(shouldBlink ? { animation: 'scada-pulse 1s ease infinite' } : {}),
            }}
            draggable={false}
          />
        </div>
        {hasLabel && (
          <span style={{ fontSize: 10, color: labelColor, fontFamily: 'Arial, sans-serif' }}>{label}</span>
        )}
      </div>
    );
  }

  // ─── SVG Mode ───
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

      {hasLabel && (
        <text x={cx} y={height - 3} textAnchor="middle" fontSize={10} fill={labelColor} fontFamily="Arial, sans-serif">
          {label}
        </text>
      )}
    </svg>
  );
};
