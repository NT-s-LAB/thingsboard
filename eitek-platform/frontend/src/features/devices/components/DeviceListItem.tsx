import React from 'react';
import { useRouter } from 'next/navigation';
import { cn } from '@/shared/utils/cn';
import { Badge } from '@/shared/components/ui/Badge';
import { formatDistanceToNow } from '@/shared/utils/date';
import type { Device, DeviceStatus } from '../types';
import { getDeviceStatus, getDeviceTypeName } from '../types';

interface DeviceListItemProps {
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

export const DeviceListItem: React.FC<DeviceListItemProps> = ({
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

  const handleRowClick = () => {
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

  const status = getDeviceStatus(device);
  const typeName = getDeviceTypeName(device);

  const statusColors: Record<DeviceStatus, string> = {
    'Online': 'bg-green-100 text-green-800',
    'Offline': 'bg-red-100 text-red-800',
    'Error': 'bg-red-100 text-red-800',
    'Maintenance': 'bg-yellow-100 text-yellow-800',
    'Unknown': 'bg-gray-100 text-gray-800',
  };

  return (
    <tr
      className={cn(
        "hover:bg-gray-50 cursor-pointer transition-colors",
        isSelected && "bg-primary-50"
      )}
      onClick={handleRowClick}
    >
      {/* Selection */}
      {isSelectable && (
        <td className="px-6 py-4">
          <input
            type="checkbox"
            checked={isSelected}
            onChange={handleCheckboxClick}
            className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
          />
        </td>
      )}

      {/* Device Name */}
      <td className="px-6 py-4">
        <div className="flex items-center space-x-3">
          {profileImage && (
            <img src={profileImage} alt={device.name} className="w-7 h-7 rounded object-cover flex-shrink-0" />
          )}
          <div>
            <div className="font-semibold text-gray-900">
              {device.name}
            </div>
            {device.description && (
              <div className="text-sm text-gray-600">
                {device.description}
              </div>
            )}
          </div>
        </div>
      </td>

      {/* Type */}
      <td className="px-6 py-4">
        <Badge variant="secondary">
          {typeName}
        </Badge>
      </td>

      {/* Status */}
      <td className="px-6 py-4">
        <Badge className={statusColors[status]}>
          {status}
        </Badge>
      </td>

      {/* Area */}
      <td className="px-6 py-4">
        <div className="text-sm text-gray-900">
          {device.area?.name || '-'}
        </div>
      </td>

      {/* Model */}
      <td className="px-6 py-4">
        <div className="text-sm text-gray-900">
          {device.model || '-'}
        </div>
      </td>

      {/* Last Seen */}
      <td className="px-6 py-4">
        <div className="text-sm text-gray-900">
          {device.lastSeen ? (
            <span title={new Date(device.lastSeen).toLocaleString()}>
              {formatDistanceToNow(new Date(device.lastSeen))}
            </span>
          ) : (
            '-'
          )}
        </div>
      </td>

      {/* Serial Number */}
      <td className="px-6 py-4">
        <div className="text-sm text-gray-900">
          {device.serialNumber || '-'}
        </div>
      </td>

      {/* Actions */}
      <td className="px-6 py-4">
        <div className="flex items-center space-x-2">
          {onViewTelemetry && (
            <button
              onClick={(e) => handleActionClick(e, () => onViewTelemetry(device))}
              className="text-blue-600 hover:text-blue-900 transition-colors"
              title="View telemetry"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </button>
          )}

          {onViewAttributes && (
            <button
              onClick={(e) => handleActionClick(e, () => onViewAttributes(device))}
              className="text-green-600 hover:text-green-900 transition-colors"
              title="View attributes"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
              </svg>
            </button>
          )}

          {onSendCommand && device.isOnline && (
            <button
              onClick={(e) => handleActionClick(e, () => onSendCommand(device))}
              className="text-orange-600 hover:text-orange-900 transition-colors"
              title="Send command"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </button>
          )}

          {onEdit && (
            <button
              onClick={(e) => handleActionClick(e, () => onEdit(device))}
              className="text-blue-600 hover:text-blue-900 transition-colors"
              title="Edit device"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </button>
          )}

          {onDelete && (
            <button
              onClick={(e) => handleActionClick(e, () => onDelete(device))}
              className="text-red-600 hover:text-red-900 transition-colors"
              title="Delete device"
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