'use client';

import { useState, useEffect } from 'react';
import { FreeNavbar } from '@/components/FreeNavbar';
import { Breadcrumb } from '@/components/Breadcrumb';
import { Image as ImageIcon, TrendingUp, TrendingDown, Users, Search } from 'lucide-react';

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
  const [collections, setCollections] = useState<NFTCollection[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    async function fetchNFTs() {
      try {
        setLoading(true);
        const res = await fetch('/api/crypto/nfts?limit=20');
        const data = await res.json();

        if (data.success && data.data) {
          setCollections(data.data);
        } else {
          setError(data.error || 'Failed to load NFT collections');
        }
      } catch (err) {
        setError('Failed to fetch NFT collections');
        console.error(err);
      } finally {
        setLoading(false);
      }
    }

    fetchNFTs();
  }, []);

  const filteredCollections = collections.filter(
    (nft) =>
      nft.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      nft.symbol.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatPrice = (price: number | undefined) => {
    if (!price) return 'N/A';
    if (price >= 1000) return `$${(price / 1000).toFixed(2)}K`;
    if (price >= 1) return `$${price.toFixed(2)}`;
    return `$${price.toFixed(4)}`;
  };

  const formatMarketCap = (cap: number | undefined) => {
    if (!cap) return 'N/A';
    if (cap >= 1e9) return `$${(cap / 1e9).toFixed(2)}B`;
    if (cap >= 1e6) return `$${(cap / 1e6).toFixed(2)}M`;
    if (cap >= 1e3) return `$${(cap / 1e3).toFixed(2)}K`;
    return `$${cap.toFixed(0)}`;
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <FreeNavbar />
      <Breadcrumb />

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <ImageIcon className="w-8 h-8 text-purple-400" />
            <h1 className="text-3xl font-bold">NFT Collections</h1>
          </div>
          <p className="text-gray-400">
            Explore top NFT collections by market cap and floor price
          </p>
        </div>

        {/* Display Only Notice */}
        <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4 mb-6">
          <div className="flex items-center gap-2 text-blue-400 text-sm">
            <span className="px-2 py-0.5 bg-blue-500/20 rounded text-xs font-medium">Display Only</span>
            <span className="text-gray-400">Data provided by CoinGecko</span>
          </div>
        </div>

        {/* Search */}
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
            <input
              type="text"
              placeholder="Search NFT collections..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full md:w-96 pl-10 pr-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
            />
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-gray-800 rounded-lg p-4">
            <div className="text-gray-400 text-sm mb-1">Collections</div>
            <div className="text-2xl font-bold">{collections.length}</div>
          </div>
          <div className="bg-gray-800 rounded-lg p-4">
            <div className="text-gray-400 text-sm mb-1">Floor Up (24h)</div>
            <div className="text-2xl font-bold text-green-400">
              {collections.filter(c => (c.floor_price_change_24h || 0) > 0).length}
            </div>
          </div>
          <div className="bg-gray-800 rounded-lg p-4">
            <div className="text-gray-400 text-sm mb-1">Floor Down (24h)</div>
            <div className="text-2xl font-bold text-red-400">
              {collections.filter(c => (c.floor_price_change_24h || 0) < 0).length}
            </div>
          </div>
          <div className="bg-gray-800 rounded-lg p-4">
            <div className="text-gray-400 text-sm mb-1">With Volume</div>
            <div className="text-2xl font-bold text-purple-400">
              {collections.filter(c => c.volume_24h_usd).length}
            </div>
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
          </div>
        )}

        {/* Error State */}
        {error && !loading && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-6 text-center">
            <p className="text-red-400">{error}</p>
            <p className="text-gray-400 text-sm mt-2">
              NFT data requires CoinGecko API access
            </p>
          </div>
        )}

        {/* NFT Grid */}
        {!loading && !error && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredCollections.map((nft) => (
              <div
                key={nft.id}
                className="bg-gray-800 rounded-xl overflow-hidden border border-gray-700 hover:border-purple-500/50 transition-colors"
              >
                {/* Image */}
                <div className="h-32 bg-gradient-to-br from-purple-900/50 to-gray-800 flex items-center justify-center">
                  {nft.image ? (
                    <img
                      src={nft.image}
                      alt={nft.name}
                      className="w-20 h-20 rounded-lg object-cover"
                    />
                  ) : (
                    <ImageIcon className="w-16 h-16 text-gray-600" />
                  )}
                </div>

                {/* Content */}
                <div className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <div className="font-medium truncate">{nft.name}</div>
                      <div className="text-gray-400 text-sm">{nft.symbol}</div>
                    </div>
                    {nft.floor_price_change_24h !== undefined && (
                      <div
                        className={`flex items-center gap-1 px-2 py-1 rounded text-sm font-medium ${
                          nft.floor_price_change_24h >= 0
                            ? 'text-green-400 bg-green-500/20'
                            : 'text-red-400 bg-red-500/20'
                        }`}
                      >
                        {nft.floor_price_change_24h >= 0 ? (
                          <TrendingUp className="w-3 h-3" />
                        ) : (
                          <TrendingDown className="w-3 h-3" />
                        )}
                        {Math.abs(nft.floor_price_change_24h).toFixed(2)}%
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <div className="text-gray-500">Floor Price</div>
                      <div className="font-medium">{formatPrice(nft.floor_price_usd)}</div>
                      {nft.floor_price_native && nft.native_currency && (
                        <div className="text-xs text-gray-500">
                          {nft.floor_price_native.toFixed(4)} {nft.native_currency.toUpperCase()}
                        </div>
                      )}
                    </div>
                    <div>
                      <div className="text-gray-500">Market Cap</div>
                      <div className="font-medium">{formatMarketCap(nft.market_cap_usd)}</div>
                    </div>
                    <div>
                      <div className="text-gray-500">Volume (24h)</div>
                      <div className="font-medium">{formatMarketCap(nft.volume_24h_usd)}</div>
                    </div>
                    <div>
                      <div className="text-gray-500">Owners</div>
                      <div className="font-medium flex items-center gap-1">
                        <Users className="w-3 h-3 text-gray-400" />
                        {nft.unique_addresses?.toLocaleString() || 'N/A'}
                      </div>
                    </div>
                  </div>

                  {nft.total_supply && (
                    <div className="mt-3 pt-3 border-t border-gray-700 text-sm">
                      <span className="text-gray-500">Supply: </span>
                      <span className="text-gray-300">{nft.total_supply.toLocaleString()}</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && filteredCollections.length === 0 && (
          <div className="text-center py-12">
            <ImageIcon className="w-12 h-12 text-gray-600 mx-auto mb-4" />
            <p className="text-gray-400">No NFT collections found</p>
          </div>
        )}

        {/* Attribution */}
        <div className="mt-8 text-center text-gray-500 text-sm">
          <p>
            Data provided by{' '}
            <a
              href="https://www.coingecko.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-green-400 hover:underline"
            >
              CoinGecko
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
