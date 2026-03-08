'use client';

import React from 'react';
import { Button } from '@/shared/components/ui/Button';
import { useProfileStore } from '../stores/profileStore';

export const DeleteAssetProfileModal: React.FC = () => {
  const { isDeleteAssetProfileModalOpen, selectedAssetProfile, closeAllModals, deleteAssetProfile, saving, error } = useProfileStore();

  const handleDelete = async () => {
    if (!selectedAssetProfile?.id?.id) return;
    await deleteAssetProfile(selectedAssetProfile.id.id);
  };

  if (!isDeleteAssetProfileModalOpen || !selectedAssetProfile) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={closeAllModals} />
      <div className="relative bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-900">Delete Asset Profile</h2>
          <button onClick={closeAllModals} className="text-gray-400 hover:text-gray-600">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-6">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-md text-red-700 text-sm mb-4">
              {error}
            </div>
          )}

          {selectedAssetProfile.default ? (
            <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-md text-yellow-700 text-sm mb-4">
              Cannot delete the default asset profile.
            </div>
          ) : (
            <div className="flex items-center space-x-3 mb-4">
              <div className="flex-shrink-0 w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-medium text-gray-900">Are you sure?</h3>
                <p className="text-sm text-gray-500">
                  This will permanently delete the asset profile <strong>{selectedAssetProfile.name}</strong> from ThingsBoard.
                  Assets using this profile may be affected.
                </p>
              </div>
            </div>
          )}

          <div className="flex justify-end space-x-3 pt-4 border-t">
            <Button type="button" variant="outline" onClick={closeAllModals}>
              Cancel
            </Button>
            {!selectedAssetProfile.default && (
              <Button
                type="button"
                variant="destructive"
                disabled={saving}
                onClick={handleDelete}
              >
                {saving ? 'Deleting...' : 'Delete Profile'}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
