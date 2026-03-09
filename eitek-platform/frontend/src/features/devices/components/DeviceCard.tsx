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

const categoryIcons: Record<string, string> = {
  'Gateway': '🌐',
  'PLC': '🔧',
  'HMI': '📱',
  'Sensor': '📡',
  'Actuator': '⚡',
  'Camera': '📹',
  'Custom': '⚙️',
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
  const category = device.deviceType?.category || 'Custom';
  const typeIcon = categoryIcons[category] || '⚙️';

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
        "bg-white rounded-lg border-2 p-4 cursor-pointer transition-all duration-200 hover:shadow-lg",
        isSelected ? "border-primary-500 shadow-lg" : "border-gray-200",
        "group"
      )}
      onClick={handleCardClick}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center space-x-2">
          {isSelectable && (
            <input
              type="checkbox"
              checked={isSelected}
              onChange={handleCheckboxClick}
              className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
            />
          )}
          <div className="flex items-center space-x-2">
            {profileImage ? (
              <img src={profileImage} alt={device.name} className="w-8 h-8 rounded object-cover" />
            ) : (
              <span className="text-2xl">{typeIcon}</span>
            )}
            <div>
              <h3 className="font-semibold text-gray-900 truncate">
                {device.name}
              </h3>
              {device.description && (
                <p className="text-sm text-gray-600 truncate">
                  {device.description}
                </p>
              )}
            </div>
          </div>
        </div>
        
        <div className="opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="flex items-center space-x-1">
            {onEdit && (
              <button
                onClick={(e) => handleActionClick(e, () => onEdit(device))}
                className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
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
                className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                title="Delete device"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Status and Type */}
      <div className="flex items-center space-x-2 mb-3">
        <Badge className={statusColor}>
          {status}
        </Badge>
        <Badge variant="secondary">
          {typeName}
        </Badge>
      </div>

      {/* Device Info */}
      <div className="space-y-2 mb-4">
        {device.area && (
          <div className="flex items-center text-sm text-gray-600">
            <span className="font-medium">Area:</span>
            <span className="ml-1 truncate">{device.area.name}</span>
          </div>
        )}
        
        {device.firmware && (
          <div className="flex items-center text-sm text-gray-600">
            <span className="font-medium">Firmware:</span>
            <span className="ml-1">{device.firmware}</span>
          </div>
        )}

        {device.serialNumber && (
          <div className="flex items-center text-sm text-gray-600">
            <span className="font-medium">S/N:</span>
            <span className="ml-1">{device.serialNumber}</span>
          </div>
        )}

        {device.model && (
          <div className="flex items-center text-sm text-gray-600">
            <span className="font-medium">Model:</span>
            <span className="ml-1">{device.model}</span>
          </div>
        )}
      </div>

      {/* Last Seen */}
      {device.lastSeen && (
        <div className="text-xs text-gray-500 mb-3">
          Last seen: {formatDistanceToNow(new Date(device.lastSeen))}
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex flex-wrap gap-2 mt-4">
        {onViewTelemetry && (
          <button
            onClick={(e) => handleActionClick(e, () => onViewTelemetry(device))}
            className="flex-1 px-2 py-1 text-xs bg-blue-50 text-blue-700 rounded hover:bg-blue-100 transition-colors"
          >
            📊 Telemetry
          </button>
        )}
        {onViewAttributes && (
          <button
            onClick={(e) => handleActionClick(e, () => onViewAttributes(device))}
            className="flex-1 px-2 py-1 text-xs bg-green-50 text-green-700 rounded hover:bg-green-100 transition-colors"
          >
            🏷️ Attributes
          </button>
        )}
        {onSendCommand && device.isOnline && (
          <button
            onClick={(e) => handleActionClick(e, () => onSendCommand(device))}
            className="flex-1 px-2 py-1 text-xs bg-orange-50 text-orange-700 rounded hover:bg-orange-100 transition-colors"
          >
            ⚡ RPC
          </button>
        )}
      </div>
    </div>
  );
};