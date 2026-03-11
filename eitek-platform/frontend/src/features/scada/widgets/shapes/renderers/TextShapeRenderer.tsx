/**
 * Text Shape Renderer
 *
 * Renders styled text as a shape widget.
 * Supports multi-line text, alignment, and styling.
 */

import React, { memo, useMemo } from 'react';
import type { WidgetRendererProps } from '../../../core/types';
import { STROKE_DASH_ARRAYS, type StrokeStyle } from '../types';

type TextAlign = 'left' | 'center' | 'right';
type VerticalAlign = 'top' | 'middle' | 'bottom';
type FontWeight = 'normal' | 'bold' | '300' | '500' | '600' | '700';
type TextDecoration = 'none' | 'underline' | 'line-through';

export const TextShapeRenderer: React.FC<WidgetRendererProps> = memo(
  ({ properties: p, width, height }) => {
    // Text properties
    const text = String(p.text ?? 'Text');
    const fontSize = (p.fontSize as number) ?? 16;
    const fontFamily = (p.fontFamily as string) || 'Inter, Arial, sans-serif';
    const fontWeight = (p.fontWeight as FontWeight) || 'normal';
    const textAlign = (p.textAlign as TextAlign) || 'center';
    const verticalAlign = (p.verticalAlign as VerticalAlign) || 'middle';
    const textColor = (p.textColor as string) || '#1f2937';
    const letterSpacing = (p.letterSpacing as number) ?? 0;
    const lineHeight = (p.lineHeight as number) ?? 1.4;
    const textDecoration = (p.textDecoration as TextDecoration) || 'none';

    // Background & border
    const fillColor = (p.fillColor as string) || 'transparent';
    const strokeColor = (p.strokeColor as string) || 'transparent';
    const strokeWidth = (p.strokeWidth as number) ?? 0;
    const strokeStyle = (p.strokeStyle as StrokeStyle) || 'solid';
    const cornerRadius = (p.cornerRadius as number) ?? 0;
    const opacity = (p.opacity as number) ?? 1;
    const padding = (p.padding as number) ?? 8;

    // Shadow properties
    const shadow = (p.shadow as boolean) ?? false;
    const shadowColor = (p.shadowColor as string) || 'rgba(0,0,0,0.25)';
    const shadowBlur = (p.shadowBlur as number) ?? 4;
    const shadowOffsetX = (p.shadowOffsetX as number) ?? 2;
    const shadowOffsetY = (p.shadowOffsetY as number) ?? 2;

    // Generate unique filter ID for shadow
    const filterId = useMemo(
      () => `shadow-${Math.random().toString(36).substring(2, 9)}`,
      [],
    );

    // Calculate text anchor based on alignment
    const textAnchor: 'start' | 'middle' | 'end' =
      textAlign === 'left' ? 'start' : textAlign === 'right' ? 'end' : 'middle';

    // Calculate X position based on alignment
    const textX = 
      textAlign === 'left' ? padding :
      textAlign === 'right' ? width - padding :
      width / 2;

    // Split text into lines for multiline support
    const lines = text.split('\n');
    const lineHeightPx = fontSize * lineHeight;

    // Calculate starting Y for multiple lines
    const totalTextHeight = lines.length * lineHeightPx;
    const startY =
      verticalAlign === 'top' ? padding + fontSize * 0.8 :
      verticalAlign === 'bottom' ? height - padding - totalTextHeight + fontSize * 0.8 :
      height / 2 - totalTextHeight / 2 + fontSize * 0.8;

    return (
      <svg
        width={width}
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        style={{ opacity }}
      >
        {shadow && (
          <defs>
            <filter
              id={filterId}
              x="-50%"
              y="-50%"
              width="200%"
              height="200%"
            >
              <feDropShadow
                dx={shadowOffsetX}
                dy={shadowOffsetY}
                stdDeviation={shadowBlur / 2}
                floodColor={shadowColor}
              />
            </filter>
          </defs>
        )}

        {/* Background rectangle */}
        {(fillColor !== 'transparent' || strokeWidth > 0) && (
          <rect
            x={strokeWidth / 2}
            y={strokeWidth / 2}
            width={width - strokeWidth}
            height={height - strokeWidth}
            rx={cornerRadius}
            ry={cornerRadius}
            fill={fillColor}
            stroke={strokeColor}
            strokeWidth={strokeWidth}
            strokeDasharray={STROKE_DASH_ARRAYS[strokeStyle]}
            filter={shadow ? `url(#${filterId})` : undefined}
          />
        )}

        {/* Text lines */}
        {lines.map((line, index) => (
          <text
            key={index}
            x={textX}
            y={startY + index * lineHeightPx}
            textAnchor={textAnchor}
            fontSize={fontSize}
            fontFamily={fontFamily}
            fontWeight={fontWeight}
            fill={textColor}
            letterSpacing={letterSpacing}
            textDecoration={textDecoration}
          >
            {line}
          </text>
        ))}
      </svg>
    );
  },
);

TextShapeRenderer.displayName = 'TextShapeRenderer';
