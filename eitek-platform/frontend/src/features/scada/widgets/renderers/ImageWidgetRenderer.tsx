/**
 * Image Widget Renderer — Displays a static or dynamic image.
 * Essential for P&ID backgrounds, equipment photos, logos, etc.
 */

import React from 'react';
import type { WidgetRendererProps } from '../../core/types';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001';
const resolveUrl = (url: string | undefined | null): string => {
  if (!url) return '';
  return url.startsWith('http') || url.startsWith('data:') ? url : `${API_BASE}${url}`;
};

export const ImageWidgetRenderer: React.FC<WidgetRendererProps> = ({
  properties: p,
  width,
  height,
  isRuntime,
  alarmState,
  onAction,
}) => {
  const imageUrl = resolveUrl(p.imageUrl as string);
  const objectFit = (p.objectFit as string) || 'contain';
  const borderRadius = (p.borderRadius as number) ?? 0;
  const borderWidth = (p.borderWidth as number) ?? 0;
  const borderColor = (p.borderColor as string) || '#E5E7EB';
  const opacity = (p.opacity as number) ?? 1;
  const bgColor = (p.bgColor as string) || 'transparent';
  const label = (p.label as string) || '';
  const labelSize = (p.labelSize as number) ?? 10;
  const labelColor = (p.labelColor as string) || '#6B7280';

  const handleClick = () => {
    if (isRuntime) onAction?.('click', {});
  };

  const labelH = label ? labelSize + 6 : 0;

  if (!imageUrl) {
    return (
      <div
        style={{
          width, height,
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          background: bgColor !== 'transparent' ? bgColor : '#F3F4F6',
          border: `${Math.max(1, borderWidth)}px dashed #D1D5DB`,
          borderRadius,
          color: '#9CA3AF', fontSize: 11,
          fontFamily: 'Arial, sans-serif',
        }}
      >
        <span style={{ fontSize: 24, marginBottom: 4 }}>🖼️</span>
        No image
      </div>
    );
  }

  return (
    <div
      onClick={handleClick}
      className={alarmState?.active ? 'scada-alarm-blink' : undefined}
      style={{
        width, height,
        display: 'flex', flexDirection: 'column',
        alignItems: 'center',
        cursor: isRuntime ? 'pointer' : 'default',
        userSelect: 'none',
      }}
    >
      <div style={{
        width, height: height - labelH,
        overflow: 'hidden',
        borderRadius,
        border: borderWidth > 0 ? `${borderWidth}px solid ${borderColor}` : 'none',
        background: bgColor,
      }}>
        <img
          src={imageUrl}
          alt={label || 'image'}
          style={{
            width: '100%', height: '100%',
            objectFit: objectFit as React.CSSProperties['objectFit'],
            opacity,
            display: 'block',
          }}
          draggable={false}
        />
      </div>
      {label && (
        <span style={{
          fontSize: labelSize, color: labelColor,
          fontFamily: 'Arial, sans-serif',
          marginTop: 2, textAlign: 'center',
          maxWidth: width,
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        }}>
          {label}
        </span>
      )}
    </div>
  );
};
