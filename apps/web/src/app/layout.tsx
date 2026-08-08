import type { Metadata } from 'next';

import { GameProvider } from '@/components/GameProvider';

import '@/styles/globals.css';

export const metadata: Metadata = {
  title: 'Xeetcode',
  description: 'Real-time 1v1 competitive coding.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-dvh bg-bg text-ink">
        <GameProvider>{children}</GameProvider>
      </body>
    </html>
  );
}
