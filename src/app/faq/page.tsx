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
    answer: 'CryptoReportKit provides educational crypto analytics tools and Excel templates with CryptoSheets formulas for live data visualization. We offer charts, comparisons, and technical indicator analysis for educational purposes.',
  },
  {
    category: 'Getting Started',
    question: 'Do I need to create an account to use CryptoReportKit?',
    answer: 'No account is required to browse our analytics tools and charts. Creating a free account lets you save preferences and access additional features.',
  },
  {
    category: 'Getting Started',
    question: 'What data sources does CryptoReportKit use?',
    answer: 'Our web dashboards display educational visualizations based on publicly available data sources. Excel templates use CryptoSheets formulas that fetch data via your own CryptoSheets account when opened in Excel.',
  },
  // Templates
  {
    category: 'Templates',
    question: 'What are CryptoReportKit Excel Templates?',
    answer: 'Our Excel templates contain CryptoSheets formulas (no embedded data). When you open a template in Microsoft Excel with the CryptoSheets add-in installed, the formulas fetch live data directly to your spreadsheet.',
  },
  {
    category: 'Templates',
    question: 'What do I need to use the Excel templates?',
    answer: 'You need: 1) Microsoft Excel Desktop (Windows/Mac), 2) The CryptoSheets add-in installed, and 3) A CryptoSheets account (free or paid). See our Template Requirements page for full setup instructions.',
  },
  {
    category: 'Templates',
    question: 'Do templates include market data?',
    answer: 'No. Templates contain formulas only - no market data is embedded. Data is fetched via the CryptoSheets add-in when you open the file in Excel. CryptoReportKit is software tooling, not a data vendor.',
  },
  {
    category: 'Templates',
    question: 'Why do templates require CryptoSheets?',
    answer: 'CryptoSheets is a third-party Excel add-in that provides the data feed. Templates contain formulas that call CryptoSheets functions. This approach means you use your own CryptoSheets subscription to fetch data.',
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
    answer: 'We support 75+ major cryptocurrencies including BTC, ETH, BNB, SOL, XRP, ADA, DOGE, and many more. The full list is available on our Templates page when configuring your template.',
  },
  // Tools & Features
  {
    category: 'Tools & Features',
    question: 'What are CryptoReportKit Excel Templates?',
    answer: 'Our Excel templates contain CryptoSheets formulas that fetch live crypto data when you open them in Excel. Templates include pre-built charts and visualizations. Requires the CryptoSheets add-in (free or paid) to function.',
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
    answer: 'CryptoReportKit offers free access to our analytics dashboards and charts. Excel templates may require a paid subscription depending on features needed. CryptoSheets (required for templates) has its own pricing.',
  },
  {
    category: 'Pricing & Limits',
    question: 'What do I need to pay for?',
    answer: 'CryptoReportKit dashboards are free. Premium Excel templates may require a subscription. Note: Templates also require a CryptoSheets account (separate product) which has free and paid tiers.',
  },
  // Technical
  {
    category: 'Technical',
    question: 'How do I set up Excel templates?',
    answer: 'See our Template Requirements page for full setup instructions. You need Microsoft Excel Desktop, the CryptoSheets add-in, and a CryptoSheets account. Open the template in Excel and sign into CryptoSheets to load data.',
  },
  {
    category: 'Technical',
    question: 'Why do I see #NAME? errors in templates?',
    answer: 'This means the CryptoSheets add-in is not installed or not signed in. Install CryptoSheets from Excel\'s add-in store, sign in, then click Data > Refresh All.',
  },
  {
    category: 'Technical',
    question: 'Can I customize the templates?',
    answer: 'Yes! Templates are regular Excel files. You can modify formulas, add your own calculations, and adjust charts. Just keep the CryptoSheets formulas intact for live data.',
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
    answer: 'We do not store personal data beyond what you provide for your account. If you create an account, your email is stored securely and never shared with third parties. See our Privacy Policy for details.',
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
            href="/templates"
            className="p-4 bg-gray-800/50 border border-gray-700 rounded-xl hover:border-emerald-500/50 transition text-center"
          >
            <div className="text-2xl mb-2">📋</div>
            <div className="font-semibold">Excel Templates</div>
            <div className="text-sm text-gray-500">CryptoSheets formulas</div>
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
