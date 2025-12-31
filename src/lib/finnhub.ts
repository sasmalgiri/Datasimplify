// ============================================
// FINNHUB API - Commercial Use Allowed
// ============================================
// FREE tier: 60 API calls/minute
// Commercial use: YES (with attribution)
// Docs: https://finnhub.io/docs/api
// ============================================

const FINNHUB_BASE = 'https://finnhub.io/api/v1';

// Get API key from environment
const getApiKey = () => process.env.FINNHUB_API_KEY || '';

// ============================================
// TYPES
// ============================================

export interface FinnhubSentiment {
  symbol: string;
  year: number;
  month: number;
  change: number;
  mspr: number; // Monthly Share Price Return
}

export interface FinnhubSocialSentiment {
  symbol: string;
  data: Array<{
    atTime: string;
    mention: number;
    positiveScore: number;
    negativeScore: number;
    positiveMention: number;
    negativeMention: number;
    score: number;
  }>;
}

export interface FinnhubNews {
  category: string;
  datetime: number;
  headline: string;
  id: number;
  image: string;
  related: string;
  source: string;
  summary: string;
  url: string;
}

export interface FinnhubCryptoSymbol {
  description: string;
  displaySymbol: string;
  symbol: string;
}

export interface FinnhubCryptoCandle {
  c: number[]; // Close prices
  h: number[]; // High prices
  l: number[]; // Low prices
  o: number[]; // Open prices
  s: string;   // Status
  t: number[]; // Timestamps
  v: number[]; // Volumes
}

// ============================================
// SENTIMENT API FUNCTIONS
// ============================================

/**
 * Fetch social sentiment for a crypto symbol
 * Note: Finnhub uses stock-style symbols, crypto needs BINANCE:BTCUSDT format
 */
export async function fetchFinnhubSocialSentiment(
  symbol: string
): Promise<FinnhubSocialSentiment | null> {
  const apiKey = getApiKey();
  if (!apiKey) {
    console.warn('Finnhub: No API key configured');
    return null;
  }

  try {
    // Finnhub uses exchange:symbol format for crypto
    const cryptoSymbol = `BINANCE:${symbol.toUpperCase()}USDT`;

    const response = await fetch(
      `${FINNHUB_BASE}/stock/social-sentiment?symbol=${cryptoSymbol}&from=2024-01-01&token=${apiKey}`,
      {
        headers: { 'Accept': 'application/json' },
        next: { revalidate: 900 }, // 15 min cache
      }
    );

    if (!response.ok) {
      if (response.status === 429) {
        console.warn('Finnhub: Rate limit reached');
        return null;
      }
      throw new Error(`Finnhub API error: ${response.status}`);
    }

    return response.json();
  } catch (error) {
    console.error('Finnhub sentiment fetch error:', error);
    return null;
  }
}

/**
 * Fetch general market news
 * category: general, forex, crypto, merger
 */
export async function fetchFinnhubNews(
  category: 'general' | 'forex' | 'crypto' | 'merger' = 'crypto'
): Promise<FinnhubNews[]> {
  const apiKey = getApiKey();
  if (!apiKey) {
    console.warn('Finnhub: No API key configured');
    return [];
  }

  try {
    const response = await fetch(
      `${FINNHUB_BASE}/news?category=${category}&token=${apiKey}`,
      {
        headers: { 'Accept': 'application/json' },
        next: { revalidate: 300 }, // 5 min cache
      }
    );

    if (!response.ok) {
      throw new Error(`Finnhub API error: ${response.status}`);
    }

    return response.json();
  } catch (error) {
    console.error('Finnhub news fetch error:', error);
    return [];
  }
}

/**
 * Fetch company/crypto news by symbol
 */
export async function fetchFinnhubSymbolNews(
  symbol: string,
  from?: string,
  to?: string
): Promise<FinnhubNews[]> {
  const apiKey = getApiKey();
  if (!apiKey) {
    console.warn('Finnhub: No API key configured');
    return [];
  }

  try {
    const today = new Date();
    const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);

    const fromDate = from || weekAgo.toISOString().split('T')[0];
    const toDate = to || today.toISOString().split('T')[0];

    const response = await fetch(
      `${FINNHUB_BASE}/company-news?symbol=${symbol}&from=${fromDate}&to=${toDate}&token=${apiKey}`,
      {
        headers: { 'Accept': 'application/json' },
        next: { revalidate: 300 },
      }
    );

    if (!response.ok) {
      throw new Error(`Finnhub API error: ${response.status}`);
    }

    return response.json();
  } catch (error) {
    console.error('Finnhub symbol news fetch error:', error);
    return [];
  }
}

// ============================================
// CRYPTO-SPECIFIC FUNCTIONS
// ============================================

/**
 * Fetch available crypto symbols from an exchange
 */
export async function fetchFinnhubCryptoSymbols(
  exchange: string = 'BINANCE'
): Promise<FinnhubCryptoSymbol[]> {
  const apiKey = getApiKey();
  if (!apiKey) {
    return [];
  }

  try {
    const response = await fetch(
      `${FINNHUB_BASE}/crypto/symbol?exchange=${exchange}&token=${apiKey}`,
      {
        headers: { 'Accept': 'application/json' },
        next: { revalidate: 3600 }, // 1 hour cache
      }
    );

    if (!response.ok) {
      throw new Error(`Finnhub API error: ${response.status}`);
    }

    return response.json();
  } catch (error) {
    console.error('Finnhub crypto symbols fetch error:', error);
    return [];
  }
}

/**
 * Fetch crypto OHLCV candles
 */
export async function fetchFinnhubCryptoCandles(
  symbol: string,
  resolution: '1' | '5' | '15' | '30' | '60' | 'D' | 'W' | 'M' = 'D',
  from: number,
  to: number
): Promise<FinnhubCryptoCandle | null> {
  const apiKey = getApiKey();
  if (!apiKey) {
    return null;
  }

  try {
    const response = await fetch(
      `${FINNHUB_BASE}/crypto/candle?symbol=${symbol}&resolution=${resolution}&from=${from}&to=${to}&token=${apiKey}`,
      {
        headers: { 'Accept': 'application/json' },
        next: { revalidate: 60 },
      }
    );

    if (!response.ok) {
      throw new Error(`Finnhub API error: ${response.status}`);
    }

    return response.json();
  } catch (error) {
    console.error('Finnhub crypto candles fetch error:', error);
    return null;
  }
}

// ============================================
// SENTIMENT ANALYSIS HELPERS
// ============================================

/**
 * Analyze sentiment from Finnhub news articles
 * Uses simple keyword-based analysis (same as existing comprehensiveSentiment.ts)
 */
export function analyzeNewsHeadlineSentiment(headline: string): {
  score: number;
  label: 'very_bullish' | 'bullish' | 'neutral' | 'bearish' | 'very_bearish';
  confidence: number;
} {
  const lowerHeadline = headline.toLowerCase();

  const bullishKeywords = [
    'surge', 'soar', 'rally', 'gain', 'rise', 'jump', 'bull', 'bullish',
    'record', 'high', 'growth', 'profit', 'win', 'success', 'breakthrough',
    'adoption', 'partnership', 'launch', 'upgrade', 'positive', 'buy'
  ];

  const bearishKeywords = [
    'crash', 'plunge', 'drop', 'fall', 'decline', 'bear', 'bearish',
    'loss', 'low', 'sell', 'dump', 'fear', 'concern', 'risk', 'warning',
    'hack', 'scam', 'fraud', 'ban', 'regulation', 'negative', 'trouble'
  ];

  let bullishCount = 0;
  let bearishCount = 0;

  for (const keyword of bullishKeywords) {
    if (lowerHeadline.includes(keyword)) bullishCount++;
  }

  for (const keyword of bearishKeywords) {
    if (lowerHeadline.includes(keyword)) bearishCount++;
  }

  const total = bullishCount + bearishCount;
  if (total === 0) {
    return { score: 0, label: 'neutral', confidence: 0 };
  }

  const score = (bullishCount - bearishCount) / total;
  const confidence = Math.min(1, total / 5);

  let label: 'very_bullish' | 'bullish' | 'neutral' | 'bearish' | 'very_bearish' = 'neutral';
  if (score >= 0.6) label = 'very_bullish';
  else if (score >= 0.2) label = 'bullish';
  else if (score <= -0.6) label = 'very_bearish';
  else if (score <= -0.2) label = 'bearish';

  return { score, label, confidence };
}

/**
 * Aggregate sentiment from multiple Finnhub news articles
 */
export async function aggregateFinnhubSentiment(): Promise<{
  overallScore: number;
  overallLabel: string;
  newsCount: number;
  topBullish: FinnhubNews[];
  topBearish: FinnhubNews[];
  sources: string[];
}> {
  const news = await fetchFinnhubNews('crypto');

  if (news.length === 0) {
    return {
      overallScore: 50,
      overallLabel: 'Neutral',
      newsCount: 0,
      topBullish: [],
      topBearish: [],
      sources: [],
    };
  }

  const analyzedNews = news.map(article => ({
    ...article,
    sentiment: analyzeNewsHeadlineSentiment(article.headline),
  }));

  const totalScore = analyzedNews.reduce(
    (sum, article) => sum + article.sentiment.score,
    0
  );
  const avgScore = totalScore / analyzedNews.length;
  const overallScore = Math.round((avgScore + 1) * 50); // Convert -1,1 to 0-100

  let overallLabel = 'Neutral';
  if (overallScore >= 70) overallLabel = 'Very Bullish';
  else if (overallScore >= 55) overallLabel = 'Bullish';
  else if (overallScore <= 30) overallLabel = 'Very Bearish';
  else if (overallScore <= 45) overallLabel = 'Bearish';

  const sortedByScore = [...analyzedNews].sort(
    (a, b) => b.sentiment.score - a.sentiment.score
  );

  const uniqueSources = [...new Set(news.map(n => n.source))];

  return {
    overallScore,
    overallLabel,
    newsCount: news.length,
    topBullish: sortedByScore.slice(0, 5),
    topBearish: sortedByScore.slice(-5).reverse(),
    sources: uniqueSources,
  };
}

// ============================================
// TRANSFORM FOR INTERNAL FORMAT
// ============================================

/**
 * Transform Finnhub news to our SentimentPost format
 * Compatible with existing comprehensiveSentiment.ts
 */
export function transformFinnhubNewsToSentimentPost(article: FinnhubNews): {
  id: string;
  source: string;
  platform: string;
  title: string;
  content: string;
  url: string;
  author: string;
  timestamp: string;
  sentiment: {
    score: number;
    label: 'very_bullish' | 'bullish' | 'neutral' | 'bearish' | 'very_bearish';
    confidence: number;
  };
  engagement: {
    likes: number;
    comments: number;
    shares: number;
    views: number;
  };
  coins: string[];
  keywords: string[];
} {
  const sentiment = analyzeNewsHeadlineSentiment(article.headline);

  // Extract coin mentions from headline and summary
  const text = `${article.headline} ${article.summary}`;
  const coins: string[] = [];
  const coinPatterns = ['BTC', 'ETH', 'XRP', 'SOL', 'ADA', 'DOGE', 'BNB', 'MATIC'];
  for (const coin of coinPatterns) {
    if (text.toUpperCase().includes(coin)) {
      coins.push(coin);
    }
  }

  return {
    id: `finnhub-${article.id}`,
    source: 'finnhub',
    platform: article.source,
    title: article.headline,
    content: article.summary.slice(0, 500),
    url: article.url,
    author: article.source,
    timestamp: new Date(article.datetime * 1000).toISOString(),
    sentiment,
    engagement: {
      likes: 0,
      comments: 0,
      shares: 0,
      views: 0,
    },
    coins,
    keywords: sentiment.label !== 'neutral' ? [sentiment.label] : [],
  };
}

/**
 * Fetch and transform Finnhub news to sentiment posts
 */
export async function fetchFinnhubSentimentPosts(): Promise<Array<{
  id: string;
  source: string;
  platform: string;
  title: string;
  content: string;
  url: string;
  author: string;
  timestamp: string;
  sentiment: {
    score: number;
    label: 'very_bullish' | 'bullish' | 'neutral' | 'bearish' | 'very_bearish';
    confidence: number;
  };
  engagement: {
    likes: number;
    comments: number;
    shares: number;
    views: number;
  };
  coins: string[];
  keywords: string[];
}>> {
  const news = await fetchFinnhubNews('crypto');
  return news.map(transformFinnhubNewsToSentimentPost);
}

// ============================================
// EXPORTS
// ============================================

export const FINNHUB_ATTRIBUTION = {
  name: 'Finnhub',
  url: 'https://finnhub.io',
  license: 'Free tier - 60 calls/minute, Commercial use allowed',
  note: 'Real-time financial data and news sentiment',
};

/**
 * Check if Finnhub API is configured
 */
export function isFinnhubConfigured(): boolean {
  return Boolean(process.env.FINNHUB_API_KEY);
}
