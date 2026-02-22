import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'ApexValue – Dealer Cockpit',
  description: 'European car import/export profit analysis and pipeline management for dealers.',
  icons: { icon: '/favicon.ico' },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="cockpit-bg min-h-screen antialiased">
        {children}
      </body>
    </html>
  );
}
