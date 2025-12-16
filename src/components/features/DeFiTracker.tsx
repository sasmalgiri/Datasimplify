'use client';

import { useState, useEffect } from 'react';
import { BeginnerTip, InfoButton } from '../ui/BeginnerHelpers';

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

export function DeFiTracker({ showBeginnerTips = true }: { showBeginnerTips?: boolean }) {
  const [protocols, setProtocols] = useState<Protocol[]>([]);
  const [chains, setChains] = useState<Chain[]>([]);
  const [activeTab, setActiveTab] = useState<'protocols' | 'chains' | 'yields'>('protocols');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [chainFilter, setChainFilter] = useState('all');

  useEffect(() => {
    // Sample data - in production would come from DeFiLlama API
    const sampleProtocols: Protocol[] = [
      { id: 'lido', name: 'Lido', logo: '🔵', category: 'Liquid Staking', chain: 'Ethereum', tvl: 35200000000, tvl_change_24h: 1.2, tvl_change_7d: 3.5, apy: 3.8, description: 'Stake ETH and receive stETH' },
      { id: 'aave', name: 'Aave', logo: '👻', category: 'Lending', chain: 'Multi-chain', tvl: 12800000000, tvl_change_24h: 0.8, tvl_change_7d: 2.1, apy: 4.5, description: 'Lend and borrow crypto' },
      { id: 'makerdao', name: 'MakerDAO', logo: '🏛️', category: 'CDP', chain: 'Ethereum', tvl: 8500000000, tvl_change_24h: -0.5, tvl_change_7d: 1.2, description: 'Mint DAI stablecoin' },
      { id: 'uniswap', name: 'Uniswap', logo: '🦄', category: 'DEX', chain: 'Multi-chain', tvl: 6200000000, tvl_change_24h: 2.1, tvl_change_7d: 5.8, apy: 12, description: 'Swap any tokens' },
      { id: 'eigenlayer', name: 'EigenLayer', logo: '🔷', category: 'Restaking', chain: 'Ethereum', tvl: 15800000000, tvl_change_24h: 3.2, tvl_change_7d: 8.5, description: 'Restake ETH for extra yield' },
      { id: 'rocket-pool', name: 'Rocket Pool', logo: '🚀', category: 'Liquid Staking', chain: 'Ethereum', tvl: 4200000000, tvl_change_24h: 0.5, tvl_change_7d: 1.8, apy: 3.5, description: 'Decentralized ETH staking' },
      { id: 'compound', name: 'Compound', logo: '🏦', category: 'Lending', chain: 'Ethereum', tvl: 2800000000, tvl_change_24h: 0.3, tvl_change_7d: 0.8, apy: 3.2, description: 'Earn interest on deposits' },
      { id: 'curve', name: 'Curve', logo: '🌀', category: 'DEX', chain: 'Multi-chain', tvl: 2100000000, tvl_change_24h: -0.8, tvl_change_7d: -1.2, apy: 8, description: 'Stablecoin swaps' },
      { id: 'gmx', name: 'GMX', logo: '💹', category: 'Derivatives', chain: 'Arbitrum', tvl: 580000000, tvl_change_24h: 1.5, tvl_change_7d: 4.2, apy: 25, description: 'Perpetual trading' },
      { id: 'pendle', name: 'Pendle', logo: '⏰', category: 'Yield', chain: 'Multi-chain', tvl: 4500000000, tvl_change_24h: 5.2, tvl_change_7d: 12.5, apy: 35, description: 'Trade future yield' },
    ];

    const sampleChains: Chain[] = [
      { id: 'ethereum', name: 'Ethereum', tvl: 62500000000, protocols: 850, change_24h: 1.2 },
      { id: 'bsc', name: 'BNB Chain', tvl: 5200000000, protocols: 620, change_24h: 0.8 },
      { id: 'solana', name: 'Solana', tvl: 4800000000, protocols: 180, change_24h: 3.5 },
      { id: 'arbitrum', name: 'Arbitrum', tvl: 3200000000, protocols: 420, change_24h: 2.1 },
      { id: 'polygon', name: 'Polygon', tvl: 1100000000, protocols: 380, change_24h: -0.5 },
      { id: 'avalanche', name: 'Avalanche', tvl: 950000000, protocols: 280, change_24h: 1.8 },
      { id: 'base', name: 'Base', tvl: 2800000000, protocols: 150, change_24h: 8.5 },
      { id: 'optimism', name: 'Optimism', tvl: 850000000, protocols: 180, change_24h: 1.2 },
    ];

    setProtocols(sampleProtocols);
    setChains(sampleChains);
  }, []);

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

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      {/* Header */}
      <div className="mb-4">
        <h2 className="text-xl font-bold flex items-center gap-2">
          🏦 DeFi TVL Tracker
          <InfoButton explanation="TVL (Total Value Locked) shows how much money is deposited in DeFi protocols. Higher TVL generally means more trust and usage." />
        </h2>
        <p className="text-gray-500 text-sm mt-1">
          Track money flowing into decentralized finance
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
      <div className="flex gap-2 mb-4 border-b border-gray-200">
        {[
          { id: 'protocols' as const, label: '📋 Top Protocols' },
          { id: 'chains' as const, label: '⛓️ By Chain' },
          { id: 'yields' as const, label: '💰 Best Yields' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 font-medium transition-colors ${
              activeTab === tab.id
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-500 hover:text-gray-700'
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
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
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
              <thead>
                <tr className="border-b border-gray-200">
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
                    <tr key={protocol.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-2 text-gray-500">{index + 1}</td>
                      <td className="py-3 px-2">
                        <div className="flex items-center gap-2">
                          <span className="text-xl">{protocol.logo}</span>
                          <div>
                            <p className="font-medium">{protocol.name}</p>
                            <p className="text-xs text-gray-500">{protocol.chain}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-2">
                        <span className="px-2 py-1 bg-gray-100 rounded text-xs">
                          {protocol.category}
                        </span>
                      </td>
                      <td className="py-3 px-2 text-right font-medium">
                        {formatTVL(protocol.tvl)}
                      </td>
                      <td className={`py-3 px-2 text-right ${
                        protocol.tvl_change_24h >= 0 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {protocol.tvl_change_24h >= 0 ? '+' : ''}{protocol.tvl_change_24h}%
                      </td>
                      <td className={`py-3 px-2 text-right ${
                        protocol.tvl_change_7d >= 0 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {protocol.tvl_change_7d >= 0 ? '+' : ''}{protocol.tvl_change_7d}%
                      </td>
                      <td className="py-3 px-2 text-right">
                        {protocol.apy ? (
                          <span className="text-green-600 font-medium">{protocol.apy}%</span>
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
            <div key={chain.id} className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
              <span className="text-lg font-bold text-gray-400 w-6">{index + 1}</span>
              <div className="flex-1">
                <p className="font-medium">{chain.name}</p>
                <p className="text-xs text-gray-500">{chain.protocols} protocols</p>
              </div>
              <div className="text-right">
                <p className="font-bold">{formatTVL(chain.tvl)}</p>
                <p className={`text-xs ${chain.change_24h >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {chain.change_24h >= 0 ? '+' : ''}{chain.change_24h}%
                </p>
              </div>
              <div className="w-32">
                <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-purple-500"
                    style={{ width: `${(chain.tvl / chains[0].tvl) * 100}%` }}
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
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
              <p className="text-sm text-yellow-800">
                ⚠️ <strong>Warning:</strong> Higher APY = Higher Risk! 
                Yields above 20% often come with significant risks like smart contract bugs, 
                impermanent loss, or token inflation. Start with lower, safer yields.
              </p>
            </div>
          )}

          <div className="space-y-3">
            {protocols
              .filter(p => p.apy)
              .sort((a, b) => (b.apy || 0) - (a.apy || 0))
              .map((protocol) => (
                <div key={protocol.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:border-green-300">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{protocol.logo}</span>
                    <div>
                      <p className="font-medium">{protocol.name}</p>
                      <p className="text-xs text-gray-500">{protocol.description}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-green-600">{protocol.apy}%</p>
                    <p className="text-xs text-gray-500">APY</p>
                  </div>
                </div>
              ))}
          </div>

          {/* Risk Levels */}
          <div className="mt-6 grid grid-cols-3 gap-4">
            <div className="bg-green-50 p-4 rounded-lg">
              <p className="font-bold text-green-800">🟢 Low Risk</p>
              <p className="text-sm text-green-700">1-5% APY</p>
              <p className="text-xs text-green-600 mt-1">ETH staking, major lending protocols</p>
            </div>
            <div className="bg-yellow-50 p-4 rounded-lg">
              <p className="font-bold text-yellow-800">🟡 Medium Risk</p>
              <p className="text-sm text-yellow-700">5-20% APY</p>
              <p className="text-xs text-yellow-600 mt-1">LP positions, newer protocols</p>
            </div>
            <div className="bg-red-50 p-4 rounded-lg">
              <p className="font-bold text-red-800">🔴 High Risk</p>
              <p className="text-sm text-red-700">20%+ APY</p>
              <p className="text-xs text-red-600 mt-1">New tokens, complex strategies</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default DeFiTracker;
