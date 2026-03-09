/**
 * Slider Widget Renderer — Horizontal/vertical slider for setpoint control (SVG).
 */

import React, { useCallback, useRef } from 'react';
import type { WidgetRendererProps } from '../../core/types';

export const SliderRenderer: React.FC<WidgetRendererProps> = ({
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
  const label = (p.label as string) || '';
  const unit = (p.unit as string) || '';
  const showValue = (p.showValue as boolean) ?? true;
  const orientation = (p.orientation as string) || 'horizontal';
  const trackColor = (p.trackColor as string) || '#E5E7EB';
  const fillColor = (p.fillColor as string) || '#3B82F6';
  const disabled = (p.disabled as boolean) ?? false;

  const svgRef = useRef<SVGSVGElement>(null);
  const range = max - min || 1;
  const ratio = Math.max(0, Math.min(1, (value - min) / range));

  const isHorizontal = orientation === 'horizontal';
  const pad = 16;
  const labelH = label ? 18 : 0;
  const valueH = showValue ? 14 : 0;
  const topOffset = valueH + 4;

  const trackLen = isHorizontal ? width - pad * 2 : height - pad * 2 - labelH - valueH;
  const trackThick = 6;

  const handleDrag = useCallback(
    (e: React.MouseEvent<SVGSVGElement>) => {
      if (!isRuntime || disabled || !svgRef.current) return;
      const rect = svgRef.current.getBoundingClientRect();
      let newRatio: number;
      if (isHorizontal) {
        newRatio = (e.clientX - rect.left - pad) / trackLen;
      } else {
        newRatio = 1 - (e.clientY - rect.top - pad - topOffset) / trackLen;
      }
      newRatio = Math.max(0, Math.min(1, newRatio));
      const newValue = Math.round((min + newRatio * range) * 100) / 100;
      onAction?.('change', { value: newValue });
    },
    [isRuntime, disabled, isHorizontal, trackLen, min, range, onAction, topOffset],
  );

  const cx = width / 2;

  return (
    <svg
      ref={svgRef}
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      onClick={handleDrag}
      style={{ cursor: isRuntime && !disabled ? 'pointer' : 'default' }}
      className={alarmState?.active ? 'scada-alarm-blink' : undefined}
    >
      {/* Value label */}
      {showValue && (
        <text x={cx} y={12} textAnchor="middle" fontSize={11} fontWeight={600} fill="#374151" fontFamily="Arial, sans-serif">
          {value}{unit}
        </text>
      )}

      {isHorizontal ? (
        <>
          {/* Track */}
          <rect
            x={pad}
            y={topOffset + (height - topOffset - labelH) / 2 - trackThick / 2}
            width={trackLen}
            height={trackThick}
            rx={trackThick / 2}
            fill={trackColor}
          />
          {/* Filled */}
          <rect
            x={pad}
            y={topOffset + (height - topOffset - labelH) / 2 - trackThick / 2}
            width={trackLen * ratio}
            height={trackThick}
            rx={trackThick / 2}
            fill={fillColor}
          />
          {/* Thumb */}
          <circle
            cx={pad + trackLen * ratio}
            cy={topOffset + (height - topOffset - labelH) / 2}
            r={8}
            fill="#fff"
            stroke={fillColor}
            strokeWidth={2}
          />
        </>
      ) : (
        <>
          {/* Track */}
          <rect
            x={cx - trackThick / 2}
            y={topOffset + pad}
            width={trackThick}
            height={trackLen}
            rx={trackThick / 2}
            fill={trackColor}
          />
          {/* Filled from bottom */}
          <rect
            x={cx - trackThick / 2}
            y={topOffset + pad + trackLen * (1 - ratio)}
            width={trackThick}
            height={trackLen * ratio}
            rx={trackThick / 2}
            fill={fillColor}
          />
          {/* Thumb */}
          <circle
            cx={cx}
            cy={topOffset + pad + trackLen * (1 - ratio)}
            r={8}
            fill="#fff"
            stroke={fillColor}
            strokeWidth={2}
          />
        </>
      )}

      {/* Label */}
      {label && (
        <text x={cx} y={height - 3} textAnchor="middle" fontSize={10} fill="#6B7280" fontFamily="Arial, sans-serif">
          {label}
        </text>
      )}
    </svg>
  );
};
