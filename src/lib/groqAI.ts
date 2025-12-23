// ============================================
// GROQ AI SERVICE
// AI utilities using Groq (FREE cloud inference)
// ============================================
// Adapted from ollamaAI.ts for cloud deployment
// Uses llama-3.3-70b-versatile (fast, capable)

const GROQ_API_KEY = process.env.GROQ_API_KEY;
const GROQ_MODEL = process.env.GROQ_MODEL || 'llama-3.3-70b-versatile';

// ============================================
// TYPES
// ============================================

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface SentimentAnalysis {
  score: number; // -1 to 1
  label: 'very_bearish' | 'bearish' | 'neutral' | 'bullish' | 'very_bullish';
  confidence: number;
  reasoning: string;
  topics: string[];
  entities: string[];
}

export interface ContentSummary {
  summary: string;
  keyPoints: string[];
  sentiment: string;
  coinsMentioned: string[];
}

export interface MarketAnalysis {
  summary: string;
  outlook: 'bullish' | 'bearish' | 'neutral';
  keyInsights: string[];
  riskLevel: 'low' | 'medium' | 'high';
}

// ============================================
// BASE GROQ CHAT
// ============================================

async function chatWithGroq(
  messages: ChatMessage[],
  options?: { temperature?: number; maxTokens?: number }
): Promise<string> {
  if (!GROQ_API_KEY) {
    throw new Error('GROQ_API_KEY not configured');
  }

  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${GROQ_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: GROQ_MODEL,
      messages,
      temperature: options?.temperature ?? 0.3,
      max_tokens: options?.maxTokens ?? 1024,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Groq API error: ${error}`);
  }

  const data = await response.json();
  return data.choices[0].message.content;
}

// ============================================
// AI SENTIMENT ANALYSIS
// ============================================

const SENTIMENT_PROMPT = `You are a crypto market sentiment analyst. Analyze the given text and respond with ONLY valid JSON.

Response format:
{
  "score": <number from -1 to 1>,
  "label": <"very_bearish" | "bearish" | "neutral" | "bullish" | "very_bullish">,
  "confidence": <number from 0 to 1>,
  "reasoning": <brief explanation>,
  "topics": <array of topics>,
  "entities": <array of coins/companies mentioned>
}

Rules:
- -1 = extremely bearish, 1 = extremely bullish
- Consider context (NOT going to moon = bearish)
- Extract coin symbols (BTC, ETH, etc.)`;

export async function analyzeSentimentAI(text: string): Promise<SentimentAnalysis> {
  try {
    const response = await chatWithGroq([
      { role: 'system', content: SENTIMENT_PROMPT },
      { role: 'user', content: `Analyze: "${text.slice(0, 500)}"` },
    ], { temperature: 0.2 });

    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Invalid JSON response');
    }

    const result = JSON.parse(jsonMatch[0]);

    return {
      score: Math.max(-1, Math.min(1, result.score || 0)),
      label: result.label || 'neutral',
      confidence: Math.max(0, Math.min(1, result.confidence || 0.5)),
      reasoning: result.reasoning || '',
      topics: result.topics || [],
      entities: result.entities || [],
    };
  } catch (error) {
    console.error('AI sentiment analysis failed:', error);
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

// ============================================
// CONTENT SUMMARIZATION
// ============================================

const SUMMARY_PROMPT = `You are a crypto market analyst. Summarize the content and respond with ONLY valid JSON.

Response format:
{
  "summary": <2-3 sentence summary>,
  "keyPoints": <array of 3-5 bullet points>,
  "sentiment": <"bullish" | "bearish" | "neutral">,
  "coinsMentioned": <array of coin symbols>
}`;

export async function summarizeContent(content: string): Promise<ContentSummary> {
  try {
    const response = await chatWithGroq([
      { role: 'system', content: SUMMARY_PROMPT },
      { role: 'user', content: `Summarize:\n${content.slice(0, 2000)}` },
    ], { temperature: 0.3 });

    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Invalid JSON response');
    }

    const result = JSON.parse(jsonMatch[0]);

    return {
      summary: result.summary || 'Summary unavailable',
      keyPoints: result.keyPoints || result.key_points || [],
      sentiment: result.sentiment || 'neutral',
      coinsMentioned: result.coinsMentioned || result.coins_mentioned || [],
    };
  } catch (error) {
    console.error('Content summarization failed:', error);
    return {
      summary: 'Summary generation failed',
      keyPoints: [],
      sentiment: 'neutral',
      coinsMentioned: [],
    };
  }
}

// ============================================
// MARKET ANALYSIS GENERATION
// ============================================

const MARKET_ANALYSIS_PROMPT = `You are a professional crypto market analyst. Generate a market analysis and respond with ONLY valid JSON.

Response format:
{
  "summary": <3-4 sentence market summary>,
  "outlook": <"bullish" | "bearish" | "neutral">,
  "keyInsights": <array of 3-5 key insights>,
  "riskLevel": <"low" | "medium" | "high">
}`;

export async function generateMarketAnalysis(data: {
  topCoins: Array<{ symbol: string; price: number; change24h: number }>;
  fearGreedIndex: number;
  fearGreedLabel: string;
  totalMarketCap?: number;
  btcDominance?: number;
}): Promise<MarketAnalysis> {
  try {
    const dataText = `
MARKET DATA:
${data.topCoins.slice(0, 10).map(c =>
  `${c.symbol}: $${c.price.toLocaleString()} (${c.change24h > 0 ? '+' : ''}${c.change24h.toFixed(2)}%)`
).join('\n')}

SENTIMENT: Fear & Greed Index = ${data.fearGreedIndex} (${data.fearGreedLabel})
${data.totalMarketCap ? `Total Market Cap: $${(data.totalMarketCap / 1e12).toFixed(2)}T` : ''}
${data.btcDominance ? `BTC Dominance: ${data.btcDominance.toFixed(1)}%` : ''}`;

    const response = await chatWithGroq([
      { role: 'system', content: MARKET_ANALYSIS_PROMPT },
      { role: 'user', content: `Analyze this market data:\n${dataText}` },
    ], { temperature: 0.4 });

    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Invalid JSON response');
    }

    const result = JSON.parse(jsonMatch[0]);

    return {
      summary: result.summary || 'Analysis unavailable',
      outlook: result.outlook || 'neutral',
      keyInsights: result.keyInsights || result.key_insights || [],
      riskLevel: result.riskLevel || result.risk_level || 'medium',
    };
  } catch (error) {
    console.error('Market analysis generation failed:', error);
    return {
      summary: 'Market analysis generation failed',
      outlook: 'neutral',
      keyInsights: [],
      riskLevel: 'medium',
    };
  }
}

// ============================================
// DAILY SUMMARY GENERATION
// ============================================

export async function generateDailySummary(data: {
  category: 'market' | 'defi' | 'whales' | 'sentiment';
  content: string;
  metrics?: Record<string, number>;
}): Promise<{
  summary: string;
  keyPoints: string[];
  sentimentScore: number;
  sentimentLabel: string;
}> {
  try {
    const prompt = `Generate a daily ${data.category} summary. Respond with ONLY valid JSON:
{
  "summary": <2-3 sentence summary of the day>,
  "keyPoints": <array of 3-5 key points>,
  "sentimentScore": <-1 to 1>,
  "sentimentLabel": <"bullish" | "bearish" | "neutral">
}

Data to summarize:
${data.content.slice(0, 3000)}
${data.metrics ? `\nMetrics: ${JSON.stringify(data.metrics)}` : ''}`;

    const response = await chatWithGroq([
      { role: 'system', content: 'You are a crypto market analyst generating daily summaries.' },
      { role: 'user', content: prompt },
    ], { temperature: 0.3 });

    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Invalid JSON response');
    }

    const result = JSON.parse(jsonMatch[0]);

    return {
      summary: result.summary || 'Summary unavailable',
      keyPoints: result.keyPoints || result.key_points || [],
      sentimentScore: result.sentimentScore || result.sentiment_score || 0,
      sentimentLabel: result.sentimentLabel || result.sentiment_label || 'neutral',
    };
  } catch (error) {
    console.error('Daily summary generation failed:', error);
    return {
      summary: 'Summary generation failed',
      keyPoints: [],
      sentimentScore: 0,
      sentimentLabel: 'neutral',
    };
  }
}

// ============================================
// HEALTH CHECK
// ============================================

export function isGroqConfigured(): boolean {
  return !!GROQ_API_KEY;
}

export async function testGroqConnection(): Promise<{ success: boolean; error?: string }> {
  if (!GROQ_API_KEY) {
    return { success: false, error: 'GROQ_API_KEY not set' };
  }

  try {
    await chatWithGroq([
      { role: 'user', content: 'Say "OK" if you can hear me.' },
    ], { maxTokens: 10 });
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Connection failed'
    };
  }
}
