'use client';

/**
 * SCADA Page — Unified route for View (runtime) and Edit (editor) modes.
 *
 * - Opening an existing screen → View mode (runtime) by default
 * - Creating a new screen (/scada/new) → Edit mode by default
 * - View mode shows RuntimeRenderer with a floating header + "Edit" button
 * - Edit mode shows the full ScadaEditorV2 with "Deploy" instead of "Save"
 */

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ScadaEditorV2 } from '@/features/scada/engine/editor/ScadaEditorV2';
import { RuntimeRenderer } from '@/features/scada/engine/runtime/RuntimeRenderer';
import { MultiPageRuntime } from '@/features/scada/engine/runtime/MultiPageRuntime';
import { screenService } from '@/features/scada/services/screenService';
import { LoadingSpinner } from '@/shared/components/ui/LoadingSpinner';
import { useScadaRuntimeStore } from '@/features/scada/stores/scadaRuntimeStore';
import { useScadaProjectStore } from '@/features/scada/stores/scadaProjectStore';
import { registerBuiltinWidgets } from '@/features/scada/widgets/definitions';
import { screenDefinitionToProject } from '@/features/scada/core/migrations/projectMigration';
import { projectToScreenDefinition } from '@/features/scada/core/migrations/projectMigration';
import { createDefaultProject } from '@/features/scada/core/types/project.types';
import type { ScreenDefinition } from '@/features/scada/core/types';
import type { ScadaProject } from '@/features/scada/core/types/project.types';

// Ensure widget definitions are registered once
let widgetsRegistered = false;
function ensureWidgets() {
  if (!widgetsRegistered) {
    registerBuiltinWidgets();
    widgetsRegistered = true;
  }
}

interface ScadaPageProps {
  params: { id: string };
}

const ScadaPage: React.FC<ScadaPageProps> = ({ params }) => {
  const router = useRouter();
  const [screen, setScreen] = useState<ScreenDefinition | null>(null);
  const [project, setProject] = useState<ScadaProject | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [mode, setMode] = useState<'view' | 'edit'>(params.id === 'new' ? 'edit' : 'view');
  const [viewFullscreen, setViewFullscreen] = useState(false);

  const realIdRef = useRef<string | null>(null);
  const viewContainerRef = useRef<HTMLDivElement>(null);

  // ── Load screen data + initialize project store ──
  useEffect(() => {
    if (!params.id) return;

    if (params.id === 'new') {
      const newProject = createDefaultProject();
      const blank: ScreenDefinition = {
        id: newProject.id,
        version: 1,
        name: 'New SCADA Screen',
        description: '',
        canvasSize: { width: 1920, height: 1080 },
        background: { type: 'color', color: '#f8fafc' },
        layers: [{ id: 'default', name: 'Default', visible: true, locked: false, opacity: 1, order: 0 }],
        widgets: [],
        variables: [],
        metadata: {
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          createdBy: '',
          tags: [],
        },
      };
      setScreen(blank);
      setProject(newProject);
      useScadaProjectStore.getState().loadProject(newProject);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    screenService
      .getById(params.id)
      .then((data) => {
        setScreen(data);
        realIdRef.current = data.id;
        // Migrate to project model
        const proj = screenDefinitionToProject(data);
        setProject(proj);
        useScadaProjectStore.getState().loadProject(proj);
      })
      .catch((err) => setError(err?.message ?? 'Failed to load screen'))
      .finally(() => setLoading(false));
  }, [params.id]);

  // ── View mode: register widgets & load screen into runtime store ──
  useEffect(() => {
    if (mode === 'view' && screen) {
      ensureWidgets();
      useScadaRuntimeStore.getState().loadScreen(screen);
      useScadaRuntimeStore.getState().setRuntime(true);
    }
  }, [mode, screen]);

  // ── Track fullscreen changes for view mode ──
  useEffect(() => {
    const onFsChange = () => setViewFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', onFsChange);
    return () => document.removeEventListener('fullscreenchange', onFsChange);
  }, []);

  // ── Warn user about unsaved changes on page unload ──
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      const isDirty = useScadaProjectStore.getState().isDirty;
      if (isDirty && mode === 'edit') {
        e.preventDefault();
        // Modern browsers ignore custom messages but require returnValue
        e.returnValue = 'You have unsaved changes. Are you sure you want to leave?';
        return e.returnValue;
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [mode]);

  // ── Deploy handler — saves project as ScreenDefinition to backend ──
  const handleDeploy = useCallback(async (updated: ScreenDefinition) => {
    setSaveStatus('saving');
    try {
      // Get the latest project state and serialize to ScreenDefinition
      const currentProject = useScadaProjectStore.getState().project;
      const screenToSave = currentProject
        ? projectToScreenDefinition(currentProject)
        : updated;

      const isNew = params.id === 'new' && !realIdRef.current;
      if (isNew) {
        const created = await screenService.create({ ...screenToSave, name: screenToSave.name || 'Untitled' });
        realIdRef.current = created.id;
        window.history.replaceState(null, '', `/scada/${created.id}`);
      } else {
        const saveId = realIdRef.current ?? screenToSave.id;
        await screenService.saveScreen({ ...screenToSave, id: saveId });
      }
      useScadaProjectStore.getState().setDirty(false);
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 2000);
    } catch (err: unknown) {
      console.error('Deploy failed:', err);
      setSaveStatus('error');
      setTimeout(() => setSaveStatus('idle'), 3000);
    }
  }, [params.id]);

  // ── Mode switch handlers ──
  const switchToEdit = useCallback(() => {
    useScadaRuntimeStore.getState().setRuntime(false);
    setMode('edit');
  }, []);

  const switchToView = useCallback(() => {
    // Warn about unsaved changes
    const isDirty = useScadaProjectStore.getState().isDirty;
    if (isDirty) {
      const confirmed = window.confirm('You have unsaved changes. Switch to View mode anyway? (Your changes will still be kept in memory until you close the page.)');
      if (!confirmed) return;
    }
    // Sync latest project state for the runtime view
    const currentProject = useScadaProjectStore.getState().project;
    if (currentProject) setProject(currentProject);
    const currentScreen = useScadaRuntimeStore.getState().screen;
    if (currentScreen) setScreen(currentScreen);
    useScadaRuntimeStore.getState().setRuntime(true);
    setMode('view');
  }, []);

  const toggleViewFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      viewContainerRef.current?.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  }, []);

  const handleGoBack = useCallback(() => {
    const isDirty = useScadaProjectStore.getState().isDirty;
    if (isDirty && mode === 'edit') {
      const confirmed = window.confirm('You have unsaved changes. Are you sure you want to leave without saving?');
      if (!confirmed) return;
    }
    router.back();
  }, [router, mode]);

  // ── Loading state ──
  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
        <LoadingSpinner />
      </div>
    );
  }

  // ── Error state ──
  if (error) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', flexDirection: 'column', gap: 12 }}>
        <span style={{ color: '#EF4444', fontSize: 16 }}>{error}</span>
        <button
          onClick={() => window.location.reload()}
          style={{ padding: '8px 16px', borderRadius: 6, border: '1px solid #d1d5db', cursor: 'pointer' }}
        >
          Retry
        </button>
      </div>
    );
  }

  // ══════════════════════════════════════════════════════════════════
  //  VIEW MODE — Runtime viewer with floating header
  // ══════════════════════════════════════════════════════════════════
  if (mode === 'view' && screen) {
    // Use the canvas background color for the surrounding area
    const canvasBg = screen.background?.type === 'color' && screen.background.color
      ? screen.background.color
      : '#f8fafc';

    return (
      <div
        ref={viewContainerRef}
        style={{ height: '100vh', width: '100%', position: 'relative', overflow: 'hidden', background: canvasBg }}
      >
        {/* Floating header */}
        {!viewFullscreen && (
          <ViewModeHeader
            screenName={screen.name}
            onBack={handleGoBack}
            onEdit={switchToEdit}
            onFullscreen={toggleViewFullscreen}
          />
        )}

        {/* Runtime renderer — multi-page or single-page fallback */}
        <div style={{
          width: '100%',
          height: viewFullscreen ? '100%' : 'calc(100% - 52px)',
          marginTop: viewFullscreen ? 0 : 52,
        }}>
          {project ? (
            <MultiPageRuntime project={project} autoFit />
          ) : (
            <RuntimeRenderer screenId={screen.id} screen={screen} autoFit />
          )}
        </div>

        {/* Fullscreen exit button */}
        {viewFullscreen && (
          <button
            onClick={toggleViewFullscreen}
            style={{
              position: 'fixed', top: 16, right: 16, zIndex: 10000,
              background: 'rgba(0,0,0,0.6)', color: '#fff', border: 'none',
              padding: '8px 16px', borderRadius: 8, fontSize: 12, fontWeight: 500,
              cursor: 'pointer', backdropFilter: 'blur(8px)',
              opacity: 0.7, transition: 'opacity 0.2s',
            }}
            onMouseEnter={(e) => { (e.target as HTMLElement).style.opacity = '1'; }}
            onMouseLeave={(e) => { (e.target as HTMLElement).style.opacity = '0.7'; }}
          >
            ✕ Exit Fullscreen
          </button>
        )}
      </div>
    );
  }

  // ══════════════════════════════════════════════════════════════════
  //  EDIT MODE — Full SCADA editor with Deploy
  // ══════════════════════════════════════════════════════════════════
  return (
    <div style={{ height: '100vh', width: '100%', overflow: 'hidden' }}>
      <ScadaEditorV2
        {...(screen ? { screen } : {})}
        onSave={handleDeploy}
        saveStatus={saveStatus}
        onExitEdit={params.id !== 'new' ? switchToView : undefined}
      />
    </div>
  );
};

// ─── View Mode Header ────────────────────────────────────────────────────────

const ViewModeHeader: React.FC<{
  screenName: string;
  onBack: () => void;
  onEdit: () => void;
  onFullscreen: () => void;
}> = ({ screenName, onBack, onEdit, onFullscreen }) => (
  <div
    style={{
      position: 'absolute', top: 0, left: 0, right: 0, zIndex: 100,
      height: 52,
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '0 16px',
      background: 'rgba(15, 23, 42, 0.92)',
      backdropFilter: 'blur(16px)',
      borderBottom: '1px solid rgba(255,255,255,0.06)',
    }}
  >
    {/* Left: Back + title + status */}
    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
      <HeaderBtn onClick={onBack}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M19 12H5M12 19l-7-7 7-7" />
        </svg>
        <span>Back</span>
      </HeaderBtn>

      <div style={{ width: 1, height: 24, background: 'rgba(255,255,255,0.1)' }} />

      <div>
        <h2 style={{ color: '#f1f5f9', fontSize: 14, fontWeight: 600, margin: 0, lineHeight: 1.2 }}>
          {screenName}
        </h2>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 3 }}>
          <span style={{
            width: 6, height: 6, borderRadius: '50%',
            background: '#10b981',
            boxShadow: '0 0 8px rgba(16,185,129,0.6)',
            animation: 'pulse 2s ease-in-out infinite',
          }} />
          <span style={{
            color: '#64748b', fontSize: 10, fontWeight: 600,
            letterSpacing: '0.08em', textTransform: 'uppercase',
          }}>
            Runtime Active
          </span>
        </div>
      </div>
    </div>

    {/* Right: Edit + Fullscreen */}
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <button
        onClick={onEdit}
        style={{
          display: 'flex', alignItems: 'center', gap: 6,
          padding: '7px 16px', borderRadius: 8,
          background: 'linear-gradient(135deg, rgba(59,130,246,0.2), rgba(99,102,241,0.2))',
          border: '1px solid rgba(99,102,241,0.35)',
          color: '#818cf8', fontSize: 12, fontWeight: 600, cursor: 'pointer',
          transition: 'all 0.2s ease',
        }}
        onMouseEnter={(e) => {
          const el = e.currentTarget;
          el.style.background = 'linear-gradient(135deg, rgba(59,130,246,0.35), rgba(99,102,241,0.35))';
          el.style.color = '#a5b4fc';
          el.style.borderColor = 'rgba(99,102,241,0.5)';
        }}
        onMouseLeave={(e) => {
          const el = e.currentTarget;
          el.style.background = 'linear-gradient(135deg, rgba(59,130,246,0.2), rgba(99,102,241,0.2))';
          el.style.color = '#818cf8';
          el.style.borderColor = 'rgba(99,102,241,0.35)';
        }}
      >
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
        </svg>
        Edit
      </button>

      <HeaderBtn onClick={onFullscreen} title="Fullscreen">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3" />
        </svg>
      </HeaderBtn>
    </div>
  </div>
);

// ─── Header Button (dark glass style) ────────────────────────────────────────

const HeaderBtn: React.FC<{
  onClick: () => void;
  title?: string;
  children: React.ReactNode;
}> = ({ onClick, title, children }) => (
  <button
    onClick={onClick}
    title={title}
    style={{
      display: 'flex', alignItems: 'center', gap: 6,
      padding: '6px 12px', borderRadius: 6,
      background: 'rgba(255,255,255,0.06)',
      border: '1px solid rgba(255,255,255,0.1)',
      color: '#94a3b8', fontSize: 12, fontWeight: 500,
      cursor: 'pointer', transition: 'all 0.15s ease',
    }}
    onMouseEnter={(e) => {
      const el = e.currentTarget;
      el.style.background = 'rgba(255,255,255,0.12)';
      el.style.color = '#e2e8f0';
    }}
    onMouseLeave={(e) => {
      const el = e.currentTarget;
      el.style.background = 'rgba(255,255,255,0.06)';
      el.style.color = '#94a3b8';
    }}
  >
    {children}
  </button>
);

export default ScadaPage;