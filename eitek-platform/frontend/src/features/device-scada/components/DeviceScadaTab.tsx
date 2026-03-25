'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { RuntimeRenderer } from '@/features/scada/engine/runtime/RuntimeRenderer';
import { registerBuiltinWidgets } from '@/features/scada/widgets/definitions';
import { deviceScadaService } from '@/features/device-scada/services/deviceScadaService';
import { LoadingSpinner } from '@/shared/components/ui/LoadingSpinner';
import type { ScreenDefinition } from '@/features/scada/core/types/screen.types';
import type { ResolvedDeviceScada } from '@/features/device-scada/types';

let widgetsRegistered = false;
function ensureWidgets() {
  if (!widgetsRegistered) {
    registerBuiltinWidgets();
    widgetsRegistered = true;
  }
}

interface DeviceScadaTabProps {
  deviceId: string;
}

export const DeviceScadaTab: React.FC<DeviceScadaTabProps> = ({ deviceId }) => {
  const [resolved, setResolved] = useState<ResolvedDeviceScada | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const loadScada = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      ensureWidgets();
      const data = await deviceScadaService.resolveDeviceScada(deviceId);
      setResolved(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load device SCADA');
    } finally {
      setLoading(false);
    }
  }, [deviceId]);

  useEffect(() => {
    loadScada();
  }, [loadScada]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-96 text-center">
        <svg className="w-12 h-12 text-red-400 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
        </svg>
        <p className="text-gray-600 mb-3">{error}</p>
        <button
          onClick={loadScada}
          className="px-4 py-2 text-sm bg-primary-600 text-white rounded-lg hover:bg-primary-700"
        >
          Retry
        </button>
      </div>
    );
  }

  if (!resolved || !resolved.hasTemplate || !resolved.screen) {
    return (
      <div className="flex flex-col items-center justify-center h-96 text-center">
        <svg className="w-16 h-16 text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
        <h3 className="text-lg font-medium text-gray-700 mb-2">No SCADA Template</h3>
        <p className="text-gray-500 text-sm max-w-md">
          This device profile does not have a default SCADA template assigned.
          Go to <span className="font-medium">Device Profiles → SCADA Defaults</span> to assign one.
        </p>
      </div>
    );
  }

  return (
    <div className="relative">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-4 py-2 bg-gray-50 border-b border-gray-200">
        <div className="flex items-center space-x-3 text-sm text-gray-600">
          <span>
            Template: <span className="font-medium text-gray-900">{resolved.templateName}</span>
          </span>
          <span className="text-gray-300">|</span>
          <span>v{resolved.templateVersion}</span>
          {resolved.hasOverride && (
            <>
              <span className="text-gray-300">|</span>
              <span className="text-amber-600 font-medium">Custom Override</span>
            </>
          )}
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="p-1.5 text-gray-500 hover:text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
            title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
          >
            {isFullscreen ? (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
              </svg>
            )}
          </button>
          <button
            onClick={loadScada}
            className="p-1.5 text-gray-500 hover:text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
            title="Refresh"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
        </div>
      </div>

      {/* SCADA Runtime */}
      <div
        className={`${isFullscreen ? 'fixed inset-0 z-50 bg-white' : ''}`}
        style={isFullscreen ? undefined : { height: 600 }}
      >
        {isFullscreen && (
          <div className="absolute top-2 right-2 z-10">
            <button
              onClick={() => setIsFullscreen(false)}
              className="p-2 bg-white/90 border shadow-sm rounded-lg text-gray-600 hover:text-gray-900"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        )}
        <RuntimeRenderer
          screenId={`device-scada-${deviceId}`}
          screen={resolved.screen as ScreenDefinition}
          autoFit
          className="w-full h-full"
        />
      </div>
    </div>
  );
};
