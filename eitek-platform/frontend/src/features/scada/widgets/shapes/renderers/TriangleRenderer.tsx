/**
 * Triangle Shape Renderer
 *
 * Renders a triangle pointing in any direction.
 */

import React, { memo, useMemo } from 'react';
import type { WidgetRendererProps } from '../../../core/types';
import { STROKE_DASH_ARRAYS, type StrokeStyle, calculateTrianglePoints } from '../types';

type Direction = 'up' | 'down' | 'left' | 'right';

export const TriangleRenderer: React.FC<WidgetRendererProps> = memo(
  ({ properties: p, width, height }) => {
    // Extract style properties with defaults
    const fillColor = (p.fillColor as string) || '#ffffff';
    const strokeColor = (p.strokeColor as string) || '#1f2937';
    const strokeWidth = (p.strokeWidth as number) ?? 2;
    const strokeStyle = (p.strokeStyle as StrokeStyle) || 'solid';
    const opacity = (p.opacity as number) ?? 1;
    const direction = (p.direction as Direction) || 'up';

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

    // Calculate triangle points with stroke offset
    const offset = strokeWidth;
    const points = useMemo(() => {
      return calculateTrianglePoints(
        width - offset * 2,
        height - offset * 2,
        direction,
      );
    }, [width, height, direction, offset]);

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

        <g transform={`translate(${offset}, ${offset})`}>
          <polygon
            points={points}
            fill={fillColor}
            stroke={strokeColor}
            strokeWidth={strokeWidth}
            strokeLinejoin="round"
            strokeDasharray={STROKE_DASH_ARRAYS[strokeStyle]}
            filter={shadow ? `url(#${filterId})` : undefined}
          />
        </g>
      </svg>
    );
  },
);

TriangleRenderer.displayName = 'TriangleRenderer';
