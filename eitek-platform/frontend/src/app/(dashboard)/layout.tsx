'use client';

import React from 'react';
import { DashboardLayout } from '@/shared/components/layout/DashboardLayout';
import { useAuthGuard } from '@/features/auth/hooks/useAuthGuard';
import { LoadingSpinner } from '@/shared/components/ui/LoadingSpinner';

interface DashboardLayoutPageProps {
  children: React.ReactNode;
}

const DashboardLayoutPage: React.FC<DashboardLayoutPageProps> = ({ children }) => {
  const { isReady, isAuthenticated } = useAuthGuard();

  // Show loading while waiting for hydration
  if (!isReady) {
    return (
      <div className="flex items-center justify-center h-screen bg-background">
        <div className="text-center space-y-3">
          <LoadingSpinner size="lg" />
          <p className="text-sm text-muted-foreground animate-pulse">Loading...</p>
        </div>
      </div>
    );
  }

  // Show redirect message when not authenticated
  if (!isAuthenticated) {
    return (
      <div className="flex items-center justify-center h-screen bg-background">
        <div className="text-center space-y-3">
          <LoadingSpinner size="lg" />
          <p className="text-sm text-muted-foreground animate-pulse">Redirecting to login...</p>
        </div>
      </div>
    );
  }

  return (
    <DashboardLayout>
      {children}
    </DashboardLayout>
  );
};

export default DashboardLayoutPage;