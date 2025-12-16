'use client';

import React, { useState, useRef, useEffect, createContext, useContext } from 'react';
import { GLOSSARY, GlossaryTerm, getTerm, findJargonInText } from '@/lib/glossary';

// ============================================
// USER LEVEL CONTEXT
// ============================================

type UserLevel = 'beginner' | 'intermediate' | 'pro';

interface UserPreferences {
  level: UserLevel;
  showTooltips: boolean;
  showExplanations: boolean;
  showTrafficLights: boolean;
}

const defaultPreferences: UserPreferences = {
  level: 'beginner',
  showTooltips: true,
  showExplanations: true,
  showTrafficLights: true,
};

const UserPreferencesContext = createContext<{
  preferences: UserPreferences;
  setPreferences: (prefs: Partial<UserPreferences>) => void;
}>({
  preferences: defaultPreferences,
  setPreferences: () => {},
});

export function UserPreferencesProvider({ children }: { children: React.ReactNode }) {
  const [preferences, setPreferencesState] = useState<UserPreferences>(defaultPreferences);

  const setPreferences = (prefs: Partial<UserPreferences>) => {
    setPreferencesState(prev => ({ ...prev, ...prefs }));
  };

  return (
    <UserPreferencesContext.Provider value={{ preferences, setPreferences }}>
      {children}
    </UserPreferencesContext.Provider>
  );
}

export function useUserPreferences() {
  return useContext(UserPreferencesContext);
}

// ============================================
// JARGON TOOLTIP COMPONENT
// ============================================

interface JargonTooltipProps {
  term: string;
  children?: React.ReactNode;
  showAlways?: boolean;
}

export function JargonTooltip({ term, children, showAlways = false }: JargonTooltipProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [position, setPosition] = useState<'top' | 'bottom'>('bottom');
  const triggerRef = useRef<HTMLSpanElement>(null);
  const { preferences } = useUserPreferences();

  // Get the term data
  const termKey = term.toLowerCase().replace(/\s+/g, '-');
  const termData = getTerm(termKey) || GLOSSARY[termKey];

  // Don't show tooltips if disabled or pro user (unless showAlways)
  if (!showAlways && (!preferences.showTooltips || preferences.level === 'pro')) {
    return <>{children || term}</>;
  }

  if (!termData) {
    return <>{children || term}</>;
  }

  const handleMouseEnter = () => {
    if (triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom;
      setPosition(spaceBelow < 200 ? 'top' : 'bottom');
    }
    setIsOpen(true);
  };

  return (
    <span className="relative inline-block">
      <span
        ref={triggerRef}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={() => setIsOpen(false)}
        className="border-b border-dashed border-blue-400 cursor-help text-blue-400 hover:text-blue-300 transition-colors"
      >
        {children || term}
      </span>

      {isOpen && (
        <div 
          className={`absolute z-50 w-80 p-4 bg-gray-800 border border-gray-600 rounded-xl shadow-2xl ${
            position === 'top' ? 'bottom-full mb-2' : 'top-full mt-2'
          } left-1/2 -translate-x-1/2`}
        >
          {/* Arrow */}
          <div 
            className={`absolute left-1/2 -translate-x-1/2 w-3 h-3 bg-gray-800 border-gray-600 transform rotate-45 ${
              position === 'top' ? 'bottom-0 translate-y-1/2 border-r border-b' : 'top-0 -translate-y-1/2 border-l border-t'
            }`}
          />

          {/* Header */}
          <div className="flex items-center gap-2 mb-2">
            {termData.emoji && <span className="text-xl">{termData.emoji}</span>}
            <h4 className="font-bold text-white">{termData.term}</h4>
            <span className={`text-xs px-2 py-0.5 rounded-full ${
              termData.difficulty === 'beginner' ? 'bg-green-500/20 text-green-400' :
              termData.difficulty === 'intermediate' ? 'bg-yellow-500/20 text-yellow-400' :
              'bg-red-500/20 text-red-400'
            }`}>
              {termData.difficulty}
            </span>
          </div>

          {/* Simple explanation */}
          <p className="text-gray-200 text-sm mb-3">{termData.simple}</p>

          {/* Example if available */}
          {termData.example && (
            <div className="bg-gray-700/50 rounded-lg p-2 mb-2">
              <p className="text-xs text-gray-400 mb-1">💡 Example:</p>
              <p className="text-xs text-gray-300">{termData.example}</p>
            </div>
          )}

          {/* Related terms */}
          {termData.related && termData.related.length > 0 && (
            <div className="flex items-center gap-1 flex-wrap text-xs text-gray-400">
              <span>Related:</span>
              {termData.related.slice(0, 3).map((r, i) => (
                <span key={r} className="text-blue-400">
                  {GLOSSARY[r]?.term || r}{i < Math.min(termData.related!.length - 1, 2) ? ',' : ''}
                </span>
              ))}
            </div>
          )}
        </div>
      )}
    </span>
  );
}

// ============================================
// AUTO JARGON HIGHLIGHT
// ============================================

interface AutoJargonProps {
  text: string;
  maxHighlights?: number;
}

export function AutoJargon({ text, maxHighlights = 5 }: AutoJargonProps) {
  const found = findJargonInText(text);
  
  if (found.length === 0) {
    return <>{text}</>;
  }

  // Only highlight up to maxHighlights unique terms
  const uniqueTerms = new Set<string>();
  const toHighlight = found.filter(f => {
    if (uniqueTerms.size >= maxHighlights) return false;
    if (uniqueTerms.has(f.key)) return false;
    uniqueTerms.add(f.key);
    return true;
  });

  // Build the result with highlights
  let lastIndex = 0;
  const parts: React.ReactNode[] = [];

  toHighlight.sort((a, b) => a.position - b.position).forEach((match, i) => {
    // Add text before this match
    if (match.position > lastIndex) {
      parts.push(text.slice(lastIndex, match.position));
    }
    
    // Add the highlighted term
    parts.push(
      <JargonTooltip key={i} term={match.key}>
        {text.slice(match.position, match.position + match.term.length)}
      </JargonTooltip>
    );
    
    lastIndex = match.position + match.term.length;
  });

  // Add remaining text
  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }

  return <>{parts}</>;
}

// ============================================
// TRAFFIC LIGHT INDICATOR
// ============================================

interface TrafficLightProps {
  status: 'good' | 'neutral' | 'warning' | 'danger';
  label?: string;
  tooltip?: string;
  size?: 'sm' | 'md' | 'lg';
}

export function TrafficLight({ status, label, tooltip, size = 'md' }: TrafficLightProps) {
  const { preferences } = useUserPreferences();
  
  if (!preferences.showTrafficLights && preferences.level === 'pro') {
    return label ? <span>{label}</span> : null;
  }

  const colors = {
    good: 'bg-green-500',
    neutral: 'bg-gray-400',
    warning: 'bg-yellow-500',
    danger: 'bg-red-500',
  };

  const sizes = {
    sm: 'w-2 h-2',
    md: 'w-3 h-3',
    lg: 'w-4 h-4',
  };

  const meanings = {
    good: '🟢 Good - This looks positive!',
    neutral: '⚪ Neutral - No strong signal',
    warning: '🟡 Watch - Something to keep an eye on',
    danger: '🔴 Caution - This needs attention',
  };

  const content = (
    <span className="inline-flex items-center gap-1.5">
      <span className={`${colors[status]} ${sizes[size]} rounded-full inline-block ${status === 'good' || status === 'danger' ? 'animate-pulse' : ''}`} />
      {label && <span>{label}</span>}
    </span>
  );

  if (tooltip || preferences.level === 'beginner') {
    return (
      <span className="group relative cursor-help">
        {content}
        <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-gray-800 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50 pointer-events-none">
          {tooltip || meanings[status]}
        </span>
      </span>
    );
  }

  return content;
}

// ============================================
// STEP BY STEP GUIDE
// ============================================

interface Step {
  title: string;
  description: string;
  action?: string;
  tip?: string;
}

interface StepGuideProps {
  title: string;
  steps: Step[];
  currentStep?: number;
  onStepComplete?: (step: number) => void;
}

export function StepGuide({ title, steps, currentStep = 0, onStepComplete }: StepGuideProps) {
  return (
    <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700">
      <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
        <span className="text-2xl">📋</span>
        {title}
      </h3>
      
      <div className="space-y-4">
        {steps.map((step, index) => (
          <div 
            key={index}
            className={`flex gap-4 p-4 rounded-lg transition-all ${
              index < currentStep 
                ? 'bg-green-500/10 border border-green-500/30' 
                : index === currentStep
                ? 'bg-blue-500/10 border border-blue-500/30'
                : 'bg-gray-700/30'
            }`}
          >
            {/* Step number */}
            <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center font-bold ${
              index < currentStep 
                ? 'bg-green-500 text-white' 
                : index === currentStep
                ? 'bg-blue-500 text-white'
                : 'bg-gray-600 text-gray-300'
            }`}>
              {index < currentStep ? '✓' : index + 1}
            </div>
            
            {/* Step content */}
            <div className="flex-1">
              <h4 className={`font-medium ${index <= currentStep ? 'text-white' : 'text-gray-400'}`}>
                {step.title}
              </h4>
              <p className="text-sm text-gray-400 mt-1">{step.description}</p>
              
              {step.tip && index === currentStep && (
                <div className="mt-2 p-2 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
                  <p className="text-xs text-yellow-400">💡 {step.tip}</p>
                </div>
              )}
              
              {step.action && index === currentStep && onStepComplete && (
                <button
                  onClick={() => onStepComplete(index)}
                  className="mt-3 px-4 py-2 bg-blue-500 hover:bg-blue-600 rounded-lg text-sm font-medium transition-colors"
                >
                  {step.action}
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ============================================
// SIMPLE METRIC CARD
// ============================================

interface SimpleMetricProps {
  label: string;
  value: string | number;
  change?: number;
  status?: 'good' | 'neutral' | 'warning' | 'danger';
  explanation?: string;
  jargonTerm?: string;
}

export function SimpleMetric({ label, value, change, status, explanation, jargonTerm }: SimpleMetricProps) {
  const { preferences } = useUserPreferences();
  
  return (
    <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700">
      {/* Label with optional jargon tooltip */}
      <div className="flex items-center gap-2 mb-2">
        {status && <TrafficLight status={status} size="sm" />}
        <span className="text-gray-400 text-sm">
          {jargonTerm ? <JargonTooltip term={jargonTerm}>{label}</JargonTooltip> : label}
        </span>
      </div>
      
      {/* Value */}
      <div className="text-2xl font-bold text-white">{value}</div>
      
      {/* Change indicator */}
      {change !== undefined && (
        <div className={`text-sm mt-1 ${change >= 0 ? 'text-green-400' : 'text-red-400'}`}>
          {change >= 0 ? '↑' : '↓'} {Math.abs(change).toFixed(2)}%
        </div>
      )}
      
      {/* Explanation for beginners */}
      {explanation && preferences.showExplanations && preferences.level === 'beginner' && (
        <div className="mt-3 p-2 bg-blue-500/10 border border-blue-500/20 rounded-lg">
          <p className="text-xs text-blue-300">💡 {explanation}</p>
        </div>
      )}
    </div>
  );
}

// ============================================
// LEARNING PATH COMPONENT
// ============================================

interface LearningPathProps {
  current: number;
  total: number;
  title: string;
}

export function LearningPath({ current, total, title }: LearningPathProps) {
  const progress = (current / total) * 100;
  
  return (
    <div className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-xl p-4 border border-blue-500/30">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm text-gray-300">{title}</span>
        <span className="text-sm text-blue-400">{current}/{total}</span>
      </div>
      <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
        <div 
          className="h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-500"
          style={{ width: `${progress}%` }}
        />
      </div>
      <p className="text-xs text-gray-400 mt-2">
        {progress === 100 
          ? '🎉 Complete! You\'re a pro now!' 
          : `${total - current} more steps to go!`}
      </p>
    </div>
  );
}

// ============================================
// WHAT THIS MEANS BOX
// ============================================

interface WhatThisMeansProps {
  children: React.ReactNode;
  learnMoreLink?: string;
}

export function WhatThisMeans({ children, learnMoreLink }: WhatThisMeansProps) {
  const { preferences } = useUserPreferences();
  
  if (preferences.level === 'pro' && !preferences.showExplanations) {
    return null;
  }
  
  return (
    <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4 mt-4">
      <div className="flex items-start gap-3">
        <span className="text-2xl">💡</span>
        <div className="flex-1">
          <h4 className="font-bold text-blue-400 mb-1">What This Means</h4>
          <div className="text-sm text-gray-300">{children}</div>
          {learnMoreLink && (
            <a 
              href={learnMoreLink}
              className="inline-block mt-2 text-xs text-blue-400 hover:text-blue-300"
            >
              Learn more →
            </a>
          )}
        </div>
      </div>
    </div>
  );
}

// ============================================
// QUICK ACTION CARD
// ============================================

interface QuickActionProps {
  icon: string;
  title: string;
  description: string;
  href: string;
  difficulty?: 'beginner' | 'intermediate' | 'advanced';
}

export function QuickAction({ icon, title, description, href, difficulty = 'beginner' }: QuickActionProps) {
  return (
    <a
      href={href}
      className="block p-4 bg-gray-800/50 hover:bg-gray-700/50 border border-gray-700 hover:border-blue-500/50 rounded-xl transition-all group"
    >
      <div className="flex items-start gap-3">
        <span className="text-3xl group-hover:scale-110 transition-transform">{icon}</span>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h3 className="font-bold text-white group-hover:text-blue-400 transition-colors">{title}</h3>
            <span className={`text-xs px-2 py-0.5 rounded-full ${
              difficulty === 'beginner' ? 'bg-green-500/20 text-green-400' :
              difficulty === 'intermediate' ? 'bg-yellow-500/20 text-yellow-400' :
              'bg-red-500/20 text-red-400'
            }`}>
              {difficulty}
            </span>
          </div>
          <p className="text-sm text-gray-400 mt-1">{description}</p>
        </div>
        <span className="text-gray-500 group-hover:text-blue-400 transition-colors">→</span>
      </div>
    </a>
  );
}

// ============================================
// BREADCRUMB NAVIGATION
// ============================================

interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[];
}

export function Breadcrumbs({ items }: BreadcrumbsProps) {
  return (
    <nav className="flex items-center gap-2 text-sm text-gray-400 mb-4">
      {items.map((item, index) => (
        <React.Fragment key={index}>
          {index > 0 && <span>/</span>}
          {item.href ? (
            <a href={item.href} className="hover:text-white transition-colors">
              {item.label}
            </a>
          ) : (
            <span className="text-white">{item.label}</span>
          )}
        </React.Fragment>
      ))}
    </nav>
  );
}

// ============================================
// USER LEVEL SELECTOR
// ============================================

export function UserLevelSelector() {
  const { preferences, setPreferences } = useUserPreferences();
  
  const levels = [
    { key: 'beginner', label: '🌱 Beginner', desc: 'Show all explanations & tips' },
    { key: 'intermediate', label: '📈 Intermediate', desc: 'Show some guidance' },
    { key: 'pro', label: '🚀 Pro', desc: 'Clean interface, no hand-holding' },
  ];
  
  return (
    <div className="flex gap-2">
      {levels.map(level => (
        <button
          key={level.key}
          onClick={() => setPreferences({ level: level.key as UserLevel })}
          className={`px-4 py-2 rounded-lg text-sm transition-all ${
            preferences.level === level.key
              ? 'bg-blue-500 text-white'
              : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
          }`}
          title={level.desc}
        >
          {level.label}
        </button>
      ))}
    </div>
  );
}

// ============================================
// EXPORT ALL
// ============================================

export {
  type UserLevel,
  type UserPreferences,
  type GlossaryTerm,
};
