/**
 * Line Shape Renderer
 *
 * Renders a line from corner to corner with optional arrow heads.
 */

import React, { memo, useMemo } from 'react';
import type { WidgetRendererProps } from '../../../core/types';
import { STROKE_DASH_ARRAYS, type StrokeStyle, type LineCap } from '../types';

export const LineRenderer: React.FC<WidgetRendererProps> = memo(
  ({ properties: p, width, height }) => {
    // Extract style properties with defaults
    const strokeColor = (p.strokeColor as string) || '#1f2937';
    const strokeWidth = (p.strokeWidth as number) ?? 2;
    const strokeStyle = (p.strokeStyle as StrokeStyle) || 'solid';
    const opacity = (p.opacity as number) ?? 1;
    const lineCap = (p.lineCap as LineCap) || 'round';
    const arrowStart = (p.arrowStart as boolean) ?? false;
    const arrowEnd = (p.arrowEnd as boolean) ?? false;
    const arrowSize = (p.arrowSize as number) ?? 1;

    // Shadow properties
    const shadow = (p.shadow as boolean) ?? false;
    const shadowColor = (p.shadowColor as string) || 'rgba(0,0,0,0.25)';
    const shadowBlur = (p.shadowBlur as number) ?? 4;
    const shadowOffsetX = (p.shadowOffsetX as number) ?? 2;
    const shadowOffsetY = (p.shadowOffsetY as number) ?? 2;

    // Generate unique IDs
    const ids = useMemo(() => ({
      filter: `shadow-${Math.random().toString(36).substring(2, 9)}`,
      markerStart: `arrow-start-${Math.random().toString(36).substring(2, 9)}`,
      markerEnd: `arrow-end-${Math.random().toString(36).substring(2, 9)}`,
    }), []);

    // Line endpoints with padding for stroke
    const padding = strokeWidth + (arrowEnd || arrowStart ? 10 * arrowSize : 0);
    const x1 = padding;
    const y1 = height / 2;
    const x2 = width - padding;
    const y2 = height / 2;

    // Arrow marker size
    const markerSize = 8 * arrowSize;

    return (
      <svg
        width={width}
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        style={{ opacity }}
      >
        <defs>
          {shadow && (
            <filter
              id={ids.filter}
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
          )}

          {arrowStart && (
            <marker
              id={ids.markerStart}
              markerWidth={markerSize}
              markerHeight={markerSize}
              refX={markerSize}
              refY={markerSize / 2}
              orient="auto-start-reverse"
            >
              <path
                d={`M ${markerSize} 0 L 0 ${markerSize / 2} L ${markerSize} ${markerSize} Z`}
                fill={strokeColor}
              />
            </marker>
          )}

          {arrowEnd && (
            <marker
              id={ids.markerEnd}
              markerWidth={markerSize}
              markerHeight={markerSize}
              refX={0}
              refY={markerSize / 2}
              orient="auto"
            >
              <path
                d={`M 0 0 L ${markerSize} ${markerSize / 2} L 0 ${markerSize} Z`}
                fill={strokeColor}
              />
            </marker>
          )}
        </defs>

        <line
          x1={x1}
          y1={y1}
          x2={x2}
          y2={y2}
          stroke={strokeColor}
          strokeWidth={strokeWidth}
          strokeLinecap={lineCap}
          strokeDasharray={STROKE_DASH_ARRAYS[strokeStyle]}
          markerStart={arrowStart ? `url(#${ids.markerStart})` : undefined}
          markerEnd={arrowEnd ? `url(#${ids.markerEnd})` : undefined}
          filter={shadow ? `url(#${ids.filter})` : undefined}
        />
      </svg>
    );
  },
);

LineRenderer.displayName = 'LineRenderer';
