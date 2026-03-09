/**
 * ProgressBar Widget Renderer — Horizontal or vertical progress bar with thresholds.
 */

import React from 'react';
import type { WidgetRendererProps } from '../../core/types';

export const ProgressBarRenderer: React.FC<WidgetRendererProps> = ({
  properties: p,
  width,
  height,
  isRuntime,
  alarmState,
}) => {
  const min = (p.min as number) ?? 0;
  const max = (p.max as number) ?? 100;
  const value = (p.value as number) ?? 0;
  const label = (p.label as string) || '';
  const unit = (p.unit as string) || '%';
  const showValue = (p.showValue as boolean) ?? true;
  const showMinMax = (p.showMinMax as boolean) ?? false;
  const orientation = (p.orientation as string) || 'horizontal';
  const barColor = (p.barColor as string) || '#3B82F6';
  const trackColor = (p.trackColor as string) || '#E5E7EB';
  const barRadius = (p.barRadius as number) ?? 4;
  const barHeight = (p.barHeight as number) ?? 16;
  const decimals = (p.decimals as number) ?? 1;
  const thresholds = (p.thresholds as Array<{ value: number; color: string }>) || [];

  const clamped = Math.min(max, Math.max(min, Number(value)));
  const fraction = (clamped - min) / (max - min || 1);

  // Get color based on thresholds
  let fillColor = barColor;
  if (thresholds.length > 0) {
    const sorted = [...thresholds].sort((a, b) => b.value - a.value);
    for (const t of sorted) {
      if (clamped >= t.value) { fillColor = t.color; break; }
    }
  }

  const isH = orientation === 'horizontal';
  const cx = width / 2;
  const labelH = label ? 16 : 0;
  const valueH = showValue ? 16 : 0;
  const minMaxH = showMinMax ? 12 : 0;

  if (!isH) {
    // Vertical progress bar
    const barW = Math.min(barHeight, width * 0.5);
    const topPad = valueH + 4;
    const bH = height - topPad - labelH - minMaxH - 8;
    const fillH = bH * fraction;

    return (
      <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}
        className={alarmState?.active ? 'scada-alarm-blink' : undefined}>
        {showValue && (
          <text x={cx} y={14} textAnchor="middle" fontSize={12} fontWeight={700}
            fill="#1F2937" fontFamily="Arial, sans-serif">
            {clamped.toFixed(decimals)}{unit}
          </text>
        )}
        <rect x={cx - barW / 2} y={topPad} width={barW} height={bH}
          rx={barRadius} fill={trackColor} />
        <rect x={cx - barW / 2} y={topPad + bH - fillH} width={barW} height={fillH}
          rx={barRadius} fill={fillColor}
          style={isRuntime ? { transition: 'height 0.5s ease, y 0.5s ease' } : undefined} />
        {showMinMax && (
          <>
            <text x={cx + barW / 2 + 4} y={topPad + 8} textAnchor="start" fontSize={9} fill="#9CA3AF">{max}</text>
            <text x={cx + barW / 2 + 4} y={topPad + bH} textAnchor="start" fontSize={9} fill="#9CA3AF">{min}</text>
          </>
        )}
        {label && (
          <text x={cx} y={height - 3} textAnchor="middle" fontSize={10} fill="#6B7280" fontFamily="Arial, sans-serif">{label}</text>
        )}
      </svg>
    );
  }

  // Horizontal progress bar
  const padX = 8;
  const bW = width - padX * 2;
  const topPad = labelH + 2;
  const barY = topPad + (height - topPad - valueH - minMaxH - 4) / 2;

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}
      className={alarmState?.active ? 'scada-alarm-blink' : undefined}>
      {label && (
        <text x={padX} y={12} textAnchor="start" fontSize={10} fill="#6B7280" fontFamily="Arial, sans-serif">{label}</text>
      )}
      <rect x={padX} y={barY} width={bW} height={barHeight}
        rx={barRadius} fill={trackColor} />
      <rect x={padX} y={barY} width={bW * fraction} height={barHeight}
        rx={barRadius} fill={fillColor}
        style={isRuntime ? { transition: 'width 0.5s ease' } : undefined} />
      {showValue && (
        <text x={cx} y={barY + barHeight + 14} textAnchor="middle" fontSize={11} fontWeight={600}
          fill="#1F2937" fontFamily="Arial, sans-serif">
          {clamped.toFixed(decimals)}{unit ? ` ${unit}` : ''}
        </text>
      )}
      {showMinMax && (
        <>
          <text x={padX} y={barY + barHeight + (showValue ? 26 : 14)} textAnchor="start" fontSize={9} fill="#9CA3AF">{min}</text>
          <text x={padX + bW} y={barY + barHeight + (showValue ? 26 : 14)} textAnchor="end" fontSize={9} fill="#9CA3AF">{max}</text>
        </>
      )}
    </svg>
  );
};
