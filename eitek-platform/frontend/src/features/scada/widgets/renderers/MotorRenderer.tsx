/**
 * Motor Widget Renderer — SVG motor symbol with rotation animation.
 * Supports custom on/off images for professional HMI panels.
 */

import React, { useCallback } from 'react';
import type { WidgetRendererProps } from '../../core/types';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001';
const resolveUrl = (url: string | undefined | null): string => {
  if (!url) return '';
  return url.startsWith('http') || url.startsWith('data:') ? url : `${API_BASE}${url}`;
};

export const MotorRenderer: React.FC<WidgetRendererProps> = ({
  properties: p,
  width,
  height,
  isRuntime,
  alarmState,
  onAction,
}) => {
  const state = (p.state as string) || 'stopped';
  const rpm = (p.rpm as number) ?? 0;
  const label = (p.label as string) || '';
  const showRPM = (p.showRPM as boolean) ?? true;
  const runningColor = (p.runningColor as string) || '#22C55E';
  const stoppedColor = (p.stoppedColor as string) || '#6B7280';
  const faultColor = (p.faultColor as string) || '#EF4444';
  const runningImage = resolveUrl(p.runningImage as string);
  const stoppedImage = resolveUrl(p.stoppedImage as string);
  const faultImage = resolveUrl(p.faultImage as string);
  const showLabel = (p.showLabel as boolean) ?? true;
  const labelColor = (p.labelColor as string) || '#6B7280';
  const showPower = (p.showPower as boolean) ?? false;
  const power = (p.power as number) ?? 0;
  const powerUnit = (p.powerUnit as string) || 'kW';

  const isRunning = state === 'running' || state === 'on' || state === '1' || state === 'true';
  const isFault = state === 'fault' || state === 'alarm';
  const color = isFault ? faultColor : isRunning ? runningColor : stoppedColor;

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
  const labelH = hasLabel ? 16 : 0;
  const rpmH = (showRPM && isRunning && rpm > 0) ? 14 : 0;
  const powerH = showPower ? 14 : 0;
  const bottomH = labelH + rpmH + powerH;

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
          width, height: height - bottomH,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          overflow: 'hidden',
        }}>
          <img src={currentImage} alt={state}
            style={{ width: '100%', height: '100%', objectFit: 'contain', transition: 'all 0.2s ease' }}
            draggable={false}
          />
        </div>
        {showPower && (
          <span style={{ fontSize: 9, color: '#3B82F6', fontFamily: 'monospace', lineHeight: '14px' }}>{power} {powerUnit}</span>
        )}
        {showRPM && isRunning && rpm > 0 && (
          <span style={{ fontSize: 9, color: '#6B7280', fontFamily: 'Arial, sans-serif', lineHeight: '14px' }}>{rpm} RPM</span>
        )}
        {hasLabel && (
          <span style={{ fontSize: 10, color: labelColor, fontFamily: 'Arial, sans-serif', lineHeight: '16px' }}>{label}</span>
        )}
      </div>
    );
  }

  // ─── SVG Mode ───
  const cx = width / 2;
  const cy = (height - (label ? 16 : 0)) / 2;
  const r = Math.min(cx, cy) - 4;

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      className={alarmState?.active ? 'scada-alarm-blink' : undefined}
      onClick={handleClick}
      style={{ cursor: isRuntime ? 'pointer' : 'default' }}
    >
      {/* Motor body circle */}
      <circle cx={cx} cy={cy} r={r} fill="none" stroke={color} strokeWidth={2.5} />

      {/* M letter (motor symbol) */}
      <text x={cx} y={cy + 1} textAnchor="middle" dominantBaseline="central" fontSize={r * 0.9} fontWeight={700} fill={color} fontFamily="Arial, sans-serif">
        M
      </text>

      {/* Shaft */}
      <line x1={cx + r} y1={cy} x2={cx + r + 10} y2={cy} stroke={color} strokeWidth={3} strokeLinecap="round" />

      {/* Rotation indicator */}
      {isRuntime && isRunning && (
        <circle
          cx={cx + r + 10}
          cy={cy}
          r={4}
          fill={color}
          style={{ animation: 'scada-pulse 1s ease infinite' }}
        />
      )}

      {/* RPM text */}
      {showRPM && isRunning && rpm > 0 && (
        <text x={cx} y={cy + r + 14} textAnchor="middle" fontSize={9} fill="#6B7280" fontFamily="Arial, sans-serif">
          {rpm} RPM
        </text>
      )}

      {/* Power text */}
      {showPower && (
        <text x={cx} y={cy + r + (showRPM && isRunning && rpm > 0 ? 26 : 14)} textAnchor="middle" fontSize={9} fill="#3B82F6" fontFamily="monospace">
          {power} {powerUnit}
        </text>
      )}

      {/* Label */}
      {label && (
        <text x={cx} y={height - 4} textAnchor="middle" fontSize={10} fill={labelColor} fontFamily="Arial, sans-serif">
          {label}
        </text>
      )}
    </svg>
  );
};
