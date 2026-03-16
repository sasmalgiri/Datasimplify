'use client';

import { useState } from 'react';
import {
  Image,
  Search,
  Loader2,
  AlertTriangle,
  ExternalLink,
  Grid3x3,
  List,
  DollarSign,
} from 'lucide-react';

interface OwnedNft {
  tokenId: string;
  contractAddress: string;
  name: string;
  collectionName: string;
  imageUrl?: string;
  chain: string;
  standard: 'ERC-721' | 'ERC-1155';
  floorPrice?: number;
  estimatedValue?: number;
}

interface CollectionBreakdown {
  collection: string;
  count: number;
  floorPrice?: number;
  totalValue: number;
}

const SUPPORTED_CHAINS = [
  { id: 'ethereum', name: 'Ethereum', color: '#627EEA' },
  { id: 'polygon', name: 'Polygon', color: '#8247E5' },
  { id: 'arbitrum', name: 'Arbitrum', color: '#28A0F0' },
  { id: 'base', name: 'Base', color: '#0052FF' },
  { id: 'bsc', name: 'BNB Chain', color: '#F0B90B' },
];

export default function NftPortfolioPage() {
  const [address, setAddress] = useState('');
  const [chain, setChain] = useState('ethereum');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [nfts, setNfts] = useState<OwnedNft[]>([]);
  const [collections, setCollections] = useState<CollectionBreakdown[]>([]);
  const [totalValue, setTotalValue] = useState(0);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searched, setSearched] = useState(false);

  const handleSearch = async () => {
    if (!address.trim()) return;
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/v1/nfts/portfolio?address=${encodeURIComponent(address.trim())}&chain=${chain}`);
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || `Failed: ${res.status}`);
      }

      const data = await res.json();
      setNfts(data.nfts || []);
      setCollections(data.collectionBreakdown || []);
      setTotalValue(data.totalEstimatedValue || 0);
      setSearched(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch NFTs');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white">
      <div className="max-w-6xl mx-auto px-6 py-12">
        {/* Header */}
        <div className="flex items-center gap-3 mb-2">
          <Image className="w-7 h-7 text-emerald-400" />
          <h1 className="text-3xl font-bold">NFT Portfolio</h1>
        </div>
        <p className="text-gray-400 mb-8">
          Track your NFT holdings across chains. See floor prices, collection breakdown, and estimated portfolio value.
        </p>

        {/* Chain + Search */}
        <div className="flex flex-wrap gap-3 mb-8">
          <div className="flex bg-gray-800/60 rounded-xl p-1 gap-1">
            {SUPPORTED_CHAINS.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => setChain(c.id)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition ${
                  chain === c.id ? 'bg-emerald-500/15 text-emerald-400' : 'text-gray-400 hover:text-white'
                }`}
              >
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: c.color }} />
                {c.name}
              </button>
            ))}
          </div>

          <div className="flex-1 min-w-[300px] flex gap-2">
            <div className="flex-1 relative">
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                placeholder="Enter wallet address (0x...)"
                className="w-full bg-gray-800/60 border border-gray-700/50 rounded-xl px-4 py-3 pl-10 text-sm focus:outline-none focus:border-emerald-500/50"
              />
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            </div>
            <button
              type="button"
              onClick={handleSearch}
              disabled={loading || !address.trim()}
              className="px-5 py-3 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 rounded-xl font-medium transition"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Scan'}
            </button>
          </div>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 mb-6 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-red-400 mt-0.5 shrink-0" />
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        )}

        {/* Results */}
        {searched && nfts.length > 0 && (
          <>
            {/* Summary */}
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="bg-gray-800/50 border border-gray-700/50 rounded-xl p-4">
                <div className="text-xs text-gray-400">Total NFTs</div>
                <div className="text-2xl font-bold mt-1">{nfts.length}</div>
              </div>
              <div className="bg-gray-800/50 border border-gray-700/50 rounded-xl p-4">
                <div className="text-xs text-gray-400">Collections</div>
                <div className="text-2xl font-bold mt-1">{collections.length}</div>
              </div>
              <div className="bg-gray-800/50 border border-gray-700/50 rounded-xl p-4">
                <div className="flex items-center gap-1 text-xs text-gray-400">
                  <DollarSign className="w-3 h-3" /> Est. Portfolio Value
                </div>
                <div className="text-2xl font-bold mt-1 text-emerald-400">
                  ${totalValue.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                </div>
              </div>
            </div>

            {/* Collection breakdown */}
            {collections.length > 0 && (
              <div className="bg-gray-800/50 border border-gray-700/50 rounded-xl overflow-hidden mb-6">
                <div className="px-4 py-3 border-b border-gray-700/50">
                  <h3 className="text-sm font-medium text-gray-300">Collection Breakdown</h3>
                </div>
                <div className="divide-y divide-gray-700/30">
                  {collections.map((col, i) => (
                    <div key={i} className="px-4 py-3 flex items-center justify-between">
                      <div>
                        <span className="font-medium">{col.collection}</span>
                        <span className="text-xs text-gray-500 ml-2">{col.count} items</span>
                      </div>
                      <div className="text-right">
                        {col.floorPrice !== undefined && (
                          <div className="text-xs text-gray-500">Floor: ${col.floorPrice.toFixed(2)}</div>
                        )}
                        <div className="text-sm font-medium text-emerald-400">
                          ${col.totalValue.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* View toggle */}
            <div className="flex justify-end mb-4">
              <div className="flex bg-gray-800/60 rounded-lg p-0.5">
                <button
                  type="button"
                  onClick={() => setViewMode('grid')}
                  className={`p-2 rounded-md transition ${viewMode === 'grid' ? 'bg-emerald-500/15 text-emerald-400' : 'text-gray-500'}`}
                >
                  <Grid3x3 className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('list')}
                  className={`p-2 rounded-md transition ${viewMode === 'list' ? 'bg-emerald-500/15 text-emerald-400' : 'text-gray-500'}`}
                >
                  <List className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* NFT Grid/List */}
            {viewMode === 'grid' ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {nfts.map((nft, i) => (
                  <div key={i} className="bg-gray-800/50 border border-gray-700/50 rounded-xl overflow-hidden group hover:border-emerald-500/30 transition">
                    <div className="aspect-square bg-gray-900/50 flex items-center justify-center">
                      {nft.imageUrl ? (
                        <img src={nft.imageUrl} alt={nft.name} className="w-full h-full object-cover" />
                      ) : (
                        <Image className="w-12 h-12 text-gray-700" />
                      )}
                    </div>
                    <div className="p-3">
                      <p className="text-xs text-gray-500 truncate">{nft.collectionName}</p>
                      <p className="text-sm font-medium truncate">{nft.name}</p>
                      <div className="flex items-center justify-between mt-2">
                        <span className="text-xs px-1.5 py-0.5 rounded bg-gray-700/50 text-gray-400">
                          {nft.standard}
                        </span>
                        {nft.floorPrice !== undefined && (
                          <span className="text-xs text-emerald-400">${nft.floorPrice.toFixed(2)}</span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-gray-800/50 border border-gray-700/50 rounded-xl overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-700/50 text-gray-400 text-xs">
                      <th className="text-left px-4 py-3">NFT</th>
                      <th className="text-left px-4 py-3">Collection</th>
                      <th className="text-left px-4 py-3">Standard</th>
                      <th className="text-right px-4 py-3">Floor Price</th>
                      <th className="text-right px-4 py-3">Token ID</th>
                    </tr>
                  </thead>
                  <tbody>
                    {nfts.map((nft, i) => (
                      <tr key={i} className="border-t border-gray-700/30 hover:bg-gray-700/20">
                        <td className="px-4 py-3 flex items-center gap-3">
                          <div className="w-8 h-8 rounded bg-gray-700/50 flex items-center justify-center shrink-0">
                            {nft.imageUrl ? (
                              <img src={nft.imageUrl} alt="" className="w-8 h-8 rounded object-cover" />
                            ) : (
                              <Image className="w-4 h-4 text-gray-600" />
                            )}
                          </div>
                          <span className="truncate max-w-[180px]">{nft.name}</span>
                        </td>
                        <td className="px-4 py-3 text-gray-400">{nft.collectionName}</td>
                        <td className="px-4 py-3">
                          <span className="text-xs px-1.5 py-0.5 rounded bg-gray-700/50 text-gray-400">{nft.standard}</span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          {nft.floorPrice !== undefined ? `$${nft.floorPrice.toFixed(2)}` : '-'}
                        </td>
                        <td className="px-4 py-3 text-right text-gray-500 font-mono text-xs">
                          #{nft.tokenId.length > 8 ? nft.tokenId.slice(0, 8) + '...' : nft.tokenId}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}

        {searched && nfts.length === 0 && !error && (
          <div className="bg-gray-800/30 border border-gray-700/30 rounded-xl p-16 text-center">
            <Image className="w-16 h-16 mx-auto mb-4 text-gray-700" />
            <h3 className="text-lg font-medium text-gray-400 mb-2">No NFTs found</h3>
            <p className="text-gray-600 text-sm">This address doesn&apos;t hold any NFTs on {SUPPORTED_CHAINS.find((c) => c.id === chain)?.name}</p>
          </div>
        )}

        {!searched && (
          <div className="bg-gray-800/30 border border-gray-700/30 rounded-xl p-16 text-center">
            <Image className="w-16 h-16 mx-auto mb-4 text-gray-700" />
            <h3 className="text-lg font-medium text-gray-400 mb-2">Discover your NFT portfolio</h3>
            <p className="text-gray-600 text-sm max-w-md mx-auto">
              Paste any wallet address to see owned NFTs with floor prices, collection breakdown, and estimated value.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
