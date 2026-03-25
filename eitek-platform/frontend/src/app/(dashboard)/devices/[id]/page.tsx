'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { deviceService } from '@/features/devices/services/deviceService';
import { LoadingSpinner } from '@/shared/components/ui/LoadingSpinner';
import { Button } from '@/shared/components/ui/Button';
import { Badge } from '@/shared/components/ui/Badge';
import type { Device, DeviceCredentials } from '@/features/devices/types';
import { getDeviceStatus, getDeviceTypeName } from '@/features/devices/types';
import { DeviceDetailsTab } from '@/features/devices/components/tabs/DeviceDetailsTab';
import { DeviceAttributesTab } from '@/features/devices/components/tabs/DeviceAttributesTab';
import { DeviceTelemetryTab } from '@/features/devices/components/tabs/DeviceTelemetryTab';
import { DeviceAlarmsTab } from '@/features/devices/components/tabs/DeviceAlarmsTab';
import { DeviceEventsTab } from '@/features/devices/components/tabs/DeviceEventsTab';
import { DeviceRelationsTab } from '@/features/devices/components/tabs/DeviceRelationsTab';
import { DeviceAuditLogsTab } from '@/features/devices/components/tabs/DeviceAuditLogsTab';
import { DeviceScadaTab } from '@/features/device-scada/components/DeviceScadaTab';
import { useDeviceRealtime } from '@/features/devices/hooks/useDeviceRealtime';

type TabKey = 'details' | 'scada' | 'attributes' | 'telemetry' | 'alarms' | 'events' | 'relations' | 'audit-logs';

// SVG Icons for tabs
const TabIcons: Record<string, React.ReactNode> = {
  details: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
  ),
  scada: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
    </svg>
  ),
  attributes: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
    </svg>
  ),
  telemetry: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
    </svg>
  ),
  alarms: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
    </svg>
  ),
  events: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
    </svg>
  ),
  relations: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
    </svg>
  ),
  'audit-logs': (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2zM12 3v6a1 1 0 001 1h6" />
    </svg>
  ),
};

const tabs: { key: TabKey; label: string }[] = [
  { key: 'details', label: 'Details' },
  { key: 'scada', label: 'SCADA' },
  { key: 'attributes', label: 'Attributes' },
  { key: 'telemetry', label: 'Telemetry' },
  { key: 'alarms', label: 'Alarms' },
  { key: 'events', label: 'Events' },
  { key: 'relations', label: 'Relations' },
  { key: 'audit-logs', label: 'Audit Logs' },
];

const statusColors: Record<string, string> = {
  'Online': 'bg-green-100 text-green-800',
  'Offline': 'bg-red-100 text-red-800',
  'Error': 'bg-red-100 text-red-800',
  'Maintenance': 'bg-yellow-100 text-yellow-800',
  'Unknown': 'bg-gray-100 text-gray-800',
};

const DeviceDetailPage: React.FC = () => {
  const params = useParams();
  const router = useRouter();
  const deviceId = params.id as string;

  const [device, setDevice] = useState<Device | null>(null);
  const [credentials, setCredentials] = useState<DeviceCredentials | null>(null);
  const [activeTab, setActiveTab] = useState<TabKey>('details');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copySuccess, setCopySuccess] = useState(false);

  // Real-time WebSocket updates for device status
  const { connected: wsConnected } = useDeviceRealtime({
    deviceId,
    onStatus: useCallback((event) => {
      setDevice(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          isOnline: event.status.isOnline,
          ...(event.status.lastSeen ? { lastSeen: event.status.lastSeen } : {}),
        };
      });
    }, []),
  });

  const fetchDevice = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [dev, creds] = await Promise.all([
        deviceService.getDevice(deviceId),
        deviceService.getDeviceCredentials(deviceId).catch(() => null),
      ]);
      setDevice(dev);
      setCredentials(creds);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load device');
    } finally {
      setLoading(false);
    }
  }, [deviceId]);

  useEffect(() => {
    fetchDevice();
  }, [fetchDevice]);

  const handleCopyToken = async () => {
    if (credentials?.credentialsId) {
      await navigator.clipboard.writeText(credentials.credentialsId);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error || !device) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="text-red-600 mb-2">
            <svg className="w-12 h-12 mx-auto\" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-1">Error loading device</h3>
          <p className="text-gray-500 mb-4">{error}</p>
          <div className="space-x-2">
            <Button onClick={() => fetchDevice()}>Try Again</Button>
            <Button variant="outline" onClick={() => router.push('/devices')}>Back to Devices</Button>
          </div>
        </div>
      </div>
    );
  }

  const status = getDeviceStatus(device);
  const statusColor = statusColors[status] || 'bg-gray-100 text-gray-800';

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => router.push('/devices')}
            className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
          </button>
          <div>
            <div className="flex items-center space-x-3">
              <h1 className="text-2xl font-bold text-gray-900">{device.name}</h1>
              <Badge className={statusColor}>{status}</Badge>
              <Badge variant="secondary">{getDeviceTypeName(device)}</Badge>
              {wsConnected && (
                <span className="flex items-center space-x-1 text-xs text-green-600">
                  <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                  <span>Live</span>
                </span>
              )}
            </div>
            {device.description && (
              <p className="text-gray-600 mt-1">{device.description}</p>
            )}
          </div>
        </div>

        <div className="flex items-center space-x-3">
          {/* Copy Access Token */}
          {credentials && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleCopyToken}
              className="flex items-center space-x-1"
            >
              {copySuccess ? (
                <>
                  <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>Copied!</span>
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                  </svg>
                  <span>Copy Access Token</span>
                </>
              )}
            </Button>
          )}
          <Button variant="outline" size="sm" onClick={() => fetchDevice()}>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </Button>
        </div>
      </div>

      {/* Device info bar */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 text-sm">
          {device.area && (
            <div>
              <span className="text-gray-500 block">Area</span>
              <span className="font-medium">{device.area.name}</span>
            </div>
          )}
          {device.serialNumber && (
            <div>
              <span className="text-gray-500 block">Serial Number</span>
              <span className="font-medium">{device.serialNumber}</span>
            </div>
          )}
          {device.model && (
            <div>
              <span className="text-gray-500 block">Model</span>
              <span className="font-medium">{device.model}</span>
            </div>
          )}
          {device.firmware && (
            <div>
              <span className="text-gray-500 block">Firmware</span>
              <span className="font-medium">{device.firmware}</span>
            </div>
          )}
          {credentials && (
            <div>
              <span className="text-gray-500 block">Credentials Type</span>
              <span className="font-medium">{credentials.credentialsType}</span>
            </div>
          )}
          {device.lastSeen && (
            <div>
              <span className="text-gray-500 block">Last Activity</span>
              <span className="font-medium">{new Date(device.lastSeen).toLocaleString()}</span>
            </div>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`
                whitespace-nowrap pb-4 px-1 border-b-2 font-medium text-sm transition-colors flex items-center
                ${activeTab === tab.key
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }
              `}
            >
              <span className="mr-1.5">{TabIcons[tab.key]}</span>
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="bg-white rounded-lg border border-gray-200">
        {activeTab === 'details' && (
          <DeviceDetailsTab device={device} credentials={credentials} onRefresh={fetchDevice} />
        )}
        {activeTab === 'scada' && (
          <DeviceScadaTab deviceId={deviceId} />
        )}
        {activeTab === 'attributes' && (
          <DeviceAttributesTab deviceId={deviceId} />
        )}
        {activeTab === 'telemetry' && (
          <DeviceTelemetryTab deviceId={deviceId} />
        )}
        {activeTab === 'alarms' && (
          <DeviceAlarmsTab deviceId={deviceId} />
        )}
        {activeTab === 'events' && (
          <DeviceEventsTab deviceId={deviceId} />
        )}
        {activeTab === 'relations' && (
          <DeviceRelationsTab deviceId={deviceId} />
        )}
        {activeTab === 'audit-logs' && (
          <DeviceAuditLogsTab deviceId={deviceId} />
        )}
      </div>
    </div>
  );
};

export default DeviceDetailPage;
