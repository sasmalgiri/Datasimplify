'use client';

import Link from 'next/link';
import { FreeNavbar } from '@/components/FreeNavbar';
import { Breadcrumb } from '@/components/Breadcrumb';
import {
  Download,
  UserPlus,
  Key,
  Play,
  CheckCircle,
  ExternalLink,
  FileSpreadsheet,
} from 'lucide-react';

export default function AddinSetupPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <FreeNavbar />
      <Breadcrumb />

      <div className="max-w-4xl mx-auto px-4 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-100 text-emerald-700 rounded-full text-sm font-medium mb-4">
            <FileSpreadsheet className="w-4 h-4" />
            Excel Add-in Setup
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            CRK Excel Add-in Setup Guide
          </h1>
          <p className="text-lg text-gray-600">
            Get live crypto data directly in Excel using your own API keys (BYOK)
          </p>
        </div>

        {/* What You'll Get */}
        <div className="bg-gradient-to-br from-emerald-50 to-blue-50 rounded-xl p-8 mb-12 border border-emerald-200">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">What You'll Get</h2>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-1" />
              <div>
                <p className="font-medium text-gray-900">CRK Custom Functions</p>
                <p className="text-sm text-gray-600">
                  Use <code className="bg-white px-1 rounded">=CRK.PRICE("bitcoin")</code> and more
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-1" />
              <div>
                <p className="font-medium text-gray-900">BYOK Architecture</p>
                <p className="text-sm text-gray-600">
                  Use your own CoinGecko or CMC API keys
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-1" />
              <div>
                <p className="font-medium text-gray-900">Live Data Refresh</p>
                <p className="text-sm text-gray-600">
                  One-click refresh for all CRK functions in your workbook
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-1" />
              <div>
                <p className="font-medium text-gray-900">Secure Encryption</p>
                <p className="text-sm text-gray-600">
                  API keys encrypted with AES-256-GCM at rest
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Setup Steps */}
        <div className="space-y-6 mb-12">
          <h2 className="text-2xl font-bold text-gray-900">Setup Steps</h2>

          {/* Step 1 */}
          <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center">
                <Download className="w-5 h-5 text-emerald-600" />
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  Step 1: Download Manifest File
                </h3>
                <p className="text-gray-600 mb-4">
                  Download the CRK add-in manifest file to install it in Excel.
                </p>
                <a
                  href="/addin/manifest.xml"
                  download="crk-addin-manifest.xml"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors"
                >
                  <Download className="w-4 h-4" />
                  Download Manifest
                </a>
                <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-700 mb-2">
                    <strong>Alternative:</strong> Copy this URL for direct installation:
                  </p>
                  <code className="text-xs bg-white px-2 py-1 rounded border border-gray-200 break-all">
                    https://cryptoreportkit.com/addin/manifest.xml
                  </code>
                </div>
              </div>
            </div>
          </div>

          {/* Step 2 */}
          <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                <FileSpreadsheet className="w-5 h-5 text-blue-600" />
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  Step 2: Install in Excel
                </h3>
                <p className="text-gray-600 mb-4">
                  Sideload the add-in in Excel Desktop (Windows or Mac).
                </p>
                <div className="space-y-3">
                  <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <p className="font-medium text-blue-900 mb-2">Excel Desktop (Windows/Mac):</p>
                    <ol className="text-sm text-blue-800 space-y-1 ml-4 list-decimal">
                      <li>Open Excel and create a new blank workbook</li>
                      <li>Go to <strong>Insert → Office Add-ins → My Add-ins</strong></li>
                      <li>Click <strong>Manage My Add-ins</strong> dropdown → <strong>Upload My Add-in</strong></li>
                      <li>Browse and select the downloaded <code>crk-addin-manifest.xml</code> file</li>
                      <li>Click <strong>Upload</strong></li>
                    </ol>
                  </div>
                  <div className="p-4 bg-amber-50 rounded-lg border border-amber-200">
                    <p className="font-medium text-amber-900 mb-2">Alternative (Shared Folder Method):</p>
                    <ol className="text-sm text-amber-800 space-y-1 ml-4 list-decimal">
                      <li>
                        Follow{' '}
                        <a
                          href="https://learn.microsoft.com/en-us/office/dev/add-ins/testing/create-a-network-shared-folder-catalog-for-task-pane-and-content-add-ins"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="underline hover:text-amber-900"
                        >
                          Microsoft's guide
                          <ExternalLink className="w-3 h-3 inline ml-1" />
                        </a>{' '}
                        to set up a shared folder catalog
                      </li>
                      <li>Copy the manifest file to your shared folder</li>
                      <li>Access it via <strong>Insert → My Add-ins → Shared Folder</strong></li>
                    </ol>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Step 3 */}
          <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                <UserPlus className="w-5 h-5 text-purple-600" />
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  Step 3: Sign In
                </h3>
                <p className="text-gray-600 mb-4">
                  Open the CRK Panel in Excel and sign in with your account.
                </p>
                <ol className="text-sm text-gray-700 space-y-2 ml-4 list-decimal">
                  <li>After installation, click the <strong>CRK Panel</strong> button in the Excel ribbon (Home tab)</li>
                  <li>A taskpane will open on the right side</li>
                  <li>Click <strong>Sign In</strong> to authenticate</li>
                  <li>A secure dialog will open for login</li>
                </ol>
                <div className="mt-4 p-4 bg-purple-50 rounded-lg">
                  <p className="text-sm text-purple-900">
                    <strong>Don't have an account?</strong>{' '}
                    <Link href="/signup" className="underline hover:text-purple-700">
                      Sign up for free
                    </Link>
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Step 4 */}
          <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
                <Key className="w-5 h-5 text-orange-600" />
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  Step 4: Connect Your API Keys (Optional)
                </h3>
                <p className="text-gray-600 mb-4">
                  For higher rate limits, connect your own data provider API keys.
                </p>
                <div className="space-y-3">
                  <p className="text-sm text-gray-700">
                    <strong>Supported Providers:</strong>
                  </p>
                  <ul className="text-sm text-gray-700 space-y-2 ml-4 list-disc">
                    <li>
                      <strong>CoinGecko</strong> - Get a free CoinGecko API key (Demo plan) directly from{' '}
                      <a
                        href="https://www.coingecko.com/en/api/pricing"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-emerald-600 hover:underline"
                      >
                        CoinGecko
                        <ExternalLink className="w-3 h-3 inline ml-1" />
                      </a>
                    </li>
                  </ul>
                  <div className="mt-4 p-4 bg-orange-50 rounded-lg border border-orange-200">
                    <p className="text-sm text-orange-900">
                      <strong>Note:</strong> Your API keys are encrypted with AES-256-GCM before storage.
                      Keys are decrypted only in memory to make requests on your behalf. They are never
                      logged or stored in plaintext.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Step 5 */}
          <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                <Play className="w-5 h-5 text-green-600" />
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  Step 5: Start Using CRK Functions
                </h3>
                <p className="text-gray-600 mb-4">
                  Use CRK custom functions in any cell to get live crypto data.
                </p>
                <div className="space-y-3">
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <p className="text-sm font-medium text-gray-900 mb-2">Available Functions:</p>
                    <div className="space-y-2 text-sm">
                      <div>
                        <code className="bg-white px-2 py-1 rounded text-emerald-600 font-mono">
                          =CRK.PRICE("bitcoin")
                        </code>
                        <span className="text-gray-600 ml-2">→ Current price</span>
                      </div>
                      <div>
                        <code className="bg-white px-2 py-1 rounded text-emerald-600 font-mono">
                          =CRK.CHANGE24H("ethereum")
                        </code>
                        <span className="text-gray-600 ml-2">→ 24h change %</span>
                      </div>
                      <div>
                        <code className="bg-white px-2 py-1 rounded text-emerald-600 font-mono">
                          =CRK.MARKETCAP("bitcoin")
                        </code>
                        <span className="text-gray-600 ml-2">→ Market cap</span>
                      </div>
                      <div>
                        <code className="bg-white px-2 py-1 rounded text-emerald-600 font-mono">
                          =CRK.VOLUME("solana")
                        </code>
                        <span className="text-gray-600 ml-2">→ 24h volume</span>
                      </div>
                      <div>
                        <code className="bg-white px-2 py-1 rounded text-emerald-600 font-mono">
                          =CRK.OHLCV("bitcoin", 30)
                        </code>
                        <span className="text-gray-600 ml-2">→ OHLCV table (spills)</span>
                      </div>
                      <div>
                        <code className="bg-white px-2 py-1 rounded text-emerald-600 font-mono">
                          =CRK.INFO("bitcoin", "rank")
                        </code>
                        <span className="text-gray-600 ml-2">→ Coin metadata</span>
                      </div>
                    </div>
                  </div>
                  <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                    <p className="text-sm text-green-900">
                      <strong>Tip:</strong> Use the <strong>Refresh All Data</strong> button in the CRK Panel
                      to update all formulas with the latest data.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Troubleshooting */}
        <div className="bg-amber-50 rounded-xl border border-amber-200 p-6 mb-12">
          <h2 className="text-xl font-semibold text-amber-900 mb-4">Troubleshooting</h2>
          <div className="space-y-3 text-sm text-amber-800">
            <div>
              <p className="font-medium">Add-in not appearing in Excel?</p>
              <p>Make sure you're using Excel Desktop (not Excel Online). The add-in requires Excel 2016 or later.</p>
            </div>
            <div>
              <p className="font-medium">Functions showing #NAME? error?</p>
              <p>The custom functions may take a few seconds to register. Try closing and reopening the workbook.</p>
            </div>
            <div>
              <p className="font-medium">Authentication failing?</p>
              <p>Clear your browser cookies and try signing in again. Make sure pop-ups are not blocked.</p>
            </div>
            <div>
              <p className="font-medium">Still having issues?</p>
              <p>
                Contact us at{' '}
                <a href="mailto:support@cryptoreportkit.com" className="underline hover:text-amber-900">
                  support@cryptoreportkit.com
                </a>
              </p>
            </div>
          </div>
        </div>

        {/* Next Steps */}
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Ready to get started?</h2>
          <div className="flex flex-wrap gap-4 justify-center">
            <a
              href="/addin/manifest.xml"
              download="crk-addin-manifest.xml"
              className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors font-medium"
            >
              <Download className="w-5 h-5" />
              Download Manifest
            </a>
            <Link
              href="/templates"
              className="inline-flex items-center gap-2 px-6 py-3 bg-gray-800 hover:bg-gray-700 text-white rounded-lg transition-colors font-medium"
            >
              Browse Templates
            </Link>
          </div>
        </div>

        {/* Back Link */}
        <div className="mt-12 pt-8 border-t border-gray-200 text-center">
          <Link href="/" className="text-emerald-600 hover:text-emerald-700">
            ← Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}
