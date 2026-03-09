/**
 * Tank Widget Renderer
 *
 * SVG-based tank with animated fill level.
 */

import React from 'react';
import type { WidgetRendererProps } from '../../core/types';

export const TankRenderer: React.FC<WidgetRendererProps> = ({
  properties: p,
  width,
  height,
  isRuntime,
  alarmState,
}) => {
  const minLevel = (p.minLevel as number) ?? 0;
  const maxLevel = (p.maxLevel as number) ?? 100;
  const level = (p.level as number) ?? 0;
  const label = (p.label as string) || '';
  const unit = (p.unit as string) || '%';
  const showLevel = (p.showLevel as boolean) ?? true;
  const fillColor = (p.fillColor as string) || '#3B82F6';
  const outlineColor = (p.outlineColor as string) || '#6B7280';
  const tankShape = (p.tankShape as string) || 'rectangular';

  const clamped = Math.min(maxLevel, Math.max(minLevel, Number(level)));
  const fraction = (clamped - minLevel) / (maxLevel - minLevel || 1);

  const pad = 6;
  const innerW = width - pad * 2;
  const bodyTop = 28;
  const bodyH = height - bodyTop - pad;
  const fillH = fraction * bodyH;

  // Alarm colour override
  const stroke = alarmState?.active
    ? alarmState.severity === 'CRITICAL'
      ? '#EF4444'
      : '#F59E0B'
    : outlineColor;

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      className={alarmState?.active ? 'scada-alarm-blink' : undefined}
    >
      {/* Label */}
      {label && (
        <text x={width / 2} y={14} textAnchor="middle" fontSize={11} fill="#6B7280" fontFamily="Arial, sans-serif">
          {label}
        </text>
      )}

      {/* Tank body */}
      {tankShape === 'cylindrical' ? (
        <>
          {/* Cylindrical tank */}
          <ellipse cx={width / 2} cy={bodyTop + 8} rx={innerW / 2} ry={8} fill="none" stroke={stroke} strokeWidth={1.5} />
          <rect x={pad} y={bodyTop + 8} width={innerW} height={bodyH - 16} fill="none" stroke={stroke} strokeWidth={1.5} />
          <ellipse cx={width / 2} cy={bodyTop + bodyH - 8} rx={innerW / 2} ry={8} fill="none" stroke={stroke} strokeWidth={1.5} />

          {/* Fill */}
          <clipPath id={`tank-clip-${Math.random()}`}>
            <rect x={pad + 1} y={bodyTop + 8 + (bodyH - 16) * (1 - fraction)} width={innerW - 2} height={(bodyH - 16) * fraction} />
          </clipPath>
          <rect
            x={pad + 1}
            y={bodyTop + 8}
            width={innerW - 2}
            height={bodyH - 16}
            fill={fillColor}
            opacity={0.6}
            style={isRuntime ? { transition: 'y 0.8s ease, height 0.8s ease' } : undefined}
          />
        </>
      ) : (
        <>
          {/* Rectangular tank */}
          <rect
            x={pad}
            y={bodyTop}
            width={innerW}
            height={bodyH}
            rx={4}
            ry={4}
            fill="none"
            stroke={stroke}
            strokeWidth={1.5}
          />

          {/* Fill */}
          <rect
            x={pad + 1}
            y={bodyTop + bodyH - fillH}
            width={innerW - 2}
            height={fillH}
            rx={fraction > 0.99 ? 4 : 0}
            fill={fillColor}
            opacity={0.6}
            style={isRuntime ? { transition: 'y 0.8s ease, height 0.8s ease' } : undefined}
          />

          {/* Scale lines */}
          {[0.25, 0.5, 0.75].map((tick) => (
            <line
              key={tick}
              x1={pad}
              y1={bodyTop + bodyH * (1 - tick)}
              x2={pad + 6}
              y2={bodyTop + bodyH * (1 - tick)}
              stroke="#9CA3AF"
              strokeWidth={1}
            />
          ))}
        </>
      )}

      {/* Level text */}
      {showLevel && (
        <text
          x={width / 2}
          y={bodyTop + bodyH / 2 + 4}
          textAnchor="middle"
          fontSize={Math.max(12, Math.min(width, height) * 0.14)}
          fontWeight={700}
          fill="#1F2937"
          fontFamily="Arial, sans-serif"
        >
          {clamped.toFixed(1)}{unit ? ` ${unit}` : ''}
        </text>
      )}
    </svg>
  );
};
