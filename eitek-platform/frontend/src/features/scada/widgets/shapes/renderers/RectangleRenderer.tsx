/**
 * Rectangle Shape Renderer
 *
 * Renders rectangle and rounded rectangle shapes.
 * Supports fill, stroke, shadow, and corner radius.
 */

import React, { memo, useMemo } from 'react';
import type { WidgetRendererProps } from '../../../core/types';
import { STROKE_DASH_ARRAYS, type StrokeStyle } from '../types';

export const RectangleRenderer: React.FC<WidgetRendererProps> = memo(
  ({ properties: p, width, height }) => {
    // Extract style properties with defaults
    const fillColor = (p.fillColor as string) || '#ffffff';
    const strokeColor = (p.strokeColor as string) || '#1f2937';
    const strokeWidth = (p.strokeWidth as number) ?? 2;
    const strokeStyle = (p.strokeStyle as StrokeStyle) || 'solid';
    const opacity = (p.opacity as number) ?? 1;
    const cornerRadius = (p.cornerRadius as number) ?? 0;

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

    // Calculate stroke offset to keep shape within bounds
    const offset = strokeWidth / 2;

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

        <rect
          x={offset}
          y={offset}
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
      </svg>
    );
  },
);

RectangleRenderer.displayName = 'RectangleRenderer';
