'use client';

import { WhaleTracker } from '@/components/features/WhaleTracker';

export default function WhalesPage() {
  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-2">🐋 Whale Watch</h1>
        <p className="text-gray-400 mb-8">
          Track what the big crypto holders are doing with their money.
        </p>
        
        <WhaleTracker showBeginnerTips={true} />
      </div>
    </div>
  );
}
