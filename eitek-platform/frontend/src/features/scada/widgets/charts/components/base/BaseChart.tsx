/**
 * Base Chart Component
 * 
 * Base wrapper component for all chart widgets using Recharts.
 * Provides common functionality like loading, error states, and styling.
 */

'use client';

import React, { memo, useMemo } from 'react';
import type { ChartWidgetConfig, ChartSeriesData, ChartLoadingState } from '../../core/types';

// ─── Props ───────────────────────────────────────────────────────────────────

export interface BaseChartProps {
  config: ChartWidgetConfig;
  seriesData: ChartSeriesData[];
  width: number;
  height: number;
  loadingState?: ChartLoadingState;
  error?: string;
  children: React.ReactNode;
}

// ─── Component ───────────────────────────────────────────────────────────────

export const BaseChart = memo<BaseChartProps>(function BaseChart({
  config,
  width,
  height,
  loadingState = 'idle',
  error,
  children,
}) {
  const { display } = config;

  // Compute content area dimensions
  const contentStyle = useMemo(() => {
    const padding = display.padding ?? 16;
    const titleHeight = display.showTitle ? 32 : 0;
    
    return {
      width: width - padding * 2,
      height: height - padding * 2 - titleHeight,
      padding,
      titleHeight,
    };
  }, [width, height, display.padding, display.showTitle]);

  // Container styles
  const containerStyle: React.CSSProperties = {
    width,
    height,
    backgroundColor: display.backgroundColor || '#FFFFFF',
    borderRadius: display.borderRadius ?? 8,
    overflow: 'hidden',
    position: 'relative',
    display: 'flex',
    flexDirection: 'column',
  };

  return (
    <div style={containerStyle}>
      {/* Title */}
      {display.showTitle && display.title && (
        <div
          style={{
            padding: `${contentStyle.padding}px ${contentStyle.padding}px 0`,
            fontSize: display.titleFontSize || 14,
            fontWeight: 500,
            color: display.titleColor || '#374151',
            lineHeight: '32px',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          {display.title}
        </div>
      )}

      {/* Content Area */}
      <div
        style={{
          flex: 1,
          padding: contentStyle.padding,
          paddingTop: display.showTitle ? 8 : contentStyle.padding,
          position: 'relative',
          minHeight: 0,
        }}
      >
        {/* Loading State */}
        {loadingState === 'loading' && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: 'rgba(255, 255, 255, 0.8)',
              zIndex: 10,
            }}
          >
            <LoadingSpinner />
          </div>
        )}

        {/* Error State */}
        {loadingState === 'error' && error && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexDirection: 'column',
              gap: 8,
              color: '#EF4444',
            }}
          >
            <ErrorIcon />
            <span style={{ fontSize: 12 }}>{error}</span>
          </div>
        )}

        {/* Chart Content */}
        {loadingState !== 'error' && children}
      </div>
    </div>
  );
});

// ─── Loading Spinner ─────────────────────────────────────────────────────────

const LoadingSpinner: React.FC = () => (
  <svg
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    style={{
      animation: 'spin 1s linear infinite',
      color: '#3B82F6',
    }}
  >
    <style>
      {`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}
    </style>
    <path d="M21 12a9 9 0 1 1-6.219-8.56" />
  </svg>
);

// ─── Error Icon ──────────────────────────────────────────────────────────────

const ErrorIcon: React.FC = () => (
  <svg
    width="32"
    height="32"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <circle cx="12" cy="12" r="10" />
    <line x1="12" y1="8" x2="12" y2="12" />
    <line x1="12" y1="16" x2="12.01" y2="16" />
  </svg>
);

// ─── Empty State ─────────────────────────────────────────────────────────────

export interface EmptyStateProps {
  message?: string;
}

export const ChartEmptyState: React.FC<EmptyStateProps> = ({ message = 'No data available' }) => (
  <div
    style={{
      position: 'absolute',
      inset: 0,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      flexDirection: 'column',
      gap: 8,
      color: '#9CA3AF',
    }}
  >
    <svg
      width="40"
      height="40"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M3 3v18h18" />
      <path d="M18.7 8l-5.1 5.2-2.8-2.7L7 14.3" />
    </svg>
    <span style={{ fontSize: 12 }}>{message}</span>
  </div>
);

export default BaseChart;
