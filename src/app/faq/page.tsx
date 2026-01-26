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
    question: 'What is CryptoReportKit?',
    answer: 'CryptoReportKit provides software tools for crypto analytics in Excel. Our templates use CRK formulas with a BYOK (Bring Your Own Key) architecture - you provide your own data provider API key (like CoinGecko), and our formulas fetch live data to your spreadsheets.',
  },
  {
    category: 'Getting Started',
    question: 'Do I need to create an account to use CryptoReportKit?',
    answer: 'No account is required to browse our analytics tools and charts. Creating a free account lets you save preferences, manage your API keys, and access additional features.',
  },
  {
    category: 'Getting Started',
    question: 'What is BYOK (Bring Your Own Key)?',
    answer: 'BYOK means you provide your own data provider API key (e.g., CoinGecko free or Pro). Templates contain CRK formulas that fetch data using YOUR key. This means CryptoReportKit doesn\'t redistribute data - you\'re fetching directly from the provider with your own credentials.',
  },
  // Templates
  {
    category: 'Templates',
    question: 'What are CryptoReportKit Excel Templates?',
    answer: 'Our Excel templates contain CRK formulas (no embedded data). When you open a template in Microsoft Excel with the CRK add-in installed and your API key connected, the formulas fetch live data directly to your spreadsheet.',
  },
  {
    category: 'Templates',
    question: 'What do I need to use the Excel templates?',
    answer: 'You need: 1) Microsoft Excel Desktop (Windows/Mac), 2) The CRK add-in installed, 3) A CryptoReportKit account (free), and 4) Your own data provider API key (e.g., CoinGecko). See our Template Requirements page for full setup.',
  },
  {
    category: 'Templates',
    question: 'Do templates include market data?',
    answer: 'No. Templates contain formulas only - no market data is embedded. Data is fetched via the CRK add-in using your own API key when you open the file in Excel. CryptoReportKit is software tooling, not a data vendor.',
  },
  {
    category: 'Templates',
    question: 'Why do I need my own API key?',
    answer: 'The BYOK architecture ensures compliance and gives you control. You sign up for a free CoinGecko API key, connect it to your CRK account, and templates use YOUR key to fetch data. This means you control your data access and rate limits.',
  },
  // Data & Accuracy
  {
    category: 'Data & Accuracy',
    question: 'How often is the data updated?',
    answer: 'Update frequency depends on your data provider\'s API and your plan. When you click "Refresh All" in Excel, the CRK add-in fetches fresh data using your API key. Free CoinGecko keys have rate limits; Pro keys have higher limits.',
  },
  {
    category: 'Data & Accuracy',
    question: 'Is the data accurate?',
    answer: 'Data accuracy depends on your chosen provider (CoinGecko, etc.). CryptoReportKit provides the software tooling to fetch and display data - we do not guarantee accuracy or completeness of third-party data sources.',
  },
  {
    category: 'Data & Accuracy',
    question: 'What coins/tokens are supported?',
    answer: 'Templates support coins available through your data provider\'s API. CoinGecko covers thousands of coins. The full list depends on your provider and API plan.',
  },
  // Tools & Features
  {
    category: 'Tools & Features',
    question: 'How do CRK formulas work?',
    answer: 'CRK formulas (like =CRK.PRICE("bitcoin")) are custom Excel functions powered by our add-in. When you refresh, the add-in reads your connected API key and fetches live data from your data provider.',
  },
  {
    category: 'Tools & Features',
    question: 'What is the Smart Contract Verifier?',
    answer: 'SafeContract is a smart contract verification status checker. It helps you see whether a contract is verified on public verification registries (when supported). It is not a security audit and does not provide guarantees of safety.',
  },
  // Pricing & Limits
  {
    category: 'Pricing & Limits',
    question: 'Is CryptoReportKit free?',
    answer: 'CryptoReportKit offers a free tier with limited downloads. Paid plans (coming soon) unlock more templates and features. Note: You also need a data provider API key - CoinGecko offers a free Demo API tier. See coingecko.com/api/pricing for current limits.',
  },
  {
    category: 'Pricing & Limits',
    question: 'What about API rate limits?',
    answer: 'Rate limits depend on your data provider\'s plan. Limits vary by CoinGecko tier (Demo, Analyst, Pro). See coingecko.com/api/pricing for current rate limits. Upgrade if you need more capacity.',
  },
  // Technical
  {
    category: 'Technical',
    question: 'How do I set up Excel templates?',
    answer: 'See our Template Requirements page. Steps: 1) Get a CoinGecko API key, 2) Connect it in your CRK account, 3) Download a template pack, 4) Install the CRK Excel add-in, 5) Sign in and click Refresh All.',
  },
  {
    category: 'Technical',
    question: 'Why do I see #NAME? errors in templates?',
    answer: 'This means the CRK add-in is not installed or not signed in. Install the add-in from Excel\'s add-in store, sign in with your CRK account, then click Data > Refresh All.',
  },
  {
    category: 'Technical',
    question: 'Can I customize the templates?',
    answer: 'Yes! Templates are regular Excel files. You can modify formulas, add your own calculations, and adjust charts. Just keep the CRK formulas intact for live data refresh.',
  },
  // Support
  {
    category: 'Support',
    question: 'How do I report a bug or request a feature?',
    answer: 'You can report issues or request features through our contact page, or email us directly. We actively monitor feedback and regularly add new features based on user requests.',
  },
  {
    category: 'Support',
    question: 'Is my data private?',
    answer: 'Your API keys are encrypted with AES-256-GCM before storage. We never see your plaintext keys. We do not store market data - it flows directly from your provider to your Excel workbook.',
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
            Everything you need to know about CryptoReportKit
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
            Can&apos;t find what you&apos;re looking for? Check out our setup guide or get in touch.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link
              href="/template-requirements"
              className="px-6 py-3 bg-emerald-500 hover:bg-emerald-600 rounded-lg font-semibold transition"
            >
              Setup Guide
            </Link>
            <Link
              href="/contact"
              className="px-6 py-3 bg-gray-700 hover:bg-gray-600 rounded-lg font-semibold transition"
            >
              Contact Us
            </Link>
          </div>
        </div>

        {/* Quick Links */}
        <div className="mt-12 grid md:grid-cols-3 gap-4">
          <Link
            href="/templates"
            className="p-4 bg-gray-800/50 border border-gray-700 rounded-xl hover:border-emerald-500/50 transition text-center"
          >
            <div className="text-2xl mb-2">📋</div>
            <div className="font-semibold">Excel Templates</div>
            <div className="text-sm text-gray-500">CRK formulas + BYOK</div>
          </Link>
          <Link
            href="/template-requirements"
            className="p-4 bg-gray-800/50 border border-gray-700 rounded-xl hover:border-emerald-500/50 transition text-center"
          >
            <div className="text-2xl mb-2">📖</div>
            <div className="font-semibold">Setup Guide</div>
            <div className="text-sm text-gray-500">Template requirements</div>
          </Link>
          <Link
            href="/about"
            className="p-4 bg-gray-800/50 border border-gray-700 rounded-xl hover:border-emerald-500/50 transition text-center"
          >
            <div className="text-2xl mb-2">🏢</div>
            <div className="font-semibold">About Us</div>
            <div className="text-sm text-gray-500">Company info</div>
          </Link>
        </div>
      </div>
    </div>
  );
}
