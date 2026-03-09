'use client';

import React, { useEffect, useState } from 'react';
import { ScadaEditorV2 } from '@/features/scada/engine/editor/ScadaEditorV2';
import { screenService } from '@/features/scada/services/screenService';
import { LoadingSpinner } from '@/shared/components/ui/LoadingSpinner';
import type { ScreenDefinition } from '@/features/scada/core/types';

interface ScadaV2PageProps {
  params: {
    id: string;
  };
}

const ScadaV2Page: React.FC<ScadaV2PageProps> = ({ params }) => {
  const [screen, setScreen] = useState<ScreenDefinition | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (params.id === 'new') {
      // Create a blank screen for new designs
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
      return;
    }

    setLoading(true);
    setError(null);
    screenService
      .getById(params.id)
      .then((data) => {
        setScreen(data);
      })
      .catch((err) => {
        setError(err?.message ?? 'Failed to load screen');
      })
      .finally(() => {
        setLoading(false);
      });
  }, [params.id]);

  const handleSave = async (updated: ScreenDefinition) => {
    try {
      if (params.id === 'new') {
        const created = await screenService.create({ ...updated, name: updated.name || 'Untitled' });
        setScreen(created);
        // Update URL without full reload
        window.history.replaceState(null, '', `/scada/${created.id}`);
      } else {
        const saved = await screenService.saveScreen(updated);
        setScreen(saved);
      }
    } catch (err: any) {
      console.error('Save failed:', err);
    }
  };

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
        <span style={{ color: '#EF4444', fontSize: 16 }}>⚠ {error}</span>
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
      />
    </div>
  );
};

export default ScadaV2Page;
