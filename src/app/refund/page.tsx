'use client';

import Link from 'next/link';
import { isFeatureEnabled } from '@/lib/featureFlags';
import { IS_BETA_MODE } from '@/lib/betaMode';

function NoPaymentsNotice() {
  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 py-16 px-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold mb-4">Refund Policy</h1>
        <p className="text-gray-600 mb-8">Last updated: January 2026</p>

        <section className="bg-amber-50 border-2 border-amber-300 p-6 rounded-xl text-gray-700 leading-relaxed">
          <div className="flex items-start gap-3">
            <span className="text-2xl">⚠️</span>
            <div>
              <h2 className="text-lg font-bold text-amber-800 mb-2">
                {IS_BETA_MODE ? 'Free Beta (No Payments)' : 'Payments Not Currently Enabled'}
              </h2>
              <p className="text-amber-800">
                {IS_BETA_MODE
                  ? 'We are not processing payments during the free beta, so refunds are not applicable.'
                  : 'We are not currently processing payments. Refund terms will apply once paid plans become available.'}
              </p>
              <p className="text-amber-800 mt-4">
                Questions? Contact{' '}
                <a href="mailto:support@cryptoreportkit.com" className="underline">
                  support@cryptoreportkit.com
                </a>
                .
              </p>
              <p className="text-amber-800 mt-2 text-sm">
                See also: <Link href="/terms" className="underline">Terms of Service</Link>
              </p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

export default function RefundPage() {
  const paymentsEnabled = isFeatureEnabled('payments');

  if (!paymentsEnabled) return <NoPaymentsNotice />;

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 py-16 px-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold mb-4">Refund Policy</h1>
        <p className="text-gray-600 mb-8">Last updated: January 2026</p>

        <div className="space-y-8 text-gray-700 leading-relaxed">
          <section className="bg-emerald-50 border border-emerald-200 p-8 rounded-xl">
            <div className="text-center">
              <span className="text-5xl mb-4 block">💰</span>
              <h2 className="text-3xl font-bold text-emerald-700 mb-4">30-Day Money-Back Guarantee</h2>
              <p className="text-lg text-gray-700">
                We offer a <strong>full refund within 30 days</strong> of your initial subscription purchase, no questions asked.
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">How to Request a Refund</h2>
            <ol className="list-decimal list-inside space-y-3">
              <li>
                <strong>Email us</strong> at{' '}
                <a href="mailto:support@cryptoreportkit.com" className="text-emerald-700 underline">
                  support@cryptoreportkit.com
                </a>{' '}
                with subject “Refund Request”.
              </li>
              <li>
                <strong>Include</strong> the email used for purchase and the purchase date.
              </li>
              <li>
                <strong>We confirm</strong> within 24–48 hours.
              </li>
            </ol>
            <p className="text-sm text-gray-600 mt-4">
              Refund processing time depends on your payment method and provider.
            </p>
          </section>

          <section className="bg-blue-50 border border-blue-200 p-6 rounded-lg">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Excel Templates</h2>
            <p className="mb-4">
              Templates ship with <strong>prefetched snapshot data</strong> and formulas. For live data, use web dashboards with your own API key (BYOK).
            </p>
            <p className="text-sm text-gray-600">
              See <Link href="/disclaimer" className="text-emerald-700 underline">Disclaimer</Link> and{' '}
              <Link href="/template-requirements" className="text-emerald-700 underline">Template Requirements</Link>.
            </p>
          </section>

          <section className="bg-gray-100 p-6 rounded-lg">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Statutory Rights</h2>
            <p className="text-gray-700">
              Statutory consumer rights vary by country/region and are not limited by this policy.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Need Help?</h2>
            <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm inline-block">
              <p className="text-emerald-700 font-semibold">CryptoReportKit Support</p>
              <p>
                Email:{' '}
                <a
                  href="mailto:support@cryptoreportkit.com"
                  className="text-emerald-700 hover:text-emerald-800 underline"
                >
                  support@cryptoreportkit.com
                </a>
              </p>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
