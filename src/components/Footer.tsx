'use client';

import Link from 'next/link';
import { CookieSettingsButton } from '@/components/CookieSettingsButton';
import { CoinGeckoAttribution } from '@/components/CoinGeckoAttribution';
import { FEATURES } from '@/lib/featureFlags';

export function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-400 py-12 border-t border-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid md:grid-cols-4 gap-8">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <span className="text-2xl">📊</span>
              <span className="font-bold text-xl text-white">CryptoReportKit</span>
            </div>
            <p className="text-sm">
              Democratizing crypto data for everyone. No coding required.
            </p>
          </div>

          {/* Product - A/B/C/D only */}
          <div>
            <h4 className="font-semibold text-white mb-4">Product</h4>
            <ul className="space-y-2 text-sm">
              <li><Link href="/downloads" className="hover:text-white transition-colors">Downloads</Link></li>
              <li><Link href="/download" className="hover:text-white transition-colors">Customize Templates</Link></li>
              <li><Link href="/addin/setup" className="hover:text-white transition-colors">Excel Add-in Setup</Link></li>
              <li><Link href="/compare" className="hover:text-white transition-colors">Compare Coins</Link></li>
              <li><Link href="/smart-contract-verifier" className="hover:text-white transition-colors">Verify Contracts</Link></li>
              <li><Link href="/pricing" className="hover:text-white transition-colors">Pricing</Link></li>
            </ul>
          </div>

          {/* Data Sources */}
          <div>
            <h4 className="font-semibold text-white mb-4">Data Sources</h4>
            <ul className="space-y-2 text-sm">
              <li><span className="text-gray-500">CoinGecko (Market Data)</span></li>
              <li><span className="text-gray-500">Alternative.me (Fear & Greed)</span></li>
              <li><span className="text-gray-500">Sourcify (Contract Verification)</span></li>
              <li><Link href="/data-sources" className="text-emerald-400 hover:text-emerald-300 text-xs underline">View All & Terms →</Link></li>
            </ul>

            {/* Global CoinGecko Attribution */}
            <div className="mt-4">
              <CoinGeckoAttribution variant="footer" className="text-[10px]" />
            </div>
          </div>

          {/* Resources */}
          <div>
            <h4 className="font-semibold text-white mb-4">Resources</h4>
            <ul className="space-y-2 text-sm">
              <li><Link href="/template-requirements" className="hover:text-white transition-colors">Setup Guide</Link></li>
              <li><Link href="/byok" className="hover:text-white transition-colors">BYOK Guide</Link></li>
              <li><Link href="/learn" className="hover:text-white transition-colors">Crypto Academy</Link></li>
              <li><Link href="/glossary" className="hover:text-white transition-colors">Glossary</Link></li>
              <li><Link href="/faq" className="hover:text-white transition-colors">FAQ</Link></li>
              <li><Link href="/contact" className="hover:text-white transition-colors">Contact Us</Link></li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="font-semibold text-white mb-4">Legal</h4>
            <ul className="space-y-2 text-sm">
              <li><Link href="/about" className="hover:text-white transition-colors">About Us</Link></li>
              <li><Link href="/disclaimer" className="hover:text-white transition-colors">Disclaimer</Link></li>
              <li><Link href="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link></li>
              <li><Link href="/terms" className="hover:text-white transition-colors">Terms of Service</Link></li>
              <li><Link href="/refund" className="hover:text-white transition-colors">Refund Policy</Link></li>
            </ul>
          </div>
        </div>

        {/* Compliance Section */}
        <div className="border-t border-gray-800 mt-8 pt-8">
          <div className="bg-gray-800/30 rounded-lg p-4 mb-6 space-y-3">
            <p className="text-xs text-gray-500 leading-relaxed">
              <span className="text-yellow-500 font-medium">⚠️ Important Disclaimer:</span> CryptoReportKit provides educational software tools only.
              Nothing on this platform constitutes financial, investment, tax, or legal advice.
              Cryptocurrency investments are highly volatile and risky - you may lose some or all of your investment.
              Past performance is not indicative of future results. Always DYOR (Do Your Own Research)
              and consult with qualified financial advisors before making any investment decisions.
            </p>
            <div className="text-xs text-gray-600 space-y-1">
              <p><strong className="text-gray-400">Product Scope:</strong></p>
              <ul className="list-disc list-inside space-y-0.5 ml-2">
                <li>CryptoReportKit is software analytics tooling - not a data vendor or broker.</li>
                <li>No trading execution, order routing, or brokerage services.</li>
                <li>No market-data redistribution - we do not sell or license raw data.</li>
                <li>Excel templates support Power Query (no add-in required) and an optional Excel add-in (formula mode).</li>
                <li>Display-only dashboards for educational visualization.</li>
                <li><strong>We do not provide, sell, or redistribute provider API keys or credentials.</strong> BYOK means you bring your own API keys from data providers.</li>
              </ul>
            </div>
          </div>

          <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-sm">
            <p>© 2026 CryptoReportKit. All rights reserved.</p>
            <div className="flex flex-wrap justify-center gap-4 text-xs text-gray-500">
              <span>🔒 We do not sell your data</span>
              <span>|</span>
              <Link href="/terms" className="hover:text-white">Terms</Link>
              <span>|</span>
              <Link href="/privacy" className="hover:text-white">Privacy</Link>
              <span>|</span>
              <CookieSettingsButton />
              <span>|</span>
              <Link href="/disclaimer" className="hover:text-white">Disclaimer</Link>
              <span>|</span>
              <Link href="/refund" className="hover:text-white">Refunds</Link>
              <span>|</span>
              <Link href="/template-requirements" className="hover:text-white">Setup</Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
