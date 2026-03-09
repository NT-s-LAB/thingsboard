/**
 * @deprecated V1 SCADA — This file belongs to the legacy V1 engine (Konva-based).
 * Replaced by V2 engine in /engine/ and /core/. Scheduled for removal.
 */
'use client';

import dynamic from 'next/dynamic';
import { ComponentType } from 'react';

// Dynamically import the ScadaCanvas with no SSR
const ScadaCanvas = dynamic(
  () => import('./ScadaCanvas').then(mod => ({ default: mod.ScadaCanvas })),
  {
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center w-full h-full">
        <div className="text-gray-500">Loading SCADA Canvas...</div>
      </div>
    ),
  }
) as ComponentType<{ width: number; height: number }>;

interface ScadaCanvasWrapperProps {
  width: number;
  height: number;
}

export function ScadaCanvasWrapper({ width, height }: ScadaCanvasWrapperProps) {
  return <ScadaCanvas width={width} height={height} />;
}