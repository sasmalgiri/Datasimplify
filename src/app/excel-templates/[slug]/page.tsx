import { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { FreeNavbar } from '@/components/FreeNavbar';
import { Breadcrumb } from '@/components/Breadcrumb';
import {
  getTemplateBySlug,
  getAllTemplateSlugs,
  getRelatedTemplates,
  TemplateLandingPage,
} from '@/lib/seo/templatePages';
import { BreadcrumbJsonLd, ExcelTemplateJsonLd } from '@/components/JsonLd';

interface PageProps {
  params: Promise<{ slug: string }>;
}

// Generate static params for all template pages
export async function generateStaticParams() {
  const slugs = getAllTemplateSlugs();
  return slugs.map((slug) => ({ slug }));
}

// Generate metadata for SEO
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const template = getTemplateBySlug(slug);

  if (!template) {
    return { title: 'Template Not Found' };
  }

  return {
    title: template.title,
    description: template.description,
    keywords: template.keywords.join(', '),
    openGraph: {
      title: template.title,
      description: template.description,
      url: `https://cryptoreportkit.com/excel-templates/${slug}`,
      type: 'website',
      siteName: 'CryptoReportKit',
    },
    twitter: {
      card: 'summary_large_image',
      title: template.title,
      description: template.description,
    },
    alternates: {
      canonical: `https://cryptoreportkit.com/excel-templates/${slug}`,
    },
  };
}

export default async function TemplateDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const template = getTemplateBySlug(slug);

  if (!template) {
    notFound();
  }

  const relatedTemplates = getRelatedTemplates(slug);

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900 text-white">
      {/* JSON-LD Structured Data */}
      <BreadcrumbJsonLd
        items={[
          { name: 'Home', url: 'https://cryptoreportkit.com' },
          { name: 'Excel Templates', url: 'https://cryptoreportkit.com/templates' },
          { name: template.h1, url: `https://cryptoreportkit.com/excel-templates/${slug}` },
        ]}
      />
      <ExcelTemplateJsonLd
        name={template.h1}
        description={template.description}
        slug={slug}
        category={template.category}
        features={template.features}
        tier={template.tier}
      />
      {/* FAQPage schema for templates with visible FAQs */}
      {template.faq.length > 0 && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'FAQPage',
              mainEntity: template.faq.map((faq) => ({
                '@type': 'Question',
                name: faq.question,
                acceptedAnswer: {
                  '@type': 'Answer',
                  text: faq.answer,
                },
              })),
            }),
          }}
        />
      )}

      <FreeNavbar />
      <Breadcrumb />

      <div className="max-w-4xl mx-auto px-4 py-12">
        {/* Hero Section */}
        <div className="mb-12">
          <div className="flex items-center gap-3 mb-4">
            <span
              className={`px-3 py-1 rounded-full text-sm font-medium ${
                template.tier === 'free'
                  ? 'bg-emerald-500/20 text-emerald-400'
                  : template.tier === 'pro'
                    ? 'bg-blue-500/20 text-blue-400'
                    : 'bg-purple-500/20 text-purple-400'
              }`}
            >
              {template.tier === 'free' ? 'Free' : template.tier === 'pro' ? 'Pro' : 'Premium'}
            </span>
            <span className="text-gray-400 text-sm">{template.category}</span>
          </div>

          <h1 className="text-4xl md:text-5xl font-bold mb-4">{template.h1}</h1>

          <p className="text-xl text-gray-300 mb-8">{template.description}</p>

          <div className="flex flex-wrap gap-4">
            <Link
              href={`/templates?template=${slug}`}
              className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 rounded-lg font-medium transition-colors"
            >
              Download Template
            </Link>
            <Link
              href="/template-requirements"
              className="px-6 py-3 bg-gray-700 hover:bg-gray-600 rounded-lg font-medium transition-colors"
            >
              View Requirements
            </Link>
          </div>
        </div>

        {/* CRK Add-in Notice */}
        <div className="bg-blue-900/30 border-2 border-blue-500/50 rounded-xl p-6 mb-8">
          <h2 className="text-lg font-bold text-blue-400 mb-2">
            Requires CryptoReportKit Excel Add-in
          </h2>
          <p className="text-gray-300 text-sm mb-3">
            This template contains CRK formulas that fetch live cryptocurrency data. You need the{' '}
            <Link
              href="/addin/setup"
              className="text-blue-400 hover:text-blue-300 underline"
            >
              CryptoReportKit (CRK) Excel Add-in
            </Link>{' '}
            installed in Excel Desktop to refresh data.
          </p>
          <p className="text-gray-400 text-xs">
            <strong>BYOK (Bring Your Own Keys):</strong> Live data is fetched using your own API key(s)
            from providers like CoinGecko. The template contains formulas only - no embedded data.
            See{' '}
            <Link href="/template-requirements" className="text-blue-400 hover:underline">
              Template Requirements
            </Link>{' '}
            for setup instructions.
          </p>
        </div>

        {/* Features */}
        <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-6 mb-8">
          <h2 className="text-2xl font-semibold mb-4">What&apos;s Included</h2>
          <ul className="grid md:grid-cols-2 gap-3">
            {template.features.map((feature, index) => (
              <li key={index} className="flex items-start gap-2">
                <span className="text-emerald-400 mt-1">&#10003;</span>
                <span className="text-gray-300">{feature}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Who Is It For */}
        <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-6 mb-8">
          <h2 className="text-2xl font-semibold mb-4">Who Is This For?</h2>
          <ul className="space-y-2">
            {template.whoIsItFor.map((audience, index) => (
              <li key={index} className="flex items-start gap-2">
                <span className="text-blue-400">&#8226;</span>
                <span className="text-gray-300">{audience}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Customization Options */}
        <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-6 mb-8">
          <h2 className="text-2xl font-semibold mb-4">Customization Options</h2>
          <p className="text-gray-400 mb-4">
            Configure the template before downloading to match your needs:
          </p>
          <ul className="space-y-2">
            {template.customization.map((option, index) => (
              <li key={index} className="flex items-start gap-2">
                <span className="text-purple-400">&#9881;</span>
                <span className="text-gray-300">{option}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* FAQ Section */}
        {template.faq.length > 0 && (
          <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-6 mb-8">
            <h2 className="text-2xl font-semibold mb-4">Frequently Asked Questions</h2>
            <div className="space-y-4">
              {template.faq.map((faq, index) => (
                <div key={index}>
                  <h3 className="font-medium text-white mb-2">{faq.question}</h3>
                  <p className="text-gray-400 text-sm">{faq.answer}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* How to Use */}
        <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-6 mb-8">
          <h2 className="text-2xl font-semibold mb-4">How to Use This Template</h2>
          <ol className="space-y-3">
            <li className="flex items-start gap-3">
              <span className="w-6 h-6 rounded-full bg-emerald-600 flex items-center justify-center text-sm font-bold shrink-0">
                1
              </span>
              <span className="text-gray-300">
                Download the template (.xlsx file) from this page
              </span>
            </li>
            <li className="flex items-start gap-3">
              <span className="w-6 h-6 rounded-full bg-emerald-600 flex items-center justify-center text-sm font-bold shrink-0">
                2
              </span>
              <span className="text-gray-300">
                Install the{' '}
                <Link
                  href="/addin/setup"
                  className="text-emerald-400 hover:underline"
                >
                  CryptoReportKit Excel Add-in
                </Link>{' '}
                in Excel Desktop (Insert &gt; Get Add-ins)
              </span>
            </li>
            <li className="flex items-start gap-3">
              <span className="w-6 h-6 rounded-full bg-emerald-600 flex items-center justify-center text-sm font-bold shrink-0">
                3
              </span>
              <span className="text-gray-300">
                Open the template in Excel, sign in to CRK, and connect your API key(s) (BYOK)
              </span>
            </li>
            <li className="flex items-start gap-3">
              <span className="w-6 h-6 rounded-full bg-emerald-600 flex items-center justify-center text-sm font-bold shrink-0">
                4
              </span>
              <span className="text-gray-300">
                Press Ctrl+Alt+F5 (or Data &gt; Refresh All) to load live data
              </span>
            </li>
          </ol>
        </div>

        {/* Related Templates */}
        {relatedTemplates.length > 0 && (
          <div className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">Related Templates</h2>
            <div className="grid md:grid-cols-2 gap-4">
              {relatedTemplates.map((related) => (
                <Link
                  key={related.slug}
                  href={`/excel-templates/${related.slug}`}
                  className="bg-gray-800/50 border border-gray-700 rounded-xl p-4 hover:border-emerald-500/50 transition-colors"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <span
                      className={`px-2 py-0.5 rounded text-xs font-medium ${
                        related.tier === 'free'
                          ? 'bg-emerald-500/20 text-emerald-400'
                          : related.tier === 'pro'
                            ? 'bg-blue-500/20 text-blue-400'
                            : 'bg-purple-500/20 text-purple-400'
                      }`}
                    >
                      {related.tier}
                    </span>
                    <span className="text-gray-500 text-xs">{related.category}</span>
                  </div>
                  <h3 className="font-medium text-white mb-1">{related.h1}</h3>
                  <p className="text-gray-400 text-sm line-clamp-2">{related.description}</p>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* CTA */}
        <div className="bg-gradient-to-r from-emerald-900/50 to-blue-900/50 border border-emerald-500/30 rounded-xl p-8 text-center">
          <h2 className="text-2xl font-bold mb-3">Ready to Get Started?</h2>
          <p className="text-gray-300 mb-6">
            Download the {template.h1} and start analyzing crypto in Excel today.
          </p>
          <Link
            href={`/templates?template=${slug}`}
            className="inline-block px-8 py-3 bg-emerald-600 hover:bg-emerald-700 rounded-lg font-medium transition-colors"
          >
            Download {template.tier === 'free' ? 'Free' : ''} Template
          </Link>
        </div>

        {/* Internal Links */}
        <div className="mt-12 pt-8 border-t border-gray-800 flex flex-wrap gap-4 text-sm">
          <Link href="/templates" className="text-emerald-400 hover:text-emerald-300">
            &#8592; All Templates
          </Link>
          <Link href="/template-requirements" className="text-gray-400 hover:text-gray-300">
            Requirements
          </Link>
          <Link href="/pricing" className="text-gray-400 hover:text-gray-300">
            Pricing
          </Link>
          <Link href="/faq" className="text-gray-400 hover:text-gray-300">
            FAQ
          </Link>
        </div>
      </div>
    </div>
  );
}
