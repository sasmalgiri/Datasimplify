'use client';

import { useState, useEffect, useRef } from 'react';
import { Search, Sparkles, X, Loader2 } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { SearchResult } from '@/types/crypto';
import { debounce } from '@/lib/utils';

interface SearchBarProps {
  onSearch?: (query: string) => void;
  onAISearch?: (query: string) => void;
  placeholder?: string;
}

export default function SearchBar({ onSearch, onAISearch, placeholder = 'Search coins...' }: SearchBarProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isAIMode, setIsAIMode] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Search function
  const searchCoins = async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      setResults([]);
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`/api/crypto/search?q=${encodeURIComponent(searchQuery)}`);
      const data = await response.json();
      setResults(data.coins || []);
    } catch (error) {
      console.error('Search error:', error);
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  // Debounced search
  const debouncedSearch = debounce((q: string) => searchCoins(q), 300);

  useEffect(() => {
    if (!isAIMode) {
      debouncedSearch(query);
    }
  }, [query, isAIMode]);

  // Handle click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && query.trim()) {
      if (isAIMode && onAISearch) {
        onAISearch(query);
        setIsOpen(false);
      } else if (onSearch) {
        onSearch(query);
      }
    }
    if (e.key === 'Escape') {
      setIsOpen(false);
    }
  };

  const clearQuery = () => {
    setQuery('');
    setResults([]);
    inputRef.current?.focus();
  };

  return (
    <div className="relative w-full max-w-xl" ref={dropdownRef}>
      {/* Search Input */}
      <div className={`relative flex items-center bg-white rounded-xl border-2 transition-all ${
        isOpen ? 'border-orange-500 shadow-lg' : 'border-gray-200 hover:border-gray-300'
      }`}>
        <div className="flex items-center pl-4">
          {isAIMode ? (
            <Sparkles className="w-5 h-5 text-orange-500" />
          ) : (
            <Search className="w-5 h-5 text-gray-400" />
          )}
        </div>
        
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder={isAIMode ? 'Ask AI: "Show me DeFi tokens up 10% today"' : placeholder}
          className="flex-1 px-3 py-3 bg-transparent outline-none text-gray-900 placeholder-gray-400"
        />

        {query && (
          <button
            onClick={clearQuery}
            className="p-2 hover:bg-gray-100 rounded-lg mr-1"
          >
            <X className="w-4 h-4 text-gray-400" />
          </button>
        )}

        {/* AI Mode Toggle */}
        <button
          onClick={() => setIsAIMode(!isAIMode)}
          className={`mr-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors flex items-center gap-1 ${
            isAIMode
              ? 'bg-orange-500 text-white'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          <Sparkles className="w-4 h-4" />
          AI
        </button>

        {loading && (
          <div className="pr-4">
            <Loader2 className="w-5 h-5 text-gray-400 animate-spin" />
          </div>
        )}
      </div>

      {/* Dropdown Results */}
      {isOpen && !isAIMode && results.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl border border-gray-200 shadow-xl z-50 max-h-96 overflow-y-auto">
          {results.slice(0, 8).map((coin) => (
            <Link
              key={coin.id}
              href={`/coin/${coin.id}`}
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors"
            >
              <Image
                src={coin.thumb}
                alt={coin.name}
                width={24}
                height={24}
                className="rounded-full"
              />
              <div className="flex-1">
                <div className="font-medium text-gray-900">{coin.name}</div>
                <div className="text-xs text-gray-500 uppercase">{coin.symbol}</div>
              </div>
              {coin.market_cap_rank && (
                <div className="text-xs text-gray-400">#{coin.market_cap_rank}</div>
              )}
            </Link>
          ))}
        </div>
      )}

      {/* AI Mode Instructions */}
      {isOpen && isAIMode && !query && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl border border-gray-200 shadow-xl z-50 p-4">
          <h4 className="font-medium text-gray-900 mb-2 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-orange-500" />
            AI Search Examples
          </h4>
          <div className="space-y-2 text-sm text-gray-600">
            <button
              onClick={() => setQuery('Show me coins up 10% today')}
              className="block w-full text-left px-3 py-2 hover:bg-gray-50 rounded-lg"
            >
              "Show me coins up 10% today"
            </button>
            <button
              onClick={() => setQuery('Compare Bitcoin and Ethereum')}
              className="block w-full text-left px-3 py-2 hover:bg-gray-50 rounded-lg"
            >
              "Compare Bitcoin and Ethereum"
            </button>
            <button
              onClick={() => setQuery('Top DeFi tokens by market cap')}
              className="block w-full text-left px-3 py-2 hover:bg-gray-50 rounded-lg"
            >
              "Top DeFi tokens by market cap"
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
