/**
 * Text Widget Renderer — Static or dynamic text display (SVG).
 */

import React from 'react';
import type { WidgetRendererProps } from '../../core/types';

export const TextRenderer: React.FC<WidgetRendererProps> = ({
  properties: p,
  width,
  height,
  alarmState,
}) => {
  const text = String(p.text ?? '');
  const fontSize = (p.fontSize as number) ?? 14;
  const fontWeight = (p.fontWeight as string) || 'normal';
  const fontFamily = (p.fontFamily as string) || 'Arial, sans-serif';
  const textColor = (p.textColor as string) || '#1F2937';
  const align = (p.align as string) || 'center';
  const bgColor = (p.bgColor as string) || 'transparent';
  const borderColor = (p.borderColor as string) || 'transparent';
  const borderWidth = (p.borderWidth as number) ?? 0;
  const padding = (p.padding as number) ?? 4;

  let textAnchor: 'start' | 'middle' | 'end';
  let x: number;
  switch (align) {
    case 'left':
      textAnchor = 'start';
      x = padding;
      break;
    case 'right':
      textAnchor = 'end';
      x = width - padding;
      break;
    default:
      textAnchor = 'middle';
      x = width / 2;
  }

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      className={alarmState?.active ? 'scada-alarm-blink' : undefined}
    >
      {(bgColor !== 'transparent' || borderWidth > 0) && (
        <rect
          x={borderWidth / 2}
          y={borderWidth / 2}
          width={width - borderWidth}
          height={height - borderWidth}
          rx={3}
          fill={bgColor}
          stroke={borderColor}
          strokeWidth={borderWidth}
        />
      )}

      <text
        x={x}
        y={height / 2}
        textAnchor={textAnchor}
        dominantBaseline="central"
        fontSize={fontSize}
        fontWeight={fontWeight}
        fontFamily={fontFamily}
        fill={textColor}
      >
        {text}
      </text>
    </svg>
  );
};
