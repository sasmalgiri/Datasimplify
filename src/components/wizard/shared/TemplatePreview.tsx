'use client';

import { Eye } from 'lucide-react';

interface TemplatePreviewProps {
  selectedCoins: string[];
  selectedMetrics: string[];
  dashboardLayout: 'compact' | 'detailed' | 'charts';
}

// Sample data for preview (placeholder - will be replaced by real data after add-in install)
const SAMPLE_DATA: Record<string, Record<string, string>> = {
  bitcoin: {
    price: '$97,234.56',
    market_cap: '$1.92T',
    volume_24h: '$28.5B',
    change_24h: '+2.34%',
    change_7d: '+8.12%',
    ath: '$108,135.00',
    circulating_supply: '19.8M',
  },
  ethereum: {
    price: '$2,847.32',
    market_cap: '$342.8B',
    volume_24h: '$12.3B',
    change_24h: '+1.87%',
    change_7d: '+5.43%',
    ath: '$4,891.70',
    circulating_supply: '120.2M',
  },
  binancecoin: {
    price: '$598.45',
    market_cap: '$89.2B',
    volume_24h: '$1.8B',
    change_24h: '+0.92%',
    change_7d: '+3.21%',
    ath: '$793.35',
    circulating_supply: '149.5M',
  },
  solana: {
    price: '$198.76',
    market_cap: '$92.4B',
    volume_24h: '$4.2B',
    change_24h: '+3.45%',
    change_7d: '+12.87%',
    ath: '$294.33',
    circulating_supply: '465.2M',
  },
  ripple: {
    price: '$2.34',
    market_cap: '$134.5B',
    volume_24h: '$8.9B',
    change_24h: '-0.56%',
    change_7d: '+15.32%',
    ath: '$3.84',
    circulating_supply: '57.5B',
  },
  cardano: {
    price: '$0.78',
    market_cap: '$27.8B',
    volume_24h: '$892M',
    change_24h: '+1.23%',
    change_7d: '+4.56%',
    ath: '$3.10',
    circulating_supply: '35.7B',
  },
  dogecoin: {
    price: '$0.32',
    market_cap: '$47.2B',
    volume_24h: '$2.1B',
    change_24h: '+5.67%',
    change_7d: '+18.92%',
    ath: '$0.73',
    circulating_supply: '147.3B',
  },
  polkadot: {
    price: '$6.89',
    market_cap: '$10.2B',
    volume_24h: '$312M',
    change_24h: '+2.11%',
    change_7d: '+7.34%',
    ath: '$55.00',
    circulating_supply: '1.48B',
  },
  'avalanche-2': {
    price: '$34.56',
    market_cap: '$14.1B',
    volume_24h: '$567M',
    change_24h: '+1.78%',
    change_7d: '+9.23%',
    ath: '$144.96',
    circulating_supply: '408.2M',
  },
  chainlink: {
    price: '$18.92',
    market_cap: '$11.8B',
    volume_24h: '$423M',
    change_24h: '+0.89%',
    change_7d: '+6.12%',
    ath: '$52.88',
    circulating_supply: '626.8M',
  },
  tron: {
    price: '$0.24',
    market_cap: '$20.9B',
    volume_24h: '$1.1B',
    change_24h: '+1.45%',
    change_7d: '+3.89%',
    ath: '$0.30',
    circulating_supply: '86.2B',
  },
  uniswap: {
    price: '$12.34',
    market_cap: '$9.3B',
    volume_24h: '$287M',
    change_24h: '+2.56%',
    change_7d: '+8.45%',
    ath: '$44.97',
    circulating_supply: '753.7M',
  },
};

const COIN_SYMBOLS: Record<string, string> = {
  bitcoin: 'BTC',
  ethereum: 'ETH',
  binancecoin: 'BNB',
  solana: 'SOL',
  ripple: 'XRP',
  cardano: 'ADA',
  dogecoin: 'DOGE',
  polkadot: 'DOT',
  'avalanche-2': 'AVAX',
  chainlink: 'LINK',
  tron: 'TRX',
  uniswap: 'UNI',
};

const METRIC_HEADERS: Record<string, string> = {
  price: 'Price',
  market_cap: 'Market Cap',
  volume_24h: '24h Volume',
  change_24h: '24h Change',
  change_7d: '7d Change',
  ath: 'ATH',
  circulating_supply: 'Circulating',
};

export function TemplatePreview({ selectedCoins, selectedMetrics, dashboardLayout }: TemplatePreviewProps) {
  // Show max 5 coins in preview
  const displayCoins = selectedCoins.slice(0, 5);
  const hasMoreCoins = selectedCoins.length > 5;

  // Show max 4 metrics in preview
  const displayMetrics = selectedMetrics.slice(0, 4);
  const hasMoreMetrics = selectedMetrics.length > 4;

  if (selectedCoins.length === 0 || selectedMetrics.length === 0) {
    return (
      <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-6 text-center">
        <Eye className="w-8 h-8 text-gray-500 mx-auto mb-2" />
        <p className="text-gray-400 text-sm">
          Select coins and metrics to see a preview
        </p>
      </div>
    );
  }

  return (
    <div className="bg-gray-800/50 border border-gray-700 rounded-lg overflow-hidden">
      {/* Preview Header */}
      <div className="px-3 py-2 bg-gray-700/50 border-b border-gray-700 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Eye className="w-4 h-4 text-emerald-400" />
          <span className="text-xs font-medium text-gray-300">Preview</span>
        </div>
        <span className="text-xs text-gray-500">
          {dashboardLayout === 'charts' ? 'With Charts' : dashboardLayout === 'detailed' ? 'Detailed' : 'Compact'}
        </span>
      </div>

      {/* Spreadsheet Preview */}
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="bg-emerald-600/20">
              <th className="px-2 py-1.5 text-left font-semibold text-emerald-400 border-r border-gray-700">
                Coin
              </th>
              {displayMetrics.map((metric) => (
                <th
                  key={metric}
                  className="px-2 py-1.5 text-right font-semibold text-emerald-400 border-r border-gray-700 last:border-r-0"
                >
                  {METRIC_HEADERS[metric] || metric}
                </th>
              ))}
              {hasMoreMetrics && (
                <th className="px-2 py-1.5 text-center text-gray-500">
                  +{selectedMetrics.length - 4}
                </th>
              )}
            </tr>
          </thead>
          <tbody>
            {displayCoins.map((coinId, idx) => {
              const coinData = SAMPLE_DATA[coinId] || {};
              const isNegative = (metric: string) => coinData[metric]?.startsWith('-');

              return (
                <tr
                  key={coinId}
                  className={idx % 2 === 0 ? 'bg-gray-800/30' : 'bg-gray-800/50'}
                >
                  <td className="px-2 py-1.5 font-medium text-white border-r border-gray-700">
                    {COIN_SYMBOLS[coinId] || coinId.toUpperCase()}
                  </td>
                  {displayMetrics.map((metric) => {
                    const value = coinData[metric] || '-';
                    const isChange = metric.includes('change');
                    const colorClass = isChange
                      ? isNegative(metric)
                        ? 'text-red-400'
                        : 'text-emerald-400'
                      : 'text-gray-300';

                    return (
                      <td
                        key={metric}
                        className={`px-2 py-1.5 text-right border-r border-gray-700 last:border-r-0 ${colorClass}`}
                      >
                        {value}
                      </td>
                    );
                  })}
                  {hasMoreMetrics && (
                    <td className="px-2 py-1.5 text-center text-gray-600">•••</td>
                  )}
                </tr>
              );
            })}
            {hasMoreCoins && (
              <tr className="bg-gray-800/20">
                <td
                  colSpan={displayMetrics.length + 1 + (hasMoreMetrics ? 1 : 0)}
                  className="px-2 py-1.5 text-center text-gray-500 text-xs"
                >
                  +{selectedCoins.length - 5} more coins
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Chart Preview (if charts layout selected) */}
      {dashboardLayout === 'charts' && (
        <div className="border-t border-gray-700 p-3">
          <div className="bg-gray-900/50 rounded-lg p-3 flex items-center justify-center h-20">
            <div className="flex items-end gap-1 h-12">
              {[40, 55, 35, 70, 50, 65, 45, 75, 60, 80].map((height, i) => (
                <div
                  key={i}
                  className="w-3 bg-emerald-500/60 rounded-t"
                  style={{ height: `${height}%` }}
                />
              ))}
            </div>
            <span className="ml-4 text-xs text-gray-500">Chart Preview</span>
          </div>
        </div>
      )}

      {/* Preview Note */}
      <div className="px-3 py-2 bg-gray-900/30 border-t border-gray-700">
        <p className="text-xs text-gray-500 text-center">
          Sample data shown • Real data loads after add-in installation
        </p>
      </div>
    </div>
  );
}
