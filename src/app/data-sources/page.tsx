'use client';

import Link from 'next/link';
import { ExternalLink, Shield, Info } from 'lucide-react';

export default function DataSourcesPage() {
  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 py-16 px-4">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl font-bold mb-4">Data Sources & Attribution</h1>
        <p className="text-gray-600 mb-8">
          CryptoReportKit aggregates cryptocurrency data from multiple trusted providers. This page provides
          full attribution, usage context, and links to each provider&apos;s terms of service.
        </p>

        {/* Important Notice */}
        <div className="bg-blue-50 border border-blue-200 p-6 rounded-lg mb-8">
          <div className="flex items-start gap-3">
            <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-1" />
            <div>
              <h3 className="font-semibold text-blue-900 mb-2">Two Usage Models</h3>
              <ul className="text-sm text-gray-700 space-y-1">
                <li><strong>Display-Only Dashboards:</strong> Our website dashboards (e.g., /market, /research) display
                  aggregated data publicly for educational purposes. We aim to comply with provider API terms; use is subject to provider policies.</li>
                <li><strong>BYOK (Bring Your Own Keys):</strong> Our Excel add-in uses <strong>your own API keys</strong>.
                  Data fetched via your keys is governed by your agreement with the provider.</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Data Providers Table */}
        <div className="space-y-6">
          {/* CoinGecko */}
          <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h2 className="text-2xl font-semibold text-gray-900">CoinGecko</h2>
                <p className="text-sm text-gray-500">Primary market data provider</p>
              </div>
              <a
                href="https://www.coingecko.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-emerald-600 hover:text-emerald-700 flex items-center gap-1 text-sm"
              >
                Visit Site <ExternalLink className="w-4 h-4" />
              </a>
            </div>
            <div className="grid md:grid-cols-2 gap-4 mb-4">
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Data Types</h3>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Real-time cryptocurrency prices</li>
                  <li>• Historical OHLCV data</li>
                  <li>• Market cap & volume metrics</li>
                  <li>• Coin metadata (rank, supply, etc.)</li>
                </ul>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Usage Context</h3>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• <strong>Website:</strong> Display-only dashboards (free API tier)</li>
                  <li>• <strong>Excel Add-in:</strong> BYOK - you provide your own API key</li>
                </ul>
              </div>
            </div>
            <div className="flex flex-wrap gap-3 text-sm">
              <a
                href="https://www.coingecko.com/en/api/pricing"
                target="_blank"
                rel="noopener noreferrer"
                className="text-emerald-600 hover:underline"
              >
                Get API Key →
              </a>
              <span className="text-gray-400">|</span>
              <a
                href="https://docs.coingecko.com/reference/introduction"
                target="_blank"
                rel="noopener noreferrer"
                className="text-emerald-600 hover:underline"
              >
                API Documentation →
              </a>
              <span className="text-gray-400">|</span>
              <a
                href="https://www.coingecko.com/en/terms"
                target="_blank"
                rel="noopener noreferrer"
                className="text-emerald-600 hover:underline"
              >
                Terms of Service →
              </a>
            </div>
          </div>

          {/* Alternative.me */}
          <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h2 className="text-2xl font-semibold text-gray-900">Alternative.me</h2>
                <p className="text-sm text-gray-500">Crypto Fear & Greed Index</p>
              </div>
              <a
                href="https://alternative.me"
                target="_blank"
                rel="noopener noreferrer"
                className="text-emerald-600 hover:text-emerald-700 flex items-center gap-1 text-sm"
              >
                Visit Site <ExternalLink className="w-4 h-4" />
              </a>
            </div>
            <div className="grid md:grid-cols-2 gap-4 mb-4">
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Data Types</h3>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Crypto Fear & Greed Index (0-100)</li>
                  <li>• Historical index data</li>
                  <li>• Sentiment classification</li>
                </ul>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Usage Context</h3>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• <strong>Website:</strong> Display-only dashboards (public API)</li>
                  <li>• <strong>Excel Add-in:</strong> Included formulas (no API key required)</li>
                </ul>
              </div>
            </div>
            <div className="flex flex-wrap gap-3 text-sm">
              <a
                href="https://alternative.me/crypto/fear-and-greed-index/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-emerald-600 hover:underline"
              >
                View Index →
              </a>
              <span className="text-gray-400">|</span>
              <a
                href="https://alternative.me/crypto/fear-and-greed-index/#api"
                target="_blank"
                rel="noopener noreferrer"
                className="text-emerald-600 hover:underline"
              >
                API Documentation →
              </a>
            </div>
          </div>

          {/* Sourcify */}
          <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h2 className="text-2xl font-semibold text-gray-900">Sourcify</h2>
                <p className="text-sm text-gray-500">Smart contract verification</p>
              </div>
              <a
                href="https://sourcify.dev"
                target="_blank"
                rel="noopener noreferrer"
                className="text-emerald-600 hover:text-emerald-700 flex items-center gap-1 text-sm"
              >
                Visit Site <ExternalLink className="w-4 h-4" />
              </a>
            </div>
            <div className="grid md:grid-cols-2 gap-4 mb-4">
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Data Types</h3>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Contract verification status</li>
                  <li>• Source code matching</li>
                  <li>• Multi-chain support</li>
                </ul>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Usage Context</h3>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• <strong>Website:</strong> SafeContract verification tool</li>
                  <li>• <strong>Excel Add-in:</strong> Not currently used</li>
                </ul>
              </div>
            </div>
            <div className="flex flex-wrap gap-3 text-sm">
              <a
                href="https://docs.sourcify.dev/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-emerald-600 hover:underline"
              >
                Documentation →
              </a>
              <span className="text-gray-400">|</span>
              <a
                href="https://sourcify.dev"
                target="_blank"
                rel="noopener noreferrer"
                className="text-emerald-600 hover:underline"
              >
                Verify Contract →
              </a>
            </div>
          </div>
        </div>

        {/* BYOK Explanation */}
        <div className="mt-12 bg-gray-100 p-6 rounded-lg">
          <div className="flex items-start gap-3">
            <Shield className="w-6 h-6 text-emerald-600 flex-shrink-0 mt-1" />
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">BYOK (Bring Your Own Keys)</h2>
              <p className="text-gray-700 mb-4">
                Our Excel add-in operates on a <strong>server-proxy BYOK architecture</strong>. Here&apos;s how it works:
              </p>
              <ul className="list-disc list-inside space-y-2 text-gray-700 mb-4">
                <li><strong>You provide:</strong> Your own API keys from data providers (e.g., CoinGecko)</li>
                <li><strong>We encrypt:</strong> Your keys are encrypted with AES-256-GCM before storage</li>
                <li><strong>We proxy:</strong> Our server calls providers on your behalf using your encrypted keys</li>
                <li><strong>You control:</strong> You can update or delete your keys anytime from{' '}
                  <Link href="/account/keys" className="text-emerald-600 hover:underline">Account Settings</Link></li>
                <li><strong>You comply:</strong> You are responsible for respecting provider rate limits and terms</li>
              </ul>
              <p className="text-sm text-gray-600">
                <strong>Important:</strong> Data fetched via your API keys is governed by your agreement with the provider,
                not by CryptoReportKit. We never sell or share your keys. See our{' '}
                <Link href="/privacy" className="text-emerald-600 hover:underline">Privacy Policy</Link> for details.
              </p>
            </div>
          </div>
        </div>

        {/* Compliance Statement */}
        <div className="mt-8 p-6 bg-white border border-gray-200 rounded-lg">
          <h2 className="text-xl font-semibold text-gray-900 mb-3">Compliance & Attribution</h2>
          <p className="text-gray-700 mb-4">
            CryptoReportKit respects intellectual property rights and provider terms of service. We:
          </p>
          <ul className="list-disc list-inside space-y-2 text-gray-700">
            <li>Provide clear attribution to all data sources on this page and throughout our services</li>
            <li>Aim to use data in compliance with each provider&apos;s API terms (display for dashboards, BYOK for user-driven fetching). Use is subject to provider policies; availability may change.</li>
            <li>Do not scrape, resell, or redistribute provider data beyond permitted use cases</li>
            <li>Encourage users to review and comply with provider terms when using BYOK features</li>
          </ul>
          <p className="text-gray-700 mt-4">
            If you are a data provider and have questions or concerns about our usage, please contact us at{' '}
            <a href="mailto:support@cryptoreportkit.com" className="text-emerald-600 hover:underline">
              support@cryptoreportkit.com
            </a>.
          </p>
        </div>

        {/* Back Links */}
        <div className="mt-12 pt-8 border-t border-gray-200 flex flex-wrap gap-4">
          <Link href="/" className="text-emerald-600 hover:text-emerald-700">&larr; Back to Home</Link>
          <span className="text-gray-400">|</span>
          <Link href="/disclaimer" className="text-emerald-600 hover:text-emerald-700">Disclaimer</Link>
          <span className="text-gray-400">|</span>
          <Link href="/terms" className="text-emerald-600 hover:text-emerald-700">Terms of Service</Link>
          <span className="text-gray-400">|</span>
          <Link href="/privacy" className="text-emerald-600 hover:text-emerald-700">Privacy Policy</Link>
        </div>
      </div>
    </div>
  );
}
