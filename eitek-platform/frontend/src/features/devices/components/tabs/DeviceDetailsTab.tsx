'use client';

import React, { useState } from 'react';
import { Button } from '@/shared/components/ui/Button';
import type { Device, DeviceCredentials } from '../../types';
import { getDeviceStatus } from '../../types';
import { deviceService } from '../../services/deviceService';

interface DeviceDetailsTabProps {
  device: Device;
  credentials: DeviceCredentials | null;
  onRefresh: () => void;
}

export const DeviceDetailsTab: React.FC<DeviceDetailsTabProps> = ({
  device,
  credentials,
  onRefresh: _onRefresh,
}) => {
  const [showCredentials, setShowCredentials] = useState(false);
  const [rpcMethod, setRpcMethod] = useState('');
  const [rpcParams, setRpcParams] = useState('{}');
  const [rpcResult, setRpcResult] = useState<any>(null);
  const [rpcLoading, setRpcLoading] = useState(false);
  const [rpcError, setRpcError] = useState<string | null>(null);

  const status = getDeviceStatus(device);

  const handleSendRpc = async () => {
    if (!rpcMethod.trim()) return;
    try {
      setRpcLoading(true);
      setRpcError(null);
      const params = JSON.parse(rpcParams);
      const result = await deviceService.sendRpcCommand({
        deviceId: device.id,
        method: rpcMethod,
        params,
      });
      setRpcResult(result);
    } catch (err) {
      setRpcError(err instanceof Error ? err.message : 'Failed to send RPC');
    } finally {
      setRpcLoading(false);
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Device Information */}
      <section>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Device Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <InfoRow label="Name" value={device.name} />
          <InfoRow label="Description" value={device.description || '-'} />
          <InfoRow label="Status" value={status} />
          <InfoRow label="Active" value={device.isActive ? 'Yes' : 'No'} />
          <InfoRow label="Online" value={device.isOnline ? 'Yes' : 'No'} />
          <InfoRow label="Device Type" value={device.deviceType?.name || '-'} />
          <InfoRow label="Category" value={device.deviceType?.category || '-'} />
          <InfoRow label="Area" value={device.area?.name || '-'} />
          <InfoRow label="Serial Number" value={device.serialNumber || '-'} />
          <InfoRow label="Model" value={device.model || '-'} />
          <InfoRow label="Firmware" value={device.firmware || '-'} />
          <InfoRow label="ThingsBoard ID" value={device.tbDeviceId} mono />
          <InfoRow label="Created" value={new Date(device.createdAt).toLocaleString()} />
          <InfoRow label="Updated" value={new Date(device.updatedAt).toLocaleString()} />
          {device.lastSeen && (
            <InfoRow label="Last Seen" value={new Date(device.lastSeen).toLocaleString()} />
          )}
        </div>
      </section>

      {/* Device Credentials */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Device Credentials</h3>
          <Button variant="outline" size="sm" onClick={() => setShowCredentials(!showCredentials)}>
            {showCredentials ? 'Hide' : 'Show'} Credentials
          </Button>
        </div>
        {credentials && showCredentials && (
          <div className="bg-gray-50 rounded-lg p-4 space-y-3">
            <InfoRow label="Credentials Type" value={credentials.credentialsType} />
            <InfoRow label="Credentials ID (Access Token)" value={credentials.credentialsId} mono />
            {credentials.credentialsValue && (
              <InfoRow label="Credentials Value" value={credentials.credentialsValue} mono />
            )}
          </div>
        )}
        {!credentials && (
          <p className="text-gray-500 text-sm">Unable to load credentials</p>
        )}
      </section>

      {/* Metadata */}
      {device.metadata && Object.keys(device.metadata).length > 0 && (
        <section>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Metadata</h3>
          <div className="bg-gray-50 rounded-lg p-4">
            <pre className="text-sm text-gray-800 whitespace-pre-wrap">
              {JSON.stringify(device.metadata, null, 2)}
            </pre>
          </div>
        </section>
      )}

      {/* Device State (synced data) */}
      {device.deviceState && (
        <section>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Synced Device State</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {device.deviceState.telemetryData && Object.keys(device.deviceState.telemetryData).length > 0 && (
              <div>
                <h4 className="font-medium text-gray-700 mb-2">Latest Telemetry</h4>
                <div className="bg-gray-50 rounded-lg p-3">
                  <pre className="text-sm text-gray-800 whitespace-pre-wrap">
                    {JSON.stringify(device.deviceState.telemetryData, null, 2)}
                  </pre>
                </div>
              </div>
            )}
            {device.deviceState.attributes && Object.keys(device.deviceState.attributes).length > 0 && (
              <div>
                <h4 className="font-medium text-gray-700 mb-2">Client Attributes</h4>
                <div className="bg-gray-50 rounded-lg p-3">
                  <pre className="text-sm text-gray-800 whitespace-pre-wrap">
                    {JSON.stringify(device.deviceState.attributes, null, 2)}
                  </pre>
                </div>
              </div>
            )}
          </div>
          {device.deviceState.lastUpdate && (
            <p className="text-xs text-gray-500 mt-2">
              Last synced: {new Date(device.deviceState.lastUpdate).toLocaleString()}
            </p>
          )}
        </section>
      )}

      {/* RPC Command */}
      <section>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Send RPC Command</h3>
        <div className="bg-gray-50 rounded-lg p-4 space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Method</label>
              <input
                type="text"
                value={rpcMethod}
                onChange={(e) => setRpcMethod(e.target.value)}
                placeholder="e.g., getValue, setValue"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Parameters (JSON)</label>
              <input
                type="text"
                value={rpcParams}
                onChange={(e) => setRpcParams(e.target.value)}
                placeholder='{"key": "value"}'
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
              />
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <Button
              onClick={handleSendRpc}
              disabled={!rpcMethod.trim() || rpcLoading || !device.isOnline}
              size="sm"
            >
              {rpcLoading ? 'Sending...' : 'Send RPC'}
            </Button>
            {!device.isOnline && (
              <span className="text-sm text-red-500">Device is offline</span>
            )}
          </div>
          {rpcError && (
            <div className="text-sm text-red-600 bg-red-50 rounded p-2">{rpcError}</div>
          )}
          {rpcResult && (
            <div className="bg-white rounded-lg p-3 border">
              <h4 className="text-sm font-medium text-gray-700 mb-1">Response:</h4>
              <pre className="text-sm text-gray-800 whitespace-pre-wrap">
                {JSON.stringify(rpcResult, null, 2)}
              </pre>
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

const InfoRow: React.FC<{ label: string; value: string; mono?: boolean }> = ({ label, value, mono }) => (
  <div className="flex flex-col">
    <span className="text-sm text-gray-500">{label}</span>
    <span className={`text-sm font-medium text-gray-900 ${mono ? 'font-mono' : ''}`}>{value}</span>
  </div>
);
