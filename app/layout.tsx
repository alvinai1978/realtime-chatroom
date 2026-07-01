import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Realtime Chatroom + NVIDIA AI',
  description: 'A Vercel + Supabase realtime chatroom with optional NVIDIA AI assistant.'
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
