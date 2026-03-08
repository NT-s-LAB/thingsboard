'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/shared/components/ui/Button';
import { Input } from '@/shared/components/ui/Input';
import { useDeviceStore } from '../stores/deviceStore';

export const EditDeviceModal: React.FC = () => {
  const { isEditModalOpen, selectedDevice, closeAllModals, updateDevice, saving, error } = useDeviceStore();

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    serialNumber: '',
    model: '',
    firmware: '',
    isActive: true,
  });

  useEffect(() => {
    if (isEditModalOpen && selectedDevice) {
      setFormData({
        name: selectedDevice.name || '',
        description: selectedDevice.description || '',
        serialNumber: selectedDevice.serialNumber || '',
        model: selectedDevice.model || '',
        firmware: selectedDevice.firmware || '',
        isActive: selectedDevice.isActive,
      });
    }
  }, [isEditModalOpen, selectedDevice]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDevice) return;

    const updates: Record<string, any> = {};
    if (formData.name.trim() !== selectedDevice.name) updates.name = formData.name.trim();
    if ((formData.description || '') !== (selectedDevice.description || '')) updates.description = formData.description;
    if ((formData.serialNumber || '') !== (selectedDevice.serialNumber || '')) updates.serialNumber = formData.serialNumber;
    if ((formData.model || '') !== (selectedDevice.model || '')) updates.model = formData.model;
    if ((formData.firmware || '') !== (selectedDevice.firmware || '')) updates.firmware = formData.firmware;
    if (formData.isActive !== selectedDevice.isActive) updates.isActive = formData.isActive;

    if (Object.keys(updates).length === 0) {
      closeAllModals();
      return;
    }

    await updateDevice(selectedDevice.id, updates);
  };

  if (!isEditModalOpen || !selectedDevice) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={closeAllModals} />
      <div className="relative bg-white rounded-lg shadow-xl w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-900">Edit Device</h2>
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
            <label className="block text-sm font-medium text-gray-700 mb-1">Device Name</label>
            <Input
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 text-sm"
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Serial Number</label>
              <Input
                value={formData.serialNumber}
                onChange={(e) => setFormData({ ...formData, serialNumber: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Model</label>
              <Input
                value={formData.model}
                onChange={(e) => setFormData({ ...formData, model: e.target.value })}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Firmware Version</label>
            <Input
              value={formData.firmware}
              onChange={(e) => setFormData({ ...formData, firmware: e.target.value })}
            />
          </div>

          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="isActive"
              checked={formData.isActive}
              onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
              className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
            />
            <label htmlFor="isActive" className="text-sm text-gray-700">
              Device is active
            </label>
          </div>

          <div className="flex justify-end space-x-3 pt-4 border-t">
            <Button type="button" variant="outline" onClick={closeAllModals}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
