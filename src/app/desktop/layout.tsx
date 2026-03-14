import type { Metadata } from 'next';
import { BreadcrumbJsonLd } from '@/components/JsonLd';

const siteUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://cryptoreportkit.com';

export const metadata: Metadata = {
  title: 'Desktop App — Privacy-First Crypto Analytics',
  description:
    'Download CryptoReportKit Desktop for Windows, macOS, and Linux. Direct CoinGecko API calls, OS keychain security, offline SQLite storage, and system tray price ticker.',
  keywords: [
    'crypto desktop app',
    'privacy crypto analytics',
    'offline crypto tracker',
    'bitcoin desktop dashboard',
    'crypto portfolio tracker desktop',
    'CryptoReportKit desktop',
    'tauri crypto app',
  ],
  alternates: { canonical: `${siteUrl}/desktop` },
  openGraph: {
    title: 'CryptoReportKit Desktop — Privacy-First Crypto Analytics',
    description:
      'True BYOK privacy. API keys in your OS keychain, data calls direct from your machine, local SQLite storage.',
    url: `${siteUrl}/desktop`,
  },
  twitter: {
    card: 'summary_large_image',
    title: 'CryptoReportKit Desktop',
    description: 'Privacy-first crypto analytics for Windows, macOS & Linux.',
  },
};

function SoftwareApplicationJsonLd() {
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: 'CryptoReportKit Desktop',
    operatingSystem: 'Windows 10+, macOS 12+, Linux (Ubuntu 20.04+)',
    applicationCategory: 'FinanceApplication',
    description:
      'Privacy-first crypto analytics desktop app with direct CoinGecko API calls, OS keychain security, and local SQLite storage.',
    url: `${siteUrl}/desktop`,
    downloadUrl: `${siteUrl}/desktop`,
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD',
    },
    publisher: {
      '@type': 'Organization',
      name: 'CryptoReportKit',
      url: siteUrl,
    },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
    />
  );
}

export default function DesktopLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <SoftwareApplicationJsonLd />
      <BreadcrumbJsonLd
        items={[
          { name: 'Home', url: siteUrl },
          { name: 'Desktop App', url: `${siteUrl}/desktop` },
        ]}
      />
      {children}
    </>
  );
}
