'use client';

export default function SimplifiedDemoPage() {
  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold mb-2">Simplified Demo</h1>
        <p className="text-gray-400 mb-6">A beginner-friendly UI showcase</p>

        <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700">
          <h2 className="text-xl font-bold mb-3">Unavailable</h2>
          <p className="text-gray-300">
            This demo previously displayed hardcoded example market numbers and example analysis.
            To avoid misinformation, it has been disabled until it is backed by real live data.
          </p>
          <div className="mt-4 text-sm text-gray-400">
            Use the main pages (Dashboard / Market / On-chain / Technical) for real data.
          </div>
        </div>
      </div>
    </div>
  );
}
