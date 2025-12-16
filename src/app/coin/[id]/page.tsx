'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowLeft, ExternalLink, TrendingUp, TrendingDown } from 'lucide-react';
import PriceChart from '@/components/PriceChart';
import DownloadButton from '@/components/DownloadButton';
import { CoinMarketData } from '@/types/crypto';
import { formatCurrency, formatPercent, formatNumber, formatDate, getPriceChangeColor } from '@/lib/utils';

export default function CoinDetailPage() {
  const params = useParams();
  const coinId = params.id as string;
  
  const [coin, setCoin] = useState<CoinMarketData | null>(null);
  const [priceHistory, setPriceHistory] = useState<Array<{ timestamp: number; price: number }>>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (coinId) {
      fetchCoinData();
    }
  }, [coinId]);

  const fetchCoinData = async () => {
    try {
      // Fetch coin details
      const coinRes = await fetch(`/api/crypto/${coinId}`);
      const coinData = await coinRes.json();
      setCoin(coinData);

      // Fetch price history
      const historyRes = await fetch(`/api/crypto/${coinId}/history?days=30`);
      const historyData = await historyRes.json();
      setPriceHistory(historyData.prices || []);
    } catch (error) {
      console.error('Error fetching coin data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-48 mb-8" />
          <div className="h-64 bg-gray-200 rounded-xl mb-8" />
          <div className="grid md:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-24 bg-gray-200 rounded-xl" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!coin) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center py-20">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Coin not found</h1>
          <Link href="/" className="text-orange-600 hover:text-orange-700">
            ← Back to market
          </Link>
        </div>
      </div>
    );
  }

  const StatBox = ({ label, value, subValue }: { label: string; value: string; subValue?: string }) => (
    <div className="bg-white rounded-xl border border-gray-200 p-4">
      <div className="text-gray-500 text-sm mb-1">{label}</div>
      <div className="text-lg font-semibold text-gray-900">{value}</div>
      {subValue && <div className="text-xs text-gray-400">{subValue}</div>}
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Back link */}
      <Link 
        href="/" 
        className="inline-flex items-center gap-2 text-gray-500 hover:text-gray-700 mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to market
      </Link>

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div className="flex items-center gap-4">
          <Image
            src={coin.image}
            alt={coin.name}
            width={64}
            height={64}
            className="rounded-full"
          />
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-3xl font-bold text-gray-900">{coin.name}</h1>
              <span className="text-gray-400 text-lg uppercase">{coin.symbol}</span>
              <span className="bg-gray-100 text-gray-600 text-xs font-medium px-2 py-1 rounded">
                Rank #{coin.market_cap_rank}
              </span>
            </div>
            <div className="flex items-center gap-4 mt-2">
              <span className="text-3xl font-bold text-gray-900">
                {formatCurrency(coin.current_price, { compact: false })}
              </span>
              <span className={`flex items-center gap-1 text-lg font-medium ${getPriceChangeColor(coin.price_change_percentage_24h)}`}>
                {coin.price_change_percentage_24h >= 0 ? (
                  <TrendingUp className="w-5 h-5" />
                ) : (
                  <TrendingDown className="w-5 h-5" />
                )}
                {formatPercent(coin.price_change_percentage_24h)}
              </span>
            </div>
          </div>
        </div>
        
        <div className="flex gap-3">
          <DownloadButton 
            coins={[coin]} 
            filename={`${coin.symbol}_data`}
          />
        </div>
      </div>

      {/* Price Chart */}
      <div className="mb-8">
        <PriceChart data={priceHistory} height={400} />
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <StatBox
          label="Market Cap"
          value={formatCurrency(coin.market_cap)}
          subValue={`Rank #${coin.market_cap_rank}`}
        />
        <StatBox
          label="24h Trading Volume"
          value={formatCurrency(coin.total_volume)}
        />
        <StatBox
          label="Circulating Supply"
          value={formatNumber(coin.circulating_supply)}
          subValue={coin.symbol.toUpperCase()}
        />
        <StatBox
          label="Total Supply"
          value={coin.total_supply ? formatNumber(coin.total_supply) : '∞'}
        />
        <StatBox
          label="24h High"
          value={formatCurrency(coin.high_24h, { compact: false })}
        />
        <StatBox
          label="24h Low"
          value={formatCurrency(coin.low_24h, { compact: false })}
        />
        <StatBox
          label="All-Time High"
          value={formatCurrency(coin.ath, { compact: false })}
          subValue={formatDate(coin.ath_date)}
        />
        <StatBox
          label="All-Time Low"
          value={formatCurrency(coin.atl, { compact: false })}
          subValue={formatDate(coin.atl_date)}
        />
      </div>

      {/* Price Changes */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-8">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Price Change</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <div className="text-gray-500 text-sm">24 Hours</div>
            <div className={`text-lg font-semibold ${getPriceChangeColor(coin.price_change_percentage_24h)}`}>
              {formatPercent(coin.price_change_percentage_24h)}
            </div>
          </div>
          <div>
            <div className="text-gray-500 text-sm">7 Days</div>
            <div className={`text-lg font-semibold ${getPriceChangeColor(coin.price_change_percentage_7d || 0)}`}>
              {coin.price_change_percentage_7d ? formatPercent(coin.price_change_percentage_7d) : '-'}
            </div>
          </div>
          <div>
            <div className="text-gray-500 text-sm">30 Days</div>
            <div className={`text-lg font-semibold ${getPriceChangeColor(coin.price_change_percentage_30d || 0)}`}>
              {coin.price_change_percentage_30d ? formatPercent(coin.price_change_percentage_30d) : '-'}
            </div>
          </div>
          <div>
            <div className="text-gray-500 text-sm">From ATH</div>
            <div className={`text-lg font-semibold ${getPriceChangeColor(coin.ath_change_percentage)}`}>
              {formatPercent(coin.ath_change_percentage)}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
