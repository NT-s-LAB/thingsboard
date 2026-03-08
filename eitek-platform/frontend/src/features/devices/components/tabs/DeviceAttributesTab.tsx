'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { Button } from '@/shared/components/ui/Button';
import { deviceService } from '../../services/deviceService';
import { useDeviceRealtime } from '../../hooks/useDeviceRealtime';

type AttributeScope = 'CLIENT_SCOPE' | 'SHARED_SCOPE' | 'SERVER_SCOPE';

const scopes: { key: AttributeScope; label: string }[] = [
  { key: 'CLIENT_SCOPE', label: 'Client Attributes' },
  { key: 'SHARED_SCOPE', label: 'Shared Attributes' },
  { key: 'SERVER_SCOPE', label: 'Server Attributes' },
];

interface AttributeEntry {
  key: string;
  value: any;
  lastUpdateTs: number;
}

interface DeviceAttributesTabProps {
  deviceId: string;
}

export const DeviceAttributesTab: React.FC<DeviceAttributesTabProps> = ({ deviceId }) => {
  const [activeScope, setActiveScope] = useState<AttributeScope>('CLIENT_SCOPE');
  const [attributes, setAttributes] = useState<AttributeEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Add attribute form
  const [newKey, setNewKey] = useState('');
  const [newValue, setNewValue] = useState('');
  const [saving, setSaving] = useState(false);

  const fetchAttributes = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await deviceService.getDeviceAttributes(deviceId, activeScope);
      const entries: AttributeEntry[] = Object.entries(data).map(([key, attr]) => ({
        key,
        value: attr.value,
        lastUpdateTs: attr.lastUpdateTs,
      }));
      setAttributes(entries.sort((a, b) => a.key.localeCompare(b.key)));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load attributes');
    } finally {
      setLoading(false);
    }
  }, [deviceId, activeScope]);

  useEffect(() => {
    fetchAttributes();
  }, [fetchAttributes]);

  // Real-time attribute updates via WebSocket
  const { connected: wsConnected } = useDeviceRealtime({
    deviceId,
    onTelemetry: useCallback(() => {
      // Re-fetch SERVER_SCOPE attributes when telemetry changes
      // (device activity updates SERVER_SCOPE attrs like 'active', 'lastActivityTime')
      if (activeScope === 'SERVER_SCOPE') {
        fetchAttributes();
      }
    }, [activeScope, fetchAttributes]),
  });

  const handleAddAttribute = async () => {
    if (!newKey.trim()) return;
    try {
      setSaving(true);
      let parsedValue: any = newValue;
      try {
        parsedValue = JSON.parse(newValue);
      } catch {
        // keep as string
      }
      await deviceService.saveDeviceAttributes(deviceId, activeScope, { [newKey]: parsedValue });
      setNewKey('');
      setNewValue('');
      await fetchAttributes();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save attribute');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteAttribute = async (key: string) => {
    try {
      await deviceService.deleteDeviceAttributes(deviceId, activeScope, [key]);
      await fetchAttributes();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete attribute');
    }
  };

  const formatValue = (value: any): string => {
    if (typeof value === 'object') return JSON.stringify(value);
    return String(value);
  };

  return (
    <div className="p-6 space-y-4">
      {/* Scope Selector */}
      <div className="flex items-center space-x-2 border-b pb-4">
        {scopes.map((scope) => (
          <button
            key={scope.key}
            onClick={() => setActiveScope(scope.key)}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
              activeScope === scope.key
                ? 'bg-primary-100 text-primary-700'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            {scope.label}
          </button>
        ))}
        <div className="flex-1" />
        {wsConnected && (
          <span className="flex items-center space-x-1 text-xs text-green-600 mr-2">
            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            <span>Live</span>
          </span>
        )}
        <Button variant="outline" size="sm" onClick={fetchAttributes}>
          Refresh
        </Button>
      </div>

      {/* Add Attribute Form */}
      {activeScope !== 'CLIENT_SCOPE' && (
        <div className="bg-gray-50 rounded-lg p-4">
          <h4 className="text-sm font-medium text-gray-700 mb-3">Add Attribute</h4>
          <div className="flex items-end space-x-3">
            <div className="flex-1">
              <label className="block text-xs text-gray-500 mb-1">Key</label>
              <input
                type="text"
                value={newKey}
                onChange={(e) => setNewKey(e.target.value)}
                placeholder="Attribute key"
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-primary-500 focus:border-primary-500"
              />
            </div>
            <div className="flex-1">
              <label className="block text-xs text-gray-500 mb-1">Value</label>
              <input
                type="text"
                value={newValue}
                onChange={(e) => setNewValue(e.target.value)}
                placeholder="Value (string, number, or JSON)"
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-primary-500 focus:border-primary-500"
              />
            </div>
            <Button onClick={handleAddAttribute} disabled={!newKey.trim() || saving} size="sm">
              {saving ? 'Saving...' : 'Add'}
            </Button>
          </div>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-600">{error}</div>
      )}

      {/* Attributes Table */}
      {loading ? (
        <div className="text-center py-8 text-gray-500">Loading attributes...</div>
      ) : attributes.length === 0 ? (
        <div className="text-center py-8 text-gray-500">No {scopes.find(s => s.key === activeScope)?.label?.toLowerCase()} found</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Key</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Value</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Last Updated</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {attributes.map((attr) => (
                <tr key={attr.key} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-mono text-gray-900">{attr.key}</td>
                  <td className="px-4 py-3 font-mono text-gray-700 max-w-xs truncate" title={formatValue(attr.value)}>
                    {formatValue(attr.value)}
                  </td>
                  <td className="px-4 py-3 text-gray-500">
                    {new Date(attr.lastUpdateTs).toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {activeScope !== 'CLIENT_SCOPE' && (
                      <button
                        onClick={() => handleDeleteAttribute(attr.key)}
                        className="text-red-500 hover:text-red-700 text-xs"
                      >
                        Delete
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
