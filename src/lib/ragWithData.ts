// ============================================
// RAG WITH REAL DATA - Context Injection Approach
// Uses Groq (FREE) + Your Supabase Data
// ============================================

import { supabase, isSupabaseConfigured } from './supabase';

// Groq API configuration
const GROQ_API_KEY = process.env.GROQ_API_KEY;
const GROQ_MODEL = process.env.GROQ_MODEL || 'llama-3.1-70b-versatile';

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface RAGResponse {
  answer: string;
  dataUsed: string[];
  confidence: 'high' | 'medium' | 'low';
  tokensUsed?: number;
}

// ============================================
// DATA FETCHERS - Get real data from Supabase
// ============================================

async function getMarketData(symbols?: string[]): Promise<string> {
  if (!isSupabaseConfigured || !supabase) return '';

  try {
    let query = supabase
      .from('market_data')
      .select('symbol, name, price, price_change_24h, market_cap, volume_24h')
      .order('market_cap', { ascending: false })
      .limit(20);

    if (symbols && symbols.length > 0) {
      query = query.in('symbol', symbols);
    }

    const { data, error } = await query;
    if (error || !data) return '';

    return data.map(coin =>
      `${coin.name} (${coin.symbol}): $${Number(coin.price).toLocaleString()} | 24h: ${Number(coin.price_change_24h).toFixed(2)}% | MCap: $${(Number(coin.market_cap) / 1e9).toFixed(2)}B`
    ).join('\n');
  } catch {
    return '';
  }
}

async function getFearGreedData(): Promise<string> {
  if (!isSupabaseConfigured || !supabase) return '';

  try {
    const { data, error } = await supabase
      .from('fear_greed_history')
      .select('value, classification, timestamp')
      .order('timestamp', { ascending: false })
      .limit(7);

    if (error || !data || data.length === 0) return '';

    const latest = data[0];
    const history = data.map(d => `${new Date(d.timestamp).toLocaleDateString()}: ${d.value} (${d.classification})`).join(', ');

    return `Current Fear & Greed: ${latest.value} (${latest.classification})\nRecent history: ${history}`;
  } catch {
    return '';
  }
}

async function getWhaleActivity(): Promise<string> {
  if (!isSupabaseConfigured || !supabase) return '';

  try {
    const { data, error } = await supabase
      .from('whale_transactions')
      .select('blockchain, amount, amount_usd, tx_type, timestamp')
      .order('timestamp', { ascending: false })
      .limit(10);

    if (error || !data || data.length === 0) return '';

    const totalVolume = data.reduce((sum, tx) => sum + Number(tx.amount_usd || 0), 0);
    const inflows = data.filter(tx => tx.tx_type === 'exchange_deposit').length;
    const outflows = data.filter(tx => tx.tx_type === 'exchange_withdrawal').length;

    return `Recent whale activity (last 10 transactions):
- Total volume: $${(totalVolume / 1e6).toFixed(2)}M
- Exchange deposits: ${inflows} (potential selling)
- Exchange withdrawals: ${outflows} (potential accumulation)
- Recent transactions: ${data.slice(0, 3).map(tx =>
    `${tx.blockchain}: $${(Number(tx.amount_usd) / 1e6).toFixed(2)}M ${tx.tx_type}`
  ).join(', ')}`;
  } catch {
    return '';
  }
}

async function getDerivativesData(): Promise<string> {
  if (!isSupabaseConfigured || !supabase) return '';

  try {
    const { data, error } = await supabase
      .from('derivatives_cache')
      .select('symbol, open_interest, funding_rate, long_short_ratio, liquidations_24h')
      .in('symbol', ['BTCUSDT', 'ETHUSDT']);

    if (error || !data || data.length === 0) return '';

    return data.map(d => {
      const fundingAnnualized = (Number(d.funding_rate) * 3 * 365).toFixed(2);
      return `${d.symbol}: OI $${(Number(d.open_interest) / 1e9).toFixed(2)}B | Funding: ${Number(d.funding_rate).toFixed(4)}% (${fundingAnnualized}% APR) | L/S Ratio: ${Number(d.long_short_ratio).toFixed(2)} | 24h Liquidations: $${(Number(d.liquidations_24h) / 1e6).toFixed(2)}M`;
    }).join('\n');
  } catch {
    return '';
  }
}

async function getMacroData(): Promise<string> {
  if (!isSupabaseConfigured || !supabase) return '';

  try {
    const { data, error } = await supabase
      .from('macro_data_cache')
      .select('indicator, value, source');

    if (error || !data || data.length === 0) return '';

    const indicators: Record<string, string> = {};
    data.forEach(d => {
      indicators[d.indicator] = `${Number(d.value).toFixed(2)}`;
    });

    return `Macro indicators:
- Fed Funds Rate: ${indicators['fedFundsRate'] || 'N/A'}%
- 10Y Treasury: ${indicators['treasury10Y'] || 'N/A'}%
- DXY (USD Index): ${indicators['dxy'] || 'N/A'}
- VIX (Volatility): ${indicators['vix'] || 'N/A'}
- S&P 500 24h: ${indicators['sp500Change'] || 'N/A'}%
- Nasdaq 24h: ${indicators['nasdaqChange'] || 'N/A'}%`;
  } catch {
    return '';
  }
}

async function getPredictionData(coinId?: string): Promise<string> {
  if (!isSupabaseConfigured || !supabase) return '';

  try {
    let query = supabase
      .from('prediction_cache')
      .select('coin_id, coin_name, prediction, confidence, risk_level, reasons, overall_score')
      .order('updated_at', { ascending: false });

    if (coinId) {
      query = query.eq('coin_id', coinId);
    } else {
      query = query.limit(10);
    }

    const { data, error } = await query;
    if (error || !data || data.length === 0) return '';

    return data.map(p =>
      `${p.coin_name}: ${p.prediction} (${p.confidence}% confidence, ${p.risk_level} risk) - Score: ${p.overall_score}/100`
    ).join('\n');
  } catch {
    return '';
  }
}

// ============================================
// CONTEXT BUILDER - Determine what data to fetch
// ============================================

function detectQueryIntent(query: string): {
  needsMarket: boolean;
  needsFearGreed: boolean;
  needsWhales: boolean;
  needsDerivatives: boolean;
  needsMacro: boolean;
  needsPredictions: boolean;
  specificCoins: string[];
} {
  const q = query.toLowerCase();

  // Detect specific coins
  const coinPatterns = [
    { pattern: /\bbtc\b|bitcoin/i, symbol: 'BTC' },
    { pattern: /\beth\b|ethereum/i, symbol: 'ETH' },
    { pattern: /\bsol\b|solana/i, symbol: 'SOL' },
    { pattern: /\bxrp\b|ripple/i, symbol: 'XRP' },
    { pattern: /\bbnb\b/i, symbol: 'BNB' },
    { pattern: /\bada\b|cardano/i, symbol: 'ADA' },
    { pattern: /\bdoge\b|dogecoin/i, symbol: 'DOGE' },
  ];

  const specificCoins = coinPatterns
    .filter(p => p.pattern.test(query))
    .map(p => p.symbol);

  return {
    needsMarket: /price|market|trading|volume|cap|worth|cost|buy|sell/i.test(q),
    needsFearGreed: /fear|greed|sentiment|mood|feeling|emotion/i.test(q),
    needsWhales: /whale|large.*transaction|big.*move|exchange.*flow|accumul|dump/i.test(q),
    needsDerivatives: /future|perpetual|funding|liquidat|leverage|long|short|open.*interest/i.test(q),
    needsMacro: /macro|fed|interest.*rate|treasury|dxy|dollar|vix|stock|s&p|nasdaq|economy/i.test(q),
    needsPredictions: /predict|forecast|outlook|bull|bear|expect|will.*go|should.*i/i.test(q),
    specificCoins,
  };
}

async function buildContext(query: string): Promise<{ context: string; dataUsed: string[] }> {
  const intent = detectQueryIntent(query);
  const dataUsed: string[] = [];
  const contextParts: string[] = [];

  // Always include some market data for context
  const marketData = await getMarketData(intent.specificCoins.length > 0 ? intent.specificCoins : undefined);
  if (marketData) {
    contextParts.push(`📊 CURRENT MARKET DATA:\n${marketData}`);
    dataUsed.push('market_data');
  }

  if (intent.needsFearGreed || intent.needsPredictions) {
    const fgData = await getFearGreedData();
    if (fgData) {
      contextParts.push(`😰 FEAR & GREED INDEX:\n${fgData}`);
      dataUsed.push('fear_greed');
    }
  }

  if (intent.needsWhales) {
    const whaleData = await getWhaleActivity();
    if (whaleData) {
      contextParts.push(`🐋 WHALE ACTIVITY:\n${whaleData}`);
      dataUsed.push('whale_transactions');
    }
  }

  if (intent.needsDerivatives) {
    const derivData = await getDerivativesData();
    if (derivData) {
      contextParts.push(`📈 DERIVATIVES DATA:\n${derivData}`);
      dataUsed.push('derivatives');
    }
  }

  if (intent.needsMacro) {
    const macroData = await getMacroData();
    if (macroData) {
      contextParts.push(`🏛️ MACRO INDICATORS:\n${macroData}`);
      dataUsed.push('macro_data');
    }
  }

  if (intent.needsPredictions) {
    const predData = await getPredictionData(intent.specificCoins[0]?.toLowerCase());
    if (predData) {
      contextParts.push(`🔮 AI PREDICTIONS:\n${predData}`);
      dataUsed.push('predictions');
    }
  }

  return {
    context: contextParts.join('\n\n'),
    dataUsed,
  };
}

// ============================================
// GROQ CHAT - Generate response with context
// ============================================

async function chatWithGroq(messages: ChatMessage[], systemPrompt: string): Promise<{ content: string; tokensUsed?: number }> {
  if (!GROQ_API_KEY) {
    throw new Error('GROQ_API_KEY not configured. Get a free key at https://console.groq.com');
  }

  const allMessages = [
    { role: 'system', content: systemPrompt },
    ...messages,
  ];

  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${GROQ_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: GROQ_MODEL,
      messages: allMessages,
      temperature: 0.7,
      max_tokens: 2048,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Groq API error: ${error}`);
  }

  const data = await response.json();

  return {
    content: data.choices[0].message.content,
    tokensUsed: data.usage?.total_tokens,
  };
}

// ============================================
// MAIN RAG FUNCTION
// ============================================

export async function ragQuery(
  userQuery: string,
  conversationHistory?: ChatMessage[]
): Promise<RAGResponse> {
  try {
    // 1. Build context from Supabase data
    const { context, dataUsed } = await buildContext(userQuery);

    // 2. Create system prompt with context
    const systemPrompt = `You are DataSimplify's AI crypto analyst with access to REAL-TIME DATA.

YOUR DATA ACCESS (as of ${new Date().toISOString()}):
${context || 'No specific data available for this query.'}

IMPORTANT GUIDELINES:
1. Use the ACTUAL DATA above to answer questions - don't make up numbers
2. If data is missing, say "I don't have current data for that"
3. Always cite which data you're using (e.g., "Based on current market data...")
4. Never give direct financial advice - use phrases like "the data suggests..." or "historically..."
5. Explain complex concepts simply
6. Be concise but thorough

DISCLAIMER: Always remind users this is for informational purposes only and not financial advice.`;

    // 3. Build messages
    const messages: ChatMessage[] = [
      ...(conversationHistory || []),
      { role: 'user', content: userQuery },
    ];

    // 4. Get response from Groq
    const { content, tokensUsed } = await chatWithGroq(messages, systemPrompt);

    // 5. Determine confidence based on data availability
    let confidence: 'high' | 'medium' | 'low' = 'low';
    if (dataUsed.length >= 3) confidence = 'high';
    else if (dataUsed.length >= 1) confidence = 'medium';

    return {
      answer: content,
      dataUsed,
      confidence,
      tokensUsed,
    };
  } catch (error) {
    console.error('RAG query error:', error);
    throw error;
  }
}

// ============================================
// QUICK ANALYSIS FUNCTIONS
// ============================================

export async function getMarketSummary(): Promise<RAGResponse> {
  return ragQuery('Give me a brief summary of the current crypto market conditions, including top coins, sentiment, and any notable whale activity.');
}

export async function getCoinAnalysis(coinSymbol: string): Promise<RAGResponse> {
  return ragQuery(`Analyze ${coinSymbol} - current price action, sentiment, whale activity, and what the data suggests for the near term.`);
}

export async function getRiskAssessment(): Promise<RAGResponse> {
  return ragQuery('Based on all available data (fear/greed, derivatives, macro, whale activity), what is the current risk environment for crypto?');
}
