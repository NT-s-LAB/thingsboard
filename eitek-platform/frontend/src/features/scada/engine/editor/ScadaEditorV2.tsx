/**
 * ScadaEditorV2 — Main Editor/Runtime layout component.
 *
 * Composes: Toolbar, WidgetPalette, CanvasEditor (or RuntimeRenderer), PropertyPanel, BindingPanel, LayerPanel.
 * Uses the new architecture: WidgetRegistry, ScreenDefinition, SubscriptionManager.
 */

'use client';

import React, { useEffect, useCallback, useState, useRef } from 'react';
import { useScadaRuntimeStore } from '../../stores/scadaRuntimeStore';
import { widgetRegistry } from '../../core/registry';
import { registerBuiltinWidgets } from '../../widgets/definitions';
import { CanvasEditor } from './CanvasEditor';
import { WidgetPaletteV2 } from './WidgetPaletteV2';
import { PropertyPanelV2 } from './PropertyPanelV2';
import { BindingPanelV2 } from './BindingPanelV2';
import { LayerPanel } from './LayerPanel';
import { EditorToolbar } from './EditorToolbar';
import { RuntimeRenderer } from '../runtime/RuntimeRenderer';
import type { ScreenDefinition } from '../../core/types';
import '../../styles/scada.css';

// Ensure widgets are registered
let widgetsRegistered = false;
function ensureWidgets() {
  if (!widgetsRegistered) {
    registerBuiltinWidgets();
    widgetsRegistered = true;
  }
}

interface ScadaEditorV2Props {
  /** Screen definition to load (e.g. from API). */
  screen?: ScreenDefinition;
  /** Callback to save the screen. */
  onSave?: (screen: ScreenDefinition) => void;
}

export const ScadaEditorV2: React.FC<ScadaEditorV2Props> = ({
  screen: screenProp,
  onSave,
}) => {
  const [rightPanel, setRightPanel] = useState<'properties' | 'bindings'>('properties');

  const fullscreenContainerRef = useRef<HTMLDivElement>(null);

  const store = useScadaRuntimeStore;
  const screen = store((s) => s.screen);
  const isRuntime = store((s) => s.isRuntime);
  const isFullscreen = store((s) => s.isFullscreen);
  const setFullscreen = store((s) => s.setFullscreen);
  const setRuntime = store((s) => s.setRuntime);
  const loadScreen = store((s) => s.loadScreen);
  const addWidget = store((s) => s.addWidget);
  const selectWidget = store((s) => s.selectWidget);

  // Pre-fullscreen state for restore
  const preFullscreenRef = useRef<{ wasRuntime: boolean } | null>(null);

  // Handle fullscreen toggle: enter runtime + fullscreen, exit restores
  const handleFullscreenRuntime = useCallback(() => {
    if (!document.fullscreenElement) {
      preFullscreenRef.current = { wasRuntime: isRuntime };
      if (!isRuntime) setRuntime(true);
      setFullscreen(true);
      fullscreenContainerRef.current?.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
      setFullscreen(false);
      if (preFullscreenRef.current && !preFullscreenRef.current.wasRuntime) {
        setRuntime(false);
      }
      preFullscreenRef.current = null;
    }
  }, [isRuntime, setRuntime, setFullscreen]);

  // Sync fullscreen state when exiting via Escape
  useEffect(() => {
    const onFsChange = () => {
      const fs = !!document.fullscreenElement;
      setFullscreen(fs);
      if (!fs && preFullscreenRef.current) {
        if (!preFullscreenRef.current.wasRuntime) {
          setRuntime(false);
        }
        preFullscreenRef.current = null;
      }
    };
    document.addEventListener('fullscreenchange', onFsChange);
    return () => document.removeEventListener('fullscreenchange', onFsChange);
  }, [setFullscreen, setRuntime]);

  // Register widgets on first mount
  useEffect(() => {
    ensureWidgets();
  }, []);

  // Load screen into store
  useEffect(() => {
    if (screenProp) {
      loadScreen(screenProp);
    }
  }, [screenProp, loadScreen]);

  // Add widget by type (from palette click)
  const handleAddWidget = useCallback(
    (type: string) => {
      const def = widgetRegistry.get(type);
      if (!def || !screen) return;

      const props: Record<string, unknown> = {};
      for (const f of def.propSchema) {
        props[f.key] = f.defaultValue;
      }

      const newWidget = {
        id: `w_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        type,
        name: def.name,
        layerId: screen.layers[0]?.id ?? 'default',
        transform: {
          position: { x: 100, y: 100 },
          size: { ...def.defaultSize },
          rotation: 0,
          zIndex: screen.widgets.length + 1,
        },
        properties: props,
        bindings: [],
        actions: [],
        visible: true,
        locked: false,
      };

      addWidget(newWidget);
      selectWidget(newWidget.id);
    },
    [screen, addWidget, selectWidget],
  );

  // Save handler
  const handleSave = useCallback(() => {
    if (screen && onSave) {
      onSave(screen);
      useScadaRuntimeStore.getState().setDirty(false);
    }
  }, [screen, onSave]);

  // Keyboard shortcut for save
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        handleSave();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [handleSave]);

  return (
    <div
      id="scada-v2-fullscreen-root"
      ref={fullscreenContainerRef}
      style={{ display: 'flex', flexDirection: 'column', height: '100vh', background: isFullscreen ? '#000' : '#fafbfc' }}
    >
      {/* Toolbar — hidden in fullscreen+runtime */}
      {!(isFullscreen && isRuntime) && (
        <EditorToolbar {...(onSave ? { onSave: handleSave } : {})} {...(screen?.name ? { screenName: screen.name } : {})} />
      )}

      {/* Main area */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        {/* Left panel — Widget palette (editor mode only) */}
        {!isRuntime && (
          <WidgetPaletteV2 onAddWidget={handleAddWidget} />
        )}

        {/* Center — Canvas or Runtime */}
        <div style={{ flex: 1, overflow: 'hidden', position: 'relative' }}>
          {isRuntime ? (
            <RuntimeRenderer
              screenId={screen?.id ?? ''}
              {...(screen ? { screen } : {})}
              autoFit={isFullscreen}
            />
          ) : (
            <CanvasEditor />
          )}
        </div>

        {/* Right panels (editor mode only) */}
        {!isRuntime && (
          <div style={{ width: 270, display: 'flex', flexDirection: 'column', gap: 4, padding: 4, overflow: 'auto' }}>
            {/* Tab switcher */}
            <div style={{ display: 'flex', gap: 2 }}>
              <TabBtn active={rightPanel === 'properties'} onClick={() => setRightPanel('properties')}>
                Properties
              </TabBtn>
              <TabBtn active={rightPanel === 'bindings'} onClick={() => setRightPanel('bindings')}>
                Bindings
              </TabBtn>
            </div>

            {rightPanel === 'properties' ? <PropertyPanelV2 /> : <BindingPanelV2 />}
            <LayerPanel />
          </div>
        )}
      </div>

      {/* Fullscreen exit floating button */}
      {isFullscreen && isRuntime && (
        <button
          onClick={handleFullscreenRuntime}
          style={{
            position: 'fixed',
            top: 12,
            right: 12,
            zIndex: 10000,
            background: 'rgba(0,0,0,0.6)',
            color: '#fff',
            border: 'none',
            padding: '6px 14px',
            borderRadius: 8,
            fontSize: 12,
            fontWeight: 500,
            cursor: 'pointer',
            backdropFilter: 'blur(4px)',
            opacity: 0.7,
            transition: 'opacity 0.2s',
          }}
          onMouseEnter={(e) => { (e.target as HTMLElement).style.opacity = '1'; }}
          onMouseLeave={(e) => { (e.target as HTMLElement).style.opacity = '0.7'; }}
        >
          ✕ Exit Fullscreen
        </button>
      )}
    </div>
  );
};

const TabBtn: React.FC<{ active: boolean; onClick: () => void; children: React.ReactNode }> = ({
  active,
  onClick,
  children,
}) => (
  <button
    onClick={onClick}
    style={{
      flex: 1,
      padding: '6px 0',
      fontSize: 11,
      fontWeight: active ? 600 : 400,
      color: active ? '#2563EB' : '#6B7280',
      background: active ? '#EFF6FF' : '#f9fafb',
      border: '1px solid',
      borderColor: active ? '#3B82F6' : '#e5e7eb',
      borderRadius: 4,
      cursor: 'pointer',
    }}
  >
    {children}
  </button>
);
