// Multi-provider AI client
// Supports: Groq (FREE), OpenAI, Ollama (local)

export interface AIMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface AIResponse {
  content: string;
  provider: string;
  model: string;
  tokensUsed?: number;
}

// Detect which provider is configured
export function getConfiguredProvider(): 'groq' | 'openai' | 'ollama' | null {
  if (process.env.GROQ_API_KEY) return 'groq';
  if (process.env.OPENAI_API_KEY) return 'openai';
  if (process.env.OLLAMA_BASE_URL) return 'ollama';
  return null;
}

// GROQ - FREE and FAST
async function chatGroq(messages: AIMessage[], systemPrompt?: string): Promise<AIResponse> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) throw new Error('GROQ_API_KEY not set');

  const allMessages: AIMessage[] = systemPrompt 
    ? [{ role: 'system', content: systemPrompt }, ...messages]
    : messages;

  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: process.env.GROQ_MODEL || 'llama-3.3-70b-versatile',
      messages: allMessages,
      temperature: 0.7,
      max_tokens: 2048,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Groq error: ${error}`);
  }

  const data = await response.json();
  
  return {
    content: data.choices[0].message.content,
    provider: 'groq',
    model: data.model,
    tokensUsed: data.usage?.total_tokens,
  };
}

// OpenAI
async function chatOpenAI(messages: AIMessage[], systemPrompt?: string): Promise<AIResponse> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error('OPENAI_API_KEY not set');

  const allMessages: AIMessage[] = systemPrompt 
    ? [{ role: 'system', content: systemPrompt }, ...messages]
    : messages;

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
      messages: allMessages,
      temperature: 0.7,
      max_tokens: 2048,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`OpenAI error: ${error}`);
  }

  const data = await response.json();
  
  return {
    content: data.choices[0].message.content,
    provider: 'openai',
    model: data.model,
    tokensUsed: data.usage?.total_tokens,
  };
}

// Ollama (local)
async function chatOllama(messages: AIMessage[], systemPrompt?: string): Promise<AIResponse> {
  const baseUrl = process.env.OLLAMA_BASE_URL || 'http://localhost:11434';
  const model = process.env.OLLAMA_MODEL || 'llama3.2';

  const allMessages: AIMessage[] = systemPrompt 
    ? [{ role: 'system', content: systemPrompt }, ...messages]
    : messages;

  const response = await fetch(`${baseUrl}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model,
      messages: allMessages,
      stream: false,
    }),
  });

  if (!response.ok) {
    throw new Error(`Ollama error: ${response.statusText}`);
  }

  const data = await response.json();
  
  return {
    content: data.message.content,
    provider: 'ollama',
    model,
    tokensUsed: data.eval_count,
  };
}

// Main chat function - auto-selects provider
export async function chat(
  messages: AIMessage[], 
  options: { systemPrompt?: string; provider?: 'groq' | 'openai' | 'ollama' } = {}
): Promise<AIResponse> {
  const provider = options.provider || getConfiguredProvider();

  if (!provider) {
    throw new Error('No AI provider configured. Set GROQ_API_KEY, OPENAI_API_KEY, or OLLAMA_BASE_URL');
  }

  const systemPrompt = options.systemPrompt || `You are DataSimplify's AI assistant, specializing in cryptocurrency analysis.

You help users understand:
- Crypto market data and trends
- Technical indicators (RSI, MACD, etc.) in simple terms
- Fear & Greed Index implications
- DeFi protocols and yields
- On-chain metrics

Guidelines:
- Explain complex terms in plain English
- Use traffic light analogies (🟢 good, 🟡 caution, 🔴 warning)
- Never give specific buy/sell advice
- Always remind users to do their own research (DYOR)
- Focus only on cryptocurrency topics

If asked about non-crypto topics, politely redirect to crypto-related questions.`;

  switch (provider) {
    case 'groq':
      return chatGroq(messages, systemPrompt);
    case 'openai':
      return chatOpenAI(messages, systemPrompt);
    case 'ollama':
      return chatOllama(messages, systemPrompt);
    default:
      throw new Error(`Unknown provider: ${provider}`);
  }
}

// Health check
export async function checkAIHealth(): Promise<{
  available: boolean;
  provider: string | null;
  error?: string;
}> {
  const provider = getConfiguredProvider();
  
  if (!provider) {
    return {
      available: false,
      provider: null,
      error: 'No AI provider configured',
    };
  }

  try {
    // Quick test
    if (provider === 'ollama') {
      const baseUrl = process.env.OLLAMA_BASE_URL || 'http://localhost:11434';
      const response = await fetch(`${baseUrl}/api/tags`, { 
        signal: AbortSignal.timeout(5000) 
      });
      if (!response.ok) throw new Error('Ollama not responding');
    }
    
    return {
      available: true,
      provider,
    };
  } catch (error) {
    return {
      available: false,
      provider,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

// Simple sentiment analysis
export async function analyzeSentiment(text: string): Promise<{
  sentiment: 'positive' | 'negative' | 'neutral';
  score: number;
  explanation: string;
}> {
  const response = await chat([
    {
      role: 'user',
      content: `Analyze the sentiment of this crypto-related text. Respond in JSON format only:
{"sentiment": "positive|negative|neutral", "score": 0.0-1.0, "explanation": "brief reason"}

Text: "${text}"`,
    }
  ], {
    systemPrompt: 'You are a sentiment analysis AI. Respond only with valid JSON.',
  });

  try {
    const parsed = JSON.parse(response.content);
    return {
      sentiment: parsed.sentiment || 'neutral',
      score: parsed.score || 0.5,
      explanation: parsed.explanation || 'Unable to determine',
    };
  } catch {
    return {
      sentiment: 'neutral',
      score: 0.5,
      explanation: 'Could not parse sentiment',
    };
  }
}
