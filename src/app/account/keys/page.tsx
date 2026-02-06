'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

// This page is no longer needed - redirect to BYOK guide
// Users manage their own CoinGecko API keys directly in Excel
export default function ApiKeysPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/byok');
  }, [router]);

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center">
      <div className="text-center">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500"></div>
        <p className="mt-4 text-gray-400">Redirecting to BYOK guide...</p>
      </div>
    </div>
  );
}
