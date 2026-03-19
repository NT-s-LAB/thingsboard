/**
 * Ellipse Shape Renderer
 *
 * Renders an ellipse shape that fills the widget bounds.
 */

import React, { memo, useMemo } from 'react';
import type { WidgetRendererProps } from '../../../core/types';
import { STROKE_DASH_ARRAYS, type StrokeStyle } from '../types';

export const EllipseRenderer: React.FC<WidgetRendererProps> = memo(
  ({ properties: p, width, height }) => {
    // Extract style properties with defaults
    const fillEnabled = (p.fillEnabled as boolean) ?? true;
    const fillColor = (p.fillColor as string) || '#ffffff';
    const strokeColor = (p.strokeColor as string) || '#1f2937';
    const strokeWidth = (p.strokeWidth as number) ?? 2;
    const strokeStyle = (p.strokeStyle as StrokeStyle) || 'solid';
    const opacity = (p.opacity as number) ?? 1;

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

    // Calculate ellipse parameters
    const cx = width / 2;
    const cy = height / 2;
    const rx = (width - strokeWidth) / 2;
    const ry = (height - strokeWidth) / 2;

    return (
      <svg
        width={width}
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        style={{ overflow: 'visible', opacity }}
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

        <ellipse
          cx={cx}
          cy={cy}
          rx={rx}
          ry={ry}
          fill={fillEnabled ? fillColor : 'none'}
          stroke={strokeColor}
          strokeWidth={strokeWidth}
          strokeDasharray={STROKE_DASH_ARRAYS[strokeStyle]}
          filter={shadow ? `url(#${filterId})` : undefined}
        />
      </svg>
    );
  },
);

EllipseRenderer.displayName = 'EllipseRenderer';
