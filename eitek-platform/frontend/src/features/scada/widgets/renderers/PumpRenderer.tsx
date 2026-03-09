/**
 * Pump Widget Renderer — SVG-based pump symbol with animated rotation.
 * Supports custom on/off images.
 */

import React, { useCallback } from 'react';
import type { WidgetRendererProps } from '../../core/types';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001';
const resolveUrl = (url: string | undefined | null): string => {
  if (!url) return '';
  return url.startsWith('http') || url.startsWith('data:') ? url : `${API_BASE}${url}`;
};

export const PumpRenderer: React.FC<WidgetRendererProps> = ({
  properties: p,
  width,
  height,
  isRuntime,
  alarmState,
  onAction,
}) => {
  const state = (p.state as string) || 'stopped';
  const label = (p.label as string) || '';
  const runningColor = (p.runningColor as string) || '#22C55E';
  const stoppedColor = (p.stoppedColor as string) || '#6B7280';
  const faultColor = (p.faultColor as string) || '#EF4444';
  const runningImage = resolveUrl(p.runningImage as string);
  const stoppedImage = resolveUrl(p.stoppedImage as string);
  const faultImage = resolveUrl(p.faultImage as string);
  const showLabel = (p.showLabel as boolean) ?? true;
  const labelColor = (p.labelColor as string) || '#6B7280';

  const isRunning = state === 'running' || state === 'on' || state === '1' || state === 'true';
  const isFault = state === 'fault' || state === 'alarm' || state === 'error';
  const color = isFault ? faultColor : isRunning ? runningColor : stoppedColor;

  // Determine image for current state
  const currentImage = isFault ? (faultImage || stoppedImage) : isRunning ? (runningImage || stoppedImage) : (stoppedImage || runningImage);
  const useImageMode = !!(runningImage || stoppedImage || faultImage);

  const handleClick = useCallback(() => {
    if (!isRuntime) return;
    onAction?.('click', { state });
    if (isRunning) {
      onAction?.('stop', { state: 'stopped' });
    } else {
      onAction?.('start', { state: 'running' });
    }
  }, [isRuntime, state, isRunning, onAction]);

  const hasLabel = showLabel && !!label;
  const labelH = hasLabel ? 18 : 0;

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
          <img src={currentImage} alt={state}
            style={{
              width: '100%', height: '100%',
              objectFit: 'contain',
              transition: 'all 0.2s ease',
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
  const cx = width / 2;
  const cy = (height - labelH) / 2;
  const r = Math.min(cx, cy) - 4;

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}
      onClick={handleClick}
      style={{ cursor: isRuntime ? 'pointer' : 'default' }}
    >
      <circle cx={cx} cy={cy} r={r} fill="none"
        stroke={alarmState?.active ? '#EF4444' : color} strokeWidth={2}
        className={alarmState?.active ? 'scada-alarm-blink' : undefined} />
      <g transform={`translate(${cx}, ${cy})`}
        style={isRuntime && isRunning ? { animation: 'scada-rotate 1.5s linear infinite' } : undefined}>
        <polygon points={`0,${-r * 0.6} ${r * 0.5},${r * 0.35} ${-r * 0.5},${r * 0.35}`}
          fill={color} opacity={0.7} />
      </g>
      <line x1={cx + r} y1={cy} x2={width - 2} y2={cy} stroke={color} strokeWidth={2} strokeLinecap="round" />
      <circle cx={cx + r - 4} cy={cy - r + 4} r={4} fill={color} />
      {hasLabel && (
        <text x={cx} y={height - 4} textAnchor="middle" fontSize={10} fill={labelColor} fontFamily="Arial, sans-serif">{label}</text>
      )}
    </svg>
  );
};
