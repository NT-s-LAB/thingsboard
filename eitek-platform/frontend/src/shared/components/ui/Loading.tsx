'use client';

import React from 'react';
import { Loader2 } from 'lucide-react';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  color?: 'primary' | 'white' | 'gray';
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ 
  size = 'md', 
  className = '', 
  color = 'primary' 
}) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
    xl: 'w-12 h-12'
  };

  const colorClasses = {
    primary: 'text-primary-600',
    white: 'text-white',
    gray: 'text-gray-400'
  };

  return (
    <Loader2 
      className={`animate-spin ${sizeClasses[size]} ${colorClasses[color]} ${className}`} 
    />
  );
};

// Loading overlay for full screen or container
interface LoadingOverlayProps {
  isLoading?: boolean;
  message?: string;
  className?: string;
  backdrop?: boolean;
}

export const LoadingOverlay: React.FC<LoadingOverlayProps> = ({
  isLoading = true,
  message = 'Loading...',
  className = '',
  backdrop = true
}) => {
  if (!isLoading) return null;

  return (
    <div className={`absolute inset-0 flex items-center justify-center z-50 ${
      backdrop ? 'bg-white bg-opacity-75' : ''
    } ${className}`}>
      <div className="text-center">
        <LoadingSpinner size="lg" />
        {message && (
          <p className="mt-2 text-sm text-gray-600">{message}</p>
        )}
      </div>
    </div>
  );
};

// Loading skeleton for content placeholders
interface SkeletonProps {
  className?: string;
  lines?: number;
  width?: string | number;
  height?: string | number;
  animate?: boolean;
}

export const Skeleton: React.FC<SkeletonProps> = ({
  className = '',
  lines = 1,
  width = '100%',
  height = '1rem',
  animate = true
}) => {
  const skeletonClass = `bg-gray-200 rounded ${animate ? 'animate-pulse' : ''} ${className}`;
  
  if (lines === 1) {
    return (
      <div 
        className={skeletonClass}
        style={{ width, height }}
      />
    );
  }

  return (
    <div className="space-y-2">
      {Array.from({ length: lines }).map((_, index) => (
        <div
          key={index}
          className={skeletonClass}
          style={{ 
            width: index === lines - 1 ? '75%' : width, 
            height 
          }}
        />
      ))}
    </div>
  );
};

// Loading states for different components
export const CardSkeleton: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div className={`bg-white p-6 rounded-lg border border-gray-200 ${className}`}>
    <div className="animate-pulse">
      <Skeleton height="1.5rem" className="mb-4" />
      <Skeleton lines={3} height="1rem" className="mb-4" />
      <div className="flex space-x-2">
        <Skeleton width="80px" height="2rem" />
        <Skeleton width="80px" height="2rem" />
      </div>
    </div>
  </div>
);

export const TableSkeleton: React.FC<{ 
  rows?: number; 
  columns?: number; 
  className?: string;
}> = ({ 
  rows = 5, 
  columns = 4, 
  className = '' 
}) => (
  <div className={`bg-white rounded-lg border border-gray-200 ${className}`}>
    <div className="p-6">
      {/* Header */}
      <div className="grid gap-4 mb-4" style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
        {Array.from({ length: columns }).map((_, index) => (
          <Skeleton key={`header-${index}`} height="1.25rem" />
        ))}
      </div>
      
      {/* Rows */}
      <div className="space-y-3">
        {Array.from({ length: rows }).map((_, rowIndex) => (
          <div 
            key={`row-${rowIndex}`}
            className="grid gap-4" 
            style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}
          >
            {Array.from({ length: columns }).map((_, colIndex) => (
              <Skeleton key={`cell-${rowIndex}-${colIndex}`} height="1rem" />
            ))}
          </div>
        ))}
      </div>
    </div>
  </div>
);

export const ListSkeleton: React.FC<{ 
  items?: number; 
  className?: string;
}> = ({ 
  items = 5, 
  className = '' 
}) => (
  <div className={`space-y-4 ${className}`}>
    {Array.from({ length: items }).map((_, index) => (
      <div key={index} className="flex items-center space-x-4 p-4 bg-white rounded-lg border border-gray-200">
        <Skeleton width="48px" height="48px" className="rounded-full" />
        <div className="flex-1">
          <Skeleton height="1.25rem" className="mb-2" />
          <Skeleton height="1rem" width="60%" />
        </div>
        <Skeleton width="80px" height="2rem" />
      </div>
    ))}
  </div>
);

// Loading button state
interface LoadingButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  isLoading?: boolean;
  loadingText?: string;
  children: React.ReactNode;
}

export const LoadingButton: React.FC<LoadingButtonProps> = ({
  isLoading = false,
  loadingText = 'Loading...',
  children,
  disabled,
  className = '',
  ...props
}) => {
  return (
    <button
      {...props}
      disabled={disabled || isLoading}
      className={`relative ${className}`}
    >
      {isLoading ? (
        <>
          <span className="opacity-0">{children}</span>
          <div className="absolute inset-0 flex items-center justify-center">
            <LoadingSpinner size="sm" color="white" className="mr-2" />
            {loadingText}
          </div>
        </>
      ) : (
        children
      )}
    </button>
  );
};

// Page loading component
export const PageLoading: React.FC<{ message?: string }> = ({ 
  message = 'Loading page...' 
}) => (
  <div className="min-h-screen bg-gray-50 flex items-center justify-center">
    <div className="text-center">
      <LoadingSpinner size="xl" className="mb-4" />
      <h2 className="text-lg font-medium text-gray-900 mb-2">Please wait</h2>
      <p className="text-gray-600">{message}</p>
    </div>
  </div>
);

// Inline loading component for small sections
export const InlineLoading: React.FC<{ 
  message?: string;
  size?: 'sm' | 'md';
  className?: string;
}> = ({ 
  message = 'Loading...', 
  size = 'sm',
  className = '' 
}) => (
  <div className={`flex items-center text-gray-600 ${className}`}>
    <LoadingSpinner size={size} className="mr-2" />
    <span className="text-sm">{message}</span>
  </div>
);