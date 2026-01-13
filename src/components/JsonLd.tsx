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
    description: 'Crypto research tools with charts, comparisons, and Excel downloads powered by CryptoSheets.',
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
      'Interactive charts and comparisons',
      'Fear & Greed Index tracking',
      'Excel downloads powered by CryptoSheets',
      'Educational analytics tools',
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
      answer: 'DataSimplify is a crypto research platform that provides charts, comparisons, and Excel downloads powered by CryptoSheets for educational analysis.',
    },
    {
      question: 'Is DataSimplify free to use?',
      answer: 'Yes! DataSimplify offers a free tier with charts, comparisons, and basic downloads. Premium plans are available for advanced features.',
    },
    {
      question: 'What analytics does DataSimplify provide?',
      answer: 'DataSimplify provides market analytics using multiple data sources including market data, sentiment analysis, and on-chain metrics. All analytics are for educational purposes only and should not be considered financial advice.',
    },
    {
      question: 'How do Excel downloads work?',
      answer: 'Excel downloads are powered by CryptoSheets - they contain formulas that connect to live data when opened in Excel with the CryptoSheets add-in installed. Configure your view on DataSimplify, then download.',
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
