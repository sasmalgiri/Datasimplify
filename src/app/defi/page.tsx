'use client';

import { DeFiTracker } from '@/components/features/DeFiTracker';
import { FreeNavbar } from '@/components/FreeNavbar';
import { Breadcrumb } from '@/components/Breadcrumb';

export default function DeFiPage() {
  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <FreeNavbar />
      <Breadcrumb />
      <div className="max-w-5xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-2">DeFi Dashboard</h1>
        <p className="text-gray-400 mb-8">
          Track decentralized finance protocols, TVL, and yield opportunities.
        </p>

        <DeFiTracker showBeginnerTips={true} />
      </div>
    </div>
  );
}
