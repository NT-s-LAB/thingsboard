/**
 * Value Display Widget Renderer
 *
 * Displays a single numeric or text value with optional:
 *   • Icon
 *   • Unit / prefix / suffix
 *   • Threshold-based colour
 *   • Trend arrow
 */

import React from 'react';
import type { WidgetRendererProps } from '../../core/types';

export const ValueDisplayRenderer: React.FC<WidgetRendererProps> = ({
  properties: p,
  width,
  height,
  isRuntime,
  alarmState,
}) => {
  const value = p.value as string | number | undefined;
  const label = (p.label as string) || 'Value';
  const icon = p.icon as string | undefined;
  const unit = p.unit as string | undefined;
  const prefix = (p.prefix as string) || '';
  const suffix = (p.suffix as string) || '';
  const decimals = (p.decimals as number) ?? 2;
  const showTrend = p.showTrend as boolean;
  const trendUpColor = (p.trendUpColor as string) || '#22C55E';
  const trendDownColor = (p.trendDownColor as string) || '#EF4444';
  const thresholds = (p.thresholds as Array<{ value: number; color: string }>) || [];

  // Format display value
  const rawVal = value ?? (isRuntime ? '---' : '0');
  const num = Number(rawVal);
  const displayVal = isNaN(num) ? String(rawVal) : num.toFixed(decimals);

  // Threshold colour
  let valueColor = '#1F2937';
  if (!isNaN(num) && thresholds.length > 0) {
    const sorted = [...thresholds].sort((a, b) => b.value - a.value);
    for (const t of sorted) {
      if (num >= t.value) {
        valueColor = t.color;
        break;
      }
    }
  }

  // Alarm flash
  const alarmBorder =
    alarmState?.active && alarmState.severity === 'CRITICAL'
      ? '2px solid #EF4444'
      : alarmState?.active
        ? '2px solid #F59E0B'
        : undefined;

  const fontSize = Math.max(16, height * 0.32);

  return (
    <div
      style={{
        width,
        height,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#F9FAFB',
        border: alarmBorder || '1px solid #E5E7EB',
        borderRadius: 8,
        fontFamily: 'Arial, sans-serif',
        overflow: 'hidden',
        boxShadow: isRuntime ? '0 1px 4px rgba(0,0,0,0.06)' : undefined,
      }}
      className={alarmState?.active ? 'scada-alarm-blink' : undefined}
    >
      {/* Label */}
      <div style={{ fontSize: 11, color: '#6B7280', marginBottom: 2 }}>{label}</div>

      {/* Icon + Value row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
        {icon && <span style={{ fontSize: Math.max(14, height * 0.24) }}>{icon}</span>}
        <span
          style={{
            fontSize,
            fontWeight: 700,
            color: valueColor,
            lineHeight: 1.2,
          }}
        >
          {prefix}
          {displayVal}
          {suffix}
          {unit ? ` ${unit}` : ''}
        </span>
      </div>

      {/* Trend arrow */}
      {showTrend && !isNaN(num) && (
        <div
          style={{
            fontSize: 10,
            color: num > 0 ? trendUpColor : num < 0 ? trendDownColor : '#9CA3AF',
            marginTop: 2,
          }}
        >
          {num > 0 ? '▲' : num < 0 ? '▼' : '●'}
        </div>
      )}
    </div>
  );
};
