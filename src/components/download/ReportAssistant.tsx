'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import {
  parseUserIntent,
  routeToTemplate,
  REPORT_TYPE_QUICK_REPLIES,
  TIMEFRAME_QUICK_REPLIES,
  COIN_PRESET_QUICK_REPLIES,
  VERIFICATION_QUICK_REPLIES,
  TROUBLESHOOTING_STEPS,
  type ParsedIntent,
  type RoutedTemplate,
  type QuickReply,
} from '@/lib/templates/reportAssistant';

// ============ TYPES ============

type AssistantStep =
  | 'initial' // Waiting for user input
  | 'clarify_type' // Need to clarify report type
  | 'clarify_coins' // Need to clarify which coins
  | 'clarify_timeframe' // Need to clarify timeframe
  | 'recommendation' // Showing recommendation
  | 'setup' // Showing setup steps
  | 'verify' // Verifying success
  | 'troubleshoot'; // Helping with errors

interface Message {
  id: string;
  type: 'user' | 'assistant';
  content: string;
  quickReplies?: QuickReply[];
  recommendation?: RoutedTemplate;
  showDownload?: boolean;
  showSetupSteps?: boolean;
  showTroubleshooting?: boolean;
}

interface ReportAssistantProps {
  onTemplateSelect: (templateId: string, config: RoutedTemplate['config']) => void;
  className?: string;
}

// ============ MAIN COMPONENT ============

export function ReportAssistant({ onTemplateSelect, className = '' }: ReportAssistantProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      type: 'assistant',
      content:
        "Welcome to Template Finder! Describe what you're looking for in your own words, and I'll match you with the right template.\n\nExample: \"track bitcoin weekly\" or \"compare my coins\" - or pick a type below.",
      quickReplies: REPORT_TYPE_QUICK_REPLIES,
    },
  ]);
  const [inputValue, setInputValue] = useState('');
  const [currentStep, setCurrentStep] = useState<AssistantStep>('initial');
  const [pendingIntent, setPendingIntent] = useState<ParsedIntent | null>(null);
  const [currentRecommendation, setCurrentRecommendation] = useState<RoutedTemplate | null>(null);
  const [isFreeUser] = useState(true); // Default to free user for safety
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Add a message
  const addMessage = useCallback((message: Omit<Message, 'id'>) => {
    setMessages((prev) => [...prev, { ...message, id: Date.now().toString() }]);
  }, []);

  // Show recommendation - defined early since multiple handlers use it
  const showRecommendation = useCallback(
    (intent: ParsedIntent) => {
      const recommendation = routeToTemplate(intent, isFreeUser);

      if (!recommendation) {
        addMessage({
          type: 'assistant',
          content: "I couldn't find a matching report. Let's start over.",
          quickReplies: REPORT_TYPE_QUICK_REPLIES,
        });
        setCurrentStep('initial');
        return;
      }

      setCurrentRecommendation(recommendation);
      setCurrentStep('recommendation');

      // Build response
      const coinsText = recommendation.config.coins.join(', ');
      const tfLabels: Record<string, string> = {
        '1d': 'daily',
        '1h': 'hourly',
        '1w': 'weekly',
        '4h': '4-hour',
      };

      addMessage({
        type: 'assistant',
        content: `${recommendation.reasoning}\n\n**Your report:**\n- Coins: ${coinsText}\n- Time range: ${tfLabels[recommendation.config.timeframe] || recommendation.config.timeframe}\n- Updates: Manual (best for free accounts)`,
        recommendation,
        showDownload: true,
      });
    },
    [addMessage, isFreeUser]
  );

  // Handle timeframe input
  const handleTimeframeInput = useCallback(
    (value: string) => {
      if (!pendingIntent) return;

      const normalizedValue = value.toLowerCase().trim();

      // Check for skip/negative responses - use daily as default
      const skipPatterns = ['no', 'none', 'skip', 'default', 'any', 'dont', "don't", 'i dont', "i don't", 'not sure', 'whatever', 'anything'];
      const isSkip = skipPatterns.some(p => normalizedValue.includes(p));

      let timeframe = '1d'; // Default to daily
      if (!isSkip) {
        const tfMap: Record<string, string> = {
          '1d': '1d',
          '1h': '1h',
          '1w': '1w',
          daily: '1d',
          hourly: '1h',
          weekly: '1w',
        };
        timeframe = tfMap[normalizedValue] || '1d';
      }

      // Update intent
      const updatedIntent: ParsedIntent = { ...pendingIntent, timeframe };
      setPendingIntent(updatedIntent);

      // Show recommendation
      showRecommendation(updatedIntent);
    },
    [pendingIntent, showRecommendation]
  );

  // Handle coins input
  const handleCoinsInput = useCallback(
    (value: string) => {
      if (!pendingIntent) return;

      const normalizedValue = value.toLowerCase().trim();

      // Check for skip/negative responses - use defaults
      const skipPatterns = ['no', 'none', 'skip', 'default', 'any', 'dont', "don't", 'i dont', "i don't", 'not sure', 'whatever', 'anything'];
      const isSkip = skipPatterns.some(p => normalizedValue.includes(p));

      let coins: string[] = [];

      if (isSkip) {
        // Use default top 5 coins
        coins = ['BTC', 'ETH', 'SOL', 'BNB', 'XRP'];
      } else if (value === 'top5') {
        coins = ['BTC', 'ETH', 'SOL', 'BNB', 'XRP'];
      } else if (value === 'top10') {
        coins = ['BTC', 'ETH', 'SOL', 'BNB', 'XRP', 'ADA', 'DOGE', 'AVAX', 'DOT', 'MATIC'];
      } else if (value === 'defi') {
        coins = ['UNI', 'AAVE', 'LINK', 'CRV', 'MKR'];
      } else if (value === 'custom') {
        addMessage({
          type: 'assistant',
          content:
            'Type the coin symbols you want, separated by commas.\n\nFor example: BTC, ETH, SOL',
        });
        return;
      } else {
        // Parse custom input, filtering out common non-coin words
        const nonCoins = ['THE', 'AND', 'FOR', 'WITH', 'ALL', 'WANT', 'NEED', 'JUST', 'ONLY'];
        coins = value
          .toUpperCase()
          .split(/[,\s]+/)
          .filter((c) => c.length >= 2 && c.length <= 6 && !nonCoins.includes(c));
      }

      if (coins.length === 0) {
        // Default to top 5 instead of asking again
        coins = ['BTC', 'ETH', 'SOL', 'BNB', 'XRP'];
        addMessage({
          type: 'assistant',
          content: "I'll use the top 5 coins (BTC, ETH, SOL, BNB, XRP).\n\nWhat time range do you want?",
          quickReplies: TIMEFRAME_QUICK_REPLIES,
        });
        const updatedIntent: ParsedIntent = { ...pendingIntent, coins };
        setPendingIntent(updatedIntent);
        setCurrentStep('clarify_timeframe');
        return;
      }

      // Update intent with coins
      const updatedIntent: ParsedIntent = { ...pendingIntent, coins };
      setPendingIntent(updatedIntent);

      // Check if we need timeframe
      if (!updatedIntent.timeframe) {
        setCurrentStep('clarify_timeframe');
        addMessage({
          type: 'assistant',
          content: `Got it! ${coins.join(', ')}.\n\nWhat time range do you want?`,
          quickReplies: TIMEFRAME_QUICK_REPLIES,
        });
        return;
      }

      // Show recommendation
      showRecommendation(updatedIntent);
    },
    [pendingIntent, addMessage, showRecommendation]
  );

  // Handle initial input or type clarification
  const handleInitialInput = useCallback(
    (value: string) => {
      // Check if it's a quick reply for report type
      const reportTypeReply = REPORT_TYPE_QUICK_REPLIES.find((r) => r.value === value);

      let intent: ParsedIntent;

      if (reportTypeReply) {
        // Direct type selection
        intent = parseUserIntent(`I want a ${reportTypeReply.label} report`);
      } else {
        // Parse natural language
        intent = parseUserIntent(value);
      }

      // Check if refused
      if (intent.isRefused) {
        addMessage({
          type: 'assistant',
          content: intent.refusalReason || "I can only help with reports, not trading advice.",
          quickReplies: REPORT_TYPE_QUICK_REPLIES,
        });
        return;
      }

      // Store intent for further clarification
      setPendingIntent(intent);

      // Check what we need to clarify
      if (!intent.reportType) {
        setCurrentStep('clarify_type');
        addMessage({
          type: 'assistant',
          content: "I'm not sure what type of report you need. What would you like?",
          quickReplies: REPORT_TYPE_QUICK_REPLIES,
        });
        return;
      }

      // Check if we need coins
      if (
        intent.coins.length === 0 &&
        intent.reportType !== 'market' &&
        intent.reportType !== 'screener'
      ) {
        setCurrentStep('clarify_coins');
        addMessage({
          type: 'assistant',
          content: intent.understood
            ? `${intent.understood}\n\nWhich coins do you want to include?`
            : 'Which coins do you want to include?',
          quickReplies: COIN_PRESET_QUICK_REPLIES,
        });
        return;
      }

      // Check if we need timeframe
      if (!intent.timeframe) {
        setCurrentStep('clarify_timeframe');
        addMessage({
          type: 'assistant',
          content: intent.understood
            ? `${intent.understood}\n\nWhat time range do you want?`
            : 'What time range do you want?',
          quickReplies: TIMEFRAME_QUICK_REPLIES,
        });
        return;
      }

      // We have everything, show recommendation
      showRecommendation(intent);
    },
    [addMessage, showRecommendation]
  );

  // Handle verification input
  const handleVerificationInput = useCallback(
    (value: string) => {
      switch (value) {
        case 'success':
          addMessage({
            type: 'assistant',
            content:
              "Awesome! Your report is ready. Come back anytime you need a new one.\n\nRemember: Press Ctrl+Alt+F5 (Windows) or Cmd+Alt+F5 (Mac) to update your data.",
          });
          setCurrentStep('initial');
          break;

        case 'error':
        case 'no_data':
          setCurrentStep('troubleshoot');
          addMessage({
            type: 'assistant',
            content: "Let's fix that. What do you see?",
            showTroubleshooting: true,
          });
          break;

        case 'help':
          addMessage({
            type: 'assistant',
            content:
              'No problem! Here are the most common issues:\n\n' +
              TROUBLESHOOTING_STEPS.map((s) => `**${s.symptom}**\n${s.fix}`).join('\n\n'),
          });
          break;

        default:
          // Try to parse as a new request
          handleInitialInput(value);
      }
    },
    [addMessage, handleInitialInput]
  );

  // Process user input - depends on all handlers above
  const processUserInput = useCallback(
    (value: string, displayText?: string) => {
      // Add user message
      addMessage({ type: 'user', content: displayText || value });

      // Handle different steps
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

        case 'verify':
          handleVerificationInput(value);
          break;

        default:
          handleInitialInput(value);
      }
    },
    [currentStep, addMessage, handleInitialInput, handleCoinsInput, handleTimeframeInput, handleVerificationInput]
  );

  // Handle quick reply click
  const handleQuickReply = useCallback(
    (reply: QuickReply) => {
      processUserInput(reply.value, reply.label);
    },
    [processUserInput]
  );

  // Handle user input
  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      if (!inputValue.trim()) return;

      processUserInput(inputValue.trim());
      setInputValue('');
    },
    [inputValue, processUserInput]
  );

  // Handle download click
  const handleDownload = useCallback(() => {
    if (!currentRecommendation) return;

    // Trigger the download
    const templateMapping: Record<string, string> = {
      'market-overview': 'market',
      'market-advanced': 'market',
      'watchlist-simple': 'watchlist',
      'watchlist-pro': 'watchlist',
      'screener-basic': 'screener',
      'screener-advanced': 'screener',
      'portfolio-tracker': 'portfolio',
      'portfolio-advanced': 'portfolio',
      'correlation-matrix': 'compare',
      'risk-dashboard': 'risk',
    };

    const mappedId =
      templateMapping[currentRecommendation.primary.template_id] ||
      currentRecommendation.primary.template_id;

    onTemplateSelect(mappedId, currentRecommendation.config);

    // Show setup steps
    setCurrentStep('setup');
    addMessage({
      type: 'assistant',
      content:
        "Your report is downloading. Here's what to do next:",
      showSetupSteps: true,
    });

    // After a delay, ask for verification
    setTimeout(() => {
      setCurrentStep('verify');
      addMessage({
        type: 'assistant',
        content: 'Did everything work?',
        quickReplies: VERIFICATION_QUICK_REPLIES,
      });
    }, 2000);
  }, [currentRecommendation, onTemplateSelect, addMessage]);

  return (
    <div className={`bg-gray-900 rounded-xl border border-gray-800 flex flex-col h-[600px] ${className}`}>
      {/* Header */}
      <div className="bg-gradient-to-r from-emerald-900/50 to-gray-900 border-b border-gray-800 p-4 flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center">
            <svg className="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
            </svg>
          </div>
          <div>
            <h2 className="font-bold text-white">Template Finder</h2>
            <p className="text-sm text-gray-400">Search templates by keyword. Setup guidance included.</p>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[85%] rounded-2xl px-4 py-3 ${
                message.type === 'user'
                  ? 'bg-emerald-600 text-white'
                  : 'bg-gray-800 text-gray-100'
              }`}
            >
              {/* Message content with markdown-like formatting */}
              <div className="text-sm whitespace-pre-wrap">
                {message.content.split(/(\*\*.*?\*\*)/).map((part, i) => {
                  if (part.startsWith('**') && part.endsWith('**')) {
                    return (
                      <strong key={i} className="font-semibold">
                        {part.slice(2, -2)}
                      </strong>
                    );
                  }
                  return part;
                })}
              </div>

              {/* Download button */}
              {message.showDownload && currentRecommendation && (
                <button
                  type="button"
                  onClick={handleDownload}
                  className="mt-3 w-full py-2.5 px-4 bg-emerald-500 hover:bg-emerald-600 text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  Download Report
                </button>
              )}

              {/* Setup steps */}
              {message.showSetupSteps && currentRecommendation && (
                <ol className="mt-3 space-y-2 text-sm">
                  {currentRecommendation.setupSteps.map((step, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="w-5 h-5 rounded-full bg-emerald-500/30 flex items-center justify-center text-xs font-bold text-emerald-400 flex-shrink-0">
                        {i + 1}
                      </span>
                      <span>{step}</span>
                    </li>
                  ))}
                </ol>
              )}

              {/* Troubleshooting */}
              {message.showTroubleshooting && (
                <div className="mt-3 space-y-3">
                  {TROUBLESHOOTING_STEPS.slice(0, 4).map((step, i) => (
                    <div key={i} className="bg-gray-700/50 rounded-lg p-3">
                      <div className="font-medium text-red-400 text-sm">{step.symptom}</div>
                      <div className="text-gray-300 text-sm mt-1">{step.fix}</div>
                    </div>
                  ))}
                </div>
              )}

              {/* Quick replies */}
              {message.quickReplies && message.quickReplies.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {message.quickReplies.map((reply) => (
                    <button
                      key={reply.value}
                      type="button"
                      onClick={() => handleQuickReply(reply)}
                      className="px-3 py-1.5 bg-gray-700 hover:bg-gray-600 text-white text-sm rounded-full transition-colors"
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
      <form onSubmit={handleSubmit} className="border-t border-gray-800 p-4 flex-shrink-0">
        <div className="flex gap-2">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Describe the report you need..."
            className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500"
          />
          <button
            type="submit"
            disabled={!inputValue.trim()}
            className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-700 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          </button>
        </div>
        <p className="text-xs text-gray-500 mt-2 text-center">
          Keyword search tool - matches your words to our template catalog. Not AI analysis.
        </p>
      </form>
    </div>
  );
}
