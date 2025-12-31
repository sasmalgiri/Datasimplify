'use client';

import { TokenScreener } from '@/components/features/TokenScreener';
import { FreeNavbar } from '@/components/FreeNavbar';
import { Breadcrumb } from '@/components/Breadcrumb';

export default function ScreenerPage() {
  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <FreeNavbar />
      <Breadcrumb />
      <div className="max-w-6xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-2">Token Screener</h1>
        <p className="text-gray-400 mb-8">
          Filter and find cryptocurrencies that match your criteria.
        </p>

        <TokenScreener showBeginnerTips={true} />
      </div>
    </div>
  );
}
