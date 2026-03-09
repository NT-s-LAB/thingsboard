/**
 * CustomWidgetRenderer — Renders user-created widgets from the Widget Library.
 *
 * Supports:
 *   • SVG content with placeholder substitution ({{propertyKey}})
 *   • Fill/stroke color overrides
 *   • Image rendering (PNG/JPG)
 *   • Label display
 *   • Alarm blink
 */

import React, { useMemo } from 'react';
import type { WidgetRendererProps } from '../../core/types';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001';
const resolveUrl = (url: string | undefined | null): string => {
  if (!url) return '';
  return url.startsWith('http') || url.startsWith('data:') ? url : `${API_BASE}${url}`;
};

export const CustomWidgetRenderer: React.FC<WidgetRendererProps> = ({
  properties: p,
  width,
  height,
  isRuntime,
  alarmState,
  onAction,
}) => {
  const svgContent = (p._svgContent as string) || '';
  const imageUrl = resolveUrl(p._imageUrl as string);
  const label = (p.label as string) || '';
  const fillColor = (p.fillColor as string) || '';
  const strokeColor = (p.strokeColor as string) || '';
  const bgColor = (p.bgColor as string) || 'transparent';
  const borderRadius = (p.borderRadius as number) ?? 0;
  const borderWidth = (p.borderWidth as number) ?? 0;
  const borderColor = (p.borderColor as string) || '#E5E7EB';
  const opacity = (p.opacity as number) ?? 1;
  const labelColor = (p.labelColor as string) || '#6B7280';

  const labelH = label ? 18 : 0;

  // Process SVG: replace placeholders {{key}} with property values, apply color overrides
  const processedSvg = useMemo(() => {
    if (!svgContent) return '';
    let processed = svgContent;

    // Remove outer <svg> wrapper to embed into our viewBox
    processed = processed.replace(/<svg[^>]*>/, '').replace(/<\/svg>\s*$/, '');

    // Replace placeholders like {{value}}, {{label}}, etc.
    processed = processed.replace(/\{\{(\w+)\}\}/g, (_, key) => {
      const val = p[key];
      return val !== undefined && val !== null ? String(val) : '';
    });

    // Apply color overrides
    if (fillColor) {
      processed = processed.replace(/fill="[^"]*"/g, `fill="${fillColor}"`);
    }
    if (strokeColor) {
      processed = processed.replace(/stroke="[^"]*"/g, `stroke="${strokeColor}"`);
    }

    return processed;
  }, [svgContent, p, fillColor, strokeColor]);

  const handleClick = () => {
    if (isRuntime) {
      onAction?.('click', {});
    }
  };

  // ─── Image-based custom widget ───
  if (imageUrl && !svgContent) {
    return (
      <div
        onClick={handleClick}
        className={alarmState?.active ? 'scada-alarm-blink' : undefined}
        style={{
          width, height,
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          background: bgColor,
          borderRadius,
          border: borderWidth ? `${borderWidth}px solid ${borderColor}` : undefined,
          opacity,
          cursor: isRuntime ? 'pointer' : 'default',
          userSelect: 'none',
          overflow: 'hidden',
        }}
      >
        <img
          src={imageUrl}
          alt={label || 'custom widget'}
          style={{
            width: '100%',
            height: height - labelH,
            objectFit: 'contain',
          }}
          draggable={false}
        />
        {label && (
          <span style={{ fontSize: 10, color: labelColor, fontFamily: 'Arial, sans-serif' }}>
            {label}
          </span>
        )}
      </div>
    );
  }

  // ─── SVG-based custom widget ───
  if (processedSvg) {
    return (
      <div
        onClick={handleClick}
        className={alarmState?.active ? 'scada-alarm-blink' : undefined}
        style={{
          width, height,
          background: bgColor,
          borderRadius,
          border: borderWidth ? `${borderWidth}px solid ${borderColor}` : undefined,
          opacity,
          cursor: isRuntime ? 'pointer' : 'default',
          userSelect: 'none',
          overflow: 'hidden',
        }}
      >
        <svg
          width={width}
          height={height - labelH}
          viewBox={`0 0 ${width} ${height - labelH}`}
          preserveAspectRatio="xMidYMid meet"
        >
          <g dangerouslySetInnerHTML={{ __html: processedSvg }} />
        </svg>
        {label && (
          <div style={{
            textAlign: 'center', fontSize: 10, color: labelColor,
            fontFamily: 'Arial, sans-serif', lineHeight: '18px',
          }}>
            {label}
          </div>
        )}
      </div>
    );
  }

  // ─── Empty state ───
  return (
    <div
      onClick={handleClick}
      style={{
        width, height,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: bgColor || '#F9FAFB',
        borderRadius,
        border: borderWidth ? `${borderWidth}px solid ${borderColor}` : '1px dashed #D1D5DB',
        cursor: isRuntime ? 'pointer' : 'default',
        userSelect: 'none',
      }}
    >
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 20, color: '#D1D5DB' }}>📦</div>
        <div style={{ fontSize: 9, color: '#9CA3AF', marginTop: 2 }}>Custom Widget</div>
        {label && (
          <div style={{ fontSize: 10, color: labelColor, marginTop: 2 }}>{label}</div>
        )}
      </div>
    </div>
  );
};
