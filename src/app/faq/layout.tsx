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

// FAQPage structured data matching visible FAQs on the page
const faqSchema = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: [
    {
      '@type': 'Question',
      name: 'What is CryptoReportKit?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'CryptoReportKit provides software tools for crypto analytics in Excel. Our templates use CRK formulas with a BYOK (Bring Your Own Key) architecture - you provide your own data provider API key (like CoinGecko), and our formulas fetch live data to your spreadsheets.',
      },
    },
    {
      '@type': 'Question',
      name: 'Do I need to create an account to use CryptoReportKit?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'No account is required to browse our analytics tools and charts. Creating a free account lets you save preferences, manage your API keys, and access additional features.',
      },
    },
    {
      '@type': 'Question',
      name: 'What is BYOK (Bring Your Own Key)?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: "BYOK means you provide your own data provider API key (e.g., CoinGecko free or Pro). Templates contain CRK formulas that fetch data using YOUR key. This means CryptoReportKit doesn't redistribute data - you're fetching directly from the provider with your own credentials.",
      },
    },
    {
      '@type': 'Question',
      name: 'What are CryptoReportKit Excel Templates?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Our Excel templates contain CRK formulas (no embedded data). When you open a template in Microsoft Excel with the CRK add-in installed and your API key connected, the formulas fetch live data directly to your spreadsheet.',
      },
    },
    {
      '@type': 'Question',
      name: 'What do I need to use the Excel templates?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'You need: 1) Microsoft Excel Desktop (Windows/Mac), 2) The CRK add-in installed, 3) A CryptoReportKit account (free), and 4) Your own data provider API key (e.g., CoinGecko). See our Template Requirements page for full setup.',
      },
    },
    {
      '@type': 'Question',
      name: 'Do templates include market data?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'No. Templates contain formulas only - no market data is embedded. Data is fetched via the CRK add-in using your own API key when you open the file in Excel. CryptoReportKit is software tooling, not a data vendor.',
      },
    },
    {
      '@type': 'Question',
      name: 'Why do I need my own API key?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'The BYOK architecture ensures compliance and gives you control. You sign up for a free CoinGecko API key, connect it to your CRK account, and templates use YOUR key to fetch data. This means you control your data access and rate limits.',
      },
    },
    {
      '@type': 'Question',
      name: 'How often is the data updated?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: "Update frequency depends on your data provider's API and your plan. When you click 'Refresh All' in Excel, the CRK add-in fetches fresh data using your API key. Free CoinGecko keys have rate limits; Pro keys have higher limits.",
      },
    },
    {
      '@type': 'Question',
      name: 'Is the data accurate?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Data accuracy depends on your chosen provider (CoinGecko, etc.). CryptoReportKit provides the software tooling to fetch and display data - we do not guarantee accuracy or completeness of third-party data sources.',
      },
    },
    {
      '@type': 'Question',
      name: 'How do CRK formulas work?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'CRK formulas (like =CRK.PRICE("bitcoin")) are custom Excel functions powered by our add-in. When you refresh, the add-in reads your connected API key and fetches live data from your data provider.',
      },
    },
    {
      '@type': 'Question',
      name: 'Is CryptoReportKit free?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'CryptoReportKit offers a free tier with limited downloads. Paid plans (coming soon) unlock more templates and features. Note: You also need a data provider API key - CoinGecko offers a free Demo API tier.',
      },
    },
    {
      '@type': 'Question',
      name: 'How do I set up Excel templates?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'See our Template Requirements page. Steps: 1) Get a CoinGecko API key, 2) Connect it in your CRK account, 3) Download a template pack, 4) Install the CRK Excel add-in, 5) Sign in and click Refresh All.',
      },
    },
    {
      '@type': 'Question',
      name: 'Why do I see #NAME? errors in templates?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: "This means the CRK add-in is not installed or not signed in. Install the add-in from Excel's add-in store, sign in with your CRK account, then click Data > Refresh All.",
      },
    },
    {
      '@type': 'Question',
      name: 'Is my data private?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Your API keys are encrypted with AES-256-GCM before storage. We never see your plaintext keys. We do not store market data - it flows directly from your provider to your Excel workbook.',
      },
    },
  ],
};

export default function FaqLayout({
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
