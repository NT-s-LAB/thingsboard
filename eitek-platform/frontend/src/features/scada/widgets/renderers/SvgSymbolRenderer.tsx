/**
 * SVG Symbol Widget Renderer — Renders a user-uploaded SVG symbol.
 * The svgContent is injected via properties (resolved from svgAssetId).
 */

import React, { useMemo } from 'react';
import type { WidgetRendererProps } from '../../core/types';

export const SvgSymbolRenderer: React.FC<WidgetRendererProps> = ({
  properties: p,
  width,
  height,
  alarmState,
}) => {
  const svgContent = (p.svgContent as string) || '';
  const fillOverride = (p.fillOverride as string) || '';
  const strokeOverride = (p.strokeOverride as string) || '';
  const label = (p.label as string) || '';

  const processedSvg = useMemo(() => {
    if (!svgContent) return '';
    let processed = svgContent;

    // Strip outer <svg> wrapper since we wrap it ourselves
    processed = processed.replace(/<svg[^>]*>/, '').replace(/<\/svg>\s*$/, '');

    // Apply fill/stroke overrides if set
    if (fillOverride) {
      processed = processed.replace(/fill="[^"]*"/g, `fill="${fillOverride}"`);
    }
    if (strokeOverride) {
      processed = processed.replace(/stroke="[^"]*"/g, `stroke="${strokeOverride}"`);
    }

    return processed;
  }, [svgContent, fillOverride, strokeOverride]);

  const labelH = label ? 16 : 0;

  if (!svgContent) {
    return (
      <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
        <rect x={1} y={1} width={width - 2} height={height - 2} fill="#F3F4F6" stroke="#D1D5DB" strokeDasharray="4 2" rx={4} />
        <text x={width / 2} y={height / 2} textAnchor="middle" dominantBaseline="central" fontSize={10} fill="#9CA3AF">
          No SVG
        </text>
      </svg>
    );
  }

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      className={alarmState?.active ? 'scada-alarm-blink' : undefined}
    >
      <svg
        x={0}
        y={0}
        width={width}
        height={height - labelH}
        dangerouslySetInnerHTML={{ __html: processedSvg }}
      />
      {label && (
        <text x={width / 2} y={height - 3} textAnchor="middle" fontSize={10} fill="#6B7280" fontFamily="Arial, sans-serif">
          {label}
        </text>
      )}
    </svg>
  );
};
