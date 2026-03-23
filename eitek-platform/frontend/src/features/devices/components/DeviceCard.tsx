import React from 'react';
import { useRouter } from 'next/navigation';
import { cn } from '@/shared/utils/cn';
import { Badge } from '@/shared/components/ui/Badge';
import { formatDistanceToNow } from '@/shared/utils/date';
import type { Device, DeviceStatus } from '../types';
import { getDeviceStatus, getDeviceTypeName } from '../types';

interface DeviceCardProps {
  device: Device;
  profileImage?: string | undefined;
  onSelect?: (device: Device) => void;
  onEdit?: (device: Device) => void;
  onDelete?: (device: Device) => void;
  onViewAttributes?: (device: Device) => void;
  onViewTelemetry?: (device: Device) => void;
  onSendCommand?: (device: Device) => void;
  isSelected?: boolean;
  isSelectable?: boolean;
  onToggleSelect?: () => void;
}

const deviceStatusColors: Record<DeviceStatus, string> = {
  'Online': 'bg-green-100 text-green-800',
  'Offline': 'bg-red-100 text-red-800',
  'Error': 'bg-red-100 text-red-800',
  'Maintenance': 'bg-yellow-100 text-yellow-800',
  'Unknown': 'bg-gray-100 text-gray-800',
};

export const DeviceCard: React.FC<DeviceCardProps> = ({
  device,
  profileImage,
  onSelect: _onSelect,
  onEdit,
  onDelete,
  onViewAttributes,
  onViewTelemetry,
  onSendCommand,
  isSelected = false,
  isSelectable = false,
  onToggleSelect,
}) => {
  const router = useRouter();
  const status = getDeviceStatus(device);
  const statusColor = deviceStatusColors[status];
  const typeName = getDeviceTypeName(device);

  const handleCardClick = (e: React.MouseEvent) => {
    e.preventDefault();
    router.push(`/devices/${device.id}`);
  };

  const handleCheckboxClick = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.stopPropagation();
    if (onToggleSelect) {
      onToggleSelect();
    }
  };

  const handleActionClick = (e: React.MouseEvent, action: () => void) => {
    e.stopPropagation();
    action();
  };

  return (
    <div
      className={cn(
        "bg-white rounded-xl border p-4 cursor-pointer transition-all duration-200 hover:shadow-md hover:border-gray-300",
        isSelected ? "border-primary-400 shadow-md" : "border-gray-200",
        "group"
      )}
      onClick={handleCardClick}
    >
      {/* Top row: icon + actions */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center space-x-2">
          {isSelectable && (
            <input
              type="checkbox"
              checked={isSelected}
              onChange={handleCheckboxClick}
              className="rounded border-gray-300 text-primary-600 focus:ring-primary-500 flex-shrink-0"
            />
          )}
          {profileImage ? (
            <img src={profileImage} alt={device.name} className="w-7 h-7 rounded object-cover flex-shrink-0" />
          ) : (
            <div className="w-7 h-7 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
              <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
              </svg>
            </div>
          )}
        </div>

        {/* Edit / Delete — visible on hover */}
        <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center space-x-1">
          {onEdit && (
            <button
              onClick={(e) => handleActionClick(e, () => onEdit(device))}
              className="p-1 text-gray-400 hover:text-blue-600 transition-colors rounded"
              title="Edit device"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </button>
          )}
          {onDelete && (
            <button
              onClick={(e) => handleActionClick(e, () => onDelete(device))}
              className="p-1 text-gray-400 hover:text-red-600 transition-colors rounded"
              title="Delete device"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Device name — full width, wraps */}
      <div className="mb-2">
        <h3 className="text-sm font-semibold text-gray-900 leading-snug line-clamp-2">
          {device.name}
        </h3>
        {device.description && (
          <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">
            {device.description}
          </p>
        )}
      </div>

      {/* Status and Type */}
      <div className="flex items-center flex-wrap gap-1.5 mb-3">
        <Badge className={cn(statusColor, "text-xs px-2 py-0.5")}>
          {status}
        </Badge>
        <Badge variant="secondary" className="text-xs px-2 py-0.5 font-mono">
          {typeName}
        </Badge>
      </div>

      {/* Device Info */}
      <div className="space-y-1 mb-3">
        {device.area && (
          <div className="flex items-center text-xs text-gray-500">
            <span className="font-medium text-gray-600 w-12 flex-shrink-0">Area</span>
            <span className="truncate">{device.area.name}</span>
          </div>
        )}
        {device.model && (
          <div className="flex items-center text-xs text-gray-500">
            <span className="font-medium text-gray-600 w-12 flex-shrink-0">Model</span>
            <span className="truncate">{device.model}</span>
          </div>
        )}
        {device.serialNumber && (
          <div className="flex items-center text-xs text-gray-500">
            <span className="font-medium text-gray-600 w-12 flex-shrink-0">S/N</span>
            <span className="truncate">{device.serialNumber}</span>
          </div>
        )}
        {device.firmware && (
          <div className="flex items-center text-xs text-gray-500">
            <span className="font-medium text-gray-600 w-12 flex-shrink-0">FW</span>
            <span className="truncate">{device.firmware}</span>
          </div>
        )}
        {device.lastSeen && (
          <div className="flex items-center text-xs text-gray-400">
            <span className="font-medium text-gray-600 w-12 flex-shrink-0">Seen</span>
            <span>{formatDistanceToNow(new Date(device.lastSeen))}</span>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex gap-1.5 pt-2 border-t border-gray-100">
        {onViewTelemetry && (
          <button
            onClick={(e) => handleActionClick(e, () => onViewTelemetry(device))}
            className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 text-xs bg-blue-50 text-blue-700 rounded-md hover:bg-blue-100 transition-colors font-medium"
          >
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            Telemetry
          </button>
        )}
        {onViewAttributes && (
          <button
            onClick={(e) => handleActionClick(e, () => onViewAttributes(device))}
            className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 text-xs bg-green-50 text-green-700 rounded-md hover:bg-green-100 transition-colors font-medium"
          >
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
            </svg>
            Attributes
          </button>
        )}
        {onSendCommand && device.isOnline && (
          <button
            onClick={(e) => handleActionClick(e, () => onSendCommand(device))}
            className="flex items-center justify-center gap-1 px-2 py-1.5 text-xs bg-orange-50 text-orange-700 rounded-md hover:bg-orange-100 transition-colors font-medium"
          >
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            RPC
          </button>
        )}
      </div>
    </div>
  );
};