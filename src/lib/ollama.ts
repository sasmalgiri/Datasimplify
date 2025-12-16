// Ollama AI Client - FREE, self-hosted LLM
// Default: http://localhost:11434

const OLLAMA_BASE_URL = process.env.OLLAMA_BASE_URL || 'http://localhost:11434';
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || 'llama3.2';

export interface OllamaResponse {
  model: string;
  created_at: string;
  response: string;
  done: boolean;
  context?: number[];
  total_duration?: number;
  load_duration?: number;
  prompt_eval_count?: number;
  prompt_eval_duration?: number;
  eval_count?: number;
  eval_duration?: number;
}

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

// Generate a response (non-streaming)
export async function generateResponse(
  prompt: string,
  options?: {
    model?: string;
    system?: string;
    temperature?: number;
    maxTokens?: number;
  }
): Promise<string> {
  try {
    const response = await fetch(`${OLLAMA_BASE_URL}/api/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: options?.model || OLLAMA_MODEL,
        prompt: prompt,
        system: options?.system || 'You are a helpful cryptocurrency analyst assistant. Provide clear, accurate, and concise information about crypto markets, prices, and trends.',
        stream: false,
        options: {
          temperature: options?.temperature ?? 0.7,
          num_predict: options?.maxTokens ?? 500,
        },
      }),
    });

    if (!response.ok) {
      throw new Error(`Ollama API error: ${response.status}`);
    }

    const data: OllamaResponse = await response.json();
    return data.response;
  } catch (error) {
    console.error('Ollama generate error:', error);
    throw error;
  }
}

// Chat with conversation history
export async function chat(
  messages: ChatMessage[],
  options?: {
    model?: string;
    temperature?: number;
  }
): Promise<string> {
  try {
    const response = await fetch(`${OLLAMA_BASE_URL}/api/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: options?.model || OLLAMA_MODEL,
        messages: messages,
        stream: false,
        options: {
          temperature: options?.temperature ?? 0.7,
        },
      }),
    });

    if (!response.ok) {
      throw new Error(`Ollama chat error: ${response.status}`);
    }

    const data = await response.json();
    return data.message.content;
  } catch (error) {
    console.error('Ollama chat error:', error);
    throw error;
  }
}

// Analyze crypto data with AI
export async function analyzeCryptoData(
  data: {
    coins: Array<{ name: string; symbol: string; price: number; change24h: number; marketCap: number }>;
    query: string;
  }
): Promise<string> {
  const dataContext = data.coins
    .map(c => `${c.name} (${c.symbol}): $${c.price.toLocaleString()}, 24h: ${c.change24h > 0 ? '+' : ''}${c.change24h.toFixed(2)}%, MCap: $${(c.marketCap / 1e9).toFixed(2)}B`)
    .join('\n');

  const prompt = `Based on this cryptocurrency data:

${dataContext}

User question: ${data.query}

Provide a clear, helpful analysis. Focus on the specific question asked. Use numbers from the data provided.`;

  return generateResponse(prompt, {
    system: 'You are an expert cryptocurrency analyst. Analyze the provided market data and answer questions accurately. Be concise and data-driven. Format numbers clearly.',
    temperature: 0.5,
  });
}

// Search/filter coins with natural language
export async function parseSearchQuery(query: string): Promise<{
  action: 'filter' | 'sort' | 'compare' | 'info';
  filters?: {
    minPrice?: number;
    maxPrice?: number;
    minChange?: number;
    maxChange?: number;
    minMarketCap?: number;
    category?: string;
  };
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  coins?: string[];
}> {
  const prompt = `Parse this crypto search query and return JSON:

Query: "${query}"

Return a JSON object with:
- action: "filter" | "sort" | "compare" | "info"
- filters: { minPrice, maxPrice, minChange, maxChange, minMarketCap, category } (optional)
- sortBy: field name (optional)
- sortOrder: "asc" | "desc" (optional)
- coins: array of coin names/symbols mentioned (optional)

Examples:
"Show me coins up 10% today" -> {"action":"filter","filters":{"minChange":10}}
"Top DeFi tokens by volume" -> {"action":"filter","filters":{"category":"defi"},"sortBy":"volume","sortOrder":"desc"}
"Compare BTC and ETH" -> {"action":"compare","coins":["bitcoin","ethereum"]}

Return ONLY the JSON, no explanation.`;

  try {
    const response = await generateResponse(prompt, {
      temperature: 0.1,
      maxTokens: 200,
    });
    
    // Extract JSON from response
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    
    return { action: 'info' };
  } catch {
    return { action: 'info' };
  }
}

// Check if Ollama is available
export async function checkOllamaHealth(): Promise<boolean> {
  try {
    const response = await fetch(`${OLLAMA_BASE_URL}/api/tags`);
    return response.ok;
  } catch {
    return false;
  }
}

// List available models
export async function listModels(): Promise<string[]> {
  try {
    const response = await fetch(`${OLLAMA_BASE_URL}/api/tags`);
    if (!response.ok) return [];
    
    const data = await response.json();
    return data.models?.map((m: { name: string }) => m.name) || [];
  } catch {
    return [];
  }
}
