'use client';

import { useState } from 'react';
import Link from 'next/link';
import { FreeNavbar } from '@/components/FreeNavbar';
import { Breadcrumb } from '@/components/Breadcrumb';
import { LIVE_DASHBOARDS } from '@/lib/live-dashboard/definitions';
import {
  ChevronRight,
  ChevronDown,
  ArrowRight,
  Crown,
  Zap,
  Globe,
  BarChart3,
} from 'lucide-react';

// ---------------------------------------------------------------------------
// Taxonomy tree structure — maps the entire crypto ecosystem
// ---------------------------------------------------------------------------

interface TreeNode {
  label: string;
  icon: string;
  description?: string;
  dashboards?: string[]; // slugs
  children?: TreeNode[];
  color?: string; // accent color for branch
}

const TAXONOMY: TreeNode = {
  label: 'Cryptocurrency',
  icon: '🌐',
  description: 'The complete crypto ecosystem',
  color: 'emerald',
  children: [
    {
      label: 'Market Overview',
      icon: '📊',
      description: 'Macro-level market analytics',
      color: 'emerald',
      dashboards: ['market-overview', 'executive-summary', 'morning-snapshot', 'quick-pulse', 'intelligence-hub'],
      children: [
        {
          label: 'Market Cap & Dominance',
          icon: '📈',
          dashboards: ['marketcap-tracker', 'btc-dominance-timer', 'market-breadth', 'crypto-indices'],
        },
        {
          label: 'Performance & Returns',
          icon: '🎯',
          dashboards: ['performance-overview', 'altseason-index', 'bear-market-survival'],
        },
        {
          label: 'Sector Analysis',
          icon: '🏗️',
          dashboards: ['sector-analysis', 'narrative-rotation', 'sector-alpha'],
        },
        {
          label: 'Sentiment & Social',
          icon: '💬',
          dashboards: ['social-sentiment', 'sentiment-pulse'],
        },
      ],
    },
    {
      label: 'Bitcoin (BTC)',
      icon: '₿',
      description: 'The original cryptocurrency',
      color: 'orange',
      dashboards: ['bitcoin', 'cycle-comparison'],
      children: [
        {
          label: 'BTC vs ETH',
          icon: '🥊',
          dashboards: ['btc-vs-eth', 'eth-btc-ratio'],
        },
      ],
    },
    {
      label: 'Ethereum (ETH)',
      icon: '🔷',
      description: 'Smart contract platform & DeFi foundation',
      color: 'blue',
      dashboards: ['ethereum'],
      children: [
        {
          label: 'Layer 2 Networks',
          icon: '🧱',
          dashboards: ['layer-2-scorecard'],
        },
      ],
    },
    {
      label: 'Altcoins',
      icon: '🎯',
      description: 'Alternative cryptocurrencies',
      color: 'purple',
      dashboards: ['altcoin-radar'],
      children: [
        {
          label: 'Layer 1 Blockchains',
          icon: '🔗',
          dashboards: ['layer1-compare'],
        },
        {
          label: 'Meme Coins',
          icon: '🐸',
          dashboards: ['meme-coin-spotlight', 'meme-coin-momentum'],
        },
        {
          label: 'AI & Smart Tokens',
          icon: '🤖',
          dashboards: ['ai-token-intelligence'],
        },
        {
          label: 'Micro-Cap Gems',
          icon: '💎',
          dashboards: ['micro-cap-gems'],
        },
        {
          label: 'Real World Assets (RWA)',
          icon: '🏠',
          dashboards: ['rwa-tracker'],
        },
      ],
    },
    {
      label: 'DeFi (Decentralized Finance)',
      icon: '🌐',
      description: 'Lending, DEXs, yields, and protocol analytics',
      color: 'teal',
      dashboards: ['defi-tracker', 'defi-deep-dive', 'tvl-fundamentals'],
      children: [
        {
          label: 'Yield & Lending',
          icon: '🌾',
          dashboards: ['defi-yield-explorer'],
          children: [
            { label: 'Aave', icon: '👻', dashboards: ['protocol-aave'] },
            { label: 'Compound', icon: '🟢', dashboards: ['protocol-compound'] },
            { label: 'MakerDAO', icon: '🏛️', dashboards: ['protocol-makerdao'] },
          ],
        },
        {
          label: 'DEX (Decentralized Exchanges)',
          icon: '🔄',
          dashboards: ['dex-analytics'],
          children: [
            { label: 'Uniswap', icon: '🦄', dashboards: ['protocol-uniswap'] },
          ],
        },
        {
          label: 'Liquid Staking',
          icon: '🌊',
          children: [
            { label: 'Lido', icon: '🌊', dashboards: ['protocol-lido'] },
          ],
        },
        {
          label: 'Cross-Chain Bridges',
          icon: '🌉',
          dashboards: ['multi-chain-bridge'],
        },
      ],
    },
    {
      label: 'Stablecoins',
      icon: '💵',
      description: 'USD-pegged tokens and capital flows',
      color: 'green',
      dashboards: ['stablecoin-monitor', 'stablecoin-capital'],
    },
    {
      label: 'Trading & Technical',
      icon: '⚡',
      description: 'Active trading tools and analytics',
      color: 'yellow',
      dashboards: ['trader', 'technical-analysis', 'technical-screener', 'smart-screener'],
      children: [
        {
          label: 'Risk & Volatility',
          icon: '🛡️',
          dashboards: ['risk-volatility', 'risk-return-map', 'risk-regime', 'volatility-regime'],
        },
        {
          label: 'Derivatives',
          icon: '📑',
          dashboards: ['derivatives-overview', 'derivatives-leverage', 'funding-liquidation', 'funding-arbitrage'],
        },
        {
          label: 'Volume Analysis',
          icon: '📣',
          dashboards: ['volume-leaders', 'exchange-flow'],
        },
        {
          label: 'Chart Patterns',
          icon: '🔍',
          dashboards: ['divergence-spotter', 'accumulation-zone', 'historical-analysis'],
        },
        {
          label: 'Correlation',
          icon: '🔀',
          dashboards: ['correlation-matrix'],
        },
      ],
    },
    {
      label: 'Portfolio Management',
      icon: '💼',
      description: 'Track, manage, and optimize holdings',
      color: 'indigo',
      dashboards: ['portfolio', 'watchlist', 'pl-tracker', 'dca-tracker'],
      children: [
        {
          label: 'Tax & Reporting',
          icon: '📑',
          dashboards: ['tax-portfolio'],
        },
        {
          label: 'Exchange Portfolio',
          icon: '🏛️',
          dashboards: ['exchange-portfolio', 'exchange-tracker'],
        },
      ],
    },
    {
      label: 'On-Chain & Wallets',
      icon: '👛',
      description: 'Blockchain data and wallet analytics',
      color: 'pink',
      dashboards: ['wallet-tracker'],
      children: [
        {
          label: 'Whale Tracking',
          icon: '🐋',
          dashboards: ['whale-watch', 'whale-accumulation', 'smart-money-tracker', 'copy-trading-leaderboard'],
        },
      ],
    },
    {
      label: 'NFT & Gaming',
      icon: '🎮',
      description: 'Digital collectibles and blockchain gaming',
      color: 'rose',
      dashboards: ['nft-gaming', 'nft-portfolio'],
    },
    {
      label: 'Tokenomics',
      icon: '🧬',
      description: 'Supply dynamics and token economics',
      color: 'cyan',
      dashboards: ['supply-analysis', 'tokenomics-supply', 'token-unlock-calendar'],
    },
  ],
};

// ---------------------------------------------------------------------------
// Color mappings for branches
// ---------------------------------------------------------------------------

const ACCENT_COLORS: Record<string, { bg: string; border: string; text: string; line: string; dot: string }> = {
  emerald:  { bg: 'bg-emerald-400/10', border: 'border-emerald-400/20', text: 'text-emerald-400', line: 'bg-emerald-400/30', dot: 'bg-emerald-400' },
  orange:   { bg: 'bg-orange-400/10',  border: 'border-orange-400/20',  text: 'text-orange-400',  line: 'bg-orange-400/30',  dot: 'bg-orange-400' },
  blue:     { bg: 'bg-blue-400/10',    border: 'border-blue-400/20',    text: 'text-blue-400',    line: 'bg-blue-400/30',    dot: 'bg-blue-400' },
  purple:   { bg: 'bg-purple-400/10',  border: 'border-purple-400/20',  text: 'text-purple-400',  line: 'bg-purple-400/30',  dot: 'bg-purple-400' },
  teal:     { bg: 'bg-teal-400/10',    border: 'border-teal-400/20',    text: 'text-teal-400',    line: 'bg-teal-400/30',    dot: 'bg-teal-400' },
  green:    { bg: 'bg-green-400/10',   border: 'border-green-400/20',   text: 'text-green-400',   line: 'bg-green-400/30',   dot: 'bg-green-400' },
  yellow:   { bg: 'bg-yellow-400/10',  border: 'border-yellow-400/20',  text: 'text-yellow-400',  line: 'bg-yellow-400/30',  dot: 'bg-yellow-400' },
  indigo:   { bg: 'bg-indigo-400/10',  border: 'border-indigo-400/20',  text: 'text-indigo-400',  line: 'bg-indigo-400/30',  dot: 'bg-indigo-400' },
  pink:     { bg: 'bg-pink-400/10',    border: 'border-pink-400/20',    text: 'text-pink-400',    line: 'bg-pink-400/30',    dot: 'bg-pink-400' },
  rose:     { bg: 'bg-rose-400/10',    border: 'border-rose-400/20',    text: 'text-rose-400',    line: 'bg-rose-400/30',    dot: 'bg-rose-400' },
  cyan:     { bg: 'bg-cyan-400/10',    border: 'border-cyan-400/20',    text: 'text-cyan-400',    line: 'bg-cyan-400/30',    dot: 'bg-cyan-400' },
};

// ---------------------------------------------------------------------------
// Dashboard slug → definition lookup
// ---------------------------------------------------------------------------

const DASHBOARD_MAP = Object.fromEntries(
  LIVE_DASHBOARDS.map((d) => [d.slug, d]),
);

// ---------------------------------------------------------------------------
// TreeNodeComponent — recursively renders the taxonomy
// ---------------------------------------------------------------------------

function TreeNodeComponent({
  node,
  depth = 0,
  parentColor = 'emerald',
}: {
  node: TreeNode;
  depth?: number;
  parentColor?: string;
}) {
  const [expanded, setExpanded] = useState(depth < 2);
  const hasChildren = (node.children && node.children.length > 0) || (node.dashboards && node.dashboards.length > 0);
  const color = node.color || parentColor;
  const accent = ACCENT_COLORS[color] || ACCENT_COLORS.emerald;

  return (
    <div className={depth > 0 ? 'ml-6 sm:ml-8' : ''}>
      {/* Node header */}
      <button
        onClick={() => setExpanded((v) => !v)}
        className={`group flex items-center gap-3 w-full text-left py-2.5 px-3 rounded-xl transition-all duration-200 ${
          expanded ? `${accent.bg} ${accent.border} border` : 'hover:bg-white/[0.03]'
        }`}
      >
        {/* Connector dot for child nodes */}
        {depth > 0 && (
          <div className="relative -ml-8 sm:-ml-11 mr-2 sm:mr-3">
            <div className={`w-2 h-2 rounded-full ${accent.dot}`} />
            <div className={`absolute top-1 left-1 w-[1px] -translate-x-1/2 h-6 ${accent.line} -mt-7`} />
          </div>
        )}

        {/* Expand/collapse icon */}
        {hasChildren ? (
          expanded ? (
            <ChevronDown className={`w-4 h-4 ${accent.text} shrink-0`} />
          ) : (
            <ChevronRight className="w-4 h-4 text-gray-600 group-hover:text-gray-400 shrink-0" />
          )
        ) : (
          <div className="w-4 h-4 shrink-0" />
        )}

        {/* Icon */}
        <span className={`text-${depth === 0 ? '2xl' : depth === 1 ? 'xl' : 'lg'}`}>{node.icon}</span>

        {/* Label + description */}
        <div className="flex-1 min-w-0">
          <span className={`font-semibold ${expanded ? accent.text : 'text-white'} ${depth === 0 ? 'text-xl' : depth === 1 ? 'text-base' : 'text-sm'}`}>
            {node.label}
          </span>
          {node.description && expanded && (
            <p className="text-gray-500 text-xs mt-0.5 truncate">{node.description}</p>
          )}
        </div>

        {/* Dashboard count badge */}
        {node.dashboards && node.dashboards.length > 0 && (
          <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${accent.bg} ${accent.text} border ${accent.border}`}>
            {node.dashboards.length}
          </span>
        )}
      </button>

      {/* Expanded content */}
      {expanded && (
        <div className={depth > 0 ? 'ml-3 border-l border-white/[0.04] pl-3' : ''}>
          {/* Dashboard links */}
          {node.dashboards && node.dashboards.length > 0 && (
            <div className="ml-11 sm:ml-14 mt-1 mb-3 flex flex-wrap gap-2">
              {node.dashboards.map((slug) => {
                const d = DASHBOARD_MAP[slug];
                if (!d) return null;
                return (
                  <Link
                    key={slug}
                    href={`/live-dashboards/${slug}`}
                    className={`group/card inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-white/[0.03] border border-white/[0.06] hover:${accent.border} hover:${accent.bg} transition-all duration-200 text-sm`}
                  >
                    <span className="text-base">{d.icon}</span>
                    <span className="text-gray-300 group-hover/card:text-white transition font-medium">{d.name}</span>
                    {d.tier === 'pro' ? (
                      <Crown className="w-3 h-3 text-amber-400" />
                    ) : (
                      <Zap className="w-3 h-3 text-emerald-400" />
                    )}
                    <ArrowRight className="w-3 h-3 text-gray-600 group-hover/card:text-gray-400 transition" />
                  </Link>
                );
              })}
            </div>
          )}

          {/* Child nodes */}
          {node.children?.map((child, i) => (
            <TreeNodeComponent
              key={i}
              node={child}
              depth={depth + 1}
              parentColor={color}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Stats helper — count all dashboards in a tree
// ---------------------------------------------------------------------------

function countDashboards(node: TreeNode): number {
  let count = node.dashboards?.length || 0;
  if (node.children) {
    for (const child of node.children) {
      count += countDashboards(child);
    }
  }
  return count;
}

function countNodes(node: TreeNode): number {
  let count = 1;
  if (node.children) {
    for (const child of node.children) {
      count += countNodes(child);
    }
  }
  return count;
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function TaxonomyPage() {
  const totalDashboards = countDashboards(TAXONOMY);
  const totalCategories = countNodes(TAXONOMY);
  const freeDashboards = LIVE_DASHBOARDS.filter((d) => d.tier === 'free').length;
  const proDashboards = LIVE_DASHBOARDS.filter((d) => d.tier === 'pro').length;

  return (
    <div className="min-h-screen bg-[#0a0a0f]">
      <FreeNavbar />
      <Breadcrumb />

      <main className="max-w-5xl mx-auto px-4 py-8">
        {/* Hero */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-400/5 border border-emerald-400/10 text-emerald-400 text-sm mb-6">
            <Globe className="w-4 h-4" />
            Crypto Ecosystem Map
          </div>
          <h1 className="text-3xl md:text-5xl font-bold text-white mb-4 tracking-tight">
            Dashboard{' '}
            <span className="bg-gradient-to-r from-emerald-400 to-teal-300 bg-clip-text text-transparent">
              Taxonomy
            </span>
          </h1>
          <p className="text-gray-500 text-lg max-w-2xl mx-auto leading-relaxed">
            Explore how the entire crypto ecosystem is organized — and find the perfect dashboard for every sector, protocol, and strategy.
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-10">
          {[
            { value: totalCategories, label: 'Categories', icon: <Globe className="w-4 h-4" /> },
            { value: totalDashboards, label: 'Dashboards Mapped', icon: <BarChart3 className="w-4 h-4" /> },
            { value: freeDashboards, label: 'Free Dashboards', icon: <Zap className="w-4 h-4" /> },
            { value: proDashboards, label: 'Pro Dashboards', icon: <Crown className="w-4 h-4" /> },
          ].map((s) => (
            <div key={s.label} className="text-center p-4 rounded-xl bg-white/[0.02] border border-white/[0.04]">
              <div className="flex items-center justify-center gap-1.5 text-emerald-400 mb-1">
                {s.icon}
                <span className="text-2xl font-bold">{s.value}</span>
              </div>
              <p className="text-gray-600 text-xs">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Legend */}
        <div className="flex items-center gap-6 mb-8 px-3 text-xs text-gray-500">
          <div className="flex items-center gap-1.5">
            <Zap className="w-3 h-3 text-emerald-400" />
            <span>Free</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Crown className="w-3 h-3 text-amber-400" />
            <span>Pro</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-gray-600">Click any branch to expand/collapse</span>
          </div>
        </div>

        {/* Tree */}
        <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-6 sm:p-8">
          <TreeNodeComponent node={TAXONOMY} depth={0} />
        </div>

        {/* Bottom links */}
        <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            href="/live-dashboards"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-500/10 border border-emerald-400/20 text-emerald-400 text-sm font-medium hover:bg-emerald-500/20 transition"
          >
            <BarChart3 className="w-4 h-4" />
            Browse All Dashboards
          </Link>
          <Link
            href="/live-dashboards/explore"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.06] text-white text-sm font-medium hover:bg-white/[0.08] transition"
          >
            <Globe className="w-4 h-4" />
            Explore 5,000+ Protocol Dashboards
          </Link>
        </div>
      </main>
    </div>
  );
}
