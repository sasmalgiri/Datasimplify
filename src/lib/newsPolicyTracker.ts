/**
 * News and Policy Tracker
 * Tracks news events, government policies, regulations, and their impact on crypto
 * Provides timestamp-based profiling for AI predictions
 */

import { supabase, isSupabaseConfigured } from './supabase';
import { fetchCryptoPanicSentiment, analyzeSentimentAdvanced, SentimentPost } from './comprehensiveSentiment';

// ============================================
// TYPES
// ============================================

export type EventType =
  | 'regulation'   // New regulations or regulatory framework
  | 'legislation'  // Laws passed or proposed
  | 'enforcement'  // SEC actions, lawsuits, penalties
  | 'statement'    // Official statements from regulators/officials
  | 'news'         // General crypto news
  | 'etf'          // ETF approvals/rejections
  | 'cbdc'         // Central bank digital currency news
  | 'hack'         // Security incidents
  | 'partnership'  // Major partnerships/integrations
  | 'adoption';    // Adoption announcements

export type SourceType =
  | 'government'
  | 'central_bank'
  | 'regulator'
  | 'media'
  | 'company'
  | 'exchange'
  | 'protocol';

export type ImpactLevel = 'critical' | 'high' | 'medium' | 'low';

export type Region = 'north_america' | 'europe' | 'asia' | 'middle_east' | 'latam' | 'africa' | 'global';

export interface NewsPolicyEvent {
  id?: string;
  timestamp: Date;
  eventDate?: Date;

  // Event Classification
  eventType: EventType;
  sourceType: SourceType;
  country?: string;
  region: Region;

  // Event Details
  title: string;
  summary?: string;
  fullContent?: string;
  sourceUrl?: string;

  // Impact Assessment
  impactLevel: ImpactLevel;
  sentimentImpact: number;  // -100 to +100
  affectedCoins: string[];
  affectedSectors: string[];

  // Price Impact Tracking
  btcPriceBefore?: number;
  btcPrice24hAfter?: number;
  btcPrice7dAfter?: number;
  actualImpact?: number;

  // AI Analysis
  aiSummary?: string;
  aiSentimentScore?: number;
  aiImportanceScore?: number;
}

export interface PolicyRiskScore {
  region: Region;
  overallRisk: number;  // 0-100
  regulatoryClarity: number;
  enforcementRisk: number;
  banRisk: number;
  taxationRisk: number;
  recentEvents: NewsPolicyEvent[];
  trend: 'improving' | 'worsening' | 'stable';
}

export interface NewsImpactAnalysis {
  eventId: string;
  predictedImpact: number;
  actualImpact?: number;
  accuracy?: number;
  priceMovement: {
    before: number;
    after24h?: number;
    after7d?: number;
    percentChange24h?: number;
    percentChange7d?: number;
  };
}

// ============================================
// REGULATORY KEYWORDS
// ============================================

const REGULATORY_KEYWORDS = {
  regulation: [
    'regulation', 'regulatory', 'framework', 'compliance', 'license', 'licensing',
    'rules', 'guidelines', 'requirements', 'oversight', 'supervision'
  ],
  legislation: [
    'bill', 'law', 'act', 'legislation', 'congress', 'senate', 'house', 'parliament',
    'passed', 'proposed', 'amendment', 'vote', 'lawmakers'
  ],
  enforcement: [
    'sec', 'cftc', 'doj', 'lawsuit', 'fine', 'penalty', 'enforcement', 'action',
    'charges', 'investigation', 'subpoena', 'settlement', 'sued'
  ],
  statement: [
    'statement', 'announces', 'said', 'remarks', 'speech', 'testimony', 'warns',
    'chair', 'commissioner', 'governor', 'official'
  ],
  etf: [
    'etf', 'spot etf', 'bitcoin etf', 'ethereum etf', 'approval', 'reject', 'application',
    'blackrock', 'fidelity', 'grayscale', 'ark', 'invesco'
  ],
  cbdc: [
    'cbdc', 'digital dollar', 'digital euro', 'digital yuan', 'e-cny', 'digital currency',
    'central bank', 'fed', 'ecb', 'boe', 'pboc'
  ],
  hack: [
    'hack', 'hacked', 'exploit', 'breach', 'stolen', 'drained', 'vulnerability',
    'attack', 'compromised', 'security incident'
  ],
  partnership: [
    'partnership', 'partners', 'collaboration', 'integration', 'launches', 'expands',
    'announces', 'deal', 'agreement', 'alliance'
  ],
  adoption: [
    'accepts', 'payment', 'merchant', 'adoption', 'mainstream', 'retail', 'institutional',
    'custody', 'treasury', 'reserve', 'legal tender'
  ]
};

const COUNTRY_KEYWORDS: Record<string, { country: string; region: Region }> = {
  'us': { country: 'United States', region: 'north_america' },
  'usa': { country: 'United States', region: 'north_america' },
  'united states': { country: 'United States', region: 'north_america' },
  'america': { country: 'United States', region: 'north_america' },
  'sec': { country: 'United States', region: 'north_america' },
  'cftc': { country: 'United States', region: 'north_america' },
  'fed': { country: 'United States', region: 'north_america' },
  'uk': { country: 'United Kingdom', region: 'europe' },
  'britain': { country: 'United Kingdom', region: 'europe' },
  'fca': { country: 'United Kingdom', region: 'europe' },
  'eu': { country: 'European Union', region: 'europe' },
  'europe': { country: 'European Union', region: 'europe' },
  'mica': { country: 'European Union', region: 'europe' },
  'china': { country: 'China', region: 'asia' },
  'chinese': { country: 'China', region: 'asia' },
  'pboc': { country: 'China', region: 'asia' },
  'japan': { country: 'Japan', region: 'asia' },
  'fsa': { country: 'Japan', region: 'asia' },
  'korea': { country: 'South Korea', region: 'asia' },
  'singapore': { country: 'Singapore', region: 'asia' },
  'mas': { country: 'Singapore', region: 'asia' },
  'hong kong': { country: 'Hong Kong', region: 'asia' },
  'india': { country: 'India', region: 'asia' },
  'australia': { country: 'Australia', region: 'asia' },
  'uae': { country: 'UAE', region: 'middle_east' },
  'dubai': { country: 'UAE', region: 'middle_east' },
  'brazil': { country: 'Brazil', region: 'latam' },
  'argentina': { country: 'Argentina', region: 'latam' },
  'el salvador': { country: 'El Salvador', region: 'latam' },
  'nigeria': { country: 'Nigeria', region: 'africa' },
  'south africa': { country: 'South Africa', region: 'africa' },
};

const AFFECTED_SECTORS = [
  'defi', 'stablecoin', 'exchange', 'custody', 'lending', 'staking',
  'nft', 'derivatives', 'mining', 'payments', 'privacy'
];

// ============================================
// HELPER FUNCTIONS
// ============================================

function checkSupabase() {
  if (!isSupabaseConfigured || !supabase) {
    throw new Error('Supabase is not configured');
  }
  return supabase;
}

/**
 * Classify event type based on content
 */
function classifyEventType(text: string): EventType {
  const lowerText = text.toLowerCase();

  // Check each category in order of specificity
  for (const keyword of REGULATORY_KEYWORDS.hack) {
    if (lowerText.includes(keyword)) return 'hack';
  }
  for (const keyword of REGULATORY_KEYWORDS.etf) {
    if (lowerText.includes(keyword)) return 'etf';
  }
  for (const keyword of REGULATORY_KEYWORDS.cbdc) {
    if (lowerText.includes(keyword)) return 'cbdc';
  }
  for (const keyword of REGULATORY_KEYWORDS.enforcement) {
    if (lowerText.includes(keyword)) return 'enforcement';
  }
  for (const keyword of REGULATORY_KEYWORDS.legislation) {
    if (lowerText.includes(keyword)) return 'legislation';
  }
  for (const keyword of REGULATORY_KEYWORDS.regulation) {
    if (lowerText.includes(keyword)) return 'regulation';
  }
  for (const keyword of REGULATORY_KEYWORDS.partnership) {
    if (lowerText.includes(keyword)) return 'partnership';
  }
  for (const keyword of REGULATORY_KEYWORDS.adoption) {
    if (lowerText.includes(keyword)) return 'adoption';
  }

  return 'news';
}

/**
 * Detect country and region from text
 */
function detectLocation(text: string): { country?: string; region: Region } {
  const lowerText = text.toLowerCase();

  for (const [keyword, location] of Object.entries(COUNTRY_KEYWORDS)) {
    if (lowerText.includes(keyword)) {
      return location;
    }
  }

  return { region: 'global' };
}

/**
 * Detect source type from the news source
 */
function detectSourceType(sourceName: string, text: string): SourceType {
  const lowerSource = sourceName.toLowerCase();
  const lowerText = text.toLowerCase();

  if (lowerSource.includes('sec') || lowerSource.includes('cftc') ||
      lowerSource.includes('fca') || lowerText.includes('official')) {
    return 'regulator';
  }
  if (lowerSource.includes('fed') || lowerSource.includes('central bank') ||
      lowerText.includes('treasury')) {
    return 'central_bank';
  }
  if (lowerText.includes('government') || lowerText.includes('ministry')) {
    return 'government';
  }
  if (lowerSource.includes('binance') || lowerSource.includes('coinbase') ||
      lowerSource.includes('kraken')) {
    return 'exchange';
  }

  return 'media';
}

/**
 * Extract affected coins from text
 */
function extractAffectedCoins(text: string): string[] {
  const coins: Set<string> = new Set();
  const lowerText = text.toLowerCase();

  // Common coin mentions
  const coinPatterns: Record<string, string> = {
    'bitcoin': 'BTC',
    'btc': 'BTC',
    'ethereum': 'ETH',
    'eth': 'ETH',
    'ripple': 'XRP',
    'xrp': 'XRP',
    'solana': 'SOL',
    'sol': 'SOL',
    'cardano': 'ADA',
    'tether': 'USDT',
    'usdt': 'USDT',
    'usdc': 'USDC',
    'binance': 'BNB',
    'bnb': 'BNB',
  };

  for (const [pattern, symbol] of Object.entries(coinPatterns)) {
    if (lowerText.includes(pattern)) {
      coins.add(symbol);
    }
  }

  // If none found, assume BTC as it's market-wide
  if (coins.size === 0) {
    coins.add('BTC');
  }

  return Array.from(coins);
}

/**
 * Extract affected sectors from text
 */
function extractAffectedSectors(text: string): string[] {
  const sectors: string[] = [];
  const lowerText = text.toLowerCase();

  for (const sector of AFFECTED_SECTORS) {
    if (lowerText.includes(sector)) {
      sectors.push(sector);
    }
  }

  return sectors;
}

/**
 * Calculate impact level based on event characteristics
 */
function calculateImpactLevel(
  eventType: EventType,
  sentimentScore: number,
  affectedCoins: string[]
): ImpactLevel {
  // Critical events
  if (eventType === 'hack' && Math.abs(sentimentScore) > 50) return 'critical';
  if (eventType === 'enforcement' && affectedCoins.length > 2) return 'critical';
  if (eventType === 'legislation' && Math.abs(sentimentScore) > 60) return 'critical';

  // High impact
  if (eventType === 'etf') return 'high';
  if (eventType === 'enforcement') return 'high';
  if (eventType === 'regulation' && Math.abs(sentimentScore) > 40) return 'high';

  // Medium impact
  if (eventType === 'regulation') return 'medium';
  if (eventType === 'legislation') return 'medium';
  if (eventType === 'cbdc') return 'medium';

  // Low impact
  return 'low';
}

// ============================================
// CORE FUNCTIONS
// ============================================

/**
 * Record a news/policy event
 */
export async function recordNewsEvent(
  event: Omit<NewsPolicyEvent, 'id'>
): Promise<{ id: string } | null> {
  const db = checkSupabase();

  const record = {
    timestamp: event.timestamp.toISOString(),
    event_date: event.eventDate?.toISOString().split('T')[0] || null,
    event_type: event.eventType,
    source_type: event.sourceType,
    country: event.country || null,
    region: event.region,
    title: event.title,
    summary: event.summary || null,
    full_content: event.fullContent || null,
    source_url: event.sourceUrl || null,
    impact_level: event.impactLevel,
    sentiment_impact: event.sentimentImpact,
    affected_coins: event.affectedCoins,
    affected_sectors: event.affectedSectors,
    btc_price_before: event.btcPriceBefore || null,
    btc_price_24h_after: event.btcPrice24hAfter || null,
    btc_price_7d_after: event.btcPrice7dAfter || null,
    actual_impact: event.actualImpact || null,
    ai_summary: event.aiSummary || null,
    ai_sentiment_score: event.aiSentimentScore || null,
    ai_importance_score: event.aiImportanceScore || null,
  };

  const { data, error } = await db
    .from('news_policy_events')
    .insert(record)
    .select('id')
    .single();

  if (error) {
    console.error('Error recording news event:', error);
    return null;
  }

  return { id: data.id };
}

/**
 * Get recent high-impact news
 */
export async function getRecentHighImpactNews(
  limit: number = 20,
  minImpact: ImpactLevel = 'medium'
): Promise<NewsPolicyEvent[]> {
  const db = checkSupabase();

  const impactLevels: ImpactLevel[] = ['critical', 'high', 'medium', 'low'];
  const minIndex = impactLevels.indexOf(minImpact);
  const validLevels = impactLevels.slice(0, minIndex + 1);

  const { data, error } = await db
    .from('news_policy_events')
    .select('*')
    .in('impact_level', validLevels)
    .order('timestamp', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('Error fetching high impact news:', error);
    return [];
  }

  return (data || []).map(row => ({
    id: row.id,
    timestamp: new Date(row.timestamp),
    eventDate: row.event_date ? new Date(row.event_date) : undefined,
    eventType: row.event_type,
    sourceType: row.source_type,
    country: row.country,
    region: row.region,
    title: row.title,
    summary: row.summary,
    fullContent: row.full_content,
    sourceUrl: row.source_url,
    impactLevel: row.impact_level,
    sentimentImpact: row.sentiment_impact,
    affectedCoins: row.affected_coins || [],
    affectedSectors: row.affected_sectors || [],
    btcPriceBefore: row.btc_price_before,
    btcPrice24hAfter: row.btc_price_24h_after,
    btcPrice7dAfter: row.btc_price_7d_after,
    actualImpact: row.actual_impact,
    aiSummary: row.ai_summary,
    aiSentimentScore: row.ai_sentiment_score,
    aiImportanceScore: row.ai_importance_score,
  }));
}

/**
 * Get news by event type
 */
export async function getNewsByType(
  eventType: EventType,
  days: number = 7
): Promise<NewsPolicyEvent[]> {
  const db = checkSupabase();

  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const { data, error } = await db
    .from('news_policy_events')
    .select('*')
    .eq('event_type', eventType)
    .gte('timestamp', startDate.toISOString())
    .order('timestamp', { ascending: false });

  if (error) {
    console.error('Error fetching news by type:', error);
    return [];
  }

  return (data || []).map(row => ({
    id: row.id,
    timestamp: new Date(row.timestamp),
    eventDate: row.event_date ? new Date(row.event_date) : undefined,
    eventType: row.event_type,
    sourceType: row.source_type,
    country: row.country,
    region: row.region,
    title: row.title,
    summary: row.summary,
    fullContent: row.full_content,
    sourceUrl: row.source_url,
    impactLevel: row.impact_level,
    sentimentImpact: row.sentiment_impact,
    affectedCoins: row.affected_coins || [],
    affectedSectors: row.affected_sectors || [],
    btcPriceBefore: row.btc_price_before,
    btcPrice24hAfter: row.btc_price_24h_after,
    btcPrice7dAfter: row.btc_price_7d_after,
    actualImpact: row.actual_impact,
    aiSummary: row.ai_summary,
    aiSentimentScore: row.ai_sentiment_score,
    aiImportanceScore: row.ai_importance_score,
  }));
}

/**
 * Calculate policy risk score for a region
 */
export async function getPolicyRiskScore(region: Region): Promise<PolicyRiskScore> {
  const db = checkSupabase();

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  // Get recent events for the region
  const { data: events } = await db
    .from('news_policy_events')
    .select('*')
    .eq('region', region)
    .gte('timestamp', thirtyDaysAgo.toISOString())
    .order('timestamp', { ascending: false });

  const recentEvents = events || [];

  // Calculate risk scores based on events
  let enforcementScore = 0;
  let regulationScore = 0;
  let banMentions = 0;
  let taxMentions = 0;
  let totalNegativeSentiment = 0;
  let eventCount = 0;

  for (const event of recentEvents) {
    eventCount++;

    if (event.event_type === 'enforcement') {
      enforcementScore += 20;
    }
    if (event.event_type === 'legislation' || event.event_type === 'regulation') {
      regulationScore += 10;
    }
    if (event.title.toLowerCase().includes('ban')) {
      banMentions++;
    }
    if (event.title.toLowerCase().includes('tax')) {
      taxMentions++;
    }
    if (event.sentiment_impact < 0) {
      totalNegativeSentiment += Math.abs(event.sentiment_impact);
    }
  }

  // Normalize scores
  const enforcementRisk = Math.min(100, enforcementScore);
  const regulatoryClarity = Math.max(0, 100 - regulationScore * 2);
  const banRisk = Math.min(100, banMentions * 25);
  const taxationRisk = Math.min(100, taxMentions * 20);

  // Calculate overall risk
  const overallRisk = Math.min(100,
    (enforcementRisk * 0.3) +
    ((100 - regulatoryClarity) * 0.2) +
    (banRisk * 0.3) +
    (taxationRisk * 0.2)
  );

  // Determine trend based on sentiment over time
  const firstHalf = recentEvents.slice(Math.floor(recentEvents.length / 2));
  const secondHalf = recentEvents.slice(0, Math.floor(recentEvents.length / 2));

  const firstHalfAvg = firstHalf.length > 0
    ? firstHalf.reduce((s, e) => s + e.sentiment_impact, 0) / firstHalf.length
    : 0;
  const secondHalfAvg = secondHalf.length > 0
    ? secondHalf.reduce((s, e) => s + e.sentiment_impact, 0) / secondHalf.length
    : 0;

  let trend: 'improving' | 'worsening' | 'stable' = 'stable';
  if (secondHalfAvg - firstHalfAvg > 10) trend = 'improving';
  else if (secondHalfAvg - firstHalfAvg < -10) trend = 'worsening';

  return {
    region,
    overallRisk: Math.round(overallRisk),
    regulatoryClarity: Math.round(regulatoryClarity),
    enforcementRisk: Math.round(enforcementRisk),
    banRisk: Math.round(banRisk),
    taxationRisk: Math.round(taxationRisk),
    recentEvents: recentEvents.slice(0, 5).map(row => ({
      id: row.id,
      timestamp: new Date(row.timestamp),
      eventType: row.event_type,
      sourceType: row.source_type,
      country: row.country,
      region: row.region,
      title: row.title,
      impactLevel: row.impact_level,
      sentimentImpact: row.sentiment_impact,
      affectedCoins: row.affected_coins || [],
      affectedSectors: row.affected_sectors || [],
    })),
    trend,
  };
}

/**
 * Calculate event impact after the fact
 */
export async function calculateEventImpact(
  eventId: string
): Promise<NewsImpactAnalysis | null> {
  const db = checkSupabase();

  const { data: event, error } = await db
    .from('news_policy_events')
    .select('*')
    .eq('id', eventId)
    .single();

  if (error || !event) {
    console.error('Error fetching event:', error);
    return null;
  }

  // Calculate actual impact if we have price data
  let accuracy: number | undefined;
  if (event.btc_price_before && event.btc_price_24h_after) {
    const actualChange = ((event.btc_price_24h_after - event.btc_price_before) / event.btc_price_before) * 100;

    // Predicted direction based on sentiment
    const predictedDirection = event.sentiment_impact > 0 ? 1 : -1;
    const actualDirection = actualChange > 0 ? 1 : -1;

    accuracy = predictedDirection === actualDirection ? 100 : 0;

    // Update the event with actual impact
    await db
      .from('news_policy_events')
      .update({ actual_impact: actualChange })
      .eq('id', eventId);
  }

  return {
    eventId,
    predictedImpact: event.sentiment_impact,
    actualImpact: event.actual_impact,
    accuracy,
    priceMovement: {
      before: event.btc_price_before || 0,
      after24h: event.btc_price_24h_after,
      after7d: event.btc_price_7d_after,
      percentChange24h: event.btc_price_before && event.btc_price_24h_after
        ? ((event.btc_price_24h_after - event.btc_price_before) / event.btc_price_before) * 100
        : undefined,
      percentChange7d: event.btc_price_before && event.btc_price_7d_after
        ? ((event.btc_price_7d_after - event.btc_price_before) / event.btc_price_before) * 100
        : undefined,
    },
  };
}

/**
 * Scan news sources and record new events
 */
export async function scanNewsAndPolicies(): Promise<{
  newEvents: number;
  highImpact: number;
}> {
  // Fetch from CryptoPanic
  const [hotNews, importantNews] = await Promise.all([
    fetchCryptoPanicSentiment('hot'),
    fetchCryptoPanicSentiment('important'),
  ]);

  const allNews = [...hotNews, ...importantNews];
  const uniqueNews = allNews.filter((post, index, self) =>
    index === self.findIndex(p => p.id === post.id)
  );

  let newEvents = 0;
  let highImpact = 0;

  for (const post of uniqueNews) {
    const fullText = `${post.title} ${post.content}`;
    const sentiment = analyzeSentimentAdvanced(fullText);

    const eventType = classifyEventType(fullText);
    const location = detectLocation(fullText);
    const sourceType = detectSourceType(post.platform, fullText);
    const affectedCoins = extractAffectedCoins(fullText);
    const affectedSectors = extractAffectedSectors(fullText);
    const sentimentScore = Math.round(sentiment.score * 100);
    const impactLevel = calculateImpactLevel(eventType, sentimentScore, affectedCoins);

    // Only store if it's regulation/policy related or high impact
    const isRelevant = ['regulation', 'legislation', 'enforcement', 'etf', 'cbdc', 'hack'].includes(eventType) ||
                       impactLevel === 'critical' || impactLevel === 'high';

    if (isRelevant) {
      try {
        const result = await recordNewsEvent({
          timestamp: new Date(post.timestamp),
          eventType,
          sourceType,
          country: location.country,
          region: location.region,
          title: post.title,
          summary: post.content.slice(0, 500),
          sourceUrl: post.url,
          impactLevel,
          sentimentImpact: sentimentScore,
          affectedCoins,
          affectedSectors,
          aiSentimentScore: sentimentScore,
          aiImportanceScore: impactLevel === 'critical' ? 100 :
                             impactLevel === 'high' ? 75 :
                             impactLevel === 'medium' ? 50 : 25,
        });

        if (result) {
          newEvents++;
          if (impactLevel === 'critical' || impactLevel === 'high') {
            highImpact++;
          }
        }
      } catch {
        // Skip duplicates
      }
    }
  }

  return { newEvents, highImpact };
}

/**
 * Get news signals formatted for AI prediction
 */
export async function getNewsSignalsForPrediction(): Promise<{
  recentHighImpactCount: number;
  dominantEventType: EventType | null;
  overallNewsSentiment: number;
  regulatoryRisk: number;
  bullishNews: string[];
  bearishNews: string[];
  upcomingCatalysts: string[];
}> {
  const recentNews = await getRecentHighImpactNews(50, 'low');

  if (recentNews.length === 0) {
    return {
      recentHighImpactCount: 0,
      dominantEventType: null,
      overallNewsSentiment: 0,
      regulatoryRisk: 50,
      bullishNews: [],
      bearishNews: [],
      upcomingCatalysts: [],
    };
  }

  // Count event types
  const eventTypeCounts: Record<EventType, number> = {} as Record<EventType, number>;
  for (const event of recentNews) {
    eventTypeCounts[event.eventType] = (eventTypeCounts[event.eventType] || 0) + 1;
  }

  const dominantEventType = Object.entries(eventTypeCounts)
    .sort((a, b) => b[1] - a[1])[0]?.[0] as EventType || null;

  // Calculate overall sentiment
  const overallNewsSentiment = Math.round(
    recentNews.reduce((s, e) => s + e.sentimentImpact, 0) / recentNews.length
  );

  // Calculate regulatory risk
  const regulatoryEvents = recentNews.filter(e =>
    ['regulation', 'legislation', 'enforcement'].includes(e.eventType)
  );
  const regulatoryRisk = regulatoryEvents.length > 0
    ? Math.round(50 - (regulatoryEvents.reduce((s, e) => s + e.sentimentImpact, 0) / regulatoryEvents.length) / 2)
    : 50;

  // Get bullish/bearish headlines
  const bullishNews = recentNews
    .filter(e => e.sentimentImpact > 30 && (e.impactLevel === 'high' || e.impactLevel === 'critical'))
    .slice(0, 3)
    .map(e => e.title);

  const bearishNews = recentNews
    .filter(e => e.sentimentImpact < -30 && (e.impactLevel === 'high' || e.impactLevel === 'critical'))
    .slice(0, 3)
    .map(e => e.title);

  // Get upcoming catalysts (ETF, CBDC, major legislation)
  const upcomingCatalysts = recentNews
    .filter(e => ['etf', 'cbdc', 'legislation'].includes(e.eventType) && e.impactLevel !== 'low')
    .slice(0, 3)
    .map(e => `${e.eventType.toUpperCase()}: ${e.title.slice(0, 80)}`);

  return {
    recentHighImpactCount: recentNews.filter(e =>
      e.impactLevel === 'high' || e.impactLevel === 'critical'
    ).length,
    dominantEventType,
    overallNewsSentiment,
    regulatoryRisk: Math.min(100, Math.max(0, regulatoryRisk)),
    bullishNews,
    bearishNews,
    upcomingCatalysts,
  };
}

/**
 * Get all regional policy risk scores
 */
export async function getAllRegionalRiskScores(): Promise<Record<Region, PolicyRiskScore>> {
  const regions: Region[] = ['north_america', 'europe', 'asia', 'middle_east', 'latam', 'africa', 'global'];

  const scores: Record<Region, PolicyRiskScore> = {} as Record<Region, PolicyRiskScore>;

  for (const region of regions) {
    try {
      scores[region] = await getPolicyRiskScore(region);
    } catch {
      scores[region] = {
        region,
        overallRisk: 50,
        regulatoryClarity: 50,
        enforcementRisk: 50,
        banRisk: 50,
        taxationRisk: 50,
        recentEvents: [],
        trend: 'stable',
      };
    }
  }

  return scores;
}
