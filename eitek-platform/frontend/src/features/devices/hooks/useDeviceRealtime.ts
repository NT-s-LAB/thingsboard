'use client';

import { useEffect, useCallback, useRef } from 'react';
import { useWebSocket } from '@/shared/components/providers/WebSocketProvider';

interface TelemetryEvent {
  deviceId: string;
  data: Record<string, Array<{ ts: number; value: string }>>;
  timestamp: string;
}

interface DeviceStatusEvent {
  deviceId: string;
  status: {
    isOnline: boolean;
    lastActivityTime?: number;
    lastSeen?: string;
  };
  timestamp: string;
}

interface UseDeviceRealtimeOptions {
  deviceId: string;
  onTelemetry?: (data: TelemetryEvent) => void;
  onStatus?: (data: DeviceStatusEvent) => void;
}

/**
 * Hook to subscribe to real-time WebSocket updates for a single device.
 * Joins the device room on mount, leaves on unmount.
 */
export function useDeviceRealtime({ deviceId, onTelemetry, onStatus }: UseDeviceRealtimeOptions) {
  const { subscribe, unsubscribe, emit, connected } = useWebSocket();

  // Keep stable refs for callbacks to avoid re-subscribing on every render
  const onTelemetryRef = useRef(onTelemetry);
  onTelemetryRef.current = onTelemetry;
  const onStatusRef = useRef(onStatus);
  onStatusRef.current = onStatus;

  const handleTelemetry = useCallback((data: TelemetryEvent) => {
    if (data.deviceId === deviceId) {
      onTelemetryRef.current?.(data);
    }
  }, [deviceId]);

  const handleStatus = useCallback((data: DeviceStatusEvent) => {
    if (data.deviceId === deviceId) {
      onStatusRef.current?.(data);
    }
  }, [deviceId]);

  useEffect(() => {
    if (!connected || !deviceId) return;

    // Join device room
    emit('subscribe:device', { deviceId });

    // Subscribe to events
    subscribe('telemetry', handleTelemetry);
    subscribe('device:status', handleStatus);

    return () => {
      // Leave device room
      emit('unsubscribe:device', { deviceId });

      // Unsubscribe from events
      unsubscribe('telemetry', handleTelemetry);
      unsubscribe('device:status', handleStatus);
    };
  }, [connected, deviceId, emit, subscribe, unsubscribe, handleTelemetry, handleStatus]);

  return { connected };
}

interface UseDevicesListRealtimeOptions {
  onStatus?: (data: DeviceStatusEvent) => void;
  /** Scope to a specific project (recommended for scalability) */
  projectId?: string;
  /** Scope to a specific area (more granular than project) */
  areaId?: string;
}

/**
 * Hook to subscribe to real-time device status updates for the device list page.
 * 
 * For scalability (1000+ devices), use scoped subscriptions:
 * - projectId: Subscribe only to devices in a specific project
 * - areaId: Subscribe only to devices in a specific area
 * 
 * If neither is provided, falls back to global 'devices:list' room (not recommended for large deployments).
 */
export function useDevicesListRealtime({ onStatus, projectId, areaId }: UseDevicesListRealtimeOptions) {
  const { subscribe, unsubscribe, emit, connected } = useWebSocket();

  const onStatusRef = useRef(onStatus);
  onStatusRef.current = onStatus;

  const handleStatus = useCallback((data: DeviceStatusEvent) => {
    onStatusRef.current?.(data);
  }, []);

  useEffect(() => {
    if (!connected) return;

    // Use scoped rooms for better scalability
    if (areaId) {
      emit('subscribe:devices:area', { areaId });
    } else if (projectId) {
      emit('subscribe:devices:project', { projectId });
    } else {
      // Fallback to global room (not recommended for large deployments)
      emit('subscribe:devices:list', {});
    }

    subscribe('device:status', handleStatus);

    return () => {
      if (areaId) {
        emit('unsubscribe:devices:area', { areaId });
      } else if (projectId) {
        emit('unsubscribe:devices:project', { projectId });
      } else {
        emit('unsubscribe:devices:list', {});
      }
      unsubscribe('device:status', handleStatus);
    };
  }, [connected, emit, subscribe, unsubscribe, handleStatus, projectId, areaId]);

  return { connected };
}

interface UseAreaRealtimeOptions {
  areaId: string;
  onTelemetry?: (data: TelemetryEvent) => void;
  onStatus?: (data: DeviceStatusEvent) => void;
  onAlarm?: (data: { areaId: string; alarm: unknown; timestamp: string }) => void;
}

/**
 * Hook to subscribe to real-time updates for all devices in an area.
 * More efficient than subscribing to each device individually.
 */
export function useAreaRealtime({ areaId, onTelemetry, onStatus, onAlarm }: UseAreaRealtimeOptions) {
  const { subscribe, unsubscribe, emit, connected } = useWebSocket();

  const onTelemetryRef = useRef(onTelemetry);
  onTelemetryRef.current = onTelemetry;
  const onStatusRef = useRef(onStatus);
  onStatusRef.current = onStatus;
  const onAlarmRef = useRef(onAlarm);
  onAlarmRef.current = onAlarm;

  const handleTelemetry = useCallback((data: TelemetryEvent) => {
    onTelemetryRef.current?.(data);
  }, []);

  const handleStatus = useCallback((data: DeviceStatusEvent) => {
    onStatusRef.current?.(data);
  }, []);

  const handleAlarm = useCallback((data: { areaId: string; alarm: unknown; timestamp: string }) => {
    if (data.areaId === areaId) {
      onAlarmRef.current?.(data);
    }
  }, [areaId]);

  useEffect(() => {
    if (!connected || !areaId) return;

    emit('subscribe:area', { areaId });

    subscribe('telemetry', handleTelemetry);
    subscribe('device:status', handleStatus);
    subscribe('alarm', handleAlarm);

    return () => {
      emit('unsubscribe:area', { areaId });
      unsubscribe('telemetry', handleTelemetry);
      unsubscribe('device:status', handleStatus);
      unsubscribe('alarm', handleAlarm);
    };
  }, [connected, areaId, emit, subscribe, unsubscribe, handleTelemetry, handleStatus, handleAlarm]);

  return { connected };
}

interface UseProjectRealtimeOptions {
  projectId: string;
  onTelemetry?: (data: TelemetryEvent) => void;
  onStatus?: (data: DeviceStatusEvent) => void;
}

/**
 * Hook to subscribe to real-time updates for all devices in a project.
 * Use this for project overview pages or dashboards.
 */
export function useProjectRealtime({ projectId, onTelemetry, onStatus }: UseProjectRealtimeOptions) {
  const { subscribe, unsubscribe, emit, connected } = useWebSocket();

  const onTelemetryRef = useRef(onTelemetry);
  onTelemetryRef.current = onTelemetry;
  const onStatusRef = useRef(onStatus);
  onStatusRef.current = onStatus;

  const handleTelemetry = useCallback((data: TelemetryEvent) => {
    onTelemetryRef.current?.(data);
  }, []);

  const handleStatus = useCallback((data: DeviceStatusEvent) => {
    onStatusRef.current?.(data);
  }, []);

  useEffect(() => {
    if (!connected || !projectId) return;

    emit('subscribe:project', { projectId });

    subscribe('telemetry', handleTelemetry);
    subscribe('device:status', handleStatus);

    return () => {
      emit('unsubscribe:project', { projectId });
      unsubscribe('telemetry', handleTelemetry);
      unsubscribe('device:status', handleStatus);
    };
  }, [connected, projectId, emit, subscribe, unsubscribe, handleTelemetry, handleStatus]);

  return { connected };
}
