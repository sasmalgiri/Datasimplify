// ============================================
// RAG WITH REAL DATA - Context Injection Approach
// Uses Groq (FREE) + Your Supabase Data
// Enhanced with User Profiling & Multi-Dimensional Signals
// ============================================

import { supabase, isSupabaseConfigured } from './supabase';
import { getSentimentSignalsForPrediction } from './sentimentProfiler';
import { getWalletSignals, getExchangeFlowSummary } from './walletProfiler';

// Groq API configuration
const GROQ_API_KEY = process.env.GROQ_API_KEY;
const GROQ_MODEL = process.env.GROQ_MODEL || 'llama-3.3-70b-versatile';

// Feature toggles
const ENABLE_AI_SUMMARIES = process.env.ENABLE_AI_SUMMARIES !== 'false';
const ENABLE_SENTIMENT_SIGNALS = process.env.ENABLE_SENTIMENT_SIGNALS !== 'false';
const ENABLE_SMART_MONEY = process.env.ENABLE_SMART_MONEY !== 'false';
const ENABLE_USER_ADAPTATION = process.env.ENABLE_USER_ADAPTATION !== 'false';

// User experience levels
export type UserLevel = 'beginner' | 'intermediate' | 'pro';

// Query types for specialized handling
export type QueryType = 'general' | 'comparison' | 'scenario' | 'prediction' | 'education';

// Market session info
export type MarketSession = 'us_hours' | 'asian_session' | 'european_session' | 'weekend' | 'off_hours';

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface SourceQuality {
  source: string;
  freshness: string;
  reliability: 'high' | 'medium' | 'low';
  lastUpdated?: string;
}

export interface ComparisonResult {
  coins: string[];
  metrics: { metric: string; values: Record<string, string>; winner?: string }[];
}

export interface RAGResponse {
  answer: string;
  dataUsed: string[];
  confidence: 'high' | 'medium' | 'low';
  tokensUsed?: number;
  userLevel?: UserLevel;
  // Enhanced fields
  suggestedQuestions?: string[];
  sourceQuality?: SourceQuality[];
  marketSession?: MarketSession;
  queryType?: QueryType;
  comparisonData?: ComparisonResult;
}

export interface RAGOptions {
  userLevel?: UserLevel;
  coinSymbol?: string;
  // Portfolio-aware options
  watchlist?: string[];
  portfolioHoldings?: { symbol: string; amount: number; avgCost?: number }[];
  userId?: string;
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
      if (d.value === null || d.value === undefined) return;
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

async function getDailySummaries(): Promise<string> {
  if (!isSupabaseConfigured || !supabase) return '';

  try {
    const { data, error } = await supabase
      .from('daily_summaries')
      .select('category, summary, key_points, sentiment_label, summary_date')
      .order('summary_date', { ascending: false })
      .limit(5);

    if (error || !data || data.length === 0) return '';

    return data.map(s => {
      const points = Array.isArray(s.key_points) ? s.key_points.slice(0, 3).join('; ') : '';
      return `[${s.category.toUpperCase()} - ${s.summary_date}] ${s.summary}${points ? ` Key points: ${points}` : ''} (Outlook: ${s.sentiment_label})`;
    }).join('\n');
  } catch {
    return '';
  }
}

// ============================================
// PROFILER CONTEXT - Multi-dimensional signals
// ============================================

async function getSentimentContext(): Promise<string> {
  if (!ENABLE_SENTIMENT_SIGNALS) return '';

  try {
    const signals = await getSentimentSignalsForPrediction();

    const categoryLines = Object.entries(signals.categoryBreakdown)
      .filter(([, score]) => Math.abs(score) > 10)
      .sort((a, b) => Math.abs(b[1]) - Math.abs(a[1]))
      .slice(0, 5)
      .map(([cat, score]) => `- ${cat}: ${score > 0 ? '+' : ''}${score}`)
      .join('\n');

    return `📊 MULTI-CATEGORY SENTIMENT:
Overall: ${signals.overallScore}/100 (${signals.signal}) | Confidence: ${Math.round(signals.confidence * 100)}%
Risk Level: ${signals.riskLevel} | Theme: ${signals.dominantTheme}

Bullish factors: ${signals.bullishFactors.slice(0, 3).join(', ') || 'None identified'}
Bearish factors: ${signals.bearishFactors.slice(0, 3).join(', ') || 'None identified'}

Category Breakdown:
${categoryLines || 'No significant category signals'}`;
  } catch (error) {
    console.error('Error fetching sentiment context:', error);
    return '';
  }
}

async function getSmartMoneyContext(coinSymbol?: string): Promise<string> {
  if (!ENABLE_SMART_MONEY) return '';

  try {
    const [walletSignals, exchangeFlows] = await Promise.all([
      coinSymbol ? getWalletSignals(coinSymbol, 24) : Promise.resolve(null),
      getExchangeFlowSummary(coinSymbol, 24),
    ]);

    const parts: string[] = [];

    if (walletSignals && walletSignals.confidenceLevel > 0) {
      parts.push(`🐋 SMART MONEY SIGNALS:
Whale Sentiment: ${walletSignals.whaleSentiment} (${walletSignals.confidenceLevel}% confidence)
Direction: ${walletSignals.smartMoneyDirection || 'Unknown'}
Net Flow: ${walletSignals.netFlow >= 0 ? '+' : ''}$${(walletSignals.netFlow / 1e6).toFixed(2)}M (24h)
Top wallets buying: ${walletSignals.topWalletsBuying} | selling: ${walletSignals.topWalletsSelling}`);
    }

    if (exchangeFlows && (exchangeFlows.totalInflow > 0 || exchangeFlows.totalOutflow > 0)) {
      const netFlowStr = exchangeFlows.netFlow >= 0
        ? `Outflows > Inflows by $${(exchangeFlows.netFlow / 1e6).toFixed(2)}M`
        : `Inflows > Outflows by $${(Math.abs(exchangeFlows.netFlow) / 1e6).toFixed(2)}M`;

      const topExchanges = exchangeFlows.byExchange
        .slice(0, 3)
        .map(e => `${e.name}: ${e.net >= 0 ? '-' : '+'}$${(Math.abs(e.net) / 1e6).toFixed(2)}M net`)
        .join(' | ');

      parts.push(`📈 EXCHANGE FLOWS:
Trend: ${exchangeFlows.trend.charAt(0).toUpperCase() + exchangeFlows.trend.slice(1)}
${netFlowStr}
${topExchanges || 'No exchange data'}`);
    }

    return parts.join('\n\n');
  } catch (error) {
    console.error('Error fetching smart money context:', error);
    return '';
  }
}

// ============================================
// ADAPTIVE SYSTEM PROMPTS
// ============================================

function getSystemPromptForLevel(userLevel: UserLevel, context: string): string {
  const basePrompt = `You are DataSimplify's AI crypto analyst with access to recent market data and indicators (when provided).

YOUR DATA ACCESS (as of ${new Date().toISOString()}):
${context || 'No specific data available for this query.'}`;

  const disclaimer = `\n\nDISCLAIMER: This is for informational purposes only and not financial advice.`;

  if (!ENABLE_USER_ADAPTATION) {
    // Default prompt without adaptation
    return `${basePrompt}

IMPORTANT GUIDELINES:
1. Use the ACTUAL DATA above to answer questions - don't make up numbers
2. If data is missing, say "I don't have current data for that"
3. Always cite which data you're using (e.g., "Based on the data provided above...")
4. Never give direct financial advice - use phrases like "the data suggests..." or "historically..."
5. Explain complex concepts simply
6. Be concise but thorough
${disclaimer}`;
  }

  switch (userLevel) {
    case 'beginner':
      return `${basePrompt}

USER LEVEL: BEGINNER - Explain everything simply!

GUIDELINES FOR BEGINNERS:
1. Explain ALL crypto terms in simple language (e.g., "Market cap is like the total value of all coins")
2. Use real-world analogies to explain concepts
3. Always include a "What this means for you" section
4. Highlight risks prominently with clear warnings
5. Avoid jargon - if you must use a term, explain it
6. Use the ACTUAL DATA above - don't make up numbers
7. Suggest what to learn or watch next
8. Break down complex analysis into simple bullet points
9. Use phrases like "Think of it this way..." to help understanding

FORMATTING:
- Use simple language a non-crypto person would understand
- Include emoji to make it friendlier and highlight key points
- End with "Key Takeaway" in plain English
${disclaimer}`;

    case 'intermediate':
      return `${basePrompt}

USER LEVEL: INTERMEDIATE - Provide context but skip basics.

GUIDELINES FOR INTERMEDIATE USERS:
1. Assume familiarity with basic crypto concepts (BTC, ETH, market cap, etc.)
2. Explain more advanced concepts briefly when relevant
3. Include relevant metrics and their interpretation
4. Discuss trade-offs and considerations
5. Reference current market conditions and trends
6. Use the ACTUAL DATA above - cite your sources
7. Provide context for why metrics matter
8. Balance detail with readability

FORMATTING:
- Technical terms are OK but explain nuanced concepts
- Include data citations (e.g., "Based on the current Fear & Greed of 45...")
- Moderate use of bullet points for clarity
${disclaimer}`;

    case 'pro':
      return `${basePrompt}

USER LEVEL: PRO - Be concise and technical.

GUIDELINES FOR PRO USERS:
1. Skip basic explanations - they know the fundamentals
2. Use technical terminology freely (OI, funding rates, L/S ratio, etc.)
3. Focus on actionable insights and edge cases
4. Include nuanced analysis and correlations
5. Be data-dense and concise
6. Use the ACTUAL DATA above - reference specific numbers
7. Highlight anomalies and unusual patterns
8. Discuss implications rather than definitions

FORMATTING:
- Dense, technical language is preferred
- Data-first approach
- Skip emoji except for section headers
- Focus on signal, not noise
${disclaimer}`;

    default:
      return `${basePrompt}

IMPORTANT GUIDELINES:
1. Use the ACTUAL DATA above to answer questions - don't make up numbers
2. If data is missing, say "I don't have current data for that"
3. Always cite which data you're using
4. Never give direct financial advice
5. Explain complex concepts simply
6. Be concise but thorough
${disclaimer}`;
  }
}

// ============================================
// MARKET SESSION & TIME CONTEXT
// ============================================

function getMarketSession(): { session: MarketSession; description: string } {
  const now = new Date();
  const utcHour = now.getUTCHours();
  const day = now.getUTCDay();

  // Weekend check
  if (day === 0 || day === 6) {
    return { session: 'weekend', description: 'Weekend - lower liquidity, watch for volatility on Sunday evening' };
  }

  // US Market Hours (14:30 - 21:00 UTC / 9:30 AM - 4:00 PM EST)
  if (utcHour >= 14 && utcHour < 21) {
    return { session: 'us_hours', description: 'US market hours - highest liquidity, institutional activity' };
  }

  // Asian Session (00:00 - 08:00 UTC)
  if (utcHour >= 0 && utcHour < 8) {
    return { session: 'asian_session', description: 'Asian session - watch for China/Japan news, altcoin movements' };
  }

  // European Session (07:00 - 16:00 UTC)
  if (utcHour >= 7 && utcHour < 16) {
    return { session: 'european_session', description: 'European session - moderate volume, ECB/regulatory news' };
  }

  return { session: 'off_hours', description: 'Off-hours - lower volume, potential for sudden moves' };
}

function getTimeAwareContext(): string {
  const { session, description } = getMarketSession();
  const now = new Date();

  return `⏰ MARKET TIMING:
Session: ${session.replace('_', ' ').toUpperCase()}
${description}
Current UTC: ${now.toUTCString()}`;
}

// ============================================
// QUERY TYPE DETECTION
// ============================================

function detectQueryType(query: string): {
  type: QueryType;
  comparisonCoins?: string[];
  scenarioParams?: { coin?: string; changePercent?: number; direction?: 'up' | 'down' };
} {
  const q = query.toLowerCase();

  // Comparison detection
  const comparisonPatterns = [
    /compare\s+(\w+)\s+(?:and|vs|versus|to|with)\s+(\w+)/i,
    /(\w+)\s+vs\.?\s+(\w+)/i,
    /(\w+)\s+versus\s+(\w+)/i,
    /which.*better.*(\w+)\s+or\s+(\w+)/i,
    /(\w+)\s+or\s+(\w+).*(?:better|prefer|choose)/i,
  ];

  for (const pattern of comparisonPatterns) {
    const match = query.match(pattern);
    if (match) {
      return {
        type: 'comparison',
        comparisonCoins: [match[1].toUpperCase(), match[2].toUpperCase()],
      };
    }
  }

  // Scenario detection ("what if BTC drops 10%")
  const scenarioPatterns = [
    /what\s+if\s+(\w+)\s+(?:drops?|falls?|crashes?|declines?)\s+(\d+)%?/i,
    /what\s+if\s+(\w+)\s+(?:rises?|jumps?|pumps?|gains?)\s+(\d+)%?/i,
    /if\s+(\w+)\s+(?:goes?|moves?)\s+(up|down)\s+(\d+)%?/i,
    /(\w+)\s+(?:drops?|crashes?)\s+(\d+)%.*what/i,
  ];

  for (const pattern of scenarioPatterns) {
    const match = query.match(pattern);
    if (match) {
      const isDown = /drop|fall|crash|decline|down/i.test(match[0]);
      return {
        type: 'scenario',
        scenarioParams: {
          coin: match[1].toUpperCase(),
          changePercent: parseInt(match[2]) || parseInt(match[3]) || 10,
          direction: isDown ? 'down' : 'up',
        },
      };
    }
  }

  // Education detection
  if (/what\s+is|how\s+does|explain|teach|learn|understand|mean/i.test(q)) {
    return { type: 'education' };
  }

  // Prediction detection
  if (/predict|forecast|will.*go|expect|outlook|future|next.*week|next.*month/i.test(q)) {
    return { type: 'prediction' };
  }

  return { type: 'general' };
}

// ============================================
// FOLLOW-UP SUGGESTIONS GENERATOR
// ============================================

function generateFollowUpQuestions(
  query: string,
  dataUsed: string[],
  userLevel: UserLevel,
  queryType: QueryType,
  specificCoins: string[]
): string[] {
  const suggestions: string[] = [];

  // Based on what data was used, suggest related queries
  if (dataUsed.includes('market_data') && !dataUsed.includes('derivatives')) {
    suggestions.push('What do the derivatives data (funding rates, open interest) suggest?');
  }

  if (dataUsed.includes('sentiment_signals') && !dataUsed.includes('smart_money')) {
    suggestions.push('What are whales and smart money doing right now?');
  }

  if (!dataUsed.includes('fear_greed')) {
    suggestions.push('What is the current Fear & Greed index?');
  }

  if (!dataUsed.includes('macro_data')) {
    suggestions.push('How might macro conditions (Fed, DXY) affect crypto?');
  }

  // Coin-specific suggestions
  if (specificCoins.length > 0) {
    const coin = specificCoins[0];
    if (!dataUsed.includes('predictions')) {
      suggestions.push(`What's the AI prediction for ${coin}?`);
    }
    suggestions.push(`Compare ${coin} with other top coins`);
  }

  // Query type specific
  if (queryType === 'prediction') {
    suggestions.push('What are the main risks to watch for?');
    suggestions.push('What scenarios could invalidate this prediction?');
  }

  if (queryType === 'comparison') {
    suggestions.push('Which has better fundamentals for long-term holding?');
  }

  // User level specific
  if (userLevel === 'beginner') {
    suggestions.push('Can you explain this in simpler terms?');
    suggestions.push('What should a beginner watch for?');
  } else if (userLevel === 'pro') {
    suggestions.push('What are the key levels to watch?');
    suggestions.push('Show me the on-chain metrics');
  }

  // Deduplicate and limit
  const unique = [...new Set(suggestions)];
  return unique.slice(0, 4);
}

// ============================================
// SOURCE QUALITY TRACKING
// ============================================

async function getSourceQuality(dataUsed: string[]): Promise<SourceQuality[]> {
  const qualities: SourceQuality[] = [];

  const sourceInfo: Record<string, { reliability: 'high' | 'medium' | 'low'; freshnessQuery?: string }> = {
    'market_data': { reliability: 'high' },
    'fear_greed': { reliability: 'high' },
    'whale_transactions': { reliability: 'medium' },
    'derivatives': { reliability: 'high' },
    'macro_data': { reliability: 'high' },
    'predictions': { reliability: 'medium' },
    'daily_summaries': { reliability: 'medium' },
    'sentiment_signals': { reliability: 'medium' },
    'smart_money': { reliability: 'medium' },
  };

  for (const source of dataUsed) {
    const info = sourceInfo[source] || { reliability: 'low' as const };

    // Estimate freshness based on source type
    let freshness = 'Unknown';
    if (['market_data', 'derivatives'].includes(source)) {
      freshness = '< 5 min';
    } else if (['fear_greed', 'whale_transactions'].includes(source)) {
      freshness = '< 1 hour';
    } else if (['daily_summaries', 'predictions'].includes(source)) {
      freshness = '< 24 hours';
    } else {
      freshness = '< 1 hour';
    }

    qualities.push({
      source,
      freshness,
      reliability: info.reliability,
      lastUpdated: new Date().toISOString(),
    });
  }

  return qualities;
}

// ============================================
// COMPARISON ANALYSIS
// ============================================

async function generateComparisonAnalysis(
  coins: string[]
): Promise<{ context: string; comparisonData: ComparisonResult } | null> {
  if (!isSupabaseConfigured || !supabase || coins.length < 2) return null;

  try {
    const { data, error } = await supabase
      .from('market_data')
      .select('symbol, name, price, price_change_24h, price_change_7d, market_cap, volume_24h')
      .in('symbol', coins);

    if (error || !data || data.length < 2) return null;

    const metrics: ComparisonResult['metrics'] = [];
    const coinData = data.reduce((acc, coin) => {
      acc[coin.symbol] = coin;
      return acc;
    }, {} as Record<string, typeof data[0]>);

    // Price
    const priceValues: Record<string, string> = {};
    for (const coin of coins) {
      priceValues[coin] = coinData[coin] ? `$${Number(coinData[coin].price).toLocaleString()}` : 'N/A';
    }
    metrics.push({ metric: 'Current Price', values: priceValues });

    // 24h Change
    const change24hValues: Record<string, string> = {};
    let best24h = { coin: '', value: -Infinity };
    for (const coin of coins) {
      const change = coinData[coin]?.price_change_24h || 0;
      change24hValues[coin] = `${change >= 0 ? '+' : ''}${Number(change).toFixed(2)}%`;
      if (change > best24h.value) best24h = { coin, value: change };
    }
    metrics.push({ metric: '24h Change', values: change24hValues, winner: best24h.coin });

    // 7d Change
    const change7dValues: Record<string, string> = {};
    let best7d = { coin: '', value: -Infinity };
    for (const coin of coins) {
      const change = coinData[coin]?.price_change_7d || 0;
      change7dValues[coin] = `${change >= 0 ? '+' : ''}${Number(change).toFixed(2)}%`;
      if (change > best7d.value) best7d = { coin, value: change };
    }
    metrics.push({ metric: '7d Change', values: change7dValues, winner: best7d.coin });

    // Market Cap
    const mcapValues: Record<string, string> = {};
    let bestMcap = { coin: '', value: -Infinity };
    for (const coin of coins) {
      const mcap = coinData[coin]?.market_cap || 0;
      mcapValues[coin] = `$${(Number(mcap) / 1e9).toFixed(2)}B`;
      if (mcap > bestMcap.value) bestMcap = { coin, value: mcap };
    }
    metrics.push({ metric: 'Market Cap', values: mcapValues, winner: bestMcap.coin });

    // Volume
    const volValues: Record<string, string> = {};
    for (const coin of coins) {
      const vol = coinData[coin]?.volume_24h || 0;
      volValues[coin] = `$${(Number(vol) / 1e9).toFixed(2)}B`;
    }
    metrics.push({ metric: '24h Volume', values: volValues });

    // Build context string
    const contextLines = [`📊 COMPARISON: ${coins.join(' vs ')}`];
    for (const m of metrics) {
      const valueStr = coins.map(c => `${c}: ${m.values[c]}`).join(' | ');
      contextLines.push(`${m.metric}: ${valueStr}${m.winner ? ` (Winner: ${m.winner})` : ''}`);
    }

    return {
      context: contextLines.join('\n'),
      comparisonData: { coins, metrics },
    };
  } catch (error) {
    console.error('Comparison analysis error:', error);
    return null;
  }
}

// ============================================
// SCENARIO ANALYSIS
// ============================================

async function generateScenarioAnalysis(params: {
  coin: string;
  changePercent: number;
  direction: 'up' | 'down';
}): Promise<string> {
  if (!isSupabaseConfigured || !supabase) return '';

  try {
    // Get current price
    const { data: marketData } = await supabase
      .from('market_data')
      .select('price, price_change_24h, market_cap')
      .eq('symbol', params.coin)
      .single();

    if (!marketData) return '';

    const currentPrice = Number(marketData.price);
    const multiplier = params.direction === 'up'
      ? 1 + (params.changePercent / 100)
      : 1 - (params.changePercent / 100);
    const scenarioPrice = currentPrice * multiplier;

    // Historical context - when was it last at this level?
    const historicalContext = params.direction === 'down'
      ? 'This would bring it to levels not seen since the previous correction.'
      : 'This would push it to new recent highs.';

    return `🔮 SCENARIO ANALYSIS: ${params.coin} ${params.direction === 'up' ? '📈' : '📉'} ${params.changePercent}%

Current Price: $${currentPrice.toLocaleString()}
Scenario Price: $${scenarioPrice.toLocaleString()} (${params.direction} ${params.changePercent}%)

Impact Assessment:
- Market Cap would ${params.direction === 'up' ? 'increase' : 'decrease'} by ~$${((Number(marketData.market_cap) * params.changePercent / 100) / 1e9).toFixed(2)}B
- ${historicalContext}
- Liquidation cascades ${params.direction === 'down' ? 'likely if rapid move' : 'would hit shorts'}

Historical Patterns:
- Similar ${params.changePercent}% moves typically recover/correct within 2-4 weeks
- Watch for correlation with macro events and BTC dominance shifts`;
  } catch (error) {
    console.error('Scenario analysis error:', error);
    return '';
  }
}

// ============================================
// PORTFOLIO-AWARE CONTEXT
// ============================================

async function getPortfolioContext(options: RAGOptions): Promise<string> {
  const parts: string[] = [];

  // Watchlist context
  if (options.watchlist && options.watchlist.length > 0) {
    const watchlistData = await getMarketData(options.watchlist);
    if (watchlistData) {
      parts.push(`📋 YOUR WATCHLIST:\n${watchlistData}`);
    }
  }

  // Portfolio holdings context
  if (options.portfolioHoldings && options.portfolioHoldings.length > 0) {
    const symbols = options.portfolioHoldings.map(h => h.symbol);
    const marketData = await getMarketData(symbols);

    if (marketData && isSupabaseConfigured && supabase) {
      const { data: prices } = await supabase
        .from('market_data')
        .select('symbol, price')
        .in('symbol', symbols);

      if (prices) {
        const priceMap = prices.reduce((acc, p) => {
          acc[p.symbol] = Number(p.price);
          return acc;
        }, {} as Record<string, number>);

        let totalValue = 0;
        let totalCost = 0;
        const holdingLines: string[] = [];

        for (const holding of options.portfolioHoldings) {
          const currentPrice = priceMap[holding.symbol] || 0;
          const value = holding.amount * currentPrice;
          totalValue += value;

          if (holding.avgCost) {
            const cost = holding.amount * holding.avgCost;
            totalCost += cost;
            const pnl = ((currentPrice - holding.avgCost) / holding.avgCost) * 100;
            holdingLines.push(`${holding.symbol}: ${holding.amount} @ $${currentPrice.toLocaleString()} = $${value.toLocaleString()} (${pnl >= 0 ? '+' : ''}${pnl.toFixed(2)}%)`);
          } else {
            holdingLines.push(`${holding.symbol}: ${holding.amount} @ $${currentPrice.toLocaleString()} = $${value.toLocaleString()}`);
          }
        }

        const totalPnl = totalCost > 0 ? ((totalValue - totalCost) / totalCost) * 100 : 0;

        parts.push(`💼 YOUR PORTFOLIO:
${holdingLines.join('\n')}
Total Value: $${totalValue.toLocaleString()}${totalCost > 0 ? ` | P&L: ${totalPnl >= 0 ? '+' : ''}${totalPnl.toFixed(2)}%` : ''}`);
      }
    }
  }

  return parts.join('\n\n');
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

interface BuildContextResult {
  context: string;
  dataUsed: string[];
  queryTypeInfo: ReturnType<typeof detectQueryType>;
  comparisonData?: ComparisonResult;
  intent: ReturnType<typeof detectQueryIntent>;
}

async function buildContext(
  query: string,
  options?: RAGOptions
): Promise<BuildContextResult> {
  const intent = detectQueryIntent(query);
  const queryTypeInfo = detectQueryType(query);
  const dataUsed: string[] = [];
  const contextParts: string[] = [];
  let comparisonData: ComparisonResult | undefined;

  // Determine coin symbol from options or query
  const coinSymbol = options?.coinSymbol || intent.specificCoins[0];

  // Add time-aware market session context
  const timeContext = getTimeAwareContext();
  contextParts.push(timeContext);
  dataUsed.push('market_session');

  // Portfolio context (if user has watchlist/holdings)
  if (options?.watchlist?.length || options?.portfolioHoldings?.length) {
    const portfolioContext = await getPortfolioContext(options);
    if (portfolioContext) {
      contextParts.push(portfolioContext);
      dataUsed.push('portfolio');
    }
  }

  // Handle comparison queries specially
  if (queryTypeInfo.type === 'comparison' && queryTypeInfo.comparisonCoins) {
    const comparisonResult = await generateComparisonAnalysis(queryTypeInfo.comparisonCoins);
    if (comparisonResult) {
      contextParts.push(comparisonResult.context);
      comparisonData = comparisonResult.comparisonData;
      dataUsed.push('comparison');
    }
  }

  // Handle scenario queries specially
  if (queryTypeInfo.type === 'scenario' && queryTypeInfo.scenarioParams) {
    const scenarioContext = await generateScenarioAnalysis(queryTypeInfo.scenarioParams as {
      coin: string;
      changePercent: number;
      direction: 'up' | 'down';
    });
    if (scenarioContext) {
      contextParts.push(scenarioContext);
      dataUsed.push('scenario_analysis');
    }
  }

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

  // AI summaries (if enabled)
  if (ENABLE_AI_SUMMARIES) {
    const summaryData = await getDailySummaries();
    if (summaryData) {
      contextParts.push(`📋 AI MARKET ANALYSIS:\n${summaryData}`);
      dataUsed.push('daily_summaries');
    }
  }

  // Multi-category sentiment signals (if enabled)
  if (ENABLE_SENTIMENT_SIGNALS) {
    const sentimentContext = await getSentimentContext();
    if (sentimentContext) {
      contextParts.push(sentimentContext);
      dataUsed.push('sentiment_signals');
    }
  }

  // Smart money / whale profiler signals (if enabled)
  if (ENABLE_SMART_MONEY && (intent.needsWhales || intent.needsPredictions || coinSymbol)) {
    const smartMoneyContext = await getSmartMoneyContext(coinSymbol);
    if (smartMoneyContext) {
      contextParts.push(smartMoneyContext);
      dataUsed.push('smart_money');
    }
  }

  return {
    context: contextParts.join('\n\n'),
    dataUsed,
    queryTypeInfo,
    comparisonData,
    intent,
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
// STREAMING CHAT - For real-time responses
// ============================================

async function* streamWithGroq(
  messages: ChatMessage[],
  systemPrompt: string
): AsyncGenerator<string, { tokensUsed?: number }, unknown> {
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
      stream: true,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Groq API error: ${error}`);
  }

  const reader = response.body?.getReader();
  if (!reader) throw new Error('No response body');

  const decoder = new TextDecoder();
  let tokensUsed = 0;

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value, { stream: true });
      const lines = chunk.split('\n').filter(line => line.trim() !== '');

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6);
          if (data === '[DONE]') continue;

          try {
            const parsed = JSON.parse(data);
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) {
              yield content;
            }
            // Capture usage if present (usually in last chunk)
            if (parsed.usage?.total_tokens) {
              tokensUsed = parsed.usage.total_tokens;
            }
          } catch {
            // Skip invalid JSON chunks
          }
        }
      }
    }
  } finally {
    reader.releaseLock();
  }

  return { tokensUsed };
}

/**
 * Streaming RAG query - yields chunks of the response as they arrive
 */
export async function* ragQueryStream(
  userQuery: string,
  conversationHistory?: ChatMessage[],
  options?: RAGOptions
): AsyncGenerator<
  { type: 'chunk'; content: string } | { type: 'metadata'; data: Omit<RAGResponse, 'answer'> },
  void,
  unknown
> {
  const startTime = Date.now();

  // Determine user level
  const userLevel: UserLevel = options?.userLevel || 'intermediate';

  // Build context
  const { context, dataUsed, queryTypeInfo, comparisonData, intent } = await buildContext(userQuery, options);

  // Create system prompt
  const systemPrompt = getSystemPromptForLevel(userLevel, context);

  // Build messages
  const messages: ChatMessage[] = [
    ...(conversationHistory || []),
    { role: 'user', content: userQuery },
  ];

  // Determine confidence
  let confidence: 'high' | 'medium' | 'low' = 'low';
  if (dataUsed.length >= 5) confidence = 'high';
  else if (dataUsed.length >= 3) confidence = 'medium';

  // Get market session
  const { session: marketSession } = getMarketSession();

  // Generate follow-up suggestions
  const suggestedQuestions = generateFollowUpQuestions(
    userQuery,
    dataUsed,
    userLevel,
    queryTypeInfo.type,
    intent.specificCoins
  );

  // Get source quality
  const sourceQuality = await getSourceQuality(dataUsed);

  // Stream the response
  let fullContent = '';
  const generator = streamWithGroq(messages, systemPrompt);

  for await (const chunk of generator) {
    if (typeof chunk === 'string') {
      fullContent += chunk;
      yield { type: 'chunk', content: chunk };
    }
  }

  // Calculate response time and save to history
  const responseTimeMs = Date.now() - startTime;
  saveQueryToHistory({
    userId: options?.userId,
    query: userQuery,
    queryType: queryTypeInfo.type,
    dataUsed,
    confidence,
    userLevel,
    coinsMentioned: intent.specificCoins,
    marketSession,
    responseTimeMs,
  }).catch(() => {});

  // Yield metadata at the end
  yield {
    type: 'metadata',
    data: {
      dataUsed,
      confidence,
      userLevel,
      suggestedQuestions,
      sourceQuality,
      marketSession,
      queryType: queryTypeInfo.type,
      comparisonData,
    },
  };
}

// ============================================
// QUERY HISTORY SAVING
// ============================================

async function saveQueryToHistory(params: {
  userId?: string;
  sessionId?: string;
  query: string;
  queryType: QueryType;
  dataUsed: string[];
  confidence: 'high' | 'medium' | 'low';
  userLevel: UserLevel;
  tokensUsed?: number;
  coinsMentioned: string[];
  marketSession: MarketSession;
  responseTimeMs: number;
}): Promise<void> {
  if (!isSupabaseConfigured || !supabase) return;

  try {
    // Get current fear & greed for context
    let fearGreedAtQuery: number | null = null;
    try {
      const { data } = await supabase
        .from('fear_greed_history')
        .select('value')
        .order('timestamp', { ascending: false })
        .limit(1)
        .single();
      if (data) fearGreedAtQuery = data.value;
    } catch {
      // Ignore - optional field
    }

    await supabase.from('rag_query_history').insert({
      user_id: params.userId || null,
      session_id: params.sessionId || null,
      query: params.query,
      query_type: params.queryType,
      data_used: params.dataUsed,
      confidence: params.confidence,
      user_level: params.userLevel,
      tokens_used: params.tokensUsed || null,
      coins_mentioned: params.coinsMentioned.length > 0 ? params.coinsMentioned : null,
      market_session: params.marketSession,
      fear_greed_at_query: fearGreedAtQuery,
      response_time_ms: params.responseTimeMs,
    });
  } catch (error) {
    // Non-blocking - don't fail the query if history save fails
    console.error('Failed to save query history:', error);
  }
}

// ============================================
// MAIN RAG FUNCTION
// ============================================

export async function ragQuery(
  userQuery: string,
  conversationHistory?: ChatMessage[],
  options?: RAGOptions
): Promise<RAGResponse> {
  const startTime = Date.now();

  try {
    // Determine user level (default to intermediate)
    const userLevel: UserLevel = options?.userLevel || 'intermediate';

    // 1. Build context from Supabase data + profilers
    const { context, dataUsed, queryTypeInfo, comparisonData, intent } = await buildContext(userQuery, options);

    // 2. Create adaptive system prompt based on user level
    const systemPrompt = getSystemPromptForLevel(userLevel, context);

    // 3. Build messages
    const messages: ChatMessage[] = [
      ...(conversationHistory || []),
      { role: 'user', content: userQuery },
    ];

    // 4. Get response from Groq
    const { content, tokensUsed } = await chatWithGroq(messages, systemPrompt);

    // 5. Determine confidence based on data availability
    let confidence: 'high' | 'medium' | 'low' = 'low';
    if (dataUsed.length >= 5) confidence = 'high';
    else if (dataUsed.length >= 3) confidence = 'medium';

    // 6. Get market session info
    const { session: marketSession } = getMarketSession();

    // 7. Generate follow-up suggestions
    const suggestedQuestions = generateFollowUpQuestions(
      userQuery,
      dataUsed,
      userLevel,
      queryTypeInfo.type,
      intent.specificCoins
    );

    // 8. Get source quality info
    const sourceQuality = await getSourceQuality(dataUsed);

    // 9. Save query to history (non-blocking)
    const responseTimeMs = Date.now() - startTime;
    saveQueryToHistory({
      userId: options?.userId,
      query: userQuery,
      queryType: queryTypeInfo.type,
      dataUsed,
      confidence,
      userLevel,
      tokensUsed,
      coinsMentioned: intent.specificCoins,
      marketSession,
      responseTimeMs,
    }).catch(() => {}); // Fire and forget - don't await

    return {
      answer: content,
      dataUsed,
      confidence,
      tokensUsed,
      userLevel,
      // Enhanced fields
      suggestedQuestions,
      sourceQuality,
      marketSession,
      queryType: queryTypeInfo.type,
      comparisonData,
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
