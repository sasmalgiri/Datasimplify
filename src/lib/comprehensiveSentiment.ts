// ============================================
// COMPREHENSIVE SENTIMENT AGGREGATOR
// Legal scraping from ALL permitted sources
// ============================================
// This aggregates sentiment from 10+ sources that legally allow access
// Professional-grade social sentiment analysis

// ============================================
// SOURCE CONFIGURATION
// ============================================

export const SENTIMENT_SOURCES = {
  // === TIER 1: Official APIs (Most Reliable) ===
  
  // Reddit - Public JSON API (no auth needed for public data)
  reddit: {
    baseUrl: 'https://www.reddit.com',
    rateLimit: '60 requests/minute',
    legal: true,
    quality: 5,
  },
  
  // CryptoPanic - Developer API (with API key)
  cryptoPanic: {
    baseUrl: 'https://cryptopanic.com/api/v1',
    rateLimit: '1000 requests/hour',
    legal: true,
    quality: 5,
  },
  
  // CoinGecko - Trending and community data
  coingecko: {
    baseUrl: 'https://api.coingecko.com/api/v3',
    rateLimit: '10-30 requests/minute',
    legal: true,
    quality: 4,
  },
  
  // === TIER 2: RSS Feeds (Always Legal) ===
  
  // Major crypto news RSS feeds
  rssFeeds: {
    cointelegraph: 'https://cointelegraph.com/rss',
    coindesk: 'https://www.coindesk.com/arc/outboundfeeds/rss/',
    bitcoinMagazine: 'https://bitcoinmagazine.com/feed',
    decrypt: 'https://decrypt.co/feed',
    theBlock: 'https://www.theblock.co/rss.xml',
    cryptoSlate: 'https://cryptoslate.com/feed/',
    newsbtc: 'https://www.newsbtc.com/feed/',
    ambcrypto: 'https://ambcrypto.com/feed/',
    legal: true,
    quality: 4,
  },
  
  // === TIER 3: Public Forums (Legal for public data) ===
  
  // 4chan /biz/ - Public JSON API
  fourChan: {
    baseUrl: 'https://a.4cdn.org/biz',
    rateLimit: '1 request/second',
    legal: true,
    quality: 2, // Low quality but high signal for meme coins
  },
  
  // Bitcointalk - Public forum
  bitcointalk: {
    baseUrl: 'https://bitcointalk.org',
    method: 'RSS',
    legal: true,
    quality: 3,
  },
  
  // === TIER 4: Development Activity (Proxy for project health) ===
  
  // GitHub - Official API
  github: {
    baseUrl: 'https://api.github.com',
    rateLimit: '60 requests/hour (unauth), 5000/hour (auth)',
    legal: true,
    quality: 5,
  },
  
  // === TIER 5: Search Trends ===
  
  // Google Trends - Unofficial but widely used
  googleTrends: {
    note: 'Use pytrends library or similar',
    legal: true, // Grey area but widely used
    quality: 4,
  },
};

// ============================================
// TYPES
// ============================================

export interface SentimentPost {
  id: string;
  source: string;
  platform: string;
  title: string;
  content: string;
  url: string;
  author: string;
  timestamp: string;
  sentiment: {
    score: number;      // -1 to 1
    label: 'very_bearish' | 'bearish' | 'neutral' | 'bullish' | 'very_bullish';
    confidence: number; // 0 to 1
  };
  engagement: {
    likes: number;
    comments: number;
    shares: number;
    views: number;
  };
  coins: string[];
  keywords: string[];
}

export interface SourceSentiment {
  source: string;
  postCount: number;
  avgSentiment: number;
  bullishCount: number;
  bearishCount: number;
  neutralCount: number;
  topPosts: SentimentPost[];
}

export interface AggregatedSentiment {
  timestamp: string;
  overallScore: number;
  overallLabel: string;
  confidence: number;
  totalPosts: number;
  bySource: SourceSentiment[];
  byCoin: Record<string, {
    sentiment: number;
    volume: number;
    trending: boolean;
    bullishCount: number;
    bearishCount: number;
    neutralCount: number;
  }>;
  topBullish: SentimentPost[];
  topBearish: SentimentPost[];
  trendingTopics: string[];
}

// ============================================
// SENTIMENT ANALYSIS (Local NLP - FREE)
// ============================================

const SENTIMENT_LEXICON = {
  very_bullish: [
    'moon', 'mooning', 'rocket', '🚀', 'lambo', 'millionaire', 'generational',
    'life-changing', 'massive', 'explosion', 'parabolic', '100x', '1000x',
    'guaranteed', 'inevitable', 'unstoppable', 'diamond hands', '💎', '🙌',
    'ath', 'all time high', 'breakout', 'face melting', 'send it'
  ],
  bullish: [
    'buy', 'buying', 'long', 'bull', 'bullish', 'accumulate', 'accumulating',
    'hodl', 'hold', 'holding', 'support', 'bounce', 'recovery', 'reversal',
    'undervalued', 'cheap', 'discount', 'opportunity', 'potential', 'promising',
    'adoption', 'partnership', 'institutional', 'upgrade', 'launch', 'mainnet',
    'pump', 'green', '📈', 'up', 'gain', 'profit', 'winner', 'gem'
  ],
  bearish: [
    'sell', 'selling', 'short', 'bear', 'bearish', 'dump', 'dumping',
    'resistance', 'rejection', 'overbought', 'correction', 'pullback',
    'overvalued', 'expensive', 'bubble', 'top', 'distribution', 'weak',
    'concern', 'worry', 'risk', 'careful', 'caution', 'warning', 'down',
    'red', '📉', 'loss', 'losing', 'drop', 'fall', 'decline'
  ],
  very_bearish: [
    'crash', 'crashing', 'scam', 'fraud', 'rug', 'rugpull', 'ponzi',
    'dead', 'dying', 'worthless', 'zero', 'rekt', 'liquidated', 'bankrupt',
    'collapse', 'disaster', 'catastrophe', 'exit scam', 'hack', 'hacked',
    '💀', '☠️', 'bagholders', 'capitulation', 'bloodbath', 'apocalypse'
  ],
};

// Common crypto coin patterns for extraction
const COIN_PATTERNS = [
  /\$([A-Z]{2,10})\b/g,           // $BTC, $ETH
  /\b([A-Z]{2,5})\/USD[T]?\b/g,   // BTC/USD, ETH/USDT
  /\b(bitcoin|ethereum|solana|cardano|polkadot|avalanche|polygon|chainlink)\b/gi,
];

const KNOWN_COINS = new Set([
  'BTC', 'ETH', 'BNB', 'XRP', 'SOL', 'ADA', 'AVAX', 'DOGE', 'DOT', 'MATIC',
  'SHIB', 'TRX', 'LINK', 'ATOM', 'UNI', 'XLM', 'LTC', 'NEAR', 'APT', 'ARB',
  'OP', 'FIL', 'HBAR', 'VET', 'ICP', 'ALGO', 'QNT', 'FTM', 'SAND', 'MANA',
  'AAVE', 'AXS', 'EOS', 'THETA', 'XTZ', 'EGLD', 'FLOW', 'CHZ', 'PEPE', 'WIF',
  'BONK', 'FLOKI', 'RENDER', 'INJ', 'SUI', 'SEI', 'TIA', 'JUP', 'PYTH'
]);

export function analyzeSentimentAdvanced(text: string): {
  score: number;
  label: SentimentPost['sentiment']['label'];
  confidence: number;
  keywords: string[];
} {
  const lowerText = text.toLowerCase();
  const words = lowerText.split(/\s+/);
  
  let veryBullishCount = 0;
  let bullishCount = 0;
  let bearishCount = 0;
  let veryBearishCount = 0;
  const foundKeywords: string[] = [];
  
  // Check each word against lexicon
  for (const word of words) {
    for (const term of SENTIMENT_LEXICON.very_bullish) {
      if (word.includes(term) || lowerText.includes(term)) {
        veryBullishCount++;
        foundKeywords.push(term);
      }
    }
    for (const term of SENTIMENT_LEXICON.bullish) {
      if (word.includes(term)) {
        bullishCount++;
        foundKeywords.push(term);
      }
    }
    for (const term of SENTIMENT_LEXICON.bearish) {
      if (word.includes(term)) {
        bearishCount++;
        foundKeywords.push(term);
      }
    }
    for (const term of SENTIMENT_LEXICON.very_bearish) {
      if (word.includes(term) || lowerText.includes(term)) {
        veryBearishCount++;
        foundKeywords.push(term);
      }
    }
  }
  
  // Calculate weighted score
  const bullishScore = veryBullishCount * 2 + bullishCount;
  const bearishScore = veryBearishCount * 2 + bearishCount;
  const total = bullishScore + bearishScore;
  
  if (total === 0) {
    return { score: 0, label: 'neutral', confidence: 0, keywords: [] };
  }
  
  const score = (bullishScore - bearishScore) / total;
  const confidence = Math.min(1, total / 10);
  
  let label: SentimentPost['sentiment']['label'] = 'neutral';
  if (score >= 0.6) label = 'very_bullish';
  else if (score >= 0.2) label = 'bullish';
  else if (score <= -0.6) label = 'very_bearish';
  else if (score <= -0.2) label = 'bearish';
  
  return {
    score,
    label,
    confidence,
    keywords: [...new Set(foundKeywords)].slice(0, 10),
  };
}

export function extractCoins(text: string): string[] {
  const coins: Set<string> = new Set();
  
  // Extract using patterns
  for (const pattern of COIN_PATTERNS) {
    const matches = text.matchAll(new RegExp(pattern));
    for (const match of matches) {
      const coin = match[1].toUpperCase();
      if (KNOWN_COINS.has(coin)) {
        coins.add(coin);
      }
    }
  }
  
  // Check for full names
  const coinNameMap: Record<string, string> = {
    'bitcoin': 'BTC', 'ethereum': 'ETH', 'solana': 'SOL',
    'cardano': 'ADA', 'polkadot': 'DOT', 'avalanche': 'AVAX',
    'polygon': 'MATIC', 'chainlink': 'LINK', 'dogecoin': 'DOGE',
  };
  
  const lowerText = text.toLowerCase();
  for (const [name, symbol] of Object.entries(coinNameMap)) {
    if (lowerText.includes(name)) {
      coins.add(symbol);
    }
  }
  
  return Array.from(coins);
}

// ============================================
// SOURCE FETCHERS
// ============================================

// 1. REDDIT - Multiple subreddits
export async function fetchRedditSentiment(
  subreddits: string[] = ['cryptocurrency', 'bitcoin', 'ethtrader', 'CryptoMarkets', 'altcoin'],
  postsPerSub: number = 25
): Promise<SentimentPost[]> {
  const allPosts: SentimentPost[] = [];
  
  for (const sub of subreddits) {
    try {
      const response = await fetch(
        `https://www.reddit.com/r/${sub}/hot.json?limit=${postsPerSub}`,
        { headers: { 'User-Agent': 'DataSimplify/1.0' } }
      );
      
      if (!response.ok) continue;
      const data = await response.json();
      
      for (const post of data.data?.children || []) {
        const p = post.data;
        const fullText = `${p.title} ${p.selftext || ''}`;
        const sentiment = analyzeSentimentAdvanced(fullText);
        const coins = extractCoins(fullText);
        
        allPosts.push({
          id: p.id,
          source: 'reddit',
          platform: `r/${sub}`,
          title: p.title,
          content: (p.selftext || '').slice(0, 500),
          url: `https://reddit.com${p.permalink}`,
          author: p.author,
          timestamp: new Date(p.created_utc * 1000).toISOString(),
          sentiment: {
            score: sentiment.score,
            label: sentiment.label,
            confidence: sentiment.confidence,
          },
          engagement: {
            likes: p.ups || 0,
            comments: p.num_comments || 0,
            shares: 0,
            views: 0,
          },
          coins,
          keywords: sentiment.keywords,
        });
      }
      
      // Rate limiting
      await new Promise(r => setTimeout(r, 100));
    } catch (error) {
      console.error(`Error fetching r/${sub}:`, error);
    }
  }
  
  return allPosts;
}

// 2. CRYPTOPANIC - News aggregator
export async function fetchCryptoPanicSentiment(
  filter: 'rising' | 'hot' | 'bullish' | 'bearish' | 'important' = 'hot'
): Promise<SentimentPost[]> {
  try {
    const authToken = process.env.CRYPTOPANIC_API_KEY || 'FREE';
    const response = await fetch(
      `https://cryptopanic.com/api/v1/posts/?auth_token=${authToken}&filter=${filter}&public=true`
    );
    
    if (!response.ok) return [];
    const data = await response.json();
    
    return (data.results || []).map((post: Record<string, unknown>) => {
      const votes = post.votes as { positive: number; negative: number } || { positive: 0, negative: 0 };
      const sentiment = analyzeSentimentAdvanced(post.title as string);
      
      // Adjust sentiment based on community votes
      const voteScore = (votes.positive - votes.negative) / Math.max(1, votes.positive + votes.negative);
      const combinedScore = (sentiment.score + voteScore) / 2;
      
      let label: SentimentPost['sentiment']['label'] = 'neutral';
      if (combinedScore >= 0.4) label = 'very_bullish';
      else if (combinedScore >= 0.15) label = 'bullish';
      else if (combinedScore <= -0.4) label = 'very_bearish';
      else if (combinedScore <= -0.15) label = 'bearish';
      
      return {
        id: String(post.id),
        source: 'cryptopanic',
        platform: (post.source as { title: string })?.title || 'News',
        title: post.title as string,
        content: '',
        url: post.url as string,
        author: (post.source as { title: string })?.title || 'Unknown',
        timestamp: post.published_at as string,
        sentiment: {
          score: combinedScore,
          label,
          confidence: Math.min(1, (votes.positive + votes.negative) / 20),
        },
        engagement: {
          likes: votes.positive,
          comments: 0,
          shares: 0,
          views: 0,
        },
        coins: ((post.currencies as { code: string }[]) || []).map(c => c.code),
        keywords: sentiment.keywords,
      };
    });
  } catch (error) {
    console.error('Error fetching CryptoPanic:', error);
    return [];
  }
}

// 3. RSS FEEDS - News sites
export async function fetchRSSFeeds(): Promise<SentimentPost[]> {
  const feeds = [
    { name: 'CoinTelegraph', url: 'https://cointelegraph.com/rss' },
    { name: 'CoinDesk', url: 'https://www.coindesk.com/arc/outboundfeeds/rss/' },
    { name: 'Decrypt', url: 'https://decrypt.co/feed' },
    { name: 'CryptoSlate', url: 'https://cryptoslate.com/feed/' },
  ];
  
  const allPosts: SentimentPost[] = [];
  
  for (const feed of feeds) {
    try {
      // Use a CORS proxy or server-side fetch
      const response = await fetch(feed.url);
      if (!response.ok) continue;
      
      const text = await response.text();
      
      // Simple RSS parsing (in production, use a proper XML parser)
      const items = text.match(/<item>([\s\S]*?)<\/item>/g) || [];
      
      for (const item of items.slice(0, 10)) {
        const title = item.match(/<title><!\[CDATA\[(.*?)\]\]><\/title>/)?.[1] ||
                     item.match(/<title>(.*?)<\/title>/)?.[1] || '';
        const link = item.match(/<link>(.*?)<\/link>/)?.[1] || '';
        const pubDate = item.match(/<pubDate>(.*?)<\/pubDate>/)?.[1] || '';
        const description = item.match(/<description><!\[CDATA\[(.*?)\]\]><\/description>/)?.[1] ||
                           item.match(/<description>(.*?)<\/description>/)?.[1] || '';
        
        if (!title) continue;
        
        const fullText = `${title} ${description}`;
        const sentiment = analyzeSentimentAdvanced(fullText);
        const coins = extractCoins(fullText);
        
        allPosts.push({
          id: `rss-${Buffer.from(link).toString('base64').slice(0, 20)}`,
          source: 'rss',
          platform: feed.name,
          title: title.replace(/<[^>]*>/g, ''),
          content: description.replace(/<[^>]*>/g, '').slice(0, 300),
          url: link,
          author: feed.name,
          timestamp: pubDate ? new Date(pubDate).toISOString() : new Date().toISOString(),
          sentiment: {
            score: sentiment.score,
            label: sentiment.label,
            confidence: sentiment.confidence,
          },
          engagement: { likes: 0, comments: 0, shares: 0, views: 0 },
          coins,
          keywords: sentiment.keywords,
        });
      }
    } catch (error) {
      console.error(`Error fetching ${feed.name}:`, error);
    }
  }
  
  return allPosts;
}

// 4. 4CHAN /biz/ - Meme coin alpha
export async function fetch4chanBiz(): Promise<SentimentPost[]> {
  try {
    const response = await fetch('https://a.4cdn.org/biz/catalog.json');
    if (!response.ok) return [];
    
    const pages = await response.json();
    const posts: SentimentPost[] = [];
    
    for (const page of pages.slice(0, 3)) { // First 3 pages
      for (const thread of page.threads?.slice(0, 10) || []) {
        const text = `${thread.sub || ''} ${thread.com || ''}`.replace(/<[^>]*>/g, '');
        const sentiment = analyzeSentimentAdvanced(text);
        const coins = extractCoins(text);
        
        if (coins.length === 0) continue; // Only crypto-related
        
        posts.push({
          id: String(thread.no),
          source: '4chan',
          platform: '/biz/',
          title: (thread.sub || text.slice(0, 100)).replace(/<[^>]*>/g, ''),
          content: text.slice(0, 500),
          url: `https://boards.4chan.org/biz/thread/${thread.no}`,
          author: 'Anonymous',
          timestamp: new Date(thread.time * 1000).toISOString(),
          sentiment: {
            score: sentiment.score,
            label: sentiment.label,
            confidence: sentiment.confidence * 0.5, // Lower confidence for 4chan
          },
          engagement: {
            likes: 0,
            comments: thread.replies || 0,
            shares: 0,
            views: thread.images || 0,
          },
          coins,
          keywords: sentiment.keywords,
        });
      }
    }
    
    return posts;
  } catch (error) {
    console.error('Error fetching 4chan:', error);
    return [];
  }
}

// 5. COINGECKO - Trending and community
export async function fetchCoinGeckoTrending(): Promise<{
  trending: string[];
  gainers: string[];
  losers: string[];
}> {
  try {
    const { isFeatureEnabled } = await import('@/lib/featureFlags');
    if (!isFeatureEnabled('coingecko')) {
      return { trending: [], gainers: [], losers: [] };
    }

    const trendingRes = await fetch('https://api.coingecko.com/api/v3/search/trending');
    
    const trending = await trendingRes.json();
    
    return {
      trending: trending.coins?.map((c: { item: { symbol: string } }) => 
        c.item.symbol.toUpperCase()
      ) || [],
      gainers: [], // Would need pro API
      losers: [],
    };
  } catch (error) {
    console.error('Error fetching CoinGecko:', error);
    return { trending: [], gainers: [], losers: [] };
  }
}

// 6. GITHUB - Development activity (project health indicator)
export async function fetchGitHubActivity(
  repos: string[] = [
    'bitcoin/bitcoin',
    'ethereum/go-ethereum',
    'solana-labs/solana',
    'cardano-foundation/cardano-wallet',
  ]
): Promise<Record<string, { commits: number; issues: number; stars: number }>> {
  const activity: Record<string, { commits: number; issues: number; stars: number }> = {};
  
  for (const repo of repos) {
    try {
      const response = await fetch(`https://api.github.com/repos/${repo}`, {
        headers: { 'Accept': 'application/vnd.github.v3+json' }
      });
      
      if (!response.ok) continue;
      const data = await response.json();
      
      const coin = repo.split('/')[0].toUpperCase();
      activity[coin] = {
        commits: data.subscribers_count || 0,
        issues: data.open_issues_count || 0,
        stars: data.stargazers_count || 0,
      };
      
      await new Promise(r => setTimeout(r, 100));
    } catch (error) {
      console.error(`Error fetching ${repo}:`, error);
    }
  }
  
  return activity;
}

// ============================================
// MAIN AGGREGATOR
// ============================================

export async function aggregateAllSentiment(): Promise<AggregatedSentiment> {
  console.log('Fetching sentiment from all sources...');
  
  // Fetch from all sources in parallel
  const [reddit, cryptoPanic, rss, fourChan, trending] = await Promise.all([
    fetchRedditSentiment(),
    fetchCryptoPanicSentiment('hot'),
    fetchRSSFeeds(),
    fetch4chanBiz(),
    fetchCoinGeckoTrending(),
  ]);
  
  // Combine all posts
  const allPosts = [...reddit, ...cryptoPanic, ...rss, ...fourChan];
  
  // Calculate by source
  const bySource: SourceSentiment[] = [
    { source: 'reddit', posts: reddit },
    { source: 'cryptopanic', posts: cryptoPanic },
    { source: 'rss', posts: rss },
    { source: '4chan', posts: fourChan },
  ].map(({ source, posts }) => ({
    source,
    postCount: posts.length,
    avgSentiment: posts.length > 0 
      ? posts.reduce((sum, p) => sum + p.sentiment.score, 0) / posts.length 
      : 0,
    bullishCount: posts.filter(p => p.sentiment.label.includes('bullish')).length,
    bearishCount: posts.filter(p => p.sentiment.label.includes('bearish')).length,
    neutralCount: posts.filter(p => p.sentiment.label === 'neutral').length,
    topPosts: posts
      .sort((a, b) => b.engagement.likes + b.engagement.comments - a.engagement.likes - a.engagement.comments)
      .slice(0, 5),
  }));
  
  // Calculate by coin
  const byCoin: Record<string, { sentiment: number; volume: number; posts: SentimentPost[] }> = {};
  
  for (const post of allPosts) {
    for (const coin of post.coins) {
      if (!byCoin[coin]) {
        byCoin[coin] = { sentiment: 0, volume: 0, posts: [] };
      }
      byCoin[coin].volume++;
      byCoin[coin].posts.push(post);
    }
  }
  
  // Calculate average sentiment per coin
  for (const coin of Object.keys(byCoin)) {
    const posts = byCoin[coin].posts;
    byCoin[coin].sentiment = posts.reduce((sum, p) => sum + p.sentiment.score, 0) / posts.length;
  }
  
  // Overall sentiment
  const totalSentiment = allPosts.reduce((sum, p) => sum + p.sentiment.score, 0);
  const avgSentiment = allPosts.length > 0 ? totalSentiment / allPosts.length : 0;
  const overallScore = Math.round((avgSentiment + 1) * 50); // Convert to 0-100
  
  let overallLabel = 'Neutral';
  if (overallScore >= 70) overallLabel = 'Very Bullish';
  else if (overallScore >= 55) overallLabel = 'Bullish';
  else if (overallScore <= 30) overallLabel = 'Very Bearish';
  else if (overallScore <= 45) overallLabel = 'Bearish';
  
  // Find top bullish/bearish posts
  const sortedPosts = [...allPosts].sort((a, b) => {
    const aScore = (a.engagement.likes + a.engagement.comments) * (1 + a.sentiment.confidence);
    const bScore = (b.engagement.likes + b.engagement.comments) * (1 + b.sentiment.confidence);
    return bScore - aScore;
  });
  
  return {
    timestamp: new Date().toISOString(),
    overallScore,
    overallLabel,
    confidence: allPosts.reduce((sum, p) => sum + p.sentiment.confidence, 0) / Math.max(1, allPosts.length),
    totalPosts: allPosts.length,
    bySource,
    byCoin: Object.fromEntries(
      Object.entries(byCoin)
        .sort((a, b) => b[1].volume - a[1].volume)
        .slice(0, 50)
        .map(([coin, data]) => {
          const bullishCount = data.posts.filter(p => p.sentiment.label.includes('bullish')).length;
          const bearishCount = data.posts.filter(p => p.sentiment.label.includes('bearish')).length;
          const neutralCount = data.posts.filter(p => p.sentiment.label === 'neutral').length;

          return [
            coin,
            {
              sentiment: Math.round(data.sentiment * 100),
              volume: data.volume,
              trending: trending.trending.includes(coin),
              bullishCount,
              bearishCount,
              neutralCount,
            },
          ];
        })
    ),
    topBullish: sortedPosts.filter(p => p.sentiment.score > 0.2).slice(0, 10),
    topBearish: sortedPosts.filter(p => p.sentiment.score < -0.2).slice(0, 10),
    trendingTopics: trending.trending,
  };
}

// ============================================
// SPECIFIC COIN DEEP DIVE
// ============================================

export async function getCoinDeepSentiment(symbol: string): Promise<{
  coin: string;
  overallSentiment: number;
  sentimentLabel: string;
  socialVolume: number;
  sources: Record<string, { count: number; sentiment: number }>;
  recentPosts: SentimentPost[];
  trending: boolean;
  keywords: string[];
}> {
  const [reddit, cryptoPanic, trending] = await Promise.all([
    fetchRedditSentiment(['cryptocurrency', 'bitcoin', 'ethtrader', 'altcoin'], 50),
    fetchCryptoPanicSentiment('hot'),
    fetchCoinGeckoTrending(),
  ]);
  
  const allPosts = [...reddit, ...cryptoPanic];
  const coinPosts = allPosts.filter(p => 
    p.coins.includes(symbol) || 
    p.title.toUpperCase().includes(symbol) ||
    p.content.toUpperCase().includes(symbol)
  );
  
  const avgSentiment = coinPosts.length > 0
    ? coinPosts.reduce((sum, p) => sum + p.sentiment.score, 0) / coinPosts.length
    : 0;
  
  const sentimentScore = Math.round(avgSentiment * 100);
  
  let sentimentLabel = 'Neutral';
  if (sentimentScore >= 40) sentimentLabel = 'Very Bullish';
  else if (sentimentScore >= 15) sentimentLabel = 'Bullish';
  else if (sentimentScore <= -40) sentimentLabel = 'Very Bearish';
  else if (sentimentScore <= -15) sentimentLabel = 'Bearish';
  
  // Group by source
  const sources: Record<string, { count: number; sentiment: number; posts: SentimentPost[] }> = {};
  for (const post of coinPosts) {
    if (!sources[post.source]) {
      sources[post.source] = { count: 0, sentiment: 0, posts: [] };
    }
    sources[post.source].count++;
    sources[post.source].posts.push(post);
  }
  
  for (const source of Object.keys(sources)) {
    const posts = sources[source].posts;
    sources[source].sentiment = Math.round(
      (posts.reduce((sum, p) => sum + p.sentiment.score, 0) / posts.length) * 100
    );
  }
  
  // Aggregate keywords
  const allKeywords = coinPosts.flatMap(p => p.keywords);
  const keywordCounts = allKeywords.reduce((acc, kw) => {
    acc[kw] = (acc[kw] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  
  const topKeywords = Object.entries(keywordCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([kw]) => kw);
  
  return {
    coin: symbol,
    overallSentiment: sentimentScore,
    sentimentLabel,
    socialVolume: coinPosts.length,
    sources: Object.fromEntries(
      Object.entries(sources).map(([k, v]) => [k, { count: v.count, sentiment: v.sentiment }])
    ),
    recentPosts: coinPosts
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, 20),
    trending: trending.trending.includes(symbol),
    keywords: topKeywords,
  };
}
