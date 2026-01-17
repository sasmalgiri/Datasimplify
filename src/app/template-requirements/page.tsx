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
        <h1 className="text-4xl font-bold mb-4">Spreadsheet Template Requirements</h1>
        <p className="text-gray-400 mb-8 text-lg">
          What you need to use CryptoReportKit Excel templates
        </p>

        {/* Important Notice */}
        <div className="bg-yellow-900/30 border-2 border-yellow-500/50 rounded-xl p-6 mb-8">
          <h2 className="text-xl font-bold text-yellow-400 mb-3">Important: Templates Contain Formulas Only</h2>
          <p className="text-gray-300">
            CryptoReportKit templates do <strong>not contain any market data</strong>. They contain
            CryptoSheets formulas that fetch live data when you open the file in Excel.
            This means:
          </p>
          <ul className="mt-3 space-y-2 text-gray-300">
            <li className="flex items-start gap-2">
              <span className="text-yellow-400">•</span>
              <span>You need the CryptoSheets add-in installed in Excel</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-yellow-400">•</span>
              <span>You need an active CryptoSheets account (sign in within Excel)</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-yellow-400">•</span>
              <span>Data is fetched directly by CryptoSheets - CryptoReportKit does not redistribute data</span>
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
            <h3 className="text-xl font-semibold mb-2">CryptoSheets Add-in</h3>
            <p className="text-gray-400 text-sm mb-3">Required for data retrieval</p>
            <ul className="text-sm text-gray-300 space-y-1">
              <li>• Free and paid plans available</li>
              <li>• Install from Excel Add-ins store</li>
              <li>• Sign in required before use</li>
            </ul>
            <a
              href="https://www.cryptosheets.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block mt-3 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 rounded-lg text-sm font-medium transition-colors"
            >
              Get CryptoSheets →
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

          <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-6">
            <div className="text-3xl mb-3">🔑</div>
            <h3 className="text-xl font-semibold mb-2">CryptoSheets Account</h3>
            <p className="text-gray-400 text-sm mb-3">Sign in within Excel</p>
            <ul className="text-sm text-gray-300 space-y-1">
              <li>• Create free account at CryptoSheets</li>
              <li>• Sign in through the Excel add-in</li>
              <li>• Free tier has usage limits</li>
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
                <h4 className="font-medium">Download Template</h4>
                <p className="text-gray-400 text-sm">Get the .xlsx file from CryptoReportKit</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="w-8 h-8 rounded-full bg-emerald-600 flex items-center justify-center font-bold shrink-0">2</div>
              <div>
                <h4 className="font-medium">Open in Excel Desktop</h4>
                <p className="text-gray-400 text-sm">Open the file in Microsoft Excel (not online)</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="w-8 h-8 rounded-full bg-emerald-600 flex items-center justify-center font-bold shrink-0">3</div>
              <div>
                <h4 className="font-medium">Install CryptoSheets (if needed)</h4>
                <p className="text-gray-400 text-sm">Go to Insert → Get Add-ins → Search "CryptoSheets" → Add</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="w-8 h-8 rounded-full bg-emerald-600 flex items-center justify-center font-bold shrink-0">4</div>
              <div>
                <h4 className="font-medium">Sign In to CryptoSheets</h4>
                <p className="text-gray-400 text-sm">Sign in with your CryptoSheets account within Excel</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="w-8 h-8 rounded-full bg-emerald-600 flex items-center justify-center font-bold shrink-0">5</div>
              <div>
                <h4 className="font-medium">Refresh Data</h4>
                <p className="text-gray-400 text-sm">Click Data → Refresh All (or Ctrl+Alt+F5) to load live data</p>
              </div>
            </div>
          </div>
        </div>

        {/* Troubleshooting */}
        <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-6 mb-8">
          <h2 className="text-2xl font-semibold mb-4">Troubleshooting</h2>
          <div className="space-y-4 text-sm">
            <div>
              <h4 className="font-medium text-yellow-400">Seeing #NAME? errors?</h4>
              <p className="text-gray-400">CryptoSheets add-in is not installed or not signed in. Install and sign in, then refresh.</p>
            </div>
            <div>
              <h4 className="font-medium text-yellow-400">Data not loading?</h4>
              <p className="text-gray-400">Check your internet connection and CryptoSheets account status. Try clicking Refresh All.</p>
            </div>
            <div>
              <h4 className="font-medium text-yellow-400">Template not opening correctly?</h4>
              <p className="text-gray-400">Make sure you're using Excel Desktop (not Excel Online or Google Sheets).</p>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="flex flex-wrap gap-4">
          <a
            href="https://www.cryptosheets.com/"
            target="_blank"
            rel="noopener noreferrer"
            className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 rounded-lg font-medium transition-colors"
          >
            Install CryptoSheets Add-in
          </a>
          <Link
            href="/templates"
            className="px-6 py-3 bg-gray-700 hover:bg-gray-600 rounded-lg font-medium transition-colors"
          >
            Browse Templates
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
