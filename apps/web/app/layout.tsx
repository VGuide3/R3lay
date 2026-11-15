import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'R3lay',
  description: 'Campaign infrastructure and landing page automation.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
