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
        text: 'CryptoReportKit provides Power Query templates for crypto analytics in Excel. Our templates use BYOK (Bring Your Own Key) architecture - you provide your own CoinGecko API key, paste it in Excel, and Power Query fetches live data. No add-in required.',
      },
    },
    {
      '@type': 'Question',
      name: 'Do I need to create an account to use CryptoReportKit?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'No account is required to browse our analytics tools and charts. Creating a free account lets you access and download Power Query templates from your downloads portal.',
      },
    },
    {
      '@type': 'Question',
      name: 'What is BYOK (Bring Your Own Key)?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: "BYOK means you provide your own CoinGecko API key. Your key stays in Excel - it never touches our servers. Power Query uses YOUR key to fetch data directly from CoinGecko.",
      },
    },
    {
      '@type': 'Question',
      name: 'What are CryptoReportKit Power Query Templates?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Our Excel templates contain Power Query code (M language) that fetches live crypto data. Just paste your CoinGecko API key in the designated cell and refresh - no add-in installation required.',
      },
    },
    {
      '@type': 'Question',
      name: 'What do I need to use the templates?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'You need: 1) Microsoft Excel Desktop (Windows/Mac) or Excel Online, 2) A free CoinGecko API key from coingecko.com/api, 3) Download a template from your CRK downloads portal. That\'s it - no add-in needed!',
      },
    },
    {
      '@type': 'Question',
      name: 'Do templates include market data?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'No. Templates contain Power Query code only - no market data is embedded. Data is fetched via Power Query using your own API key when you refresh. CryptoReportKit is software tooling, not a data vendor.',
      },
    },
    {
      '@type': 'Question',
      name: 'Why do I need my own API key?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'The BYOK architecture ensures compliance and gives you control. You get a free CoinGecko API key, paste it in your Excel workbook, and Power Query uses YOUR key to fetch data. Your key never leaves Excel.',
      },
    },
    {
      '@type': 'Question',
      name: 'How often is the data updated?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: "Update frequency depends on your CoinGecko API plan. Click 'Data > Refresh All' in Excel to fetch fresh data using Power Query. Free keys have rate limits; Pro keys have higher limits.",
      },
    },
    {
      '@type': 'Question',
      name: 'Is the data accurate?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Data accuracy depends on CoinGecko. CryptoReportKit provides the Power Query code to fetch and display data - we do not guarantee accuracy or completeness of third-party data sources.',
      },
    },
    {
      '@type': 'Question',
      name: 'How does Power Query work?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Power Query is Excel\'s built-in data transformation tool. Our templates include M code (Power Query\'s language) that fetches data from CoinGecko using your API key. Just paste your key and refresh!',
      },
    },
    {
      '@type': 'Question',
      name: 'Is CryptoReportKit free?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'CryptoReportKit offers a free tier with basic templates. Paid plans unlock more templates and features. Note: You also need a CoinGecko API key - they offer a free Demo API tier.',
      },
    },
    {
      '@type': 'Question',
      name: 'How do I set up Power Query templates?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'See our Setup Guide. Steps: 1) Get a free CoinGecko API key at coingecko.com/api, 2) Download a template from your CRK downloads portal, 3) Open in Excel, paste your API key in the designated cell, 4) Click Data > Refresh All.',
      },
    },
    {
      '@type': 'Question',
      name: 'Why do I see connection errors?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: "This usually means your API key is missing or incorrect. Make sure you've pasted your CoinGecko API key in the designated cell. Then try Data > Refresh All again.",
      },
    },
    {
      '@type': 'Question',
      name: 'Is my data private?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Yes! With Power Query templates, your API key stays in Excel - it never touches our servers. Data flows directly from CoinGecko to your Excel workbook.',
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
