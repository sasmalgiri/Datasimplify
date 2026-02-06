'use client';

import Link from 'next/link';
import { ExternalLink, Key, Shield, CheckCircle, AlertTriangle } from 'lucide-react';
import { FreeNavbar } from '@/components/FreeNavbar';

export default function BYOKPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900 text-white">
      <FreeNavbar />

      <div className="max-w-4xl mx-auto px-4 py-12">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-500/10 border border-emerald-500/30 rounded-full mb-4">
            <Key className="w-4 h-4 text-emerald-400" />
            <span className="text-sm text-emerald-400 font-medium">Bring Your Own Key (BYOK)</span>
          </div>

          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Your API Key, Your Control
          </h1>

          <p className="text-xl text-gray-300 max-w-2xl mx-auto">
            CryptoReportKit uses a true BYOK model: your CoinGecko API key stays on your computer.
            We never see, store, or proxy your API key. All API calls go directly to CoinGecko.
          </p>
        </div>

        {/* Why BYOK */}
        <div className="bg-blue-900/20 border border-blue-500/30 rounded-xl p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <Shield className="w-5 h-5 text-blue-400" />
            Why BYOK?
          </h2>
          <ul className="space-y-2 text-gray-300">
            <li className="flex items-start gap-2">
              <CheckCircle className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
              <span><strong>True privacy:</strong> Your API key is stored locally - it never leaves your computer</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
              <span><strong>No middleman:</strong> API calls go directly to CoinGecko, not through our servers</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
              <span><strong>Transparent pricing:</strong> Pay CoinGecko directly for your tier (free Demo available)</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
              <span><strong>Zero server storage:</strong> We never see, store, or have access to your API keys</span>
            </li>
          </ul>
          <p className="mt-4 text-sm text-gray-400 border-t border-gray-600 pt-4">
            <strong>Two options:</strong> Use our <strong>Power Query templates</strong> (key in Excel cells) or the
            <strong> CRK Excel Add-in</strong> (key in browser LocalStorage). Both methods keep your key 100% local.
          </p>
        </div>

        {/* Step-by-Step Guide */}
        <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-6 mb-8">
          <h2 className="text-2xl font-semibold mb-6">How to Get Your CoinGecko API Key</h2>

          <div className="space-y-6">
            {/* Step 1 */}
            <div className="flex gap-4">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-emerald-600 flex items-center justify-center font-bold">
                1
              </div>
              <div>
                <h3 className="font-semibold text-lg mb-2">Create a CoinGecko Account</h3>
                <p className="text-gray-300 mb-3">
                  If you don&apos;t have a CoinGecko account, create one for free.
                </p>
                <a
                  href="https://www.coingecko.com/en/api/pricing"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition"
                >
                  Go to CoinGecko API Pricing
                  <ExternalLink className="w-4 h-4" />
                </a>
              </div>
            </div>

            {/* Step 2 */}
            <div className="flex gap-4">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-emerald-600 flex items-center justify-center font-bold">
                2
              </div>
              <div>
                <h3 className="font-semibold text-lg mb-2">Choose a CoinGecko Plan</h3>
                <p className="text-gray-300 mb-2">
                  CoinGecko offers multiple plans including a free Demo tier. Check their pricing page for current limits and features.
                </p>
                <p className="text-sm text-gray-400">
                  <strong>Limits depend on your CoinGecko plan.</strong> See{' '}
                  <a href="https://www.coingecko.com/en/api/pricing" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">
                    CoinGecko API pricing
                  </a>{' '}
                  for current rate limits and call quotas.
                </p>
              </div>
            </div>

            {/* Step 3 */}
            <div className="flex gap-4">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-emerald-600 flex items-center justify-center font-bold">
                3
              </div>
              <div>
                <h3 className="font-semibold text-lg mb-2">Open the Developer Dashboard</h3>
                <p className="text-gray-300 mb-3">
                  Once you&apos;ve enabled a plan, go to your CoinGecko Developer Dashboard.
                </p>
                <a
                  href="https://www.coingecko.com/en/developers/dashboard"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition"
                >
                  Open Developer Dashboard
                  <ExternalLink className="w-4 h-4" />
                </a>
              </div>
            </div>

            {/* Step 4 */}
            <div className="flex gap-4">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-emerald-600 flex items-center justify-center font-bold">
                4
              </div>
              <div>
                <h3 className="font-semibold text-lg mb-2">Generate an API Key</h3>
                <p className="text-gray-300 mb-2">
                  In the Developer Dashboard, click <strong>&quot;+ Add New Key&quot;</strong> to generate your API key.
                  Give it a descriptive name (e.g., &quot;CryptoReportKit Excel&quot;).
                </p>
                <p className="text-gray-400 text-sm">
                  Your key will look like: <code className="bg-gray-900 px-2 py-1 rounded text-emerald-400">CG-xxxxxxxxxxxxxxxxxxxx</code>
                </p>
              </div>
            </div>

            {/* Step 5 */}
            <div className="flex gap-4">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-emerald-600 flex items-center justify-center font-bold">
                5
              </div>
              <div>
                <h3 className="font-semibold text-lg mb-2">Add Key to Power Query</h3>
                <p className="text-gray-300 mb-3">
                  Add your API key to Excel for use with Power Query:
                </p>
                <ol className="list-decimal list-inside text-gray-400 text-sm space-y-1 ml-4">
                  <li>Create a named cell (e.g., &quot;ApiKey&quot;) on a Settings sheet</li>
                  <li>Paste your CoinGecko API key in that cell</li>
                  <li>Our Pro templates reference this cell automatically</li>
                  <li>Or paste the key directly in the M code (less secure for shared files)</li>
                </ol>
              </div>
            </div>
          </div>
        </div>

        {/* Security Warning */}
        <div className="bg-amber-900/20 border-2 border-amber-500/50 rounded-xl p-6 mb-8">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-6 h-6 text-amber-400 flex-shrink-0 mt-1" />
            <div>
              <h3 className="text-lg font-semibold text-amber-400 mb-2">Security Best Practices</h3>
              <ul className="space-y-2 text-gray-300 text-sm">
                <li>
                  <strong>Treat your API key like a password.</strong> Don&apos;t share workbooks that contain your key in plain text.
                </li>
                <li>
                  <strong>Use a named cell for your key.</strong> Store it on a hidden &quot;Settings&quot; sheet that you exclude when sharing.
                </li>
                <li>
                  <strong>Rotate your key if exposed.</strong> If you accidentally share your key, delete it in CoinGecko and generate a new one.
                </li>
                <li>
                  <strong>Monitor your usage.</strong> Check your{' '}
                  <a href="https://www.coingecko.com/en/developers/dashboard" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">
                    CoinGecko dashboard
                  </a>{' '}
                  regularly to ensure no unexpected activity.
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Additional Resources */}
        <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">Additional Resources</h2>
          <div className="grid md:grid-cols-2 gap-4">
            <a
              href="https://www.coingecko.com/en/api/documentation"
              target="_blank"
              rel="noopener noreferrer"
              className="p-4 bg-gray-700/50 hover:bg-gray-700 rounded-lg transition border border-gray-600"
            >
              <div className="flex items-center gap-2 mb-2">
                <ExternalLink className="w-4 h-4 text-blue-400" />
                <h3 className="font-semibold">CoinGecko API Docs</h3>
              </div>
              <p className="text-sm text-gray-400">Official API documentation and endpoints</p>
            </a>

            <a
              href="https://www.coingecko.com/en/api/pricing"
              target="_blank"
              rel="noopener noreferrer"
              className="p-4 bg-gray-700/50 hover:bg-gray-700 rounded-lg transition border border-gray-600"
            >
              <div className="flex items-center gap-2 mb-2">
                <ExternalLink className="w-4 h-4 text-blue-400" />
                <h3 className="font-semibold">CoinGecko Pricing</h3>
              </div>
              <p className="text-sm text-gray-400">Compare Demo, Analyst, and Pro plans</p>
            </a>

            <Link
              href="/template-requirements"
              className="p-4 bg-gray-700/50 hover:bg-gray-700 rounded-lg transition border border-gray-600"
            >
              <div className="flex items-center gap-2 mb-2">
                <Key className="w-4 h-4 text-emerald-400" />
                <h3 className="font-semibold">Power Query Setup Guide</h3>
              </div>
              <p className="text-sm text-gray-400">How to use our templates in Excel</p>
            </Link>

            <Link
              href="/downloads"
              className="p-4 bg-gray-700/50 hover:bg-gray-700 rounded-lg transition border border-gray-600"
            >
              <div className="flex items-center gap-2 mb-2">
                <Key className="w-4 h-4 text-emerald-400" />
                <h3 className="font-semibold">Download Templates</h3>
              </div>
              <p className="text-sm text-gray-400">Get free and Pro Power Query templates</p>
            </Link>
          </div>
        </div>

        {/* FAQ */}
        <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-6">
          <h2 className="text-xl font-semibold mb-4">Frequently Asked Questions</h2>
          <div className="space-y-4">
            <div>
              <h3 className="font-medium text-white mb-1">Is the Demo plan really free?</h3>
              <p className="text-sm text-gray-400">
                Yes! CoinGecko offers a free Demo plan that doesn&apos;t require a credit card.
                It has rate limits suitable for personal use with our Free templates.
              </p>
            </div>

            <div>
              <h3 className="font-medium text-white mb-1">Does CryptoReportKit store my API key?</h3>
              <p className="text-sm text-gray-400">
                No! Your API key is stored only on your computer. With Power Query, it stays in your Excel file.
                With the CRK Add-in, it stays in your browser&apos;s LocalStorage. We never see, transmit, or store your keys on our servers.
              </p>
            </div>

            <div>
              <h3 className="font-medium text-white mb-1">Can I share templates with my key in them?</h3>
              <p className="text-sm text-gray-400">
                You can, but we recommend using a named cell on a hidden Settings sheet. Remove or clear that sheet before sharing.
                Better yet, share the template without your key and let recipients add their own.
              </p>
            </div>

            <div>
              <h3 className="font-medium text-white mb-1">What if I exceed my CoinGecko rate limit?</h3>
              <p className="text-sm text-gray-400">
                Power Query will show an error. Reduce refresh frequency or upgrade to CoinGecko Pro for higher limits.
              </p>
            </div>

            <div>
              <h3 className="font-medium text-white mb-1">Do I need a CoinGecko Pro key for paid templates?</h3>
              <p className="text-sm text-gray-400">
                Not necessarily. Paid templates work with free API keys but may hit rate limits faster due to more data.
                For 100+ coins, we recommend CoinGecko Pro for reliable performance.
              </p>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="mt-12 text-center">
          <Link
            href="/downloads"
            className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-700 rounded-lg font-medium transition"
          >
            <Key className="w-5 h-5" />
            Get Power Query Templates
          </Link>
        </div>

        {/* Back Link */}
        <div className="mt-8 pt-8 border-t border-gray-700 text-center">
          <Link href="/" className="text-emerald-400 hover:text-emerald-300">
            ← Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}
