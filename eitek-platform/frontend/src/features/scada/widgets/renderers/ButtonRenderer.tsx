/**
 * Button Widget Renderer — Clickable command button (SVG).
 */

import React, { useCallback, useState } from 'react';
import type { WidgetRendererProps } from '../../core/types';

export const ButtonRenderer: React.FC<WidgetRendererProps> = ({
  properties: p,
  width,
  height,
  isRuntime,
  alarmState,
  onAction,
}) => {
  const label = (p.label as string) || 'Button';
  const bgColor = (p.bgColor as string) || '#3B82F6';
  const textColor = (p.textColor as string) || '#FFFFFF';
  const fontSize = (p.fontSize as number) ?? 12;
  const borderRadius = (p.borderRadius as number) ?? 6;
  const disabled = (p.disabled as boolean) ?? false;
  const confirmRequired = (p.confirmRequired as boolean) ?? false;

  const [pressed, setPressed] = useState(false);

  const handleClick = useCallback(() => {
    if (!isRuntime || disabled) return;
    if (confirmRequired) {
      if (!window.confirm(`Confirm action: ${label}?`)) return;
    }
    setPressed(true);
    onAction?.('click', {});
    setTimeout(() => setPressed(false), 200);
  }, [isRuntime, disabled, confirmRequired, label, onAction]);

  const fill = disabled ? '#9CA3AF' : pressed ? adjustBrightness(bgColor, -30) : bgColor;

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      onClick={handleClick}
      style={{ cursor: isRuntime && !disabled ? 'pointer' : 'default' }}
      className={alarmState?.active ? 'scada-alarm-blink' : undefined}
    >
      <rect
        x={1}
        y={1}
        width={width - 2}
        height={height - 2}
        rx={borderRadius}
        fill={fill}
        stroke={adjustBrightness(bgColor, -40)}
        strokeWidth={1}
      />
      <text
        x={width / 2}
        y={height / 2}
        textAnchor="middle"
        dominantBaseline="central"
        fontSize={fontSize}
        fontWeight={600}
        fill={textColor}
        fontFamily="Arial, sans-serif"
      >
        {label}
      </text>
    </svg>
  );
};

/** Simple brightness adjustment for hex colors. */
function adjustBrightness(hex: string, amount: number): string {
  const num = parseInt(hex.replace('#', ''), 16);
  const r = Math.max(0, Math.min(255, ((num >> 16) & 0xff) + amount));
  const g = Math.max(0, Math.min(255, ((num >> 8) & 0xff) + amount));
  const b = Math.max(0, Math.min(255, (num & 0xff) + amount));
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`;
}
