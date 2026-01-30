import React from 'react';
import '../styles/index.css';

export const viewport = {
  width: 'device-width',
  initialScale: 1,
};

export const metadata = {
  title: 'SalesTracker Pro - RFIDIA Technology',
  description: 'Professional sales tracking and management platform powered by RFIDIA Technology',
  icons: {
    icon: [
      { url: '/assets/favicon.ico', type: 'image/x-icon' }
    ],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}

        <script type="module" async src="https://static.rocket.new/rocket-web.js?_cfg=https%3A%2F%2Fsalestrack4298back.builtwithrocket.new&_be=https%3A%2F%2Fapplication.rocket.new&_v=0.1.12" />
        <script type="module" defer src="https://static.rocket.new/rocket-shot.js?v=0.0.2" /></body>
    </html>
  );
}
