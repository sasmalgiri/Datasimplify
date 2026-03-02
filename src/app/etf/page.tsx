'use client';

import { useEffect, useState } from 'react';
import { FreeNavbar } from '@/components/FreeNavbar';
import { Breadcrumb } from '@/components/Breadcrumb';
import { TrendingUp, TrendingDown, Info, ExternalLink } from 'lucide-react';

interface EtfData {
  summary: {
    btc_price: number;
    btc_change_24h: number;
    market_sentiment: string;
  };
  meta: {
    note: string;
  };
}

const NOTABLE_ETFS = [
  { ticker: 'IBIT', name: 'iShares Bitcoin Trust', issuer: 'BlackRock' },
  { ticker: 'FBTC', name: 'Fidelity Wise Origin Bitcoin', issuer: 'Fidelity' },
  { ticker: 'GBTC', name: 'Grayscale Bitcoin Trust', issuer: 'Grayscale' },
  { ticker: 'ARKB', name: 'ARK 21Shares Bitcoin ETF', issuer: 'ARK/21Shares' },
  { ticker: 'BITB', name: 'Bitwise Bitcoin ETF', issuer: 'Bitwise' },
  { ticker: 'HODL', name: 'VanEck Bitcoin Trust', issuer: 'VanEck' },
  { ticker: 'BRRR', name: 'Valkyrie Bitcoin Fund', issuer: 'Valkyrie' },
  { ticker: 'EZBC', name: 'Franklin Bitcoin ETF', issuer: 'Franklin Templeton' },
  { ticker: 'BTCO', name: 'Invesco Galaxy Bitcoin ETF', issuer: 'Invesco' },
  { ticker: 'ETHA', name: 'iShares Ethereum Trust', issuer: 'BlackRock' },
  { ticker: 'FETH', name: 'Fidelity Ethereum Fund', issuer: 'Fidelity' },
];

export default function ETFPage() {
  const [data, setData] = useState<EtfData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/etf')
      .then((r) => r.json())
      .then((json) => {
        if (json.success) setData(json.data);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const btcPrice = data?.summary?.btc_price;
  const btcChange = data?.summary?.btc_change_24h;
  const sentiment = data?.summary?.market_sentiment;

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <FreeNavbar />
      <Breadcrumb />
      <div className="max-w-5xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-2">Crypto ETF Tracker</h1>
        <p className="text-gray-400 mb-8">
          Track Bitcoin and Ethereum spot ETFs — market context and key information.
        </p>

        {/* BTC Context Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <div className="bg-gray-800/50 border border-gray-700/50 rounded-xl p-5">
            <div className="text-xs text-gray-500 uppercase tracking-wider mb-1">BTC Price</div>
            <div className="text-2xl font-bold text-white">
              {loading ? '...' : btcPrice ? `$${btcPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '—'}
            </div>
          </div>
          <div className="bg-gray-800/50 border border-gray-700/50 rounded-xl p-5">
            <div className="text-xs text-gray-500 uppercase tracking-wider mb-1">24h Change</div>
            <div className={`text-2xl font-bold flex items-center gap-2 ${btcChange != null && btcChange >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
              {loading ? '...' : btcChange != null ? (
                <>
                  {btcChange >= 0 ? <TrendingUp className="w-5 h-5" /> : <TrendingDown className="w-5 h-5" />}
                  {btcChange >= 0 ? '+' : ''}{btcChange.toFixed(2)}%
                </>
              ) : '—'}
            </div>
          </div>
          <div className="bg-gray-800/50 border border-gray-700/50 rounded-xl p-5">
            <div className="text-xs text-gray-500 uppercase tracking-wider mb-1">Market Sentiment</div>
            <div className={`text-2xl font-bold capitalize ${sentiment === 'bullish' ? 'text-emerald-400' : sentiment === 'bearish' ? 'text-red-400' : 'text-yellow-400'}`}>
              {loading ? '...' : sentiment || '—'}
            </div>
          </div>
        </div>

        {/* ETF Directory */}
        <div className="bg-gray-800/50 border border-gray-700/50 rounded-xl overflow-hidden mb-8">
          <div className="px-5 py-4 border-b border-gray-700/50">
            <h2 className="text-lg font-semibold">Spot Crypto ETFs</h2>
            <p className="text-xs text-gray-500 mt-1">US-approved Bitcoin and Ethereum spot ETFs</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-gray-500 border-b border-gray-700/50">
                  <th className="text-left px-5 py-3 font-medium">Ticker</th>
                  <th className="text-left px-5 py-3 font-medium">Name</th>
                  <th className="text-left px-5 py-3 font-medium">Issuer</th>
                </tr>
              </thead>
              <tbody>
                {NOTABLE_ETFS.map((etf) => (
                  <tr key={etf.ticker} className="border-b border-gray-800/50 hover:bg-gray-800/30 transition">
                    <td className="px-5 py-3 font-mono font-semibold text-emerald-400">{etf.ticker}</td>
                    <td className="px-5 py-3 text-white">{etf.name}</td>
                    <td className="px-5 py-3 text-gray-400">{etf.issuer}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Info Notice */}
        <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-5 mb-8">
          <div className="flex items-start gap-3">
            <Info className="w-5 h-5 text-blue-400 mt-0.5 flex-shrink-0" />
            <div>
              <h3 className="text-sm font-semibold text-blue-400 mb-1">About ETF Data</h3>
              <p className="text-xs text-gray-400 leading-relaxed">
                Real-time ETF flow and AUM data requires premium financial data providers. This page shows BTC market context and an ETF directory. For live flow data, check{' '}
                <a href="https://farside.co.uk/bitcoin-etf-flow-all-data/" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline inline-flex items-center gap-1">
                  Farside Investors <ExternalLink className="w-3 h-3" />
                </a>{' '}
                or{' '}
                <a href="https://www.coinglass.com/bitcoin-etf" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline inline-flex items-center gap-1">
                  CoinGlass <ExternalLink className="w-3 h-3" />
                </a>.
              </p>
            </div>
          </div>
        </div>

        {/* Educational Content */}
        <div className="grid md:grid-cols-2 gap-4">
          <div className="bg-gray-800/50 border border-gray-700/50 rounded-xl p-5">
            <h3 className="text-sm font-semibold text-white mb-3">What are Crypto ETFs?</h3>
            <p className="text-xs text-gray-400 leading-relaxed">
              Exchange-Traded Funds (ETFs) allow investors to gain exposure to Bitcoin and Ethereum through traditional brokerage accounts without directly holding crypto. Spot ETFs hold the actual cryptocurrency, tracking its price closely.
            </p>
          </div>
          <div className="bg-gray-800/50 border border-gray-700/50 rounded-xl p-5">
            <h3 className="text-sm font-semibold text-white mb-3">Why ETF Flows Matter</h3>
            <p className="text-xs text-gray-400 leading-relaxed">
              ETF inflows represent new institutional demand for Bitcoin/Ethereum. Large sustained inflows are generally bullish (more buying pressure), while outflows may indicate institutional selling. Daily flow data is a key metric for gauging institutional sentiment.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
