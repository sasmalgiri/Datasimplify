'use client';

import { useState, ReactNode } from 'react';

// Traffic Light Indicator Component
export function TrafficLight({ 
  status, 
  label, 
  explanation 
}: { 
  status: 'good' | 'neutral' | 'bad';
  label: string;
  explanation?: string;
}) {
  const colors = {
    good: { bg: 'bg-green-100', text: 'text-green-700', dot: 'bg-green-500', emoji: '🟢' },
    neutral: { bg: 'bg-yellow-100', text: 'text-yellow-700', dot: 'bg-yellow-500', emoji: '🟡' },
    bad: { bg: 'bg-red-100', text: 'text-red-700', dot: 'bg-red-500', emoji: '🔴' }
  };

  const style = colors[status];

  return (
    <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full ${style.bg} ${style.text}`}>
      <span className={`w-2 h-2 rounded-full ${style.dot}`}></span>
      <span className="text-sm font-medium">{label}</span>
      {explanation && (
        <span className="text-xs opacity-75">({explanation})</span>
      )}
    </div>
  );
}

// Beginner Tip Component
export function BeginnerTip({ 
  children, 
  title = "💡 Beginner Tip" 
}: { 
  children: ReactNode;
  title?: string;
}) {
  const [isVisible, setIsVisible] = useState(true);

  if (!isVisible) return null;

  return (
    <div className="bg-blue-50 border-l-4 border-blue-400 p-4 rounded-r-lg mb-4">
      <div className="flex justify-between items-start">
        <div>
          <p className="text-blue-800 font-medium text-sm">{title}</p>
          <p className="text-blue-700 text-sm mt-1">{children}</p>
        </div>
        <button 
          onClick={() => setIsVisible(false)}
          className="text-blue-400 hover:text-blue-600 text-lg"
        >
          ×
        </button>
      </div>
    </div>
  );
}

// Explanation Card with expand/collapse
export function ExplanationCard({
  metric,
  value,
  explanation,
  whatItMeans,
  status,
  learnMoreLink
}: {
  metric: string;
  value: string | number;
  explanation: string;
  whatItMeans?: string;
  status?: 'good' | 'neutral' | 'bad';
  learnMoreLink?: string;
}) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start">
        <div>
          <p className="text-gray-500 text-sm">{metric}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
        </div>
        {status && <TrafficLight status={status} label={status === 'good' ? 'Good' : status === 'neutral' ? 'Neutral' : 'Watch'} />}
      </div>
      
      <button 
        onClick={() => setIsExpanded(!isExpanded)}
        className="text-blue-600 text-sm mt-2 flex items-center gap-1 hover:text-blue-800"
      >
        💡 What does this mean?
        <span className={`transform transition-transform ${isExpanded ? 'rotate-180' : ''}`}>▼</span>
      </button>
      
      {isExpanded && (
        <div className="mt-3 pt-3 border-t border-gray-100">
          <p className="text-gray-600 text-sm">{explanation}</p>
          {whatItMeans && (
            <p className="text-gray-800 text-sm mt-2 bg-gray-50 p-2 rounded">
              <strong>For you:</strong> {whatItMeans}
            </p>
          )}
          {learnMoreLink && (
            <a href={learnMoreLink} className="text-blue-600 text-sm mt-2 inline-block hover:underline">
              Learn more →
            </a>
          )}
        </div>
      )}
    </div>
  );
}

// Simple Tooltip Component
export function Tooltip({
  children,
  text,
  position = 'top'
}: {
  children: ReactNode;
  text: string;
  position?: 'top' | 'bottom' | 'left' | 'right';
}) {
  const [isVisible, setIsVisible] = useState(false);

  const positionClasses = {
    top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
    bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
    left: 'right-full top-1/2 -translate-y-1/2 mr-2',
    right: 'left-full top-1/2 -translate-y-1/2 ml-2'
  };

  const arrowClasses = {
    top: 'top-full left-1/2 -translate-x-1/2 border-t-gray-800',
    bottom: 'bottom-full left-1/2 -translate-x-1/2 border-b-gray-800',
    left: 'left-full top-1/2 -translate-y-1/2 border-l-gray-800',
    right: 'right-full top-1/2 -translate-y-1/2 border-r-gray-800'
  };

  return (
    <span className="relative inline-flex items-center">
      <span
        onMouseEnter={() => setIsVisible(true)}
        onMouseLeave={() => setIsVisible(false)}
        className="cursor-help border-b border-dotted border-emerald-400 text-emerald-400"
      >
        {children}
      </span>
      {isVisible && (
        <span className={`absolute z-[100] ${positionClasses[position]} px-3 py-2 text-sm text-white bg-gray-800 rounded-lg shadow-lg max-w-xs`}>
          {text}
          <span className={`absolute ${arrowClasses[position]} border-4 border-transparent`}></span>
        </span>
      )}
    </span>
  );
}

// Help Icon with Tooltip (for inline help)
export function HelpTooltip({ text }: { text: string }) {
  const [isVisible, setIsVisible] = useState(false);

  return (
    <span className="relative inline-flex items-center ml-1">
      <span
        onMouseEnter={() => setIsVisible(true)}
        onMouseLeave={() => setIsVisible(false)}
        className="cursor-help w-4 h-4 rounded-full bg-gray-700 text-gray-400 text-xs flex items-center justify-center hover:bg-emerald-600 hover:text-white transition-colors"
      >
        ?
      </span>
      {isVisible && (
        <span className="absolute z-[100] bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 text-sm text-white bg-gray-800 rounded-lg shadow-lg max-w-xs whitespace-normal">
          {text}
          <span className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-800"></span>
        </span>
      )}
    </span>
  );
}

// Info Icon Button
export function InfoButton({ explanation }: { explanation: string }) {
  const [isVisible, setIsVisible] = useState(false);

  return (
    <span className="relative inline-block ml-1">
      <button
        onClick={() => setIsVisible(!isVisible)}
        className="w-4 h-4 rounded-full bg-gray-200 text-gray-600 text-xs hover:bg-blue-100 hover:text-blue-600"
      >
        ?
      </button>
      {isVisible && (
        <div className="absolute z-20 bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-4 py-3 text-sm text-gray-700 bg-white border border-gray-200 rounded-lg shadow-lg w-64">
          {explanation}
          <button 
            onClick={() => setIsVisible(false)}
            className="absolute top-1 right-2 text-gray-400 hover:text-gray-600"
          >
            ×
          </button>
        </div>
      )}
    </span>
  );
}

// User Level Selector
export function UserLevelSelector({
  currentLevel,
  onLevelChange
}: {
  currentLevel: 'beginner' | 'intermediate' | 'pro';
  onLevelChange: (level: 'beginner' | 'intermediate' | 'pro') => void;
}) {
  const levels = [
    { id: 'beginner' as const, label: '🔰 Beginner', desc: 'Show all explanations' },
    { id: 'intermediate' as const, label: '📊 Intermediate', desc: 'Some tooltips' },
    { id: 'pro' as const, label: '🎯 Pro', desc: 'Clean interface' }
  ];

  return (
    <div className="flex gap-2 p-1 bg-gray-100 rounded-lg">
      {levels.map((level) => (
        <button
          key={level.id}
          onClick={() => onLevelChange(level.id)}
          className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
            currentLevel === level.id
              ? 'bg-white shadow text-blue-600'
              : 'text-gray-600 hover:text-gray-900'
          }`}
          title={level.desc}
        >
          {level.label}
        </button>
      ))}
    </div>
  );
}

// Progress Bar Component
export function ProgressBar({
  value,
  max,
  label,
  color = 'blue'
}: {
  value: number;
  max: number;
  label?: string;
  color?: 'blue' | 'green' | 'red' | 'yellow';
}) {
  const percentage = Math.min((value / max) * 100, 100);
  const colorClasses = {
    blue: 'bg-blue-500',
    green: 'bg-green-500',
    red: 'bg-red-500',
    yellow: 'bg-yellow-500'
  };

  return (
    <div>
      {label && (
        <div className="flex justify-between text-sm mb-1">
          <span className="text-gray-600">{label}</span>
          <span className="text-gray-900 font-medium">{value}/{max}</span>
        </div>
      )}
      <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
        <div 
          className={`h-full ${colorClasses[color]} transition-all duration-500`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}

// Simple Stat Card
export function StatCard({
  title,
  value,
  change,
  changeLabel,
  icon,
  explanation
}: {
  title: string;
  value: string | number;
  change?: number;
  changeLabel?: string;
  icon?: string;
  explanation?: string;
}) {
  const isPositive = change && change > 0;
  const isNegative = change && change < 0;

  return (
    <div className="bg-white rounded-xl p-5 border border-gray-100 hover:shadow-lg transition-shadow">
      <div className="flex justify-between items-start">
        <div>
          <p className="text-gray-500 text-sm flex items-center gap-1">
            {title}
            {explanation && <InfoButton explanation={explanation} />}
          </p>
          <p className="text-2xl font-bold mt-1">{value}</p>
          {change !== undefined && (
            <p className={`text-sm mt-1 ${isPositive ? 'text-green-600' : isNegative ? 'text-red-600' : 'text-gray-600'}`}>
              {isPositive ? '↑' : isNegative ? '↓' : '→'} {Math.abs(change)}%
              {changeLabel && <span className="text-gray-500 ml-1">{changeLabel}</span>}
            </p>
          )}
        </div>
        {icon && <span className="text-3xl">{icon}</span>}
      </div>
    </div>
  );
}

// Risk Meter Component
export function RiskMeter({
  level,
  label
}: {
  level: 1 | 2 | 3 | 4 | 5;
  label?: string;
}) {
  const labels = ['Very Low', 'Low', 'Medium', 'High', 'Very High'];
  const colors = ['bg-green-500', 'bg-green-400', 'bg-yellow-500', 'bg-orange-500', 'bg-red-500'];
  const emojis = ['🛡️', '✅', '⚠️', '🔶', '🔴'];

  return (
    <div>
      <div className="flex gap-1 mb-2">
        {[1, 2, 3, 4, 5].map((i) => (
          <div
            key={i}
            className={`h-2 flex-1 rounded ${i <= level ? colors[level - 1] : 'bg-gray-200'}`}
          />
        ))}
      </div>
      <p className="text-sm text-center">
        <span className="mr-1">{emojis[level - 1]}</span>
        <span className="font-medium">{label || labels[level - 1]} Risk</span>
      </p>
    </div>
  );
}

// Section Header with explanation
export function SectionHeader({
  title,
  subtitle,
  explanation,
  action
}: {
  title: string;
  subtitle?: string;
  explanation?: string;
  action?: ReactNode;
}) {
  return (
    <div className="mb-6">
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            {title}
            {explanation && <InfoButton explanation={explanation} />}
          </h2>
          {subtitle && <p className="text-gray-500 mt-1">{subtitle}</p>}
        </div>
        {action && <div>{action}</div>}
      </div>
    </div>
  );
}
