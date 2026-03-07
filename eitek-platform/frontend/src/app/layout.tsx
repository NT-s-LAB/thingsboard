import './globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { Providers } from './providers';
import { ErrorBoundary } from '@/shared/components/ui/ErrorBoundary';
import { ErrorSetup } from './components/ErrorSetup';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'EITEK IoT Platform',
  description: 'Advanced IoT Platform with SCADA and Device Management',
  keywords: ['IoT', 'SCADA', 'Dashboard', 'Device Management', 'Industrial IoT'],
  authors: [{ name: 'EITEK Development Team' }],
  viewport: 'width=device-width, initial-scale=1',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ErrorBoundary>
          <Providers>
            <ErrorSetup>
              {children}
            </ErrorSetup>
          </Providers>
        </ErrorBoundary>
      </body>
    </html>
  );
}