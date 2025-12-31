'use client';

import { WhaleTracker } from '@/components/features/WhaleTracker';
import { WalletDistributionTreemap } from '@/components/features/WalletDistributionTreemap';
import { FreeNavbar } from '@/components/FreeNavbar';
import { Breadcrumb } from '@/components/Breadcrumb';

export default function WhalesPage() {
  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <FreeNavbar />
      <Breadcrumb />
      <div className="max-w-4xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-2">Whale Watch</h1>
        <p className="text-gray-400 mb-8">
          Track what the big crypto holders are doing with their money.
        </p>

        {/* BTC Wallet Distribution Treemap */}
        <div className="mb-8">
          <WalletDistributionTreemap />
        </div>

        <WhaleTracker showBeginnerTips={true} />
      </div>
    </div>
  );
}
