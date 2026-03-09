'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { ScadaCanvasWrapper } from '@/features/scada/components/ScadaCanvasWrapper';
import { WidgetPalette } from '@/features/scada/components/WidgetPalette';
import { PropertyPanel } from '@/features/scada/components/PropertyPanel';
import { Button } from '@/shared/components/ui/Button';
import { LoadingSpinner } from '@/shared/components/ui/LoadingSpinner';
import { useScadaStore } from '@/features/scada/stores/scadaStore';
import { useScadaRuntime } from '@/features/scada/hooks/useScadaRuntime';

interface ScadaEditorPageProps {
  params: {
    id: string;
  };
}

const ScadaEditorPage: React.FC<ScadaEditorPageProps> = ({ params }) => {
  const {
    currentDashboard,
    editorState,
    isRuntimeMode,
    loading,
    error,
    
    // Actions
    fetchDashboard,
    setEditorMode,
    startRuntime,
    stopRuntime,
    togglePanel,
    setViewport,
  } = useScadaStore();

  const canvasContainerRef = useRef<HTMLDivElement>(null);
  const fullscreenContainerRef = useRef<HTMLDivElement>(null);
  const [canvasSize, setCanvasSize] = useState({ width: 800, height: 600 });
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Store pre-fullscreen state so we can restore on exit
  const preFullscreenState = useRef<{
    viewport: { position: { x: number; y: number }; zoom: number };
    wasRuntime: boolean;
  } | null>(null);

  // Activate runtime telemetry subscriptions
  useScadaRuntime();

  const updateCanvasSize = useCallback(() => {
    if (canvasContainerRef.current) {
      const rect = canvasContainerRef.current.getBoundingClientRect();
      setCanvasSize({ width: Math.floor(rect.width), height: Math.floor(rect.height) });
    }
  }, []);

  useEffect(() => {
    if (params.id) {
      fetchDashboard(params.id);
    }
  }, [params.id, fetchDashboard]);

  useEffect(() => {
    const el = canvasContainerRef.current;
    if (!el) return;
    // Initial measurement
    updateCanvasSize();
    // Observe resize
    const observer = new ResizeObserver(() => {
      updateCanvasSize();
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, [updateCanvasSize]);

  const handleToggleRuntime = () => {
    if (isRuntimeMode) {
      stopRuntime();
    } else {
      startRuntime();
    }
  };

  const handleSave = () => {
    // TODO: Implement save functionality
    console.log('Save dashboard');
  };

  // Auto-fit the dashboard canvas into the viewport
  const fitDashboardToViewport = useCallback(() => {
    const cs = currentDashboard?.canvasSize as { width?: number; height?: number } | undefined;
    const dashW = cs?.width || 1920;
    const dashH = cs?.height || 1080;

    // Use a small delay to let the ResizeObserver measure the new fullscreen container size
    requestAnimationFrame(() => {
      const el = canvasContainerRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const viewW = rect.width;
      const viewH = rect.height;
      if (viewW <= 0 || viewH <= 0) return;

      const scaleX = viewW / dashW;
      const scaleY = viewH / dashH;
      const zoom = Math.min(scaleX, scaleY);

      // Center the dashboard in the viewport
      const offsetX = (viewW / zoom - dashW) / 2;
      const offsetY = (viewH / zoom - dashH) / 2;

      setViewport({
        position: { x: -offsetX, y: -offsetY },
        zoom,
        size: { width: viewW, height: viewH },
      });
    });
  }, [currentDashboard, setViewport]);

  const handleToggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      // Save pre-fullscreen state
      preFullscreenState.current = {
        viewport: {
          position: { ...(editorState?.viewport?.position ?? { x: 0, y: 0 }) },
          zoom: editorState?.viewport?.zoom ?? 1,
        },
        wasRuntime: isRuntimeMode,
      };

      // Enter runtime mode for clean dashboard view
      if (!isRuntimeMode) {
        startRuntime();
      }

      fullscreenContainerRef.current?.requestFullscreen().catch(() => {});
      setIsFullscreen(true);

      // Fit the dashboard after fullscreen settles
      setTimeout(fitDashboardToViewport, 150);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);

      // Restore pre-fullscreen state
      if (preFullscreenState.current) {
        const prev = preFullscreenState.current;
        setViewport({
          position: prev.viewport.position,
          zoom: prev.viewport.zoom,
        });
        if (!prev.wasRuntime && isRuntimeMode) {
          stopRuntime();
        }
        preFullscreenState.current = null;
      }
    }
  }, [editorState?.viewport, isRuntimeMode, startRuntime, stopRuntime, setViewport, fitDashboardToViewport]);

  // Sync fullscreen state when user presses Escape to exit
  useEffect(() => {
    const onFsChange = () => {
      const fs = !!document.fullscreenElement;
      setIsFullscreen(fs);

      if (!fs && preFullscreenState.current) {
        // Restore viewport + runtime state when exiting via Escape or browser controls
        const prev = preFullscreenState.current;
        setViewport({
          position: prev.viewport.position,
          zoom: prev.viewport.zoom,
        });
        if (!prev.wasRuntime) {
          stopRuntime();
        }
        preFullscreenState.current = null;
      }

      if (fs) {
        // Re-fit when fullscreen is activated
        setTimeout(fitDashboardToViewport, 150);
      }
    };
    document.addEventListener('fullscreenchange', onFsChange);
    return () => document.removeEventListener('fullscreenchange', onFsChange);
  }, [setViewport, stopRuntime, fitDashboardToViewport]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="text-red-600 mb-2">
            <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-1">Error loading dashboard</h3>
          <p className="text-gray-500 mb-4">{error}</p>
          <Button onClick={() => fetchDashboard(params.id)}>
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  if (!currentDashboard) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <h3 className="text-lg font-medium text-gray-900 mb-1">Dashboard not found</h3>
          <p className="text-gray-500">The dashboard you're looking for doesn't exist.</p>
        </div>
      </div>
    );
  }

  return (
    <div ref={fullscreenContainerRef} className={`h-full flex flex-col overflow-hidden ${isFullscreen ? 'bg-black' : 'bg-gray-100'}`}>
      {/* Top Toolbar */}
      <div className={`bg-white border-b border-gray-200 px-4 py-2 flex items-center justify-between ${isFullscreen && isRuntimeMode ? 'hidden' : ''}`}>
        <div className="flex items-center space-x-4">
          <h1 className="text-lg font-semibold text-gray-900 truncate">
            {currentDashboard.name}
          </h1>
          <div className="flex items-center space-x-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => setEditorMode(editorState?.mode === 'design' ? 'debug' : 'design')}
            >
              {editorState?.mode === 'design' ? '🔧 Debug' : '🎨 Design'}
            </Button>
            <Button
              size="sm"
              variant={isRuntimeMode ? 'destructive' : 'default'}
              onClick={handleToggleRuntime}
            >
              {isRuntimeMode ? '⏹️ Stop Runtime' : '▶️ Start Runtime'}
            </Button>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <Button size="sm" variant="outline" onClick={handleSave}>
            💾 Save
          </Button>
          <Button size="sm" variant="outline" onClick={handleToggleFullscreen} title="Fullscreen (F11)">
            {isFullscreen ? '⊡ Exit Fullscreen' : '⛶ Fullscreen'}
          </Button>
          
          <div className="flex items-center bg-gray-100 rounded p-1">
            <Button
              size="sm"
              variant={(editorState?.leftPanelWidth ?? 0) > 0 ? 'secondary' : 'outline'}
              onClick={() => togglePanel('left')}
              className="p-2"
            >
              📋
            </Button>
            <Button
              size="sm"
              variant={(editorState?.rightPanelWidth ?? 0) > 0 ? 'secondary' : 'outline'}
              onClick={() => togglePanel('right')}
              className="p-2"
            >
              ⚙️
            </Button>
            <Button
              size="sm"
              variant={(editorState?.bottomPanelHeight ?? 0) > 0 ? 'secondary' : 'outline'}
              onClick={() => togglePanel('bottom')}
              className="p-2"
            >
              📊
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Panel - Widget Palette */}
        {(editorState?.leftPanelWidth ?? 0) > 0 && !(isFullscreen && isRuntimeMode) && (
          <div 
            className="bg-white border-r border-gray-200 flex-shrink-0"
            style={{ width: editorState?.leftPanelWidth ?? 300 }}
          >
            <WidgetPalette />
          </div>
        )}

        {/* Canvas Area */}
        <div className="flex-1 flex flex-col min-w-0">
          <div className="flex-1 relative" ref={canvasContainerRef}>
            <ScadaCanvasWrapper
              width={canvasSize.width}
              height={canvasSize.height}
            />
          </div>

          {/* Bottom Panel - Properties/Logs */}
          {(editorState?.bottomPanelHeight ?? 0) > 0 && !(isFullscreen && isRuntimeMode) && (
            <div 
              className="bg-white border-t border-gray-200 flex-shrink-0"
              style={{ height: editorState?.bottomPanelHeight ?? 200 }}
            >
              <div className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-medium text-gray-900">Debug Console</h3>
                  <Button size="sm" variant="outline" onClick={() => togglePanel('bottom')}>
                    ✕
                  </Button>
                </div>
                <div className="bg-gray-900 text-green-400 p-3 rounded font-mono text-sm h-32 overflow-y-auto">
                  <div>[INFO] Dashboard loaded: {currentDashboard.name}</div>
                  <div>[INFO] Widgets count: {(currentDashboard.widgets ?? (currentDashboard as any).scadaWidgets ?? []).length}</div>
                  <div>[INFO] Canvas size: {(currentDashboard.canvasSize as any)?.width ?? 1920}x{(currentDashboard.canvasSize as any)?.height ?? 1080}</div>
                  {isRuntimeMode && <div>[INFO] Runtime mode active</div>}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right Panel - Properties */}
        {(editorState?.rightPanelWidth ?? 0) > 0 && !(isFullscreen && isRuntimeMode) && (
          <div 
            className="bg-white border-l border-gray-200 flex-shrink-0 overflow-y-auto overflow-x-hidden"
            style={{ width: editorState?.rightPanelWidth ?? 300 }}
          >
            <PropertyPanel />
          </div>
        )}
      </div>

      {/* Fullscreen exit floating button */}
      {isFullscreen && (
        <button
          onClick={handleToggleFullscreen}
          className="fixed top-3 right-3 z-50 bg-black/60 hover:bg-black/80 text-white px-3 py-1.5 rounded-lg text-xs font-medium shadow-lg backdrop-blur transition-colors"
        >
          ✕ Exit Fullscreen
        </button>
      )}

      {/* Status Bar */}
      <div className={`bg-gray-50 border-t border-gray-200 px-4 py-1 text-xs text-gray-600 flex items-center justify-between ${isFullscreen && isRuntimeMode ? 'hidden' : ''}`}>
        <div className="flex items-center space-x-4">
          <span>Mode: {editorState?.mode ?? 'design'}</span>
          <span>Zoom: {Math.round((editorState?.viewport?.zoom ?? 1) * 100)}%</span>
          <span>Widgets: {(currentDashboard.widgets ?? (currentDashboard as any).scadaWidgets ?? []).length}</span>
        </div>
        <div className="flex items-center space-x-3">
          <span className="text-gray-400">Del: Delete</span>
          <span className="text-gray-400">Ctrl+C/X/V: Copy/Cut/Paste</span>
          <span className="text-gray-400">Ctrl+Z/Y: Undo/Redo</span>
          <span className="text-gray-400">Arrows: Move</span>
          <span className="mx-2 text-gray-300">|</span>
          <span>Grid: {editorState?.showGrid ? 'ON' : 'OFF'}</span>
          <span>Snap: {editorState?.snapToGrid ? 'ON' : 'OFF'}</span>
        </div>
      </div>
    </div>
  );
};

export default ScadaEditorPage;