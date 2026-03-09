/**
 * Switch Widget Renderer — Toggle switch for control actions (SVG).
 */

import React, { useCallback } from 'react';
import type { WidgetRendererProps } from '../../core/types';

export const SwitchRenderer: React.FC<WidgetRendererProps> = ({
  properties: p,
  width,
  height,
  isRuntime,
  alarmState,
  onAction,
}) => {
  const state = Boolean(p.state);
  const label = (p.label as string) || '';
  const onColor = (p.onColor as string) || '#22C55E';
  const offColor = (p.offColor as string) || '#9CA3AF';
  const showLabel = (p.showLabel as boolean) ?? true;
  const disabled = (p.disabled as boolean) ?? false;

  const trackW = Math.min(width * 0.7, 48);
  const trackH = trackW * 0.5;
  const knobR = trackH * 0.4;
  const cx = width / 2;
  const labelH = showLabel && label ? 16 : 0;
  const cy = (height - labelH) / 2;

  const handleClick = useCallback(() => {
    if (!isRuntime || disabled) return;
    const newState = !state;
    onAction?.('toggle', { value: newState });
    // Fire specific turnOn / turnOff trigger
    if (newState) {
      onAction?.('turnOn', { value: true });
    } else {
      onAction?.('turnOff', { value: false });
    }
  }, [isRuntime, disabled, state, onAction]);

  const trackColor = state ? onColor : offColor;
  const knobX = state ? cx + trackW / 2 - knobR - 3 : cx - trackW / 2 + knobR + 3;

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      onClick={handleClick}
      style={{ cursor: isRuntime && !disabled ? 'pointer' : 'default' }}
      className={alarmState?.active ? 'scada-alarm-blink' : undefined}
    >
      {/* Track */}
      <rect
        x={cx - trackW / 2}
        y={cy - trackH / 2}
        width={trackW}
        height={trackH}
        rx={trackH / 2}
        fill={trackColor}
        opacity={disabled ? 0.5 : 1}
      />

      {/* Knob */}
      <circle
        cx={knobX}
        cy={cy}
        r={knobR}
        fill="#fff"
        stroke="#e5e7eb"
        strokeWidth={1}
        style={{ transition: 'cx 0.2s ease' }}
      />

      {/* Label */}
      {showLabel && label && (
        <text x={cx} y={height - 3} textAnchor="middle" fontSize={10} fill="#6B7280" fontFamily="Arial, sans-serif">
          {label}
        </text>
      )}
    </svg>
  );
};
