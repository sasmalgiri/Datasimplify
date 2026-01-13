'use client';

import { useState, useRef, useEffect, useMemo } from 'react';
import { X, Search, ChevronDown, Check } from 'lucide-react';
import {
  CRYPTOSHEET_COINS,
  CATEGORY_NAMES,
  getTopCoins,
  type CryptoSheetCoin,
} from '@/lib/templates/cryptoSheetCoins';

interface CoinSelectorProps {
  selected: string[];
  onChange: (coins: string[]) => void;
  maxCoins?: number;
  placeholder?: string;
}

// Quick presets for easy selection
const PRESETS = [
  { name: 'Top 10', coins: () => getTopCoins(10).map((c) => c.symbol) },
  { name: 'Top 20', coins: () => getTopCoins(20).map((c) => c.symbol) },
  { name: 'Layer 1s', coins: () => ['BTC', 'ETH', 'SOL', 'ADA', 'AVAX', 'DOT'] },
  { name: 'DeFi', coins: () => ['UNI', 'AAVE', 'MKR', 'LDO', 'CRV', 'SNX'] },
  { name: 'Meme', coins: () => ['DOGE', 'SHIB', 'PEPE', 'WIF', 'BONK', 'FLOKI'] },
];

export function CoinSelector({
  selected,
  onChange,
  maxCoins = 50,
  placeholder = 'Search coins...',
}: CoinSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<
    CryptoSheetCoin['category'] | 'all'
  >('all');
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Filter coins based on search and category
  const filteredCoins = useMemo(() => {
    let coins = CRYPTOSHEET_COINS;

    // Filter by category
    if (activeCategory !== 'all') {
      coins = coins.filter((coin) => coin.category === activeCategory);
    }

    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      coins = coins.filter(
        (coin) =>
          coin.symbol.toLowerCase().includes(query) ||
          coin.name.toLowerCase().includes(query)
      );
    }

    // Sort by rank
    return coins.sort((a, b) => (a.rank || 999) - (b.rank || 999));
  }, [searchQuery, activeCategory]);

  // Get coin info for selected symbols
  const selectedCoinInfo = useMemo(() => {
    return selected
      .map((symbol) =>
        CRYPTOSHEET_COINS.find(
          (c) => c.symbol.toUpperCase() === symbol.toUpperCase()
        )
      )
      .filter(Boolean) as CryptoSheetCoin[];
  }, [selected]);

  const toggleCoin = (symbol: string) => {
    if (selected.includes(symbol)) {
      onChange(selected.filter((s) => s !== symbol));
    } else if (selected.length < maxCoins) {
      onChange([...selected, symbol]);
    }
  };

  const removeCoin = (symbol: string) => {
    onChange(selected.filter((s) => s !== symbol));
  };

  const clearAll = () => {
    onChange([]);
  };

  const applyPreset = (presetCoins: string[]) => {
    onChange(presetCoins.slice(0, maxCoins));
    setIsOpen(false);
  };

  const categories = Object.entries(CATEGORY_NAMES) as [
    CryptoSheetCoin['category'],
    string
  ][];

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Selected Coins Display */}
      <div
        onClick={() => {
          setIsOpen(true);
          setTimeout(() => inputRef.current?.focus(), 0);
        }}
        className="min-h-[48px] bg-gray-700/50 border border-gray-600 rounded-lg p-2 cursor-text flex flex-wrap gap-1.5 items-center"
      >
        {selectedCoinInfo.length === 0 ? (
          <span className="text-gray-400 text-sm px-1">{placeholder}</span>
        ) : (
          selectedCoinInfo.map((coin) => (
            <span
              key={coin.symbol}
              className="inline-flex items-center gap-1 px-2 py-1 bg-emerald-500/20 text-emerald-400 rounded text-sm"
            >
              {coin.symbol}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  removeCoin(coin.symbol);
                }}
                className="hover:text-emerald-300"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          ))
        )}

        {selectedCoinInfo.length > 0 && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              clearAll();
            }}
            className="ml-auto text-gray-400 hover:text-gray-300 text-xs px-2"
          >
            Clear all
          </button>
        )}
      </div>

      {/* Count indicator */}
      <div className="absolute right-2 -top-6 text-xs text-gray-400">
        {selected.length}/{maxCoins} coins
      </div>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-gray-800 border border-gray-700 rounded-lg shadow-xl overflow-hidden">
          {/* Search Input */}
          <div className="p-2 border-b border-gray-700">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                ref={inputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by name or symbol..."
                className="w-full pl-9 pr-4 py-2 bg-gray-700/50 border border-gray-600 rounded-lg text-white text-sm focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          {/* Quick Presets */}
          <div className="p-2 border-b border-gray-700 flex flex-wrap gap-1">
            <span className="text-xs text-gray-400 w-full mb-1">
              Quick select:
            </span>
            {PRESETS.map((preset) => (
              <button
                key={preset.name}
                onClick={() => applyPreset(preset.coins())}
                className="px-2 py-1 bg-gray-700/50 hover:bg-gray-600 text-gray-300 text-xs rounded transition"
              >
                {preset.name}
              </button>
            ))}
          </div>

          {/* Category Filter */}
          <div className="p-2 border-b border-gray-700 flex flex-wrap gap-1">
            <button
              onClick={() => setActiveCategory('all')}
              className={`px-2 py-1 text-xs rounded transition ${
                activeCategory === 'all'
                  ? 'bg-emerald-500/20 text-emerald-400'
                  : 'bg-gray-700/50 text-gray-300 hover:bg-gray-600'
              }`}
            >
              All
            </button>
            {categories.map(([key, name]) => (
              <button
                key={key}
                onClick={() => setActiveCategory(key)}
                className={`px-2 py-1 text-xs rounded transition ${
                  activeCategory === key
                    ? 'bg-emerald-500/20 text-emerald-400'
                    : 'bg-gray-700/50 text-gray-300 hover:bg-gray-600'
                }`}
              >
                {name.split(' ')[0]}
              </button>
            ))}
          </div>

          {/* Coin List */}
          <div className="max-h-64 overflow-y-auto">
            {filteredCoins.length === 0 ? (
              <div className="p-4 text-center text-gray-400 text-sm">
                No coins found
              </div>
            ) : (
              <div className="p-1">
                {filteredCoins.map((coin) => {
                  const isSelected = selected.includes(coin.symbol);
                  return (
                    <button
                      key={coin.symbol}
                      onClick={() => toggleCoin(coin.symbol)}
                      disabled={!isSelected && selected.length >= maxCoins}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded transition ${
                        isSelected
                          ? 'bg-emerald-500/20 text-emerald-400'
                          : 'hover:bg-gray-700/50 text-gray-300'
                      } ${
                        !isSelected && selected.length >= maxCoins
                          ? 'opacity-50 cursor-not-allowed'
                          : ''
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{coin.symbol}</span>
                        <span className="text-gray-400 text-sm">
                          {coin.name}
                        </span>
                        {coin.rank && (
                          <span className="text-gray-500 text-xs">
                            #{coin.rank}
                          </span>
                        )}
                      </div>
                      {isSelected && (
                        <Check className="w-4 h-4 text-emerald-400" />
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default CoinSelector;
