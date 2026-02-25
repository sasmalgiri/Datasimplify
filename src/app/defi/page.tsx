'use client';

import { DeFiTracker } from '@/components/features/DeFiTracker';
import { FreeNavbar } from '@/components/FreeNavbar';
import { Breadcrumb } from '@/components/Breadcrumb';
import { UniversalExport } from '@/components/UniversalExport';

export default function DeFiPage() {
  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <FreeNavbar />
      <Breadcrumb />
      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">DeFi Dashboard</h1>
            <p className="text-gray-400">
              Track decentralized finance protocols, TVL, and yield opportunities.
            </p>
          </div>
          <UniversalExport name="DeFi-Dashboard" compact />
        </div>

        <DeFiTracker showBeginnerTips={true} />
      </div>
    </div>
  );
}
