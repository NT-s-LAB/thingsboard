'use client';

import { useEffect, useCallback, useRef, useState } from 'react';
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

interface SubscriptionError {
  message: string;
  code?: string;
}

interface UseDeviceRealtimeOptions {
  deviceId: string;
  onTelemetry?: (data: TelemetryEvent) => void;
  onStatus?: (data: DeviceStatusEvent) => void;
  onError?: (error: SubscriptionError) => void;
}

/**
 * Hook to subscribe to real-time WebSocket updates for a single device.
 * Joins the device room on mount, leaves on unmount.
 */
export function useDeviceRealtime({ deviceId, onTelemetry, onStatus, onError }: UseDeviceRealtimeOptions) {
  const { subscribe, unsubscribe, emit, connected, authenticated } = useWebSocket();
  const [subscribed, setSubscribed] = useState(false);
  const [error, setError] = useState<SubscriptionError | null>(null);

  // Keep stable refs for callbacks to avoid re-subscribing on every render
  const onTelemetryRef = useRef(onTelemetry);
  onTelemetryRef.current = onTelemetry;
  const onStatusRef = useRef(onStatus);
  onStatusRef.current = onStatus;
  const onErrorRef = useRef(onError);
  onErrorRef.current = onError;

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

  const handleError = useCallback((err: SubscriptionError) => {
    // Check if error is related to this device subscription
    if (err.message?.includes(deviceId) || err.message?.includes('Access denied')) {
      setError(err);
      setSubscribed(false);
      onErrorRef.current?.(err);
    }
  }, [deviceId]);

  useEffect(() => {
    // Only subscribe when authenticated
    if (!connected || !authenticated || !deviceId) {
      setSubscribed(false);
      return;
    }

    // Join device room
    emit('subscribe:device', { deviceId });
    setSubscribed(true);
    setError(null);

    // Subscribe to events
    subscribe('telemetry', handleTelemetry);
    subscribe('device:status', handleStatus);
    subscribe('exception', handleError);

    return () => {
      // Leave device room
      emit('unsubscribe:device', { deviceId });
      setSubscribed(false);

      // Unsubscribe from events
      unsubscribe('telemetry', handleTelemetry);
      unsubscribe('device:status', handleStatus);
      unsubscribe('exception', handleError);
    };
  }, [connected, authenticated, deviceId, emit, subscribe, unsubscribe, handleTelemetry, handleStatus, handleError]);

  return { connected, authenticated, subscribed, error };
}

interface UseDevicesListRealtimeOptions {
  onStatus?: (data: DeviceStatusEvent) => void;
  onError?: (error: SubscriptionError) => void;
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
export function useDevicesListRealtime({ onStatus, onError, projectId, areaId }: UseDevicesListRealtimeOptions) {
  const { subscribe, unsubscribe, emit, connected, authenticated } = useWebSocket();
  const [subscribed, setSubscribed] = useState(false);
  const [error, setError] = useState<SubscriptionError | null>(null);

  const onStatusRef = useRef(onStatus);
  onStatusRef.current = onStatus;
  const onErrorRef = useRef(onError);
  onErrorRef.current = onError;

  const handleStatus = useCallback((data: DeviceStatusEvent) => {
    onStatusRef.current?.(data);
  }, []);

  const handleError = useCallback((err: SubscriptionError) => {
    if (err.message?.includes('Access denied')) {
      setError(err);
      setSubscribed(false);
      onErrorRef.current?.(err);
    }
  }, []);

  useEffect(() => {
    if (!connected || !authenticated) {
      setSubscribed(false);
      return;
    }

    // Use scoped rooms for better scalability
    if (areaId) {
      emit('subscribe:devices:area', { areaId });
    } else if (projectId) {
      emit('subscribe:devices:project', { projectId });
    } else {
      // Fallback to global room (not recommended for large deployments)
      emit('subscribe:devices:list', {});
    }

    setSubscribed(true);
    setError(null);
    subscribe('device:status', handleStatus);
    subscribe('exception', handleError);

    return () => {
      if (areaId) {
        emit('unsubscribe:devices:area', { areaId });
      } else if (projectId) {
        emit('unsubscribe:devices:project', { projectId });
      } else {
        emit('unsubscribe:devices:list', {});
      }
      setSubscribed(false);
      unsubscribe('device:status', handleStatus);
      unsubscribe('exception', handleError);
    };
  }, [connected, authenticated, emit, subscribe, unsubscribe, handleStatus, handleError, projectId, areaId]);

  return { connected, authenticated, subscribed, error };
}

interface UseAreaRealtimeOptions {
  areaId: string;
  onTelemetry?: (data: TelemetryEvent) => void;
  onStatus?: (data: DeviceStatusEvent) => void;
  onAlarm?: (data: { areaId: string; alarm: unknown; timestamp: string }) => void;
  onError?: (error: SubscriptionError) => void;
}

/**
 * Hook to subscribe to real-time updates for all devices in an area.
 * More efficient than subscribing to each device individually.
 */
export function useAreaRealtime({ areaId, onTelemetry, onStatus, onAlarm, onError }: UseAreaRealtimeOptions) {
  const { subscribe, unsubscribe, emit, connected, authenticated } = useWebSocket();
  const [subscribed, setSubscribed] = useState(false);
  const [error, setError] = useState<SubscriptionError | null>(null);

  const onTelemetryRef = useRef(onTelemetry);
  onTelemetryRef.current = onTelemetry;
  const onStatusRef = useRef(onStatus);
  onStatusRef.current = onStatus;
  const onAlarmRef = useRef(onAlarm);
  onAlarmRef.current = onAlarm;
  const onErrorRef = useRef(onError);
  onErrorRef.current = onError;

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

  const handleError = useCallback((err: SubscriptionError) => {
    if (err.message?.includes(areaId) || err.message?.includes('Access denied')) {
      setError(err);
      setSubscribed(false);
      onErrorRef.current?.(err);
    }
  }, [areaId]);

  useEffect(() => {
    if (!connected || !authenticated || !areaId) {
      setSubscribed(false);
      return;
    }

    emit('subscribe:area', { areaId });
    setSubscribed(true);
    setError(null);

    subscribe('telemetry', handleTelemetry);
    subscribe('device:status', handleStatus);
    subscribe('alarm', handleAlarm);
    subscribe('exception', handleError);

    return () => {
      emit('unsubscribe:area', { areaId });
      setSubscribed(false);
      unsubscribe('telemetry', handleTelemetry);
      unsubscribe('device:status', handleStatus);
      unsubscribe('alarm', handleAlarm);
      unsubscribe('exception', handleError);
    };
  }, [connected, authenticated, areaId, emit, subscribe, unsubscribe, handleTelemetry, handleStatus, handleAlarm, handleError]);

  return { connected, authenticated, subscribed, error };
}

interface UseProjectRealtimeOptions {
  projectId: string;
  onTelemetry?: (data: TelemetryEvent) => void;
  onStatus?: (data: DeviceStatusEvent) => void;
  onError?: (error: SubscriptionError) => void;
}

/**
 * Hook to subscribe to real-time updates for all devices in a project.
 * Use this for project overview pages or dashboards.
 */
export function useProjectRealtime({ projectId, onTelemetry, onStatus, onError }: UseProjectRealtimeOptions) {
  const { subscribe, unsubscribe, emit, connected, authenticated } = useWebSocket();
  const [subscribed, setSubscribed] = useState(false);
  const [error, setError] = useState<SubscriptionError | null>(null);

  const onTelemetryRef = useRef(onTelemetry);
  onTelemetryRef.current = onTelemetry;
  const onStatusRef = useRef(onStatus);
  onStatusRef.current = onStatus;
  const onErrorRef = useRef(onError);
  onErrorRef.current = onError;

  const handleTelemetry = useCallback((data: TelemetryEvent) => {
    onTelemetryRef.current?.(data);
  }, []);

  const handleStatus = useCallback((data: DeviceStatusEvent) => {
    onStatusRef.current?.(data);
  }, []);

  const handleError = useCallback((err: SubscriptionError) => {
    if (err.message?.includes(projectId) || err.message?.includes('Access denied')) {
      setError(err);
      setSubscribed(false);
      onErrorRef.current?.(err);
    }
  }, [projectId]);

  useEffect(() => {
    if (!connected || !authenticated || !projectId) {
      setSubscribed(false);
      return;
    }

    emit('subscribe:project', { projectId });
    setSubscribed(true);
    setError(null);

    subscribe('telemetry', handleTelemetry);
    subscribe('device:status', handleStatus);
    subscribe('exception', handleError);

    return () => {
      emit('unsubscribe:project', { projectId });
      setSubscribed(false);
      unsubscribe('telemetry', handleTelemetry);
      unsubscribe('device:status', handleStatus);
      unsubscribe('exception', handleError);
    };
  }, [connected, authenticated, projectId, emit, subscribe, unsubscribe, handleTelemetry, handleStatus, handleError]);

  return { connected, authenticated, subscribed, error };
}
