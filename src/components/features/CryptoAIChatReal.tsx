'use client';

import { useState, useRef, useEffect } from 'react';
import { BeginnerTip } from '../ui/BeginnerHelpers';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  sources?: Array<{
    content: string;
    source: string;
    similarity: number;
  }>;
  confidence?: number;
}

interface AIHealth {
  ollama: { healthy: boolean; models: string[] };
  supabase: boolean;
  ready: boolean;
}

// Non-crypto topics to reject on frontend (backup check)
const nonCryptoKeywords = [
  'weather', 'recipe', 'cooking', 'movie', 'music', 'game', 'travel',
  'relationship', 'medical', 'doctor', 'exercise', 'diet',
  'write a poem', 'write a story', 'write an essay', 'code',
  'javascript', 'python', 'programming'
];

const isCryptoRelated = (message: string): boolean => {
  const lower = message.toLowerCase();
  
  // Check for obvious non-crypto
  for (const keyword of nonCryptoKeywords) {
    if (lower.includes(keyword) && 
        !lower.includes('crypto') && 
        !lower.includes('bitcoin') && 
        !lower.includes('coin') &&
        !lower.includes('token')) {
      return false;
    }
  }
  return true;
};

export function CryptoAIChatReal({ showBeginnerTips = true }: { showBeginnerTips?: boolean }) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [health, setHealth] = useState<AIHealth | null>(null);
  const [showSources, setShowSources] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Check AI health on load
  useEffect(() => {
    checkHealth();
    // Add welcome message
    setMessages([{
      id: '1',
      role: 'assistant',
      content: `👋 **Hi! I'm your Crypto AI Assistant!**

    Depending on configuration, I can reference available site datasets:
    • 📊 Market data (when available)
    • 📰 News summaries (when enabled)
    • 😱 Market sentiment indicators
    • 🐋 Whale activity (when enabled)
    • 🏦 DeFi metrics (when enabled)

**Ask me anything about crypto!** 🚀

⚠️ Note: I ONLY answer crypto/investment questions.`,
      timestamp: new Date(),
    }]);
  }, []);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const checkHealth = async () => {
    try {
      const res = await fetch('/api/ai/chat?type=health');
      const data = await res.json();
      setHealth(data);
    } catch {
      setHealth({ ollama: { healthy: false, models: [] }, supabase: false, ready: false });
    }
  };

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim(),
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    // Frontend check for non-crypto
    if (!isCryptoRelated(input)) {
      const rejectMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: `🚫 **Sorry, I can only help with crypto and investment topics!**

I'm specialized in cryptocurrency and can't help with:
• General knowledge questions
• Coding or programming
• Writing stories or essays
• Health, travel, or lifestyle

**Try asking me about:**
• "What's the price of Bitcoin?"
• "Should beginners buy altcoins?"
• "What's the market sentiment today?"
• "How do I start investing in crypto?"`,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, rejectMessage]);
      setIsLoading(false);
      return;
    }

    try {
      // Call the REAL RAG API
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'chat',
          query: userMessage.content,
          conversationHistory: messages.slice(-10).map(m => ({
            role: m.role,
            content: m.content,
          })),
        }),
      });

      const data = await res.json();

      if (data.success) {
        const assistantMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: data.data.answer,
          sources: data.data.sources,
          confidence: data.data.confidence,
          timestamp: new Date(),
        };
        setMessages(prev => [...prev, assistantMessage]);
      } else {
        // API error - show helpful message
        const errorMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: `⚠️ **${data.error || 'Something went wrong'}**

${data.message || data.details || 'Please try again.'}

${!health?.ollama?.healthy ? '💡 **Tip:** Make sure Ollama is running: `ollama serve`' : ''}`,
          timestamp: new Date(),
        };
        setMessages(prev => [...prev, errorMessage]);
      }
    } catch (error) {
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: `❌ **Connection Error**

Failed to connect to the AI service. Please check:
1. Is Ollama running? (\`ollama serve\`)
2. Is the server running? (\`npm run dev\`)

Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // Quick action buttons
  const quickActions = [
    { label: '📊 BTC Price', query: 'What is the current Bitcoin price and sentiment?' },
    { label: '😱 Market Mood', query: 'What is the overall crypto market sentiment right now?' },
    { label: '🐋 Whale Activity', query: 'Show me recent whale activity and what it means' },
    { label: '🔥 Trending', query: 'What coins are trending and why?' },
    { label: '🎓 Start Guide', query: 'I\'m new to crypto. Where should I start?' },
  ];

  return (
    <div className="bg-white rounded-xl border border-gray-200 flex flex-col h-[600px]">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-t-xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-3xl">🤖</span>
            <div>
              <h2 className="font-bold text-lg">Crypto AI Assistant</h2>
              <p className="text-sm text-blue-100">
                {health?.supabase ? '🟢 RAG Enabled' : '🟡 Basic Mode'} • Crypto Only
              </p>
            </div>
          </div>
          {/* Status Indicators */}
          <div className="flex items-center gap-2 text-sm">
            <span className={`w-2 h-2 rounded-full ${health?.ollama?.healthy ? 'bg-green-400' : 'bg-red-400'}`} />
            <span className="text-blue-100 text-xs">AI</span>
            <span className={`w-2 h-2 rounded-full ${health?.supabase ? 'bg-green-400' : 'bg-yellow-400'}`} />
            <span className="text-blue-100 text-xs">Data</span>
          </div>
        </div>
      </div>

      {/* Status Banner if not ready */}
      {health && !health.ollama?.healthy && (
        <div className="bg-red-50 border-b border-red-200 px-4 py-2 text-sm text-red-700">
          ⚠️ Ollama not running. Start with: <code className="bg-red-100 px-1 rounded">ollama serve</code>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {showBeginnerTips && messages.length <= 1 && (
          <BeginnerTip title="💡 How to Use the AI">
            Ask questions in plain English! Try:
            <br/>• "Is now a good time to buy Bitcoin?"
            <br/>• "Explain DeFi like I'm 5"
            <br/>• "What's making crypto go up today?"
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
              {/* Message content with markdown-like formatting */}
              <div className="whitespace-pre-wrap text-sm">
                {message.content.split('\n').map((line, i) => (
                  <span key={i}>
                    {line.split('**').map((part, j) => 
                      j % 2 === 1 ? <strong key={j}>{part}</strong> : part
                    )}
                    {i < message.content.split('\n').length - 1 && <br/>}
                  </span>
                ))}
              </div>
              
              {/* Confidence indicator */}
              {message.confidence !== undefined && (
                <div className="mt-2 pt-2 border-t border-gray-200/30">
                  <span className={`text-xs px-2 py-1 rounded ${
                    message.confidence > 0.7 ? 'bg-green-200 text-green-800' :
                    message.confidence > 0.4 ? 'bg-yellow-200 text-yellow-800' :
                    'bg-gray-200 text-gray-800'
                  }`}>
                    {message.confidence > 0.7 ? '✓ High confidence' :
                     message.confidence > 0.4 ? '~ Medium confidence' :
                     '? Low confidence'}
                  </span>
                </div>
              )}

              {/* Sources */}
              {message.sources && message.sources.length > 0 && (
                <div className="mt-2 pt-2 border-t border-gray-200/30">
                  <button
                    onClick={() => setShowSources(showSources === message.id ? null : message.id)}
                    className="text-xs text-blue-600 hover:text-blue-800"
                  >
                    {showSources === message.id ? '▼' : '▶'} {message.sources.length} sources
                  </button>
                  
                  {showSources === message.id && (
                    <div className="mt-2 space-y-2">
                      {message.sources.slice(0, 3).map((source, i) => (
                        <div key={i} className="text-xs bg-white/50 rounded p-2">
                          <div className="flex justify-between mb-1">
                            <span className="text-gray-600">{source.source}</span>
                            <span className="text-green-600">
                              {(source.similarity * 100).toFixed(0)}% match
                            </span>
                          </div>
                          <p className="text-gray-700 line-clamp-2">{source.content}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        ))}

        {/* Loading indicator */}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-gray-100 rounded-xl p-4">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" />
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce animation-delay-150" />
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce animation-delay-300" />
                <span className="text-sm text-gray-500 ml-2">Thinking...</span>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Quick Actions */}
      {messages.length <= 2 && (
        <div className="px-4 py-2 border-t border-gray-100">
          <p className="text-xs text-gray-500 mb-2">Quick questions:</p>
          <div className="flex flex-wrap gap-2">
            {quickActions.map((action) => (
              <button
                key={action.label}
                onClick={() => setInput(action.query)}
                className="px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded-full text-xs text-gray-600"
              >
                {action.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input */}
      <div className="p-4 border-t border-gray-200">
        <div className="flex gap-2">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={health?.ollama?.healthy ? "Ask about crypto..." : "AI not available - start Ollama"}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            rows={1}
            disabled={!health?.ollama?.healthy}
          />
          <button
            onClick={sendMessage}
            disabled={!input.trim() || isLoading || !health?.ollama?.healthy}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? '...' : 'Send'}
          </button>
        </div>
        <p className="text-xs text-gray-400 mt-2 text-center">
          🔒 Crypto & investment questions only • {health?.supabase ? 'RAG enabled' : 'Configure Supabase for full features'}
        </p>
      </div>
    </div>
  );
}

export default CryptoAIChatReal;
