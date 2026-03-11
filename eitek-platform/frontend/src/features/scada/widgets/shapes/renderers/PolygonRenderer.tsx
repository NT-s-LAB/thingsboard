/**
 * Polygon Shape Renderer
 *
 * Renders regular polygons (pentagon, hexagon, etc.) and star shapes.
 */

import React, { memo, useMemo } from 'react';
import type { WidgetRendererProps } from '../../../core/types';
import { STROKE_DASH_ARRAYS, type StrokeStyle, calculatePolygonPoints } from '../types';

export const PolygonRenderer: React.FC<WidgetRendererProps> = memo(
  ({ properties: p, width, height }) => {
    // Extract style properties with defaults
    const fillColor = (p.fillColor as string) || '#ffffff';
    const strokeColor = (p.strokeColor as string) || '#1f2937';
    const strokeWidth = (p.strokeWidth as number) ?? 2;
    const strokeStyle = (p.strokeStyle as StrokeStyle) || 'solid';
    const opacity = (p.opacity as number) ?? 1;
    const sides = Math.max(3, Math.min(12, (p.sides as number) || 6));
    const star = (p.star as boolean) ?? false;
    const innerRadiusRatio = (p.innerRadiusRatio as number) ?? 0.5;

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

    // Calculate polygon points
    const cx = width / 2;
    const cy = height / 2;
    const radius = Math.min(width, height) / 2 - strokeWidth;

    const points = useMemo(() => {
      return calculatePolygonPoints(cx, cy, radius, sides, star, innerRadiusRatio);
    }, [cx, cy, radius, sides, star, innerRadiusRatio]);

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

        <polygon
          points={points}
          fill={fillColor}
          stroke={strokeColor}
          strokeWidth={strokeWidth}
          strokeLinejoin="round"
          strokeDasharray={STROKE_DASH_ARRAYS[strokeStyle]}
          filter={shadow ? `url(#${filterId})` : undefined}
        />
      </svg>
    );
  },
);

PolygonRenderer.displayName = 'PolygonRenderer';
