import type { Metadata } from 'next';
import { BreadcrumbJsonLd } from '@/components/JsonLd';

const siteUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://cryptoreportkit.com';

export const metadata: Metadata = {
  title: 'Crypto Excel Templates & Report Kits | Download Free',
  description: '8 professional Excel template kits for cryptocurrency analysis. Portfolio tracker, market overview, trader charts, screener watchlist, coin research, risk correlation, DeFi TVL & stablecoin monitor.',
  keywords: [
    'crypto excel templates',
    'cryptocurrency spreadsheet',
    'bitcoin excel template',
    'crypto portfolio tracker excel',
    'cryptocurrency report template',
    'excel crypto analysis',
    'crypto trading spreadsheet',
    'defi excel template',
    'market cap excel',
    'crypto price tracker excel'
  ],
  openGraph: {
    title: 'Crypto Excel Templates & Report Kits | CryptoReportKit',
    description: '8 professional Excel template kits for crypto analysis. Portfolio tracker, market overview, trader charts & more. Free to start with BYOK.',
    url: `${siteUrl}/templates`,
    type: 'website',
    images: [
      {
        url: `${siteUrl}/og-image.png`,
        width: 1200,
        height: 630,
        alt: 'CryptoReportKit Excel Templates',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Crypto Excel Templates & Report Kits | CryptoReportKit',
    description: '8 professional Excel template kits for crypto analysis. Free to start with BYOK architecture.',
    images: [`${siteUrl}/og-image.png`],
  },
  alternates: {
    canonical: `${siteUrl}/templates`,
  },
};

export default function TemplatesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <BreadcrumbJsonLd
        items={[
          { name: 'Home', url: 'https://cryptoreportkit.com' },
          { name: 'Templates', url: 'https://cryptoreportkit.com/templates' },
        ]}
      />
      {children}
    </>
  );
}
