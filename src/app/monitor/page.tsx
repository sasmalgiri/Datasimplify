'use client';

import { useState, useEffect, useRef } from 'react';
import { FreeNavbar } from '@/components/FreeNavbar';
import { Breadcrumb } from '@/components/Breadcrumb';
import { isFeatureEnabled } from '@/lib/featureFlags';

// Progress bar component using refs to avoid inline style warnings and ARIA expression warnings
function ProgressBarRef({ percentage, className, label }: { percentage: number; className: string; label: string }) {
  const barRef = useRef<HTMLDivElement>(null);
  const safePercentage = Math.round(Math.max(0, Math.min(100, percentage || 0)));

  useEffect(() => {
    if (barRef.current) {
      barRef.current.style.setProperty('--progress-width', `${safePercentage}%`);
      // Set ARIA attributes via JS to avoid static analysis warnings
      barRef.current.setAttribute('aria-valuenow', String(safePercentage));
      barRef.current.setAttribute('aria-valuemin', '0');
      barRef.current.setAttribute('aria-valuemax', '100');
    }
  }, [safePercentage]);

  return (
    <div
      ref={barRef}
      className={`${className} progress-bar`}
      role="progressbar"
      aria-label={label}
      title={`${label}: ${safePercentage}%`}
    />
  );
}

// Fear/Greed marker component using ref to set position dynamically (avoids inline style attribute)
function FearGreedMarker({ position }: { position: number }) {
  const markerRef = useRef<HTMLDivElement>(null);
  const safePosition = Math.max(0, Math.min(100, position || 0));

  useEffect(() => {
    if (markerRef.current) {
      markerRef.current.style.left = `${safePosition}%`;
    }
  }, [safePosition]);

  return (
    <div
      ref={markerRef}
      className="absolute top-1/2 -translate-x-1/2 -translate-y-1/2 w-3 h-5 bg-white rounded-sm shadow"
    />
  );
}

// Types
interface MacroData {
  fedFundsRate: number | null;
  treasury10Y: number | null;
  dxy: number | null;
  vix: number | null;
  sp500Change: number | null;
  nasdaqChange: number | null;
  riskEnvironment: 'risk-on' | 'risk-off' | 'neutral';
  interpretation: string;
  lastUpdated: string;
}

interface CoinDerivatives {
  symbol: string;
  openInterest: number | null;
  fundingRate: number | null;
  longShortRatio: number | null;
  volume24h: number | null;
}

interface DerivativesData {
  btc: CoinDerivatives;
  eth: CoinDerivatives;
  totalOpenInterest: number | null;
  totalLiquidations24h: number | null;
  aggregatedFundingRate: number | null;
  fundingHeatLevel: string;
  interpretation: string;
  lastUpdated: string;
}

interface StablecoinData {
  totalMarketCap: number;
  usdtDominance: number;
  usdcDominance: number;
  change24h: number;
}

interface DeFiData {
  totalTvl: number;
  tvlChange24h: number;
  topProtocols: Array<{ name: string; tvl: number; change24h: number }>;
}

interface OnChainData {
  btcHashrate: number | null;
  btcDifficulty: number | null;
  ethGasPrice: number | null;
  btcMempool: number | null;
}

interface SentimentData {
  fearGreedIndex: number | null;
  fearGreedLabel: string;
  trending: Array<{ name: string; symbol: string }>;
}

interface TokenUnlock {
  id: string;
  name: string;
  symbol: string;
  next7dUnlockPercent: number;
  next30dUnlockPercent: number;
  riskLevel: string;
}

// Format helpers
const formatNumber = (num: number | null | undefined, decimals = 2): string => {
  if (num === null || num === undefined) return '-';
  return num.toLocaleString(undefined, { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
};

const formatLargeNumber = (num: number | null | undefined): string => {
  if (num === null || num === undefined) return '-';
  if (num >= 1e12) return `$${(num / 1e12).toFixed(2)}T`;
  if (num >= 1e9) return `$${(num / 1e9).toFixed(2)}B`;
  if (num >= 1e6) return `$${(num / 1e6).toFixed(2)}M`;
  return `$${num.toLocaleString()}`;
};

const formatPercent = (num: number | null | undefined): string => {
  if (num === null || num === undefined) return '-';
  const sign = num >= 0 ? '+' : '';
  return `${sign}${num.toFixed(2)}%`;
};

// Panel Component
function Panel({ title, icon, children, className = '' }: {
  title: string;
  icon: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`bg-gray-800 rounded-xl p-5 border border-gray-700 ${className}`}>
      <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
        <span>{icon}</span>
        <span>{title}</span>
      </h3>
      {children}
    </div>
  );
}

// Metric Card Component
function MetricCard({ label, value, subValue, trend, color = 'white' }: {
  label: string;
  value: string;
  subValue?: string;
  trend?: 'up' | 'down' | 'neutral';
  color?: string;
}) {
  const trendColors = {
    up: 'text-green-400',
    down: 'text-red-400',
    neutral: 'text-gray-400'
  };
  const trendIcons = {
    up: '▲',
    down: '▼',
    neutral: '●'
  };

  return (
    <div className="bg-gray-900/50 rounded-lg p-3">
      <p className="text-gray-400 text-xs mb-1">{label}</p>
      <p className={`text-xl font-bold ${color === 'green' ? 'text-green-400' : color === 'red' ? 'text-red-400' : color === 'yellow' ? 'text-yellow-400' : 'text-white'}`}>
        {value}
        {trend && <span className={`ml-2 text-sm ${trendColors[trend]}`}>{trendIcons[trend]}</span>}
      </p>
      {subValue && <p className="text-gray-500 text-xs mt-1">{subValue}</p>}
    </div>
  );
}

// Alert Item Component
function AlertItem({ type, message, severity }: {
  type: string;
  message: string;
  severity: 'info' | 'warning' | 'danger';
}) {
  const colors = {
    info: 'border-blue-500/50 bg-blue-900/20',
    warning: 'border-yellow-500/50 bg-yellow-900/20',
    danger: 'border-red-500/50 bg-red-900/20'
  };
  const icons = {
    info: '💡',
    warning: '⚠️',
    danger: '🚨'
  };

  return (
    <div className={`border-l-4 ${colors[severity]} p-3 rounded-r`}>
      <div className="flex items-start gap-2">
        <span>{icons[severity]}</span>
        <div>
          <p className="text-sm font-medium text-white">{type}</p>
          <p className="text-xs text-gray-400">{message}</p>
        </div>
      </div>
    </div>
  );
}

export default function MonitorPage() {
  const [macro, setMacro] = useState<MacroData | null>(null);
  const [derivatives, setDerivatives] = useState<DerivativesData | null>(null);
  const [stablecoins, setStablecoins] = useState<StablecoinData | null>(null);
  const [defi, setDefi] = useState<DeFiData | null>(null);
  const [onchain, setOnchain] = useState<OnChainData | null>(null);
  const [sentiment, setSentiment] = useState<SentimentData | null>(null);
  const [unlocks, setUnlocks] = useState<TokenUnlock[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);

  // Fetch all data
  const fetchAllData = async () => {
    setLoading(true);

    try {
      // Fetch all data in parallel (including predictions)
      const [macroRes, derivativesRes, onchainRes, sentimentRes, unlocksRes, stablecoinRes, defiRes] = await Promise.allSettled([
        isFeatureEnabled('macro') ? fetch('/api/macro').then(r => r.json()) : Promise.resolve({ success: false }),
        fetch('/api/derivatives').then(r => r.json()),
        fetch('/api/onchain').then(r => r.json()),
        fetch('/api/sentiment').then(r => r.json()),
        fetch('/api/unlocks?upcoming=true&days=30').then(r => r.json()),
        isFeatureEnabled('defi') ? fetch('/api/defi/llama?type=stablecoins').then(r => r.json()) : Promise.resolve({}),
        isFeatureEnabled('defi') ? fetch('/api/defi/llama?type=protocols').then(r => r.json()) : Promise.resolve([])
      ]);

      // Process macro data
      if (macroRes.status === 'fulfilled' && macroRes.value.success) {
        setMacro(macroRes.value.data);
      }

      // Process derivatives data
      if (derivativesRes.status === 'fulfilled' && derivativesRes.value.success) {
        setDerivatives(derivativesRes.value.data);
      }

      // Process on-chain data
      if (onchainRes.status === 'fulfilled' && onchainRes.value) {
        const data = onchainRes.value;
        setOnchain({
          btcHashrate: data.bitcoin?.hashrate || null,
          btcDifficulty: data.bitcoin?.difficulty || null,
          ethGasPrice: data.ethereum?.gasPrice?.standard || null,
          btcMempool: data.bitcoin?.mempoolSize || null
        });
      }

      // Process sentiment data
      if (sentimentRes.status === 'fulfilled') {
        const data = sentimentRes.value;
        setSentiment({
          fearGreedIndex: (typeof data.value === 'number' && Number.isFinite(data.value)) ? data.value : null,
          fearGreedLabel: data.classification || (data.value ? 'Unknown' : 'Unavailable'),
          trending: []
        });
      }

      // Process unlocks data
      if (unlocksRes.status === 'fulfilled' && unlocksRes.value.success) {
        setUnlocks(unlocksRes.value.data?.slice(0, 5) || []);
      }

      // Process stablecoin data
      if (stablecoinRes.status === 'fulfilled') {
        const data = stablecoinRes.value;
        if (data.peggedAssets) {
          const total = data.peggedAssets.reduce((sum: number, s: { circulating?: { peggedUSD?: number } }) =>
            sum + (s.circulating?.peggedUSD || 0), 0);
          const usdt = data.peggedAssets.find((s: { symbol?: string }) => s.symbol === 'USDT');
          const usdc = data.peggedAssets.find((s: { symbol?: string }) => s.symbol === 'USDC');

          setStablecoins({
            totalMarketCap: total,
            usdtDominance: usdt ? (usdt.circulating?.peggedUSD / total) * 100 : 0,
            usdcDominance: usdc ? (usdc.circulating?.peggedUSD / total) * 100 : 0,
            change24h: 0
          });
        }
      }

      // Process DeFi data
      if (defiRes.status === 'fulfilled') {
        const protocols = defiRes.value;
        if (Array.isArray(protocols)) {
          const totalTvl = protocols.reduce((sum: number, p: { tvl?: number }) => sum + (p.tvl || 0), 0);
          const topProtocols = protocols
            .sort((a: { tvl?: number }, b: { tvl?: number }) => (b.tvl || 0) - (a.tvl || 0))
            .slice(0, 5)
            .map((p: { name?: string; tvl?: number; change_1d?: number }) => ({
              name: p.name || 'Unknown',
              tvl: p.tvl || 0,
              change24h: p.change_1d || 0
            }));

          setDefi({
            totalTvl,
            tvlChange24h: 0,
            topProtocols
          });
        }
      }

      setLastRefresh(new Date());
    } catch (error) {
      console.error('Error fetching monitor data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllData();
    // Refresh every 60 seconds
    const interval = setInterval(fetchAllData, 60000);
    return () => clearInterval(interval);
  }, []);

  // Generate alerts based on data
  const generateAlerts = () => {
    const alerts: { type: string; message: string; severity: 'info' | 'warning' | 'danger' }[] = [];

    // VIX alerts
    if (macro?.vix) {
      if (macro.vix > 30) {
        alerts.push({ type: 'High VIX', message: `VIX at ${macro.vix.toFixed(1)} - extreme fear in markets`, severity: 'danger' });
      } else if (macro.vix > 20) {
        alerts.push({ type: 'Elevated VIX', message: `VIX at ${macro.vix.toFixed(1)} - increased volatility`, severity: 'warning' });
      }
    }

    // Funding rate alerts
    if (derivatives?.aggregatedFundingRate) {
      if (Math.abs(derivatives.aggregatedFundingRate) > 0.05) {
        const direction = derivatives.aggregatedFundingRate > 0 ? 'positive' : 'negative';
        alerts.push({
          type: 'Extreme Funding',
          message: `${direction} funding at ${(derivatives.aggregatedFundingRate * 100).toFixed(3)}% - potential squeeze`,
          severity: 'warning'
        });
      }
    }

    // Unlock alerts
    unlocks.forEach(unlock => {
      if (unlock.next7dUnlockPercent > 5) {
        alerts.push({
          type: `${unlock.symbol} Unlock`,
          message: `${unlock.next7dUnlockPercent.toFixed(1)}% unlocking in 7 days`,
          severity: 'danger'
        });
      } else if (unlock.next7dUnlockPercent > 2) {
        alerts.push({
          type: `${unlock.symbol} Unlock`,
          message: `${unlock.next7dUnlockPercent.toFixed(1)}% unlocking in 7 days`,
          severity: 'warning'
        });
      }
    });

    // Fear & Greed alerts
    if (sentiment) {
      if (sentiment.fearGreedIndex !== null) {
        if (sentiment.fearGreedIndex < 20) {
          alerts.push({ type: 'Extreme Fear', message: `Fear & Greed at ${sentiment.fearGreedIndex} - potential bottom`, severity: 'info' });
        } else if (sentiment.fearGreedIndex > 80) {
          alerts.push({ type: 'Extreme Greed', message: `Fear & Greed at ${sentiment.fearGreedIndex} - potential top`, severity: 'warning' });
        }
      }
    }

    return alerts.slice(0, 6); // Limit to 6 alerts
  };

  const alerts = generateAlerts();

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Navigation */}
      <FreeNavbar />
      <Breadcrumb />

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold">Market Monitor</h1>
            <p className="text-gray-400">Complete crypto market monitoring dashboard • Updates periodically</p>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-500">
              Last updated: {lastRefresh ? lastRefresh.toLocaleTimeString() : '...'}
            </span>
            <button
              onClick={fetchAllData}
              disabled={loading}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-700 rounded-lg text-sm font-medium transition-colors"
            >
              {loading ? 'Refreshing...' : '🔄 Refresh'}
            </button>
          </div>
        </div>

        {/* Risk Environment Banner */}
        {macro && (
          <div className={`mb-6 p-4 rounded-xl border ${
            macro.riskEnvironment === 'risk-on'
              ? 'bg-green-900/20 border-green-700/50'
              : macro.riskEnvironment === 'risk-off'
                ? 'bg-red-900/20 border-red-700/50'
                : 'bg-gray-800 border-gray-700'
          }`}>
            <div className="flex items-center gap-4">
              <span className="text-2xl">
                {macro.riskEnvironment === 'risk-on' ? '🟢' : macro.riskEnvironment === 'risk-off' ? '🔴' : '🟡'}
              </span>
              <div>
                <p className="font-semibold">
                  Current Environment: <span className={
                    macro.riskEnvironment === 'risk-on' ? 'text-green-400' :
                    macro.riskEnvironment === 'risk-off' ? 'text-red-400' : 'text-yellow-400'
                  }>
                    {macro.riskEnvironment.replace('-', ' ').toUpperCase()}
                  </span>
                </p>
                <p className="text-sm text-gray-400">{macro.interpretation}</p>
              </div>
            </div>
          </div>
        )}

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column */}
          <div className="space-y-6">
            {/* Macro Panel */}
            <Panel title="Macro Indicators" icon="🏛️">
              <div className="grid grid-cols-2 gap-3">
                <MetricCard
                  label="Fed Funds Rate"
                  value={macro?.fedFundsRate ? `${formatNumber(macro.fedFundsRate)}%` : 'N/A'}
                  subValue="Target rate"
                />
                <MetricCard
                  label="10Y Treasury"
                  value={macro?.treasury10Y ? `${formatNumber(macro.treasury10Y)}%` : 'N/A'}
                  subValue="US bond yield"
                />
                <MetricCard
                  label="DXY (USD Index)"
                  value={macro?.dxy ? formatNumber(macro.dxy, 1) : 'N/A'}
                  subValue="Dollar strength"
                />
                <MetricCard
                  label="VIX"
                  value={macro?.vix ? formatNumber(macro.vix, 1) : 'N/A'}
                  subValue="Fear gauge"
                  color={macro?.vix && macro.vix > 25 ? 'red' : macro?.vix && macro.vix < 15 ? 'green' : 'white'}
                />
              </div>
              <div className="mt-3 grid grid-cols-2 gap-3">
                <MetricCard
                  label="S&P 500"
                  value={formatPercent(macro?.sp500Change)}
                  trend={macro?.sp500Change ? (macro.sp500Change > 0 ? 'up' : 'down') : 'neutral'}
                />
                <MetricCard
                  label="Nasdaq"
                  value={formatPercent(macro?.nasdaqChange)}
                  trend={macro?.nasdaqChange ? (macro.nasdaqChange > 0 ? 'up' : 'down') : 'neutral'}
                />
              </div>
            </Panel>

            {/* Derivatives Panel */}
            <Panel title="Derivatives" icon="📈">
              <div className="space-y-3">
                <div className="flex justify-between items-center pb-2 border-b border-gray-700">
                  <span className="text-gray-400 text-sm">Total Open Interest</span>
                  <span className="font-bold">{formatLargeNumber(derivatives?.totalOpenInterest)}</span>
                </div>
                <div className="flex justify-between items-center pb-2 border-b border-gray-700">
                  <span className="text-gray-400 text-sm">24h Liquidations</span>
                  <span className="font-bold text-red-400">{formatLargeNumber(derivatives?.totalLiquidations24h)}</span>
                </div>
                <div className="flex justify-between items-center pb-2 border-b border-gray-700">
                  <span className="text-gray-400 text-sm">Avg Funding Rate</span>
                  <span className={`font-bold ${
                    derivatives?.aggregatedFundingRate && derivatives.aggregatedFundingRate > 0
                      ? 'text-green-400' : 'text-red-400'
                  }`}>
                    {derivatives?.aggregatedFundingRate
                      ? `${(derivatives.aggregatedFundingRate * 100).toFixed(4)}%`
                      : 'N/A'}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-400 text-sm">Funding Heat</span>
                  <span className={`px-2 py-1 rounded text-xs font-medium ${
                    derivatives?.fundingHeatLevel === 'extreme_long' ? 'bg-red-600' :
                    derivatives?.fundingHeatLevel === 'bullish' ? 'bg-green-600' :
                    derivatives?.fundingHeatLevel === 'bearish' ? 'bg-orange-600' :
                    derivatives?.fundingHeatLevel === 'extreme_short' ? 'bg-purple-600' :
                    'bg-gray-600'
                  }`}>
                    {derivatives?.fundingHeatLevel?.replace('_', ' ').toUpperCase() || 'NEUTRAL'}
                  </span>
                </div>
              </div>
              {/* BTC/ETH Details */}
              <div className="mt-4 grid grid-cols-2 gap-3">
                <div className="bg-gray-900/50 rounded-lg p-3">
                  <p className="text-xs text-gray-400 mb-2">BTC Futures</p>
                  <p className="text-sm">OI: {formatLargeNumber(derivatives?.btc?.openInterest)}</p>
                  <p className="text-sm">Funding: {derivatives?.btc?.fundingRate ? `${(derivatives.btc.fundingRate).toFixed(4)}%` : 'N/A'}</p>
                </div>
                <div className="bg-gray-900/50 rounded-lg p-3">
                  <p className="text-xs text-gray-400 mb-2">ETH Futures</p>
                  <p className="text-sm">OI: {formatLargeNumber(derivatives?.eth?.openInterest)}</p>
                  <p className="text-sm">Funding: {derivatives?.eth?.fundingRate ? `${(derivatives.eth.fundingRate).toFixed(4)}%` : 'N/A'}</p>
                </div>
              </div>
            </Panel>
          </div>

          {/* Middle Column */}
          <div className="space-y-6">
            {/* Stablecoins Panel */}
            <Panel title="Stablecoin Health" icon="💵">
              <div className="grid grid-cols-2 gap-3">
                <MetricCard
                  label="Total Supply"
                  value={formatLargeNumber(stablecoins?.totalMarketCap)}
                  subValue="All stablecoins"
                />
                <MetricCard
                  label="24h Change"
                  value={formatPercent(stablecoins?.change24h)}
                  trend={stablecoins?.change24h ? (stablecoins.change24h > 0 ? 'up' : 'down') : 'neutral'}
                />
              </div>
              <div className="mt-4">
                <p className="text-xs text-gray-400 mb-2">Dominance</p>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="text-sm w-12">USDT</span>
                    <div className="flex-1 bg-gray-700 rounded-full h-3 overflow-hidden">
                      <ProgressBarRef
                        percentage={stablecoins?.usdtDominance || 0}
                        className="bg-green-500 h-full rounded-full"
                        label={`USDT dominance: ${formatNumber(stablecoins?.usdtDominance, 1)}%`}
                      />
                    </div>
                    <span className="text-sm text-gray-400 w-12 text-right">
                      {formatNumber(stablecoins?.usdtDominance, 1)}%
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm w-12">USDC</span>
                    <div className="flex-1 bg-gray-700 rounded-full h-3 overflow-hidden">
                      <ProgressBarRef
                        percentage={stablecoins?.usdcDominance || 0}
                        className="bg-blue-500 h-full rounded-full"
                        label={`USDC dominance: ${formatNumber(stablecoins?.usdcDominance, 1)}%`}
                      />
                    </div>
                    <span className="text-sm text-gray-400 w-12 text-right">
                      {formatNumber(stablecoins?.usdcDominance, 1)}%
                    </span>
                  </div>
                </div>
              </div>
            </Panel>

            {/* DeFi Panel */}
            <Panel title="DeFi Overview" icon="🏦">
              <div className="grid grid-cols-2 gap-3 mb-4">
                <MetricCard
                  label="Total TVL"
                  value={formatLargeNumber(defi?.totalTvl)}
                  subValue="All protocols"
                />
                <MetricCard
                  label="24h Change"
                  value={formatPercent(defi?.tvlChange24h)}
                  trend={defi?.tvlChange24h ? (defi.tvlChange24h > 0 ? 'up' : 'down') : 'neutral'}
                />
              </div>
              <p className="text-xs text-gray-400 mb-2">Top Protocols by TVL</p>
              <div className="space-y-2">
                {defi?.topProtocols.map((protocol, i) => (
                  <div key={protocol.name} className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-2">
                      <span className="text-gray-500 w-4">{i + 1}.</span>
                      <span>{protocol.name}</span>
                    </span>
                    <span className="text-gray-400">{formatLargeNumber(protocol.tvl)}</span>
                  </div>
                ))}
              </div>
            </Panel>

            {/* On-Chain Panel */}
            <Panel title="On-Chain Metrics" icon="⛓️">
              <div className="grid grid-cols-2 gap-3">
                <MetricCard
                  label="BTC Hashrate"
                  value={onchain?.btcHashrate ? `${(onchain.btcHashrate / 1e18).toFixed(0)} EH/s` : 'N/A'}
                  subValue="Network security"
                />
                <MetricCard
                  label="ETH Gas"
                  value={onchain?.ethGasPrice ? `${onchain.ethGasPrice} gwei` : 'N/A'}
                  subValue="Standard tx"
                  color={onchain?.ethGasPrice && onchain.ethGasPrice > 50 ? 'red' : onchain?.ethGasPrice && onchain.ethGasPrice < 20 ? 'green' : 'white'}
                />
                <MetricCard
                  label="BTC Mempool"
                  value={onchain?.btcMempool ? `${(onchain.btcMempool / 1000).toFixed(0)}K txs` : 'N/A'}
                  subValue="Pending txs"
                />
                <MetricCard
                  label="BTC Difficulty"
                  value={onchain?.btcDifficulty ? `${(onchain.btcDifficulty / 1e12).toFixed(1)}T` : 'N/A'}
                  subValue="Mining difficulty"
                />
              </div>
            </Panel>
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            {/* Sentiment Panel */}
            <Panel title="Market Sentiment" icon="🎯">
              <div className="text-center mb-4">
                <div className={`inline-flex items-center justify-center w-24 h-24 rounded-full border-4 ${
                  sentiment?.fearGreedIndex && sentiment.fearGreedIndex < 25 ? 'border-red-500' :
                  sentiment?.fearGreedIndex && sentiment.fearGreedIndex < 45 ? 'border-orange-500' :
                  sentiment?.fearGreedIndex && sentiment.fearGreedIndex < 55 ? 'border-yellow-500' :
                  sentiment?.fearGreedIndex && sentiment.fearGreedIndex < 75 ? 'border-lime-500' :
                  'border-green-500'
                }`}>
                  <div>
                    <p className="text-3xl font-bold">{sentiment?.fearGreedIndex || '-'}</p>
                    <p className="text-xs text-gray-400">{sentiment?.fearGreedLabel || 'Loading'}</p>
                  </div>
                </div>
              </div>
              <div className="h-3 bg-gradient-to-r from-red-500 via-yellow-500 to-green-500 rounded-full mb-2 relative">
                {sentiment?.fearGreedIndex && (
                  <FearGreedMarker position={sentiment.fearGreedIndex} />
                )}
              </div>
              <div className="flex justify-between text-xs text-gray-400">
                <span>Extreme Fear</span>
                <span>Neutral</span>
                <span>Extreme Greed</span>
              </div>
            </Panel>

            {/* Upcoming Unlocks Panel */}
            <Panel title="Token Unlocks (30d)" icon="🔓">
              {unlocks.length > 0 ? (
                <div className="space-y-3">
                  {unlocks.map(unlock => (
                    <div
                      key={unlock.id}
                      className={`p-3 rounded-lg border ${
                        unlock.riskLevel === 'critical' ? 'border-red-500/50 bg-red-900/20' :
                        unlock.riskLevel === 'high' ? 'border-orange-500/50 bg-orange-900/20' :
                        unlock.riskLevel === 'medium' ? 'border-yellow-500/50 bg-yellow-900/20' :
                        'border-gray-700 bg-gray-800/50'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-medium">{unlock.symbol}</span>
                        <span className={`text-sm ${
                          unlock.next7dUnlockPercent > 5 ? 'text-red-400' :
                          unlock.next7dUnlockPercent > 2 ? 'text-orange-400' :
                          'text-gray-400'
                        }`}>
                          {unlock.next7dUnlockPercent.toFixed(1)}% (7d)
                        </span>
                      </div>
                      <p className="text-xs text-gray-400 mt-1">
                        30d: {unlock.next30dUnlockPercent.toFixed(1)}% unlock
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-4">No major unlocks in next 30 days</p>
              )}
            </Panel>

            {/* Alerts Panel */}
            <Panel title="Risk Alerts" icon="🚨">
              {alerts.length > 0 ? (
                <div className="space-y-2">
                  {alerts.map((alert, i) => (
                    <AlertItem key={i} {...alert} />
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <span className="text-4xl mb-2 block">✅</span>
                  <p className="text-gray-400">No active alerts</p>
                  <p className="text-xs text-gray-500">Market conditions normal</p>
                </div>
              )}
            </Panel>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center text-gray-500 text-sm">
          <p>Data sources vary by enabled features and provider availability.</p>
          <p className="mt-1">Refresh cadence depends on the dataset.</p>
        </div>
      </div>
    </div>
  );
}
