'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { BeginnerTip, InfoButton } from '../ui/BeginnerHelpers';

// Progress bar component using refs to avoid inline style and ARIA expression warnings
function ProgressBar({ percentage, label }: { percentage: number; label: string }) {
  const barRef = useRef<HTMLDivElement>(null);
  const roundedPercentage = Math.round(Math.max(0, Math.min(100, percentage || 0)));

  useEffect(() => {
    if (barRef.current) {
      barRef.current.style.setProperty('--progress-width', `${roundedPercentage}%`);
      // Set ARIA attributes via JS to avoid static analysis warnings
      barRef.current.setAttribute('aria-valuenow', String(roundedPercentage));
      barRef.current.setAttribute('aria-valuemin', '0');
      barRef.current.setAttribute('aria-valuemax', '100');
    }
  }, [roundedPercentage]);

  return (
    <div
      ref={barRef}
      className="h-full bg-purple-500 progress-bar"
      role="progressbar"
      aria-label={label}
      title={`${label}: ${roundedPercentage}%`}
    />
  );
}

interface Protocol {
  id: string;
  name: string;
  logo: string;
  category: string;
  chain: string;
  tvl: number;
  tvl_change_24h: number;
  tvl_change_7d: number;
  apy?: number;
  description: string;
}

interface Chain {
  id: string;
  name: string;
  tvl: number;
  protocols: number;
  change_24h: number;
}

interface YieldPool {
  protocol: string;
  chain: string;
  symbol: string;
  tvl: number;
  apy: number;
}

// Map protocol names to emojis/logos
const PROTOCOL_LOGOS: Record<string, string> = {
  'lido': '🔵', 'aave': '👻', 'makerdao': '🏛️', 'uniswap': '🦄',
  'eigenlayer': '🔷', 'rocket pool': '🚀', 'compound': '🏦', 'curve': '🌀',
  'gmx': '💹', 'pendle': '⏰', 'pancakeswap': '🥞', 'convex': '⚡',
  'instadapp': '📱', 'morpho': '🦋', 'spark': '✨', 'summer.fi': '☀️',
  'default': '🔗'
};

const getCategoryDescription = (category: string): string => {
  const descriptions: Record<string, string> = {
    'Liquid Staking': 'Stake tokens and receive liquid derivatives',
    'Lending': 'Lend and borrow crypto assets',
    'CDP': 'Collateralized Debt Position protocols',
    'DEX': 'Decentralized Exchange',
    'Derivatives': 'Trade perpetuals and options',
    'Yield': 'Yield optimization and farming',
    'Bridge': 'Cross-chain bridge protocol',
    'Restaking': 'Restake assets for additional yield',
  };
  return descriptions[category] || category;
};

export function DeFiTracker({ showBeginnerTips = true }: { showBeginnerTips?: boolean }) {
  const [protocols, setProtocols] = useState<Protocol[]>([]);
  const [chains, setChains] = useState<Chain[]>([]);
  const [yields, setYields] = useState<YieldPool[]>([]);
  const [activeTab, setActiveTab] = useState<'protocols' | 'chains' | 'yields'>('protocols');
  const [categoryFilter, setCategoryFilter] = useState('all');
  // chainFilter kept for future use
  const [chainFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);

  const fetchDeFiData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      // Fetch protocols and chains in parallel
      const [protocolsRes, chainsRes, yieldsRes] = await Promise.all([
        fetch('/api/onchain?type=defi-protocols&limit=50'),
        fetch('/api/onchain?type=defi-tvl'),
        fetch('/api/onchain?type=yields&limit=20')
      ]);

      // Handle protocols
      if (protocolsRes.ok) {
        const protocolsData = await protocolsRes.json();
        if (protocolsData.data && Array.isArray(protocolsData.data)) {
          const formattedProtocols: Protocol[] = protocolsData.data.map((p: {
            name: string;
            chain: string;
            category: string;
            tvl: number;
            tvlChange24h: number;
            tvlChange7d: number;
            symbol: string;
          }) => ({
            id: p.name.toLowerCase().replace(/\s+/g, '-'),
            name: p.name,
            logo: PROTOCOL_LOGOS[p.name.toLowerCase()] || PROTOCOL_LOGOS['default'],
            category: p.category || 'Unknown',
            chain: p.chain || 'Multi-chain',
            tvl: p.tvl || 0,
            tvl_change_24h: p.tvlChange24h || 0,
            tvl_change_7d: p.tvlChange7d || 0,
            description: getCategoryDescription(p.category || 'Unknown')
          }));
          setProtocols(formattedProtocols);
        }
      } else {
        console.error('Failed to fetch protocols:', protocolsRes.status);
      }

      // Handle chains
      if (chainsRes.ok) {
        const chainsData = await chainsRes.json();
        if (chainsData.data?.chains && Array.isArray(chainsData.data.chains)) {
          const formattedChains: Chain[] = chainsData.data.chains.map((c: {
            name: string;
            tvl: number;
            protocols?: number;
          }) => ({
            id: c.name.toLowerCase().replace(/\s+/g, '-'),
            name: c.name,
            tvl: c.tvl || 0,
            protocols: c.protocols ?? 0,
            change_24h: 0 // DefiLlama doesn't provide this in chains endpoint
          }));
          setChains(formattedChains);
        }
      } else {
        console.error('Failed to fetch chains:', chainsRes.status);
      }

      // Handle yields
      if (yieldsRes.ok) {
        const yieldsData = await yieldsRes.json();
        if (yieldsData.data?.pools && Array.isArray(yieldsData.data.pools)) {
          setYields(yieldsData.data.pools);
        }
      } else {
        console.error('Failed to fetch yields:', yieldsRes.status);
      }

      setLastUpdated(new Date().toLocaleTimeString());
    } catch (err) {
      console.error('Error fetching DeFi data:', err);
      setError('Failed to load DeFi data. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDeFiData();
    // Refresh every 5 minutes
    const interval = setInterval(fetchDeFiData, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [fetchDeFiData]);

  const formatTVL = (tvl: number) => {
    if (tvl >= 1e12) return `$${(tvl / 1e12).toFixed(2)}T`;
    if (tvl >= 1e9) return `$${(tvl / 1e9).toFixed(2)}B`;
    if (tvl >= 1e6) return `$${(tvl / 1e6).toFixed(0)}M`;
    return `$${tvl.toFixed(0)}`;
  };

  const totalTVL = protocols.reduce((sum, p) => sum + p.tvl, 0);
  const categories = ['all', ...new Set(protocols.map(p => p.category))];

  const filteredProtocols = protocols.filter(p => {
    if (categoryFilter !== 'all' && p.category !== categoryFilter) return false;
    if (chainFilter !== 'all' && p.chain !== chainFilter) return false;
    return true;
  });

  // Loading skeleton
  if (loading && protocols.length === 0) {
    return (
      <div className="bg-gray-800/60 rounded-xl border border-gray-700/50 p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-600 rounded w-48 mb-4"></div>
          <div className="h-32 bg-gray-600 rounded mb-4"></div>
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-16 bg-gray-600 rounded"></div>
            ))}
          </div>
        </div>
        <p className="text-gray-400 text-sm mt-4 text-center">Loading DeFi data from DefiLlama...</p>
      </div>
    );
  }

  // Error state
  if (error && protocols.length === 0) {
    return (
      <div className="bg-gray-800/60 rounded-xl border border-gray-700/50 p-6">
        <div className="text-center py-8">
          <p className="text-red-400 text-lg mb-4">⚠️ {error}</p>
          <button
            onClick={fetchDeFiData}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-800/60 rounded-xl border border-gray-700/50 p-6">
      {/* Header */}
      <div className="mb-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold flex items-center gap-2">
            🏦 DeFi TVL Tracker
            <InfoButton explanation="TVL (Total Value Locked) shows how much money is deposited in DeFi protocols. Higher TVL generally means more trust and usage." />
          </h2>
          <div className="flex items-center gap-2">
            {lastUpdated && (
              <span className="text-xs text-gray-400">Updated: {lastUpdated}</span>
            )}
            <button
              type="button"
              onClick={fetchDeFiData}
              disabled={loading}
              className="text-xs px-2 py-1 bg-gray-700/50 hover:bg-gray-600 rounded transition-colors disabled:opacity-50"
            >
              {loading ? '⏳' : '🔄'} Refresh
            </button>
          </div>
        </div>
        <p className="text-gray-400 text-sm mt-1">
          Track money flowing into decentralized finance • Data from DefiLlama
        </p>
      </div>

      {/* Beginner Explanation */}
      {showBeginnerTips && (
        <BeginnerTip title="💡 What is DeFi?">
          <strong>DeFi (Decentralized Finance)</strong> = Banking without banks!
          <br/><br/>
          Instead of putting money in a bank, you can:
          <br/>
          • <strong>Lend</strong> your crypto and earn interest (like Aave)
          <br/>
          • <strong>Swap</strong> tokens without an exchange (like Uniswap)
          <br/>
          • <strong>Stake</strong> ETH and earn rewards (like Lido)
          <br/><br/>
          <strong>TVL</strong> = How much money is locked in these protocols. More TVL = more trusted!
        </BeginnerTip>
      )}

      {/* Total TVL Banner */}
      <div className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg p-6 text-white mb-6">
        <p className="text-purple-100 text-sm">Total Value Locked in DeFi</p>
        <p className="text-4xl font-bold">{formatTVL(totalTVL)}</p>
        <p className="text-purple-100 text-sm mt-1">Across {protocols.length}+ protocols</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-4 border-b border-gray-700/50">
        {[
          { id: 'protocols' as const, label: '📋 Top Protocols' },
          { id: 'chains' as const, label: '⛓️ By Chain' },
          { id: 'yields' as const, label: '💰 Best Yields' },
        ].map((tab) => (
          <button
            type="button"
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 font-medium transition-colors ${
              activeTab === tab.id
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-400 hover:text-gray-300'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Protocols Tab */}
      {activeTab === 'protocols' && (
        <div>
          {/* Filters */}
          <div className="flex gap-4 mb-4">
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-3 py-2 border border-gray-700/50 rounded-lg text-sm bg-gray-700/50 text-gray-300"
              title="Filter protocols by category"
              aria-label="Filter protocols by category"
            >
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat === 'all' ? 'All Categories' : cat}
                </option>
              ))}
            </select>
          </div>

          {/* Protocol Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="sticky top-0 z-10 bg-gray-800/60">
                <tr className="border-b border-gray-700/50">
                  <th className="text-left py-3 px-2">#</th>
                  <th className="text-left py-3 px-2">Protocol</th>
                  <th className="text-left py-3 px-2">Category</th>
                  <th className="text-right py-3 px-2">TVL</th>
                  <th className="text-right py-3 px-2">24h</th>
                  <th className="text-right py-3 px-2">7d</th>
                  <th className="text-right py-3 px-2">APY</th>
                </tr>
              </thead>
              <tbody>
                {filteredProtocols
                  .sort((a, b) => b.tvl - a.tvl)
                  .map((protocol, index) => (
                    <tr key={protocol.id} className="border-b border-gray-700/50 hover:bg-gray-700">
                      <td className="py-3 px-2 text-gray-400">{index + 1}</td>
                      <td className="py-3 px-2">
                        <div className="flex items-center gap-2">
                          <span className="text-xl">{protocol.logo}</span>
                          <div>
                            <p className="font-medium">{protocol.name}</p>
                            <p className="text-xs text-gray-400">{protocol.chain}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-2">
                        <span className="px-2 py-1 bg-gray-700/50 rounded text-xs">
                          {protocol.category}
                        </span>
                      </td>
                      <td className="py-3 px-2 text-right font-medium">
                        {formatTVL(protocol.tvl)}
                      </td>
                      <td className={`py-3 px-2 text-right ${
                        protocol.tvl_change_24h >= 0 ? 'text-green-400' : 'text-red-400'
                      }`}>
                        {protocol.tvl_change_24h >= 0 ? '+' : ''}{protocol.tvl_change_24h}%
                      </td>
                      <td className={`py-3 px-2 text-right ${
                        protocol.tvl_change_7d >= 0 ? 'text-green-400' : 'text-red-400'
                      }`}>
                        {protocol.tvl_change_7d >= 0 ? '+' : ''}{protocol.tvl_change_7d}%
                      </td>
                      <td className="py-3 px-2 text-right">
                        {protocol.apy ? (
                          <span className="text-green-400 font-medium">{protocol.apy}%</span>
                        ) : '-'}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Chains Tab */}
      {activeTab === 'chains' && (
        <div className="space-y-3">
          {chains.sort((a, b) => b.tvl - a.tvl).map((chain, index) => (
            <div key={chain.id} className="flex items-center gap-4 p-4 bg-gray-700/50 rounded-lg">
              <span className="text-lg font-bold text-gray-400 w-6">{index + 1}</span>
              <div className="flex-1">
                <p className="font-medium">{chain.name}</p>
                <p className="text-xs text-gray-400">{chain.protocols} protocols</p>
              </div>
              <div className="text-right">
                <p className="font-bold">{formatTVL(chain.tvl)}</p>
                {chain.change_24h === 0 ? (
                  <p className="text-xs text-gray-400">--</p>
                ) : (
                  <p className={`text-xs ${chain.change_24h >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {chain.change_24h >= 0 ? '+' : ''}{chain.change_24h}%
                  </p>
                )}
              </div>
              <div className="w-32">
                <div className="h-2 bg-gray-600 rounded-full overflow-hidden">
                  <ProgressBar
                    percentage={(chain.tvl / chains[0].tvl) * 100}
                    label={`${chain.name} TVL percentage`}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Yields Tab */}
      {activeTab === 'yields' && (
        <div>
          {showBeginnerTips && (
            <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4 mb-4">
              <p className="text-sm text-yellow-400">
                ⚠️ <strong>Warning:</strong> Higher APY = Higher Risk!
                Yields above 20% often come with significant risks like smart contract bugs,
                impermanent loss, or token inflation. Start with lower, safer yields.
              </p>
            </div>
          )}

          <div className="space-y-3">
            {yields.length > 0 ? (
              yields.map((pool, index) => (
                <div key={`${pool.protocol}-${pool.symbol}-${index}`} className="flex items-center justify-between p-4 border border-gray-700/50 rounded-lg hover:border-green-500/50">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{PROTOCOL_LOGOS[pool.protocol.toLowerCase()] || '💰'}</span>
                    <div>
                      <p className="font-medium">{pool.protocol}</p>
                      <p className="text-xs text-gray-400">{pool.symbol} on {pool.chain}</p>
                      <p className="text-xs text-gray-500">TVL: {formatTVL(pool.tvl)}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`text-2xl font-bold ${
                      pool.apy > 20 ? 'text-red-400' :
                      pool.apy > 10 ? 'text-yellow-400' : 'text-green-400'
                    }`}>{pool.apy.toFixed(2)}%</p>
                    <p className="text-xs text-gray-400">APY</p>
                    {pool.apy > 20 && <p className="text-xs text-red-400">⚠️ High Risk</p>}
                  </div>
                </div>
              ))
            ) : (
              <p className="text-center text-gray-400 py-8">Loading yield pools...</p>
            )}
          </div>

          {/* Risk Levels */}
          <div className="mt-6 grid grid-cols-3 gap-4">
            <div className="bg-green-500/10 p-4 rounded-lg">
              <p className="font-bold text-green-400">🟢 Low Risk</p>
              <p className="text-sm text-green-400">1-5% APY</p>
              <p className="text-xs text-green-400 mt-1">ETH staking, major lending protocols</p>
            </div>
            <div className="bg-yellow-500/10 p-4 rounded-lg">
              <p className="font-bold text-yellow-400">🟡 Medium Risk</p>
              <p className="text-sm text-yellow-400">5-20% APY</p>
              <p className="text-xs text-yellow-400 mt-1">LP positions, newer protocols</p>
            </div>
            <div className="bg-red-500/10 p-4 rounded-lg">
              <p className="font-bold text-red-400">🔴 High Risk</p>
              <p className="text-sm text-red-400">20%+ APY</p>
              <p className="text-xs text-red-400 mt-1">New tokens, complex strategies</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default DeFiTracker;
