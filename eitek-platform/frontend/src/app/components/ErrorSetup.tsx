'use client';

import { useEffect } from 'react';
import { setupGlobalErrorHandler } from '@/shared/components/ui/ErrorBoundary';

interface ErrorSetupProps {
  children: React.ReactNode;
}

export function ErrorSetup({ children }: ErrorSetupProps) {
  useEffect(() => {
    setupGlobalErrorHandler();
  }, []);

  return <>{children}</>;
}