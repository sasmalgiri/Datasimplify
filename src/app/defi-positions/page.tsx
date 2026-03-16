'use client';

import { useState } from 'react';
import {
  Landmark,
  Search,
  Loader2,
  AlertTriangle,
  Layers,
  TrendingUp,
  Shield,
  Droplets,
  Coins,
  Lock,
} from 'lucide-react';

interface DefiPosition {
  protocol: string;
  chain: string;
  type: 'liquidity' | 'staking' | 'lending' | 'farming' | 'vesting' | 'deposit';
  tokens: { symbol: string; amount: number; usdValue: number }[];
  totalUsdValue: number;
  apy?: number;
  healthFactor?: number;
}

const TYPE_CONFIG: Record<string, { icon: React.ElementType; color: string; label: string }> = {
  liquidity: { icon: Droplets, color: 'text-blue-400', label: 'Liquidity' },
  staking: { icon: Lock, color: 'text-purple-400', label: 'Staking' },
  lending: { icon: Coins, color: 'text-amber-400', label: 'Lending' },
  farming: { icon: TrendingUp, color: 'text-green-400', label: 'Farming' },
  vesting: { icon: Shield, color: 'text-cyan-400', label: 'Vesting' },
  deposit: { icon: Layers, color: 'text-emerald-400', label: 'Deposit' },
};

const CHAINS = ['ethereum', 'arbitrum', 'optimism', 'polygon', 'base'];

export default function DefiPositionsPage() {
  const [address, setAddress] = useState('');
  const [selectedChains, setSelectedChains] = useState(['ethereum']);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [positions, setPositions] = useState<DefiPosition[]>([]);
  const [totalValue, setTotalValue] = useState(0);
  const [searched, setSearched] = useState(false);

  const toggleChain = (chain: string) => {
    setSelectedChains((prev) =>
      prev.includes(chain) ? prev.filter((c) => c !== chain) : [...prev, chain],
    );
  };

  const handleSearch = async () => {
    if (!address.trim()) return;
    setLoading(true);
    setError(null);

    try {
      const chains = selectedChains.join(',');
      const res = await fetch(`/api/v1/defi/positions?address=${encodeURIComponent(address.trim())}&chains=${chains}`);
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || `Failed: ${res.status}`);
      }

      const data = await res.json();
      setPositions(data.positions || []);
      setTotalValue(data.totalValue || 0);
      setSearched(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch positions');
    } finally {
      setLoading(false);
    }
  };

  // Group by protocol
  const byProtocol = positions.reduce(
    (acc, pos) => {
      const key = pos.protocol;
      if (!acc[key]) acc[key] = [];
      acc[key].push(pos);
      return acc;
    },
    {} as Record<string, DefiPosition[]>,
  );

  // Group by type for summary
  const byType = positions.reduce(
    (acc, pos) => {
      acc[pos.type] = (acc[pos.type] || 0) + pos.totalUsdValue;
      return acc;
    },
    {} as Record<string, number>,
  );

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white">
      <div className="max-w-5xl mx-auto px-6 py-12">
        {/* Header */}
        <div className="flex items-center gap-3 mb-2">
          <Landmark className="w-7 h-7 text-emerald-400" />
          <h1 className="text-3xl font-bold">DeFi Positions</h1>
        </div>
        <p className="text-gray-400 mb-8">
          Track your DeFi positions across protocols. See LP positions, staking, lending, and yield farming in one view.
        </p>

        {/* Chain chips */}
        <div className="flex flex-wrap gap-2 mb-4">
          {CHAINS.map((chain) => (
            <button
              key={chain}
              type="button"
              onClick={() => toggleChain(chain)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition border ${
                selectedChains.includes(chain)
                  ? 'border-emerald-500/50 bg-emerald-500/10 text-emerald-400'
                  : 'border-gray-700/50 bg-gray-800/40 text-gray-400 hover:text-white'
              }`}
            >
              {chain}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="flex gap-3 mb-8">
          <div className="flex-1 relative">
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              placeholder="Enter EVM wallet address (0x...)"
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

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 mb-6 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-red-400 mt-0.5 shrink-0" />
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        )}

        {searched && positions.length > 0 && (
          <>
            {/* Summary */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <div className="bg-gray-800/50 border border-gray-700/50 rounded-xl p-4">
                <div className="text-xs text-gray-400">Total Positions</div>
                <div className="text-2xl font-bold mt-1">{positions.length}</div>
              </div>
              <div className="bg-gray-800/50 border border-gray-700/50 rounded-xl p-4">
                <div className="text-xs text-gray-400">Protocols</div>
                <div className="text-2xl font-bold mt-1">{Object.keys(byProtocol).length}</div>
              </div>
              <div className="bg-gray-800/50 border border-gray-700/50 rounded-xl p-4">
                <div className="text-xs text-gray-400">Total Value</div>
                <div className="text-2xl font-bold mt-1 text-emerald-400">
                  ${totalValue.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                </div>
              </div>
              <div className="bg-gray-800/50 border border-gray-700/50 rounded-xl p-4">
                <div className="text-xs text-gray-400">Position Types</div>
                <div className="flex flex-wrap gap-1 mt-1">
                  {Object.keys(byType).map((type) => {
                    const config = TYPE_CONFIG[type] || TYPE_CONFIG.deposit;
                    return (
                      <span key={type} className={`text-xs px-1.5 py-0.5 rounded bg-gray-700/40 ${config.color}`}>
                        {config.label}
                      </span>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Positions by Protocol */}
            <div className="space-y-4">
              {Object.entries(byProtocol).map(([protocol, protocolPositions]) => (
                <div key={protocol} className="bg-gray-800/50 border border-gray-700/50 rounded-xl overflow-hidden">
                  <div className="px-5 py-4 border-b border-gray-700/50 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                        <Landmark className="w-4 h-4 text-emerald-400" />
                      </div>
                      <div>
                        <h3 className="font-semibold">{protocol}</h3>
                        <p className="text-xs text-gray-500">{protocolPositions.length} position{protocolPositions.length !== 1 ? 's' : ''}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-medium text-emerald-400">
                        ${protocolPositions.reduce((s, p) => s + p.totalUsdValue, 0).toLocaleString(undefined, { maximumFractionDigits: 2 })}
                      </div>
                    </div>
                  </div>

                  <div className="divide-y divide-gray-700/30">
                    {protocolPositions.map((pos, i) => {
                      const config = TYPE_CONFIG[pos.type] || TYPE_CONFIG.deposit;
                      const TypeIcon = config.icon;
                      return (
                        <div key={i} className="px-5 py-3 flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <TypeIcon className={`w-4 h-4 ${config.color}`} />
                            <div>
                              <div className="flex items-center gap-2">
                                <span className={`text-xs px-1.5 py-0.5 rounded bg-gray-700/40 ${config.color}`}>
                                  {config.label}
                                </span>
                                <span className="text-xs text-gray-500 capitalize">{pos.chain}</span>
                              </div>
                              <div className="flex gap-3 mt-1">
                                {pos.tokens.map((tok, j) => (
                                  <span key={j} className="text-sm">
                                    {tok.amount >= 0 ? '' : '-'}{Math.abs(tok.amount).toFixed(4)} <span className="text-gray-500">{tok.symbol}</span>
                                  </span>
                                ))}
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            {pos.apy !== undefined && (
                              <div className="text-xs text-green-400">{pos.apy.toFixed(2)}% APY</div>
                            )}
                            {pos.healthFactor !== undefined && (
                              <div className={`text-xs ${pos.healthFactor > 1.5 ? 'text-green-400' : 'text-red-400'}`}>
                                HF: {pos.healthFactor.toFixed(2)}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {searched && positions.length === 0 && !error && (
          <div className="bg-gray-800/30 border border-gray-700/30 rounded-xl p-16 text-center">
            <Landmark className="w-16 h-16 mx-auto mb-4 text-gray-700" />
            <h3 className="text-lg font-medium text-gray-400 mb-2">No DeFi positions found</h3>
            <p className="text-gray-600 text-sm">This address has no active positions on the selected chains</p>
          </div>
        )}

        {!searched && (
          <div className="bg-gray-800/30 border border-gray-700/30 rounded-xl p-16 text-center">
            <Layers className="w-16 h-16 mx-auto mb-4 text-gray-700" />
            <h3 className="text-lg font-medium text-gray-400 mb-2">Track your DeFi positions</h3>
            <p className="text-gray-600 text-sm max-w-md mx-auto">
              See LP positions on Uniswap V3, staking on Lido, lending on Aave, and more.
              Supports Ethereum, Arbitrum, Optimism, Polygon, and Base.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
