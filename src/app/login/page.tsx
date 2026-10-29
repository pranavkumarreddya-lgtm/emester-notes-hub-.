'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const router = useRouter();

  useEffect(() => {
    // The website is completely public with no login required.
    // Immediately redirect anyone landing on /login back to the main hub.
    router.replace('/');
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 text-white font-sans">
      <div className="text-center space-y-2">
        <p className="text-sm text-slate-400 animate-pulse">Redirecting to Notes Hub…</p>
      </div>
    </div>
  );
}
