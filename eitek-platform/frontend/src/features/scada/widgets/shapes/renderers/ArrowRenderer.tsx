/**
 * Arrow Shape Renderer
 *
 * Renders a proper arrow shape with customizable head.
 */

import React, { memo, useMemo } from 'react';
import type { WidgetRendererProps } from '../../../core/types';
import { STROKE_DASH_ARRAYS, type StrokeStyle } from '../types';

export const ArrowRenderer: React.FC<WidgetRendererProps> = memo(
  ({ properties: p, width, height }) => {
    // Extract style properties with defaults
    const fillEnabled = (p.fillEnabled as boolean) ?? true;
    const fillColor = (p.fillColor as string) || '#1f2937';
    const strokeColor = (p.strokeColor as string) || '#1f2937';
    const strokeWidth = (p.strokeWidth as number) ?? 2;
    const strokeStyle = (p.strokeStyle as StrokeStyle) || 'solid';
    const opacity = (p.opacity as number) ?? 1;
    const headWidth = (p.headWidth as number) ?? 10;
    const headLength = (p.headLength as number) ?? 15;
    const doubleHeaded = (p.doubleHeaded as boolean) ?? false;

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

    // Calculate arrow geometry
    const cy = height / 2;
    const shaftHeight = Math.max(4, headWidth * 0.4);
    const shaftTop = cy - shaftHeight / 2;
    const shaftBottom = cy + shaftHeight / 2;

    // Build arrow path
    const path = useMemo(() => {
      if (doubleHeaded) {
        // Double-headed arrow
        return `
          M ${headLength} ${cy}
          L 0 ${cy - headWidth}
          L 0 ${shaftTop}
          L ${headLength} ${shaftTop}
          L ${headLength} ${cy - headWidth}
          L 0 ${cy}
          L ${headLength} ${cy + headWidth}
          L ${headLength} ${shaftBottom}
          L ${width - headLength} ${shaftBottom}
          L ${width - headLength} ${cy + headWidth}
          L ${width} ${cy}
          L ${width - headLength} ${cy - headWidth}
          L ${width - headLength} ${shaftTop}
          L ${headLength} ${shaftTop}
          Z
        `;
      }

      // Single-headed arrow (pointing right)
      return `
        M 0 ${shaftTop}
        L ${width - headLength} ${shaftTop}
        L ${width - headLength} ${cy - headWidth}
        L ${width} ${cy}
        L ${width - headLength} ${cy + headWidth}
        L ${width - headLength} ${shaftBottom}
        L 0 ${shaftBottom}
        Z
      `;
    }, [width, height, headWidth, headLength, doubleHeaded, cy, shaftTop, shaftBottom]);

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

        <path
          d={path}
          fill={fillEnabled ? fillColor : 'none'}
          stroke={strokeColor}
          strokeWidth={strokeWidth}
          strokeDasharray={STROKE_DASH_ARRAYS[strokeStyle]}
          strokeLinejoin="round"
          filter={shadow ? `url(#${filterId})` : undefined}
        />
      </svg>
    );
  },
);

ArrowRenderer.displayName = 'ArrowRenderer';
