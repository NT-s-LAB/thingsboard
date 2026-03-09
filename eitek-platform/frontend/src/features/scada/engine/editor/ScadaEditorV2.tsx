/**
 * ScadaEditorV2 — Main Editor/Runtime layout component.
 *
 * Composes: Toolbar, WidgetPalette, CanvasEditor (or RuntimeRenderer), PropertyPanel, BindingPanel, LayerPanel.
 * Uses the new architecture: WidgetRegistry, ScreenDefinition, SubscriptionManager.
 */

'use client';

import React, { useEffect, useCallback, useState, useRef } from 'react';
import { useScadaRuntimeStore } from '../../stores/scadaRuntimeStore';
import { useScadaProjectStore } from '../../stores/scadaProjectStore';
import { widgetRegistry } from '../../core/registry';
import { registerBuiltinWidgets } from '../../widgets/definitions';
import { useSyncProjectToRuntime } from '../../hooks/useSyncProjectToRuntime';
import { CanvasEditor } from './CanvasEditor';
import { WidgetPaletteV2 } from './WidgetPaletteV2';
import { PropertyPanelV2 } from './PropertyPanelV2';
import { BindingPanelV2 } from './BindingPanelV2';
import { ActionPanelV2 } from './ActionPanelV2';
import { LayerPanel } from './LayerPanel';
import { PageManagerPanel } from './PageManagerPanel';
import { PageTabs } from './PageTabs';
import { EventActionEditor } from './EventActionEditor';
import { EditorToolbar } from './EditorToolbar';
import { RuntimeRenderer } from '../runtime/RuntimeRenderer';
import { MultiPageRuntime } from '../runtime/MultiPageRuntime';
import { WidgetEditorDialog } from './WidgetEditorDialog';
import type { ScreenDefinition } from '../../core/types';
import type { WidgetItem } from '../../services/widgetLibraryService';
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
  /** Callback to save/deploy the screen. */
  onSave?: (screen: ScreenDefinition) => void;
  /** Save status for visual feedback. */
  saveStatus?: 'idle' | 'saving' | 'saved' | 'error';
  /** Callback to exit edit mode and return to view mode. */
  onExitEdit?: () => void;
}

export const ScadaEditorV2: React.FC<ScadaEditorV2Props> = ({
  screen: screenProp,
  onSave,
  saveStatus = 'idle',
  onExitEdit,
}) => {
  const [rightPanel, setRightPanel] = useState<'properties' | 'bindings' | 'actions' | 'events'>('properties');
  const [widgetEditorOpen, setWidgetEditorOpen] = useState(false);
  const [editingWidget, setEditingWidget] = useState<WidgetItem | null>(null);

  const fullscreenContainerRef = useRef<HTMLDivElement>(null);

  // Bridge: sync active page ↔ runtime store
  useSyncProjectToRuntime();

  const store = useScadaRuntimeStore;
  const screen = store((s) => s.screen);
  const isRuntime = store((s) => s.isRuntime);
  const project = useScadaProjectStore((s) => s.project);
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

  // Load screen into store only on initial mount (not after save)
  const screenLoadedRef = useRef(false);
  useEffect(() => {
    if (screenProp && !screenLoadedRef.current) {
      loadScreen(screenProp);
      screenLoadedRef.current = true;
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

  // Add library widget by clicking (from WidgetLibraryPanel)
  const handleAddLibraryWidget = useCallback(
    (widget: WidgetItem) => {
      if (!screen) return;
      const cfg = (widget.config || {}) as Record<string, unknown>;
      const tpl = (widget.template || {}) as Record<string, unknown>;
      const defW = (cfg.defaultWidth as number) || 120;
      const defH = (cfg.defaultHeight as number) || 80;

      const props: Record<string, unknown> = {
        _libraryId: widget.id,
        _libraryName: widget.name,
        _svgContent: (tpl.svg as string) || '',
        _imageUrl: (tpl.imageUrl as string) || '',
        label: widget.name || '',
        fillColor: '',
        strokeColor: '',
        bgColor: 'transparent',
        labelColor: '#6B7280',
        borderRadius: 0,
        borderWidth: 0,
        borderColor: '#E5E7EB',
        opacity: 1,
      };

      // Merge custom props from config.propSchema
      const schema = (cfg.propSchema as Array<{ key: string; defaultValue?: unknown }>) || [];
      for (const field of schema) {
        if (field.key && !(field.key in props)) {
          props[field.key] = field.defaultValue ?? '';
        }
      }

      const newWidget = {
        id: `w_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        type: 'customWidget',
        name: widget.name || 'Custom Widget',
        layerId: screen.layers[0]?.id ?? 'default',
        transform: {
          position: { x: 100, y: 100 },
          size: { width: defW, height: defH },
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

  // Open widget editor dialog
  const handleOpenWidgetEditor = useCallback(() => {
    setEditingWidget(null);
    setWidgetEditorOpen(true);
  }, []);

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
        <EditorToolbar
          {...(onSave ? { onSave: handleSave } : {})}
          {...(screen?.name ? { screenName: screen.name } : {})}
          saveStatus={saveStatus}
          onExitEdit={onExitEdit}
        />
      )}

      {/* Main area */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        {/* Left panel — Widget palette (editor mode only) */}
        {!isRuntime && (
          <WidgetPaletteV2
            onAddWidget={handleAddWidget}
            onAddLibraryWidget={handleAddLibraryWidget}
            onCreateWidget={handleOpenWidgetEditor}
          />
        )}

        {/* Center — Canvas or Runtime */}
        <div style={{ flex: 1, overflow: 'hidden', position: 'relative', display: 'flex', flexDirection: 'column' }}>
          {/* Page tabs (editor mode only) */}
          {!isRuntime && <PageTabs />}
          {isRuntime ? (
            project ? (
              <MultiPageRuntime project={project} autoFit={isFullscreen} />
            ) : (
              <RuntimeRenderer
                screenId={screen?.id ?? ''}
                {...(screen ? { screen } : {})}
                autoFit={isFullscreen}
              />
            )
          ) : (
            <CanvasEditor />
          )}
        </div>

        {/* Right panels (editor mode only) */}
        {!isRuntime && (
          <div style={{ width: 270, display: 'flex', flexDirection: 'column', gap: 4, padding: 4, overflow: 'auto' }}>
            {/* Tab switcher */}
            <div style={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
              <TabBtn active={rightPanel === 'properties'} onClick={() => setRightPanel('properties')}>
                Properties
              </TabBtn>
              <TabBtn active={rightPanel === 'bindings'} onClick={() => setRightPanel('bindings')}>
                Bindings
              </TabBtn>
              <TabBtn active={rightPanel === 'actions'} onClick={() => setRightPanel('actions')}>
                Actions
              </TabBtn>
              <TabBtn active={rightPanel === 'events'} onClick={() => setRightPanel('events')}>
                Events
              </TabBtn>
            </div>

            {rightPanel === 'properties' && <PropertyPanelV2 />}
            {rightPanel === 'bindings' && <BindingPanelV2 />}
            {rightPanel === 'actions' && <ActionPanelV2 />}
            {rightPanel === 'events' && <EventActionEditor />}
            <PageManagerPanel />
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

      {/* Widget Editor Dialog */}
      <WidgetEditorDialog
        open={widgetEditorOpen}
        onClose={() => setWidgetEditorOpen(false)}
        editWidget={editingWidget}
        onSaved={() => {
          // Library panel will auto-refresh on next render
        }}
      />
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
