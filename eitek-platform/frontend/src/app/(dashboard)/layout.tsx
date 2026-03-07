'use client';

import React from 'react';
import { DashboardLayout } from '@/shared/components/layout/DashboardLayout';

interface DashboardLayoutPageProps {
  children: React.ReactNode;
}

const DashboardLayoutPage: React.FC<DashboardLayoutPageProps> = ({ children }) => {
  return (
    <DashboardLayout>
      {children}
    </DashboardLayout>
  );
};

export default DashboardLayoutPage;