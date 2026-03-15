'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { X, ChevronRight, ChevronLeft, Map, Lightbulb, ArrowRight } from 'lucide-react';

interface TourStep {
  title: string;
  description: string;
  tip?: string;
}

interface GuidedTourProps {
  /** Unique ID for localStorage persistence */
  tourId: string;
  /** Page title shown in the header */
  pageTitle: string;
  /** Steps to walk through */
  steps: TourStep[];
  /** Where to go after completing the tour */
  nextPage?: { label: string; href: string };
}

const STORAGE_PREFIX = 'crk-tour-';

/**
 * GuidedTour - A floating step-by-step walkthrough panel.
 * Shows on first visit to a page, guiding beginners through what they're seeing.
 * Dismissible and remembers completion via localStorage.
 */
export function GuidedTour({ tourId, pageTitle, steps, nextPage }: GuidedTourProps) {
  const [show, setShow] = useState(false);
  const [current, setCurrent] = useState(0);
  const [minimized, setMinimized] = useState(false);

  useEffect(() => {
    const key = STORAGE_PREFIX + tourId;
    if (!localStorage.getItem(key)) {
      // Small delay so the page renders first
      const t = setTimeout(() => setShow(true), 1200);
      return () => clearTimeout(t);
    }
  }, [tourId]);

  function dismiss() {
    localStorage.setItem(STORAGE_PREFIX + tourId, '1');
    setShow(false);
  }

  function next() {
    if (current < steps.length - 1) {
      setCurrent((c) => c + 1);
    } else {
      dismiss();
    }
  }

  function prev() {
    if (current > 0) setCurrent((c) => c - 1);
  }

  if (!show) return null;

  const step = steps[current];
  const isLast = current === steps.length - 1;

  if (minimized) {
    return (
      <button
        type="button"
        onClick={() => setMinimized(false)}
        className="fixed bottom-6 right-6 z-[90] flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-full shadow-lg transition-colors text-sm font-medium"
      >
        <Map className="w-4 h-4" />
        Guide ({current + 1}/{steps.length})
      </button>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 z-[90] w-80 bg-gray-800 border border-gray-700 rounded-2xl shadow-2xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-emerald-600/20 border-b border-gray-700/50">
        <div className="flex items-center gap-2">
          <Map className="w-4 h-4 text-emerald-400" />
          <span className="text-sm font-semibold text-white">{pageTitle} Guide</span>
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setMinimized(true)}
            className="text-gray-400 hover:text-white transition-colors p-1 text-xs"
            title="Minimize"
          >
            —
          </button>
          <button
            type="button"
            onClick={dismiss}
            className="text-gray-400 hover:text-white transition-colors p-1"
            title="Close guide"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Progress */}
      <div className="px-4 pt-3">
        <div className="flex gap-1 mb-3">
          {steps.map((_, i) => (
            <div
              key={i}
              className={`h-1 flex-1 rounded-full transition-colors ${
                i <= current ? 'bg-emerald-500' : 'bg-gray-700'
              }`}
            />
          ))}
        </div>

        {/* Step content */}
        <div className="mb-3">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">
              Step {current + 1} of {steps.length}
            </span>
          </div>
          <h4 className="text-white font-medium text-sm mb-1">{step.title}</h4>
          <p className="text-gray-400 text-xs leading-relaxed">{step.description}</p>
          {step.tip && (
            <div className="flex items-start gap-1.5 mt-2 p-2 bg-amber-500/10 border border-amber-500/20 rounded-lg">
              <Lightbulb className="w-3 h-3 text-amber-400 shrink-0 mt-0.5" />
              <p className="text-xs text-amber-300">{step.tip}</p>
            </div>
          )}
        </div>
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between px-4 py-3 border-t border-gray-700/50">
        <button
          type="button"
          onClick={prev}
          disabled={current === 0}
          className="flex items-center gap-1 text-xs text-gray-400 hover:text-white transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
        >
          <ChevronLeft className="w-3.5 h-3.5" />
          Back
        </button>

        {isLast ? (
          <div className="flex items-center gap-2">
            {nextPage && (
              <Link
                href={nextPage.href}
                onClick={dismiss}
                className="flex items-center gap-1 text-xs text-emerald-400 hover:text-emerald-300 transition-colors"
              >
                {nextPage.label}
                <ArrowRight className="w-3 h-3" />
              </Link>
            )}
            <button
              type="button"
              onClick={dismiss}
              className="flex items-center gap-1 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 rounded-lg text-xs font-medium text-white transition-colors"
            >
              Got it!
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={next}
            className="flex items-center gap-1 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 rounded-lg text-xs font-medium text-white transition-colors"
          >
            Next
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Pre-built tour configs for tool pages                              */
/* ------------------------------------------------------------------ */

export const TOUR_MARKET: TourStep[] = [
  {
    title: 'Welcome to the Market',
    description: 'This page shows the top 500+ cryptocurrencies ranked by market cap — the total value of all coins in circulation.',
    tip: 'Market cap = price x circulating supply. It tells you how big a project actually is.',
  },
  {
    title: 'Sorting and Filtering',
    description: 'Click any column header to sort. Try sorting by "24h Change" to see today\'s biggest movers, or by "Volume" to see what\'s most actively traded.',
  },
  {
    title: 'What to Watch For',
    description: 'Don\'t just look at price! Compare market cap, volume, and circulating supply. A $0.01 coin with 100 billion supply isn\'t "cheap" — it has the same value as a $100 coin with 1 million supply.',
    tip: 'Use the Screener tool for advanced filtering by multiple criteria.',
  },
];

export const TOUR_SCREENER: TourStep[] = [
  {
    title: 'Token Screener',
    description: 'Filter coins by market cap, price change, volume, and more. Think of it like a search engine for crypto — set your criteria and find matches.',
  },
  {
    title: 'Filter by Market Cap',
    description: 'Start by filtering market cap range. Large cap ($10B+) = lower risk, lower reward. Mid cap ($1-10B) = moderate. Small cap (<$1B) = highest risk.',
    tip: 'Never filter only by price — a $0.001 coin can still have a massive market cap.',
  },
  {
    title: 'Compare Results',
    description: 'Found interesting coins? Use the Compare tool to see them side by side with price history, risk metrics, and fundamentals.',
  },
];

export const TOUR_SENTIMENT: TourStep[] = [
  {
    title: 'Market Sentiment',
    description: 'The Fear & Greed Index measures how emotional the market is on a scale from 0 (extreme fear) to 100 (extreme greed).',
  },
  {
    title: 'Reading the Index',
    description: 'Extreme Fear doesn\'t automatically mean "buy" — it can persist for months. Extreme Greed doesn\'t mean "sell" — markets can stay greedy longer than expected.',
    tip: 'Use sentiment as ONE input, not a standalone buy/sell trigger.',
  },
  {
    title: 'Historical Context',
    description: 'Scroll down to see historical examples — how the index behaved during past crashes and bull runs. Patterns repeat, but timing is never exact.',
  },
];

export const TOUR_TECHNICAL: TourStep[] = [
  {
    title: 'Technical Analysis',
    description: 'These indicators show momentum and trends based on historical price data. They don\'t predict the future — they help you understand the present.',
  },
  {
    title: 'Key Indicators',
    description: 'RSI (momentum score 0-100) — above 70 means overbought, below 30 means oversold. MACD shows trend direction and strength. Bollinger Bands show volatility.',
    tip: 'No single indicator is reliable alone. Always use multiple together.',
  },
  {
    title: 'Choose a Coin',
    description: 'Use the buttons above to switch between Bitcoin, Ethereum, and other major coins. Compare how indicators differ across assets.',
  },
];

export const TOUR_RISK: TourStep[] = [
  {
    title: 'Risk Analysis',
    description: 'This page helps you understand how risky a cryptocurrency is BEFORE you invest. Every metric here helps you make informed decisions.',
  },
  {
    title: 'Key Metrics Explained',
    description: 'Sharpe Ratio = reward per unit of risk (higher is better). Max Drawdown = worst peak-to-trough loss. Value at Risk = potential loss in bad scenarios.',
    tip: 'A crypto with a 90% max drawdown means it once lost 90% of its value from its peak.',
  },
  {
    title: 'Risk vs. Reward',
    description: 'Higher potential returns always come with higher risk. There are no "guaranteed returns" in crypto. Use these metrics to decide how much of your portfolio to allocate.',
  },
];

export const TOUR_DEFI: TourStep[] = [
  {
    title: 'DeFi Dashboard',
    description: 'DeFi (Decentralized Finance) replaces banks with smart contracts. This page shows protocols, TVL (Total Value Locked), and yield opportunities.',
  },
  {
    title: 'TVL — What It Means',
    description: 'TVL is the total money deposited in a DeFi protocol. Higher TVL generally means more trust and usage, but it doesn\'t guarantee safety.',
    tip: 'If you can\'t explain where the yield comes from in one sentence, you are the yield.',
  },
  {
    title: 'Yield Reality Check',
    description: 'Sustainable stablecoin yields are 2-8%. Anything above 15-20% carries significant risk. The DeFi yield that sounds too good to be true usually is.',
  },
];
