'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { deviceScadaService } from '@/features/device-scada/services/deviceScadaService';
import { LoadingSpinner } from '@/shared/components/ui/LoadingSpinner';
import { Button } from '@/shared/components/ui/Button';
import type { DeviceScadaTemplate, DeviceProfileScadaDefault } from '@/features/device-scada/types';
import { useProfileStore } from '@/features/profiles/stores/profileStore';

const DeviceScadaTemplatesPage: React.FC = () => {
  const router = useRouter();
  const [templates, setTemplates] = useState<DeviceScadaTemplate[]>([]);
  const [profileDefaults, setProfileDefaults] = useState<DeviceProfileScadaDefault[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Device profiles from TB
  const { deviceProfiles, fetchDeviceProfiles } = useProfileStore();

  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [createName, setCreateName] = useState('');
  const [createDesc, setCreateDesc] = useState('');
  const [assignProfileId, setAssignProfileId] = useState('');
  const [assignTemplateId, setAssignTemplateId] = useState('');
  const [saving, setSaving] = useState(false);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [tpls, defaults] = await Promise.all([
        deviceScadaService.listTemplates(search || undefined),
        deviceScadaService.listProfileDefaults(),
      ]);
      setTemplates(tpls);
      setProfileDefaults(defaults);
    } catch {
      // handle error silently
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    loadData();
    fetchDeviceProfiles({ pageSize: 100 });
  }, [loadData, fetchDeviceProfiles]);

  // Create empty template
  const handleCreate = async () => {
    if (!createName.trim()) return;
    setSaving(true);
    try {
      const defaultScreen = {
        id: crypto.randomUUID(),
        version: 1,
        name: createName,
        canvasSize: { width: 1920, height: 1080 },
        background: { type: 'color', color: '#f8fafc' },
        layers: [{ id: 'default', name: 'Default', visible: true, locked: false, opacity: 1, order: 0 }],
        widgets: [],
        variables: [],
        metadata: { createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), createdBy: '', tags: [] },
      };
      await deviceScadaService.createTemplate({
        name: createName,
        ...(createDesc ? { description: createDesc } : {}),
        screenDefinition: defaultScreen,
      });
      setShowCreateModal(false);
      setCreateName('');
      setCreateDesc('');
      loadData();
    } catch (err: any) {
      alert(err?.message || 'Failed to create template');
    } finally {
      setSaving(false);
    }
  };

  // Assign profile default
  const handleAssign = async () => {
    if (!assignProfileId || !assignTemplateId) return;
    setSaving(true);
    try {
      await deviceScadaService.setProfileDefault(assignProfileId, assignTemplateId);
      setShowAssignModal(false);
      setAssignProfileId('');
      setAssignTemplateId('');
      loadData();
    } catch {
      // handle
    } finally {
      setSaving(false);
    }
  };

  // Remove profile default
  const handleRemoveDefault = async (profileId: string) => {
    try {
      await deviceScadaService.removeProfileDefault(profileId);
      loadData();
    } catch {
      // handle
    }
  };

  // Delete template
  const handleDelete = async (id: string) => {
    if (!confirm('Delete this template? This cannot be undone.')) return;
    try {
      await deviceScadaService.deleteTemplate(id);
      loadData();
    } catch {
      // handle
    }
  };

  // Build profile name lookup
  const profileNameMap = new Map<string, string>();
  for (const p of deviceProfiles) {
    if (p.id?.id) profileNameMap.set(p.id.id, p.name);
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Device SCADA Templates</h1>
          <p className="text-gray-500 text-sm mt-1">
            Create SCADA templates for device profiles. Use <code className="text-xs bg-gray-100 px-1 py-0.5 rounded">$currentDevice</code> in bindings for auto-substitution at runtime.
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <Button variant="outline" onClick={() => setShowAssignModal(true)}>
            Assign to Profile
          </Button>
          <Button onClick={() => setShowCreateModal(true)}>
            + New Template
          </Button>
        </div>
      </div>

      {/* Search */}
      <div className="flex items-center space-x-3">
        <input
          type="text"
          placeholder="Search templates..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="px-3 py-2 border rounded-lg text-sm w-64 focus:ring-2 focus:ring-primary-500"
        />
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><LoadingSpinner size="lg" /></div>
      ) : (
        <div className="space-y-8">
          {/* Templates Grid */}
          <section>
            <h2 className="text-lg font-semibold text-gray-800 mb-3">Templates ({templates.length})</h2>
            {templates.length === 0 ? (
              <div className="text-center py-12 text-gray-500 bg-white border rounded-lg">
                No templates yet. Create one to get started.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {templates.map((tpl) => {
                  const assignedProfiles = tpl.profileDefaults?.map(d => d.deviceProfileId) ?? [];
                  return (
                    <div key={tpl.id} className="bg-white border rounded-lg p-4 hover:shadow-md transition-shadow">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h3 className="font-medium text-gray-900">{tpl.name}</h3>
                          {tpl.description && <p className="text-sm text-gray-500 mt-0.5">{tpl.description}</p>}
                        </div>
                        <span className="text-xs text-gray-400">v{tpl.version}</span>
                      </div>

                      {/* Assigned profiles */}
                      {assignedProfiles.length > 0 && (
                        <div className="mb-3">
                          <span className="text-xs text-gray-500 block mb-1">Assigned to profiles:</span>
                          <div className="flex flex-wrap gap-1">
                            {assignedProfiles.map(pid => (
                              <span key={pid} className="inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-blue-50 text-blue-700">
                                {profileNameMap.get(pid) || pid.slice(0, 8)}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      <div className="flex items-center justify-between text-xs text-gray-400 mt-3 pt-3 border-t">
                        <span>{tpl._count?.overrides ?? 0} device overrides</span>
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => router.push(`/scada/${tpl.id}?mode=device-template`)}
                            className="text-primary-600 hover:text-primary-700 font-medium"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDelete(tpl.id)}
                            className="text-red-500 hover:text-red-700"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          {/* Profile → Template Defaults */}
          <section>
            <h2 className="text-lg font-semibold text-gray-800 mb-3">Profile Defaults ({profileDefaults.length})</h2>
            {profileDefaults.length === 0 ? (
              <div className="text-center py-8 text-gray-500 bg-white border rounded-lg">
                No profile defaults assigned yet.
              </div>
            ) : (
              <div className="bg-white border rounded-lg divide-y">
                {profileDefaults.map((pd) => (
                  <div key={pd.id} className="flex items-center justify-between px-4 py-3">
                    <div className="flex items-center space-x-4">
                      <div>
                        <span className="text-sm font-medium text-gray-900">
                          {profileNameMap.get(pd.deviceProfileId) || pd.deviceProfileId.slice(0, 12)}
                        </span>
                      </div>
                      <span className="text-gray-400">→</span>
                      <span className="text-sm text-gray-700">{pd.template?.name ?? pd.templateId.slice(0, 12)}</span>
                    </div>
                    <button
                      onClick={() => handleRemoveDefault(pd.deviceProfileId)}
                      className="text-xs text-red-500 hover:text-red-700"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      )}

      {/* Create Template Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
            <h3 className="text-lg font-semibold mb-4">New Device SCADA Template</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                <input
                  type="text"
                  value={createName}
                  onChange={(e) => setCreateName(e.target.value)}
                  placeholder="e.g. Motor Control Panel"
                  className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-primary-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  value={createDesc}
                  onChange={(e) => setCreateDesc(e.target.value)}
                  placeholder="Optional description"
                  rows={2}
                  className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-primary-500"
                />
              </div>
            </div>
            <div className="flex justify-end space-x-3 mt-6">
              <Button variant="outline" onClick={() => setShowCreateModal(false)}>Cancel</Button>
              <Button onClick={handleCreate} disabled={saving || !createName.trim()}>
                {saving ? 'Creating...' : 'Create'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Assign to Profile Modal */}
      {showAssignModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
            <h3 className="text-lg font-semibold mb-4">Assign Default Template to Profile</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Device Profile</label>
                <select
                  value={assignProfileId}
                  onChange={(e) => setAssignProfileId(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg text-sm"
                >
                  <option value="">Select profile...</option>
                  {deviceProfiles.map((p) => (
                    <option key={p.id?.id} value={p.id?.id}>{p.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">SCADA Template</label>
                <select
                  value={assignTemplateId}
                  onChange={(e) => setAssignTemplateId(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg text-sm"
                >
                  <option value="">Select template...</option>
                  {templates.map((t) => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="flex justify-end space-x-3 mt-6">
              <Button variant="outline" onClick={() => setShowAssignModal(false)}>Cancel</Button>
              <Button onClick={handleAssign} disabled={saving || !assignProfileId || !assignTemplateId}>
                {saving ? 'Assigning...' : 'Assign'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DeviceScadaTemplatesPage;
