'use client';

import React, { useRef, useEffect } from 'react';
import {
  Shield,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Info,
  TrendingUp,
  TrendingDown,
  Activity,
  Zap,
  DollarSign,
  Users,
  Lock
} from 'lucide-react';

// Progress bar component using refs to avoid inline style warnings
function ProgressBarFill({ percentage, colorClass }: { percentage: number; colorClass: string }) {
  const barRef = useRef<HTMLDivElement>(null);
  const safePercentage = Math.max(0, Math.min(100, percentage || 0));

  useEffect(() => {
    if (barRef.current) {
      barRef.current.style.width = `${safePercentage}%`;
    }
  }, [safePercentage]);

  return (
    <div
      ref={barRef}
      className={`h-full rounded-full transition-all duration-500 ${colorClass}`}
    />
  );
}

export type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'EXTREME';

interface RiskFactor {
  name: string;
  status: 'safe' | 'warning' | 'danger';
  description: string;
  icon?: React.ReactNode;
}

interface RiskScoreCardProps {
  overallRisk: RiskLevel;
  riskScore?: number; // 0-100 (higher = riskier)
  technicalRisk?: RiskLevel;
  sentimentRisk?: RiskLevel;
  marketRisk?: RiskLevel;
  volatilityRisk?: RiskLevel;
  factors?: RiskFactor[];
  compact?: boolean;
}

// Moved outside component to avoid recreation on each render
const getRiskStyle = (level: RiskLevel) => {
  switch (level) {
    case 'LOW':
      return {
        bg: 'bg-emerald-500/20',
        border: 'border-emerald-500/30',
        text: 'text-emerald-400',
        barColor: 'bg-emerald-500'
      };
    case 'MEDIUM':
      return {
        bg: 'bg-yellow-500/20',
        border: 'border-yellow-500/30',
        text: 'text-yellow-400',
        barColor: 'bg-yellow-500'
      };
    case 'HIGH':
      return {
        bg: 'bg-orange-500/20',
        border: 'border-orange-500/30',
        text: 'text-orange-400',
        barColor: 'bg-orange-500'
      };
    case 'EXTREME':
      return {
        bg: 'bg-red-500/20',
        border: 'border-red-500/30',
        text: 'text-red-400',
        barColor: 'bg-red-500'
      };
  }
};

const RISK_ICONS = {
  LOW: CheckCircle,
  MEDIUM: Info,
  HIGH: AlertTriangle,
  EXTREME: XCircle,
} as const;

const getStatusStyle = (status: 'safe' | 'warning' | 'danger') => {
  switch (status) {
    case 'safe':
      return { bg: 'bg-emerald-500/20', text: 'text-emerald-400', icon: CheckCircle };
    case 'warning':
      return { bg: 'bg-yellow-500/20', text: 'text-yellow-400', icon: AlertTriangle };
    case 'danger':
      return { bg: 'bg-red-500/20', text: 'text-red-400', icon: XCircle };
  }
};

export function RiskScoreCard({
  overallRisk,
  riskScore,
  technicalRisk,
  sentimentRisk,
  marketRisk,
  volatilityRisk,
  factors,
  compact = false
}: RiskScoreCardProps) {
  const overallStyle = getRiskStyle(overallRisk);
  const OverallIcon = RISK_ICONS[overallRisk];

  // Calculate risk score if not provided
  const displayScore = riskScore ?? (() => {
    switch (overallRisk) {
      case 'LOW': return 25;
      case 'MEDIUM': return 50;
      case 'HIGH': return 75;
      case 'EXTREME': return 95;
    }
  })();

  if (compact) {
    return (
      <div className={`rounded-lg p-3 ${overallStyle.bg} ${overallStyle.border} border`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className={`w-4 h-4 ${overallStyle.text}`} />
            <span className="text-gray-300 text-sm font-medium">Risk</span>
          </div>
          <div className={`flex items-center gap-1 ${overallStyle.text}`}>
            <OverallIcon className="w-4 h-4" />
            <span className="text-sm font-semibold">{overallRisk}</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-800/50 rounded-xl p-5 border border-gray-700">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <h3 className="text-white font-semibold flex items-center gap-2">
          <Shield className="w-5 h-5 text-emerald-400" />
          Risk Assessment
        </h3>
        <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg ${overallStyle.bg}`}>
          <OverallIcon className={`w-4 h-4 ${overallStyle.text}`} />
          <span className={`text-sm font-semibold ${overallStyle.text}`}>{overallRisk} RISK</span>
        </div>
      </div>

      {/* Risk Gauge */}
      <div className="mb-5">
        <div className="flex items-center justify-between mb-2">
          <span className="text-gray-400 text-sm">Risk Score</span>
          <span className={`font-bold text-lg ${overallStyle.text}`}>{displayScore}/100</span>
        </div>
        <div className="relative h-3 bg-gray-700 rounded-full overflow-hidden">
          {/* Background zones */}
          <div className="absolute inset-0 flex">
            <div className="w-1/4 bg-emerald-500/30" />
            <div className="w-1/4 bg-yellow-500/30" />
            <div className="w-1/4 bg-orange-500/30" />
            <div className="w-1/4 bg-red-500/30" />
          </div>
          {/* Fill */}
          <ProgressBarFill percentage={displayScore} colorClass={overallStyle.barColor} />
        </div>
        <div className="flex justify-between mt-1 text-xs text-gray-500">
          <span>Low</span>
          <span>Medium</span>
          <span>High</span>
          <span>Extreme</span>
        </div>
      </div>

      {/* Risk Categories */}
      {(technicalRisk || sentimentRisk || marketRisk || volatilityRisk) && (
        <div className="grid grid-cols-2 gap-3 mb-5">
          {technicalRisk && (
            <RiskCategoryBox
              label="Technical"
              level={technicalRisk}
              icon={<Activity className="w-4 h-4" />}
            />
          )}
          {sentimentRisk && (
            <RiskCategoryBox
              label="Sentiment"
              level={sentimentRisk}
              icon={<Users className="w-4 h-4" />}
            />
          )}
          {marketRisk && (
            <RiskCategoryBox
              label="Market"
              level={marketRisk}
              icon={<DollarSign className="w-4 h-4" />}
            />
          )}
          {volatilityRisk && (
            <RiskCategoryBox
              label="Volatility"
              level={volatilityRisk}
              icon={<Zap className="w-4 h-4" />}
            />
          )}
        </div>
      )}

      {/* Risk Factors */}
      {factors && factors.length > 0 && (
        <div className="pt-4 border-t border-gray-700">
          <h4 className="text-gray-400 text-sm mb-3 flex items-center gap-1">
            <AlertTriangle className="w-4 h-4" />
            Risk Factors
          </h4>
          <div className="space-y-2">
            {factors.map((factor, index) => {
              const statusStyle = getStatusStyle(factor.status);
              const StatusIcon = statusStyle.icon;

              return (
                <div
                  key={index}
                  className={`flex items-center justify-between p-2 rounded-lg ${statusStyle.bg}`}
                >
                  <div className="flex items-center gap-2">
                    {factor.icon || <StatusIcon className={`w-4 h-4 ${statusStyle.text}`} />}
                    <div>
                      <div className={`text-sm font-medium ${statusStyle.text}`}>{factor.name}</div>
                      <div className="text-gray-500 text-xs">{factor.description}</div>
                    </div>
                  </div>
                  <StatusIcon className={`w-5 h-5 ${statusStyle.text}`} />
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Risk Legend */}
      <div className="mt-5 pt-4 border-t border-gray-700">
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-1 text-emerald-400">
            <div className="w-2 h-2 rounded-full bg-emerald-500" />
            <span>Low Risk</span>
          </div>
          <div className="flex items-center gap-1 text-yellow-400">
            <div className="w-2 h-2 rounded-full bg-yellow-500" />
            <span>Medium</span>
          </div>
          <div className="flex items-center gap-1 text-orange-400">
            <div className="w-2 h-2 rounded-full bg-orange-500" />
            <span>High</span>
          </div>
          <div className="flex items-center gap-1 text-red-400">
            <div className="w-2 h-2 rounded-full bg-red-500" />
            <span>Extreme</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// Risk category box component
function RiskCategoryBox({
  label,
  level,
  icon
}: {
  label: string;
  level: RiskLevel;
  icon: React.ReactNode;
}) {
  const getRiskStyle = (l: RiskLevel) => {
    switch (l) {
      case 'LOW':
        return { bg: 'bg-emerald-500/10', text: 'text-emerald-400' };
      case 'MEDIUM':
        return { bg: 'bg-yellow-500/10', text: 'text-yellow-400' };
      case 'HIGH':
        return { bg: 'bg-orange-500/10', text: 'text-orange-400' };
      case 'EXTREME':
        return { bg: 'bg-red-500/10', text: 'text-red-400' };
    }
  };

  const style = getRiskStyle(level);

  return (
    <div className={`rounded-lg p-3 ${style.bg}`}>
      <div className="flex items-center gap-2 mb-1">
        <span className="text-gray-400">{icon}</span>
        <span className="text-gray-400 text-xs">{label}</span>
      </div>
      <div className={`font-semibold ${style.text}`}>{level}</div>
    </div>
  );
}

// Compact risk badge
export function RiskScoreBadge({
  level,
  score,
  size = 'sm'
}: {
  level: RiskLevel;
  score?: number;
  size?: 'xs' | 'sm' | 'md';
}) {
  const getRiskStyle = (l: RiskLevel) => {
    switch (l) {
      case 'LOW':
        return { bg: 'bg-emerald-500/20', text: 'text-emerald-400' };
      case 'MEDIUM':
        return { bg: 'bg-yellow-500/20', text: 'text-yellow-400' };
      case 'HIGH':
        return { bg: 'bg-orange-500/20', text: 'text-orange-400' };
      case 'EXTREME':
        return { bg: 'bg-red-500/20', text: 'text-red-400' };
    }
  };

  const style = getRiskStyle(level);

  const sizeClasses = {
    xs: 'text-[10px] px-1.5 py-0.5 gap-0.5',
    sm: 'text-xs px-2 py-1 gap-1',
    md: 'text-sm px-2.5 py-1.5 gap-1.5'
  };

  const iconSizes = {
    xs: 'w-2.5 h-2.5',
    sm: 'w-3 h-3',
    md: 'w-4 h-4'
  };

  return (
    <span className={`inline-flex items-center rounded-full font-medium ${style.bg} ${style.text} ${sizeClasses[size]}`}>
      <Shield className={iconSizes[size]} />
      <span>{level}</span>
      {score !== undefined && <span className="opacity-60">({score})</span>}
    </span>
  );
}

// On-chain metrics display
export function OnChainMetrics({
  exchangeFlow,
  whaleActivity,
  activeAddresses,
  compact = false
}: {
  exchangeFlow?: 'inflow' | 'outflow' | 'neutral';
  whaleActivity?: 'buying' | 'selling' | 'neutral';
  activeAddresses?: 'increasing' | 'decreasing' | 'stable';
  compact?: boolean;
}) {
  const hasAny = exchangeFlow !== undefined || whaleActivity !== undefined || activeAddresses !== undefined;

  const getFlowStyle = () => {
    if (exchangeFlow === undefined) {
      return { text: 'text-gray-400', label: 'Unavailable', signal: '' };
    }
    switch (exchangeFlow) {
      case 'outflow':
        return { text: 'text-emerald-400', label: 'Outflow', signal: 'Accumulation' };
      case 'inflow':
        return { text: 'text-red-400', label: 'Inflow', signal: 'Distribution' };
      default:
        return { text: 'text-gray-400', label: 'Neutral', signal: 'Balanced' };
    }
  };

  const getWhaleStyle = () => {
    if (whaleActivity === undefined) {
      return { text: 'text-gray-400', label: 'Unavailable', icon: Activity };
    }
    switch (whaleActivity) {
      case 'buying':
        return { text: 'text-emerald-400', label: 'Buying', icon: TrendingUp };
      case 'selling':
        return { text: 'text-red-400', label: 'Selling', icon: TrendingDown };
      default:
        return { text: 'text-gray-400', label: 'Neutral', icon: Activity };
    }
  };

  const getAddressStyle = () => {
    if (activeAddresses === undefined) {
      return { text: 'text-gray-400', label: 'Unavailable' };
    }
    switch (activeAddresses) {
      case 'increasing':
        return { text: 'text-emerald-400', label: 'Increasing' };
      case 'decreasing':
        return { text: 'text-red-400', label: 'Decreasing' };
      default:
        return { text: 'text-gray-400', label: 'Stable' };
    }
  };

  const flowStyle = getFlowStyle();
  const whaleStyle = getWhaleStyle();
  const addressStyle = getAddressStyle();
  const WhaleIcon = whaleStyle.icon;

  if (!hasAny) {
    return (
      <div className="bg-gray-800/50 rounded-xl p-5 border border-gray-700">
        <h3 className="text-white font-semibold flex items-center gap-2 mb-2">
          <Lock className="w-5 h-5 text-blue-400" />
          On-Chain Metrics
        </h3>
        <p className="text-sm text-gray-400">Unavailable for this asset from free sources.</p>
      </div>
    );
  }

  if (compact) {
    return (
      <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700">
        <h3 className="text-gray-300 font-medium flex items-center gap-2 mb-3">
          <Lock className="w-4 h-4 text-blue-400" />
          On-Chain
        </h3>
        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="bg-gray-900/50 rounded-lg p-2">
            <div className="text-gray-400 text-xs mb-1">Flow</div>
            <div className={`text-sm font-medium ${flowStyle.text}`}>{flowStyle.label}</div>
          </div>
          <div className="bg-gray-900/50 rounded-lg p-2">
            <div className="text-gray-400 text-xs mb-1">Whales</div>
            <div className={`text-sm font-medium ${whaleStyle.text}`}>{whaleStyle.label}</div>
          </div>
          <div className="bg-gray-900/50 rounded-lg p-2">
            <div className="text-gray-400 text-xs mb-1">Addresses</div>
            <div className={`text-sm font-medium ${addressStyle.text}`}>{addressStyle.label}</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-800/50 rounded-xl p-5 border border-gray-700">
      <h3 className="text-white font-semibold flex items-center gap-2 mb-4">
        <Lock className="w-5 h-5 text-blue-400" />
        On-Chain Metrics
      </h3>

      <div className="space-y-4">
        {/* Exchange Flow */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-gray-400" />
            <span className="text-gray-400 text-sm">Exchange Flow</span>
          </div>
          <div className={`font-medium ${flowStyle.text}`}>
            {flowStyle.label} ({flowStyle.signal})
          </div>
        </div>

        {/* Whale Activity */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-gray-400" />
            <span className="text-gray-400 text-sm">Whale Activity</span>
          </div>
          <div className={`flex items-center gap-1 font-medium ${whaleStyle.text}`}>
            <WhaleIcon className="w-4 h-4" />
            {whaleStyle.label}
          </div>
        </div>

        {/* Active Addresses */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-gray-400" />
            <span className="text-gray-400 text-sm">Active Addresses</span>
          </div>
          <div className={`font-medium ${addressStyle.text}`}>{addressStyle.label}</div>
        </div>
      </div>
    </div>
  );
}
