'use client';

import { useState } from 'react';
import Link from 'next/link';

// Chart type to Excel template/formula mapping
export const CHART_EXCEL_CONFIG: Record<string, {
  supported: boolean;
  tier: 'free' | 'pro';
  templateId?: string;
  formula: string;
  chartType: string;
  description: string;
  steps: string[];
}> = {
  // HISTORICAL - All supported with free tier
  price_history: {
    supported: true,
    tier: 'free',
    templateId: 'market-overview',
    formula: '=CS.HISTORY("BTC", "price", 30)',
    chartType: 'Line/Area Chart',
    description: 'Historical price data with moving averages',
    steps: [
      'Use =CS.HISTORY("COIN", "price", DAYS) to fetch price data',
      'Add columns for MA7: =AVERAGE(B2:B8) and MA30: =AVERAGE(B2:B31)',
      'Select data and insert Line or Area chart',
      'Add MA lines as secondary series',
    ],
  },
  candlestick: {
    supported: true,
    tier: 'free',
    templateId: 'market-advanced',
    formula: '=CS.HISTORY("BTC", "ohlc", 30)',
    chartType: 'Stock Chart (OHLC)',
    description: 'Open-High-Low-Close candlestick chart',
    steps: [
      'Use =CS.HISTORY("COIN", "ohlc", DAYS) to fetch OHLC data',
      'Arrange columns: Date | Open | High | Low | Close',
      'Select data and insert Stock Chart > Open-High-Low-Close',
      'Format candlesticks: green for up, red for down',
    ],
  },
  volume_analysis: {
    supported: true,
    tier: 'free',
    templateId: 'market-advanced',
    formula: '=CS.HISTORY("BTC", "volume", 30)',
    chartType: 'Combo Chart (Bar + Line)',
    description: 'Volume bars with price overlay',
    steps: [
      'Fetch price: =CS.HISTORY("COIN", "price", DAYS)',
      'Fetch volume: =CS.HISTORY("COIN", "volume", DAYS)',
      'Create combo chart with volume as bars (secondary axis)',
      'Add price as line on primary axis',
    ],
  },

  // VOLATILITY - Calculated from price data
  volatility: {
    supported: true,
    tier: 'free',
    templateId: 'risk-dashboard',
    formula: '=STDEV(B2:B31)/AVERAGE(B2:B31)*100',
    chartType: 'Area Chart',
    description: 'Price volatility percentage over time',
    steps: [
      'Fetch price data: =CS.HISTORY("COIN", "price", 30)',
      'Calculate daily returns: =(B3-B2)/B2*100',
      'Calculate rolling volatility: =STDEV(C2:C8)',
      'Plot volatility as area chart with price overlay',
    ],
  },
  momentum: {
    supported: true,
    tier: 'free',
    templateId: 'market-advanced',
    formula: 'RSI = 100 - (100 / (1 + RS))',
    chartType: 'Combo Chart',
    description: 'RSI and MACD momentum indicators',
    steps: [
      'Fetch price: =CS.HISTORY("COIN", "price", 30)',
      'Calculate gains/losses for each day',
      'RSI: =100-(100/(1+AVERAGE(gains)/AVERAGE(losses)))',
      'MACD: =EMA12 - EMA26, Signal: =EMA9 of MACD',
      'Plot RSI with 30/70 reference lines',
    ],
  },
  fibonacci: {
    supported: true,
    tier: 'free',
    formula: '0%, 23.6%, 38.2%, 50%, 61.8%, 78.6%, 100%',
    chartType: 'Line Chart with Reference Lines',
    description: 'Fibonacci retracement levels',
    steps: [
      'Find period high: =MAX(price_range)',
      'Find period low: =MIN(price_range)',
      'Calculate levels: Low + (High-Low) * Fib%',
      'Add horizontal reference lines at each level',
    ],
  },
  volume_profile: {
    supported: true,
    tier: 'free',
    formula: '=SUMIF(price_range, ">="&level, volume_range)',
    chartType: 'Horizontal Bar Chart',
    description: 'Volume at each price level',
    steps: [
      'Fetch OHLC + volume data',
      'Create price buckets (e.g., $1000 ranges)',
      'Sum volume for each price bucket',
      'Create horizontal bar chart',
    ],
  },

  // COMPARISON - Multiple coin data
  correlation: {
    supported: true,
    tier: 'free',
    templateId: 'correlation-matrix',
    formula: '=CORREL(returns_A, returns_B)',
    chartType: 'Heatmap / Conditional Format',
    description: 'Correlation matrix between assets',
    steps: [
      'Fetch prices for multiple coins',
      'Calculate daily returns for each',
      'Use =CORREL() to compute pairwise correlations',
      'Apply conditional formatting as heatmap',
    ],
  },
  racing_bar: {
    supported: true,
    tier: 'free',
    formula: '=CS.MARKETCAP("TOP10")',
    chartType: 'Bar Chart (Sorted)',
    description: 'Market cap ranking comparison',
    steps: [
      'Fetch market caps: =CS.PRICE("COIN", "market_cap")',
      'Create sorted bar chart',
      'For animation: use multiple sheets for time periods',
    ],
  },
  market_dominance: {
    supported: true,
    tier: 'free',
    formula: '=CS.GLOBAL("market_cap_percentage")',
    chartType: 'Pie/Donut Chart',
    description: 'Market share distribution',
    steps: [
      'Fetch dominance: =CS.GLOBAL("btc_dominance")',
      'Calculate other coins market share',
      'Create pie or donut chart',
    ],
  },
  btc_dominance: {
    supported: true,
    tier: 'free',
    formula: '=CS.GLOBAL("btc_dominance")',
    chartType: 'Pie Chart + Line History',
    description: 'Bitcoin dominance over time',
    steps: [
      'Current: =CS.GLOBAL("btc_dominance")',
      'Historical: requires API calls to global endpoint',
      'Create pie for current, line for history',
    ],
  },

  // DERIVATIVES - Need pro API access
  funding_rate: {
    supported: true,
    tier: 'pro',
    formula: '=CS.FUTURES("BTC", "funding_rate")',
    chartType: 'Bar Chart',
    description: 'Futures funding rate history',
    steps: [
      'Requires CryptoSheets Pro or Binance API',
      'Fetch: =CS.FUTURES("COIN", "funding_rate")',
      'Plot as bar chart with positive/negative colors',
      'Add reference line at 0%',
    ],
  },
  open_interest: {
    supported: true,
    tier: 'pro',
    formula: '=CS.FUTURES("BTC", "open_interest")',
    chartType: 'Combo Chart',
    description: 'Open interest with price overlay',
    steps: [
      'Requires CryptoSheets Pro or exchange API',
      'Fetch OI: =CS.FUTURES("COIN", "open_interest")',
      'Combine with price data',
      'Plot OI as area, price as line',
    ],
  },
  liquidation_heatmap: {
    supported: false,
    tier: 'pro',
    formula: 'N/A - Requires Coinglass/Kingfisher API',
    chartType: 'Heatmap',
    description: 'Not available in Excel (requires real-time data)',
    steps: [
      'This chart requires specialized liquidation data',
      'Consider using Coinglass or similar platform',
      'Not feasible in static Excel format',
    ],
  },

  // ON-CHAIN - Need specialized APIs
  whale_flow: {
    supported: true,
    tier: 'pro',
    formula: '=CS.ONCHAIN("BTC", "exchange_flow")',
    chartType: 'Stacked Bar Chart',
    description: 'Exchange inflow/outflow',
    steps: [
      'Requires on-chain data provider (Glassnode, etc.)',
      'Fetch exchange flows data',
      'Create stacked bar: inflow vs outflow',
      'Calculate net flow',
    ],
  },
  wallet_distribution: {
    supported: false,
    tier: 'pro',
    formula: 'N/A - Requires Glassnode API',
    chartType: 'Treemap',
    description: 'Not easily recreated in Excel',
    steps: [
      'Requires Glassnode or similar on-chain API',
      'Data not available in CryptoSheets free tier',
      'Consider using the web dashboard instead',
    ],
  },
  active_addresses: {
    supported: false,
    tier: 'pro',
    formula: 'N/A - Requires on-chain API',
    chartType: 'Line Chart',
    description: 'Not available in CryptoSheets free tier',
    steps: [
      'Requires Glassnode, Santiment, or similar',
      'Not available in standard CryptoSheets',
    ],
  },

  // SENTIMENT
  fear_greed_history: {
    supported: true,
    tier: 'free',
    formula: '=WEBSERVICE("api.alternative.me/fng/")',
    chartType: 'Area Chart with Zones',
    description: 'Fear & Greed index history',
    steps: [
      'Use Alternative.me API (free)',
      'Import JSON data or use web query',
      'Create area chart with colored zones',
      'Add reference lines at 25 (fear) and 75 (greed)',
    ],
  },
  social_volume: {
    supported: false,
    tier: 'pro',
    formula: 'N/A - Requires LunarCrush/Santiment API',
    chartType: 'Bar Chart',
    description: 'Not available in CryptoSheets free tier',
    steps: [
      'Requires LunarCrush or Santiment API',
      'Paid subscription needed',
      'Consider web dashboard for this metric',
    ],
  },
};

interface ChartExcelModalProps {
  chartType: string;
  chartTitle: string;
  isOpen: boolean;
  onClose: () => void;
}

export function ChartExcelModal({ chartType, chartTitle, isOpen, onClose }: ChartExcelModalProps) {
  const config = CHART_EXCEL_CONFIG[chartType];

  if (!isOpen || !config) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70" onClick={onClose}>
      <div
        className="bg-gray-800 rounded-xl border border-gray-700 max-w-lg w-full max-h-[80vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 bg-gray-800 border-b border-gray-700 p-4 flex items-center justify-between">
          <div>
            <h3 className="font-bold text-white flex items-center gap-2">
              📊 Recreate in Excel
              {config.tier === 'pro' && (
                <span className="text-[10px] px-1.5 py-0.5 bg-purple-500/20 text-purple-400 rounded">PRO</span>
              )}
              {config.tier === 'free' && (
                <span className="text-[10px] px-1.5 py-0.5 bg-green-500/20 text-green-400 rounded">FREE</span>
              )}
            </h3>
            <p className="text-sm text-gray-400">{chartTitle}</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white p-1"
            aria-label="Close modal"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4">
          {/* Supported Status */}
          {!config.supported && (
            <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-3">
              <p className="text-yellow-400 text-sm">
                ⚠️ This chart requires specialized data not available in CryptoSheets free tier.
              </p>
            </div>
          )}

          {/* Chart Type & Formula */}
          <div className="bg-gray-700/50 rounded-lg p-3 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Excel Chart Type:</span>
              <span className="text-white font-medium">{config.chartType}</span>
            </div>
            <div>
              <span className="text-gray-400 text-sm">Key Formula:</span>
              <code className="block mt-1 bg-gray-900 rounded px-2 py-1 text-xs text-emerald-400 font-mono">
                {config.formula}
              </code>
            </div>
          </div>

          {/* Description */}
          <p className="text-gray-300 text-sm">{config.description}</p>

          {/* Steps */}
          <div>
            <h4 className="font-medium text-white mb-2">How to Create:</h4>
            <ol className="space-y-2">
              {config.steps.map((step, i) => (
                <li key={i} className="flex gap-2 text-sm">
                  <span className="flex-shrink-0 w-5 h-5 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center text-xs">
                    {i + 1}
                  </span>
                  <span className="text-gray-300">{step}</span>
                </li>
              ))}
            </ol>
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-2">
            {config.templateId && (
              <Link
                href={`/templates?template=${config.templateId}`}
                className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium rounded-lg text-center transition"
              >
                📥 Get Template
              </Link>
            )}
            <Link
              href="/template-requirements"
              className="flex-1 py-2 bg-gray-600 hover:bg-gray-500 text-white text-sm font-medium rounded-lg text-center transition"
            >
              📋 Setup Guide
            </Link>
          </div>

          {/* CryptoSheets Link */}
          <div className="text-center pt-2 border-t border-gray-700">
            <p className="text-xs text-gray-500">
              Powered by{' '}
              <a
                href="https://cryptosheets.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-400 hover:underline"
              >
                CryptoSheets
              </a>
              {' '}Excel Add-in
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

// Small button component for sidebar
interface ExcelButtonProps {
  chartType: string;
  chartTitle: string;
  onClick: () => void;
}

export function ChartExcelButton({ chartType, chartTitle, onClick }: ExcelButtonProps) {
  const config = CHART_EXCEL_CONFIG[chartType];
  if (!config) return null;

  return (
    <button
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      className={`p-1 rounded transition ${
        config.supported
          ? 'text-emerald-400 hover:bg-emerald-500/20'
          : 'text-gray-500 hover:bg-gray-600/50'
      }`}
      title={`Recreate ${chartTitle} in Excel${config.tier === 'pro' ? ' (Pro)' : ''}`}
    >
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    </button>
  );
}
