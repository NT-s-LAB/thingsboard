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
}

/**
 * Hook to subscribe to real-time device status updates for the device list page.
 * Joins the global 'devices:list' room to get status updates for all devices.
 */
export function useDevicesListRealtime({ onStatus }: UseDevicesListRealtimeOptions) {
  const { subscribe, unsubscribe, emit, connected } = useWebSocket();

  const onStatusRef = useRef(onStatus);
  onStatusRef.current = onStatus;

  const handleStatus = useCallback((data: DeviceStatusEvent) => {
    onStatusRef.current?.(data);
  }, []);

  useEffect(() => {
    if (!connected) return;

    // Join global device-list room
    emit('subscribe:devices:list', {});

    subscribe('device:status', handleStatus);

    return () => {
      emit('unsubscribe:devices:list', {});
      unsubscribe('device:status', handleStatus);
    };
  }, [connected, emit, subscribe, unsubscribe, handleStatus]);

  return { connected };
}
