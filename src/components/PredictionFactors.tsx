'use client';

import { useRef, useEffect, useState } from 'react';
import {
  TrendingUp,
  TrendingDown,
  Minus,
  BarChart3,
  MessageCircle,
  Link2,
  Globe,
  Activity,
  ChevronDown,
  ChevronUp,
  Info,
  AlertTriangle,
  Zap,
  DollarSign,
  Users,
  Wallet,
  LineChart,
} from 'lucide-react';
import { AIPredictionDisclaimer } from './ui/DisclaimerBanner';
import { FEATURES } from '@/lib/featureFlags';

// Progress bar using refs to avoid inline style warnings
function FactorBar({ percentage, colorClass }: { percentage: number; colorClass: string }) {
  const barRef = useRef<HTMLDivElement>(null);
  const safePercentage = Math.max(0, Math.min(100, percentage || 0));

  useEffect(() => {
    if (barRef.current) {
      barRef.current.style.width = `${safePercentage}%`;
    }
  }, [safePercentage]);

  return (
    <div className="h-2 bg-gray-700 rounded-full overflow-hidden flex-1">
      <div
        ref={barRef}
        className={`h-full rounded-full transition-all duration-500 ${colorClass}`}
      />
    </div>
  );
}

// Factor category weights
const FACTOR_WEIGHTS = {
  technical: 35,
  sentiment: 15,
  onChain: 30,
  macro: 20,
};

export interface TechnicalFactors {
  rsi: { value: number | null; signal: string };
  macd: { signal: string; histogram: number | null };
  priceVsMA200: { percentage: number | null; signal: string };
  bollingerPosition: string;
  volumeTrend: string;
  supportResistance: string;
}

export interface SentimentFactors {
  fearGreedIndex: { value: number; label: string };
  socialSentiment: string;
  newsAnalysis: string;
  twitterMentions: { trend: string; change: number | null };
}

export interface OnChainFactors {
  exchangeFlow: { net: string; signal: string };
  whaleActivity: string;
  activeAddresses: { trend: string; change: number | null };
  holdingDistribution: string;
  networkHashrate?: string;
}

export interface MacroFactors {
  vix: { value: number | null; signal: string };
  dxy: { value: number | null; signal: string };
  riskEnvironment: string;
  btcCorrelation: number | null;
  marketCycle: string;
}

export interface DerivativesFactors {
  fundingRate: { value: number | null; signal: string };
  openInterest: { change: number | null; signal: string };
  liquidations24h: { value: number | null; predominant: string };
  longShortRatio: number | null;
}

export interface PredictionFactorsData {
  technicalScore: number;
  sentimentScore: number;
  onChainScore: number;
  macroScore: number;
  overallScore: number;
  prediction: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
  confidence: number;
  technical?: TechnicalFactors;
  sentiment?: SentimentFactors;
  onChain?: OnChainFactors;
  macro?: MacroFactors;
  derivatives?: DerivativesFactors;
}

interface PredictionFactorsProps {
  data: PredictionFactorsData;
  coinName?: string;
  coinSymbol?: string;
  showDisclaimer?: boolean;
}

function getScoreColor(score: number): string {
  if (score >= 70) return 'bg-emerald-500';
  if (score >= 50) return 'bg-yellow-500';
  return 'bg-red-500';
}

function getScoreTextColor(score: number): string {
  if (score >= 70) return 'text-emerald-400';
  if (score >= 50) return 'text-yellow-400';
  return 'text-red-400';
}

function getSignalIcon(signal: string) {
  if (signal.toLowerCase().includes('bullish') || signal.toLowerCase().includes('positive')) {
    return <TrendingUp className="w-3 h-3 text-emerald-400" />;
  }
  if (signal.toLowerCase().includes('bearish') || signal.toLowerCase().includes('negative')) {
    return <TrendingDown className="w-3 h-3 text-red-400" />;
  }
  return <Minus className="w-3 h-3 text-yellow-400" />;
}

function formatNumberOrUnavailable(value: number | null | undefined, options?: { suffix?: string; decimals?: number }) {
  if (typeof value !== 'number' || Number.isNaN(value)) return 'Unavailable';
  const decimals = options?.decimals;
  const text = typeof decimals === 'number' ? value.toFixed(decimals) : `${value}`;
  return `${text}${options?.suffix ?? ''}`;
}

// Factor category component
function FactorCategory({
  icon: Icon,
  label,
  weight,
  score,
  children,
  defaultExpanded = false,
}: {
  icon: React.ElementType;
  label: string;
  weight: number;
  score: number;
  children: React.ReactNode;
  defaultExpanded?: boolean;
}) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  return (
    <div className="border border-gray-700 rounded-lg overflow-hidden">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center gap-3 p-3 bg-gray-800/50 hover:bg-gray-800 transition-colors"
      >
        <div className="p-2 rounded-lg bg-gray-700/50">
          <Icon className="w-4 h-4 text-emerald-400" />
        </div>
        <div className="flex-1 text-left">
          <div className="flex items-center gap-2">
            <span className="text-white font-medium text-sm">{label}</span>
            <span className="text-gray-500 text-xs">({weight}% weight)</span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 min-w-[100px]">
            <FactorBar percentage={score} colorClass={getScoreColor(score)} />
            <span className={`text-sm font-semibold ${getScoreTextColor(score)}`}>
              {score}
            </span>
          </div>
          {isExpanded ? (
            <ChevronUp className="w-4 h-4 text-gray-400" />
          ) : (
            <ChevronDown className="w-4 h-4 text-gray-400" />
          )}
        </div>
      </button>
      {isExpanded && (
        <div className="p-3 bg-gray-900/50 border-t border-gray-700 space-y-2">
          {children}
        </div>
      )}
    </div>
  );
}

// Individual factor row
function FactorRow({
  icon: Icon,
  label,
  value,
  signal,
}: {
  icon?: React.ElementType;
  label: string;
  value: string | number;
  signal?: string;
}) {
  return (
    <div className="flex items-center justify-between py-1.5 text-sm">
      <div className="flex items-center gap-2 text-gray-400">
        {Icon && <Icon className="w-3 h-3" />}
        <span>{label}</span>
      </div>
      <div className="flex items-center gap-2">
        <span className="text-gray-200">{value}</span>
        {signal && getSignalIcon(signal)}
      </div>
    </div>
  );
}

export default function PredictionFactors({
  data,
  coinName,
  coinSymbol,
  showDisclaimer = true,
}: PredictionFactorsProps) {
  const predictionColor = data.prediction === 'BULLISH'
    ? 'text-emerald-400'
    : data.prediction === 'BEARISH'
    ? 'text-red-400'
    : 'text-yellow-400';

  const predictionBg = data.prediction === 'BULLISH'
    ? 'bg-emerald-500/10 border-emerald-500/30'
    : data.prediction === 'BEARISH'
    ? 'bg-red-500/10 border-red-500/30'
    : 'bg-yellow-500/10 border-yellow-500/30';

  const sources = [
    'Binance',
    'Alternative.me',
    ...(FEATURES.coingecko ? ['CoinGecko'] : []),
    ...(FEATURES.defi ? ['DeFiLlama'] : []),
  ];

  return (
    <div className="space-y-4">
      {/* Disclaimer */}
      {showDisclaimer && <AIPredictionDisclaimer />}

      {/* Overall Prediction Header */}
      <div className={`p-4 rounded-xl border ${predictionBg}`}>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            {data.prediction === 'BULLISH' ? (
              <TrendingUp className={`w-6 h-6 ${predictionColor}`} />
            ) : data.prediction === 'BEARISH' ? (
              <TrendingDown className={`w-6 h-6 ${predictionColor}`} />
            ) : (
              <Minus className={`w-6 h-6 ${predictionColor}`} />
            )}
            <div>
              <h3 className={`text-xl font-bold ${predictionColor}`}>
                {data.prediction}
              </h3>
              <p className="text-gray-400 text-sm">
                {coinName ? `AI Prediction for ${coinName}` : 'AI Prediction'}
                {coinSymbol && <span className="text-gray-500"> ({coinSymbol})</span>}
              </p>
            </div>
          </div>
          <div className="text-right">
            <div className={`text-2xl font-bold ${predictionColor}`}>
              {data.confidence}%
            </div>
            <div className="text-gray-500 text-xs">confidence</div>
          </div>
        </div>

        {/* Overall Score Bar */}
        <div className="flex items-center gap-3">
          <span className="text-gray-400 text-sm">Overall Score:</span>
          <FactorBar percentage={data.overallScore} colorClass={getScoreColor(data.overallScore)} />
          <span className={`font-semibold ${getScoreTextColor(data.overallScore)}`}>
            {data.overallScore}/100
          </span>
        </div>
      </div>

      {/* Factor Breakdown */}
      <div className="space-y-2">
        <h4 className="text-gray-300 font-medium flex items-center gap-2 mb-3">
          <Activity className="w-4 h-4 text-emerald-400" />
          Contributing Factors
        </h4>

        {/* Technical Analysis */}
        <FactorCategory
          icon={BarChart3}
          label="Technical Analysis"
          weight={FACTOR_WEIGHTS.technical}
          score={data.technicalScore}
          defaultExpanded={true}
        >
          {data.technical ? (
            <>
              <FactorRow
                icon={LineChart}
                label="RSI (14)"
                value={
                  typeof data.technical.rsi.value === 'number'
                    ? `${data.technical.rsi.value} (${data.technical.rsi.signal})`
                    : 'Unavailable'
                }
                signal={data.technical.rsi.signal}
              />
              <FactorRow
                label="MACD"
                value={data.technical.macd.signal}
                signal={data.technical.macd.signal}
              />
              <FactorRow
                label="Price vs MA200"
                value={
                  typeof data.technical.priceVsMA200.percentage === 'number'
                    ? `${data.technical.priceVsMA200.percentage > 0 ? '+' : ''}${data.technical.priceVsMA200.percentage}%`
                    : 'Unavailable'
                }
                signal={data.technical.priceVsMA200.signal}
              />
              <FactorRow
                label="Bollinger Bands"
                value={data.technical.bollingerPosition}
              />
              <FactorRow
                label="Volume Trend"
                value={data.technical.volumeTrend}
                signal={data.technical.volumeTrend}
              />
              <FactorRow
                label="Support/Resistance"
                value={data.technical.supportResistance}
              />
            </>
          ) : (
            <p className="text-gray-500 text-sm">Technical data loading...</p>
          )}
        </FactorCategory>

        {/* Sentiment */}
        <FactorCategory
          icon={MessageCircle}
          label="Market Sentiment"
          weight={FACTOR_WEIGHTS.sentiment}
          score={data.sentimentScore}
        >
          {data.sentiment ? (
            <>
              <FactorRow
                icon={Activity}
                label="Fear & Greed Index"
                value={`${data.sentiment.fearGreedIndex.value} (${data.sentiment.fearGreedIndex.label})`}
                signal={data.sentiment.fearGreedIndex.value > 50 ? 'Bullish' : data.sentiment.fearGreedIndex.value < 30 ? 'Bearish' : 'Neutral'}
              />
              <FactorRow
                label="Social Sentiment"
                value={data.sentiment.socialSentiment}
                signal={data.sentiment.socialSentiment}
              />
              <FactorRow
                label="News Analysis"
                value={data.sentiment.newsAnalysis}
                signal={data.sentiment.newsAnalysis}
              />
              <FactorRow
                label="Twitter Mentions"
                value={
                  typeof data.sentiment.twitterMentions.change === 'number'
                    ? `${data.sentiment.twitterMentions.trend} (${data.sentiment.twitterMentions.change > 0 ? '+' : ''}${data.sentiment.twitterMentions.change}%)`
                    : `${data.sentiment.twitterMentions.trend} (Unavailable)`
                }
                signal={data.sentiment.twitterMentions.trend}
              />
            </>
          ) : (
            <p className="text-gray-500 text-sm">Sentiment data loading...</p>
          )}
        </FactorCategory>

        {/* On-Chain */}
        <FactorCategory
          icon={Link2}
          label="On-Chain Metrics"
          weight={FACTOR_WEIGHTS.onChain}
          score={data.onChainScore}
        >
          {data.onChain ? (
            <>
              <FactorRow
                icon={Wallet}
                label="Exchange Flow"
                value={`Net ${data.onChain.exchangeFlow.net}`}
                signal={data.onChain.exchangeFlow.signal}
              />
              <FactorRow
                icon={Users}
                label="Whale Activity"
                value={data.onChain.whaleActivity}
                signal={data.onChain.whaleActivity}
              />
              <FactorRow
                label="Active Addresses"
                value={
                  typeof data.onChain.activeAddresses.change === 'number'
                    ? `${data.onChain.activeAddresses.trend} (${data.onChain.activeAddresses.change > 0 ? '+' : ''}${data.onChain.activeAddresses.change}%)`
                    : `${data.onChain.activeAddresses.trend} (Unavailable)`
                }
                signal={data.onChain.activeAddresses.trend}
              />
              <FactorRow
                label="Holding Distribution"
                value={data.onChain.holdingDistribution}
              />
              {data.onChain.networkHashrate && (
                <FactorRow
                  label="Network Hashrate"
                  value={data.onChain.networkHashrate}
                  signal={data.onChain.networkHashrate}
                />
              )}
            </>
          ) : (
            <p className="text-gray-500 text-sm">On-chain data loading...</p>
          )}
        </FactorCategory>

        {/* Macro */}
        <FactorCategory
          icon={Globe}
          label="Macro Environment"
          weight={FACTOR_WEIGHTS.macro}
          score={data.macroScore}
        >
          {data.macro ? (
            <>
              <FactorRow
                label="VIX (Fear Index)"
                value={formatNumberOrUnavailable(data.macro.vix.value)}
                signal={data.macro.vix.signal}
              />
              <FactorRow
                icon={DollarSign}
                label="DXY (Dollar Index)"
                value={formatNumberOrUnavailable(data.macro.dxy.value)}
                signal={data.macro.dxy.signal}
              />
              <FactorRow
                label="Risk Environment"
                value={data.macro.riskEnvironment}
                signal={data.macro.riskEnvironment}
              />
              <FactorRow
                label="BTC Correlation"
                value={formatNumberOrUnavailable(data.macro.btcCorrelation, { suffix: '%' })}
              />
              <FactorRow
                label="Market Cycle"
                value={data.macro.marketCycle}
              />
            </>
          ) : (
            <p className="text-gray-500 text-sm">Macro data loading...</p>
          )}
        </FactorCategory>

        {/* Derivatives (informational, not weighted) */}
        {data.derivatives && (
          <FactorCategory
            icon={Zap}
            label="Derivatives Data"
            weight={0}
            score={
              typeof data.derivatives.fundingRate.value === 'number'
                ? (data.derivatives.fundingRate.value >= 0
                  ? Math.min(100, 50 + data.derivatives.fundingRate.value * 1000)
                  : Math.max(0, 50 + data.derivatives.fundingRate.value * 1000))
                : 0
            }
          >
            <div className="flex items-center gap-2 mb-2 text-xs text-gray-500">
              <Info className="w-3 h-3" />
              <span>Derivatives data is informational and not weighted in the prediction</span>
            </div>
            <FactorRow
              label="Funding Rate"
              value={
                typeof data.derivatives.fundingRate.value === 'number'
                  ? `${(data.derivatives.fundingRate.value * 100).toFixed(3)}%`
                  : 'Unavailable'
              }
              signal={data.derivatives.fundingRate.signal}
            />
            <FactorRow
              label="Open Interest (24h)"
              value={
                typeof data.derivatives.openInterest.change === 'number'
                  ? `${data.derivatives.openInterest.change > 0 ? '+' : ''}${data.derivatives.openInterest.change}%`
                  : 'Unavailable'
              }
              signal={data.derivatives.openInterest.signal}
            />
            <FactorRow
              label="Liquidations (24h)"
              value={
                typeof data.derivatives.liquidations24h.value === 'number'
                  ? `$${(data.derivatives.liquidations24h.value / 1000000).toFixed(1)}M (${data.derivatives.liquidations24h.predominant})`
                  : 'Unavailable'
              }
            />
            <FactorRow
              label="Long/Short Ratio"
              value={
                typeof data.derivatives.longShortRatio === 'number'
                  ? data.derivatives.longShortRatio.toFixed(2)
                  : 'Unavailable'
              }
              signal={
                typeof data.derivatives.longShortRatio === 'number'
                  ? (data.derivatives.longShortRatio > 1 ? 'Bullish' : data.derivatives.longShortRatio < 1 ? 'Bearish' : 'Neutral')
                  : 'Unavailable'
              }
            />
          </FactorCategory>
        )}
      </div>

      {/* Calculation Summary */}
      <div className="p-3 bg-gray-800/30 rounded-lg border border-gray-700">
        <h5 className="text-gray-400 text-xs font-medium mb-2">SCORE CALCULATION</h5>
        <div className="text-xs text-gray-500 space-y-1">
          <div className="flex items-center justify-between">
            <span>Technical ({FACTOR_WEIGHTS.technical}% weight)</span>
            <span className="text-gray-300">{data.technicalScore} x 0.{FACTOR_WEIGHTS.technical} = {(data.technicalScore * FACTOR_WEIGHTS.technical / 100).toFixed(1)}</span>
          </div>
          <div className="flex items-center justify-between">
            <span>Sentiment ({FACTOR_WEIGHTS.sentiment}% weight)</span>
            <span className="text-gray-300">{data.sentimentScore} x 0.{FACTOR_WEIGHTS.sentiment} = {(data.sentimentScore * FACTOR_WEIGHTS.sentiment / 100).toFixed(1)}</span>
          </div>
          <div className="flex items-center justify-between">
            <span>On-Chain ({FACTOR_WEIGHTS.onChain}% weight)</span>
            <span className="text-gray-300">{data.onChainScore} x 0.{FACTOR_WEIGHTS.onChain} = {(data.onChainScore * FACTOR_WEIGHTS.onChain / 100).toFixed(1)}</span>
          </div>
          <div className="flex items-center justify-between">
            <span>Macro ({FACTOR_WEIGHTS.macro}% weight)</span>
            <span className="text-gray-300">{data.macroScore} x 0.{FACTOR_WEIGHTS.macro} = {(data.macroScore * FACTOR_WEIGHTS.macro / 100).toFixed(1)}</span>
          </div>
          <div className="flex items-center justify-between pt-1 border-t border-gray-700 font-medium">
            <span className="text-gray-300">Overall Score</span>
            <span className={getScoreTextColor(data.overallScore)}>{data.overallScore}/100</span>
          </div>
        </div>
      </div>

      {/* Data Sources */}
      <div className="text-xs text-gray-500 flex items-center gap-2">
        <AlertTriangle className="w-3 h-3" />
        <span>Data sources: {sources.join(', ')}. Updated every 6 hours.</span>
      </div>
    </div>
  );
}

// Compact version for inline display
export function PredictionFactorsSummary({
  data,
}: {
  data: Pick<PredictionFactorsData, 'technicalScore' | 'sentimentScore' | 'onChainScore' | 'macroScore' | 'overallScore'>;
}) {
  const factors = [
    { label: 'Technical', score: data.technicalScore, weight: FACTOR_WEIGHTS.technical, icon: BarChart3 },
    { label: 'Sentiment', score: data.sentimentScore, weight: FACTOR_WEIGHTS.sentiment, icon: MessageCircle },
    { label: 'On-Chain', score: data.onChainScore, weight: FACTOR_WEIGHTS.onChain, icon: Link2 },
    { label: 'Macro', score: data.macroScore, weight: FACTOR_WEIGHTS.macro, icon: Globe },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {factors.map(({ label, score, weight, icon: Icon }) => (
        <div key={label} className="bg-gray-800/50 rounded-lg p-3 border border-gray-700">
          <div className="flex items-center gap-2 mb-2">
            <Icon className="w-4 h-4 text-emerald-400" />
            <span className="text-gray-400 text-xs">{label}</span>
            <span className="text-gray-600 text-xs">({weight}%)</span>
          </div>
          <div className="flex items-center gap-2">
            <FactorBar percentage={score} colorClass={getScoreColor(score)} />
            <span className={`text-sm font-semibold ${getScoreTextColor(score)}`}>
              {score}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}
