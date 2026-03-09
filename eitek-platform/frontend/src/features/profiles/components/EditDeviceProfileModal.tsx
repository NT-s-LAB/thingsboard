'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/shared/components/ui/Button';
import { Input } from '@/shared/components/ui/Input';
import { ImagePickerDialog } from '@/shared/components/ImagePickerDialog';
import { useProfileStore } from '../stores/profileStore';
import { TRANSPORT_TYPES, PROVISION_TYPES } from '../types';
import type { DeviceProfileUpdateRequest } from '../types';

export const EditDeviceProfileModal: React.FC = () => {
  const { isEditDeviceProfileModalOpen, selectedDeviceProfile, closeAllModals, updateDeviceProfile, saving, error } = useProfileStore();

  const [formData, setFormData] = useState<DeviceProfileUpdateRequest & { image?: string }>({
    name: '',
    description: '',
    transportType: 'DEFAULT',
    provisionType: 'DISABLED',
    image: '',
  });
  const [showImagePicker, setShowImagePicker] = useState(false);

  useEffect(() => {
    if (isEditDeviceProfileModalOpen && selectedDeviceProfile) {
      setFormData({
        name: selectedDeviceProfile.name,
        description: selectedDeviceProfile.description || '',
        transportType: selectedDeviceProfile.transportType || 'DEFAULT',
        provisionType: selectedDeviceProfile.provisionType || 'DISABLED',
        image: selectedDeviceProfile.image || '',
      });
    }
  }, [isEditDeviceProfileModalOpen, selectedDeviceProfile]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDeviceProfile?.id?.id) return;
    if (!formData.name?.trim()) return;

    const data: DeviceProfileUpdateRequest = {
      name: formData.name?.trim(),
    };
    if (formData.description?.trim()) data.description = formData.description.trim();
    if (formData.transportType) data.transportType = formData.transportType;
    if (formData.provisionType) data.provisionType = formData.provisionType;
    data.image = formData.image || '';
    await updateDeviceProfile(selectedDeviceProfile.id.id, data);
  };

  if (!isEditDeviceProfileModalOpen || !selectedDeviceProfile) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={closeAllModals} />
      <div className="relative bg-white rounded-lg shadow-xl w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-900">Edit Device Profile</h2>
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
              Profile Name <span className="text-red-500">*</span>
            </label>
            <Input
              value={formData.name || ''}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Enter profile name"
            />
          </div>

          {/* Profile Icon */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Profile Icon
            </label>
            <div className="flex items-center gap-3">
              <div className="w-16 h-16 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center bg-gray-50 overflow-hidden flex-shrink-0">
                {formData.image ? (
                  <img src={formData.image} alt="Profile icon" className="w-full h-full object-contain p-1" />
                ) : (
                  <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                )}
              </div>
              <div className="flex flex-col gap-1.5">
                <Button type="button" variant="outline" size="sm" onClick={() => setShowImagePicker(true)}>
                  📂 Select from Library
                </Button>
                {formData.image && (
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, image: '' })}
                    className="text-xs text-red-500 hover:text-red-700 text-left"
                  >
                    ✕ Remove icon
                  </button>
                )}
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              value={formData.description || ''}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Enter profile description"
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 text-sm"
              rows={3}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Transport Type
            </label>
            <select
              value={formData.transportType || 'DEFAULT'}
              onChange={(e) => setFormData({ ...formData, transportType: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 text-sm"
            >
              {TRANSPORT_TYPES.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Provision Type
            </label>
            <select
              value={formData.provisionType || 'DISABLED'}
              onChange={(e) => setFormData({ ...formData, provisionType: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 text-sm"
            >
              {PROVISION_TYPES.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </div>

          {selectedDeviceProfile.default && (
            <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-md text-yellow-700 text-sm">
              This is the default device profile. Some changes may be restricted.
            </div>
          )}

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

      <ImagePickerDialog
        open={showImagePicker}
        onClose={() => setShowImagePicker(false)}
        onPick={(url) => { setFormData({ ...formData, image: url }); setShowImagePicker(false); }}
      />
    </div>
  );
};
