'use client';

import React from 'react';
import { Button } from '@/shared/components/ui/Button';
import { useDeviceStore } from '../stores/deviceStore';

export const DeleteDeviceModal: React.FC = () => {
  const { isDeleteModalOpen, selectedDevice, closeAllModals, deleteDevice, saving, error } = useDeviceStore();

  const handleDelete = async () => {
    if (!selectedDevice) return;
    await deleteDevice(selectedDevice.id);
  };

  if (!isDeleteModalOpen || !selectedDevice) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={closeAllModals} />
      <div className="relative bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
        <div className="p-6">
          <div className="flex items-center justify-center w-12 h-12 mx-auto mb-4 bg-red-100 rounded-full">
            <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 text-center mb-2">
            Delete Device
          </h3>
          <p className="text-sm text-gray-500 text-center mb-4">
            Are you sure you want to delete <strong>{selectedDevice.name}</strong>? 
            This will also remove the device from ThingsBoard. This action cannot be undone.
          </p>

          {error && (
            <div className="p-3 mb-4 bg-red-50 border border-red-200 rounded-md text-red-700 text-sm">
              {error}
            </div>
          )}

          <div className="flex justify-end space-x-3">
            <Button variant="outline" onClick={closeAllModals}>
              Cancel
            </Button>
            <Button 
              onClick={handleDelete} 
              disabled={saving}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {saving ? 'Deleting...' : 'Delete'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
