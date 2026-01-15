// JSON-LD Structured Data for SEO
export function OrganizationJsonLd() {
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'DataSimplify',
    url: 'https://datasimplify.com',
    logo: 'https://datasimplify.com/logo.png',
    description: 'Software analytics tooling providing Excel templates with CryptoSheets formulas for crypto research and portfolio tracking.',
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
    description: 'Crypto research software providing interactive charts, comparisons, and Excel templates powered by CryptoSheets formulas.',
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
      'Interactive market charts and analytics',
      'Coin comparisons and correlations',
      'Fear & Greed Index tracking',
      'Excel templates with CryptoSheets formulas',
      'Educational visualization tools',
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
      answer: 'DataSimplify is software analytics tooling that provides interactive charts, comparisons, and Excel templates with CryptoSheets formulas for educational crypto research.',
    },
    {
      question: 'Is DataSimplify free to use?',
      answer: 'Yes! DataSimplify offers a free tier with charts, comparisons, and template downloads. Pro and Premium plans are available for more templates and features.',
    },
    {
      question: 'What analytics does DataSimplify provide?',
      answer: 'DataSimplify provides educational visualization tools for market analytics, sentiment analysis, and comparisons. All content is for educational purposes only and should not be considered financial advice.',
    },
    {
      question: 'How do Excel templates work?',
      answer: 'Excel templates contain CryptoSheets formulas that fetch live data when opened in Excel with the CryptoSheets add-in installed. Templates do not contain embedded market data.',
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
