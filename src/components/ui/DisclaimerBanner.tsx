'use client';

import { useState, useEffect } from 'react';
import { AlertTriangle, X } from 'lucide-react';

const DISCLAIMER_KEY = 'datasimplify_disclaimer_accepted';

export default function DisclaimerBanner() {
  const [isVisible, setIsVisible] = useState(false);
  const [isClosing, setIsClosing] = useState(false);

  useEffect(() => {
    // Check if user has already accepted
    const accepted = localStorage.getItem(DISCLAIMER_KEY);
    if (!accepted) {
      setIsVisible(true);
    }
  }, []);

  const handleAccept = () => {
    setIsClosing(true);
    setTimeout(() => {
      localStorage.setItem(DISCLAIMER_KEY, 'true');
      setIsVisible(false);
    }, 300);
  };

  if (!isVisible) return null;

  return (
    <>
      {/* Overlay */}
      <div
        className={`fixed inset-0 bg-black/60 backdrop-blur-sm z-[9998] transition-opacity duration-300 ${
          isClosing ? 'opacity-0' : 'opacity-100'
        }`}
      />

      {/* Banner */}
      <div
        className={`fixed inset-x-0 bottom-0 z-[9999] transition-transform duration-300 ${
          isClosing ? 'translate-y-full' : 'translate-y-0'
        }`}
      >
        <div className="bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 border-t border-yellow-500/30">
          <div className="max-w-6xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
            <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
              {/* Warning Icon */}
              <div className="flex-shrink-0">
                <div className="w-12 h-12 rounded-full bg-yellow-500/20 flex items-center justify-center">
                  <AlertTriangle className="w-6 h-6 text-yellow-500" />
                </div>
              </div>

              {/* Content */}
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-white mb-2">
                  Important Disclaimer
                </h3>
                <div className="text-gray-300 text-sm space-y-2">
                  <p>
                    <strong className="text-yellow-400">DataSimplify provides educational content only.</strong>{' '}
                    Nothing on this platform constitutes financial, investment, tax, or legal advice.
                  </p>
                  <p>
                    Cryptocurrency investments are <strong className="text-red-400">highly volatile and risky</strong>.
                    You may lose some or all of your investment. Past performance is not indicative of future results.
                  </p>
                  <p>
                    <strong>Always DYOR</strong> (Do Your Own Research) and consult with qualified financial advisors before making any investment decisions.
                  </p>
                </div>

                {/* Data Sources */}
                <div className="mt-3 text-xs text-gray-500">
                  Data Sources: CoinGecko API, Binance, DeFiLlama, Alternative.me, CryptoPanic
                </div>
              </div>

              {/* Accept Button */}
              <div className="flex-shrink-0 w-full md:w-auto">
                <button
                  onClick={handleAccept}
                  className="w-full md:w-auto px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-lg transition-colors duration-200 flex items-center justify-center gap-2"
                >
                  <span>I Understand</span>
                </button>
              </div>
            </div>

            {/* Additional Links */}
            <div className="mt-4 pt-4 border-t border-gray-700/50 flex flex-wrap gap-4 text-xs text-gray-400">
              <a href="/terms" className="hover:text-white transition-colors">Terms of Service</a>
              <span className="text-gray-600">|</span>
              <a href="/privacy" className="hover:text-white transition-colors">Privacy Policy</a>
              <span className="text-gray-600">|</span>
              <span>We do not sell your data</span>
              <span className="text-gray-600">|</span>
              <span>Not available in all jurisdictions</span>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

// Inline disclaimer for pages
export function InlineDisclaimer({ className = '' }: { className?: string }) {
  return (
    <div className={`bg-gray-800/50 border border-gray-700 rounded-lg p-4 ${className}`}>
      <div className="flex items-start gap-3">
        <AlertTriangle className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" />
        <div className="text-sm text-gray-400">
          <p className="font-medium text-gray-300 mb-1">Not Financial Advice</p>
          <p>
            This content is for educational purposes only. Cryptocurrency is highly volatile.
            Always DYOR and consult financial advisors before investing.
          </p>
        </div>
      </div>
    </div>
  );
}

// AI Prediction specific disclaimer
export function AIPredictionDisclaimer({ className = '' }: { className?: string }) {
  return (
    <div className={`bg-purple-900/20 border border-purple-500/30 rounded-lg p-4 ${className}`}>
      <div className="flex items-start gap-3">
        <AlertTriangle className="w-5 h-5 text-purple-400 flex-shrink-0 mt-0.5" />
        <div className="text-sm text-gray-400">
          <p className="font-medium text-purple-300 mb-1">AI Prediction Disclaimer</p>
          <p>
            AI predictions are experimental and based on historical patterns. Accuracy varies significantly.
            <strong className="text-white"> Never invest based solely on AI signals.</strong>{' '}
            Always conduct your own research and consult qualified financial advisors.
          </p>
        </div>
      </div>
    </div>
  );
}

// Compact footer disclaimer
export function FooterDisclaimer() {
  return (
    <div className="text-center text-xs text-gray-500 space-y-1 py-4 border-t border-gray-800">
      <p>
        <span className="text-yellow-500">⚠️</span> Not financial advice. Past performance ≠ future results.
      </p>
      <p>
        Data Sources: CoinGecko, Binance, DeFiLlama, Alternative.me |{' '}
        <a href="/terms" className="text-gray-400 hover:text-white">Terms</a> |{' '}
        <a href="/privacy" className="text-gray-400 hover:text-white">Privacy</a>
      </p>
      <p>© 2024 DataSimplify. All rights reserved. We do not sell your data.</p>
    </div>
  );
}
