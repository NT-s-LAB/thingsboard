/**
 * Pipe Widget Renderer — Horizontal/vertical pipe segment with flow animation (SVG).
 */

import React from 'react';
import type { WidgetRendererProps } from '../../core/types';

export const PipeRenderer: React.FC<WidgetRendererProps> = ({
  properties: p,
  width,
  height,
  isRuntime,
  alarmState,
}) => {
  const orientation = (p.orientation as string) || 'horizontal';
  const flowActive = (p.flowActive as boolean) ?? false;
  const pipeColor = (p.pipeColor as string) || '#94A3B8';
  const flowColor = (p.flowColor as string) || '#3B82F6';
  const pipeWidth = (p.pipeWidth as number) ?? 12;
  const endCaps = (p.endCaps as boolean) ?? true;
  const label = (p.label as string) || '';

  const isH = orientation === 'horizontal';
  const cx = width / 2;
  const cy = height / 2;

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      className={alarmState?.active ? 'scada-alarm-blink' : undefined}
    >
      <defs>
        {flowActive && isRuntime && (
          <pattern
            id="pipe-flow-pattern"
            width={isH ? 20 : pipeWidth}
            height={isH ? pipeWidth : 20}
            patternUnits="userSpaceOnUse"
          >
            {isH ? (
              <>
                <rect width={20} height={pipeWidth} fill={pipeColor} />
                <rect width={6} height={pipeWidth} fill={flowColor} opacity={0.5}>
                  <animate
                    attributeName="x"
                    from="-6"
                    to="20"
                    dur="0.8s"
                    repeatCount="indefinite"
                  />
                </rect>
              </>
            ) : (
              <>
                <rect width={pipeWidth} height={20} fill={pipeColor} />
                <rect width={pipeWidth} height={6} fill={flowColor} opacity={0.5}>
                  <animate
                    attributeName="y"
                    from="-6"
                    to="20"
                    dur="0.8s"
                    repeatCount="indefinite"
                  />
                </rect>
              </>
            )}
          </pattern>
        )}
      </defs>

      {/* Pipe body */}
      {isH ? (
        <rect
          x={0}
          y={cy - pipeWidth / 2}
          width={width}
          height={pipeWidth}
          rx={2}
          fill={flowActive && isRuntime ? 'url(#pipe-flow-pattern)' : pipeColor}
          stroke="#64748B"
          strokeWidth={1}
        />
      ) : (
        <rect
          x={cx - pipeWidth / 2}
          y={0}
          width={pipeWidth}
          height={height}
          rx={2}
          fill={flowActive && isRuntime ? 'url(#pipe-flow-pattern)' : pipeColor}
          stroke="#64748B"
          strokeWidth={1}
        />
      )}

      {/* End caps */}
      {endCaps && isH && (
        <>
          <rect x={0} y={cy - pipeWidth / 2 - 2} width={4} height={pipeWidth + 4} rx={1} fill="#475569" />
          <rect x={width - 4} y={cy - pipeWidth / 2 - 2} width={4} height={pipeWidth + 4} rx={1} fill="#475569" />
        </>
      )}
      {endCaps && !isH && (
        <>
          <rect x={cx - pipeWidth / 2 - 2} y={0} width={pipeWidth + 4} height={4} rx={1} fill="#475569" />
          <rect x={cx - pipeWidth / 2 - 2} y={height - 4} width={pipeWidth + 4} height={4} rx={1} fill="#475569" />
        </>
      )}

      {/* Label */}
      {label && (
        <text x={cx} y={isH ? cy - pipeWidth / 2 - 4 : cy} textAnchor="middle" fontSize={9} fill="#6B7280" fontFamily="Arial, sans-serif">
          {label}
        </text>
      )}
    </svg>
  );
};
