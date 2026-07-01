'use client';

import { useEffect } from 'react';

function getMessage(error: Error & { digest?: string }) {
  if (error?.message && error.message !== '[object Object]') return error.message;
  return 'May runtime error sa app. Usually ito ay dahil hindi pa updated ang Supabase table. Run supabase/repair.sql, then restart npm run dev.';
}

export default function ErrorBoundary({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', padding: 24, fontFamily: 'Arial, sans-serif' }}>
      <section style={{ maxWidth: 560, background: 'white', borderRadius: 20, padding: 24, boxShadow: '0 20px 60px rgba(15,23,42,.12)' }}>
        <h1 style={{ marginTop: 0 }}>Jarvis Chatroom Error</h1>
        <p>{getMessage(error)}</p>
        <button onClick={reset} style={{ border: 0, borderRadius: 999, padding: '12px 18px', cursor: 'pointer', fontWeight: 700 }}>
          Try again
        </button>
      </section>
    </main>
  );
}
