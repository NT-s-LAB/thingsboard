'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/shared/components/ui/Button';
import { Input } from '@/shared/components/ui/Input';
import { useDeviceStore } from '../stores/deviceStore';
import { deviceService } from '../services/deviceService';
import type { DeviceCreateRequest, TbDeviceProfileOption, UserOption } from '../types';

interface AreaOption {
  id: string;
  name: string;
}

export const CreateDeviceModal: React.FC = () => {
  const { isCreateModalOpen, closeAllModals, createDevice, saving, error } = useDeviceStore();
  const [areas, setAreas] = useState<AreaOption[]>([]);
  const [deviceProfiles, setDeviceProfiles] = useState<TbDeviceProfileOption[]>([]);
  const [users, setUsers] = useState<UserOption[]>([]);
  const [loadingOptions, setLoadingOptions] = useState(false);

  const [formData, setFormData] = useState<DeviceCreateRequest>({
    name: '',
    description: '',
    label: '',
    areaId: '',
    deviceProfileId: '',
    isGateway: false,
    assignedUserId: '',
    serialNumber: '',
    model: '',
    firmware: '',
  });

  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (isCreateModalOpen) {
      loadOptions();
      setFormData({
        name: '',
        description: '',
        label: '',
        areaId: '',
        deviceProfileId: '',
        isGateway: false,
        assignedUserId: '',
        serialNumber: '',
        model: '',
        firmware: '',
      });
      setFormErrors({});
    }
  }, [isCreateModalOpen]);

  const loadOptions = async () => {
    setLoadingOptions(true);
    try {
      const [areasRes, profilesRes, usersRes] = await Promise.all([
        deviceService.getAreas().catch(() => []),
        deviceService.getDeviceProfiles().catch(() => []),
        deviceService.getUsers().catch(() => []),
      ]);
      setAreas(Array.isArray(areasRes) ? areasRes : []);
      setDeviceProfiles(Array.isArray(profilesRes) ? profilesRes : []);
      setUsers(Array.isArray(usersRes) ? usersRes : []);
    } catch {
      console.error('Failed to load options');
    } finally {
      setLoadingOptions(false);
    }
  };

  const validate = (): boolean => {
    const errors: Record<string, string> = {};
    if (!formData.name.trim()) errors.name = 'Device name is required';
    if (!formData.areaId) errors.areaId = 'Area is required';
    if (!formData.deviceProfileId) errors.deviceProfileId = 'Device profile is required';
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    const submitData: DeviceCreateRequest = {
      name: formData.name.trim(),
      areaId: formData.areaId,
    };
    if (formData.deviceProfileId) submitData.deviceProfileId = formData.deviceProfileId;
    if (formData.description?.trim()) submitData.description = formData.description.trim();
    if (formData.label?.trim()) submitData.label = formData.label.trim();
    if (formData.isGateway) submitData.isGateway = true;
    if (formData.assignedUserId) submitData.assignedUserId = formData.assignedUserId;
    if (formData.serialNumber?.trim()) submitData.serialNumber = formData.serialNumber.trim();
    if (formData.model?.trim()) submitData.model = formData.model.trim();
    if (formData.firmware?.trim()) submitData.firmware = formData.firmware.trim();

    await createDevice(submitData);
  };

  if (!isCreateModalOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={closeAllModals} />
      <div className="relative bg-white rounded-lg shadow-xl w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-900">Add New Device</h2>
          <button onClick={closeAllModals} className="text-gray-400 hover:text-gray-600">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-md text-red-700 text-sm">
              {error}
            </div>
          )}

          {/* Device Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Device Name <span className="text-red-500">*</span>
            </label>
            <Input
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Enter device name"
            />
            {formErrors.name && <p className="text-red-500 text-xs mt-1">{formErrors.name}</p>}
          </div>

          {/* Device Profile (ThingsBoard) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Device Profile <span className="text-red-500">*</span>
            </label>
            {loadingOptions ? (
              <p className="text-sm text-gray-500">Loading device profiles...</p>
            ) : deviceProfiles.length === 0 ? (
              <p className="text-sm text-yellow-600">No device profiles available.</p>
            ) : (
              <select
                value={formData.deviceProfileId || ''}
                onChange={(e) => setFormData({ ...formData, deviceProfileId: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 text-sm"
              >
                <option value="">Select a device profile</option>
                {deviceProfiles.map((profile) => (
                  <option key={profile.id} value={profile.id}>
                    {profile.name}
                    {profile.isDefault ? ' (Default)' : ''}
                    {profile.transportType ? ` - ${profile.transportType}` : ''}
                  </option>
                ))}
              </select>
            )}
            {formErrors.deviceProfileId && <p className="text-red-500 text-xs mt-1">{formErrors.deviceProfileId}</p>}
          </div>

          {/* Label */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Label
            </label>
            <Input
              value={formData.label || ''}
              onChange={(e) => setFormData({ ...formData, label: e.target.value })}
              placeholder="Device label"
            />
          </div>

          {/* Area */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Area <span className="text-red-500">*</span>
            </label>
            {loadingOptions ? (
              <p className="text-sm text-gray-500">Loading areas...</p>
            ) : areas.length === 0 ? (
              <p className="text-sm text-yellow-600">No areas available. Please create an area first.</p>
            ) : (
              <select
                value={formData.areaId}
                onChange={(e) => setFormData({ ...formData, areaId: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 text-sm"
              >
                <option value="">Select an area</option>
                {areas.map((area) => (
                  <option key={area.id} value={area.id}>{area.name}</option>
                ))}
              </select>
            )}
            {formErrors.areaId && <p className="text-red-500 text-xs mt-1">{formErrors.areaId}</p>}
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              value={formData.description || ''}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Enter device description"
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 text-sm"
              rows={3}
            />
          </div>

          {/* Gateway Toggle */}
          <div className="flex items-center space-x-3">
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={formData.isGateway || false}
                onChange={(e) => setFormData({ ...formData, isGateway: e.target.checked })}
                className="sr-only peer"
              />
              <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary-600"></div>
            </label>
            <span className="text-sm font-medium text-gray-700">Is Gateway</span>
          </div>

          {/* Assign to User */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Assign to User
            </label>
            {loadingOptions ? (
              <p className="text-sm text-gray-500">Loading users...</p>
            ) : (
              <select
                value={formData.assignedUserId || ''}
                onChange={(e) => setFormData({ ...formData, assignedUserId: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 text-sm"
              >
                <option value="">Unassigned</option>
                {users.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.firstName} {user.lastName} ({user.email})
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Serial Number & Model */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Serial Number
              </label>
              <Input
                value={formData.serialNumber || ''}
                onChange={(e) => setFormData({ ...formData, serialNumber: e.target.value })}
                placeholder="S/N"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Model
              </label>
              <Input
                value={formData.model || ''}
                onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                placeholder="Model"
              />
            </div>
          </div>

          {/* Firmware */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Firmware Version
            </label>
            <Input
              value={formData.firmware || ''}
              onChange={(e) => setFormData({ ...formData, firmware: e.target.value })}
              placeholder="e.g., 1.0.0"
            />
          </div>

          <div className="flex justify-end space-x-3 pt-4 border-t">
            <Button type="button" variant="outline" onClick={closeAllModals}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? 'Creating...' : 'Create Device'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
