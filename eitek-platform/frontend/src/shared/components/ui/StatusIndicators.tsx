'use client';

import React from 'react';
import { Wifi, WifiOff, Clock } from 'lucide-react';

// Connection status indicator
export const ConnectionStatus: React.FC<{ 
  isConnected: boolean; 
  className?: string 
}> = ({ isConnected, className = '' }) => {
  return (
    <div className={`flex items-center space-x-1 ${className}`}>
      {isConnected ? (
        <>
          <Wifi className="w-4 h-4 text-green-500" />
          <span className="text-sm text-green-600">Connected</span>
        </>
      ) : (
        <>
          <WifiOff className="w-4 h-4 text-red-500" />
          <span className="text-sm text-red-600">Disconnected</span>
        </>
      )}
    </div>
  );
};

// Real-time data indicator
export const RealTimeIndicator: React.FC<{ 
  isActive: boolean; 
  lastUpdate?: Date;
  className?: string;
}> = ({ isActive, lastUpdate, className = '' }) => {
  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      <div className={`w-2 h-2 rounded-full ${
        isActive ? 'bg-green-500 animate-pulse' : 'bg-gray-400'
      }`} />
      <div className="text-xs text-gray-600">
        {isActive ? (
          <span className="text-green-600">Live</span>
        ) : lastUpdate ? (
          <span>Last: {lastUpdate.toLocaleTimeString()}</span>
        ) : (
          <span>No data</span>
        )}
      </div>
    </div>
  );
};

// Generic status badge
export const StatusBadge: React.FC<{
  status: 'online' | 'offline' | 'warning' | 'error' | 'unknown';
  label?: string;
  className?: string;
}> = ({ status, label, className = '' }) => {
  const statusConfig = {
    online: {
      bg: 'bg-green-100',
      text: 'text-green-800',
      dot: 'bg-green-500',
      defaultLabel: 'Online'
    },
    offline: {
      bg: 'bg-gray-100',
      text: 'text-gray-800',
      dot: 'bg-gray-500',
      defaultLabel: 'Offline'
    },
    warning: {
      bg: 'bg-yellow-100',
      text: 'text-yellow-800',
      dot: 'bg-yellow-500',
      defaultLabel: 'Warning'
    },
    error: {
      bg: 'bg-red-100',
      text: 'text-red-800',
      dot: 'bg-red-500',
      defaultLabel: 'Error'
    },
    unknown: {
      bg: 'bg-gray-100',
      text: 'text-gray-800',
      dot: 'bg-gray-400',
      defaultLabel: 'Unknown'
    }
  };

  const config = statusConfig[status];
  const displayLabel = label || config.defaultLabel;

  return (
    <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${config.bg} ${config.text} ${className}`}>
      <div className={`w-2 h-2 rounded-full mr-2 ${config.dot}`} />
      {displayLabel}
    </div>
  );
};

// System health indicator
export const SystemHealth: React.FC<{
  health: {
    cpu: number;
    memory: number;
    storage: number;
    network: boolean;
  };
  className?: string;
}> = ({ health, className = '' }) => {
  const getHealthColor = (percentage: number) => {
    if (percentage > 80) return 'text-red-600';
    if (percentage > 60) return 'text-yellow-600';
    return 'text-green-600';
  };

  return (
    <div className={`space-y-2 ${className}`}>
      <h4 className="text-sm font-medium text-gray-900">System Health</h4>
      
      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <span className="text-xs text-gray-600">CPU</span>
          <span className={`text-xs font-medium ${getHealthColor(health.cpu)}`}>
            {health.cpu}%
          </span>
        </div>
        
        <div className="flex justify-between items-center">
          <span className="text-xs text-gray-600">Memory</span>
          <span className={`text-xs font-medium ${getHealthColor(health.memory)}`}>
            {health.memory}%
          </span>
        </div>
        
        <div className="flex justify-between items-center">
          <span className="text-xs text-gray-600">Storage</span>
          <span className={`text-xs font-medium ${getHealthColor(health.storage)}`}>
            {health.storage}%
          </span>
        </div>
        
        <div className="flex justify-between items-center">
          <span className="text-xs text-gray-600">Network</span>
          <StatusBadge 
            status={health.network ? 'online' : 'offline'} 
            label={health.network ? 'OK' : 'Down'}
          />
        </div>
      </div>
    </div>
  );
};

// Timestamp display
export const Timestamp: React.FC<{
  date: Date | string;
  format?: 'relative' | 'absolute' | 'time';
  showIcon?: boolean;
  className?: string;
}> = ({ date, format = 'relative', showIcon = true, className = '' }) => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  const formatTimestamp = () => {
    switch (format) {
      case 'relative':
        const now = new Date();
        const diff = now.getTime() - dateObj.getTime();
        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(minutes / 60);
        const days = Math.floor(hours / 24);
        
        if (days > 0) return `${days} day${days > 1 ? 's' : ''} ago`;
        if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
        if (minutes > 0) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
        return 'Just now';
        
      case 'time':
        return dateObj.toLocaleTimeString();
        
      case 'absolute':
      default:
        return dateObj.toLocaleString();
    }
  };

  return (
    <div className={`flex items-center text-xs text-gray-500 ${className}`}>
      {showIcon && <Clock className="w-3 h-3 mr-1" />}
      <span>{formatTimestamp()}</span>
    </div>
  );
};

// Version display
export const VersionInfo: React.FC<{
  version: string;
  build?: string;
  className?: string;
}> = ({ version, build, className = '' }) => {
  return (
    <div className={`text-xs text-gray-500 ${className}`}>
      <span>v{version}</span>
      {build && <span className="ml-2 text-gray-400">({build})</span>}
    </div>
  );
};

// Progress indicator
export const ProgressBar: React.FC<{
  value: number;
  max?: number;
  label?: string;
  color?: 'primary' | 'success' | 'warning' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  showValue?: boolean;
  className?: string;
}> = ({ 
  value, 
  max = 100, 
  label, 
  color = 'primary',
  size = 'md',
  showValue = true,
  className = '' 
}) => {
  const percentage = Math.min((value / max) * 100, 100);
  
  const colorClasses = {
    primary: 'bg-primary-600',
    success: 'bg-green-500',
    warning: 'bg-yellow-500',
    danger: 'bg-red-500'
  };

  const sizeClasses = {
    sm: 'h-1',
    md: 'h-2',
    lg: 'h-3'
  };

  return (
    <div className={`space-y-1 ${className}`}>
      {(label || showValue) && (
        <div className="flex justify-between items-center">
          {label && <span className="text-xs font-medium text-gray-700">{label}</span>}
          {showValue && (
            <span className="text-xs text-gray-600">
              {Math.round(percentage)}%
            </span>
          )}
        </div>
      )}
      
      <div className={`w-full bg-gray-200 rounded-full overflow-hidden ${sizeClasses[size]}`}>
        <div
          className={`h-full transition-all duration-300 ${colorClasses[color]}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
};