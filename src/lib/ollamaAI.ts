// ============================================
// OLLAMA EMBEDDING SERVICE
// Generate vector embeddings locally (FREE!)
// ============================================
// Ollama supports embedding models like:
// - nomic-embed-text (768 dims, fast)
// - mxbai-embed-large (1024 dims, better quality)
// - all-minilm (384 dims, very fast)

const OLLAMA_BASE_URL = process.env.OLLAMA_BASE_URL || 'http://localhost:11434';
const EMBEDDING_MODEL = process.env.OLLAMA_EMBEDDING_MODEL || 'nomic-embed-text';
const CHAT_MODEL = process.env.OLLAMA_CHAT_MODEL || 'llama3.2';

// ============================================
// TYPES
// ============================================

export interface EmbeddingResult {
  embedding: number[];
  model: string;
  dimensions: number;
}

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface ChatResponse {
  content: string;
  model: string;
  tokensUsed?: number;
}

export interface SentimentAnalysis {
  score: number; // -1 to 1
  label: 'very_bearish' | 'bearish' | 'neutral' | 'bullish' | 'very_bullish';
  confidence: number;
  reasoning: string;
  topics: string[];
  entities: string[];
}

// ============================================
// EMBEDDING GENERATION
// ============================================

export async function generateEmbedding(text: string): Promise<EmbeddingResult> {
  try {
    const response = await fetch(`${OLLAMA_BASE_URL}/api/embeddings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: EMBEDDING_MODEL,
        prompt: text,
      }),
    });

    if (!response.ok) {
      throw new Error(`Ollama embedding error: ${response.status}`);
    }

    const data = await response.json();
    
    return {
      embedding: data.embedding,
      model: EMBEDDING_MODEL,
      dimensions: data.embedding.length,
    };
  } catch (error) {
    console.error('Embedding generation failed:', error);
    throw error;
  }
}

// Batch embedding generation (more efficient)
export async function generateEmbeddings(texts: string[]): Promise<EmbeddingResult[]> {
  const results: EmbeddingResult[] = [];
  
  // Process in batches of 10 to avoid overwhelming Ollama
  const batchSize = 10;
  for (let i = 0; i < texts.length; i += batchSize) {
    const batch = texts.slice(i, i + batchSize);
    const batchResults = await Promise.all(
      batch.map(text => generateEmbedding(text))
    );
    results.push(...batchResults);
    
    // Small delay between batches
    if (i + batchSize < texts.length) {
      await new Promise(r => setTimeout(r, 100));
    }
  }
  
  return results;
}

// ============================================
// CHAT / COMPLETION
// ============================================

export async function chat(
  messages: ChatMessage[],
  options?: {
    temperature?: number;
    maxTokens?: number;
    systemPrompt?: string;
  }
): Promise<ChatResponse> {
  try {
    // Add system prompt if provided
    const allMessages: ChatMessage[] = options?.systemPrompt
      ? [{ role: 'system', content: options.systemPrompt }, ...messages]
      : messages;

    const response = await fetch(`${OLLAMA_BASE_URL}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: CHAT_MODEL,
        messages: allMessages,
        stream: false,
        options: {
          temperature: options?.temperature ?? 0.7,
          num_predict: options?.maxTokens ?? 1000,
        },
      }),
    });

    if (!response.ok) {
      throw new Error(`Ollama chat error: ${response.status}`);
    }

    const data = await response.json();
    
    return {
      content: data.message.content,
      model: CHAT_MODEL,
      tokensUsed: data.eval_count,
    };
  } catch (error) {
    console.error('Chat completion failed:', error);
    throw error;
  }
}

// Simple completion (single prompt)
export async function complete(
  prompt: string,
  options?: { temperature?: number; maxTokens?: number }
): Promise<string> {
  const response = await chat(
    [{ role: 'user', content: prompt }],
    options
  );
  return response.content;
}

// ============================================
// AI-POWERED SENTIMENT ANALYSIS
// ============================================

const SENTIMENT_SYSTEM_PROMPT = `You are a crypto market sentiment analyst. Analyze the given text and provide sentiment analysis in JSON format.

Your response must be valid JSON with this exact structure:
{
  "score": <number from -1 to 1, where -1 is extremely bearish and 1 is extremely bullish>,
  "label": <one of: "very_bearish", "bearish", "neutral", "bullish", "very_bullish">,
  "confidence": <number from 0 to 1 indicating how confident you are>,
  "reasoning": <brief explanation of your analysis>,
  "topics": <array of main topics discussed>,
  "entities": <array of cryptocurrencies, companies, or people mentioned>
}

Guidelines:
- Consider context! "NOT going to moon" is bearish despite containing "moon"
- Consider the source credibility and specificity
- Extract actual cryptocurrency symbols (BTC, ETH, etc.)
- Be objective and balanced in your analysis`;

export async function analyzeSentimentAI(text: string): Promise<SentimentAnalysis> {
  try {
    const response = await chat(
      [{ role: 'user', content: `Analyze the sentiment of this crypto-related text:\n\n"${text}"` }],
      { 
        systemPrompt: SENTIMENT_SYSTEM_PROMPT,
        temperature: 0.3, // Lower temperature for more consistent analysis
      }
    );

    // Parse JSON response
    const jsonMatch = response.content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Invalid JSON response from AI');
    }

    const result = JSON.parse(jsonMatch[0]);
    
    return {
      score: Math.max(-1, Math.min(1, result.score)),
      label: result.label,
      confidence: Math.max(0, Math.min(1, result.confidence)),
      reasoning: result.reasoning,
      topics: result.topics || [],
      entities: result.entities || [],
    };
  } catch (error) {
    console.error('AI sentiment analysis failed:', error);
    // Return neutral sentiment on error
    return {
      score: 0,
      label: 'neutral',
      confidence: 0,
      reasoning: 'Analysis failed',
      topics: [],
      entities: [],
    };
  }
}

// Batch sentiment analysis
export async function analyzeSentimentBatch(
  texts: string[]
): Promise<SentimentAnalysis[]> {
  const results: SentimentAnalysis[] = [];
  
  for (const text of texts) {
    const result = await analyzeSentimentAI(text);
    results.push(result);
    
    // Rate limiting
    await new Promise(r => setTimeout(r, 200));
  }
  
  return results;
}

// ============================================
// AI SUMMARIZATION
// ============================================

const SUMMARY_SYSTEM_PROMPT = `You are a crypto market analyst. Summarize the given content concisely and extract key information.

Your response must be valid JSON with this structure:
{
  "summary": <concise 2-3 sentence summary>,
  "key_points": <array of 3-5 bullet points>,
  "sentiment": <overall sentiment: "bullish", "bearish", or "neutral">,
  "coins_mentioned": <array of cryptocurrency symbols mentioned>,
  "action_items": <array of any actionable insights>
}`;

export async function summarizeContent(content: string): Promise<{
  summary: string;
  keyPoints: string[];
  sentiment: string;
  coinsMentioned: string[];
  actionItems: string[];
}> {
  try {
    const response = await chat(
      [{ role: 'user', content: `Summarize this crypto market content:\n\n${content}` }],
      { systemPrompt: SUMMARY_SYSTEM_PROMPT, temperature: 0.3 }
    );

    const jsonMatch = response.content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Invalid JSON response');
    }

    const result = JSON.parse(jsonMatch[0]);
    
    return {
      summary: result.summary,
      keyPoints: result.key_points || [],
      sentiment: result.sentiment,
      coinsMentioned: result.coins_mentioned || [],
      actionItems: result.action_items || [],
    };
  } catch (error) {
    console.error('Summarization failed:', error);
    return {
      summary: 'Summary generation failed',
      keyPoints: [],
      sentiment: 'neutral',
      coinsMentioned: [],
      actionItems: [],
    };
  }
}

// ============================================
// RAG QUERY PROCESSING
// ============================================

export async function processRAGQuery(
  query: string,
  context: string[],
  conversationHistory?: ChatMessage[]
): Promise<ChatResponse> {
  const systemPrompt = `You are DataSimplify's AI assistant, an expert in cryptocurrency markets, DeFi, and blockchain technology.

You have access to real-time data and analysis. Use the provided context to answer questions accurately.

CONTEXT FROM DATABASE:
${context.map((c, i) => `[${i + 1}] ${c}`).join('\n\n')}

Guidelines:
- Base your answers on the provided context
- If the context doesn't contain relevant information, say so
- Provide specific data points when available
- Be concise but informative
- Cite which context piece you're referencing when relevant
- If asked about current prices or real-time data, use the context provided`;

  const messages: ChatMessage[] = [
    ...(conversationHistory || []),
    { role: 'user', content: query },
  ];

  return chat(messages, { systemPrompt, temperature: 0.7 });
}

// ============================================
// MARKET ANALYSIS
// ============================================

export async function generateMarketAnalysis(data: {
  prices: Array<{ symbol: string; price: number; change24h: number }>;
  sentiment: { overall: number; label: string };
  whaleActivity: string;
  defiTvl: number;
}): Promise<string> {
  const prompt = `Generate a brief market analysis based on this data:

PRICE DATA:
${data.prices.map(p => `${p.symbol}: $${p.price.toLocaleString()} (${p.change24h > 0 ? '+' : ''}${p.change24h.toFixed(2)}%)`).join('\n')}

MARKET SENTIMENT: ${data.sentiment.label} (score: ${data.sentiment.overall})

WHALE ACTIVITY: ${data.whaleActivity}

TOTAL DEFI TVL: $${(data.defiTvl / 1e9).toFixed(2)}B

Provide a 3-4 sentence market summary with key insights.`;

  return complete(prompt, { temperature: 0.5 });
}

// ============================================
// HEALTH CHECK
// ============================================

export async function checkOllamaHealth(): Promise<{
  healthy: boolean;
  models: string[];
  error?: string;
}> {
  try {
    const response = await fetch(`${OLLAMA_BASE_URL}/api/tags`);
    if (!response.ok) {
      throw new Error(`Ollama not responding: ${response.status}`);
    }

    const data = await response.json();
    const models = data.models?.map((m: { name: string }) => m.name) || [];

    return {
      healthy: true,
      models,
    };
  } catch (error) {
    return {
      healthy: false,
      models: [],
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

// Pull required models if not present
export async function ensureModels(): Promise<void> {
  const health = await checkOllamaHealth();
  
  if (!health.healthy) {
    throw new Error('Ollama is not running. Start it with: ollama serve');
  }

  const requiredModels = [EMBEDDING_MODEL, CHAT_MODEL];
  
  for (const model of requiredModels) {
    if (!health.models.some(m => m.startsWith(model))) {
      console.log(`Pulling model: ${model}...`);
      
      const response = await fetch(`${OLLAMA_BASE_URL}/api/pull`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: model }),
      });

      if (!response.ok) {
        throw new Error(`Failed to pull model: ${model}`);
      }
      
      console.log(`Model ${model} ready!`);
    }
  }
}
