import React, { useState } from 'react';
import { Button } from '@/shared/components/ui/Button';
import { Input } from '@/shared/components/ui/Input';
import { Badge } from '@/shared/components/ui/Badge';
import type { DeviceFilters as DeviceFiltersType, DeviceStatus } from '../types';

interface DeviceFiltersProps {
  filters: DeviceFiltersType;
  onFiltersChange: (filters: Partial<DeviceFiltersType>) => void;
  onReset: () => void;
}

const deviceStatuses: DeviceStatus[] = ['Online', 'Offline', 'Error', 'Maintenance', 'Unknown'];

export const DeviceFilters: React.FC<DeviceFiltersProps> = ({
  filters,
  onFiltersChange,
  onReset,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const handleSearchChange = (search: string) => {
    onFiltersChange({ search });
  };

  const handleStatusToggle = (status: DeviceStatus) => {
    const newStatuses = filters.statuses.includes(status)
      ? filters.statuses.filter(s => s !== status)
      : [...filters.statuses, status];
    onFiltersChange({ statuses: newStatuses });
  };

  const hasActiveFilters = 
    filters.search ||
    filters.deviceTypes.length > 0 ||
    filters.statuses.length > 0;

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 space-y-4">
      {/* Search and Expand Button */}
      <div className="flex items-center space-x-4">
        <div className="flex-1">
          <Input
            type="text"
            placeholder="Search devices..."
            value={filters.search}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="w-full"
          />
        </div>
        <Button
          variant="outline"
          onClick={() => setIsExpanded(!isExpanded)}
          className="whitespace-nowrap"
        >
          {isExpanded ? '🔽 Filters' : '🔽 Filters'}
          {hasActiveFilters && (
            <Badge variant="default" className="ml-2 h-5 w-5 rounded-full p-0 text-xs">
              !
            </Badge>
          )}
        </Button>
        {hasActiveFilters && (
          <Button variant="outline" size="sm" onClick={onReset}>
            Clear All
          </Button>
        )}
      </div>

      {/* Expanded Filters */}
      {isExpanded && (
        <div className="space-y-6 pt-4 border-t border-gray-200">
          {/* Device Types */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Device Types
            </label>
            <div className="flex flex-wrap gap-2">
              {filters.deviceTypes.length === 0 && (
                <span className="text-sm text-gray-500 italic">No type filter active</span>
              )}
            </div>
          </div>

          {/* Device Statuses */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Status
            </label>
            <div className="flex flex-wrap gap-2">
              {deviceStatuses.map(status => (
                <button
                  key={status}
                  onClick={() => handleStatusToggle(status)}
                  className={`px-3 py-1 rounded-full text-sm transition-colors ${
                    filters.statuses.includes(status)
                      ? 'bg-primary-100 text-primary-800 border-2 border-primary-300'
                      : 'bg-gray-100 text-gray-700 border-2 border-transparent hover:bg-gray-200'
                  }`}
                >
                  {status}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Active Filters Summary */}
      {hasActiveFilters && !isExpanded && (
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-gray-200">
          <span className="text-sm text-gray-600">Active filters:</span>
          
          {filters.search && (
            <Badge variant="secondary" className="gap-1">
              Search: {filters.search}
              <button
                onClick={() => handleSearchChange('')}
                className="ml-1 hover:text-red-600"
              >
                ✕
              </button>
            </Badge>
          )}

          {filters.statuses.map(status => (
            <Badge key={status} variant="secondary" className="gap-1">
              {status}
              <button
                onClick={() => handleStatusToggle(status)}
                className="ml-1 hover:text-red-600"
              >
                ✕
              </button>
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
};