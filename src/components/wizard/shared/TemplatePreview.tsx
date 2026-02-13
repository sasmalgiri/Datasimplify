'use client';

import { useState, useEffect } from 'react';
import { Eye, Loader2, RefreshCw } from 'lucide-react';

interface TemplatePreviewProps {
  selectedCoins: string[];
  selectedMetrics: string[];
  dashboardLayout: 'compact' | 'detailed' | 'charts';
}

interface CoinData {
  id: string;
  symbol: string;
  name: string;
  current_price: number;
  market_cap: number;
  total_volume: number;
  price_change_percentage_24h: number;
  price_change_percentage_7d_in_currency?: number;
  ath: number;
  circulating_supply: number;
}

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

// Format price with appropriate decimals
function formatPrice(value: number): string {
  if (value >= 1000) {
    return `$${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  } else if (value >= 1) {
    return `$${value.toFixed(2)}`;
  } else if (value >= 0.01) {
    return `$${value.toFixed(4)}`;
  } else {
    return `$${value.toFixed(6)}`;
  }
}

// Format large numbers (market cap, volume)
function formatLarge(value: number): string {
  if (value >= 1e12) {
    return `$${(value / 1e12).toFixed(2)}T`;
  } else if (value >= 1e9) {
    return `$${(value / 1e9).toFixed(2)}B`;
  } else if (value >= 1e6) {
    return `$${(value / 1e6).toFixed(2)}M`;
  } else {
    return `$${value.toLocaleString('en-US')}`;
  }
}

// Format supply numbers
function formatSupply(value: number): string {
  if (value >= 1e9) {
    return `${(value / 1e9).toFixed(2)}B`;
  } else if (value >= 1e6) {
    return `${(value / 1e6).toFixed(2)}M`;
  } else {
    return value.toLocaleString('en-US');
  }
}

// Format percentage
function formatPercent(value: number | null | undefined): string {
  if (value === null || value === undefined) return '-';
  const sign = value >= 0 ? '+' : '';
  return `${sign}${value.toFixed(2)}%`;
}

// Get formatted value for a metric
function getMetricValue(coin: CoinData, metric: string): string {
  switch (metric) {
    case 'price':
      return formatPrice(coin.current_price);
    case 'market_cap':
      return formatLarge(coin.market_cap);
    case 'volume_24h':
      return formatLarge(coin.total_volume);
    case 'change_24h':
      return formatPercent(coin.price_change_percentage_24h);
    case 'change_7d':
      return formatPercent(coin.price_change_percentage_7d_in_currency);
    case 'ath':
      return formatPrice(coin.ath);
    case 'circulating_supply':
      return formatSupply(coin.circulating_supply);
    default:
      return '-';
  }
}

export function TemplatePreview({ selectedCoins, selectedMetrics, dashboardLayout }: TemplatePreviewProps) {
  const [coinData, setCoinData] = useState<Map<string, CoinData>>(new Map());
  const [isLoading, setIsLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Fetch real data from API
  useEffect(() => {
    if (selectedCoins.length === 0) return;

    const fetchData = async () => {
      setIsLoading(true);
      setError(null);

      try {
        // Use the public crypto API with ids parameter
        const ids = selectedCoins.join(',');
        const response = await fetch(`/api/crypto?ids=${ids}`);

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          console.error('[TemplatePreview] API error:', response.status, errorData);
          throw new Error(errorData.error || `API error: ${response.status}`);
        }

        const result = await response.json();
        console.log('[TemplatePreview] API response:', result);

        if (result.success && result.data && result.data.length > 0) {
          const dataMap = new Map<string, CoinData>();
          for (const coin of result.data) {
            dataMap.set(coin.id, coin);
            // Also map by symbol for easier lookup
            dataMap.set(coin.symbol?.toLowerCase(), coin);
          }
          setCoinData(dataMap);
          setLastUpdated(new Date());
        } else if (result.data && result.data.length === 0) {
          console.warn('[TemplatePreview] No coins matched the request');
          setError('No matching coins found');
        } else {
          console.warn('[TemplatePreview] Unexpected response format:', result);
          setError('Unexpected response format');
        }
      } catch (err) {
        console.error('[TemplatePreview] Error fetching data:', err);
        setError(err instanceof Error ? err.message : 'Unable to load live data');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [selectedCoins]);

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
          <span className="text-xs font-medium text-gray-300">Live Preview</span>
          {isLoading && <Loader2 className="w-3 h-3 text-emerald-400 animate-spin" />}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500">
            {dashboardLayout === 'charts' ? 'With Charts' : dashboardLayout === 'detailed' ? 'Detailed' : 'Compact'}
          </span>
          {lastUpdated && (
            <span className="text-xs text-emerald-400/70">
              <RefreshCw className="w-3 h-3 inline mr-1" />
              Live
            </span>
          )}
        </div>
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
              const coin = coinData.get(coinId);

              return (
                <tr
                  key={coinId}
                  className={idx % 2 === 0 ? 'bg-gray-800/30' : 'bg-gray-800/50'}
                >
                  <td className="px-2 py-1.5 font-medium text-white border-r border-gray-700">
                    {coin?.symbol?.toUpperCase() || COIN_SYMBOLS[coinId] || coinId.toUpperCase()}
                  </td>
                  {displayMetrics.map((metric) => {
                    if (isLoading && !coin) {
                      return (
                        <td
                          key={metric}
                          className="px-2 py-1.5 text-right border-r border-gray-700 last:border-r-0 text-gray-500"
                        >
                          <div className="h-3 w-12 bg-gray-700 rounded animate-pulse ml-auto" />
                        </td>
                      );
                    }

                    const value = coin ? getMetricValue(coin, metric) : '-';
                    const isChange = metric.includes('change');
                    const isNegative = value.startsWith('-');
                    const colorClass = isChange
                      ? isNegative
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
            <span className="ml-4 text-xs text-gray-500">Price Chart</span>
          </div>
        </div>
      )}

      {/* Preview Note */}
      <div className="px-3 py-2 bg-gray-900/30 border-t border-gray-700">
        <p className="text-xs text-center">
          {error ? (
            <span className="text-amber-400">{error}</span>
          ) : (
            <span className="text-emerald-400/70">
              Live data from CoinGecko • Same data will appear in your downloaded Excel template
            </span>
          )}
        </p>
      </div>
    </div>
  );
}
