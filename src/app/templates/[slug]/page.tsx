'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { FreeNavbar } from '@/components/FreeNavbar';
import { Breadcrumb } from '@/components/Breadcrumb';
import { ProductDisclaimer } from '@/components/ProductDisclaimer';
import { TemplateDownloadModal } from '@/components/TemplateDownloadModal';
import { DataPreview } from '@/components/DataPreview';
import {
  getReportKitBySlug,
  getRelatedKits,
  type ReportKit,
} from '@/lib/reportKits';
import {
  ArrowLeft,
  Download,
  Check,
  ChevronDown,
  ChevronUp,
  Star,
  Shield,
  Clock,
  FileSpreadsheet,
  Sparkles,
  Eye,
  EyeOff,
} from 'lucide-react';
import { ReportKitProductJsonLd } from '@/components/JsonLd';

function TierBadge({ tier }: { tier: ReportKit['tier'] }) {
  const colors = {
    free: 'bg-green-100 text-green-800 border-green-200',
    pro: 'bg-blue-100 text-blue-800 border-blue-200',
  };

  return (
    <span className={`px-3 py-1 rounded-full text-sm font-medium border ${colors[tier]}`}>
      {tier === 'free' ? 'Free' : 'Pro'}
    </span>
  );
}

function FAQItem({ question, answer }: { question: string; answer: string }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-4 py-3 text-left flex items-center justify-between bg-gray-50 hover:bg-gray-100 transition-colors"
      >
        <span className="font-medium text-gray-900">{question}</span>
        {isOpen ? (
          <ChevronUp className="w-5 h-5 text-gray-500" />
        ) : (
          <ChevronDown className="w-5 h-5 text-gray-500" />
        )}
      </button>
      {isOpen && (
        <div className="px-4 py-3 bg-white">
          <p className="text-gray-600">{answer}</p>
        </div>
      )}
    </div>
  );
}

// Default coins for preview based on kit type
const DEFAULT_PREVIEW_COINS = ['BTC', 'ETH', 'SOL', 'BNB', 'XRP', 'ADA', 'DOGE', 'AVAX'];

export default function ReportKitPage() {
  const params = useParams();
  const slug = params.slug as string;
  const [kit, setKit] = useState<ReportKit | null>(null);
  const [relatedKits, setRelatedKits] = useState<ReportKit[]>([]);
  const [showDownloadModal, setShowDownloadModal] = useState(false);
  const [selectedTemplateIndex, setSelectedTemplateIndex] = useState(0);

  // Live Preview state
  const [showPreview, setShowPreview] = useState(true);
  const [previewCoins, setPreviewCoins] = useState<string[]>(DEFAULT_PREVIEW_COINS.slice(0, 5));
  const [previewTimeframe, setPreviewTimeframe] = useState('1d');

  useEffect(() => {
    const foundKit = getReportKitBySlug(slug);
    if (foundKit) {
      setKit(foundKit);
      setRelatedKits(getRelatedKits(foundKit.id));
      // Set preview coins based on kit's preset
      const coinCount = Math.min(foundKit.presets.coins, 8);
      setPreviewCoins(DEFAULT_PREVIEW_COINS.slice(0, coinCount));
      setPreviewTimeframe(foundKit.presets.timeframe || '1d');
    }
  }, [slug]);

  if (!kit) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

  const handleDownload = (templateIndex: number) => {
    setSelectedTemplateIndex(templateIndex);
    setShowDownloadModal(true);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <ReportKitProductJsonLd
        name={kit.name}
        description={kit.description}
        tier={kit.tier}
        slug={kit.slug}
      />
      <FreeNavbar />
      <Breadcrumb />

      <main className="max-w-4xl mx-auto px-4 py-8">
        {/* Back Link */}
        <Link
          href="/templates"
          className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to All Templates
        </Link>

        {/* Hero Section */}
        <div className="bg-white rounded-2xl border border-gray-200 p-8 mb-8 shadow-sm">
          <div className="flex items-start gap-6">
            <div className="text-5xl">{kit.icon}</div>
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-3xl font-bold text-gray-900">{kit.name}</h1>
                <TierBadge tier={kit.tier} />
              </div>
              <p className="text-xl text-gray-600 mb-4">{kit.tagline}</p>
              <p className="text-gray-700 mb-6">{kit.description}</p>

              {/* Quick Stats */}
              <div className="flex flex-wrap gap-4 mb-6">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <FileSpreadsheet className="w-4 h-4" />
                  <span>{kit.templates.length} template(s)</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Clock className="w-4 h-4" />
                  <span>
                    {kit.presets.refresh === 'manual' ? 'Manual refresh' : 'Auto-refresh'}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Star className="w-4 h-4" />
                  <span>{kit.presets.coins} coins default</span>
                </div>
              </div>

              {/* CTA Button */}
              <button
                type="button"
                onClick={() => handleDownload(0)}
                className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-medium transition-colors"
              >
                <Download className="w-5 h-5" />
                Download Report Kit
              </button>
            </div>
          </div>
        </div>

        {/* Product Disclaimer */}
        <ProductDisclaimer className="mb-8" />

        {/* Features Section */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-emerald-600" />
            What&apos;s Included
          </h2>
          <div className="grid sm:grid-cols-2 gap-3">
            {kit.features.map((feature, i) => (
              <div key={i} className="flex items-start gap-2">
                <Check className="w-5 h-5 text-emerald-600 mt-0.5 flex-shrink-0" />
                <span className="text-gray-700">{feature}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Live Preview Section */}
        <div className="mb-8">
          <div className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
            {/* Preview Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-800">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse" />
                <h2 className="text-lg font-bold text-white">Live Data Preview</h2>
                <span className="text-xs text-gray-500 bg-gray-800 px-2 py-1 rounded">
                  Sample of what you&apos;ll get
                </span>
              </div>
              <button
                type="button"
                onClick={() => setShowPreview(!showPreview)}
                className="flex items-center gap-2 px-3 py-1.5 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg text-sm transition-colors"
              >
                {showPreview ? (
                  <>
                    <EyeOff className="w-4 h-4" />
                    Hide Preview
                  </>
                ) : (
                  <>
                    <Eye className="w-4 h-4" />
                    Show Preview
                  </>
                )}
              </button>
            </div>

            {/* Preview Content */}
            {showPreview && (
              <div className="p-4">
                <DataPreview
                  selectedCoins={previewCoins}
                  timeframe={previewTimeframe}
                  onDataLoad={() => {}}
                />
              </div>
            )}

            {/* Preview Footer */}
            <div className="px-4 py-3 bg-emerald-900/20 border-t border-emerald-500/30">
              <p className="text-xs text-emerald-400 text-center">
                💡 This preview shows live data with charts, filters & advanced visualizations. In Excel, you can analyze the prefetched data immediately. Use our live dashboards for real-time data.
              </p>
            </div>
          </div>
        </div>

        {/* Use Cases Section */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Perfect For</h2>
          <div className="grid sm:grid-cols-2 gap-3">
            {kit.useCases.map((useCase, i) => (
              <div key={i} className="flex items-start gap-2">
                <div className="w-2 h-2 rounded-full bg-blue-500 mt-2 flex-shrink-0" />
                <span className="text-gray-700">{useCase}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Templates in this Kit */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Templates in This Kit</h2>
          <div className="space-y-3">
            {kit.templates.map((templateId, i) => (
              <div
                key={templateId}
                className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-100"
              >
                <div>
                  <h3 className="font-medium text-gray-900 capitalize">
                    {templateId.replace(/_/g, ' ')}
                  </h3>
                  <p className="text-sm text-gray-500">Excel data template (BYOK)</p>
                </div>
                <button
                  type="button"
                  onClick={() => handleDownload(i)}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm font-medium transition-colors"
                >
                  Download
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Setup Steps */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-200 p-6 mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Quick Setup (3 Steps)</h2>
          <div className="space-y-4">
            <div className="flex items-start gap-4">
              <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold flex-shrink-0">
                1
              </div>
              <div>
                <h3 className="font-medium text-gray-900">Download the template</h3>
                <p className="text-sm text-gray-600">
                  Click download above to get the Excel file with pre-built formulas.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold flex-shrink-0">
                2
              </div>
              <div>
                <h3 className="font-medium text-gray-900">Connect Your API Key (BYOK)</h3>
                <p className="text-sm text-gray-600">
                  Sign in to CryptoReportKit and connect your own API key (e.g., CoinGecko).
                  See the{' '}
                  <Link
                    href="/template-requirements"
                    className="text-blue-600 hover:underline"
                  >
                    setup guide
                  </Link>{' '}
                  for details.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold flex-shrink-0">
                3
              </div>
              <div>
                <h3 className="font-medium text-gray-900">Open and refresh</h3>
                <p className="text-sm text-gray-600">
                  Open the template in Excel Desktop, paste your API key in the designated cell, and hit Data → Refresh All to see live
                  data.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* FAQ Section */}
        {kit.faqs.length > 0 && (
          <div className="mb-8">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Frequently Asked Questions</h2>
            <div className="space-y-3">
              {kit.faqs.map((faq, i) => (
                <FAQItem key={i} question={faq.question} answer={faq.answer} />
              ))}
            </div>
          </div>
        )}

        {/* Related Kits */}
        {relatedKits.length > 0 && (
          <div className="mb-8">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Related Report Kits</h2>
            <div className="grid sm:grid-cols-2 gap-4">
              {relatedKits.map((relatedKit) => (
                <Link
                  key={relatedKit.id}
                  href={`/templates/${relatedKit.slug}`}
                  className="p-4 bg-white rounded-xl border border-gray-200 hover:border-emerald-300 hover:shadow-md transition-all group"
                >
                  <div className="flex items-start gap-3">
                    <div className="text-3xl">{relatedKit.icon}</div>
                    <div>
                      <h3 className="font-semibold text-gray-900 group-hover:text-emerald-600 transition-colors">
                        {relatedKit.name}
                      </h3>
                      <p className="text-sm text-gray-600">{relatedKit.tagline}</p>
                      <TierBadge tier={relatedKit.tier} />
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* 30-Day Guarantee */}
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-6 text-center">
          <Shield className="w-10 h-10 text-emerald-600 mx-auto mb-3" />
          <h3 className="font-semibold text-emerald-800 text-lg mb-2">
            30-Day Money-Back Guarantee
          </h3>
          <p className="text-emerald-700 text-sm mb-3">
            Not satisfied? Get a full refund within 30 days, no questions asked.
          </p>
          <Link href="/refund" className="text-emerald-600 hover:text-emerald-800 text-sm underline">
            View refund policy
          </Link>
        </div>
      </main>

      {/* Download Modal */}
      {showDownloadModal && kit && (
        <TemplateDownloadModal
          isOpen={showDownloadModal}
          onClose={() => setShowDownloadModal(false)}
          templateType={kit.templates[selectedTemplateIndex]}
          templateName={kit.templates[selectedTemplateIndex].replace(/_/g, ' ')}
          userConfig={{
            coins: ['BTC', 'ETH', 'SOL', 'BNB', 'XRP'].slice(0, kit.presets.coins > 5 ? 5 : kit.presets.coins),
            timeframe: kit.presets.timeframe,
            currency: 'USD',
            customizations: {},
          }}
        />
      )}
    </div>
  );
}
