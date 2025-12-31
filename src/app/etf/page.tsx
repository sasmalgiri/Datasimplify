'use client';

import { ETFTracker } from '@/components/features/ETFTracker';
import { FreeNavbar } from '@/components/FreeNavbar';
import { Breadcrumb } from '@/components/Breadcrumb';

export default function ETFPage() {
  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <FreeNavbar />
      <Breadcrumb />
      <div className="max-w-4xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-2">Bitcoin ETF Tracker</h1>
        <p className="text-gray-400 mb-8">
          Track institutional money flowing into Bitcoin through ETFs.
        </p>

        <ETFTracker showBeginnerTips={true} />
      </div>
    </div>
  );
}
