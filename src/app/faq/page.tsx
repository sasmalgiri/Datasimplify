'use client';

import { useState } from 'react';
import Link from 'next/link';
import { FreeNavbar } from '@/components/FreeNavbar';
import { Breadcrumb } from '@/components/Breadcrumb';

interface FAQItem {
  question: string;
  answer: string;
  category: string;
}

const faqs: FAQItem[] = [
  // Getting Started
  {
    category: 'Getting Started',
    question: 'What is DataSimplify?',
    answer: 'DataSimplify helps you download crypto market data to Excel, CSV, and JSON formats. Many downloads can be refreshed in Excel via Power Query, so spreadsheets can stay up to date without manual copy/paste.',
  },
  {
    category: 'Getting Started',
    question: 'Do I need to create an account to use DataSimplify?',
    answer: 'No account is required for basic downloads. You can download up to 5 files per month for free. Creating a free account lets you track your usage and unlock additional features.',
  },
  {
    category: 'Getting Started',
    question: 'What data sources does DataSimplify use?',
    answer: 'Data sources vary by dataset and by which providers are enabled in your deployment. Common sources include exchange market data APIs and public market indicators (e.g. Fear & Greed). Some optional datasets may be disabled by default for commercial/ToS safety.',
  },
  // Downloads
  {
    category: 'Downloads',
    question: 'What file formats are supported?',
    answer: 'We support XLSX (Excel), CSV, JSON, and IQY (Excel Web Query) formats. The IQY format is special - it creates a live connection that refreshes automatically in Excel using Power Query.',
  },
  {
    category: 'Downloads',
    question: 'How do I make my Excel file auto-refresh?',
    answer: 'Download the Live Excel (IQY) format, then open it in Excel. Go to Data > Queries & Connections, right-click the connection, and set your preferred refresh interval. You can also use our Excel Template which includes pre-configured Power Query connections.',
  },
  {
    category: 'Downloads',
    question: 'Can I use the data in Google Sheets?',
    answer: 'Yes! Use the IMPORTDATA formula with our CSV API endpoint. For example: =IMPORTDATA("https://datasimplify.com/api/download?category=market_overview&format=csv"). The data refreshes automatically every hour in Google Sheets.',
  },
  {
    category: 'Downloads',
    question: 'What data types can I download?',
    answer: 'We offer 30+ data categories including: Market Overview, Historical Prices (OHLCV), Order Book, Recent Trades, Global Stats, DeFi Protocols, Stablecoins, Fear & Greed Index, Funding Rates, Open Interest, Technical Indicators, NFT Collections, and more.',
  },
  // Data & Accuracy
  {
    category: 'Data & Accuracy',
    question: 'How often is the data updated?',
    answer: 'Update frequency depends on the dataset and provider. Some endpoints update frequently, while others refresh on a schedule. If a dataset is unavailable from enabled sources, the app shows “Unavailable” rather than placeholder data.',
  },
  {
    category: 'Data & Accuracy',
    question: 'Is the data accurate?',
    answer: 'We aim to provide accurate data, but accuracy depends on upstream providers and network conditions. Derived metrics use standard calculation methods where applicable. We do not guarantee accuracy or completeness, and unavailable datasets are shown as “Unavailable”.',
  },
  {
    category: 'Data & Accuracy',
    question: 'What coins/tokens are supported?',
    answer: 'We support 75+ major cryptocurrencies including BTC, ETH, BNB, SOL, XRP, ADA, DOGE, and many more. The full list is available in our Download Center when selecting coins.',
  },
  // Tools & Features
  {
    category: 'Tools & Features',
    question: 'What is the Smart Contract Verifier?',
    answer: 'SafeContract is a smart contract verification status checker. It helps you see whether a contract is verified on public verification registries (when supported). It is not a security audit and does not provide guarantees of safety.',
  },
  {
    category: 'Tools & Features',
    question: 'How does the AI Prediction Community work?',
    answer: 'Our community lets users share crypto price predictions with specific targets and timeframes. Predictions are tracked automatically, and users earn accuracy scores based on their track record. Top predictors appear on the leaderboard.',
  },
  {
    category: 'Tools & Features',
    question: 'What AI features does DataSimplify offer?',
    answer: 'AI features (like chat and predictions) may be available depending on configuration. AI outputs can be wrong, so treat them as educational signals rather than financial advice.',
  },
  // Pricing & Limits
  {
    category: 'Pricing & Limits',
    question: 'Is DataSimplify free?',
    answer: 'DataSimplify can be used with a free tier that includes 5 downloads per month. Available datasets depend on deployment configuration and provider availability.',
  },
  {
    category: 'Pricing & Limits',
    question: 'What are the rate limits?',
    answer: 'Free users have a monthly download limit (5/month). Additional rate limits can apply depending on the deployment and upstream providers.',
  },
  {
    category: 'Pricing & Limits',
    question: 'Do you offer API access?',
    answer: 'Yes, all our data is available via REST API. You can access it using the same endpoints as our download feature. API documentation is available for developers who want to integrate our data into their applications.',
  },
  // Technical
  {
    category: 'Technical',
    question: 'How do I use Power Query with DataSimplify?',
    answer: 'Download our Excel Template which includes pre-configured Power Query connections. Alternatively, in Excel go to Data > Get Data > From Web, paste our API URL, and configure your refresh settings. Our IQY files do this automatically.',
  },
  {
    category: 'Technical',
    question: 'Can I filter the data before downloading?',
    answer: 'Some downloads support filtering and field selection. Exact options depend on the dataset and the current UI.',
  },
  {
    category: 'Technical',
    question: 'What programming languages can I use with the API?',
    answer: 'Our REST API works with any language that can make HTTP requests. We provide examples for Python, JavaScript, and Excel/VBA. The JSON format is ideal for programmatic access.',
  },
  // Support
  {
    category: 'Support',
    question: 'How do I report a bug or request a feature?',
    answer: 'You can report issues or request features through our community forum, or email us directly. We actively monitor feedback and regularly add new features based on user requests.',
  },
  {
    category: 'Support',
    question: 'Is my data private?',
    answer: 'We do not store your downloaded data. API calls are logged for rate limiting purposes only. If you create an account, your email is stored securely and never shared with third parties.',
  },
];

const categories = [...new Set(faqs.map(f => f.category))];

export default function FAQPage() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const filteredFaqs = selectedCategory === 'all'
    ? faqs
    : faqs.filter(f => f.category === selectedCategory);

  const toggleFaq = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900 text-white">
      <FreeNavbar />
      <Breadcrumb />

      <div className="max-w-4xl mx-auto px-4 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">Frequently Asked Questions</h1>
          <p className="text-gray-400 text-lg">
            Everything you need to know about DataSimplify
          </p>
        </div>

        {/* Category Filter */}
        <div className="flex flex-wrap justify-center gap-2 mb-8">
          <button
            onClick={() => setSelectedCategory('all')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
              selectedCategory === 'all'
                ? 'bg-emerald-500 text-white'
                : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
            }`}
          >
            All
          </button>
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                selectedCategory === cat
                  ? 'bg-emerald-500 text-white'
                  : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* FAQ List */}
        <div className="space-y-4">
          {filteredFaqs.map((faq, index) => (
            <div
              key={index}
              className="bg-gray-800/50 border border-gray-700 rounded-xl overflow-hidden"
            >
              <button
                onClick={() => toggleFaq(index)}
                className="w-full px-6 py-4 flex items-center justify-between text-left hover:bg-gray-800/80 transition"
              >
                <div className="flex items-center gap-3">
                  <span className="text-xs px-2 py-1 bg-gray-700 rounded text-gray-400">
                    {faq.category}
                  </span>
                  <span className="font-medium text-white">{faq.question}</span>
                </div>
                <span className={`text-2xl text-gray-400 transition-transform ${openIndex === index ? 'rotate-45' : ''}`}>
                  +
                </span>
              </button>
              {openIndex === index && (
                <div className="px-6 pb-4 text-gray-300 leading-relaxed border-t border-gray-700 pt-4">
                  {faq.answer}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Still Have Questions */}
        <div className="mt-12 text-center bg-gradient-to-r from-emerald-900/30 to-blue-900/30 border border-emerald-500/30 rounded-2xl p-8">
          <h2 className="text-2xl font-bold mb-4">Still Have Questions?</h2>
          <p className="text-gray-400 mb-6">
            Can&apos;t find what you&apos;re looking for? Check out our community or get in touch.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link
              href="/community"
              className="px-6 py-3 bg-emerald-500 hover:bg-emerald-600 rounded-lg font-semibold transition"
            >
              Visit Community
            </Link>
            <Link
              href="/learn"
              className="px-6 py-3 bg-gray-700 hover:bg-gray-600 rounded-lg font-semibold transition"
            >
              Learn More
            </Link>
          </div>
        </div>

        {/* Quick Links */}
        <div className="mt-12 grid md:grid-cols-3 gap-4">
          <Link
            href="/download"
            className="p-4 bg-gray-800/50 border border-gray-700 rounded-xl hover:border-emerald-500/50 transition text-center"
          >
            <div className="text-2xl mb-2">📊</div>
            <div className="font-semibold">Download Center</div>
            <div className="text-sm text-gray-500">Get crypto data</div>
          </Link>
          <Link
            href="/smart-contract-verifier"
            className="p-4 bg-gray-800/50 border border-gray-700 rounded-xl hover:border-emerald-500/50 transition text-center"
          >
            <div className="text-2xl mb-2">🔐</div>
            <div className="font-semibold">SafeContract</div>
            <div className="text-sm text-gray-500">Verify smart contracts</div>
          </Link>
          <Link
            href="/community/guidelines"
            className="p-4 bg-gray-800/50 border border-gray-700 rounded-xl hover:border-emerald-500/50 transition text-center"
          >
            <div className="text-2xl mb-2">📋</div>
            <div className="font-semibold">Guidelines</div>
            <div className="text-sm text-gray-500">Community rules</div>
          </Link>
        </div>
      </div>
    </div>
  );
}
