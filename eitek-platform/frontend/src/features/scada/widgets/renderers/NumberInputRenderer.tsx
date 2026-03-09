/**
 * Number Input Widget Renderer — Numeric input field for setpoint control.
 * Displays current value with +/- buttons for adjustment.
 */

import React, { useCallback } from 'react';
import type { WidgetRendererProps } from '../../core/types';

export const NumberInputRenderer: React.FC<WidgetRendererProps> = ({
  properties: p,
  width,
  height,
  isRuntime,
  alarmState,
  onAction,
}) => {
  const value = (p.value as number) ?? 0;
  const min = (p.min as number) ?? 0;
  const max = (p.max as number) ?? 100;
  const step = (p.step as number) ?? 1;
  const label = (p.label as string) || '';
  const unit = (p.unit as string) || '';
  const decimals = (p.decimals as number) ?? 1;
  const disabled = (p.disabled as boolean) ?? false;
  const bgColor = (p.bgColor as string) || '#FFFFFF';
  const textColor = (p.textColor as string) || '#1F2937';
  const accentColor = (p.accentColor as string) || '#3B82F6';

  const handleIncrement = useCallback(() => {
    if (!isRuntime || disabled) return;
    const newVal = Math.min(max, value + step);
    onAction?.('change', { value: newVal });
  }, [isRuntime, disabled, value, step, max, onAction]);

  const handleDecrement = useCallback(() => {
    if (!isRuntime || disabled) return;
    const newVal = Math.max(min, value - step);
    onAction?.('change', { value: newVal });
  }, [isRuntime, disabled, value, step, min, onAction]);

  const btnW = Math.min(28, width * 0.2);
  const cx = width / 2;
  const labelH = label ? 16 : 0;
  const bodyH = height - labelH;
  const bodyY = 0;

  return (
    <svg
      width={width} height={height}
      viewBox={`0 0 ${width} ${height}`}
      style={{ cursor: isRuntime && !disabled ? 'default' : 'not-allowed' }}
      className={alarmState?.active ? 'scada-alarm-blink' : undefined}
    >
      {/* Background */}
      <rect x={1} y={bodyY + 1} width={width - 2} height={bodyH - 2} rx={6}
        fill={bgColor} stroke="#E5E7EB" strokeWidth={1} />

      {/* Minus button */}
      <g onClick={handleDecrement} style={{ cursor: isRuntime && !disabled ? 'pointer' : 'default' }}>
        <rect x={2} y={bodyY + 2} width={btnW} height={bodyH - 4} rx={5}
          fill={isRuntime && !disabled ? accentColor : '#D1D5DB'} opacity={0.9} />
        <text x={2 + btnW / 2} y={bodyY + bodyH / 2 + 1} textAnchor="middle" dominantBaseline="central"
          fontSize={16} fontWeight={700} fill="#fff" fontFamily="Arial, sans-serif">−</text>
      </g>

      {/* Plus button */}
      <g onClick={handleIncrement} style={{ cursor: isRuntime && !disabled ? 'pointer' : 'default' }}>
        <rect x={width - btnW - 2} y={bodyY + 2} width={btnW} height={bodyH - 4} rx={5}
          fill={isRuntime && !disabled ? accentColor : '#D1D5DB'} opacity={0.9} />
        <text x={width - btnW / 2 - 2} y={bodyY + bodyH / 2 + 1} textAnchor="middle" dominantBaseline="central"
          fontSize={16} fontWeight={700} fill="#fff" fontFamily="Arial, sans-serif">+</text>
      </g>

      {/* Value display */}
      <text x={cx} y={bodyY + bodyH / 2 + 1} textAnchor="middle" dominantBaseline="central"
        fontSize={Math.max(12, Math.min(bodyH * 0.4, 24))} fontWeight={700}
        fill={disabled ? '#9CA3AF' : textColor} fontFamily="Arial, sans-serif">
        {value.toFixed(decimals)}{unit ? ` ${unit}` : ''}
      </text>

      {/* Label */}
      {label && (
        <text x={cx} y={height - 3} textAnchor="middle" fontSize={10} fill="#6B7280" fontFamily="Arial, sans-serif">
          {label}
        </text>
      )}
    </svg>
  );
};
