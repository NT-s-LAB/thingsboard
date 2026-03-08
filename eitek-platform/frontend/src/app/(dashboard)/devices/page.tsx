'use client';

import React, { useEffect } from 'react';
import { DeviceFilters } from '@/features/devices/components/DeviceFilters';
import { DeviceToolbar } from '@/features/devices/components/DeviceToolbar';
import { DeviceCard } from '@/features/devices/components/DeviceCard';
import { DeviceListItem } from '@/features/devices/components/DeviceListItem';
import { CreateDeviceModal } from '@/features/devices/components/CreateDeviceModal';
import { EditDeviceModal } from '@/features/devices/components/EditDeviceModal';
import { DeleteDeviceModal } from '@/features/devices/components/DeleteDeviceModal';
import { LoadingSpinner } from '@/shared/components/ui/LoadingSpinner';
import { Button } from '@/shared/components/ui/Button';
import { useDeviceStore } from '@/features/devices/stores/deviceStore';

const DevicesPage: React.FC = () => {
  const {
    devices,
    loading,
    error,
    pagination,
    filters,
    sort,
    selection,
    viewMode,
    
    // Actions
    fetchDevices,
    setFilters,
    resetFilters,
    setSort,
    setPage,
    // setPageSize, // Removed unused variable
    setViewMode,
    selectAllDevices,
    deselectAllDevices,
    toggleDeviceSelection,
    
    // Modal actions
    openCreateModal,
    openBulkActionsModal,
    openEditModal,
    openDeleteModal,
    openAttributesModal,
    openTelemetryModal,
    openRpcModal,
  } = useDeviceStore();

  useEffect(() => {
    fetchDevices();
  }, [fetchDevices]);

  const handleExport = () => {
    // TODO: Implement export functionality
    console.log('Export devices');
  };

  const handleImport = () => {
    // TODO: Implement import functionality
    console.log('Import devices');
  };

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="text-red-600 mb-2">
            <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-1">Error loading devices</h3>
          <p className="text-gray-500 mb-4">{error}</p>
          <Button onClick={() => fetchDevices()}>
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Devices</h1>
          <p className="text-gray-600">
            Manage and monitor your IoT devices
          </p>
        </div>
      </div>

      {/* Filters */}
      <DeviceFilters
        filters={filters}
        onFiltersChange={setFilters}
        onReset={resetFilters}
      />

      {/* Toolbar */}
      <DeviceToolbar
        selectedCount={selection.selectedIds.length}
        isAllSelected={selection.isAllSelected}
        isIndeterminate={selection.isIndeterminate}
        onSelectAll={selectAllDevices}
        onDeselectAll={deselectAllDevices}
        onCreateDevice={openCreateModal}
        onBulkActions={openBulkActionsModal}
        onExport={handleExport}
        onImport={handleImport}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
      />

      {/* Content */}
      <div className="bg-white rounded-lg border border-gray-200">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <LoadingSpinner size="lg" />
          </div>
        ) : devices.length === 0 ? (
          <div className="text-center py-12">
            <svg className="w-12 h-12 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
            </svg>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No devices found</h3>
            <p className="text-gray-500 mb-4">
              {filters.search || filters.deviceTypes.length > 0 || filters.statuses.length > 0
                ? 'No devices match your current filters.'
                : 'Get started by adding your first device.'}
            </p>
            <div className="space-x-2">
              <Button onClick={openCreateModal}>
                Add Device
              </Button>
              {(filters.search || filters.deviceTypes.length > 0 || filters.statuses.length > 0) && (
                <Button variant="outline" onClick={resetFilters}>
                  Clear Filters
                </Button>
              )}
            </div>
          </div>
        ) : (
          <>
            {/* Grid View */}
            {viewMode === 'grid' && (
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {devices.map((device) => (
                    <DeviceCard
                      key={device.id}
                      device={device}
                      isSelected={selection.selectedIds.includes(device.id)}
                      isSelectable={true}
                      onToggleSelect={() => toggleDeviceSelection(device.id)}
                      onEdit={openEditModal}
                      onDelete={openDeleteModal}
                      onViewAttributes={openAttributesModal}
                      onViewTelemetry={openTelemetryModal}
                      onSendCommand={openRpcModal}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* List View */}
            {viewMode === 'list' && (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left">
                        <input
                          type="checkbox"
                          checked={selection.isAllSelected}
                          ref={(el) => {
                            if (el) el.indeterminate = selection.isIndeterminate;
                          }}
                          onChange={selection.isAllSelected ? deselectAllDevices : selectAllDevices}
                          className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                        />
                      </th>
                      <th 
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                        onClick={() => setSort({ field: 'name', direction: sort.field === 'name' && sort.direction === 'asc' ? 'desc' : 'asc' })}
                      >
                        Device Name
                        {sort.field === 'name' && (
                          <span className="ml-1">
                            {sort.direction === 'asc' ? '↑' : '↓'}
                          </span>
                        )}
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Type
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Area
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Model
                      </th>
                      <th 
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                        onClick={() => setSort({ field: 'lastSeen', direction: sort.field === 'lastSeen' && sort.direction === 'desc' ? 'asc' : 'desc' })}
                      >
                        Last Seen
                        {sort.field === 'lastSeen' && (
                          <span className="ml-1">
                            {sort.direction === 'asc' ? '↑' : '↓'}
                          </span>
                        )}
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Serial Number
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {devices.map((device) => (
                      <DeviceListItem
                        key={device.id}
                        device={device}
                        isSelected={selection.selectedIds.includes(device.id)}
                        isSelectable={true}
                        onToggleSelect={() => toggleDeviceSelection(device.id)}
                        onEdit={openEditModal}
                        onDelete={openDeleteModal}
                        onViewAttributes={openAttributesModal}
                        onViewTelemetry={openTelemetryModal}
                        onSendCommand={openRpcModal}
                      />
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Map View */}
            {viewMode === 'map' && (
              <div className="p-6">
                <div className="bg-gray-100 rounded-lg h-96 flex items-center justify-center">
                  <div className="text-center">
                    <svg className="w-12 h-12 text-gray-400 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                    </svg>
                    <p className="text-gray-500">Map view coming soon</p>
                  </div>
                </div>
              </div>
            )}

            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <div className="bg-white px-4 py-3 border-t border-gray-200 sm:px-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center text-sm text-gray-700">
                    <span>
                      Showing {pagination.page * pagination.pageSize + 1} to{' '}
                      {Math.min((pagination.page + 1) * pagination.pageSize, pagination.totalElements)} of{' '}
                      {pagination.totalElements} devices
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={pagination.page === 0}
                      onClick={() => setPage(pagination.page - 1)}
                    >
                      Previous
                    </Button>
                    <span className="text-sm text-gray-700">
                      Page {pagination.page + 1} of {pagination.totalPages}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={!pagination.hasNext}
                      onClick={() => setPage(pagination.page + 1)}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Modals */}
      <CreateDeviceModal />
      <EditDeviceModal />
      <DeleteDeviceModal />
    </div>
  );
};

export default DevicesPage;