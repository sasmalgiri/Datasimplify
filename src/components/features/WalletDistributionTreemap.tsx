'use client';

import { useState } from 'react';
import { Info } from 'lucide-react';

/**
 * Wallet Distribution Categories - Ocean Animals Theme
 *
 * Educational visualization showing typical Bitcoin holder distribution.
 * Based on publicly available on-chain analysis patterns.
 *
 * Note: Percentages are illustrative/educational, not real-time data.
 */

interface WalletCategory {
  name: string;
  emoji: string;
  range: string;
  btcRange: [number, number | null];
  addressPercent: number;  // % of all addresses
  btcHeldPercent: number;  // % of total BTC supply
  color: string;
  description: string;
}

const WALLET_CATEGORIES: WalletCategory[] = [
  {
    name: 'Shrimp',
    emoji: '🦐',
    range: '< 0.001 BTC',
    btcRange: [0, 0.001],
    addressPercent: 32.5,
    btcHeldPercent: 0.02,
    color: 'bg-pink-500/80',
    description: 'New or dust wallets',
  },
  {
    name: 'Crab',
    emoji: '🦀',
    range: '0.001 - 0.01 BTC',
    btcRange: [0.001, 0.01],
    addressPercent: 25.2,
    btcHeldPercent: 0.15,
    color: 'bg-orange-500/80',
    description: 'Small retail holders',
  },
  {
    name: 'Fish',
    emoji: '🐟',
    range: '0.01 - 0.1 BTC',
    btcRange: [0.01, 0.1],
    addressPercent: 22.8,
    btcHeldPercent: 0.85,
    color: 'bg-cyan-500/80',
    description: 'Average retail investors',
  },
  {
    name: 'Octopus',
    emoji: '🐙',
    range: '0.1 - 1 BTC',
    btcRange: [0.1, 1],
    addressPercent: 12.4,
    btcHeldPercent: 3.2,
    color: 'bg-purple-500/80',
    description: 'Serious retail holders',
  },
  {
    name: 'Dolphin',
    emoji: '🐬',
    range: '1 - 10 BTC',
    btcRange: [1, 10],
    addressPercent: 4.8,
    btcHeldPercent: 8.5,
    color: 'bg-blue-500/80',
    description: 'High-net-worth individuals',
  },
  {
    name: 'Shark',
    emoji: '🦈',
    range: '10 - 100 BTC',
    btcRange: [10, 100],
    addressPercent: 1.7,
    btcHeldPercent: 12.8,
    color: 'bg-slate-500/80',
    description: 'Large investors & funds',
  },
  {
    name: 'Whale',
    emoji: '🐋',
    range: '100 - 1,000 BTC',
    btcRange: [100, 1000],
    addressPercent: 0.35,
    btcHeldPercent: 18.5,
    color: 'bg-indigo-500/80',
    description: 'Institutional investors',
  },
  {
    name: 'Humpback',
    emoji: '🐳',
    range: '1,000+ BTC',
    btcRange: [1000, null],
    addressPercent: 0.05,
    btcHeldPercent: 56.0,
    color: 'bg-emerald-500/80',
    description: 'Exchanges, funds, early adopters',
  },
];

function CategoryCard({ category, isHovered, onHover }: {
  category: WalletCategory;
  isHovered: boolean;
  onHover: (name: string | null) => void;
}) {
  const size = Math.max(80, Math.sqrt(category.btcHeldPercent) * 45);

  return (
    <div
      className={`relative rounded-xl p-4 transition-all duration-300 cursor-pointer ${category.color} ${
        isHovered ? 'scale-105 ring-2 ring-white/50 z-10' : 'hover:scale-102'
      }`}
      style={{
        minWidth: `${size}px`,
        minHeight: `${size}px`,
        flex: `${category.btcHeldPercent} 1 0%`,
      }}
      onMouseEnter={() => onHover(category.name)}
      onMouseLeave={() => onHover(null)}
    >
      <div className="flex flex-col h-full justify-between">
        <div>
          <span className="text-3xl">{category.emoji}</span>
          <h3 className="font-bold text-white mt-1">{category.name}</h3>
        </div>
        <div className="text-xs text-white/90 mt-2">
          <div className="font-semibold">{category.btcHeldPercent}% BTC</div>
          <div className="text-white/70">{category.range}</div>
        </div>
      </div>

      {isHovered && (
        <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 translate-y-full bg-gray-900 border border-gray-600 rounded-lg p-3 shadow-xl z-20 w-48">
          <div className="text-sm text-white font-medium">{category.name}</div>
          <div className="text-xs text-gray-400 mt-1">{category.description}</div>
          <div className="grid grid-cols-2 gap-2 mt-2 text-xs">
            <div>
              <span className="text-gray-500">Addresses:</span>
              <span className="text-white ml-1">{category.addressPercent}%</span>
            </div>
            <div>
              <span className="text-gray-500">BTC Held:</span>
              <span className="text-emerald-400 ml-1">{category.btcHeldPercent}%</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function DistributionBar({ categories }: { categories: WalletCategory[] }) {
  const [hoveredCategory, setHoveredCategory] = useState<string | null>(null);

  return (
    <div className="space-y-4">
      {/* BTC Holdings Distribution */}
      <div>
        <div className="flex justify-between text-xs text-gray-400 mb-2">
          <span>BTC Holdings Distribution</span>
          <span>100%</span>
        </div>
        <div className="flex h-8 rounded-lg overflow-hidden gap-0.5">
          {categories.map((cat) => (
            <div
              key={cat.name}
              className={`${cat.color} relative group transition-all duration-300 ${
                hoveredCategory === cat.name ? 'scale-y-110' : ''
              }`}
              style={{ width: `${cat.btcHeldPercent}%` }}
              onMouseEnter={() => setHoveredCategory(cat.name)}
              onMouseLeave={() => setHoveredCategory(null)}
            >
              {cat.btcHeldPercent > 8 && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-lg">{cat.emoji}</span>
                </div>
              )}
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 transition-opacity bg-gray-800 text-white text-xs px-2 py-1 rounded whitespace-nowrap z-10">
                {cat.name}: {cat.btcHeldPercent}%
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Address Count Distribution */}
      <div>
        <div className="flex justify-between text-xs text-gray-400 mb-2">
          <span>Address Count Distribution</span>
          <span>100%</span>
        </div>
        <div className="flex h-8 rounded-lg overflow-hidden gap-0.5">
          {categories.map((cat) => (
            <div
              key={cat.name}
              className={`${cat.color} relative group transition-all duration-300 ${
                hoveredCategory === cat.name ? 'scale-y-110' : ''
              }`}
              style={{ width: `${cat.addressPercent}%` }}
              onMouseEnter={() => setHoveredCategory(cat.name)}
              onMouseLeave={() => setHoveredCategory(null)}
            >
              {cat.addressPercent > 8 && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-lg">{cat.emoji}</span>
                </div>
              )}
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 transition-opacity bg-gray-800 text-white text-xs px-2 py-1 rounded whitespace-nowrap z-10">
                {cat.name}: {cat.addressPercent}%
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function WalletDistributionTreemap() {
  const [hoveredCategory, setHoveredCategory] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'cards' | 'bars'>('cards');

  return (
    <div className="bg-gray-900 text-white rounded-xl border border-gray-700">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-700">
        <div className="flex items-center gap-3">
          <span className="text-4xl">🐋</span>
          <div>
            <h2 className="text-xl font-bold">BTC Wallet Distribution</h2>
            <p className="text-gray-400 text-sm">Holder categories by balance size</p>
          </div>
        </div>

        {/* View Toggle */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setViewMode('cards')}
            className={`px-3 py-1.5 rounded-lg text-sm transition ${
              viewMode === 'cards'
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                : 'bg-gray-800 text-gray-400 hover:text-white'
            }`}
          >
            Cards
          </button>
          <button
            type="button"
            onClick={() => setViewMode('bars')}
            className={`px-3 py-1.5 rounded-lg text-sm transition ${
              viewMode === 'bars'
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                : 'bg-gray-800 text-gray-400 hover:text-white'
            }`}
          >
            Bars
          </button>
        </div>
      </div>

      {/* Educational Disclaimer */}
      <div className="mx-4 mt-4 p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg flex items-start gap-2">
        <Info className="w-4 h-4 text-blue-400 mt-0.5 flex-shrink-0" />
        <p className="text-xs text-blue-300">
          <strong>Educational Illustration:</strong> Percentages shown are based on typical Bitcoin distribution patterns
          from public on-chain analysis. Actual distribution varies over time. This is not real-time data.
        </p>
      </div>

      {/* Content */}
      <div className="p-4">
        {viewMode === 'cards' ? (
          <div className="flex flex-wrap gap-3">
            {WALLET_CATEGORIES.map((category) => (
              <CategoryCard
                key={category.name}
                category={category}
                isHovered={hoveredCategory === category.name}
                onHover={setHoveredCategory}
              />
            ))}
          </div>
        ) : (
          <DistributionBar categories={WALLET_CATEGORIES} />
        )}

        {/* Legend */}
        <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-3">
          {WALLET_CATEGORIES.map((cat) => (
            <div
              key={cat.name}
              className={`flex items-center gap-2 p-2 rounded-lg transition cursor-pointer ${
                hoveredCategory === cat.name ? 'bg-gray-800' : 'hover:bg-gray-800/50'
              }`}
              onMouseEnter={() => setHoveredCategory(cat.name)}
              onMouseLeave={() => setHoveredCategory(null)}
            >
              <span className="text-xl">{cat.emoji}</span>
              <div className="text-xs">
                <div className="font-medium text-white">{cat.name}</div>
                <div className="text-gray-500">{cat.range}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Key Insight */}
        <div className="mt-4 p-4 bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/20 rounded-lg">
          <h4 className="font-semibold text-amber-400 flex items-center gap-2">
            <span>💡</span> Key Insight
          </h4>
          <p className="text-sm text-gray-300 mt-1">
            While Humpback whales (1,000+ BTC) represent only ~0.05% of addresses, they typically hold
            over 50% of all Bitcoin. This concentration is common in crypto markets.
          </p>
        </div>
      </div>
    </div>
  );
}
