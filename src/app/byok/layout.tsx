import type { Metadata } from 'next';

const siteUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://cryptoreportkit.com';

export const metadata: Metadata = {
  title: 'BYOK - Bring Your Own Key Architecture Explained',
  description: 'Learn about BYOK (Bring Your Own Key) architecture. Use your own CoinGecko API key with CryptoReportKit templates. Secure, private, and you control your data.',
  keywords: [
    'byok crypto',
    'bring your own key',
    'coingecko api key',
    'crypto api key setup',
    'byok architecture',
    'private crypto data',
    'secure api key',
    'excel api integration'
  ],
  openGraph: {
    title: 'BYOK - Bring Your Own Key | CryptoReportKit',
    description: 'Use your own API key with CryptoReportKit. Secure BYOK architecture explained.',
    url: `${siteUrl}/byok`,
    type: 'website',
    images: [
      {
        url: `${siteUrl}/og-image.png`,
        width: 1200,
        height: 630,
        alt: 'CryptoReportKit BYOK Architecture',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'BYOK - Bring Your Own Key | CryptoReportKit',
    description: 'Secure BYOK architecture. Use your own CoinGecko API key.',
    images: [`${siteUrl}/og-image.png`],
  },
  alternates: {
    canonical: `${siteUrl}/byok`,
  },
};

// FAQPage structured data for visible FAQs on this page
const faqSchema = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: [
    {
      '@type': 'Question',
      name: 'Is the CoinGecko Demo plan really free?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Yes! CoinGecko offers a free Demo plan that doesn\'t require a credit card. Limits depend on your CoinGecko plan—check CoinGecko pricing for current details.',
      },
    },
    {
      '@type': 'Question',
      name: 'Where does CRK store my API key?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Your API key is encrypted using AES-256-GCM and stored securely in the CRK database. It is decrypted only in memory when making API calls to CoinGecko on your behalf. We never log or share your plaintext key.',
      },
    },
    {
      '@type': 'Question',
      name: 'Can I delete my API key from CRK?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Yes! You can delete your API key anytime from the CRK add-in or from your CRK account settings. Deleting your account also permanently deletes your encrypted keys.',
      },
    },
    {
      '@type': 'Question',
      name: 'What if I exceed my CoinGecko rate limit?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'If you exceed your plan\'s rate limits, CoinGecko will return an error. You can upgrade to a higher CoinGecko plan (Analyst or Pro) for higher limits.',
      },
    },
    {
      '@type': 'Question',
      name: 'Does CRK charge me for BYOK?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'No! BYOK is included in all CRK plans (Free, Pro, Premium). You only pay CoinGecko directly for your API plan. CRK charges for features like scheduled exports, advanced templates, and premium support.',
      },
    },
  ],
};

export default function ByokLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
      {children}
    </>
  );
}
