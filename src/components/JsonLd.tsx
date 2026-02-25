// JSON-LD Structured Data for SEO
import { IS_BETA_MODE } from '@/lib/betaMode';
import { isFeatureEnabled } from '@/lib/featureFlags';

export function OrganizationJsonLd() {
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'CryptoReportKit',
    url: 'https://cryptoreportkit.com',
    logo: 'https://cryptoreportkit.com/favicon.svg',
    description:
      '83+ interactive crypto dashboards with real-time market data, coin comparison, DCA simulator, tax tools, and more. BYOK architecture.',
    sameAs: [
      'https://x.com/sasmalgiri',
      'https://www.linkedin.com/in/shrabani-sasmal-9b80483b3/',
      'https://github.com/sasmalgiri/Datasimplify',
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
      '83+ interactive crypto dashboards, real-time market data, coin comparison, DCA simulator, tax tools, and more. Free to start with BYOK.',
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
  const pricingEnabled = isFeatureEnabled('pricing');

  const offers = IS_BETA_MODE
    ? {
        '@type': 'AggregateOffer',
        lowPrice: '0',
        highPrice: '0',
        priceCurrency: 'USD',
        offerCount: '1',
      }
    : pricingEnabled
      ? {
          '@type': 'AggregateOffer',
          lowPrice: '0',
          highPrice: '9',
          priceCurrency: 'USD',
          offerCount: '2',
        }
      : {
          '@type': 'AggregateOffer',
          lowPrice: '0',
          highPrice: '0',
          priceCurrency: 'USD',
          offerCount: '1',
        };

  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: 'CryptoReportKit',
    applicationCategory: 'FinanceApplication',
    operatingSystem: 'Web Browser',
    offers,
    featureList: [
      '83+ interactive crypto dashboards',
      'Real-time market data with BYOK architecture',
      'Coin comparison with 26 data columns',
      'DCA simulator and BTC cycle comparison',
      'Tax report export (FIFO/LIFO/AVG)',
      'Custom dashboard builder',
      'Multi-exchange portfolio tracking',
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
        'CryptoReportKit provides 83+ interactive crypto dashboards with real-time market data, coin comparison, DCA simulator, tax tools, and more. Powered by BYOK (Bring Your Own Key) architecture — your API key stays in your browser.',
    },
    {
      question: 'Is CryptoReportKit free to use?',
      answer:
        IS_BETA_MODE
          ? 'Yes — the current beta is free. No credit card required, and you can access dashboards and tools while the beta is running.'
          : 'Yes! 32+ dashboards, DCA simulator, BTC cycle comparison, 60+ currencies, and crypto glossary are all free forever. No credit card required. Pro unlocks all 83+ dashboards and advanced tools for $9/mo.',
    },
    {
      question: 'What is BYOK (Bring Your Own Key)?',
      answer:
        'BYOK means you provide your own CoinGecko API key (free to get). Your key stays in your browser — we never see, store, or transmit it. All API calls go directly from your device to CoinGecko.',
    },
    {
      question: 'How is this different from CoinGecko or CoinMarketCap?',
      answer:
        'CoinGecko shows data. CryptoReportKit lets you analyze it with 83+ purpose-built dashboards, smart signals, custom dashboard builder, tax exports, DCA tracking, and more.',
    },
    {
      question: 'Do you offer refunds?',
      answer:
        IS_BETA_MODE
          ? 'There are no payments during the free beta, so refunds are not applicable. If paid plans launch later, we will publish clear refund terms before billing begins.'
          : 'Yes! We offer a 30-day money-back guarantee. If you are not satisfied, contact us for a full refund within 30 days.',
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
  tier: 'free' | 'pro';
  slug: string;
}) {
  const prices = IS_BETA_MODE ? { free: '0', pro: '0' } : { free: '0', pro: '9' };

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
  const pricingEnabled = isFeatureEnabled('pricing');

  if (IS_BETA_MODE) {
    const structuredData = {
      '@context': 'https://schema.org',
      '@type': 'Product',
      name: 'CryptoReportKit (Free Beta)',
      description:
        'Free beta access to crypto dashboards and tools. No credit card required during the beta.',
      brand: {
        '@type': 'Brand',
        name: 'CryptoReportKit',
      },
      offers: {
        '@type': 'Offer',
        name: 'Free Beta',
        price: '0',
        priceCurrency: 'USD',
        description: 'Free beta access (pricing not active during beta).',
      },
    };

    return (
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
    );
  }

  if (!pricingEnabled) {
    const structuredData = {
      '@context': 'https://schema.org',
      '@type': 'Product',
      name: 'CryptoReportKit (Free Mode)',
      description:
        'CryptoReportKit is running in free mode. Pricing is not currently enabled.',
      brand: {
        '@type': 'Brand',
        name: 'CryptoReportKit',
      },
      offers: {
        '@type': 'Offer',
        name: 'Free',
        price: '0',
        priceCurrency: 'USD',
      },
    };

    return (
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
    );
  }

  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: 'CryptoReportKit Plans',
    description:
      '83+ interactive crypto dashboards, real-time analytics, tax tools, and custom dashboard builder. Free to start.',
    brand: {
      '@type': 'Brand',
      name: 'CryptoReportKit',
    },
    offers: {
      '@type': 'AggregateOffer',
      lowPrice: '0',
      highPrice: '9',
      priceCurrency: 'USD',
      offerCount: '2',
      offers: [
        {
          '@type': 'Offer',
          name: 'Free Plan',
          price: '0',
          priceCurrency: 'USD',
          description: '32+ dashboards, DCA simulator, BTC cycle comparison, 60+ currencies',
        },
        {
          '@type': 'Offer',
          name: 'Pro Plan',
          price: '9',
          priceCurrency: 'USD',
          description: 'All 83+ dashboards, custom builder, tax tools, multi-exchange portfolio',
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
  tier?: 'free' | 'pro';
}) {
  const prices = IS_BETA_MODE ? { free: '0', pro: '0' } : { free: '0', pro: '9' };

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
    softwareRequirements: 'Microsoft Excel 2016+',
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
