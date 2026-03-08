'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/shared/components/ui/Button';
import { Input } from '@/shared/components/ui/Input';
import { useDeviceStore } from '../stores/deviceStore';
import { deviceService } from '../services/deviceService';
import type { DeviceCreateRequest } from '../types';

interface AreaOption {
  id: string;
  name: string;
}

interface DeviceTypeOption {
  id: string;
  name: string;
  category: string;
}

export const CreateDeviceModal: React.FC = () => {
  const { isCreateModalOpen, closeAllModals, createDevice, saving, error } = useDeviceStore();
  const [areas, setAreas] = useState<AreaOption[]>([]);
  const [deviceTypes, setDeviceTypes] = useState<DeviceTypeOption[]>([]);
  const [loadingOptions, setLoadingOptions] = useState(false);

  const [formData, setFormData] = useState<DeviceCreateRequest>({
    name: '',
    description: '',
    areaId: '',
    deviceTypeId: '',
    serialNumber: '',
    model: '',
    firmware: '',
  });

  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (isCreateModalOpen) {
      loadOptions();
      // Reset form
      setFormData({
        name: '',
        description: '',
        areaId: '',
        deviceTypeId: '',
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
      const [areasRes, typesRes] = await Promise.all([
        deviceService.getAreas().catch(() => []),
        deviceService.getDeviceTypes().catch(() => []),
      ]);
      setAreas(Array.isArray(areasRes) ? areasRes : []);
      setDeviceTypes(Array.isArray(typesRes) ? typesRes : []);
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
    if (!formData.deviceTypeId) errors.deviceTypeId = 'Device type is required';
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    const submitData: DeviceCreateRequest = {
      name: formData.name.trim(),
      areaId: formData.areaId,
      deviceTypeId: formData.deviceTypeId,
    };
    if (formData.description?.trim()) submitData.description = formData.description.trim();
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

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Device Type <span className="text-red-500">*</span>
            </label>
            {loadingOptions ? (
              <p className="text-sm text-gray-500">Loading device types...</p>
            ) : deviceTypes.length === 0 ? (
              <p className="text-sm text-yellow-600">No device types available. Please create a device type first.</p>
            ) : (
              <select
                value={formData.deviceTypeId}
                onChange={(e) => setFormData({ ...formData, deviceTypeId: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 text-sm"
              >
                <option value="">Select a device type</option>
                {deviceTypes.map((type) => (
                  <option key={type.id} value={type.id}>{type.name} ({type.category})</option>
                ))}
              </select>
            )}
            {formErrors.deviceTypeId && <p className="text-red-500 text-xs mt-1">{formErrors.deviceTypeId}</p>}
          </div>

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
