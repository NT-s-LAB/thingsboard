'use client';

import React, { useEffect, useState } from 'react';
import { useProfileStore } from '@/features/profiles/stores/profileStore';
import { CreateAssetProfileModal } from '@/features/profiles/components/CreateAssetProfileModal';
import { EditAssetProfileModal } from '@/features/profiles/components/EditAssetProfileModal';
import { DeleteAssetProfileModal } from '@/features/profiles/components/DeleteAssetProfileModal';
import { LoadingSpinner } from '@/shared/components/ui/LoadingSpinner';
import { Button } from '@/shared/components/ui/Button';
import { Input } from '@/shared/components/ui/Input';
import type { AssetProfile } from '@/features/profiles/types';

const AssetProfilesPage: React.FC = () => {
  const {
    assetProfiles,
    assetProfilePagination,
    loading,
    error,
    searchText,
    fetchAssetProfiles,
    setSearchText,
    setAssetProfilePage,
    openCreateAssetProfileModal,
    openEditAssetProfileModal,
    openDeleteAssetProfileModal,
  } = useProfileStore();

  const [searchInput, setSearchInput] = useState('');

  useEffect(() => {
    fetchAssetProfiles();
  }, [fetchAssetProfiles]);

  const handleSearch = () => {
    setSearchText(searchInput);
    fetchAssetProfiles({ textSearch: searchInput, page: 1 });
  };

  const handleSearchKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSearch();
  };

  const handleClearSearch = () => {
    setSearchInput('');
    setSearchText('');
    fetchAssetProfiles({ page: 1 });
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Asset Profiles</h1>
          <p className="text-gray-600">Manage ThingsBoard asset profiles</p>
        </div>
        <Button onClick={openCreateAssetProfileModal}>
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Create Profile
        </Button>
      </div>

      {/* Search */}
      <div className="flex items-center space-x-3">
        <div className="relative flex-1 max-w-md">
          <Input
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onKeyDown={handleSearchKeyDown}
            placeholder="Search asset profiles..."
            className="pr-10"
          />
          {searchInput && (
            <button
              onClick={handleClearSearch}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
        <Button variant="outline" onClick={handleSearch}>Search</Button>
      </div>

      {/* Error */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-md">
          <p className="text-red-700 text-sm">{error}</p>
        </div>
      )}

      {/* Table */}
      <div className="bg-white rounded-lg border border-gray-200">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <LoadingSpinner size="lg" />
          </div>
        ) : assetProfiles.length === 0 ? (
          <div className="text-center py-12">
            <svg className="w-12 h-12 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No asset profiles found</h3>
            <p className="text-gray-500 mb-4">
              {searchText ? 'No profiles match your search.' : 'Create your first asset profile to get started.'}
            </p>
            <div className="space-x-2">
              <Button onClick={openCreateAssetProfileModal}>Create Profile</Button>
              {searchText && (
                <Button variant="outline" onClick={handleClearSearch}>Clear Search</Button>
              )}
            </div>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Default</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {assetProfiles.map((profile) => (
                    <AssetProfileRow
                      key={profile.id?.id || profile.name}
                      profile={profile}
                      onEdit={openEditAssetProfileModal}
                      onDelete={openDeleteAssetProfileModal}
                    />
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {assetProfilePagination.totalPages > 1 && (
              <div className="px-6 py-3 border-t border-gray-200 flex items-center justify-between">
                <span className="text-sm text-gray-700">
                  Page {assetProfilePagination.page} of {assetProfilePagination.totalPages} ({assetProfilePagination.totalElements} total)
                </span>
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={assetProfilePagination.page <= 1}
                    onClick={() => setAssetProfilePage(assetProfilePagination.page - 1)}
                  >
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={!assetProfilePagination.hasNext}
                    onClick={() => setAssetProfilePage(assetProfilePagination.page + 1)}
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Modals */}
      <CreateAssetProfileModal />
      <EditAssetProfileModal />
      <DeleteAssetProfileModal />
    </div>
  );
};

// Row component
const AssetProfileRow: React.FC<{
  profile: AssetProfile;
  onEdit: (profile: AssetProfile) => void;
  onDelete: (profile: AssetProfile) => void;
}> = ({ profile, onEdit, onDelete }) => {
  const formatDate = (timestamp?: number) => {
    if (!timestamp) return '-';
    return new Date(timestamp).toLocaleDateString('vi-VN', {
      year: 'numeric', month: '2-digit', day: '2-digit',
    });
  };

  return (
    <tr className="hover:bg-gray-50">
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="flex items-center space-x-3">
          <div className="flex-shrink-0 w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
            <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
          </div>
          <span className="text-sm font-medium text-gray-900">{profile.name}</span>
        </div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        {profile.default ? (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
            Default
          </span>
        ) : (
          <span className="text-sm text-gray-400">-</span>
        )}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
        {formatDate(profile.createdTime)}
      </td>
      <td className="px-6 py-4">
        <span className="text-sm text-gray-500 line-clamp-1 max-w-xs">
          {profile.description || '-'}
        </span>
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-right">
        <div className="flex items-center justify-end space-x-2">
          <button
            onClick={() => onEdit(profile)}
            className="text-gray-400 hover:text-blue-600 transition-colors"
            title="Edit"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </button>
          {!profile.default && (
            <button
              onClick={() => onDelete(profile)}
              className="text-gray-400 hover:text-red-600 transition-colors"
              title="Delete"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          )}
        </div>
      </td>
    </tr>
  );
};

export default AssetProfilesPage;
