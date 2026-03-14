'use client';

import React from 'react';
import { AdminLayout } from '@/shared/components/layout/AdminLayout';
import { useRoleGuard } from '@/features/auth/hooks/useRoleGuard';
import { LoadingSpinner } from '@/shared/components/ui/LoadingSpinner';
import { ShieldAlert } from 'lucide-react';

interface AdminLayoutPageProps {
  children: React.ReactNode;
}

const AdminLayoutPage: React.FC<AdminLayoutPageProps> = ({ children }) => {
  const { isReady, isAuthenticated, hasAccess, userRole } = useRoleGuard({
    requiredRole: 'SUPER_ADMIN',
    redirectTo: '/', // Redirect to tenant dashboard if not super admin
  });

  // Show loading while waiting for hydration
  if (!isReady) {
    return (
      <div className="flex items-center justify-center h-screen bg-slate-900">
        <div className="text-center space-y-3">
          <LoadingSpinner size="lg" />
          <p className="text-sm text-slate-400 animate-pulse">Loading...</p>
        </div>
      </div>
    );
  }

  // Show redirect message when not authenticated
  if (!isAuthenticated) {
    return (
      <div className="flex items-center justify-center h-screen bg-slate-900">
        <div className="text-center space-y-3">
          <LoadingSpinner size="lg" />
          <p className="text-sm text-slate-400 animate-pulse">Redirecting to login...</p>
        </div>
      </div>
    );
  }

  // Show access denied if not super admin
  if (!hasAccess) {
    return (
      <div className="flex items-center justify-center h-screen bg-slate-900">
        <div className="text-center space-y-4 p-8">
          <div className="w-16 h-16 bg-red-600/20 rounded-full flex items-center justify-center mx-auto">
            <ShieldAlert className="w-8 h-8 text-red-500" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-white">Access Denied</h2>
            <p className="text-sm text-slate-400 mt-2">
              You don't have permission to access the Admin area.
            </p>
            <p className="text-xs text-slate-500 mt-1">
              Current role: {userRole || 'Unknown'}
            </p>
          </div>
          <a
            href="/"
            className="inline-block px-4 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-600 transition-colors text-sm"
          >
            Go to Dashboard
          </a>
        </div>
      </div>
    );
  }

  return (
    <AdminLayout>
      {children}
    </AdminLayout>
  );
};

export default AdminLayoutPage;
