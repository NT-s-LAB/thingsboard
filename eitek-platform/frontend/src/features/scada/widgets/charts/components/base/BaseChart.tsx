/**
 * Base Chart Component
 * 
 * Base wrapper component for all chart widgets using Recharts.
 * Provides common functionality like loading, error states, and styling.
 */

'use client';

import React, { memo, useMemo, useState, useCallback } from 'react';
import type { ChartWidgetConfig, ChartSeriesData, ChartLoadingState } from '../../core/types';
import { ExportChartDialog } from '../ExportChartDialog';

// ─── Props ───────────────────────────────────────────────────────────────────

/** Callback to fetch data for a specific time range (used by export) */
export type FetchExportDataFn = (startTs: number, endTs: number) => Promise<ChartSeriesData[]>;

export interface BaseChartProps {
  config: ChartWidgetConfig;
  seriesData: ChartSeriesData[];
  width: number;
  height: number;
  loadingState?: ChartLoadingState;
  error?: string;
  children: React.ReactNode;
  /** Whether the chart already has data (to differentiate initial load vs refresh) */
  hasData?: boolean;
  /** Enable export functionality */
  enableExport?: boolean;
  /** Callback to fetch data for export with custom time range */
  onFetchExportData?: FetchExportDataFn;
}

// ─── Component ───────────────────────────────────────────────────────────────

export const BaseChart = memo<BaseChartProps>(function BaseChart({
  config,
  seriesData,
  width,
  height,
  loadingState = 'idle',
  error,
  children,
  hasData = false,
  enableExport = true,
  onFetchExportData,
}) {
  const { display } = config;

  // Export dialog state
  const [showExportDialog, setShowExportDialog] = useState(false);

  const handleOpenExport = useCallback(() => {
    setShowExportDialog(true);
  }, []);

  const handleCloseExport = useCallback(() => {
    setShowExportDialog(false);
  }, []);

  // Determine if this is initial load or a refresh
  const isInitialLoad = loadingState === 'loading' && !hasData && seriesData.length === 0;
  const isRefreshing = loadingState === 'loading' && (hasData || seriesData.length > 0);

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
      {/* Title with refresh indicator and export button */}
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
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}
        >
          <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {display.title}
          </span>
          {/* Subtle refresh indicator */}
          {isRefreshing && <RefreshIndicator />}
          {/* Export button */}
          {enableExport && seriesData.length > 0 && (
            <ExportButton onClick={handleOpenExport} />
          )}
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
        {/* Full Loading overlay - only on initial load */}
        {isInitialLoad && (
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

        {/* Refresh indicator and export button when no title is shown */}
        {!display.showTitle && (
          <div
            style={{
              position: 'absolute',
              top: 8,
              right: 8,
              zIndex: 10,
              display: 'flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            {isRefreshing && <RefreshIndicator />}
            {enableExport && seriesData.length > 0 && (
              <ExportButton onClick={handleOpenExport} />
            )}
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

      {/* Export Dialog */}
      <ExportChartDialog
        open={showExportDialog}
        onClose={handleCloseExport}
        config={config}
        seriesData={seriesData}
        onFetchExportData={onFetchExportData}
      />
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

// ─── Refresh Indicator (subtle) ──────────────────────────────────────────────

const RefreshIndicator: React.FC = () => (
  <svg
    width="14"
    height="14"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    style={{
      animation: 'spin 1s linear infinite',
      color: '#9CA3AF',
      flexShrink: 0,
    }}
  >
    <path d="M21 12a9 9 0 1 1-6.219-8.56" />
  </svg>
);

// ─── Export Button ───────────────────────────────────────────────────────────

interface ExportButtonProps {
  onClick: () => void;
}

const ExportButton: React.FC<ExportButtonProps> = ({ onClick }) => (
  <button
    onClick={(e) => {
      e.stopPropagation();
      onClick();
    }}
    style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      width: 24,
      height: 24,
      padding: 0,
      border: 'none',
      borderRadius: 4,
      backgroundColor: 'transparent',
      cursor: 'pointer',
      color: '#6B7280',
      transition: 'color 0.15s, background-color 0.15s',
      flexShrink: 0,
    }}
    onMouseEnter={(e) => {
      e.currentTarget.style.backgroundColor = '#F3F4F6';
      e.currentTarget.style.color = '#3B82F6';
    }}
    onMouseLeave={(e) => {
      e.currentTarget.style.backgroundColor = 'transparent';
      e.currentTarget.style.color = '#6B7280';
    }}
    title="Export data"
  >
    {/* FileSpreadsheet icon */}
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
      <polyline points="14 2 14 8 20 8" />
      <path d="M8 13h2" />
      <path d="M8 17h2" />
      <path d="M14 13h2" />
      <path d="M14 17h2" />
    </svg>
  </button>
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
