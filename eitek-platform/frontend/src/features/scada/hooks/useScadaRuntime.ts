'use client';

import { useEffect, useRef, useCallback, useMemo } from 'react';
import { useWebSocket } from '@/shared/components/providers/WebSocketProvider';
import { useScadaStore } from '../stores/scadaStore';
import { deviceService } from '@/features/devices/services/deviceService';
import type { Widget } from '../types';

interface TelemetryEvent {
  deviceId: string;
  data: Record<string, Array<{ ts: number; value: string }>>;
  timestamp: string;
}

/**
 * Collect all unique device IDs from widget data bindings.
 */
function collectDeviceIds(widgets: Widget[]): string[] {
  const ids = new Set<string>();
  for (const w of widgets) {
    for (const b of w.dataBindings ?? []) {
      // Treat missing entityType as 'DEVICE' (default)
      if ((!b.entityType || b.entityType === 'DEVICE') && b.entityId) {
        ids.add(b.entityId);
      }
    }
  }
  return Array.from(ids).sort();
}

/**
 * Hook that manages real-time telemetry subscriptions for all devices
 * used in the current SCADA dashboard when runtime mode is active.
 *
 * - Subscribes via WebSocket for live telemetry pushes
 * - Falls back to HTTP polling every 5 s when WebSocket isn't connected
 * - Stores incoming data in the Zustand store via `updateRealtimeData`
 */
export function useScadaRuntime() {
  const { subscribe, unsubscribe, emit, connected } = useWebSocket();
  const {
    isRuntimeMode,
    currentDashboard,
    updateRealtimeData,
  } = useScadaStore();

  const subscribedRef = useRef<string[]>([]);
  const pollTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Stabilize: only recompute device IDs when bindings actually change
  const deviceIds = useMemo(() => {
    if (!currentDashboard) return [];
    return collectDeviceIds(currentDashboard.widgets ?? []);
  }, [currentDashboard]);

  const deviceIdsKey = deviceIds.join(',');

  // Handle incoming WebSocket telemetry
  const handleTelemetry = useCallback(
    (event: TelemetryEvent) => {
      if (!event.deviceId || !event.data) return;

      // Flatten first value of each key for easy widget consumption
      const flat: Record<string, any> = {};
      for (const [key, values] of Object.entries(event.data)) {
        if (Array.isArray(values) && values.length > 0) {
          flat[key] = values[0]!.value;
        }
      }
      updateRealtimeData(event.deviceId, flat);
    },
    [updateRealtimeData],
  );

  // Fetch latest telemetry via HTTP (fallback / initial load)
  const fetchTelemetry = useCallback(
    async (ids: string[]) => {
      for (const deviceId of ids) {
        try {
          const telemetry = await deviceService.getDeviceTelemetry(deviceId);
          if (telemetry && typeof telemetry === 'object') {
            const flat: Record<string, any> = {};
            for (const [key, values] of Object.entries(telemetry)) {
              if (Array.isArray(values) && values.length > 0) {
                flat[key] = (values[0] as any).value;
              } else {
                flat[key] = values;
              }
            }
            updateRealtimeData(deviceId, flat);
          }
        } catch {
          // Silently ignore – device might be offline
        }
      }
    },
    [updateRealtimeData],
  );

  useEffect(() => {
    if (!isRuntimeMode || deviceIds.length === 0) {
      // Cleanup if runtime stopped or no devices
      if (subscribedRef.current.length > 0) {
        for (const id of subscribedRef.current) {
          emit('unsubscribe:device', { deviceId: id });
        }
        subscribedRef.current = [];
      }
      if (pollTimerRef.current) {
        clearInterval(pollTimerRef.current);
        pollTimerRef.current = null;
      }
      return;
    }

    // --- Initial fetch ----
    fetchTelemetry(deviceIds);

    // --- WebSocket subscription ---
    if (connected) {
      subscribe('telemetry', handleTelemetry);
      for (const id of deviceIds) {
        emit('subscribe:device', { deviceId: id });
      }
      subscribedRef.current = deviceIds;
    }

    // --- HTTP polling fallback (every 5 s) ---
    pollTimerRef.current = setInterval(() => {
      fetchTelemetry(deviceIds);
    }, 5000);

    return () => {
      // Unsubscribe WebSocket
      unsubscribe('telemetry', handleTelemetry);
      for (const id of subscribedRef.current) {
        emit('unsubscribe:device', { deviceId: id });
      }
      subscribedRef.current = [];

      // Clear polling
      if (pollTimerRef.current) {
        clearInterval(pollTimerRef.current);
        pollTimerRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isRuntimeMode, deviceIdsKey, connected]);
}
