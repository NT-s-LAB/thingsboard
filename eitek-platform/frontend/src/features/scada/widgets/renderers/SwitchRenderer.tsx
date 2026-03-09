/**
 * Switch Widget Renderer — Toggle switch for control actions.
 *
 * Auto-detects rendering mode:
 *  - If onImage or offImage is set → renders the appropriate image
 *  - Otherwise → classic SVG track + knob toggle
 *
 * Images scale to fill the widget when resized.
 * Fires actionSchema triggers: toggle, turnOn, turnOff.
 */

import React, { useCallback } from 'react';
import type { WidgetRendererProps } from '../../core/types';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001';
const resolveUrl = (url: string | undefined | null): string => {
  if (!url) return '';
  return url.startsWith('http') ? url : `${API_BASE}${url}`;
};

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
  const onImage = resolveUrl(p.onImage as string);
  const offImage = resolveUrl(p.offImage as string);
  const labelPosition = (p.labelPosition as string) || 'bottom';
  const labelColor = (p.labelColor as string) || '#6B7280';
  const labelSize = Number(p.labelSize) || 11;
  const confirmRequired = (p.confirmRequired as boolean) ?? false;
  const confirmMessage = (p.confirmMessage as string) || 'Are you sure?';

  // Auto-detect: if any custom image is set, use image mode
  const useImageMode = !!(onImage || offImage);

  const doToggle = useCallback(() => {
    const newState = !state;
    onAction?.('toggle', { value: newState });
    if (newState) {
      onAction?.('turnOn', { value: true });
    } else {
      onAction?.('turnOff', { value: false });
    }
  }, [state, onAction]);

  const handleClick = useCallback(() => {
    if (!isRuntime || disabled) return;
    if (confirmRequired) {
      // eslint-disable-next-line no-restricted-globals
      if (confirm(confirmMessage)) {
        doToggle();
      }
    } else {
      doToggle();
    }
  }, [isRuntime, disabled, confirmRequired, confirmMessage, doToggle]);

  const hasLabel = showLabel && !!label;
  const alarmClass = alarmState?.active ? 'scada-alarm-blink' : undefined;

  // ─── Image Mode (auto when onImage or offImage is set) ─────────────────
  if (useImageMode) {
    const imgSrc = state ? (onImage || offImage) : (offImage || onImage);

    // Calculate label space
    const isVerticalLabel = labelPosition === 'top' || labelPosition === 'bottom';
    const isHorizontalLabel = labelPosition === 'left' || labelPosition === 'right';
    const labelSpace = hasLabel ? (isVerticalLabel ? labelSize + 6 : 0) : 0;
    const labelSpaceH = hasLabel ? (isHorizontalLabel ? 40 : 0) : 0;

    // Image fills available area
    const imgAreaW = width - labelSpaceH;
    const imgAreaH = height - labelSpace;

    return (
      <div
        onClick={handleClick}
        className={alarmClass}
        style={{
          width, height,
          position: 'relative',
          cursor: isRuntime && !disabled ? 'pointer' : 'default',
          opacity: disabled ? 0.5 : 1,
          userSelect: 'none',
          display: 'flex',
          flexDirection: isHorizontalLabel
            ? (labelPosition === 'left' ? 'row-reverse' : 'row')
            : (labelPosition === 'top' ? 'column-reverse' : 'column'),
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {/* Image area — fills the widget */}
        <div style={{
          width: imgAreaW,
          height: imgAreaH,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
          overflow: 'hidden',
        }}>
          {imgSrc ? (
            <img
              src={imgSrc}
              alt={state ? 'ON' : 'OFF'}
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'contain',
                transition: 'all 0.15s ease',
                filter: disabled ? 'grayscale(0.6)' : 'none',
              }}
              draggable={false}
            />
          ) : (
            /* Fallback color circle if no image for this state */
            <div style={{
              width: '50%', height: '50%', borderRadius: '50%',
              background: state ? onColor : offColor,
              transition: 'background 0.2s ease',
              border: '2px solid #e5e7eb',
            }} />
          )}
        </div>

        {/* Label */}
        {hasLabel && (
          <span style={{
            fontSize: labelSize,
            color: labelColor,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            maxWidth: isHorizontalLabel ? 40 : width,
            textAlign: 'center',
            fontFamily: 'Arial, sans-serif',
            lineHeight: 1,
            flexShrink: 0,
          }}>
            {label}
          </span>
        )}
      </div>
    );
  }

  // ─── Classic Toggle Mode (SVG) ─────────────────────────────────────────
  const trackW = Math.min(width * 0.7, 48);
  const trackH = trackW * 0.5;
  const knobR = trackH * 0.4;
  const cx = width / 2;
  const labelH = hasLabel && (labelPosition === 'top' || labelPosition === 'bottom') ? labelSize + 4 : 0;
  const cy = labelPosition === 'top'
    ? labelH + (height - labelH) / 2
    : (height - labelH) / 2;

  const trackColor = state ? onColor : offColor;
  const knobX = state ? cx + trackW / 2 - knobR - 3 : cx - trackW / 2 + knobR + 3;

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      onClick={handleClick}
      style={{ cursor: isRuntime && !disabled ? 'pointer' : 'default' }}
      className={alarmClass}
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
        style={{ transition: 'fill 0.2s ease' }}
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

      {/* State indicator text inside track */}
      <text
        x={state ? cx - trackW / 2 + knobR + 6 : cx + trackW / 2 - knobR - 6}
        y={cy + 3}
        textAnchor="middle"
        fontSize={8}
        fill="#fff"
        fontFamily="Arial, sans-serif"
        fontWeight={600}
        opacity={0.9}
      >
        {state ? 'ON' : 'OFF'}
      </text>

      {/* Label */}
      {hasLabel && (
        <text
          x={cx}
          y={labelPosition === 'top' ? labelSize : height - 3}
          textAnchor="middle"
          fontSize={labelSize}
          fill={labelColor}
          fontFamily="Arial, sans-serif"
        >
          {label}
        </text>
      )}
    </svg>
  );
};
