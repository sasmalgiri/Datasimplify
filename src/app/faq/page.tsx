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
    answer: 'CryptoReportKit provides Excel templates with prefetched crypto data and 20+ live web dashboards. Our BYOK (Bring Your Own Key) architecture means your API key stays local. Templates ship with data included, and live dashboards on the website let you explore real-time data.',
  },
  {
    category: 'Getting Started',
    question: 'Do I need to create an account to use CryptoReportKit?',
    answer: 'No account is required to browse our analytics tools and charts. Creating a free account lets you access and download Power Query templates from your downloads portal.',
  },
  {
    category: 'Getting Started',
    question: 'What is BYOK (Bring Your Own Key)?',
    answer: 'BYOK means you provide your own data provider API key (e.g., CoinGecko free or Pro). Your key stays in Excel - it never touches our servers. Templates use Power Query to fetch data directly from CoinGecko using YOUR key.',
  },
  // Templates
  {
    category: 'Templates',
    question: 'What are CryptoReportKit Power Query Templates?',
    answer: 'Our Excel templates ship with prefetched crypto data so you can start analyzing immediately. For real-time data, use the live dashboards on our website with your own CoinGecko API key (BYOK).',
  },
  {
    category: 'Templates',
    question: 'What do I need to use the templates?',
    answer: 'You need: 1) Microsoft Excel Desktop (Windows/Mac) or Excel Online, 2) Download a template from your CRK downloads portal. That\'s it - templates come with prefetched data ready to use!',
  },
  {
    category: 'Templates',
    question: 'Do templates include market data?',
    answer: 'No. Templates contain Power Query code only - no market data is embedded. Data is fetched via Power Query using your own API key when you refresh. CryptoReportKit is software tooling, not a data vendor.',
  },
  {
    category: 'Templates',
    question: 'Why do I need my own API key?',
    answer: 'The BYOK architecture ensures compliance and gives you control. You get a free CoinGecko API key, paste it in your Excel workbook, and Power Query uses YOUR key to fetch data. Your key never leaves Excel.',
  },
  // Data & Accuracy
  {
    category: 'Data & Accuracy',
    question: 'How often is the data updated?',
    answer: 'Update frequency depends on your CoinGecko API plan. Click "Data > Refresh All" in Excel to fetch fresh data using Power Query. Free keys have rate limits; Pro keys have higher limits.',
  },
  {
    category: 'Data & Accuracy',
    question: 'Is the data accurate?',
    answer: 'Data accuracy depends on CoinGecko. CryptoReportKit provides the Power Query code to fetch and display data - we do not guarantee accuracy or completeness of third-party data sources.',
  },
  {
    category: 'Data & Accuracy',
    question: 'What coins/tokens are supported?',
    answer: 'Templates support coins available through CoinGecko\'s API, which covers thousands of cryptocurrencies. The full list depends on your CoinGecko API plan.',
  },
  // Tools & Features
  {
    category: 'Tools & Features',
    question: 'How does Power Query work?',
    answer: 'Power Query is Excel\'s built-in data transformation tool. Our templates include M code (Power Query\'s language) that fetches data from CoinGecko using your API key. Just paste your key and refresh!',
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
    question: 'How do I set up Power Query templates?',
    answer: 'See our Setup Guide. Steps: 1) Get a free CoinGecko API key at coingecko.com/api, 2) Download a template from your CRK downloads portal, 3) Open in Excel, paste your API key in the designated cell, 4) Click Data > Refresh All.',
  },
  {
    category: 'Technical',
    question: 'Why do I see connection errors?',
    answer: 'This usually means your API key is missing or incorrect. Make sure you\'ve pasted your CoinGecko API key in the designated cell (usually named "APIKey" or in a settings sheet). Then try Data > Refresh All again.',
  },
  {
    category: 'Technical',
    question: 'Can I customize the templates?',
    answer: 'Yes! Templates are regular Excel files with Power Query connections. You can modify queries, add your own calculations, and adjust charts. Open the Power Query Editor to see and modify the M code.',
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
    answer: 'Yes! With Power Query templates, your API key stays in Excel - it never touches our servers. Data flows directly from CoinGecko to your Excel workbook. We don\'t store or see your keys.',
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
            href="/downloads"
            className="p-4 bg-gray-800/50 border border-gray-700 rounded-xl hover:border-emerald-500/50 transition text-center"
          >
            <div className="text-2xl mb-2">📊</div>
            <div className="font-semibold">Power Query Templates</div>
            <div className="text-sm text-gray-500">BYOK - Prefetched data included</div>
          </Link>
          <Link
            href="/template-requirements"
            className="p-4 bg-gray-800/50 border border-gray-700 rounded-xl hover:border-emerald-500/50 transition text-center"
          >
            <div className="text-2xl mb-2">📖</div>
            <div className="font-semibold">Setup Guide</div>
            <div className="text-sm text-gray-500">How to get started</div>
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
