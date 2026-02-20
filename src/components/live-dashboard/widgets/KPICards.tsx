'use client';

import { useLiveDashboardStore, type GlobalData, type MarketCoin } from '@/lib/live-dashboard/store';
import { formatCompact, formatPrice } from '@/lib/live-dashboard/theme';
import { TrendingUp, TrendingDown, DollarSign, BarChart3, Activity, Coins } from 'lucide-react';

function formatPercent(n: number): string {
  return `${n >= 0 ? '+' : ''}${n.toFixed(2)}%`;
}

interface KPICardProps {
  label: string;
  value: string;
  change?: number;
  icon: React.ReactNode;
}

function KPICard({ label, value, change, icon }: KPICardProps) {
  return (
    <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-4 flex flex-col gap-1">
      <div className="flex items-center gap-2 text-gray-400 text-xs font-medium uppercase tracking-wider">
        {icon}
        {label}
      </div>
      <div className="text-2xl font-bold text-white mt-1">{value}</div>
      {change !== undefined && (
        <div className={`flex items-center gap-1 text-sm font-medium ${change >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
          {change >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
          {formatPercent(change)}
        </div>
      )}
    </div>
  );
}

interface KPICardsProps {
  mode?: 'market' | 'bitcoin' | 'defi' | 'trading';
}

export function KPICards({ mode = 'market' }: KPICardsProps) {
  const { data, customization } = useLiveDashboardStore();
  const global = data.global;
  const markets = data.markets;
  const cur = customization.vsCurrency || 'usd';

  if (!global) {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-gray-800/50 border border-gray-700 rounded-xl p-4 animate-pulse">
            <div className="h-3 bg-gray-700 rounded w-20 mb-3" />
            <div className="h-7 bg-gray-700 rounded w-32 mb-2" />
            <div className="h-4 bg-gray-700 rounded w-16" />
          </div>
        ))}
      </div>
    );
  }

  const totalMcap = global.total_market_cap?.[cur] || global.total_market_cap?.usd || 0;
  const totalVol = global.total_volume?.[cur] || global.total_volume?.usd || 0;
  const btcDom = global.market_cap_percentage?.btc || 0;
  const mcapChange = global.market_cap_change_percentage_24h_usd || 0;
  const btc = markets?.find((c) => c.id === 'bitcoin');
  const eth = markets?.find((c) => c.id === 'ethereum');

  const kpis = {
    market: [
      { label: 'Total Market Cap', value: formatCompact(totalMcap, cur), change: mcapChange, icon: <DollarSign className="w-4 h-4" /> },
      { label: '24h Volume', value: formatCompact(totalVol, cur), icon: <BarChart3 className="w-4 h-4" /> },
      { label: 'BTC Dominance', value: `${btcDom.toFixed(1)}%`, icon: <Activity className="w-4 h-4" /> },
      { label: 'Active Coins', value: (global.active_cryptocurrencies || 0).toLocaleString(), icon: <Coins className="w-4 h-4" /> },
    ],
    bitcoin: [
      { label: 'BTC Price', value: btc ? formatPrice(btc.current_price, cur) : '—', change: btc?.price_change_percentage_24h, icon: <DollarSign className="w-4 h-4" /> },
      { label: 'BTC Market Cap', value: btc ? formatCompact(btc.market_cap, cur) : '—', icon: <BarChart3 className="w-4 h-4" /> },
      { label: 'BTC Dominance', value: `${btcDom.toFixed(1)}%`, icon: <Activity className="w-4 h-4" /> },
      { label: 'Total Market Cap', value: formatCompact(totalMcap, cur), change: mcapChange, icon: <DollarSign className="w-4 h-4" /> },
    ],
    defi: [
      { label: 'Total Market Cap', value: formatCompact(totalMcap, cur), change: mcapChange, icon: <DollarSign className="w-4 h-4" /> },
      { label: 'ETH Price', value: eth ? formatPrice(eth.current_price, cur) : '—', change: eth?.price_change_percentage_24h, icon: <DollarSign className="w-4 h-4" /> },
      { label: 'BTC Dominance', value: `${btcDom.toFixed(1)}%`, icon: <Activity className="w-4 h-4" /> },
      { label: '24h Volume', value: formatCompact(totalVol, cur), icon: <BarChart3 className="w-4 h-4" /> },
    ],
    trading: [
      { label: 'BTC Price', value: btc ? formatPrice(btc.current_price, cur) : '—', change: btc?.price_change_percentage_24h, icon: <DollarSign className="w-4 h-4" /> },
      { label: 'ETH Price', value: eth ? formatPrice(eth.current_price, cur) : '—', change: eth?.price_change_percentage_24h, icon: <DollarSign className="w-4 h-4" /> },
      { label: '24h Volume', value: formatCompact(totalVol, cur), icon: <BarChart3 className="w-4 h-4" /> },
      { label: 'Market Cap Change', value: formatPercent(mcapChange), change: mcapChange, icon: <Activity className="w-4 h-4" /> },
    ],
  };

  const cards = kpis[mode] || kpis.market;

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card) => (
        <KPICard key={card.label} {...card} />
      ))}
    </div>
  );
}
