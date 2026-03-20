import './globals.css';
import type { Metadata, Viewport } from 'next';
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
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Industrial / technical fonts for SCADA widgets */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Orbitron:wght@400;700;900&family=Share+Tech+Mono&family=VT323&family=B612+Mono:wght@400;700&family=Rajdhani:wght@400;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
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