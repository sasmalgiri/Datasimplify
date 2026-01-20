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
        <h1 className="text-4xl font-bold mb-4">Template Requirements</h1>
        <p className="text-gray-400 mb-8 text-lg">
          What you need to use CryptoReportKit Excel templates
        </p>

        {/* Important Notice - BYOK */}
        <div className="bg-emerald-900/30 border-2 border-emerald-500/50 rounded-xl p-6 mb-8">
          <h2 className="text-xl font-bold text-emerald-400 mb-3">BYOK Architecture: Bring Your Own Key</h2>
          <p className="text-gray-300">
            CryptoReportKit templates use a <strong>BYOK (Bring Your Own Key)</strong> architecture.
            Templates contain CRK formulas that fetch live data using <strong>your own API keys</strong>.
            This means:
          </p>
          <ul className="mt-3 space-y-2 text-gray-300">
            <li className="flex items-start gap-2">
              <span className="text-emerald-400">•</span>
              <span>You need the CRK Excel add-in installed</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-emerald-400">•</span>
              <span>You provide your own data provider API key (e.g., CoinGecko free or Pro)</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-emerald-400">•</span>
              <span>Data is fetched directly using your key - CryptoReportKit does not redistribute data</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-emerald-400">•</span>
              <span>Your API keys are encrypted and never shared</span>
            </li>
          </ul>
        </div>

        {/* Requirements */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-6">
            <div className="text-3xl mb-3">💻</div>
            <h3 className="text-xl font-semibold mb-2">Microsoft Excel Desktop</h3>
            <p className="text-gray-400 text-sm mb-3">Required for all templates</p>
            <ul className="text-sm text-gray-300 space-y-1">
              <li>• Windows: Excel 2016 or later</li>
              <li>• Mac: Excel 2019 or later</li>
              <li>• Microsoft 365 subscription recommended</li>
            </ul>
            <p className="mt-3 text-xs text-red-400">
              Note: Excel Online and Google Sheets are NOT supported
            </p>
          </div>

          <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-6">
            <div className="text-3xl mb-3">🔌</div>
            <h3 className="text-xl font-semibold mb-2">CRK Excel Add-in</h3>
            <p className="text-gray-400 text-sm mb-3">Required for data retrieval</p>
            <ul className="text-sm text-gray-300 space-y-1">
              <li>• Free add-in from CryptoReportKit</li>
              <li>• Install from Excel Add-ins store</li>
              <li>• Sign in with your CRK account</li>
            </ul>
            <Link
              href="/account/keys"
              className="inline-block mt-3 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 rounded-lg text-sm font-medium transition-colors"
            >
              Manage API Keys →
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
          <h2 className="text-2xl font-semibold mb-4">How Templates Work</h2>
          <div className="space-y-4">
            <div className="flex items-start gap-4">
              <div className="w-8 h-8 rounded-full bg-emerald-600 flex items-center justify-center font-bold shrink-0">1</div>
              <div>
                <h4 className="font-medium">Get Your API Key</h4>
                <p className="text-gray-400 text-sm">Sign up for a free CoinGecko API key at coingecko.com/api</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="w-8 h-8 rounded-full bg-emerald-600 flex items-center justify-center font-bold shrink-0">2</div>
              <div>
                <h4 className="font-medium">Connect Key to CryptoReportKit</h4>
                <p className="text-gray-400 text-sm">Go to Account → API Keys and add your provider key (encrypted storage)</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="w-8 h-8 rounded-full bg-emerald-600 flex items-center justify-center font-bold shrink-0">3</div>
              <div>
                <h4 className="font-medium">Download Template Pack</h4>
                <p className="text-gray-400 text-sm">Use the Report Builder to create and download your template pack</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="w-8 h-8 rounded-full bg-emerald-600 flex items-center justify-center font-bold shrink-0">4</div>
              <div>
                <h4 className="font-medium">Install CRK Add-in</h4>
                <p className="text-gray-400 text-sm">In Excel: Insert → Get Add-ins → Search &quot;CryptoReportKit&quot; → Add</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="w-8 h-8 rounded-full bg-emerald-600 flex items-center justify-center font-bold shrink-0">5</div>
              <div>
                <h4 className="font-medium">Sign In &amp; Refresh</h4>
                <p className="text-gray-400 text-sm">Sign in to the add-in, then click Refresh All to load live data</p>
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
                <li>• 10,000 calls/month</li>
                <li>• Good for small templates (5-10 coins)</li>
                <li>• Rate limited: 10-30 calls/min</li>
              </ul>
            </div>
            <div className="bg-gray-800/50 rounded-lg p-4">
              <h4 className="font-semibold text-white mb-2">CoinGecko Pro</h4>
              <ul className="text-sm text-gray-300 space-y-1">
                <li>• 500K+ calls/month</li>
                <li>• Large templates (100+ coins)</li>
                <li>• Higher rate limits</li>
              </ul>
            </div>
          </div>
          <p className="mt-4 text-sm text-gray-400">
            Most users start with the free CoinGecko Demo API. Upgrade to Pro if you need more capacity.
          </p>
        </div>

        {/* Troubleshooting */}
        <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-6 mb-8">
          <h2 className="text-2xl font-semibold mb-4">Troubleshooting</h2>
          <div className="space-y-4 text-sm">
            <div>
              <h4 className="font-medium text-yellow-400">Seeing #NAME? errors?</h4>
              <p className="text-gray-400">CRK add-in is not installed or not signed in. Install the add-in and sign in, then refresh.</p>
            </div>
            <div>
              <h4 className="font-medium text-yellow-400">Data not loading?</h4>
              <p className="text-gray-400">Check that your API key is connected in Account → API Keys. Verify your internet connection.</p>
            </div>
            <div>
              <h4 className="font-medium text-yellow-400">Rate limit errors?</h4>
              <p className="text-gray-400">You may be exceeding your API key&apos;s rate limit. Reduce refresh frequency or upgrade your CoinGecko plan.</p>
            </div>
            <div>
              <h4 className="font-medium text-yellow-400">Template not opening correctly?</h4>
              <p className="text-gray-400">Make sure you&apos;re using Excel Desktop (not Excel Online or Google Sheets).</p>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="flex flex-wrap gap-4">
          <Link
            href="/account/keys"
            className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 rounded-lg font-medium transition-colors"
          >
            Connect Your API Key
          </Link>
          <Link
            href="/builder"
            className="px-6 py-3 bg-gray-700 hover:bg-gray-600 rounded-lg font-medium transition-colors"
          >
            Build a Report
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
