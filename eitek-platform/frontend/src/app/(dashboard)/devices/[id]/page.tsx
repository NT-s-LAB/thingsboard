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

type TabKey = 'details' | 'attributes' | 'telemetry' | 'alarms' | 'events' | 'relations' | 'audit-logs';

const tabs: { key: TabKey; label: string; icon: string }[] = [
  { key: 'details', label: 'Details', icon: '📋' },
  { key: 'attributes', label: 'Attributes', icon: '🏷️' },
  { key: 'telemetry', label: 'Telemetry', icon: '📊' },
  { key: 'alarms', label: 'Alarms', icon: '🔔' },
  { key: 'events', label: 'Events', icon: '📝' },
  { key: 'relations', label: 'Relations', icon: '🔗' },
  { key: 'audit-logs', label: 'Audit Logs', icon: '📜' },
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
                whitespace-nowrap pb-4 px-1 border-b-2 font-medium text-sm transition-colors
                ${activeTab === tab.key
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }
              `}
            >
              <span className="mr-1.5">{tab.icon}</span>
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
