'use client';

import { useRef, useEffect } from 'react';
import {
  TrendingUp,
  TrendingDown,
  Minus,
  AlertTriangle,
  CheckCircle,
  Info,
  Activity,
  Target,
  Shield,
  ChevronRight
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

export type PredictionDirection = 'BULLISH' | 'BEARISH' | 'NEUTRAL';
export type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'EXTREME';

interface PredictionCardProps {
  prediction: PredictionDirection;
  confidence: number;
  riskLevel: RiskLevel;
  reasons: string[];
  technicalScore?: number;
  sentimentScore?: number;
  onChainScore?: number;
  macroScore?: number;
  overallScore?: number;
  coinName?: string;
  compact?: boolean;
  showDetails?: boolean;
  onClick?: () => void;
}

export function PredictionCard({
  prediction,
  confidence,
  riskLevel,
  reasons,
  technicalScore,
  sentimentScore,
  onChainScore,
  macroScore,
  overallScore,
  coinName,
  compact = false,
  showDetails = true,
  onClick
}: PredictionCardProps) {
  // Get prediction colors and icons
  const getPredictionStyle = () => {
    switch (prediction) {
      case 'BULLISH':
        return {
          bgClass: 'bg-emerald-500/10 border-emerald-500/30',
          textClass: 'text-emerald-400',
          icon: TrendingUp,
          label: 'Bullish'
        };
      case 'BEARISH':
        return {
          bgClass: 'bg-red-500/10 border-red-500/30',
          textClass: 'text-red-400',
          icon: TrendingDown,
          label: 'Bearish'
        };
      default:
        return {
          bgClass: 'bg-yellow-500/10 border-yellow-500/30',
          textClass: 'text-yellow-400',
          icon: Minus,
          label: 'Neutral'
        };
    }
  };

  // Get risk level colors
  const getRiskStyle = () => {
    switch (riskLevel) {
      case 'LOW':
        return { bgClass: 'bg-emerald-500/20', textClass: 'text-emerald-400' };
      case 'MEDIUM':
        return { bgClass: 'bg-yellow-500/20', textClass: 'text-yellow-400' };
      case 'HIGH':
        return { bgClass: 'bg-orange-500/20', textClass: 'text-orange-400' };
      case 'EXTREME':
        return { bgClass: 'bg-red-500/20', textClass: 'text-red-400' };
    }
  };

  const predictionStyle = getPredictionStyle();
  const riskStyle = getRiskStyle();
  const PredictionIcon = predictionStyle.icon;

  // Compact badge version
  if (compact) {
    return (
      <button
        onClick={onClick}
        className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-full border ${predictionStyle.bgClass} ${predictionStyle.textClass} text-xs font-medium transition-all hover:scale-105`}
      >
        <PredictionIcon className="w-3 h-3" />
        <span>{predictionStyle.label}</span>
        <span className="text-gray-500">·</span>
        <span className="text-gray-400">{confidence}%</span>
      </button>
    );
  }

  return (
    <div
      className={`bg-gray-800/50 rounded-xl border ${predictionStyle.bgClass} p-4 ${onClick ? 'cursor-pointer hover:bg-gray-800/70 transition-colors' : ''}`}
      onClick={onClick}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg ${predictionStyle.bgClass}`}>
            <PredictionIcon className={`w-5 h-5 ${predictionStyle.textClass}`} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className={`text-lg font-semibold ${predictionStyle.textClass}`}>
                {predictionStyle.label}
              </h3>
              {coinName && (
                <span className="text-gray-500 text-sm">for {coinName}</span>
              )}
            </div>
            <p className="text-gray-400 text-sm">AI Prediction</p>
          </div>
        </div>

        {onClick && (
          <ChevronRight className="w-5 h-5 text-gray-500" />
        )}
      </div>

      {/* Confidence Meter */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-gray-400 text-sm flex items-center gap-1">
            <Target className="w-4 h-4" />
            Confidence
          </span>
          <span className={`font-semibold ${predictionStyle.textClass}`}>
            {confidence}%
          </span>
        </div>
        <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
          <ProgressBarFill
            percentage={confidence}
            colorClass={
              prediction === 'BULLISH'
                ? 'bg-emerald-500'
                : prediction === 'BEARISH'
                ? 'bg-red-500'
                : 'bg-yellow-500'
            }
          />
        </div>
      </div>

      {/* Risk Level */}
      <div className="flex items-center justify-between mb-4">
        <span className="text-gray-400 text-sm flex items-center gap-1">
          <Shield className="w-4 h-4" />
          Risk Level
        </span>
        <span className={`px-2 py-0.5 rounded text-xs font-medium ${riskStyle.bgClass} ${riskStyle.textClass}`}>
          {riskLevel}
        </span>
      </div>

      {/* Key Reasons */}
      {reasons.length > 0 && (
        <div className="mb-4">
          <h4 className="text-gray-400 text-sm mb-2 flex items-center gap-1">
            <Info className="w-4 h-4" />
            Key Factors
          </h4>
          <ul className="space-y-1.5">
            {reasons.slice(0, 3).map((reason, index) => (
              <li key={index} className="flex items-start gap-2 text-sm">
                <CheckCircle className={`w-4 h-4 mt-0.5 flex-shrink-0 ${predictionStyle.textClass}`} />
                <span className="text-gray-300">{reason}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Score Breakdown */}
      {showDetails && (technicalScore !== undefined || sentimentScore !== undefined) && (
        <div className="pt-4 border-t border-gray-700">
          <h4 className="text-gray-400 text-sm mb-3 flex items-center gap-1">
            <Activity className="w-4 h-4" />
            Score Breakdown
          </h4>
          <div className="grid grid-cols-2 gap-3">
            {technicalScore !== undefined && (
              <ScoreBar label="Technical" score={technicalScore} />
            )}
            {sentimentScore !== undefined && (
              <ScoreBar label="Sentiment" score={sentimentScore} />
            )}
            {onChainScore !== undefined && (
              <ScoreBar label="On-Chain" score={onChainScore} />
            )}
            {macroScore !== undefined && (
              <ScoreBar label="Macro" score={macroScore} />
            )}
          </div>
          {overallScore !== undefined && (
            <div className="mt-3 pt-3 border-t border-gray-700">
              <div className="flex items-center justify-between">
                <span className="text-gray-300 font-medium">Overall Score</span>
                <span className={`text-lg font-bold ${
                  overallScore > 60 ? 'text-emerald-400' :
                  overallScore < 40 ? 'text-red-400' : 'text-yellow-400'
                }`}>
                  {overallScore}/100
                </span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// Score bar component
function ScoreBar({ label, score }: { label: string; score: number }) {
  const getScoreColor = (s: number) => {
    if (s >= 60) return 'bg-emerald-500';
    if (s <= 40) return 'bg-red-500';
    return 'bg-yellow-500';
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <span className="text-gray-400 text-xs">{label}</span>
        <span className="text-gray-300 text-xs font-medium">{score}</span>
      </div>
      <div className="h-1.5 bg-gray-700 rounded-full overflow-hidden">
        <ProgressBarFill percentage={score} colorClass={getScoreColor(score)} />
      </div>
    </div>
  );
}

// Mini prediction badge for tables/lists
export function PredictionBadge({
  prediction,
  confidence,
  size = 'sm'
}: {
  prediction: PredictionDirection;
  confidence: number;
  size?: 'xs' | 'sm' | 'md';
}) {
  const getStyle = () => {
    switch (prediction) {
      case 'BULLISH':
        return { bg: 'bg-emerald-500/20', text: 'text-emerald-400', icon: TrendingUp };
      case 'BEARISH':
        return { bg: 'bg-red-500/20', text: 'text-red-400', icon: TrendingDown };
      default:
        return { bg: 'bg-yellow-500/20', text: 'text-yellow-400', icon: Minus };
    }
  };

  const style = getStyle();
  const Icon = style.icon;

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
      <Icon className={iconSizes[size]} />
      <span>{prediction === 'BULLISH' ? 'Bull' : prediction === 'BEARISH' ? 'Bear' : 'Neutral'}</span>
      <span className="opacity-60">{confidence}%</span>
    </span>
  );
}

// Risk badge component
export function RiskBadge({ level, size = 'sm' }: { level: RiskLevel; size?: 'xs' | 'sm' | 'md' }) {
  const getStyle = () => {
    switch (level) {
      case 'LOW':
        return { bg: 'bg-emerald-500/20', text: 'text-emerald-400', icon: CheckCircle };
      case 'MEDIUM':
        return { bg: 'bg-yellow-500/20', text: 'text-yellow-400', icon: Info };
      case 'HIGH':
        return { bg: 'bg-orange-500/20', text: 'text-orange-400', icon: AlertTriangle };
      case 'EXTREME':
        return { bg: 'bg-red-500/20', text: 'text-red-400', icon: AlertTriangle };
    }
  };

  const style = getStyle();
  const Icon = style.icon;

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
      <Icon className={iconSizes[size]} />
      <span>{level}</span>
    </span>
  );
}
