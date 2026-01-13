'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { FreeNavbar } from '@/components/FreeNavbar';
import { Breadcrumb } from '@/components/Breadcrumb';

export default function BacktestPage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to technical indicators after a brief delay
    const timer = setTimeout(() => {
      router.push('/technical');
    }, 5000);
    return () => clearTimeout(timer);
  }, [router]);

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <FreeNavbar />
      <Breadcrumb />
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <div className="bg-yellow-900/20 border border-yellow-500/30 rounded-xl p-8">
          <h1 className="text-3xl font-bold mb-4 text-yellow-400">Page No Longer Available</h1>
          <p className="text-gray-300 mb-6">
            The strategy backtester has been discontinued as part of our focus on educational
            analytics tools. DataSimplify provides data visualization and technical indicator
            analysis for educational purposes only.
          </p>
          <p className="text-gray-400 text-sm mb-6">
            We do not provide trading signals, strategy recommendations, or backtesting tools.
          </p>
          <div className="space-y-3">
            <p className="text-gray-500 text-sm">
              Redirecting to Technical Indicators in 5 seconds...
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link
                href="/technical"
                className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 rounded-lg font-semibold transition"
              >
                View Technical Indicators
              </Link>
              <Link
                href="/templates"
                className="px-6 py-3 bg-gray-700 hover:bg-gray-600 rounded-lg font-semibold transition"
              >
                Excel Templates
              </Link>
            </div>
          </div>
        </div>

        <div className="mt-8 text-sm text-gray-500">
          <p>
            <strong>Note:</strong> Technical indicators are provided for educational analysis only.
            They are not trading signals. See our{' '}
            <Link href="/disclaimer" className="text-emerald-400 hover:underline">Disclaimer</Link>.
          </p>
        </div>
      </div>
    </div>
  );
}
