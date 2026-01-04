'use client';

import { useState, useRef, useEffect } from 'react';
import { BeginnerTip } from '../ui/BeginnerHelpers';

interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  dataUsed?: string[];
  confidence?: 'high' | 'medium' | 'low';
}

const quickActions = [
  { label: '📊 Market Summary', action: 'market-summary' },
  { label: '⚠️ Risk Assessment', action: 'risk-assessment' },
  { label: '₿ Analyze BTC', action: 'analyze-btc' },
  { label: 'Ξ Analyze ETH', action: 'analyze-eth' },
];

export default function CryptoAIChatRAG() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: `👋 **Welcome to DataSimplify AI!**

    Depending on configuration, I can reference available site datasets:
    • 📊 Market prices & trends (when available)
• 😰 Fear & Greed index
    • 🐋 Whale transactions (when enabled)
• 📈 Derivatives & funding rates
    • 🏛️ Macro economic indicators (when enabled)

Ask me anything about crypto! Try the quick actions below or ask your own question.`,
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [aiAvailable, setAiAvailable] = useState<boolean | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Check if AI is available on mount
  useEffect(() => {
    fetch('/api/chat')
      .then(res => res.json())
      .then(data => setAiAvailable(data.available))
      .catch(() => setAiAvailable(false));
  }, []);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: input,
          history: messages.filter(m => m.role !== 'system').map(m => ({
            role: m.role,
            content: m.content,
          })),
        }),
      });

      const result = await response.json();

      if (result.success) {
        const assistantMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: result.data.answer,
          timestamp: new Date(),
          dataUsed: result.data.dataUsed,
          confidence: result.data.confidence,
        };
        setMessages(prev => [...prev, assistantMessage]);
      } else {
        throw new Error(result.error || 'Failed to get response');
      }
    } catch (error) {
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: error instanceof Error && error.message.includes('GROQ_API_KEY')
          ? `⚠️ **AI Not Configured**\n\nTo enable AI chat:\n1. Get a free API key at https://console.groq.com\n2. Add \`GROQ_API_KEY\` to your environment variables\n3. Redeploy your app`
          : `❌ Sorry, I encountered an error. Please try again.\n\n_Error: ${error instanceof Error ? error.message : 'Unknown error'}_`,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickAction = async (action: string) => {
    setIsLoading(true);

    // Add a user message showing what was clicked
    const actionLabels: Record<string, string> = {
      'market-summary': 'Give me a market summary',
      'risk-assessment': 'What is the current risk assessment?',
      'analyze-btc': 'Analyze Bitcoin for me',
      'analyze-eth': 'Analyze Ethereum for me',
    };

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: actionLabels[action] || action,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      });

      const result = await response.json();

      if (result.success) {
        const assistantMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: result.data.answer,
          timestamp: new Date(),
          dataUsed: result.data.dataUsed,
          confidence: result.data.confidence,
        };
        setMessages(prev => [...prev, assistantMessage]);
      } else {
        throw new Error(result.error || 'Failed to get response');
      }
    } catch (error) {
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: `❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const getConfidenceBadge = (confidence?: 'high' | 'medium' | 'low') => {
    if (!confidence) return null;
    const colors = {
      high: 'bg-green-100 text-green-700',
      medium: 'bg-yellow-100 text-yellow-700',
      low: 'bg-red-100 text-red-700',
    };
    return (
      <span className={`text-xs px-2 py-0.5 rounded-full ${colors[confidence]}`}>
        {confidence} confidence
      </span>
    );
  };

  return (
    <div className="flex flex-col h-[600px] bg-white rounded-xl shadow-lg overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-blue-600 p-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center text-xl">
            🤖
          </div>
          <div>
            <h2 className="font-bold text-lg text-white">Crypto AI Assistant</h2>
            <div className="flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${aiAvailable ? 'bg-green-400' : 'bg-yellow-400'}`}></span>
              <p className="text-sm text-blue-100">
                {aiAvailable === null ? 'Checking...' : aiAvailable ? 'Data-connected mode' : 'Limited mode'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 1 && (
          <BeginnerTip title="💡 Powered by Available Data">
            Depending on configuration, I can reference available site datasets (e.g., market indicators). If data isn’t available, I’ll say so.
          </BeginnerTip>
        )}

        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[85%] rounded-xl p-4 ${
                message.role === 'user'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-800'
              }`}
            >
              <div className="whitespace-pre-wrap text-sm">
                {message.content.split('\n').map((line, i) => (
                  <span key={i}>
                    {line.split('**').map((part, j) =>
                      j % 2 === 1 ? <strong key={j}>{part}</strong> : part
                    )}
                    {i < message.content.split('\n').length - 1 && <br />}
                  </span>
                ))}
              </div>

              {/* Data sources and confidence */}
              {message.role === 'assistant' && (message.dataUsed || message.confidence) && (
                <div className="mt-3 pt-2 border-t border-gray-200/50 flex flex-wrap items-center gap-2">
                  {message.confidence && getConfidenceBadge(message.confidence)}
                  {message.dataUsed && message.dataUsed.length > 0 && (
                    <span className="text-xs text-gray-500">
                      📊 Data: {message.dataUsed.join(', ')}
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-gray-100 rounded-xl p-4">
              <div className="flex items-center gap-2">
                <div className="flex gap-1">
                  <span className="w-2 h-2 bg-purple-500 rounded-full animate-bounce"></span>
                  <span className="w-2 h-2 bg-purple-500 rounded-full animate-bounce animation-delay-100"></span>
                  <span className="w-2 h-2 bg-purple-500 rounded-full animate-bounce animation-delay-200"></span>
                </div>
                <span className="text-sm text-gray-500">Analyzing data...</span>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Quick Actions */}
      {messages.length <= 2 && (
        <div className="px-4 py-2 border-t border-gray-100">
          <p className="text-xs text-gray-500 mb-2">Quick analysis:</p>
          <div className="flex flex-wrap gap-2">
            {quickActions.map((qa) => (
              <button
                key={qa.action}
                onClick={() => handleQuickAction(qa.action)}
                disabled={isLoading}
                className="px-3 py-1.5 bg-gradient-to-r from-purple-50 to-blue-50 hover:from-purple-100 hover:to-blue-100 border border-purple-200 rounded-full text-xs text-purple-700 font-medium disabled:opacity-50"
              >
                {qa.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input */}
      <form onSubmit={handleSubmit} className="p-4 border-t border-gray-200 bg-gray-50">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about prices, whales, derivatives, risk..."
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white"
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={!input.trim() || isLoading}
            className="px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg font-medium hover:from-purple-700 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? '...' : 'Send'}
          </button>
        </div>
        <p className="text-xs text-gray-400 mt-2 text-center">
          Uses available site data when enabled • Not financial advice
        </p>
      </form>
    </div>
  );
}
