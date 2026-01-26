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
            Connect Your CoinGecko API Key
          </h1>

          <p className="text-xl text-gray-300 max-w-2xl mx-auto">
            CryptoReportKit uses a BYOK model: you connect your own CoinGecko API key.
            We do not provide, sell, or redistribute API keys, credentials, or entitlements.
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
              <span><strong>You control your data:</strong> Your API key, your rate limits, your usage</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
              <span><strong>Transparent pricing:</strong> Pay CoinGecko directly for your tier (free Demo available)</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
              <span><strong>Security:</strong> Your keys are encrypted at rest (AES-256-GCM) and never shared</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
              <span><strong>Compliance:</strong> You comply directly with CoinGecko&apos;s terms of service</span>
            </li>
          </ul>
          <p className="mt-4 text-sm text-gray-400 border-t border-gray-600 pt-4">
            <strong>Important:</strong> Your key is used only to fetch data for your account.
            We do not provide or resell API access. You maintain a direct relationship with CoinGecko.
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
                  Give it a descriptive name (e.g., &quot;CryptoReportKit Excel Add-in&quot;).
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
                <h3 className="font-semibold text-lg mb-2">Copy and Paste into CRK Add-in</h3>
                <p className="text-gray-300 mb-3">
                  Copy your API key and paste it into the CryptoReportKit Excel Add-in:
                </p>
                <ol className="list-decimal list-inside text-gray-400 text-sm space-y-1 ml-4">
                  <li>Open Excel and launch the CRK add-in (Insert → My Add-ins → CryptoReportKit)</li>
                  <li>Go to the &quot;API Keys&quot; section in the add-in taskpane</li>
                  <li>Paste your CoinGecko API key</li>
                  <li>Click &quot;Verify Key&quot; to test the connection</li>
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
                  <strong>Treat your API key like a password.</strong> Never share it publicly or paste it directly into spreadsheet cells.
                </li>
                <li>
                  <strong>Store it only in the add-in settings.</strong> The CRK add-in encrypts your key at rest (AES-256-GCM).
                </li>
                <li>
                  <strong>Don&apos;t share workbooks containing your key.</strong> If you share templates, the formulas are safe—but never share your API key.
                </li>
                <li>
                  <strong>Rotate your key if exposed.</strong> If you accidentally expose your key, delete it in the CoinGecko dashboard and generate a new one.
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
                <h3 className="font-semibold">CRK Template Requirements</h3>
              </div>
              <p className="text-sm text-gray-400">Setup instructions for Excel templates</p>
            </Link>

            <Link
              href="/addin/setup"
              className="p-4 bg-gray-700/50 hover:bg-gray-700 rounded-lg transition border border-gray-600"
            >
              <div className="flex items-center gap-2 mb-2">
                <Key className="w-4 h-4 text-emerald-400" />
                <h3 className="font-semibold">CRK Add-in Setup</h3>
              </div>
              <p className="text-sm text-gray-400">Install the CryptoReportKit Excel Add-in</p>
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
                Limits depend on your CoinGecko plan—check{' '}
                <a href="https://www.coingecko.com/en/api/pricing" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">
                  CoinGecko pricing
                </a>{' '}
                for current details.
              </p>
            </div>

            <div>
              <h3 className="font-medium text-white mb-1">Where does CRK store my API key?</h3>
              <p className="text-sm text-gray-400">
                Your API key is encrypted using AES-256-GCM and stored securely in the CRK database. It is decrypted only in memory
                when making API calls to CoinGecko on your behalf. We never log or share your plaintext key.
              </p>
            </div>

            <div>
              <h3 className="font-medium text-white mb-1">Can I delete my API key from CRK?</h3>
              <p className="text-sm text-gray-400">
                Yes! You can delete your API key anytime from the CRK add-in or from your CRK account settings.
                Deleting your account also permanently deletes your encrypted keys.
              </p>
            </div>

            <div>
              <h3 className="font-medium text-white mb-1">What if I exceed my CoinGecko rate limit?</h3>
              <p className="text-sm text-gray-400">
                If you exceed your plan&apos;s rate limits, CoinGecko will return an error. You can upgrade to a higher CoinGecko plan
                (Analyst or Pro) for higher limits. See{' '}
                <a href="https://www.coingecko.com/en/api/pricing" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">
                  CoinGecko pricing
                </a>
                .
              </p>
            </div>

            <div>
              <h3 className="font-medium text-white mb-1">Does CRK charge me for BYOK?</h3>
              <p className="text-sm text-gray-400">
                No! BYOK is included in all CRK plans (Free, Pro, Premium). You only pay CoinGecko directly for your API plan.
                CRK charges for features like scheduled exports, advanced templates, and premium support.
              </p>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="mt-12 text-center">
          <Link
            href="/addin/setup"
            className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-700 rounded-lg font-medium transition"
          >
            <Key className="w-5 h-5" />
            Install CRK Add-in
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
