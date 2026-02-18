'use client';

import { useState, useRef, useEffect } from 'react';
import { X, Send, Sparkles, Loader2, Zap } from 'lucide-react';
import { useLiveDashboardStore } from '@/lib/live-dashboard/store';
import { getSiteThemeClasses, getThemeColors } from '@/lib/live-dashboard/theme';
import { useCreditStore, CREDIT_COSTS } from '@/lib/live-dashboard/credits';

// ─── Types ───

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

interface AIChatPanelProps {
  isOpen: boolean;
  onClose: () => void;
  dashboardName: string;
}

// ─── Constants ───

const MAX_QUERIES_PER_HOUR = 5;
const QUERY_WINDOW_MS = 60 * 60 * 1000; // 1 hour

const SUGGESTED_QUESTIONS = [
  'What does the current market data suggest?',
  'Which coins are showing the strongest momentum?',
  'Is now a good time to invest based on the data?',
  'What are the key risk indicators right now?',
];

// ─── Helpers ───

function buildDashboardContext(store: ReturnType<typeof useLiveDashboardStore.getState>): string {
  const parts: string[] = [];

  // Top 3 coins by market cap
  if (store.data.markets?.length) {
    const top = [...store.data.markets]
      .sort((a, b) => (b.market_cap ?? 0) - (a.market_cap ?? 0))
      .slice(0, 3);
    parts.push(
      'Top coins: ' +
        top
          .map(
            (c) =>
              `${c.name} (${c.symbol.toUpperCase()}) $${c.current_price?.toLocaleString()} (24h: ${c.price_change_percentage_24h?.toFixed(2)}%)`
          )
          .join(', ')
    );
  }

  // Total market cap
  if (store.data.global?.total_market_cap?.usd) {
    const mcap = store.data.global.total_market_cap.usd;
    const formatted =
      mcap >= 1e12
        ? `$${(mcap / 1e12).toFixed(2)}T`
        : `$${(mcap / 1e9).toFixed(2)}B`;
    parts.push(`Total market cap: ${formatted}`);
  }

  // BTC/ETH dominance
  if (store.data.global?.market_cap_percentage) {
    const btc = store.data.global.market_cap_percentage.btc;
    const eth = store.data.global.market_cap_percentage.eth;
    if (btc != null) parts.push(`BTC dominance: ${btc.toFixed(1)}%`);
    if (eth != null) parts.push(`ETH dominance: ${eth.toFixed(1)}%`);
  }

  // Fear & Greed
  if (store.data.fearGreed?.length) {
    const fg = store.data.fearGreed[0];
    parts.push(`Fear & Greed Index: ${fg.value} (${fg.value_classification})`);
  }

  // Top DeFi protocol
  if (store.data.defiProtocols?.length) {
    const top = store.data.defiProtocols[0];
    const tvlFormatted =
      top.tvl >= 1e9
        ? `$${(top.tvl / 1e9).toFixed(2)}B`
        : `$${(top.tvl / 1e6).toFixed(2)}M`;
    parts.push(
      `Top DeFi: ${top.name} TVL ${tvlFormatted} (24h: ${top.change_1d?.toFixed(2)}%)`
    );
  }

  const context = parts.join('. ');
  return context.length > 2000 ? context.slice(0, 2000) : context;
}

// ─── Component ───

export default function AIChatPanel({ isOpen, onClose, dashboardName }: AIChatPanelProps) {
  const data = useLiveDashboardStore((s) => s.data);
  const siteTheme = useLiveDashboardStore((s) => s.siteTheme);
  const customization = useLiveDashboardStore((s) => s.customization);
  const st = getSiteThemeClasses(siteTheme);
  const themeColors = getThemeColors(customization.colorTheme);
  const canAfford = useCreditStore((s) => s.canAfford);
  const creditUse = useCreditStore((s) => s.useCredits);

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [queryTimestamps, setQueryTimestamps] = useState<number[]>([]);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Calculate remaining queries within the rolling window
  const now = Date.now();
  const recentQueries = queryTimestamps.filter((ts) => now - ts < QUERY_WINDOW_MS);
  const remainingQueries = Math.max(0, MAX_QUERIES_PER_HOUR - recentQueries.length);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  // Focus input when panel opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 300);
    }
  }, [isOpen]);

  // Clear messages when panel closes
  useEffect(() => {
    if (!isOpen) {
      setMessages([]);
      setInput('');
    }
  }, [isOpen]);

  const sendMessage = async (question: string) => {
    const trimmed = question.trim();
    if (!trimmed || isLoading || remainingQueries <= 0) return;

    // Check credit balance
    if (!canAfford('ai_chat_query')) {
      setMessages((prev) => [
        ...prev,
        { role: 'user', content: trimmed },
        { role: 'assistant', content: `Not enough credits (need ${CREDIT_COSTS.ai_chat_query}). Click the credits pill in the toolbar to buy more.` },
      ]);
      setInput('');
      return;
    }

    const userMessage: ChatMessage = { role: 'user', content: trimmed };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    // Record the query timestamp
    setQueryTimestamps((prev) => [...prev, Date.now()]);

    try {
      const storeState = useLiveDashboardStore.getState();
      const dashboardContext = buildDashboardContext(storeState);

      const res = await fetch('/api/live-dashboard/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: trimmed, dashboardContext }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'Request failed' }));
        throw new Error(err.error || `HTTP ${res.status}`);
      }

      const result = await res.json();
      const assistantMessage: ChatMessage = {
        role: 'assistant',
        content: result.answer || 'Sorry, I could not generate a response.',
      };
      setMessages((prev) => [...prev, assistantMessage]);
      creditUse('ai_chat_query', `AI query: ${trimmed.slice(0, 50)}`);
    } catch (err: any) {
      const errorMessage: ChatMessage = {
        role: 'assistant',
        content: `Error: ${err.message || 'Failed to get AI response. Please try again.'}`,
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(input);
  };

  const handleSuggestionClick = (question: string) => {
    sendMessage(question);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  // Determine glass background based on theme
  const isLight = siteTheme === 'light-blue';
  const panelBg = isLight
    ? 'bg-white/90 backdrop-blur-xl border-l border-blue-200/40'
    : 'bg-[#0a0a0f]/95 backdrop-blur-xl border-l border-white/[0.06]';
  const backdropBg = isLight
    ? 'bg-slate-900/20'
    : 'bg-black/40';
  const userBubbleBg = isLight
    ? 'bg-blue-50 border border-blue-200/40'
    : 'bg-white/[0.06] border border-white/[0.08]';
  const assistantBubbleBg = isLight
    ? 'bg-emerald-50/60 border border-emerald-200/30'
    : 'bg-emerald-400/[0.06] border border-emerald-400/[0.1]';
  const inputBg = isLight
    ? 'bg-white border border-blue-200/50 text-slate-800 placeholder-slate-400'
    : 'bg-white/[0.04] border border-white/[0.1] text-white placeholder-gray-500';

  return (
    <>
      {/* Backdrop overlay */}
      {isOpen && (
        <div
          className={`fixed inset-0 ${backdropBg} backdrop-blur-sm z-40 transition-opacity duration-300`}
          onClick={onClose}
        />
      )}

      {/* Slide-out drawer */}
      <div
        className={`fixed top-0 right-0 h-full w-96 md:w-[420px] ${panelBg} z-50 flex flex-col transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Header */}
        <div className={`flex items-center justify-between px-5 py-4 border-b ${isLight ? 'border-blue-200/30' : 'border-white/[0.06]'}`}>
          <div className="flex items-center gap-2.5">
            <div
              className="w-8 h-8 rounded-xl flex items-center justify-center"
              style={{ backgroundColor: `${themeColors.primary}20` }}
            >
              <Sparkles className="w-4 h-4" style={{ color: themeColors.primary }} />
            </div>
            <div>
              <h3 className={`text-sm font-semibold ${st.textPrimary}`}>AI Assistant</h3>
              <p className={`text-[11px] ${st.textDim}`}>{dashboardName}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Credit cost badge */}
            <span className="flex items-center gap-0.5 text-[11px] font-medium px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <Zap className="w-3 h-3" />
              {CREDIT_COSTS.ai_chat_query}/msg
            </span>

            {/* Remaining queries badge */}
            <span
              className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${
                remainingQueries === 0
                  ? isLight
                    ? 'bg-red-50 text-red-500 border border-red-200/40'
                    : 'bg-red-500/10 text-red-400 border border-red-500/20'
                  : isLight
                    ? 'bg-blue-50 text-blue-500 border border-blue-200/40'
                    : 'bg-white/[0.06] text-gray-400 border border-white/[0.08]'
              }`}
            >
              {remainingQueries}/{MAX_QUERIES_PER_HOUR} left
            </span>

            <button
              type="button"
              onClick={onClose}
              className={`p-1.5 rounded-lg transition ${st.buttonSecondary}`}
              title="Close chat"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Messages area */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4 scrollbar-thin">
          {/* Empty state with suggestions */}
          {messages.length === 0 && !isLoading && (
            <div className="flex flex-col items-center justify-center h-full gap-6 py-8">
              <div
                className="w-14 h-14 rounded-2xl flex items-center justify-center"
                style={{ backgroundColor: `${themeColors.primary}15` }}
              >
                <Sparkles className="w-7 h-7" style={{ color: themeColors.primary }} />
              </div>
              <div className="text-center">
                <p className={`text-sm font-medium ${st.textPrimary} mb-1`}>
                  Ask about your dashboard
                </p>
                <p className={`text-xs ${st.textMuted}`}>
                  Get AI-powered insights from your live market data
                </p>
              </div>

              {/* Suggested question chips */}
              <div className="flex flex-col gap-2 w-full max-w-[320px]">
                {SUGGESTED_QUESTIONS.map((q) => (
                  <button
                    key={q}
                    type="button"
                    onClick={() => handleSuggestionClick(q)}
                    disabled={remainingQueries <= 0}
                    className={`text-left text-xs px-3.5 py-2.5 rounded-xl transition-all duration-200 ${
                      remainingQueries <= 0
                        ? `${st.subtleBg} ${st.textFaint} cursor-not-allowed`
                        : isLight
                          ? 'bg-blue-50/60 text-slate-600 border border-blue-200/30 hover:bg-blue-100/60 hover:border-blue-300/40'
                          : 'bg-white/[0.04] text-gray-400 border border-white/[0.06] hover:bg-white/[0.08] hover:border-white/[0.12]'
                    }`}
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Chat messages */}
          {messages.map((msg, idx) => (
            <div
              key={idx}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[85%] rounded-2xl px-4 py-3 ${
                  msg.role === 'user' ? userBubbleBg : assistantBubbleBg
                }`}
              >
                {msg.role === 'assistant' && (
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <Sparkles
                      className="w-3 h-3"
                      style={{ color: themeColors.primary }}
                    />
                    <span
                      className="text-[10px] font-semibold uppercase tracking-wider"
                      style={{ color: themeColors.primary }}
                    >
                      AI
                    </span>
                  </div>
                )}
                <p
                  className={`text-sm leading-relaxed whitespace-pre-wrap ${
                    msg.role === 'user' ? st.textPrimary : st.textSecondary
                  }`}
                >
                  {msg.content}
                </p>
              </div>
            </div>
          ))}

          {/* Loading indicator */}
          {isLoading && (
            <div className="flex justify-start">
              <div className={`rounded-2xl px-4 py-3 ${assistantBubbleBg}`}>
                <div className="flex items-center gap-2">
                  <Loader2
                    className="w-4 h-4 animate-spin"
                    style={{ color: themeColors.primary }}
                  />
                  <span className={`text-sm ${st.textMuted}`}>Thinking...</span>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input area */}
        <div className={`px-5 py-4 border-t ${isLight ? 'border-blue-200/30' : 'border-white/[0.06]'}`}>
          {remainingQueries <= 0 && (
            <p className={`text-xs ${isLight ? 'text-red-500' : 'text-red-400'} mb-2 text-center`}>
              Query limit reached. Resets in up to 1 hour.
            </p>
          )}
          <form onSubmit={handleSubmit} className="flex items-center gap-2">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={
                remainingQueries <= 0
                  ? 'Query limit reached...'
                  : 'Ask about your market data...'
              }
              disabled={isLoading || remainingQueries <= 0}
              className={`flex-1 ${inputBg} rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-1 transition disabled:opacity-50 disabled:cursor-not-allowed`}
              style={{
                // @ts-ignore -- CSS custom property for focus ring
                '--tw-ring-color': `${themeColors.primary}60`,
              } as React.CSSProperties}
            />
            <button
              type="submit"
              disabled={!input.trim() || isLoading || remainingQueries <= 0}
              className="w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-200 disabled:opacity-30 disabled:cursor-not-allowed"
              style={{
                backgroundColor: input.trim() && !isLoading && remainingQueries > 0
                  ? themeColors.primary
                  : undefined,
              }}
              title="Send message"
            >
              <Send
                className={`w-4 h-4 ${
                  input.trim() && !isLoading && remainingQueries > 0
                    ? 'text-white'
                    : st.textFaint
                }`}
              />
            </button>
          </form>
        </div>
      </div>
    </>
  );
}
