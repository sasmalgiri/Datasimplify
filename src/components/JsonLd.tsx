// JSON-LD Structured Data for SEO
export function OrganizationJsonLd() {
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'DataSimplify',
    url: 'https://datasimplify.com',
    logo: 'https://datasimplify.com/logo.png',
    description: 'Crypto data platform with market data downloads and optional analytics tools (availability depends on configuration).',
    sameAs: [
      'https://twitter.com/datasimplify',
      'https://linkedin.com/company/datasimplify',
    ],
    contactPoint: {
      '@type': 'ContactPoint',
      email: 'sasmalgiri@gmail.com',
      contactType: 'customer service',
    },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
    />
  );
}

export function WebsiteJsonLd() {
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'DataSimplify',
    url: 'https://datasimplify.com',
    description: 'Download crypto market data in Excel/CSV. AI-powered predictions and analytics.',
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: 'https://datasimplify.com/market?search={search_term_string}',
      },
      'query-input': 'required name=search_term_string',
    },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
    />
  );
}

export function SoftwareApplicationJsonLd() {
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: 'DataSimplify',
    applicationCategory: 'FinanceApplication',
    operatingSystem: 'Web Browser',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD',
      description: 'Free tier available',
    },
    featureList: [
      'Crypto market data',
      'AI-assisted analysis (when enabled)',
      'Fear & Greed Index tracking',
      'Whale transaction monitoring (when enabled)',
      'DeFi analytics (when enabled)',
      'Excel/CSV data export',
      'No coding required',
    ],
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
    />
  );
}

export function FAQJsonLd() {
  const faqs = [
    {
      question: 'What is DataSimplify?',
      answer: 'DataSimplify is a crypto data platform that provides market data downloads and optional analytics tools, without requiring coding knowledge.',
    },
    {
      question: 'Is DataSimplify free to use?',
      answer: 'Yes! DataSimplify offers a free tier with basic features. Premium plans are available for advanced analytics, unlimited downloads, and priority support.',
    },
    {
      question: 'How accurate are the AI predictions?',
      answer: 'Our AI predictions use multiple data sources including market data, sentiment analysis, on-chain metrics, and macro indicators. Predictions are for educational purposes only and should not be considered financial advice.',
    },
    {
      question: 'Can I download crypto data to Excel?',
      answer: 'Yes! DataSimplify allows you to download cryptocurrency market data in Excel (XLSX) and CSV formats. This includes price history, market cap, volume, and more.',
    },
  ];

  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((faq) => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer,
      },
    })),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
    />
  );
}

// Combine all JSON-LD for the main layout
export function AllJsonLd() {
  return (
    <>
      <OrganizationJsonLd />
      <WebsiteJsonLd />
      <SoftwareApplicationJsonLd />
    </>
  );
}
