import type { Metadata } from 'next';
import Link from 'next/link';
import './globals.css';
import { Providers } from '@/components/Providers';
import DisclaimerBanner from '@/components/ui/DisclaimerBanner';
import CookieConsent from '@/components/CookieConsent';
import { AllJsonLd } from '@/components/JsonLd';
import AnalyticsGate from '@/components/AnalyticsGate';
import { FEATURES } from '@/lib/featureFlags';

const siteUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://datasimplify.com';

export const metadata: Metadata = {
  // Basic SEO
  title: {
    default: 'DataSimplify - Crypto Analytics & Excel Templates',
    template: '%s | DataSimplify'
  },
  description: 'Excel templates with CryptoSheets formulas for live crypto data visualization. Educational analytics tools and indicators. No coding required.',
  keywords: ['crypto analytics', 'cryptocurrency visualization', 'bitcoin data', 'ethereum analytics', 'crypto excel templates', 'fear and greed index', 'DeFi analytics', 'crypto market visualization', 'CryptoSheets templates'],

  // Favicon & Icons
  icons: {
    icon: '/favicon.ico',
    shortcut: '/favicon-16x16.png',
    apple: '/apple-touch-icon.png',
  },

  // Open Graph (Facebook, LinkedIn)
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: siteUrl,
    siteName: 'DataSimplify',
    title: 'DataSimplify - Crypto Analytics & Excel Templates',
    description: 'Excel templates with CryptoSheets formulas for live crypto data visualization. Educational analytics tools for crypto enthusiasts.',
    images: [
      {
        url: `${siteUrl}/og-image.png`,
        width: 1200,
        height: 630,
        alt: 'DataSimplify - Crypto Data Platform',
      },
    ],
  },

  // Twitter Card
  twitter: {
    card: 'summary_large_image',
    title: 'DataSimplify - Crypto Analytics & Excel Templates',
    description: 'Excel templates with CryptoSheets formulas for live crypto data. Educational analytics tools and indicators.',
    images: [`${siteUrl}/og-image.png`],
    creator: '@datasimplify',
  },

  // Additional SEO
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },

  // Canonical & Alternates
  alternates: {
    canonical: siteUrl,
  },

  // Verification (add your IDs later)
  verification: {
    google: 'your-google-verification-code',
    // yandex: 'your-yandex-code',
    // bing: 'your-bing-code',
  },

  // App Info
  applicationName: 'DataSimplify',
  category: 'Finance',
  creator: 'DataSimplify',
  publisher: 'DataSimplify',
};

function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-400 py-12 border-t border-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid md:grid-cols-4 gap-8">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <span className="text-2xl">📊</span>
              <span className="font-bold text-xl text-white">DataSimplify</span>
            </div>
            <p className="text-sm">
              Democratizing crypto data for everyone. No coding required.
            </p>
          </div>

          {/* Product */}
          <div>
            <h4 className="font-semibold text-white mb-4">Product</h4>
            <ul className="space-y-2 text-sm">
              <li><Link href="/market" className="hover:text-white transition-colors">Market Data</Link></li>
              <li><Link href="/compare" className="hover:text-white transition-colors">Compare</Link></li>
              <li><Link href="/glossary" className="hover:text-white transition-colors">Glossary</Link></li>
              <li><Link href="/pricing" className="hover:text-white transition-colors">Pricing</Link></li>
            </ul>
          </div>

          {/* Resources */}
          <div>
            <h4 className="font-semibold text-white mb-4">Data Sources</h4>
            <ul className="space-y-2 text-sm">
              <li><span className="text-gray-500">Alternative.me (Fear & Greed)</span></li>
              <li><span className="text-gray-500">Binance (Market Data)</span></li>
              {FEATURES.coingecko ? <li><span className="text-gray-500">CoinGecko</span></li> : null}
              {FEATURES.defi ? <li><span className="text-gray-500">DeFiLlama</span></li> : null}
              {FEATURES.whales ? <li><span className="text-gray-500">Etherscan / Blockchair</span></li> : null}
            </ul>
          </div>

          {/* Resources */}
          <div>
            <h4 className="font-semibold text-white mb-4">Resources</h4>
            <ul className="space-y-2 text-sm">
              <li><Link href="/templates" className="hover:text-white transition-colors">Excel Templates</Link></li>
              <li><Link href="/template-requirements" className="hover:text-white transition-colors">Template Setup Guide</Link></li>
              <li><Link href="/faq" className="hover:text-white transition-colors">FAQ</Link></li>
              <li><Link href="/community" className="hover:text-white transition-colors">Community</Link></li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="font-semibold text-white mb-4">Legal</h4>
            <ul className="space-y-2 text-sm">
              <li><Link href="/disclaimer" className="hover:text-white transition-colors">Disclaimer</Link></li>
              <li><Link href="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link></li>
              <li><Link href="/terms" className="hover:text-white transition-colors">Terms of Service</Link></li>
              <li><Link href="/refund" className="hover:text-white transition-colors">Refund Policy</Link></li>
              <li><Link href="/community/guidelines" className="hover:text-white transition-colors">Community Guidelines</Link></li>
            </ul>
          </div>
        </div>

        {/* Compliance Section */}
        <div className="border-t border-gray-800 mt-8 pt-8">
          <div className="bg-gray-800/30 rounded-lg p-4 mb-6 space-y-3">
            <p className="text-xs text-gray-500 leading-relaxed">
              <span className="text-yellow-500 font-medium">⚠️ Important Disclaimer:</span> DataSimplify provides educational software tools only.
              Nothing on this platform constitutes financial, investment, tax, or legal advice.
              Cryptocurrency investments are highly volatile and risky - you may lose some or all of your investment.
              Past performance is not indicative of future results. Always DYOR (Do Your Own Research)
              and consult with qualified financial advisors before making any investment decisions.
            </p>
            <div className="text-xs text-gray-600 space-y-1">
              <p><strong className="text-gray-400">Product Scope:</strong></p>
              <ul className="list-disc list-inside space-y-0.5 ml-2">
                <li>DataSimplify is software analytics tooling - not a data vendor or broker.</li>
                <li>No trading execution, order routing, or brokerage services.</li>
                <li>No market-data redistribution - we do not sell or license raw data.</li>
                <li>Excel templates contain formulas only (no embedded data) - data is fetched via CryptoSheets add-in on your machine.</li>
                <li>Display-only dashboards for educational visualization.</li>
              </ul>
            </div>
          </div>

          <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-sm">
            <p>© {new Date().getFullYear()} DataSimplify. All rights reserved.</p>
            <div className="flex flex-wrap justify-center gap-4 text-xs text-gray-500">
              <span>🔒 We do not sell your data</span>
              <span>|</span>
              <Link href="/terms" className="hover:text-white">Terms</Link>
              <span>|</span>
              <Link href="/privacy" className="hover:text-white">Privacy</Link>
              <span>|</span>
              <Link href="/disclaimer" className="hover:text-white">Disclaimer</Link>
              <span>|</span>
              <Link href="/refund" className="hover:text-white">Refunds</Link>
              <span>|</span>
              <Link href="/template-requirements" className="hover:text-white">Template Setup</Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <AllJsonLd />
      </head>
      <body className="bg-gray-900">
        <Providers>
          <DisclaimerBanner />
          <main className="min-h-screen">
            {children}
          </main>
          <Footer />
          <CookieConsent />
        </Providers>
        <AnalyticsGate />
      </body>
    </html>
  );
}
