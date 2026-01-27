import type { Metadata } from 'next';

const siteUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://cryptoreportkit.com';

export const metadata: Metadata = {
  title: 'FAQ - Frequently Asked Questions | CryptoReportKit',
  description: 'Find answers to common questions about CryptoReportKit. Learn about BYOK (Bring Your Own Key), Excel templates, API keys, pricing, refunds, and technical setup.',
  keywords: [
    'cryptoreportkit faq',
    'crypto template help',
    'byok explained',
    'coingecko api key setup',
    'excel template support',
    'crypto spreadsheet help',
    'how to use cryptoreportkit',
    'template download help'
  ],
  openGraph: {
    title: 'Frequently Asked Questions | CryptoReportKit',
    description: 'Answers to common questions about CryptoReportKit templates, BYOK, API keys, and setup.',
    url: `${siteUrl}/faq`,
    type: 'website',
    images: [
      {
        url: `${siteUrl}/og-image.png`,
        width: 1200,
        height: 630,
        alt: 'CryptoReportKit FAQ',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'FAQ | CryptoReportKit',
    description: 'Answers about BYOK, templates, API keys & setup.',
    images: [`${siteUrl}/og-image.png`],
  },
  alternates: {
    canonical: `${siteUrl}/faq`,
  },
};

export default function FaqLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
