'use client';

import { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { X, Search, Check, Loader2, Globe } from 'lucide-react';
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

interface LiveSearchCoin {
  id: string;
  symbol: string;
  name: string;
  thumb?: string;
  market_cap_rank?: number;
}

// Cache for live search results to avoid repeated API calls
const searchCache = new Map<string, LiveSearchCoin[]>();

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
  const [liveResults, setLiveResults] = useState<LiveSearchCoin[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const searchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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

  // Live search CoinGecko when query has 2+ chars
  const searchCoinGecko = useCallback(async (query: string) => {
    if (query.length < 2) {
      setLiveResults([]);
      setIsSearching(false);
      return;
    }

    const cacheKey = query.toLowerCase();
    if (searchCache.has(cacheKey)) {
      setLiveResults(searchCache.get(cacheKey)!);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    try {
      const res = await fetch(
        `https://api.coingecko.com/api/v3/search?query=${encodeURIComponent(query)}`,
      );
      if (!res.ok) throw new Error('Search failed');
      const data = await res.json();
      const coins: LiveSearchCoin[] = (data.coins || [])
        .slice(0, 30)
        .map((c: any) => ({
          id: c.id,
          symbol: c.symbol?.toUpperCase() || '',
          name: c.name || '',
          thumb: c.thumb,
          market_cap_rank: c.market_cap_rank || null,
        }));
      searchCache.set(cacheKey, coins);
      setLiveResults(coins);
    } catch {
      setLiveResults([]);
    } finally {
      setIsSearching(false);
    }
  }, []);

  // Debounced search trigger
  useEffect(() => {
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    if (searchQuery.length >= 2) {
      searchTimerRef.current = setTimeout(() => {
        searchCoinGecko(searchQuery);
      }, 350);
    } else {
      setLiveResults([]);
    }
    return () => {
      if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    };
  }, [searchQuery, searchCoinGecko]);

  // Filter static coins based on search and category
  const filteredStaticCoins = useMemo(() => {
    let coins = CRYPTOSHEET_COINS;

    if (activeCategory !== 'all') {
      coins = coins.filter((coin) => coin.category === activeCategory);
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      coins = coins.filter(
        (coin) =>
          coin.symbol.toLowerCase().includes(query) ||
          coin.name.toLowerCase().includes(query)
      );
    }

    return coins.sort((a, b) => (a.rank || 999) - (b.rank || 999));
  }, [searchQuery, activeCategory]);

  // Merge static + live results, deduplicating by symbol
  const allCoins = useMemo(() => {
    const staticSymbols = new Set(filteredStaticCoins.map((c) => c.symbol.toUpperCase()));
    const extraLive = liveResults.filter(
      (c) => !staticSymbols.has(c.symbol.toUpperCase()),
    );
    return { staticCoins: filteredStaticCoins, liveCoins: extraLive };
  }, [filteredStaticCoins, liveResults]);

  // Build a lookup map for selected coins (both static + any custom ones)
  const selectedDisplayInfo = useMemo(() => {
    return selected.map((id) => {
      // Check static list first (by symbol or id)
      const staticMatch = CRYPTOSHEET_COINS.find(
        (c) =>
          c.symbol.toUpperCase() === id.toUpperCase() ||
          c.id.toUpperCase() === id.toUpperCase(),
      );
      if (staticMatch) return { id, symbol: staticMatch.symbol, name: staticMatch.name };

      // Check live search cache
      for (const [, coins] of searchCache) {
        const liveMatch = coins.find(
          (c) =>
            c.id.toLowerCase() === id.toLowerCase() ||
            c.symbol.toUpperCase() === id.toUpperCase(),
        );
        if (liveMatch) return { id, symbol: liveMatch.symbol, name: liveMatch.name };
      }

      // Fallback: display the raw id
      return { id, symbol: id.toUpperCase(), name: '' };
    });
  }, [selected]);

  const isSelected = (identifier: string) => {
    const upper = identifier.toUpperCase();
    return selected.some(
      (s) => s.toUpperCase() === upper || s.toLowerCase() === identifier.toLowerCase(),
    );
  };

  const toggleCoin = (identifier: string) => {
    if (isSelected(identifier)) {
      onChange(
        selected.filter(
          (s) =>
            s.toUpperCase() !== identifier.toUpperCase() &&
            s.toLowerCase() !== identifier.toLowerCase(),
        ),
      );
    } else if (selected.length < maxCoins) {
      onChange([...selected, identifier]);
    }
  };

  const removeCoin = (identifier: string) => {
    onChange(
      selected.filter(
        (s) =>
          s.toUpperCase() !== identifier.toUpperCase() &&
          s.toLowerCase() !== identifier.toLowerCase(),
      ),
    );
  };

  const clearAll = () => onChange([]);

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
        {selectedDisplayInfo.length === 0 ? (
          <span className="text-gray-400 text-sm px-1">{placeholder}</span>
        ) : (
          selectedDisplayInfo.map((coin) => (
            <span
              key={coin.id}
              className="inline-flex items-center gap-1 px-2 py-1 bg-emerald-500/20 text-emerald-400 rounded text-sm"
            >
              {coin.symbol}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  removeCoin(coin.id);
                }}
                className="hover:text-emerald-300"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          ))
        )}

        {selectedDisplayInfo.length > 0 && (
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
                placeholder="Search any coin (15,000+ supported)..."
                className="w-full pl-9 pr-4 py-2 bg-gray-700/50 border border-gray-600 rounded-lg text-white text-sm focus:outline-none focus:border-emerald-500"
              />
              {isSearching && (
                <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-400 animate-spin" />
              )}
            </div>
          </div>

          {/* Quick Presets — only when not searching */}
          {!searchQuery && (
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
          )}

          {/* Category Filter — only when not searching */}
          {!searchQuery && (
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
          )}

          {/* Coin List */}
          <div className="max-h-64 overflow-y-auto">
            {allCoins.staticCoins.length === 0 &&
              allCoins.liveCoins.length === 0 &&
              !isSearching ? (
              <div className="p-4 text-center text-gray-400 text-sm">
                {searchQuery.length >= 2
                  ? 'No coins found — try a different search'
                  : 'No coins found'}
              </div>
            ) : (
              <div className="p-1">
                {/* Static coins */}
                {allCoins.staticCoins.map((coin) => {
                  const sel = isSelected(coin.symbol);
                  return (
                    <button
                      key={coin.symbol}
                      onClick={() => toggleCoin(coin.symbol)}
                      disabled={!sel && selected.length >= maxCoins}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded transition ${
                        sel
                          ? 'bg-emerald-500/20 text-emerald-400'
                          : 'hover:bg-gray-700/50 text-gray-300'
                      } ${
                        !sel && selected.length >= maxCoins
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
                      {sel && (
                        <Check className="w-4 h-4 text-emerald-400" />
                      )}
                    </button>
                  );
                })}

                {/* Live search results (coins not in static list) */}
                {allCoins.liveCoins.length > 0 && (
                  <>
                    <div className="flex items-center gap-1.5 px-3 py-2 mt-1 border-t border-gray-700">
                      <Globe className="w-3 h-3 text-blue-400" />
                      <span className="text-[10px] text-blue-400 uppercase tracking-wider font-medium">
                        CoinGecko Search Results
                      </span>
                    </div>
                    {allCoins.liveCoins.map((coin) => {
                      const sel = isSelected(coin.id) || isSelected(coin.symbol);
                      return (
                        <button
                          key={coin.id}
                          onClick={() => toggleCoin(coin.id)}
                          disabled={!sel && selected.length >= maxCoins}
                          className={`w-full flex items-center justify-between px-3 py-2 rounded transition ${
                            sel
                              ? 'bg-emerald-500/20 text-emerald-400'
                              : 'hover:bg-gray-700/50 text-gray-300'
                          } ${
                            !sel && selected.length >= maxCoins
                              ? 'opacity-50 cursor-not-allowed'
                              : ''
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            {coin.thumb && (
                              <img
                                src={coin.thumb}
                                alt={coin.symbol}
                                className="w-4 h-4 rounded-full"
                              />
                            )}
                            <span className="font-medium">{coin.symbol}</span>
                            <span className="text-gray-400 text-sm">
                              {coin.name}
                            </span>
                            {coin.market_cap_rank && (
                              <span className="text-gray-500 text-xs">
                                #{coin.market_cap_rank}
                              </span>
                            )}
                          </div>
                          {sel && (
                            <Check className="w-4 h-4 text-emerald-400" />
                          )}
                        </button>
                      );
                    })}
                  </>
                )}

                {/* Searching indicator */}
                {isSearching && (
                  <div className="flex items-center justify-center gap-2 py-3 text-gray-400 text-sm">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Searching CoinGecko...
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default CoinSelector;
