/**
 * Valve Widget Renderer — SVG gate/ball/butterfly valve.
 * Supports custom open/closed images for professional HMI panels.
 */

import React, { useCallback } from 'react';
import type { WidgetRendererProps } from '../../core/types';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001';
const resolveUrl = (url: string | undefined | null): string => {
  if (!url) return '';
  return url.startsWith('http') || url.startsWith('data:') ? url : `${API_BASE}${url}`;
};

export const ValveRenderer: React.FC<WidgetRendererProps> = ({
  properties: p,
  width,
  height,
  isRuntime,
  alarmState,
  onAction,
}) => {
  const state = (p.state as string) || 'closed';
  const openPercent = (p.openPercent as number) ?? (state === 'open' || state === '1' || state === 'true' ? 100 : 0);
  const label = (p.label as string) || '';
  const openColor = (p.openColor as string) || '#22C55E';
  const closedColor = (p.closedColor as string) || '#EF4444';
  const openImage = resolveUrl(p.openImage as string);
  const closedImage = resolveUrl(p.closedImage as string);
  const showLabel = (p.showLabel as boolean) ?? true;
  const labelColor = (p.labelColor as string) || '#6B7280';

  const isOpen = openPercent > 0;
  const fraction = Math.min(100, Math.max(0, openPercent)) / 100;
  const color = isOpen ? openColor : closedColor;

  const currentImage = isOpen ? (openImage || closedImage) : (closedImage || openImage);
  const useImageMode = !!(openImage || closedImage);

  const handleClick = useCallback(() => {
    if (!isRuntime) return;
    onAction?.('click', { state, openPercent });
    if (isOpen) {
      onAction?.('close', { state: 'closed', openPercent: 0 });
    } else {
      onAction?.('open', { state: 'open', openPercent: 100 });
    }
  }, [isRuntime, state, isOpen, openPercent, onAction]);

  const hasLabel = showLabel && !!label;
  const labelH = hasLabel ? 16 : 0;

  // ─── Image Mode ───
  if (useImageMode && currentImage) {
    return (
      <div
        onClick={handleClick}
        className={alarmState?.active ? 'scada-alarm-blink' : undefined}
        style={{
          width, height,
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          cursor: isRuntime ? 'pointer' : 'default',
          userSelect: 'none',
        }}
      >
        <div style={{
          width, height: height - labelH,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          overflow: 'hidden',
        }}>
          <img src={currentImage} alt={isOpen ? 'open' : 'closed'}
            style={{ width: '100%', height: '100%', objectFit: 'contain', transition: 'all 0.2s ease' }}
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
  const cx = width / 2;
  const cy = (height - (label ? 16 : 0)) / 2;
  const s = Math.min(width, height - (label ? 16 : 0)) - 8;

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      className={alarmState?.active ? 'scada-alarm-blink' : undefined}
      onClick={handleClick}
      style={{ cursor: isRuntime ? 'pointer' : 'default' }}
    >
      {/* Pipe lines */}
      <line x1={0} y1={cy} x2={cx - s * 0.35} y2={cy} stroke="#9CA3AF" strokeWidth={3} />
      <line x1={cx + s * 0.35} y1={cy} x2={width} y2={cy} stroke="#9CA3AF" strokeWidth={3} />

      {/* Valve body (butterfly / double triangle) */}
      <polygon
        points={`${cx - s * 0.35},${cy - s * 0.3} ${cx},${cy} ${cx - s * 0.35},${cy + s * 0.3}`}
        fill={color}
        opacity={0.7}
        stroke={alarmState?.active ? '#EF4444' : '#374151'}
        strokeWidth={1.5}
      />
      <polygon
        points={`${cx + s * 0.35},${cy - s * 0.3} ${cx},${cy} ${cx + s * 0.35},${cy + s * 0.3}`}
        fill={color}
        opacity={0.7}
        stroke={alarmState?.active ? '#EF4444' : '#374151'}
        strokeWidth={1.5}
      />

      {/* Stem */}
      <line x1={cx} y1={cy - s * 0.35} x2={cx} y2={cy - s * 0.15} stroke="#374151" strokeWidth={2} />

      {/* Handle / actuator */}
      <rect
        x={cx - s * 0.15}
        y={cy - s * 0.45}
        width={s * 0.3}
        height={s * 0.12}
        rx={2}
        fill={color}
        stroke="#374151"
        strokeWidth={1}
        style={
          isRuntime
            ? { transform: `rotate(${(1 - fraction) * 90}deg)`, transformOrigin: `${cx}px ${cy - s * 0.35}px`, transition: 'transform 0.5s ease' }
            : undefined
        }
      />

      {/* Percentage text */}
      {openPercent > 0 && openPercent < 100 && (
        <text x={cx} y={cy + 4} textAnchor="middle" fontSize={10} fontWeight={600} fill="#fff" fontFamily="Arial, sans-serif">
          {Math.round(openPercent)}%
        </text>
      )}

      {/* Status text */}
      <text
        x={cx}
        y={cy + s * 0.45}
        textAnchor="middle"
        fontSize={9}
        fill={color}
        fontWeight={600}
        fontFamily="Arial, sans-serif"
      >
        {isOpen ? 'OPEN' : 'CLOSED'}
      </text>

      {/* Label */}
      {label && (
        <text x={cx} y={height - 4} textAnchor="middle" fontSize={10} fill={labelColor} fontFamily="Arial, sans-serif">
          {label}
        </text>
      )}
    </svg>
  );
};
