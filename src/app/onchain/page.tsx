'use client';

import { OnChainMetrics } from '@/components/features/OnChainMetrics';

export default function OnChainPage() {
  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="max-w-5xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-2">⛓️ On-Chain Analytics</h1>
        <p className="text-gray-400 mb-8">
          Analyze blockchain data directly - holder behavior, miner activity, and more.
        </p>

        <OnChainMetrics showBeginnerTips={true} />
      </div>
    </div>
  );
}
