'use client';

/**
 * SCADA Editor Page - V2 Engine (unified route).
 *
 * Uses the V2 ScadaEditorV2 component backed by:
 *   - WidgetRegistry for rendering
 *   - ScreenDefinition as the data model
 *   - screenService for API operations (maps to backend ScadaView model)
 */

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ScadaEditorV2 } from '@/features/scada/engine/editor/ScadaEditorV2';
import { screenService } from '@/features/scada/services/screenService';
import { LoadingSpinner } from '@/shared/components/ui/LoadingSpinner';
import type { ScreenDefinition } from '@/features/scada/core/types';

interface ScadaEditorPageProps {
  params: {
    id: string;
  };
}

const ScadaEditorPage: React.FC<ScadaEditorPageProps> = ({ params }) => {
  const [screen, setScreen] = useState<ScreenDefinition | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  // Track whether this is the initial load vs. a save response
  const isInitialLoad = useRef(true);
  const realIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (!params.id) return;

    if (params.id === 'new') {
      const blank: ScreenDefinition = {
        id: `screen_${Date.now()}`,
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
      setLoading(false);
      isInitialLoad.current = true;
      return;
    }

    setLoading(true);
    setError(null);
    isInitialLoad.current = true;
    screenService
      .getById(params.id)
      .then((data) => {
        setScreen(data);
        realIdRef.current = data.id;
      })
      .catch((err) => setError(err?.message ?? 'Failed to load screen'))
      .finally(() => setLoading(false));
  }, [params.id]);

  const handleSave = useCallback(async (updated: ScreenDefinition) => {
    setSaveStatus('saving');
    try {
      const isNew = params.id === 'new' && !realIdRef.current;
      if (isNew) {
        const created = await screenService.create({ ...updated, name: updated.name || 'Untitled' });
        realIdRef.current = created.id;
        // Don't set screen — keep store state. Only update URL.
        window.history.replaceState(null, '', `/scada/${created.id}`);
      } else {
        const saveId = realIdRef.current ?? updated.id;
        await screenService.saveScreen({ ...updated, id: saveId });
        // Don't set screen — the store already has the correct state
      }
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 2000);
    } catch (err: any) {
      console.error('Save failed:', err);
      setSaveStatus('error');
      setTimeout(() => setSaveStatus('idle'), 3000);
    }
  }, [params.id]);

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
        <LoadingSpinner />
      </div>
    );
  }

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

  return (
    <div style={{ height: '100vh', width: '100%', overflow: 'hidden' }}>
      <ScadaEditorV2
        {...(screen ? { screen } : {})}
        onSave={handleSave}
        saveStatus={saveStatus}
      />
    </div>
  );
};

export default ScadaEditorPage;