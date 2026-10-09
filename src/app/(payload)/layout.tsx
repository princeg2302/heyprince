import type { Metadata, Viewport } from 'next';
import React from 'react';
import '@/styles/admin-custom.css';
import { ToastProvider } from '@/components/admin/Toast';

export const viewport: Viewport = {
  themeColor: '#07070a',
  colorScheme: 'dark',
  width: 'device-width',
  initialScale: 1.0,
};

export const metadata: Metadata = {
  title: 'Executive Admin Portal — HeyPrince',
  description: 'Production administration dashboard for heyprince.in',
  icons: [{ url: '/favicon.svg' }],
};

export default function AdminRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <head>
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=Anton&display=swap"
          rel="stylesheet"
        />
        <link rel="stylesheet" href="/fonts/arboria/arboria.css" />
        <link rel="stylesheet" href="/fonts/futuru/futuru.css" />
      </head>
      <body
        style={{
          margin: 0,
          padding: 0,
          backgroundColor: '#07070a',
          color: '#ffffff',
          fontFamily: "'Arboria-Book', 'Arboria', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
        }}
      >
        <ToastProvider>{children}</ToastProvider>
      </body>
    </html>
  );
}
