'use client';

import { useState } from 'react';
import {
  Wallet,
  Search,
  Loader2,
  AlertTriangle,
  Globe,
  Copy,
  CheckCircle2,
  ExternalLink,
} from 'lucide-react';

interface TokenBalance {
  symbol: string;
  name: string;
  balance: number;
  decimals: number;
  contractAddress?: string;
  usdValue?: number;
}

interface WalletResult {
  chain: string;
  address: string;
  nativeBalance: number;
  nativeSymbol: string;
  tokens: TokenBalance[];
}

const CHAINS = [
  { id: 'ethereum', name: 'Ethereum', symbol: 'ETH', color: '#627EEA', explorer: 'https://etherscan.io' },
  { id: 'bsc', name: 'BNB Chain', symbol: 'BNB', color: '#F0B90B', explorer: 'https://bscscan.com' },
  { id: 'polygon', name: 'Polygon', symbol: 'MATIC', color: '#8247E5', explorer: 'https://polygonscan.com' },
  { id: 'arbitrum', name: 'Arbitrum', symbol: 'ETH', color: '#28A0F0', explorer: 'https://arbiscan.io' },
  { id: 'optimism', name: 'Optimism', symbol: 'ETH', color: '#FF0420', explorer: 'https://optimistic.etherscan.io' },
  { id: 'base', name: 'Base', symbol: 'ETH', color: '#0052FF', explorer: 'https://basescan.org' },
  { id: 'solana', name: 'Solana', symbol: 'SOL', color: '#9945FF', explorer: 'https://solscan.io' },
  { id: 'cosmos', name: 'Cosmos', symbol: 'ATOM', color: '#2E3148', explorer: 'https://mintscan.io/cosmos' },
];

export default function WalletPage() {
  const [address, setAddress] = useState('');
  const [selectedChains, setSelectedChains] = useState<string[]>(['ethereum']);
  const [results, setResults] = useState<WalletResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const toggleChain = (chainId: string) => {
    setSelectedChains((prev) =>
      prev.includes(chainId) ? prev.filter((c) => c !== chainId) : [...prev, chainId],
    );
  };

  const handleSearch = async () => {
    if (!address.trim() || selectedChains.length === 0) return;
    setLoading(true);
    setError(null);
    setResults([]);

    const newResults: WalletResult[] = [];

    for (const chainId of selectedChains) {
      try {
        const res = await fetch(`/api/v1/wallet/${chainId}?address=${encodeURIComponent(address.trim())}`);
        if (res.ok) {
          const data = await res.json();
          newResults.push(data);
        }
      } catch { /* skip failed chains */ }
    }

    if (newResults.length === 0) {
      setError('Could not fetch balance from any selected chain. Check the address format.');
    }

    setResults(newResults);
    setLoading(false);
  };

  const copyAddress = () => {
    navigator.clipboard.writeText(address);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const totalNativeValues = results.reduce((s, r) => s + r.nativeBalance, 0);
  const totalTokens = results.reduce((s, r) => s + r.tokens.length, 0);

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white">
      <div className="max-w-5xl mx-auto px-6 py-12">
        {/* Header */}
        <div className="flex items-center gap-3 mb-2">
          <Wallet className="w-7 h-7 text-emerald-400" />
          <h1 className="text-3xl font-bold">Multi-Chain Wallet</h1>
        </div>
        <p className="text-gray-400 mb-8">
          View balances across 8 blockchains. No wallet connection needed — just paste any address.
        </p>

        {/* Chain Selector */}
        <div className="mb-6">
          <label className="text-sm text-gray-400 mb-3 block">Select chains to scan</label>
          <div className="flex flex-wrap gap-2">
            {CHAINS.map((chain) => (
              <button
                key={chain.id}
                type="button"
                onClick={() => toggleChain(chain.id)}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition ${
                  selectedChains.includes(chain.id)
                    ? 'border-emerald-500/50 bg-emerald-500/10 text-emerald-400 border'
                    : 'border-gray-700/50 bg-gray-800/40 text-gray-400 hover:text-white border'
                }`}
              >
                <div className="w-4 h-4 rounded-full" style={{ backgroundColor: chain.color }} />
                {chain.name}
              </button>
            ))}
          </div>
        </div>

        {/* Search */}
        <div className="flex gap-3 mb-8">
          <div className="flex-1 relative">
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              placeholder="Enter wallet address (0x... or Solana/Cosmos address)"
              className="w-full bg-gray-800/60 border border-gray-700/50 rounded-xl px-4 py-3 pl-11 text-sm focus:outline-none focus:border-emerald-500/50"
            />
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          </div>
          <button
            type="button"
            onClick={handleSearch}
            disabled={loading || !address.trim()}
            className="px-6 py-3 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 rounded-xl font-medium transition flex items-center gap-2"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Globe className="w-4 h-4" />}
            Scan
          </button>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 mb-6 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-red-400 mt-0.5 shrink-0" />
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        )}

        {/* Results */}
        {results.length > 0 && (
          <>
            {/* Address bar */}
            <div className="bg-gray-800/40 border border-gray-700/50 rounded-xl p-4 mb-6 flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm">
                <span className="text-gray-500">Address:</span>
                <code className="text-emerald-400 font-mono text-xs">{address}</code>
                <button type="button" onClick={copyAddress} className="text-gray-500 hover:text-white transition">
                  {copied ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
              <div className="text-xs text-gray-500">
                {results.length} chain{results.length !== 1 ? 's' : ''} scanned · {totalTokens} tokens found
              </div>
            </div>

            {/* Chain Results */}
            <div className="space-y-6">
              {results.map((result) => {
                const chain = CHAINS.find((c) => c.name === result.chain) || CHAINS[0];
                return (
                  <div key={result.chain} className="bg-gray-800/50 border border-gray-700/50 rounded-xl overflow-hidden">
                    {/* Chain header */}
                    <div className="px-5 py-4 border-b border-gray-700/50 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: chain.color + '20' }}>
                          <div className="w-4 h-4 rounded-full" style={{ backgroundColor: chain.color }} />
                        </div>
                        <div>
                          <h3 className="font-semibold">{result.chain}</h3>
                          <p className="text-xs text-gray-500">
                            {result.nativeBalance.toFixed(6)} {result.nativeSymbol}
                          </p>
                        </div>
                      </div>
                      <a
                        href={`${chain.explorer}/address/${address}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-gray-500 hover:text-emerald-400 flex items-center gap-1 transition"
                      >
                        View on Explorer <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>

                    {/* Native Balance */}
                    <div className="px-5 py-3 bg-gray-900/30">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold" style={{ backgroundColor: chain.color + '30', color: chain.color }}>
                            {result.nativeSymbol[0]}
                          </div>
                          <span className="font-medium">{result.nativeSymbol}</span>
                          <span className="text-xs text-gray-500">Native</span>
                        </div>
                        <span className="font-mono text-sm">{result.nativeBalance.toFixed(6)}</span>
                      </div>
                    </div>

                    {/* Tokens */}
                    {result.tokens.length > 0 && (
                      <div className="divide-y divide-gray-700/30">
                        {result.tokens.map((token, i) => (
                          <div key={i} className="px-5 py-2.5 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <div className="w-6 h-6 rounded-full bg-gray-700/50 flex items-center justify-center text-[10px] font-bold text-gray-400">
                                {token.symbol[0]}
                              </div>
                              <span className="text-sm">{token.symbol}</span>
                              <span className="text-xs text-gray-600">{token.name}</span>
                            </div>
                            <span className="font-mono text-sm text-gray-300">{token.balance.toFixed(4)}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    {result.tokens.length === 0 && (
                      <div className="px-5 py-3 text-xs text-gray-600">No token balances found</div>
                    )}
                  </div>
                );
              })}
            </div>
          </>
        )}

        {/* Empty state */}
        {!loading && results.length === 0 && !error && (
          <div className="bg-gray-800/30 border border-gray-700/30 rounded-xl p-16 text-center">
            <Globe className="w-16 h-16 mx-auto mb-4 text-gray-700" />
            <h3 className="text-lg font-medium text-gray-400 mb-2">Scan any wallet address</h3>
            <p className="text-gray-600 text-sm max-w-md mx-auto">
              Supports Ethereum, BNB Chain, Polygon, Arbitrum, Optimism, Base, Solana, and Cosmos.
              No wallet connection needed.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
