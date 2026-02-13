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
    default: 'CryptoReportKit - Power Query Templates for Crypto',
    template: '%s | CryptoReportKit'
  },
  description: 'Excel templates with prefetched crypto data and 20+ live web dashboards. BYOK architecture. Educational analytics tools.',
  keywords: ['crypto analytics', 'cryptocurrency visualization', 'bitcoin data', 'power query crypto', 'crypto excel templates', 'fear and greed index', 'DeFi analytics', 'crypto market visualization', 'BYOK templates', 'crypto report kit'],

  // Favicon & Icons
  icons: {
    icon: '/favicon.ico',
    shortcut: '/favicon.ico',
    apple: '/favicon.ico',
  },

  // Open Graph (Facebook, LinkedIn)
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: siteUrl,
    siteName: 'CryptoReportKit',
    title: 'CryptoReportKit - Power Query Templates for Crypto',
    description: 'Excel templates with prefetched crypto data and 20+ live web dashboards. BYOK architecture.',
    images: [
      {
        url: `${siteUrl}/og-image.png`,
        width: 1200,
        height: 630,
        alt: 'CryptoReportKit - Crypto Data Platform',
      },
    ],
  },

  // Twitter Card
  twitter: {
    card: 'summary_large_image',
    title: 'CryptoReportKit - Power Query Templates for Crypto',
    description: 'Excel templates with prefetched crypto data and 20+ live web dashboards. BYOK architecture.',
    images: [`${siteUrl}/og-image.png`],
    creator: '@cryptoreportkit',
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

  // Search Engine Verification
  // Get codes from: Google Search Console (search.google.com/search-console)
  // Bing Webmaster Tools (bing.com/webmasters)
  // After adding property, copy the meta tag content value here
  verification: {
    // google: 'paste-your-google-site-verification-code-here',
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
