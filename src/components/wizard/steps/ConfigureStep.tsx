'use client';

import { useState, useMemo } from 'react';
import { useWizard } from '../WizardContext';
import { WizardNav } from '../shared/WizardNav';
import { DataPreview } from '@/components/DataPreview';
import { Settings, Search, Check, X, LayoutGrid, LayoutList, BarChart3 } from 'lucide-react';

const POPULAR_COINS = [
  { id: 'bitcoin', name: 'Bitcoin', symbol: 'BTC' },
  { id: 'ethereum', name: 'Ethereum', symbol: 'ETH' },
  { id: 'binancecoin', name: 'BNB', symbol: 'BNB' },
  { id: 'solana', name: 'Solana', symbol: 'SOL' },
  { id: 'ripple', name: 'XRP', symbol: 'XRP' },
  { id: 'cardano', name: 'Cardano', symbol: 'ADA' },
  { id: 'dogecoin', name: 'Dogecoin', symbol: 'DOGE' },
  { id: 'polkadot', name: 'Polkadot', symbol: 'DOT' },
  { id: 'avalanche-2', name: 'Avalanche', symbol: 'AVAX' },
  { id: 'chainlink', name: 'Chainlink', symbol: 'LINK' },
  { id: 'tron', name: 'TRON', symbol: 'TRX' },
  { id: 'uniswap', name: 'Uniswap', symbol: 'UNI' },
];

const COIN_PRESETS = [
  { id: 'top5', name: 'Top 5', coins: ['bitcoin', 'ethereum', 'binancecoin', 'solana', 'ripple'] },
  { id: 'top10', name: 'Top 10', coins: ['bitcoin', 'ethereum', 'binancecoin', 'solana', 'ripple', 'cardano', 'dogecoin', 'polkadot', 'avalanche-2', 'chainlink'] },
  { id: 'defi', name: 'DeFi', coins: ['uniswap', 'chainlink', 'aave', 'maker', 'compound-governance-token'] },
  { id: 'layer1', name: 'Layer 1', coins: ['ethereum', 'solana', 'cardano', 'avalanche-2', 'polkadot'] },
];

const METRICS = [
  { id: 'price', name: 'Current Price', description: 'Live price in USD' },
  { id: 'market_cap', name: 'Market Cap', description: 'Total market value' },
  { id: 'volume_24h', name: '24h Volume', description: 'Trading volume' },
  { id: 'change_24h', name: '24h Change', description: 'Price change %' },
  { id: 'change_7d', name: '7d Change', description: 'Weekly change %' },
  { id: 'ath', name: 'All-Time High', description: 'Highest price ever' },
  { id: 'circulating_supply', name: 'Circulating Supply', description: 'Coins in circulation' },
];

const LAYOUTS = [
  { id: 'compact' as const, name: 'Compact', description: 'Data only, minimal styling', icon: LayoutList },
  { id: 'detailed' as const, name: 'Detailed', description: 'Data with descriptions and formatting', icon: LayoutGrid },
  { id: 'charts' as const, name: 'With Charts', description: 'Data plus chart sheets', icon: BarChart3 },
];

// Map coin IDs to symbols for DataPreview
const COIN_ID_TO_SYMBOL: Record<string, string> = {
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
  aave: 'AAVE',
  maker: 'MKR',
  'compound-governance-token': 'COMP',
};

export function ConfigureStep() {
  const { state, dispatch } = useWizard();
  const [searchTerm, setSearchTerm] = useState('');

  // Convert coin IDs to symbols for DataPreview
  const previewCoins = useMemo(() => {
    return state.selectedCoins.map(id => COIN_ID_TO_SYMBOL[id] || id.toUpperCase());
  }, [state.selectedCoins]);

  const toggleCoin = (coinId: string) => {
    const current = state.selectedCoins;
    if (current.includes(coinId)) {
      dispatch({ type: 'SET_COINS', coins: current.filter(c => c !== coinId) });
    } else {
      dispatch({ type: 'SET_COINS', coins: [...current, coinId] });
    }
  };

  const toggleMetric = (metricId: string) => {
    const current = state.selectedMetrics;
    if (current.includes(metricId)) {
      dispatch({ type: 'SET_METRICS', metrics: current.filter(m => m !== metricId) });
    } else {
      dispatch({ type: 'SET_METRICS', metrics: [...current, metricId] });
    }
  };

  const applyPreset = (preset: typeof COIN_PRESETS[0]) => {
    dispatch({ type: 'SET_COINS', coins: preset.coins });
  };

  const filteredCoins = POPULAR_COINS.filter(
    coin =>
      coin.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      coin.symbol.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex flex-col min-h-0">
      <div className="flex-1 px-4 sm:px-6 py-6 overflow-y-auto">
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-purple-500/20 mb-3">
              <Settings className="w-6 h-6 text-purple-400" />
            </div>
            <h2 className="text-xl font-bold text-white mb-1">
              Configure Your Report
            </h2>
            <p className="text-gray-400 text-sm">
              Choose which coins and metrics to include
            </p>
          </div>

          {/* Coins Section */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-medium text-white">
                Coins <span className="text-gray-400 font-normal">({state.selectedCoins.length} selected)</span>
              </h3>
              <div className="flex gap-2">
                {COIN_PRESETS.map(preset => (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => applyPreset(preset)}
                    className="px-2 py-1 text-xs bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-white rounded transition-colors"
                  >
                    {preset.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Search */}
            <div className="relative mb-3">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search coins..."
                className="w-full pl-10 pr-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 text-sm focus:outline-none focus:border-emerald-500"
              />
            </div>

            {/* Coin Grid */}
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 max-h-40 overflow-y-auto p-1">
              {filteredCoins.map(coin => {
                const isSelected = state.selectedCoins.includes(coin.id);
                return (
                  <button
                    key={coin.id}
                    type="button"
                    onClick={() => toggleCoin(coin.id)}
                    className={`
                      flex items-center gap-2 p-2 rounded-lg text-sm transition-all
                      ${isSelected
                        ? 'bg-emerald-500/20 border border-emerald-500/50 text-emerald-400'
                        : 'bg-gray-800 border border-gray-700 text-gray-400 hover:border-gray-600'
                      }
                    `}
                  >
                    {isSelected && <Check className="w-3 h-3 flex-shrink-0" />}
                    <span className="truncate font-medium">{coin.symbol}</span>
                  </button>
                );
              })}
            </div>

            {/* Selected Coins Pills */}
            {state.selectedCoins.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-1">
                {state.selectedCoins.map(coinId => {
                  const coin = POPULAR_COINS.find(c => c.id === coinId);
                  return (
                    <span
                      key={coinId}
                      className="inline-flex items-center gap-1 px-2 py-1 bg-emerald-500/20 text-emerald-400 rounded text-xs"
                    >
                      {coin?.symbol || coinId}
                      <button
                        type="button"
                        onClick={() => toggleCoin(coinId)}
                        className="hover:text-emerald-300"
                        aria-label={`Remove ${coin?.symbol || coinId}`}
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  );
                })}
              </div>
            )}
          </div>

          {/* Metrics Section */}
          <div className="mb-6">
            <h3 className="font-medium text-white mb-3">
              Metrics <span className="text-gray-400 font-normal">({state.selectedMetrics.length} selected)</span>
            </h3>
            <div className="grid grid-cols-2 gap-2">
              {METRICS.map(metric => {
                const isSelected = state.selectedMetrics.includes(metric.id);
                return (
                  <button
                    key={metric.id}
                    type="button"
                    onClick={() => toggleMetric(metric.id)}
                    className={`
                      flex items-start gap-2 p-3 rounded-lg text-left transition-all
                      ${isSelected
                        ? 'bg-emerald-500/20 border border-emerald-500/50'
                        : 'bg-gray-800 border border-gray-700 hover:border-gray-600'
                      }
                    `}
                  >
                    <div className={`w-4 h-4 rounded flex-shrink-0 mt-0.5 flex items-center justify-center ${isSelected ? 'bg-emerald-500' : 'bg-gray-700'}`}>
                      {isSelected && <Check className="w-3 h-3 text-white" />}
                    </div>
                    <div>
                      <p className={`text-sm font-medium ${isSelected ? 'text-emerald-400' : 'text-gray-300'}`}>
                        {metric.name}
                      </p>
                      <p className="text-xs text-gray-500">{metric.description}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Layout Section */}
          <div className="mb-6">
            <h3 className="font-medium text-white mb-3">Dashboard Layout</h3>
            <div className="grid grid-cols-3 gap-3">
              {LAYOUTS.map(layout => {
                const isSelected = state.dashboardLayout === layout.id;
                return (
                  <button
                    key={layout.id}
                    type="button"
                    onClick={() => dispatch({ type: 'SET_LAYOUT', layout: layout.id })}
                    className={`
                      flex flex-col items-center p-4 rounded-lg transition-all text-center
                      ${isSelected
                        ? 'bg-emerald-500/20 border-2 border-emerald-500'
                        : 'bg-gray-800 border-2 border-gray-700 hover:border-gray-600'
                      }
                    `}
                  >
                    <layout.icon className={`w-6 h-6 mb-2 ${isSelected ? 'text-emerald-400' : 'text-gray-400'}`} />
                    <p className={`text-sm font-medium ${isSelected ? 'text-emerald-400' : 'text-gray-300'}`}>
                      {layout.name}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">{layout.description}</p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Live Preview - Full DataPreview with charts */}
          <div>
            <h3 className="font-medium text-white mb-3">
              Preview
              <span className="text-gray-400 font-normal text-sm ml-2">
                (Data view • Charts included)
              </span>
            </h3>
            {previewCoins.length > 0 ? (
              <DataPreview
                selectedCoins={previewCoins}
                timeframe="1d"
                onDataLoad={() => {}}
                defaultViewMode="dashboard"
              />
            ) : (
              <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-6 text-center">
                <p className="text-gray-400 text-sm">
                  Select coins to see a preview
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      <WizardNav />
    </div>
  );
}
