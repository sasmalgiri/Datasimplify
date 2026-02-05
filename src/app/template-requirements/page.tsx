'use client';

import Link from 'next/link';
import { FreeNavbar } from '@/components/FreeNavbar';
import { Breadcrumb } from '@/components/Breadcrumb';

export default function TemplateRequirementsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900 text-white">
      <FreeNavbar />
      <Breadcrumb />

      <div className="max-w-4xl mx-auto px-4 py-12">
        <h1 className="text-4xl font-bold mb-4">Power Query Setup Guide</h1>
        <p className="text-gray-400 mb-8 text-lg">
          What you need to use CryptoReportKit Power Query templates
        </p>

        {/* Important Notice - BYOK */}
        <div className="bg-emerald-900/30 border-2 border-emerald-500/50 rounded-xl p-6 mb-8">
          <h2 className="text-xl font-bold text-emerald-400 mb-3">BYOK Architecture: Bring Your Own Key</h2>
          <p className="text-gray-300">
            CryptoReportKit uses <strong>Power Query</strong> with a <strong>BYOK (Bring Your Own Key)</strong> model.
            Templates contain M code that fetches live data directly from CoinGecko using <strong>your own API key</strong>.
            This means:
          </p>
          <ul className="mt-3 space-y-2 text-gray-300">
            <li className="flex items-start gap-2">
              <span className="text-emerald-400">•</span>
              <span>No add-in required - uses Excel&apos;s built-in Power Query</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-emerald-400">•</span>
              <span>Your API key stays in Excel (never sent to our servers)</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-emerald-400">•</span>
              <span>Data is fetched directly from CoinGecko - we don&apos;t redistribute data</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-emerald-400">•</span>
              <span>Works offline with cached data after initial load</span>
            </li>
          </ul>
        </div>

        {/* Requirements */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-6">
            <div className="text-3xl mb-3">💻</div>
            <h3 className="text-xl font-semibold mb-2">Microsoft Excel Desktop</h3>
            <p className="text-gray-400 text-sm mb-3">Required for Power Query</p>
            <ul className="text-sm text-gray-300 space-y-1">
              <li>• Windows: Excel 2016 or later</li>
              <li>• Mac: Excel 2019 or later</li>
              <li>• Microsoft 365 subscription recommended</li>
            </ul>
            <p className="mt-3 text-xs text-yellow-400">
              Note: Excel Online uses Office Scripts instead (see alternative methods)
            </p>
          </div>

          <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-6">
            <div className="text-3xl mb-3">⚡</div>
            <h3 className="text-xl font-semibold mb-2">Power Query (Built-in)</h3>
            <p className="text-gray-400 text-sm mb-3">No installation required</p>
            <ul className="text-sm text-gray-300 space-y-1">
              <li>• Already included in Excel Desktop</li>
              <li>• Data → Get Data → From Web</li>
              <li>• Paste our M code in Advanced Editor</li>
            </ul>
            <Link
              href="/downloads"
              className="inline-block mt-3 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 rounded-lg text-sm font-medium transition-colors"
            >
              Get Power Query Templates →
            </Link>
          </div>

          <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-6">
            <div className="text-3xl mb-3">🔑</div>
            <h3 className="text-xl font-semibold mb-2">Data Provider API Key</h3>
            <p className="text-gray-400 text-sm mb-3">BYOK - Bring Your Own Key</p>
            <ul className="text-sm text-gray-300 space-y-1">
              <li>• CoinGecko (free or Pro)</li>
              <li>• Get your key from the provider</li>
              <li>• Connect it in your CRK account</li>
            </ul>
            <a
              href="https://www.coingecko.com/en/api"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block mt-3 px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-sm font-medium transition-colors"
            >
              Get CoinGecko Key →
            </a>
          </div>

          <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-6">
            <div className="text-3xl mb-3">🌐</div>
            <h3 className="text-xl font-semibold mb-2">Internet Connection</h3>
            <p className="text-gray-400 text-sm mb-3">Required for live data</p>
            <ul className="text-sm text-gray-300 space-y-1">
              <li>• Stable connection needed</li>
              <li>• Data refreshes on demand</li>
              <li>• Works offline with cached data</li>
            </ul>
          </div>
        </div>

        {/* How It Works */}
        <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-6 mb-8">
          <h2 className="text-2xl font-semibold mb-4">How Power Query Templates Work</h2>
          <div className="space-y-4">
            <div className="flex items-start gap-4">
              <div className="w-8 h-8 rounded-full bg-emerald-600 flex items-center justify-center font-bold shrink-0">1</div>
              <div>
                <h4 className="font-medium">Download Template</h4>
                <p className="text-gray-400 text-sm">Get the .pq file from our Downloads page (free or paid)</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="w-8 h-8 rounded-full bg-emerald-600 flex items-center justify-center font-bold shrink-0">2</div>
              <div>
                <h4 className="font-medium">Open Power Query in Excel</h4>
                <p className="text-gray-400 text-sm">Go to Data → Get Data → From Other Sources → Blank Query → Advanced Editor</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="w-8 h-8 rounded-full bg-emerald-600 flex items-center justify-center font-bold shrink-0">3</div>
              <div>
                <h4 className="font-medium">Paste the M Code</h4>
                <p className="text-gray-400 text-sm">Copy the code from the .pq file and paste it into the Advanced Editor</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="w-8 h-8 rounded-full bg-emerald-600 flex items-center justify-center font-bold shrink-0">4</div>
              <div>
                <h4 className="font-medium">Add Your API Key (Optional)</h4>
                <p className="text-gray-400 text-sm">For Pro features, add your CoinGecko API key in a named cell or in the query</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="w-8 h-8 rounded-full bg-emerald-600 flex items-center justify-center font-bold shrink-0">5</div>
              <div>
                <h4 className="font-medium">Close &amp; Load</h4>
                <p className="text-gray-400 text-sm">Click Close & Load to import data. Set up auto-refresh in query properties.</p>
              </div>
            </div>
          </div>
        </div>

        {/* API Key Tiers */}
        <div className="bg-blue-900/20 border border-blue-500/30 rounded-xl p-6 mb-8">
          <h2 className="text-2xl font-semibold mb-4 text-blue-400">CoinGecko API Tiers</h2>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="bg-gray-800/50 rounded-lg p-4">
              <h4 className="font-semibold text-white mb-2">Free Demo API</h4>
              <ul className="text-sm text-gray-300 space-y-1">
                <li>• Good for small templates (5-10 coins)</li>
                <li>• Basic rate limits</li>
                <li>• No credit card required</li>
              </ul>
            </div>
            <div className="bg-gray-800/50 rounded-lg p-4">
              <h4 className="font-semibold text-white mb-2">CoinGecko Pro</h4>
              <ul className="text-sm text-gray-300 space-y-1">
                <li>• Large templates (100+ coins)</li>
                <li>• Higher rate limits</li>
                <li>• Priority support from CoinGecko</li>
              </ul>
            </div>
          </div>
          <p className="mt-4 text-sm text-gray-400">
            Limits depend on your CoinGecko plan. See{' '}
            <a href="https://www.coingecko.com/en/api/pricing" target="_blank" rel="noopener noreferrer" className="text-blue-400 underline hover:text-blue-300">
              CoinGecko API pricing
            </a>{' '}
            for current rate limits and call quotas.
          </p>
        </div>

        {/* Troubleshooting */}
        <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-6 mb-8">
          <h2 className="text-2xl font-semibold mb-4">Troubleshooting</h2>
          <div className="space-y-4 text-sm">
            <div>
              <h4 className="font-medium text-yellow-400">Query returns an error?</h4>
              <p className="text-gray-400">Check that you have internet access and CoinGecko API is reachable. Try visiting the API URL directly in your browser.</p>
            </div>
            <div>
              <h4 className="font-medium text-yellow-400">Data not loading?</h4>
              <p className="text-gray-400">Make sure you pasted the M code correctly in the Advanced Editor. Check for syntax errors.</p>
            </div>
            <div>
              <h4 className="font-medium text-yellow-400">Rate limit errors?</h4>
              <p className="text-gray-400">You may be exceeding CoinGecko&apos;s free API rate limit. Add your API key for higher limits or reduce refresh frequency.</p>
            </div>
            <div>
              <h4 className="font-medium text-yellow-400">Power Query not available?</h4>
              <p className="text-gray-400">Power Query is built into Excel 2016+ on Windows and Excel 2019+ on Mac. Update Excel if needed.</p>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="flex flex-wrap gap-4">
          <Link
            href="/downloads"
            className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 rounded-lg font-medium transition-colors"
          >
            Download Power Query Templates
          </Link>
          <Link
            href="/pricing"
            className="px-6 py-3 bg-gray-700 hover:bg-gray-600 rounded-lg font-medium transition-colors"
          >
            View Pricing
          </Link>
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
