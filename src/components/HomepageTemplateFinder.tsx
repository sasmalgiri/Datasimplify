'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import Link from 'next/link';
import {
  parseUserIntent,
  routeToTemplate,
  REPORT_TYPE_QUICK_REPLIES,
  TIMEFRAME_QUICK_REPLIES,
  COIN_PRESET_QUICK_REPLIES,
  type ParsedIntent,
  type RoutedTemplate,
  type QuickReply,
} from '@/lib/templates/reportAssistant';

interface HomepageTemplateFinderProps {
  className?: string;
}

type FinderStep = 'initial' | 'clarify_type' | 'clarify_coins' | 'clarify_timeframe' | 'result';

interface Message {
  id: string;
  type: 'user' | 'assistant';
  content: string;
  quickReplies?: QuickReply[];
  showResult?: boolean;
}

/**
 * HomepageTemplateFinder - Compact template search for the homepage
 *
 * NOTE: This is a KEYWORD-BASED SEARCH tool, NOT AI.
 * It uses semantic matching to understand natural language queries
 * and matches them against our template catalog.
 */
export default function HomepageTemplateFinder({ className = '' }: HomepageTemplateFinderProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      type: 'assistant',
      content:
        "What kind of Excel template are you looking for? Describe it in your own words, or pick a type below.",
      quickReplies: REPORT_TYPE_QUICK_REPLIES,
    },
  ]);
  const [inputValue, setInputValue] = useState('');
  const [currentStep, setCurrentStep] = useState<FinderStep>('initial');
  const [pendingIntent, setPendingIntent] = useState<ParsedIntent | null>(null);
  const [result, setResult] = useState<RoutedTemplate | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const addMessage = useCallback((message: Omit<Message, 'id'>) => {
    setMessages((prev) => [...prev, { ...message, id: Date.now().toString() }]);
  }, []);

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      if (!inputValue.trim()) return;
      processInput(inputValue.trim());
      setInputValue('');
    },
    [inputValue]
  );

  const handleQuickReply = useCallback((reply: QuickReply) => {
    processInput(reply.value, reply.label);
  }, [currentStep, pendingIntent]);

  const processInput = useCallback(
    (value: string, displayText?: string) => {
      addMessage({ type: 'user', content: displayText || value });

      switch (currentStep) {
        case 'initial':
        case 'clarify_type':
          handleInitialInput(value);
          break;
        case 'clarify_coins':
          handleCoinsInput(value);
          break;
        case 'clarify_timeframe':
          handleTimeframeInput(value);
          break;
        default:
          handleInitialInput(value);
      }
    },
    [currentStep, pendingIntent, addMessage]
  );

  const handleInitialInput = useCallback(
    (value: string) => {
      const reportTypeReply = REPORT_TYPE_QUICK_REPLIES.find((r) => r.value === value);
      let intent: ParsedIntent;

      if (reportTypeReply) {
        intent = parseUserIntent(`I want a ${reportTypeReply.label} report`);
      } else {
        intent = parseUserIntent(value);
      }

      if (intent.isRefused) {
        addMessage({
          type: 'assistant',
          content: "I search for templates only. Try: 'market overview', 'track BTC', or 'portfolio tracker'.",
          quickReplies: REPORT_TYPE_QUICK_REPLIES,
        });
        return;
      }

      setPendingIntent(intent);

      if (!intent.reportType) {
        setCurrentStep('clarify_type');
        addMessage({
          type: 'assistant',
          content: "Which type of template? Pick one or describe what data you want to see.",
          quickReplies: REPORT_TYPE_QUICK_REPLIES,
        });
        return;
      }

      if (intent.coins.length === 0 && intent.reportType !== 'market' && intent.reportType !== 'screener') {
        setCurrentStep('clarify_coins');
        addMessage({
          type: 'assistant',
          content: intent.understood
            ? `${intent.understood}\n\nWhich coins?`
            : 'Which coins do you want to track?',
          quickReplies: COIN_PRESET_QUICK_REPLIES,
        });
        return;
      }

      if (!intent.timeframe) {
        setCurrentStep('clarify_timeframe');
        addMessage({
          type: 'assistant',
          content: 'What time range?',
          quickReplies: TIMEFRAME_QUICK_REPLIES,
        });
        return;
      }

      showResult(intent);
    },
    [addMessage]
  );

  const handleCoinsInput = useCallback(
    (value: string) => {
      if (!pendingIntent) return;

      let coins: string[] = [];
      if (value === 'top5') coins = ['BTC', 'ETH', 'SOL', 'BNB', 'XRP'];
      else if (value === 'top10') coins = ['BTC', 'ETH', 'SOL', 'BNB', 'XRP', 'ADA', 'DOGE', 'AVAX', 'DOT', 'MATIC'];
      else if (value === 'defi') coins = ['UNI', 'AAVE', 'LINK', 'CRV', 'MKR'];
      else if (value === 'custom') {
        addMessage({ type: 'assistant', content: 'Type coin symbols (e.g. BTC, ETH, SOL):' });
        return;
      } else {
        coins = value.toUpperCase().split(/[,\s]+/).filter((c) => c.length >= 2 && c.length <= 6);
      }

      if (coins.length === 0) {
        addMessage({ type: 'assistant', content: "Try: BTC, ETH, SOL" });
        return;
      }

      const updatedIntent: ParsedIntent = { ...pendingIntent, coins };
      setPendingIntent(updatedIntent);

      if (!updatedIntent.timeframe) {
        setCurrentStep('clarify_timeframe');
        addMessage({
          type: 'assistant',
          content: `Got it: ${coins.join(', ')}. Time range?`,
          quickReplies: TIMEFRAME_QUICK_REPLIES,
        });
        return;
      }

      showResult(updatedIntent);
    },
    [pendingIntent, addMessage]
  );

  const handleTimeframeInput = useCallback(
    (value: string) => {
      if (!pendingIntent) return;

      const tfMap: Record<string, string> = { '1d': '1d', '1h': '1h', '1w': '1w', daily: '1d', hourly: '1h', weekly: '1w' };
      const timeframe = tfMap[value.toLowerCase()] || '1d';

      const updatedIntent: ParsedIntent = { ...pendingIntent, timeframe };
      setPendingIntent(updatedIntent);
      showResult(updatedIntent);
    },
    [pendingIntent]
  );

  const showResult = useCallback(
    (intent: ParsedIntent) => {
      const recommendation = routeToTemplate(intent, true);

      if (!recommendation) {
        addMessage({
          type: 'assistant',
          content: "No match found. Try different keywords.",
          quickReplies: REPORT_TYPE_QUICK_REPLIES,
        });
        setCurrentStep('initial');
        return;
      }

      setResult(recommendation);
      setCurrentStep('result');

      const tfLabels: Record<string, string> = { '1d': 'Daily', '1h': 'Hourly', '1w': 'Weekly' };
      addMessage({
        type: 'assistant',
        content: `Found: **${recommendation.primary.name}**\n${recommendation.primary.best_for}\n\nCoins: ${recommendation.config.coins.join(', ')}\nTime: ${tfLabels[recommendation.config.timeframe] || recommendation.config.timeframe}`,
        showResult: true,
      });
    },
    [addMessage]
  );

  const resetFinder = useCallback(() => {
    setMessages([
      {
        id: Date.now().toString(),
        type: 'assistant',
        content: "What kind of Excel template are you looking for?",
        quickReplies: REPORT_TYPE_QUICK_REPLIES,
      },
    ]);
    setCurrentStep('initial');
    setPendingIntent(null);
    setResult(null);
  }, []);

  return (
    <div className={`bg-gray-800/50 backdrop-blur-sm rounded-xl border border-gray-700/50 flex flex-col h-[450px] ${className}`}>
      {/* Header with clear "NOT AI" branding */}
      <div className="bg-gradient-to-r from-emerald-900/30 to-gray-800/50 border-b border-gray-700/50 px-4 py-3 flex-shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center">
              <svg className="w-4 h-4 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <div>
              <h3 className="font-semibold text-white text-sm">Template Finder</h3>
              <p className="text-xs text-gray-400">Keyword search tool</p>
            </div>
          </div>
          <span className="px-2 py-0.5 text-[10px] font-medium bg-gray-700/50 text-gray-400 rounded-full">
            NOT AI
          </span>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3 dropdown-scroll">
        {messages.map((message) => (
          <div key={message.id} className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div
              className={`max-w-[90%] rounded-xl px-3 py-2 text-sm ${
                message.type === 'user'
                  ? 'bg-emerald-600/80 text-white'
                  : 'bg-gray-700/50 text-gray-100'
              }`}
            >
              <div className="whitespace-pre-wrap">
                {message.content.split(/(\*\*.*?\*\*)/).map((part, i) => {
                  if (part.startsWith('**') && part.endsWith('**')) {
                    return <strong key={i} className="font-semibold text-emerald-400">{part.slice(2, -2)}</strong>;
                  }
                  return part;
                })}
              </div>

              {/* Result actions */}
              {message.showResult && result && (
                <div className="mt-3 flex gap-2">
                  <Link
                    href="/download"
                    className="flex-1 py-2 px-3 bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-medium rounded-lg transition-colors text-center"
                  >
                    Get Template
                  </Link>
                  <button
                    type="button"
                    onClick={resetFinder}
                    className="py-2 px-3 bg-gray-600 hover:bg-gray-500 text-white text-sm rounded-lg transition-colors"
                  >
                    New Search
                  </button>
                </div>
              )}

              {/* Quick replies */}
              {message.quickReplies && message.quickReplies.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {message.quickReplies.map((reply) => (
                    <button
                      key={reply.value}
                      type="button"
                      onClick={() => handleQuickReply(reply)}
                      className="px-2.5 py-1 bg-gray-600/50 hover:bg-gray-500/50 text-gray-200 text-xs rounded-full transition-colors"
                    >
                      {reply.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSubmit} className="border-t border-gray-700/50 p-3 flex-shrink-0">
        <div className="flex gap-2">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="e.g. 'track bitcoin weekly' or 'portfolio tracker'"
            className="flex-1 bg-gray-700/50 border border-gray-600/50 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500/50"
          />
          <button
            type="submit"
            disabled={!inputValue.trim()}
            className="px-3 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </button>
        </div>
        <p className="text-[10px] text-gray-500 mt-1.5 text-center">
          Keyword-based search. Matches your words to our template catalog.
        </p>
      </form>
    </div>
  );
}
