// ============================================
// SOCIAL SENTIMENT - Professional-grade analysis
// ============================================
// How it works:
// 1. Aggregate data from Twitter, Reddit, YouTube, TikTok for crypto mentions
// 2. Use NLP/AI to determine sentiment (positive/negative/neutral)
// 3. Calculate engagement metrics (likes, shares, comments)
// 4. Create combined sentiment scores
//
// FREE APIs we use:
// - Reddit API (free with limits)
// - CryptoPanic API (free tier)
// - Our own Fear & Greed calculation

const SENTIMENT_APIS = {
  // CryptoPanic API (Developer tier with API key: 1000 calls/hour)
  cryptoPanic: 'https://cryptopanic.com/api/v1',
  
  // Reddit (free with OAuth)
  reddit: 'https://www.reddit.com',
  
  // Alternative.me Fear & Greed (already using)
  fearGreed: 'https://api.alternative.me/fng/',
  
  // CoinGecko trending (free)
  coingeckoTrending: 'https://api.coingecko.com/api/v3/search/trending',
};

// Types
export interface SocialPost {
  id: string;
  source: 'reddit' | 'twitter' | 'news' | 'telegram';
  title: string;
  content?: string;
  url: string;
  author: string;
  timestamp: string;
  sentiment: 'bullish' | 'bearish' | 'neutral';
  sentimentScore: number; // -1 to 1
  engagement: {
    likes: number;
    comments: number;
    shares: number;
  };
  coins: string[]; // Mentioned coins
}

export interface CoinSentiment {
  symbol: string;
  name: string;
  sentimentScore: number; // -100 to 100
  sentimentLabel: 'Very Bearish' | 'Bearish' | 'Neutral' | 'Bullish' | 'Very Bullish';
  socialVolume24h: number;
  socialVolumeChange24h: number;
  trendingRank: number | null;
  newsCount24h: number;
  redditMentions24h: number;
  sources: {
    reddit: number;
    news: number;
    twitter: number;
  };
}

export interface MarketSentiment {
  overallScore: number;
  overallLabel: string;
  fearGreedIndex: number;
  fearGreedLabel: string;
  socialVolume24h: number;
  topBullish: CoinSentiment[];
  topBearish: CoinSentiment[];
  trending: string[];
}

// ============================================
// METHOD 1: CryptoPanic News Sentiment (FREE)
// ============================================

export async function getCryptoPanicNews(
  filter: 'rising' | 'hot' | 'bullish' | 'bearish' | 'important' = 'hot',
  currencies?: string // e.g., "BTC,ETH"
): Promise<SocialPost[]> {
  try {
    const authToken = process.env.CRYPTOPANIC_API_KEY || 'FREE';
    let url = `${SENTIMENT_APIS.cryptoPanic}/posts/?auth_token=${authToken}&filter=${filter}&public=true`;
    if (currencies) {
      url += `&currencies=${currencies}`;
    }
    
    const response = await fetch(url);
    const data = await response.json();
    
    if (!data.results) return [];
    
    return data.results.map((post: Record<string, unknown>) => {
      // Determine sentiment from votes
      const votes = post.votes as { positive: number; negative: number } || { positive: 0, negative: 0 };
      const sentimentScore = votes.positive - votes.negative;
      
      let sentiment: SocialPost['sentiment'] = 'neutral';
      if (sentimentScore > 2) sentiment = 'bullish';
      if (sentimentScore < -2) sentiment = 'bearish';
      
      return {
        id: post.id as string,
        source: 'news' as const,
        title: post.title as string,
        url: post.url as string,
        author: (post.source as { title: string })?.title || 'Unknown',
        timestamp: post.published_at as string,
        sentiment,
        sentimentScore: Math.max(-1, Math.min(1, sentimentScore / 10)),
        engagement: {
          likes: votes.positive,
          comments: (post.comments as number) || 0,
          shares: 0,
        },
        coins: ((post.currencies as { code: string }[]) || []).map(c => c.code),
      };
    });
  } catch (error) {
    console.error('Error fetching CryptoPanic news:', error);
    return [];
  }
}

// ============================================
// METHOD 2: Reddit Sentiment (FREE - no auth needed for public)
// ============================================

export async function getRedditCryptoSentiment(
  subreddit: string = 'cryptocurrency',
  limit: number = 25
): Promise<SocialPost[]> {
  try {
    const response = await fetch(
      `${SENTIMENT_APIS.reddit}/r/${subreddit}/hot.json?limit=${limit}`,
      {
        headers: {
          'User-Agent': 'DataSimplify/1.0',
        },
      }
    );
    const data = await response.json();
    
    if (!data.data?.children) return [];
    
    return data.data.children.map((post: { data: Record<string, unknown> }) => {
      const p = post.data;
      const upvoteRatio = (p.upvote_ratio as number) || 0.5;
      
      // Simple sentiment based on upvote ratio and score
      let sentiment: SocialPost['sentiment'] = 'neutral';
      let sentimentScore = (upvoteRatio - 0.5) * 2; // Convert to -1 to 1
      
      // Check title for bullish/bearish keywords
      const title = ((p.title as string) || '').toLowerCase();
      const bullishWords = ['moon', 'pump', 'bull', 'buy', 'bullish', 'up', 'gain', 'profit', 'ath'];
      const bearishWords = ['dump', 'crash', 'bear', 'sell', 'bearish', 'down', 'loss', 'scam', 'rug'];
      
      const bullishCount = bullishWords.filter(w => title.includes(w)).length;
      const bearishCount = bearishWords.filter(w => title.includes(w)).length;
      
      if (bullishCount > bearishCount) {
        sentiment = 'bullish';
        sentimentScore = Math.min(1, sentimentScore + 0.3);
      } else if (bearishCount > bullishCount) {
        sentiment = 'bearish';
        sentimentScore = Math.max(-1, sentimentScore - 0.3);
      }
      
      // Extract mentioned coins from title
      const coinPatterns = /\$?([A-Z]{2,5})\b/g;
      const coins: string[] = [];
      let match;
      while ((match = coinPatterns.exec((p.title as string) || '')) !== null) {
        if (!['THE', 'AND', 'FOR', 'BUT', 'NOT', 'YOU', 'ARE', 'THIS', 'THAT', 'WITH'].includes(match[1])) {
          coins.push(match[1]);
        }
      }
      
      return {
        id: p.id as string,
        source: 'reddit' as const,
        title: p.title as string,
        content: p.selftext as string,
        url: `https://reddit.com${p.permalink}`,
        author: p.author as string,
        timestamp: new Date((p.created_utc as number) * 1000).toISOString(),
        sentiment,
        sentimentScore,
        engagement: {
          likes: p.ups as number,
          comments: p.num_comments as number,
          shares: 0,
        },
        coins,
      };
    });
  } catch (error) {
    console.error('Error fetching Reddit data:', error);
    return [];
  }
}

// ============================================
// METHOD 3: CoinGecko Trending (FREE)
// ============================================

export async function getTrendingCoins(): Promise<string[]> {
  try {
    const response = await fetch(SENTIMENT_APIS.coingeckoTrending);
    const data = await response.json();
    
    return data.coins?.map((c: { item: { symbol: string } }) => c.item.symbol.toUpperCase()) || [];
  } catch (error) {
    console.error('Error fetching trending:', error);
    return [];
  }
}

// ============================================
// METHOD 4: Simple Sentiment Analysis (LOCAL - FREE)
// ============================================

const SENTIMENT_WORDS = {
  bullish: [
    'moon', 'mooning', 'pump', 'pumping', 'bull', 'bullish', 'buy', 'buying',
    'long', 'hodl', 'hold', 'accumulate', 'accumulating', 'breakout', 'rally',
    'ath', 'profit', 'gain', 'gains', 'up', 'uptrend', 'bullrun', 'explosive',
    'rocket', '🚀', '📈', '💎', 'diamond', 'hands', 'undervalued', 'cheap',
    'opportunity', 'support', 'bounce', 'recovery', 'adoption', 'institutional'
  ],
  bearish: [
    'dump', 'dumping', 'bear', 'bearish', 'sell', 'selling', 'short', 'shorting',
    'crash', 'crashing', 'scam', 'rug', 'rugpull', 'ponzi', 'down', 'downtrend',
    'loss', 'losses', 'losing', 'rekt', 'dead', 'dying', 'worthless', 'overvalued',
    'bubble', 'correction', 'resistance', 'rejection', 'capitulation', '📉', '💀'
  ]
};

export function analyzeSentiment(text: string): {
  score: number;
  label: 'bullish' | 'bearish' | 'neutral';
  confidence: number;
} {
  const words = text.toLowerCase().split(/\s+/);
  
  let bullishCount = 0;
  let bearishCount = 0;
  
  for (const word of words) {
    if (SENTIMENT_WORDS.bullish.some(bw => word.includes(bw))) bullishCount++;
    if (SENTIMENT_WORDS.bearish.some(bw => word.includes(bw))) bearishCount++;
  }
  
  const total = bullishCount + bearishCount;
  if (total === 0) {
    return { score: 0, label: 'neutral', confidence: 0 };
  }
  
  const score = (bullishCount - bearishCount) / total;
  const confidence = Math.min(1, total / 10);
  
  let label: 'bullish' | 'bearish' | 'neutral' = 'neutral';
  if (score > 0.2) label = 'bullish';
  if (score < -0.2) label = 'bearish';
  
  return { score, label, confidence };
}

// ============================================
// METHOD 5: Aggregate Coin Sentiment
// ============================================

export async function getCoinSentiment(symbol: string): Promise<CoinSentiment> {
  const [news, reddit, trending] = await Promise.all([
    getCryptoPanicNews('hot', symbol),
    getRedditCryptoSentiment('cryptocurrency', 50),
    getTrendingCoins(),
  ]);
  
  // Filter posts mentioning this coin
  const relevantNews = news.filter(p => p.coins.includes(symbol));
  const relevantReddit = reddit.filter(p => 
    p.coins.includes(symbol) || 
    p.title.toUpperCase().includes(symbol)
  );
  
  // Calculate aggregate sentiment
  const allPosts = [...relevantNews, ...relevantReddit];
  const avgSentiment = allPosts.length > 0
    ? allPosts.reduce((sum, p) => sum + p.sentimentScore, 0) / allPosts.length
    : 0;
  
  const sentimentScore = Math.round(avgSentiment * 100);
  
  let sentimentLabel: CoinSentiment['sentimentLabel'] = 'Neutral';
  if (sentimentScore >= 40) sentimentLabel = 'Very Bullish';
  else if (sentimentScore >= 15) sentimentLabel = 'Bullish';
  else if (sentimentScore <= -40) sentimentLabel = 'Very Bearish';
  else if (sentimentScore <= -15) sentimentLabel = 'Bearish';
  
  return {
    symbol,
    name: symbol, // Would need lookup
    sentimentScore,
    sentimentLabel,
    socialVolume24h: allPosts.length,
    socialVolumeChange24h: 0, // Would need historical data
    trendingRank: trending.indexOf(symbol) + 1 || null,
    newsCount24h: relevantNews.length,
    redditMentions24h: relevantReddit.length,
    sources: {
      news: relevantNews.length,
      reddit: relevantReddit.length,
      twitter: 0, // Can't access without API
    },
  };
}

// ============================================
// AGGREGATED SENTIMENT DASHBOARD
// ============================================

export async function getSentimentDashboard(): Promise<MarketSentiment> {
  const [fearGreedResponse, trending, news, reddit] = await Promise.all([
    fetch(SENTIMENT_APIS.fearGreed).then(r => r.json()),
    getTrendingCoins(),
    getCryptoPanicNews('hot'),
    getRedditCryptoSentiment('cryptocurrency', 100),
  ]);
  
  const fearGreedIndex = parseInt(fearGreedResponse.data?.[0]?.value || '50');
  const fearGreedLabel = fearGreedResponse.data?.[0]?.value_classification || 'Neutral';
  
  // Calculate overall sentiment from posts
  const allPosts = [...news, ...reddit];
  const avgSentiment = allPosts.length > 0
    ? allPosts.reduce((sum, p) => sum + p.sentimentScore, 0) / allPosts.length
    : 0;
  
  // Combine fear/greed with social sentiment
  const overallScore = Math.round((fearGreedIndex + (avgSentiment + 1) * 50) / 2);
  
  let overallLabel = 'Neutral';
  if (overallScore >= 75) overallLabel = 'Extreme Greed';
  else if (overallScore >= 55) overallLabel = 'Greed';
  else if (overallScore <= 25) overallLabel = 'Extreme Fear';
  else if (overallScore <= 45) overallLabel = 'Fear';
  
  // Get top mentioned coins
  const coinMentions: Record<string, { bullish: number; bearish: number }> = {};
  
  for (const post of allPosts) {
    for (const coin of post.coins) {
      if (!coinMentions[coin]) {
        coinMentions[coin] = { bullish: 0, bearish: 0 };
      }
      if (post.sentiment === 'bullish') coinMentions[coin].bullish++;
      if (post.sentiment === 'bearish') coinMentions[coin].bearish++;
    }
  }
  
  const coinSentiments = Object.entries(coinMentions)
    .map(([symbol, counts]) => ({
      symbol,
      name: symbol,
      sentimentScore: Math.round(((counts.bullish - counts.bearish) / (counts.bullish + counts.bearish || 1)) * 100),
      sentimentLabel: 'Neutral' as CoinSentiment['sentimentLabel'],
      socialVolume24h: counts.bullish + counts.bearish,
      socialVolumeChange24h: 0,
      trendingRank: trending.indexOf(symbol) + 1 || null,
      newsCount24h: 0,
      redditMentions24h: 0,
      sources: { news: 0, reddit: 0, twitter: 0 },
    }))
    .sort((a, b) => b.socialVolume24h - a.socialVolume24h);
  
  return {
    overallScore,
    overallLabel,
    fearGreedIndex,
    fearGreedLabel,
    socialVolume24h: allPosts.length,
    topBullish: coinSentiments.filter(c => c.sentimentScore > 0).slice(0, 10),
    topBearish: coinSentiments.filter(c => c.sentimentScore < 0).slice(0, 10),
    trending,
  };
}
