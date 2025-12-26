import type { Metadata } from 'next';
import Link from 'next/link';
import './globals.css';
import { Providers } from '@/components/Providers';
import DisclaimerBanner from '@/components/ui/DisclaimerBanner';
import CookieConsent from '@/components/CookieConsent';
import { AllJsonLd } from '@/components/JsonLd';
import { Analytics } from '@vercel/analytics/react';
import { SpeedInsights } from '@vercel/speed-insights/next';

const siteUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://datasimplify.com';

export const metadata: Metadata = {
  // Basic SEO
  title: {
    default: 'DataSimplify - Crypto Data & AI Analytics Platform',
    template: '%s | DataSimplify'
  },
  description: 'Download crypto market data in Excel/CSV. AI-powered predictions, Fear & Greed Index, whale tracking, and DeFi analytics. No coding required. Start free today!',
  keywords: ['crypto data', 'cryptocurrency analytics', 'bitcoin price', 'ethereum data', 'crypto excel download', 'AI crypto predictions', 'fear and greed index', 'whale tracking', 'DeFi analytics', 'crypto market data', 'cryptocurrency API'],

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
    title: 'DataSimplify - Crypto Data & AI Analytics Made Simple',
    description: 'Download crypto market data in Excel/CSV. AI-powered predictions, real-time analytics, and whale tracking. No coding required.',
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
    title: 'DataSimplify - Crypto Data & AI Analytics',
    description: 'Download crypto data in Excel/CSV. AI predictions, Fear & Greed Index, whale tracking. Start free!',
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
              <li><Link href="/chat" className="hover:text-white transition-colors">AI Chat</Link></li>
              <li><Link href="/glossary" className="hover:text-white transition-colors">Glossary</Link></li>
              <li><Link href="/pricing" className="hover:text-white transition-colors">Pricing</Link></li>
            </ul>
          </div>

          {/* Resources */}
          <div>
            <h4 className="font-semibold text-white mb-4">Data Sources</h4>
            <ul className="space-y-2 text-sm">
              <li><span className="text-gray-500">CoinGecko API</span></li>
              <li><span className="text-gray-500">Alternative.me (Fear & Greed)</span></li>
              <li><span className="text-gray-500">DeFiLlama API</span></li>
              <li><span className="text-gray-500">CryptoPanic API</span></li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="font-semibold text-white mb-4">Legal</h4>
            <ul className="space-y-2 text-sm">
              <li><Link href="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link></li>
              <li><Link href="/terms" className="hover:text-white transition-colors">Terms of Service</Link></li>
            </ul>
          </div>
        </div>

        {/* Compliance Section */}
        <div className="border-t border-gray-800 mt-8 pt-8">
          <div className="bg-gray-800/30 rounded-lg p-4 mb-6">
            <p className="text-xs text-gray-500 leading-relaxed">
              <span className="text-yellow-500 font-medium">⚠️ Important Disclaimer:</span> DataSimplify provides educational content only.
              Nothing on this platform constitutes financial, investment, tax, or legal advice.
              Cryptocurrency investments are highly volatile and risky - you may lose some or all of your investment.
              Past performance is not indicative of future results. Always DYOR (Do Your Own Research)
              and consult with qualified financial advisors before making any investment decisions.
            </p>
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
              <span>Not available in all jurisdictions</span>
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
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
