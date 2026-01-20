// JSON-LD Structured Data for SEO
export function OrganizationJsonLd() {
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'CryptoReportKit',
    url: 'https://cryptoreportkit.com',
    logo: 'https://cryptoreportkit.com/logo.png',
    description:
      'Excel templates with BYOK data for crypto research, portfolio tracking, and market analysis.',
    sameAs: [
      'https://twitter.com/cryptoreportkit',
      'https://linkedin.com/company/cryptoreportkit',
    ],
    contactPoint: {
      '@type': 'ContactPoint',
      email: 'support@cryptoreportkit.com',
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
    name: 'CryptoReportKit',
    url: 'https://cryptoreportkit.com',
    description:
      'Build refreshable crypto reports in Excel. Excel templates with CRK formulas and BYOK data for market data, portfolio tracking, and technical analysis.',
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: 'https://cryptoreportkit.com/market?search={search_term_string}',
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
    name: 'CryptoReportKit',
    applicationCategory: 'FinanceApplication',
    operatingSystem: 'Microsoft Excel, Web Browser',
    offers: {
      '@type': 'AggregateOffer',
      lowPrice: '0',
      highPrice: '79',
      priceCurrency: 'USD',
      offerCount: '3',
    },
    featureList: [
      'Excel templates with CRK formulas (BYOK)',
      'Market overview and watchlist reports',
      'Portfolio tracking with P/L analysis',
      'Technical indicator dashboards',
      'Correlation and diversification tools',
      'Gainers and losers tracking',
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
      question: 'What is CryptoReportKit?',
      answer:
        'CryptoReportKit provides Excel templates with CRK formulas for educational crypto research and portfolio tracking. Templates use BYOK (Bring Your Own Key) - you provide your own API key for data.',
    },
    {
      question: 'Is CryptoReportKit free to use?',
      answer:
        'Yes! CryptoReportKit offers free Report Kits for market overview and watchlist tracking. Pro and Premium plans are available for more advanced templates.',
    },
    {
      question: 'How do Report Kits work?',
      answer:
        'Report Kits are Excel templates containing CRK formulas. Download the template, install the CRK add-in, connect your API key (BYOK), and refresh to see live data.',
    },
    {
      question: 'What is BYOK (Bring Your Own Key)?',
      answer:
        'BYOK means you provide your own data provider API key (e.g., CoinGecko). Your keys are encrypted and used to fetch data directly from the provider through our proxy.',
    },
    {
      question: 'Do you offer refunds?',
      answer:
        'Yes! We offer a 30-day money-back guarantee. If you are not satisfied with your purchase, contact us for a full refund within 30 days.',
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

// Product schema for Report Kits
export function ReportKitProductJsonLd({
  name,
  description,
  tier,
  slug,
}: {
  name: string;
  description: string;
  tier: 'free' | 'pro' | 'premium';
  slug: string;
}) {
  const prices = { free: '0', pro: '29', premium: '79' };

  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: `${name} - CryptoReportKit`,
    description,
    url: `https://cryptoreportkit.com/templates/${slug}`,
    brand: {
      '@type': 'Brand',
      name: 'CryptoReportKit',
    },
    offers: {
      '@type': 'Offer',
      price: prices[tier],
      priceCurrency: 'USD',
      availability: 'https://schema.org/InStock',
      priceValidUntil: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
    />
  );
}

// Pricing page schema with aggregate offers
export function PricingJsonLd() {
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: 'CryptoReportKit Plans',
    description:
      'Excel templates with CRK formulas for crypto research and portfolio tracking.',
    brand: {
      '@type': 'Brand',
      name: 'CryptoReportKit',
    },
    offers: {
      '@type': 'AggregateOffer',
      lowPrice: '0',
      highPrice: '79',
      priceCurrency: 'USD',
      offerCount: '3',
      offers: [
        {
          '@type': 'Offer',
          name: 'Free Plan',
          price: '0',
          priceCurrency: 'USD',
          description: 'Basic templates and market overview reports',
        },
        {
          '@type': 'Offer',
          name: 'Pro Plan',
          price: '29',
          priceCurrency: 'USD',
          description: 'Advanced templates with technical indicators and portfolio tracking',
        },
        {
          '@type': 'Offer',
          name: 'Premium Plan',
          price: '79',
          priceCurrency: 'USD',
          description: 'Full access to all templates with priority support',
        },
      ],
    },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
    />
  );
}

// Breadcrumb schema for navigation
export function BreadcrumbJsonLd({
  items,
}: {
  items: { name: string; url: string }[];
}) {
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
    />
  );
}

// Template/Product page schema for individual Excel templates
export function ExcelTemplateJsonLd({
  name,
  description,
  slug,
  category,
  features,
  tier = 'free',
}: {
  name: string;
  description: string;
  slug: string;
  category: string;
  features: string[];
  tier?: 'free' | 'pro' | 'premium';
}) {
  const prices = { free: '0', pro: '29', premium: '79' };

  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: `${name} Excel Template`,
    description,
    url: `https://cryptoreportkit.com/excel-templates/${slug}`,
    applicationCategory: 'SpreadsheetApplication',
    operatingSystem: 'Microsoft Excel',
    offers: {
      '@type': 'Offer',
      price: prices[tier],
      priceCurrency: 'USD',
      availability: 'https://schema.org/InStock',
    },
    featureList: features,
    softwareRequirements: 'Microsoft Excel 2016+, CRK Add-in',
    publisher: {
      '@type': 'Organization',
      name: 'CryptoReportKit',
      url: 'https://cryptoreportkit.com',
    },
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
