'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { FreeNavbar } from '@/components/FreeNavbar';
import { Breadcrumb } from '@/components/Breadcrumb';
import { RefreshCw, Gem, ExternalLink, TrendingUp, TrendingDown } from 'lucide-react';

interface NFTCollection {
  id: string;
  name: string;
  symbol: string;
  image?: string;
  description?: string;
  native_currency?: string;
  floor_price_native?: number;
  floor_price_usd?: number;
  market_cap_usd?: number;
  volume_24h_usd?: number;
  floor_price_change_24h?: number;
  unique_addresses?: number;
  total_supply?: number;
}

export default function NFTPage() {
  const [nfts, setNfts] = useState<NFTCollection[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchNFTs = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/crypto/nfts?limit=20');
      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch NFTs');
      }

      setNfts(result.data);
      setLastUpdated(new Date());
    } catch (err) {
      console.error('Error fetching NFTs:', err);
      setError('Unable to load NFT collections');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNFTs();
    const interval = setInterval(fetchNFTs, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [fetchNFTs]);

  const formatPrice = (price: number | undefined) => {
    if (!price) return '—';
    if (price < 0.01) return `$${price.toFixed(6)}`;
    if (price < 1) return `$${price.toFixed(4)}`;
    return `$${price.toLocaleString('en-US', { maximumFractionDigits: 2 })}`;
  };

  const formatMarketCap = (cap: number | undefined) => {
    if (!cap) return '—';
    if (cap >= 1e9) return `$${(cap / 1e9).toFixed(2)}B`;
    if (cap >= 1e6) return `$${(cap / 1e6).toFixed(2)}M`;
    if (cap >= 1e3) return `$${(cap / 1e3).toFixed(2)}K`;
    return `$${cap.toLocaleString()}`;
  };

  const formatChange = (change: number | undefined) => {
    if (change === undefined || change === null) return null;
    const formatted = Math.abs(change).toFixed(2);
    return change >= 0 ? `+${formatted}%` : `-${formatted}%`;
  };

  return (
    <div className="min-h-screen bg-gray-950">
      <FreeNavbar />
      <Breadcrumb />

      <main className="container mx-auto px-4 py-8">
        {/* Page Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <Gem className="w-8 h-8 text-purple-500" />
              <h1 className="text-3xl font-bold text-white">NFT Collections</h1>
            </div>
            <p className="text-gray-400">
              Top NFT collections by market cap. Floor prices, volume, and market trends.
            </p>
          </div>
          <div className="flex items-center gap-3">
            {lastUpdated && (
              <span className="text-xs text-gray-500">
                Updated {lastUpdated.toLocaleTimeString()}
              </span>
            )}
            <button
              onClick={fetchNFTs}
              disabled={loading}
              className="p-2 text-gray-400 hover:text-white rounded-lg transition"
              title="Refresh"
            >
              <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Loading State */}
        {loading && nfts.length === 0 && (
          <div className="bg-gray-900 rounded-xl border border-gray-800 p-12 text-center">
            <RefreshCw className="w-8 h-8 text-purple-500 animate-spin mx-auto mb-4" />
            <p className="text-gray-400">Loading NFT collections...</p>
          </div>
        )}

        {/* Error State */}
        {error && nfts.length === 0 && (
          <div className="bg-gray-900 rounded-xl border border-gray-800 p-12 text-center">
            <p className="text-gray-400 mb-4">{error}</p>
            <button
              onClick={fetchNFTs}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-500 transition"
            >
              Try Again
            </button>
          </div>
        )}

        {/* NFT Grid */}
        {nfts.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {nfts.map((nft, index) => (
              <div
                key={nft.id}
                className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden hover:border-purple-500/50 transition group"
              >
                <div className="p-4">
                  <div className="flex items-center gap-3 mb-4">
                    <span className="text-gray-500 font-medium">#{index + 1}</span>
                    {nft.image ? (
                      <div className="relative w-12 h-12">
                        <Image
                          src={nft.image}
                          alt={nft.name}
                          fill
                          className="rounded-lg object-cover"
                          unoptimized
                        />
                      </div>
                    ) : (
                      <div className="w-12 h-12 bg-purple-600/20 rounded-lg flex items-center justify-center">
                        <Gem className="w-6 h-6 text-purple-400" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-white truncate group-hover:text-purple-400 transition">
                        {nft.name}
                      </h3>
                      <p className="text-sm text-gray-500">{nft.symbol}</p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">Floor Price</span>
                      <div className="flex items-center gap-2">
                        <span className="text-white font-mono">
                          {formatPrice(nft.floor_price_usd)}
                        </span>
                        {nft.floor_price_change_24h !== undefined && (
                          <span
                            className={`text-xs flex items-center ${
                              nft.floor_price_change_24h >= 0 ? 'text-emerald-400' : 'text-red-400'
                            }`}
                          >
                            {nft.floor_price_change_24h >= 0 ? (
                              <TrendingUp className="w-3 h-3 mr-0.5" />
                            ) : (
                              <TrendingDown className="w-3 h-3 mr-0.5" />
                            )}
                            {formatChange(nft.floor_price_change_24h)}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">Market Cap</span>
                      <span className="text-white font-mono">
                        {formatMarketCap(nft.market_cap_usd)}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">24h Volume</span>
                      <span className="text-white font-mono">
                        {formatMarketCap(nft.volume_24h_usd)}
                      </span>
                    </div>
                    {nft.unique_addresses && (
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-400">Owners</span>
                        <span className="text-white">
                          {nft.unique_addresses.toLocaleString()}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Export Options */}
        <div className="mt-8 bg-gray-900 rounded-xl border border-gray-800 p-6">
          <div className="flex items-center gap-3 mb-4">
            <Gem className="w-6 h-6 text-purple-500" />
            <h2 className="text-xl font-semibold text-white">Export NFT Data</h2>
          </div>
          <p className="text-gray-400 mb-4">
            Download NFT collection data as Excel templates with live CryptoSheets formulas.
          </p>
          <Link
            href="/templates"
            className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-500 transition"
          >
            Get Excel Templates
            <ExternalLink className="w-4 h-4" />
          </Link>
        </div>

        {/* Attribution */}
        <div className="mt-8 text-center text-sm text-gray-500">
          <p>
            Data provided by{' '}
            <a
              href="https://www.coingecko.com/en/api"
              target="_blank"
              rel="noopener noreferrer"
              className="text-purple-400 hover:underline"
            >
              CoinGecko
            </a>
            . Updated every 5 minutes.
          </p>
        </div>
      </main>
    </div>
  );
}
