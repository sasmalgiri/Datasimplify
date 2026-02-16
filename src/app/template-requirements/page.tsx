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
        <h1 className="text-4xl font-bold mb-4">Excel Template Setup Guide</h1>
        <p className="text-gray-400 mb-8 text-lg">
          What you need to use CryptoReportKit Excel templates
        </p>

        {/* Important Notice - Static Data */}
        <div className="bg-emerald-900/30 border-2 border-emerald-500/50 rounded-xl p-6 mb-8">
          <h2 className="text-xl font-bold text-emerald-400 mb-3">Templates Ship with Prefetched Data</h2>
          <p className="text-gray-300">
            CryptoReportKit Excel templates come with <strong>data already included</strong> so you can start
            analyzing immediately. No complex setup required &mdash; just download, open, and explore.
          </p>
          <ul className="mt-3 space-y-2 text-gray-300">
            <li className="flex items-start gap-2">
              <span className="text-emerald-400">&bull;</span>
              <span>Each template includes a recent snapshot of crypto market data</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-emerald-400">&bull;</span>
              <span>Open the .xlsx file and start analyzing right away &mdash; no API key needed for static data</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-emerald-400">&bull;</span>
              <span>For current data, use our web-based dashboards on the website</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-emerald-400">&bull;</span>
              <span>Download a fresh template anytime to get the latest data snapshot</span>
            </li>
          </ul>
        </div>

        {/* Requirements */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-6">
            <div className="text-3xl mb-3">💻</div>
            <h3 className="text-xl font-semibold mb-2">Microsoft Excel Desktop</h3>
            <p className="text-gray-400 text-sm mb-3">Required to open templates</p>
            <ul className="text-sm text-gray-300 space-y-1">
              <li>&bull; Windows: Excel 2016 or later</li>
              <li>&bull; Mac: Excel 2019 or later</li>
              <li>&bull; Microsoft 365 subscription recommended</li>
            </ul>
            <p className="mt-3 text-xs text-yellow-400">
              Note: Templates also work in Excel Online and Google Sheets (import the .xlsx file)
            </p>
          </div>

          <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-6">
            <div className="text-3xl mb-3">📊</div>
            <h3 className="text-xl font-semibold mb-2">Prefetched Data</h3>
            <p className="text-gray-400 text-sm mb-3">No setup required</p>
            <ul className="text-sm text-gray-300 space-y-1">
              <li>&bull; Templates come with data already included</li>
              <li>&bull; Charts and tables are pre-built</li>
              <li>&bull; Ready to analyze the moment you open</li>
            </ul>
            <Link
              href="/downloads"
              className="inline-block mt-3 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 rounded-lg text-sm font-medium transition-colors"
            >
              Browse Excel Templates &rarr;
            </Link>
          </div>

          <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-6">
            <div className="text-3xl mb-3">🔑</div>
            <h3 className="text-xl font-semibold mb-2">Data Provider API Key</h3>
            <p className="text-gray-400 text-sm mb-3">Optional &mdash; for live dashboard use</p>
            <ul className="text-sm text-gray-300 space-y-1">
              <li>&bull; Not needed for static Excel templates</li>
              <li>&bull; Required for live web dashboards</li>
              <li>&bull; CoinGecko free or Pro key supported</li>
            </ul>
            <a
              href="https://www.coingecko.com/en/api"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block mt-3 px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-sm font-medium transition-colors"
            >
              Get CoinGecko Key &rarr;
            </a>
          </div>

          <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-6">
            <div className="text-3xl mb-3">🌐</div>
            <h3 className="text-xl font-semibold mb-2">Internet Connection</h3>
            <p className="text-gray-400 text-sm mb-3">Only needed for downloading</p>
            <ul className="text-sm text-gray-300 space-y-1">
              <li>&bull; Download the template once</li>
              <li>&bull; Analyze data fully offline</li>
              <li>&bull; Re-download anytime for fresh data</li>
            </ul>
          </div>
        </div>

        {/* How It Works */}
        <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-6 mb-8">
          <h2 className="text-2xl font-semibold mb-4">How It Works</h2>
          <div className="space-y-4">
            <div className="flex items-start gap-4">
              <div className="w-8 h-8 rounded-full bg-emerald-600 flex items-center justify-center font-bold shrink-0">1</div>
              <div>
                <h4 className="font-medium">Download the .xlsx Template</h4>
                <p className="text-gray-400 text-sm">Pick a template from our Downloads page (free or paid) and save the .xlsx file</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="w-8 h-8 rounded-full bg-emerald-600 flex items-center justify-center font-bold shrink-0">2</div>
              <div>
                <h4 className="font-medium">Open in Excel</h4>
                <p className="text-gray-400 text-sm">Double-click the file to open it in Microsoft Excel, Google Sheets, or any compatible spreadsheet app</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="w-8 h-8 rounded-full bg-emerald-600 flex items-center justify-center font-bold shrink-0">3</div>
              <div>
                <h4 className="font-medium">Analyze the Data</h4>
                <p className="text-gray-400 text-sm">Explore pre-built charts, tables, and summaries. Filter, sort, and customize to your needs</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="w-8 h-8 rounded-full bg-emerald-600 flex items-center justify-center font-bold shrink-0">4</div>
              <div>
                <h4 className="font-medium">For Current Data, Use Our Web Dashboards</h4>
                <p className="text-gray-400 text-sm">Need current prices and updates? Use our web dashboards on the website</p>
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
                <li>&bull; Good for small templates (5-10 coins)</li>
                <li>&bull; Basic rate limits</li>
                <li>&bull; No credit card required</li>
              </ul>
            </div>
            <div className="bg-gray-800/50 rounded-lg p-4">
              <h4 className="font-semibold text-white mb-2">CoinGecko Pro</h4>
              <ul className="text-sm text-gray-300 space-y-1">
                <li>&bull; Large templates (100+ coins)</li>
                <li>&bull; Higher rate limits</li>
                <li>&bull; Priority support from CoinGecko</li>
              </ul>
            </div>
          </div>
          <p className="mt-4 text-sm text-gray-400">
            API keys are only needed for live web dashboards, not for static Excel templates. See{' '}
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
              <h4 className="font-medium text-yellow-400">Data looks stale or outdated?</h4>
              <p className="text-gray-400">Templates contain a data snapshot from the time they were generated. Download a fresh template from the Downloads page to get the latest data.</p>
            </div>
            <div>
              <h4 className="font-medium text-yellow-400">Want current data?</h4>
              <p className="text-gray-400">Static Excel templates are great for analysis, but if you need current prices, use our web-based dashboards.</p>
            </div>
            <div>
              <h4 className="font-medium text-yellow-400">Template won&apos;t open?</h4>
              <p className="text-gray-400">Make sure you have Excel 2016 or later (Windows) or Excel 2019 or later (Mac). You can also import the .xlsx file into Google Sheets.</p>
            </div>
            <div>
              <h4 className="font-medium text-yellow-400">Charts or formatting look broken?</h4>
              <p className="text-gray-400">Templates are optimized for Microsoft Excel Desktop. Some advanced formatting may not render perfectly in Excel Online or Google Sheets.</p>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="flex flex-wrap gap-4">
          <Link
            href="/downloads"
            className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 rounded-lg font-medium transition-colors"
          >
            Download Excel Templates
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
            &larr; Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}
