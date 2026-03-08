'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { Button } from '@/shared/components/ui/Button';
import { deviceService } from '../../services/deviceService';
import type { DeviceRelation } from '../../types';

interface DeviceRelationsTabProps {
  deviceId: string;
}

export const DeviceRelationsTab: React.FC<DeviceRelationsTabProps> = ({ deviceId }) => {
  const [relations, setRelations] = useState<DeviceRelation[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [direction, setDirection] = useState<'FROM' | 'TO'>('FROM');

  // Add relation form
  const [showAddForm, setShowAddForm] = useState(false);
  const [relationType, setRelationType] = useState('Contains');
  const [targetEntityType, setTargetEntityType] = useState('DEVICE');
  const [targetEntityId, setTargetEntityId] = useState('');
  const [saving, setSaving] = useState(false);

  const fetchRelations = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await deviceService.getDeviceRelations(deviceId, direction);
      setRelations(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load relations');
    } finally {
      setLoading(false);
    }
  }, [deviceId, direction]);

  useEffect(() => {
    fetchRelations();
  }, [fetchRelations]);

  const handleAddRelation = async () => {
    if (!targetEntityId.trim() || !relationType.trim()) return;
    try {
      setSaving(true);
      setError(null);
      await deviceService.saveDeviceRelation(deviceId, {
        from: { id: deviceId, entityType: 'DEVICE' },
        to: { id: targetEntityId, entityType: targetEntityType },
        type: relationType,
        typeGroup: 'COMMON',
      });
      setShowAddForm(false);
      setTargetEntityId('');
      await fetchRelations();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add relation');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteRelation = async (relation: DeviceRelation) => {
    try {
      setError(null);
      await deviceService.deleteDeviceRelation(
        deviceId,
        relation.type,
        relation.to.id,
        relation.to.entityType,
      );
      await fetchRelations();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete relation');
    }
  };

  const entityTypes = ['DEVICE', 'ASSET', 'ENTITY_VIEW', 'DASHBOARD', 'TENANT', 'CUSTOMER', 'USER'];

  return (
    <div className="p-6 space-y-4">
      {/* Controls */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setDirection('FROM')}
            className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
              direction === 'FROM' ? 'bg-primary-100 text-primary-700' : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            Outgoing Relations
          </button>
          <button
            onClick={() => setDirection('TO')}
            className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
              direction === 'TO' ? 'bg-primary-100 text-primary-700' : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            Incoming Relations
          </button>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm" onClick={() => setShowAddForm(!showAddForm)}>
            {showAddForm ? 'Cancel' : '+ Add Relation'}
          </Button>
          <Button variant="outline" size="sm" onClick={fetchRelations}>Refresh</Button>
        </div>
      </div>

      {/* Add Relation Form */}
      {showAddForm && (
        <div className="bg-gray-50 rounded-lg p-4 space-y-3">
          <h4 className="text-sm font-medium text-gray-700">Add New Relation</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Relation Type</label>
              <input
                type="text"
                value={relationType}
                onChange={(e) => setRelationType(e.target.value)}
                placeholder="e.g., Contains, Manages"
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-primary-500 focus:border-primary-500"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Target Entity Type</label>
              <select
                value={targetEntityType}
                onChange={(e) => setTargetEntityType(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-primary-500 focus:border-primary-500"
              >
                {entityTypes.map(t => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Target Entity ID</label>
              <input
                type="text"
                value={targetEntityId}
                onChange={(e) => setTargetEntityId(e.target.value)}
                placeholder="Entity UUID"
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-primary-500 focus:border-primary-500"
              />
            </div>
          </div>
          <Button onClick={handleAddRelation} disabled={!targetEntityId.trim() || saving} size="sm">
            {saving ? 'Saving...' : 'Add Relation'}
          </Button>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-600">{error}</div>
      )}

      {/* Relations Table */}
      {loading ? (
        <div className="text-center py-8 text-gray-500">Loading relations...</div>
      ) : relations.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          No {direction === 'FROM' ? 'outgoing' : 'incoming'} relations found
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Relation Type</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  {direction === 'FROM' ? 'To Entity' : 'From Entity'}
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Entity Type</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type Group</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {relations.map((relation, idx) => {
                const target = direction === 'FROM' ? relation.to : relation.from;
                return (
                  <tr key={idx} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-900">{relation.type}</td>
                    <td className="px-4 py-3 font-mono text-gray-700 text-xs">{target.id}</td>
                    <td className="px-4 py-3 text-gray-600">{target.entityType}</td>
                    <td className="px-4 py-3 text-gray-500">{relation.typeGroup}</td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => handleDeleteRelation(relation)}
                        className="text-red-500 hover:text-red-700 text-xs"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
