'use client';

import Link from 'next/link';
import { FreeNavbar } from '@/components/FreeNavbar';
import { Breadcrumb } from '@/components/Breadcrumb';

export default function DisclaimerPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900 text-white">
      <FreeNavbar />
      <Breadcrumb />

      <div className="max-w-4xl mx-auto px-4 py-12">
        <h1 className="text-4xl font-bold mb-8">Disclaimer</h1>
        <p className="text-gray-400 mb-8">Last updated: January 2025</p>

        <div className="space-y-8 text-gray-300">
          {/* Product Scope */}
          <section className="bg-gray-800/50 border border-gray-700 rounded-xl p-6">
            <h2 className="text-2xl font-semibold text-white mb-4">Product Scope</h2>
            <div className="space-y-4">
              <p>
                <strong className="text-emerald-400">CryptoReportKit is software analytics tooling</strong> -
                not a data vendor, broker, or financial services provider.
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li><strong>No Trading Execution:</strong> We do not execute trades, route orders, or provide brokerage services.</li>
                <li><strong>No Market-Data Redistribution:</strong> We do not sell, license, or redistribute raw market data.</li>
                <li><strong>Templates Contain Formulas Only:</strong> Our Excel templates contain CryptoSheets formulas - no embedded data. Data is fetched via the CryptoSheets add-in on your machine using your own account.</li>
                <li><strong>Display-Only Dashboards:</strong> Website displays are for educational visualization purposes only.</li>
                <li><strong>Software Tools:</strong> We provide software tools for analytics and visualization - the underlying data comes from third-party providers via your own accounts/subscriptions.</li>
              </ul>
            </div>
          </section>

          {/* Not Financial Advice */}
          <section className="bg-yellow-900/20 border border-yellow-500/30 rounded-xl p-6">
            <h2 className="text-2xl font-semibold text-yellow-400 mb-4">Not Financial Advice</h2>
            <div className="space-y-4">
              <p>
                <strong>Nothing on this platform constitutes financial, investment, tax, or legal advice.</strong>
              </p>
              <p>
                All content, tools, charts, and analytics are provided for <strong>educational and informational purposes only</strong>.
                You should not construe any information on CryptoReportKit as:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Investment advice or recommendations</li>
                <li>An offer or solicitation to buy or sell any securities or cryptocurrencies</li>
                <li>Professional financial, legal, or tax advice</li>
                <li>A guarantee or prediction of future performance</li>
              </ul>
            </div>
          </section>

          {/* Risk Warning */}
          <section className="bg-red-900/20 border border-red-500/30 rounded-xl p-6">
            <h2 className="text-2xl font-semibold text-red-400 mb-4">Risk Warning</h2>
            <div className="space-y-4">
              <p>
                <strong>Cryptocurrency investments are highly volatile and risky.</strong>
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>You may lose some or all of your investment.</li>
                <li>Past performance is not indicative of future results.</li>
                <li>The cryptocurrency market operates 24/7 and can experience extreme price swings.</li>
                <li>Regulatory changes may impact cryptocurrency values and availability.</li>
              </ul>
              <p className="mt-4">
                Always <strong>DYOR (Do Your Own Research)</strong> and consult with qualified
                financial advisors before making any investment decisions.
              </p>
            </div>
          </section>

          {/* Data Sources */}
          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">Data Sources</h2>
            <div className="space-y-4">
              <p>
                CryptoReportKit aggregates and displays data from various third-party sources for educational purposes:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Alternative.me (Fear & Greed Index)</li>
                <li>Exchange APIs (Market Data)</li>
                <li>CoinGecko (when enabled - display only)</li>
                <li>DeFiLlama (DeFi metrics)</li>
                <li>Public blockchain explorers</li>
              </ul>
              <p className="mt-4 text-gray-400 text-sm">
                We do not guarantee the accuracy, completeness, or timeliness of any data.
                Data providers may have their own terms of service and usage restrictions.
              </p>
            </div>
          </section>

          {/* Template Requirements */}
          <section className="bg-purple-900/20 border border-purple-500/30 rounded-xl p-6">
            <h2 className="text-2xl font-semibold text-purple-400 mb-4">Excel Template Requirements</h2>
            <div className="space-y-4">
              <p>Our Excel templates require:</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li><strong>Microsoft Excel Desktop</strong> (Windows or Mac)</li>
                <li><strong>CryptoSheets Add-in</strong> installed and signed in</li>
                <li><strong>Active internet connection</strong> for data retrieval</li>
              </ul>
              <p className="mt-4">
                Templates contain <strong>formulas only</strong> - no market data is embedded.
                When you open a template, the CryptoSheets add-in fetches live data using your own account.
              </p>
              <Link
                href="/template-requirements"
                className="inline-block mt-4 text-purple-400 hover:text-purple-300 underline"
              >
                View full template requirements →
              </Link>
            </div>
          </section>

          {/* Limitation of Liability */}
          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">Limitation of Liability</h2>
            <div className="space-y-4">
              <p>
                TO THE MAXIMUM EXTENT PERMITTED BY LAW, CRYPTOREPORTKIT AND ITS AFFILIATES SHALL NOT BE
                LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES,
                OR ANY LOSS OF PROFITS OR REVENUES, WHETHER INCURRED DIRECTLY OR INDIRECTLY,
                OR ANY LOSS OF DATA, USE, GOODWILL, OR OTHER INTANGIBLE LOSSES.
              </p>
              <p>
                Your use of any information or tools provided by CryptoReportKit is entirely at your own risk.
              </p>
            </div>
          </section>

          {/* Contact */}
          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">Questions?</h2>
            <p>
              If you have questions about this disclaimer, please contact us at{' '}
              <a href="mailto:legal@cryptoreportkit.com" className="text-emerald-400 hover:underline">
                legal@cryptoreportkit.com
              </a>
            </p>
          </section>
        </div>

        {/* Back Link */}
        <div className="mt-12 pt-8 border-t border-gray-800">
          <Link href="/" className="text-emerald-400 hover:text-emerald-300">
            ← Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}
