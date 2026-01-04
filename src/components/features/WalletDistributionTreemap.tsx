'use client';

export function WalletDistributionTreemap() {
  return (
    <div className="bg-gray-900 text-white rounded-xl border border-gray-700">
      <div className="flex items-center gap-3 p-4 border-b border-gray-700">
        <span className="text-4xl">🐋</span>
        <div>
          <h2 className="text-xl font-bold">BTC Wallet Distribution</h2>
          <p className="text-gray-400 text-sm">Unavailable (no free, reliable wallet-distribution data source wired)</p>
        </div>
      </div>

      <div className="p-6">
        <div className="text-center bg-gray-800/50 border border-gray-700 rounded-xl p-8">
          <p className="text-gray-300 font-semibold">Wallet distribution unavailable</p>
          <p className="text-gray-400 text-sm mt-2">
            This feature previously displayed hardcoded example buckets. Per the no-fake-data policy, it will remain
            unavailable until a real public data source is integrated.
          </p>
        </div>
      </div>
    </div>
  );
}
