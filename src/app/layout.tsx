import type { Metadata } from 'next';
import Link from 'next/link';
import './globals.css';
import { Providers } from '@/components/Providers';
import DisclaimerBanner from '@/components/ui/DisclaimerBanner';
import CookieConsent from '@/components/CookieConsent';
import { AllJsonLd } from '@/components/JsonLd';
import AnalyticsGate from '@/components/AnalyticsGate';
import { FeedbackWrapper } from '@/components/FeedbackWrapper';
import { Footer } from '@/components/Footer';

const siteUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://cryptoreportkit.com';

export const metadata: Metadata = {
  // Basic SEO
  title: {
    default: 'CryptoReportKit - 83+ Live Crypto Dashboards & Analytics',
    template: '%s | CryptoReportKit'
  },
  description: '83+ live crypto dashboards with real-time data, coin comparison, DCA simulator, tax tools & more. Free BYOK — your API key never leaves your browser.',
  keywords: ['crypto analytics', 'crypto dashboards', 'bitcoin dashboard', 'cryptocurrency visualization', 'live crypto data', 'crypto market analysis', 'DeFi analytics', 'BYOK crypto', 'coin comparison', 'crypto tax tools', 'crypto report kit', 'crypto data download', 'crypto report', 'cryptocurrency analysis tool', 'bitcoin analysis'],

  // Favicon & Icons
  icons: {
    icon: '/favicon.svg',
    shortcut: '/favicon.svg',
    apple: '/favicon.svg',
  },

  // Canonical for homepage
  alternates: {
    canonical: siteUrl,
  },

  // Open Graph (Facebook, LinkedIn)
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: siteUrl,
    siteName: 'CryptoReportKit',
    title: 'CryptoReportKit - 83+ Live Crypto Dashboards & Analytics',
    description: '83+ interactive crypto dashboards, real-time market data, coin comparison, DCA simulator, tax tools, and more. Free to start with BYOK.',
    images: [
      {
        url: `${siteUrl}/api/og`,
        width: 1200,
        height: 630,
        alt: 'CryptoReportKit - 83+ Live Crypto Dashboards',
      },
    ],
  },

  // Twitter Card
  twitter: {
    card: 'summary_large_image',
    title: 'CryptoReportKit - 83+ Live Crypto Dashboards & Analytics',
    description: '83+ interactive crypto dashboards, real-time market data, coin comparison, and more. Free to start with BYOK.',
    images: [`${siteUrl}/api/og`],
    creator: '@sasmalgiri',
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

  // Canonical URLs: homepage canonical is set above via alternates.canonical.
  // Child routes override this via their own layout.tsx exports.

  // Search Engine Verification
  verification: {
    google: 'S3oX0IGvPW8WVVNjMqyTo5HqWe19iMLr9jzG-LjpcM4',
    // bing: 'paste-your-bing-verification-code-here',
  },

  // App Info
  applicationName: 'CryptoReportKit',
  category: 'Finance',
  creator: 'CryptoReportKit',
  publisher: 'CryptoReportKit',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
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
          <FeedbackWrapper />
        </Providers>
        <AnalyticsGate />
      </body>
    </html>
  );
}
