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
        <p className="text-gray-400 mb-8">Last updated: January 2026</p>

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
                <li><strong>Templates with Prefetched Data:</strong> Our Excel templates ship with prefetched crypto data ready to use. Live dashboards on the website use BYOK architecture for real-time data.</li>
                <li><strong>Display-Only Dashboards:</strong> Website displays are for educational visualization purposes only, showing publicly available information.</li>
                <li><strong>Software Tools:</strong> We provide software tools for analytics and visualization - the underlying data comes from third-party providers via your own API keys.</li>
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
                CryptoReportKit has two usage models for data:
              </p>
              <div className="bg-gray-800/30 p-4 rounded-lg mb-3">
                <h3 className="text-emerald-400 font-medium mb-2">📊 Public Website Dashboards (Display-Only)</h3>
                <p className="text-sm text-gray-400 mb-2">
                  Our website dashboards (/market, /research, etc.) display aggregated data for educational demonstration purposes using:
                </p>
                <ul className="list-disc list-inside space-y-1 ml-4 text-sm text-gray-400">
                  <li>Alternative.me (Fear &amp; Greed Index)</li>
                  <li>CoinGecko (free tier for public display)</li>
                  <li>DeFiLlama (DeFi metrics)</li>
                  <li>Public blockchain explorers</li>
                </ul>
              </div>
              <div className="bg-gray-800/30 p-4 rounded-lg">
                <h3 className="text-blue-400 font-medium mb-2">📋 Excel Templates (BYOK)</h3>
                <p className="text-sm text-gray-400">
                  Our Excel templates use <strong>your own API keys</strong> (Bring Your Own Keys). You provide your own
                  CoinGecko keys. Data fetched via your keys is governed by your agreement with
                  the provider, not by CryptoReportKit.
                </p>
              </div>
              <p className="mt-4 text-gray-400 text-sm">
                We do not guarantee the accuracy, completeness, or timeliness of any data.
                Data providers may have their own terms of service and usage restrictions.
              </p>
            </div>
          </section>

          {/* Template Requirements */}
          <section className="bg-emerald-900/20 border border-emerald-500/30 rounded-xl p-6">
            <h2 className="text-2xl font-semibold text-emerald-400 mb-4">Power Query Template Requirements (BYOK)</h2>
            <div className="space-y-4">
              <p>Our Excel templates use a <strong>BYOK (Bring Your Own Key)</strong> architecture with Power Query:</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li><strong>Microsoft Excel Desktop</strong> (Windows or Mac) or Excel Online</li>
                <li><strong>Templates include prefetched data</strong> - ready to use out of the box</li>
                <li><strong>Your own CoinGecko API key</strong></li>
                <li><strong>Active internet connection</strong> for data retrieval</li>
              </ul>
              <p className="mt-4">
                Templates contain <strong>Power Query code only</strong> - no market data is embedded.
                When you refresh, Power Query fetches live data using your API key stored in Excel.
                Your key never leaves your workbook.
              </p>
              <Link
                href="/template-requirements"
                className="inline-block mt-4 text-emerald-400 hover:text-emerald-300 underline"
              >
                View setup guide →
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
              <a href="mailto:support@cryptoreportkit.com" className="text-emerald-400 hover:underline">
                support@cryptoreportkit.com
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
