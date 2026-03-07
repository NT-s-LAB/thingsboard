'use client';

import React, { useEffect } from 'react';
import { ScadaCanvasWrapper } from '@/features/scada/components/ScadaCanvasWrapper';
import { WidgetPalette } from '@/features/scada/components/WidgetPalette';
import { Button } from '@/shared/components/ui/Button';
import { LoadingSpinner } from '@/shared/components/ui/LoadingSpinner';
import { useScadaStore } from '@/features/scada/stores/scadaStore';

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
  } = useScadaStore();

  useEffect(() => {
    if (params.id) {
      fetchDashboard(params.id);
    }
  }, [params.id, fetchDashboard]);

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
    <div className="h-screen flex flex-col bg-gray-100">
      {/* Top Toolbar */}
      <div className="bg-white border-b border-gray-200 px-4 py-2 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <h1 className="text-lg font-semibold text-gray-900 truncate">
            {currentDashboard.name}
          </h1>
          <div className="flex items-center space-x-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => setEditorMode(editorState.mode === 'design' ? 'debug' : 'design')}
            >
              {editorState.mode === 'design' ? '🔧 Debug' : '🎨 Design'}
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
          
          <div className="flex items-center bg-gray-100 rounded p-1">
            <Button
              size="sm"
              variant={editorState.leftPanelWidth > 0 ? 'secondary' : 'outline'}
              onClick={() => togglePanel('left')}
              className="p-2"
            >
              📋
            </Button>
            <Button
              size="sm"
              variant={editorState.rightPanelWidth > 0 ? 'secondary' : 'outline'}
              onClick={() => togglePanel('right')}
              className="p-2"
            >
              ⚙️
            </Button>
            <Button
              size="sm"
              variant={editorState.bottomPanelHeight > 0 ? 'secondary' : 'outline'}
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
        {editorState.leftPanelWidth > 0 && (
          <div 
            className="bg-white border-r border-gray-200 flex-shrink-0"
            style={{ width: editorState.leftPanelWidth }}
          >
            <WidgetPalette />
          </div>
        )}

        {/* Canvas Area */}
        <div className="flex-1 flex flex-col">
          <div className="flex-1 relative">
            <ScadaCanvasWrapper
              width={window.innerWidth - (editorState.leftPanelWidth + editorState.rightPanelWidth)}
              height={window.innerHeight - 120 - editorState.bottomPanelHeight} // Subtract toolbar and bottom panel
            />
          </div>

          {/* Bottom Panel - Properties/Logs */}
          {editorState.bottomPanelHeight > 0 && (
            <div 
              className="bg-white border-t border-gray-200 flex-shrink-0"
              style={{ height: editorState.bottomPanelHeight }}
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
                  <div>[INFO] Widgets count: {currentDashboard.widgets.length}</div>
                  <div>[INFO] Canvas size: {currentDashboard.canvasSize.width}x{currentDashboard.canvasSize.height}</div>
                  {isRuntimeMode && <div>[INFO] Runtime mode active</div>}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right Panel - Properties */}
        {editorState.rightPanelWidth > 0 && (
          <div 
            className="bg-white border-l border-gray-200 flex-shrink-0"
            style={{ width: editorState.rightPanelWidth }}
          >
            <div className="p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-medium text-gray-900">Properties</h3>
                <Button size="sm" variant="outline" onClick={() => togglePanel('right')}>
                  ✕
                </Button>
              </div>
              
              {editorState.selection.selectedWidgetIds.length === 0 ? (
                <div className="text-center text-gray-500 py-8">
                  <svg className="w-8 h-8 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" />
                  </svg>
                  <p className="text-sm">Select a widget to edit its properties</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Selected Widgets
                    </label>
                    <div className="text-sm text-gray-900">
                      {editorState.selection.selectedWidgetIds.length} widget(s) selected
                    </div>
                  </div>
                  
                  <div className="border-t border-gray-200 pt-4">
                    <h4 className="font-medium text-gray-900 mb-2">Common Properties</h4>
                    <div className="space-y-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Visibility
                        </label>
                        <input
                          type="checkbox"
                          defaultChecked
                          className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                        />
                        <span className="ml-2 text-sm text-gray-600">Visible</span>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Lock
                        </label>
                        <input
                          type="checkbox"
                          className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                        />
                        <span className="ml-2 text-sm text-gray-600">Locked</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Status Bar */}
      <div className="bg-gray-50 border-t border-gray-200 px-4 py-1 text-xs text-gray-600 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <span>Mode: {editorState.mode}</span>
          <span>Zoom: {Math.round(editorState.viewport.zoom * 100)}%</span>
          <span>Widgets: {currentDashboard.widgets.length}</span>
        </div>
        <div className="flex items-center space-x-4">
          <span>Grid: {editorState.showGrid ? 'ON' : 'OFF'}</span>
          <span>Snap: {editorState.snapToGrid ? 'ON' : 'OFF'}</span>
        </div>
      </div>
    </div>
  );
};

export default ScadaEditorPage;