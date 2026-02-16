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
        text: 'CryptoReportKit provides static Excel templates with prefetched crypto data and web-based dashboards. Our BYOK (Bring Your Own Key) architecture means your API key stays local.',
      },
    },
    {
      '@type': 'Question',
      name: 'Do I need to create an account to use CryptoReportKit?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'No account is required to browse our analytics tools and charts. Creating a free account lets you access and download Excel templates from your downloads portal.',
      },
    },
    {
      '@type': 'Question',
      name: 'What is BYOK (Bring Your Own Key)?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: "BYOK means you provide your own CoinGecko API key. Your key stays in Excel - it never touches our servers. Templates come with prefetched data. For current data, use our web dashboards with YOUR key.",
      },
    },
    {
      '@type': 'Question',
      name: 'What are CryptoReportKit Excel Templates?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Our Excel templates ship with prefetched crypto data so you can start analyzing immediately. For current data, use the dashboards on our website with BYOK.',
      },
    },
    {
      '@type': 'Question',
      name: 'What do I need to use the templates?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'You need: 1) Microsoft Excel Desktop (Windows/Mac) or Excel Online, 2) Download a template from the downloads page. That\'s it - templates come with prefetched data ready to use!',
      },
    },
    {
      '@type': 'Question',
      name: 'Do templates include market data?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Yes! Templates ship with prefetched market data from CoinGecko, ready to analyze immediately. For the latest data, download a fresh template or use our web dashboards.',
      },
    },
    {
      '@type': 'Question',
      name: 'Why do I need my own API key?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'The BYOK architecture ensures compliance and gives you control. You get a free CoinGecko API key, and your key stays in your Excel file. For web dashboards, your key stays in browser sessionStorage.',
      },
    },
    {
      '@type': 'Question',
      name: 'How often is the data updated?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: "Download a fresh template for the latest data, or use our web dashboards for the latest updates. Update frequency on dashboards depends on your CoinGecko API plan.",
      },
    },
    {
      '@type': 'Question',
      name: 'Is the data accurate?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Data accuracy depends on CoinGecko. CryptoReportKit provides Excel templates with prefetched data - we do not guarantee accuracy or completeness of third-party data sources.',
      },
    },
    {
      '@type': 'Question',
      name: 'How do the templates work?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Our Excel templates are generated with the latest crypto data from CoinGecko already included. Just download, open in Excel, and start analyzing. For current data, use our web-based dashboards with your own CoinGecko API key.',
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
      name: 'How do I use the Excel templates?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Steps: 1) Download a template from the downloads page, 2) Open the .xlsx file in Excel, 3) Analyze the prefetched data. For current data, visit our dashboards page.',
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
        text: 'Yes! With Excel templates, data is prefetched server-side. With web dashboards, your API key stays in your browser - it never touches our servers.',
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
