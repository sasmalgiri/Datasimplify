'use client';

import { useState, useMemo } from 'react';
import { FreeNavbar } from '@/components/FreeNavbar';
import { Breadcrumb } from '@/components/Breadcrumb';
import { useWebSocketDepth, useWebSocketTrades } from '@/hooks/useWebSocketPrices';
import { SUPPORTED_COINS } from '@/lib/dataTypes';

const TOP_COINS = SUPPORTED_COINS.slice(0, 20);

export default function OrderbookPage() {
  const [symbol, setSymbol] = useState('BTC');
  const [levels, setLevels] = useState<5 | 10 | 20>(20);

  const tradingPair = `${symbol}USDT`;
  const { bids, asks, connected } = useWebSocketDepth(tradingPair, levels);
  const { trades } = useWebSocketTrades(tradingPair, 30);

  // Calculate max volume for bar width scaling
  const maxBidVol = useMemo(() => Math.max(...bids.map(b => b.total), 1), [bids]);
  const maxAskVol = useMemo(() => Math.max(...asks.map(a => a.total), 1), [asks]);

  // Spread calculation
  const bestBid = bids[0]?.price || 0;
  const bestAsk = asks[0]?.price || 0;
  const spread = bestAsk - bestBid;
  const spreadPct = bestBid > 0 ? (spread / bestBid) * 100 : 0;

  // Total bid/ask volume
  const totalBidVol = useMemo(() => bids.reduce((s, b) => s + b.quantity, 0), [bids]);
  const totalAskVol = useMemo(() => asks.reduce((s, a) => s + a.quantity, 0), [asks]);
  const bidAskRatio = totalBidVol + totalAskVol > 0 ? (totalBidVol / (totalBidVol + totalAskVol)) * 100 : 50;

  const formatPrice = (price: number) => {
    if (price >= 1000) return price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    if (price >= 1) return price.toFixed(4);
    return price.toFixed(6);
  };

  const formatQty = (qty: number) => {
    if (qty >= 1000) return qty.toLocaleString(undefined, { maximumFractionDigits: 2 });
    if (qty >= 1) return qty.toFixed(4);
    return qty.toFixed(6);
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <FreeNavbar />
      <Breadcrumb customTitle="Live Orderbook" />

      <div className="max-w-6xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              📚 Live Orderbook
              <span className="text-sm font-normal text-gray-400">{tradingPair}</span>
            </h1>
            <p className="text-xs text-gray-500 mt-1">
              Real-time data from Binance WebSocket •
              {connected ? ' Live' : ' Connecting...'}
            </p>
          </div>

          <div className="flex gap-3">
            <select
              title="Trading pair"
              value={symbol}
              onChange={(e) => setSymbol(e.target.value)}
              className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm"
            >
              {TOP_COINS.map(c => <option key={c.symbol} value={c.symbol}>{c.symbol}/USDT</option>)}
            </select>
            <select
              title="Depth levels"
              value={levels}
              onChange={(e) => setLevels(Number(e.target.value) as 5 | 10 | 20)}
              className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm"
            >
              <option value={5}>5 Levels</option>
              <option value={10}>10 Levels</option>
              <option value={20}>20 Levels</option>
            </select>
          </div>
        </div>

        {/* Summary Bar */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
          <div className="bg-gray-800 rounded-lg p-3 border border-gray-700">
            <p className="text-xs text-gray-400">Best Bid</p>
            <p className="text-lg font-bold text-green-400">${formatPrice(bestBid)}</p>
          </div>
          <div className="bg-gray-800 rounded-lg p-3 border border-gray-700">
            <p className="text-xs text-gray-400">Best Ask</p>
            <p className="text-lg font-bold text-red-400">${formatPrice(bestAsk)}</p>
          </div>
          <div className="bg-gray-800 rounded-lg p-3 border border-gray-700">
            <p className="text-xs text-gray-400">Spread</p>
            <p className="text-lg font-bold text-yellow-400">${formatPrice(spread)} <span className="text-xs text-gray-500">({spreadPct.toFixed(3)}%)</span></p>
          </div>
          <div className="bg-gray-800 rounded-lg p-3 border border-gray-700">
            <p className="text-xs text-gray-400">Bid Volume</p>
            <p className="text-lg font-bold text-green-400">{formatQty(totalBidVol)}</p>
          </div>
          <div className="bg-gray-800 rounded-lg p-3 border border-gray-700">
            <p className="text-xs text-gray-400">Ask Volume</p>
            <p className="text-lg font-bold text-red-400">{formatQty(totalAskVol)}</p>
          </div>
        </div>

        {/* Bid/Ask Ratio Bar */}
        <div className="mb-6">
          <div className="flex justify-between text-xs text-gray-400 mb-1">
            <span>Buyers {bidAskRatio.toFixed(1)}%</span>
            <span>Sellers {(100 - bidAskRatio).toFixed(1)}%</span>
          </div>
          <div className="h-2 rounded-full overflow-hidden flex bg-gray-700">
            <div className="bg-green-500 transition-all duration-500" style={{ width: `${bidAskRatio}%` }} />
            <div className="bg-red-500 transition-all duration-500" style={{ width: `${100 - bidAskRatio}%` }} />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Bids (left) */}
          <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
            <div className="px-4 py-2 border-b border-gray-700 bg-green-900/10">
              <h3 className="font-semibold text-sm text-green-400">Bids (Buy Orders)</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-gray-700 text-gray-400">
                    <th className="text-right py-2 px-3">Price</th>
                    <th className="text-right py-2 px-3">Qty</th>
                    <th className="text-right py-2 px-3">Total</th>
                    <th className="py-2 px-1 w-24"></th>
                  </tr>
                </thead>
                <tbody>
                  {bids.map((bid, i) => (
                    <tr key={i} className="border-b border-gray-700/30 relative">
                      <td className="py-1.5 px-3 text-right font-mono text-green-400">{formatPrice(bid.price)}</td>
                      <td className="py-1.5 px-3 text-right font-mono">{formatQty(bid.quantity)}</td>
                      <td className="py-1.5 px-3 text-right font-mono text-gray-400">{formatQty(bid.total)}</td>
                      <td className="py-1.5 px-1 relative">
                        <div
                          className="absolute inset-y-0 right-0 bg-green-500/10 transition-all duration-300"
                          style={{ width: `${(bid.total / maxBidVol) * 100}%` }}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Asks (middle) */}
          <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
            <div className="px-4 py-2 border-b border-gray-700 bg-red-900/10">
              <h3 className="font-semibold text-sm text-red-400">Asks (Sell Orders)</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-gray-700 text-gray-400">
                    <th className="py-2 px-1 w-24"></th>
                    <th className="text-left py-2 px-3">Price</th>
                    <th className="text-left py-2 px-3">Qty</th>
                    <th className="text-left py-2 px-3">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {asks.map((ask, i) => (
                    <tr key={i} className="border-b border-gray-700/30 relative">
                      <td className="py-1.5 px-1 relative">
                        <div
                          className="absolute inset-y-0 left-0 bg-red-500/10 transition-all duration-300"
                          style={{ width: `${(ask.total / maxAskVol) * 100}%` }}
                        />
                      </td>
                      <td className="py-1.5 px-3 text-left font-mono text-red-400">{formatPrice(ask.price)}</td>
                      <td className="py-1.5 px-3 text-left font-mono">{formatQty(ask.quantity)}</td>
                      <td className="py-1.5 px-3 text-left font-mono text-gray-400">{formatQty(ask.total)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Recent Trades (right) */}
          <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
            <div className="px-4 py-2 border-b border-gray-700">
              <h3 className="font-semibold text-sm text-gray-300">Recent Trades</h3>
            </div>
            <div className="overflow-x-auto max-h-[500px] overflow-y-auto">
              <table className="w-full text-xs">
                <thead className="sticky top-0 bg-gray-800">
                  <tr className="border-b border-gray-700 text-gray-400">
                    <th className="text-left py-2 px-3">Time</th>
                    <th className="text-right py-2 px-3">Price</th>
                    <th className="text-right py-2 px-3">Qty</th>
                  </tr>
                </thead>
                <tbody>
                  {trades.map((trade, i) => (
                    <tr key={i} className="border-b border-gray-700/30">
                      <td className="py-1 px-3 text-gray-400">
                        {new Date(trade.time).toLocaleTimeString()}
                      </td>
                      <td className={`py-1 px-3 text-right font-mono ${trade.isBuyerMaker ? 'text-red-400' : 'text-green-400'}`}>
                        {formatPrice(trade.price)}
                      </td>
                      <td className="py-1 px-3 text-right font-mono">{formatQty(trade.quantity)}</td>
                    </tr>
                  ))}
                  {trades.length === 0 && (
                    <tr><td colSpan={3} className="py-8 text-center text-gray-500">Connecting to trade stream...</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Info */}
        <div className="mt-6 p-4 bg-gray-800/50 rounded-xl border border-gray-700/50 text-xs text-gray-500">
          <strong className="text-gray-400">Data source:</strong> Binance WebSocket API (public, no API key required).
          Orderbook updates every 1000ms. Trades are streamed in real-time. Display only — no trading functionality.
        </div>
      </div>
    </div>
  );
}
