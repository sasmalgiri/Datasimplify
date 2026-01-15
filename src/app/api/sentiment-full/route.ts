/**
 * Comprehensive Sentiment API
 *
 * Aggregates sentiment from Reddit, CryptoPanic, RSS, 4chan, CoinGecko, and GitHub
 * Data is for display only - not redistributable
 *
 * COMPLIANCE: This route is protected against external API access.
 */

import { NextRequest, NextResponse } from 'next/server';
import { isFeatureEnabled } from '@/lib/featureFlags';
import {
  aggregateAllSentiment,
  getCoinDeepSentiment,
  fetchRedditSentiment,
  fetchCryptoPanicSentiment,
  fetchRSSFeeds,
  fetch4chanBiz,
  fetchCoinGeckoTrending,
  fetchGitHubActivity,
} from '@/lib/comprehensiveSentiment';
import { enforceDisplayOnly } from '@/lib/apiSecurity';

export async function GET(request: NextRequest) {
  // Enforce display-only access - block external API scraping
  const blocked = enforceDisplayOnly(request, '/api/sentiment-full');
  if (blocked) return blocked;
  if (!isFeatureEnabled('socialSentiment')) {
    return NextResponse.json(
      { error: 'This feature is currently disabled.', disabled: true },
      { status: 503 }
    );
  }

  const { searchParams } = new URL(request.url);
  const type = searchParams.get('type') || 'aggregated';
  const symbol = searchParams.get('symbol') || 'BTC';
  const _source = searchParams.get('source') || 'all'; // Reserved for future filtering

  try {
    let data;

    switch (type) {
      // Main aggregated sentiment from ALL sources
      case 'aggregated':
        data = await aggregateAllSentiment();
        break;
      
      // Deep dive into specific coin
      case 'coin':
        data = await getCoinDeepSentiment(symbol.toUpperCase());
        break;
      
      // Individual sources
      case 'reddit':
        data = await fetchRedditSentiment(
          ['cryptocurrency', 'bitcoin', 'ethtrader', 'CryptoMarkets', 'altcoin'],
          50
        );
        break;
      
      case 'news':
        data = await fetchCryptoPanicSentiment('hot');
        break;
      
      case 'rss':
        data = await fetchRSSFeeds();
        break;
      
      case '4chan':
        data = await fetch4chanBiz();
        break;
      
      case 'trending':
        if (!isFeatureEnabled('coingecko')) {
          return NextResponse.json(
            { error: 'Trending sentiment is unavailable (CoinGecko disabled).' },
            { status: 403 }
          );
        }
        data = await fetchCoinGeckoTrending();
        break;
      
      case 'github':
        data = await fetchGitHubActivity();
        break;
      
      default:
        return NextResponse.json({ error: 'Invalid type' }, { status: 400 });
    }

    const sources = [
      'Reddit (r/cryptocurrency, r/bitcoin, r/ethtrader, r/CryptoMarkets, r/altcoin)',
      'CryptoPanic News Aggregator',
      'RSS Feeds (CoinTelegraph, CoinDesk, Decrypt, CryptoSlate)',
      '4chan /biz/',
      ...(isFeatureEnabled('coingecko') ? ['CoinGecko Trending'] : []),
      'GitHub Activity',
    ];

    return NextResponse.json({
      success: true,
      data,
      type,
      timestamp: new Date().toISOString(),
      sources,
      methodology: 'Keyword-based NLP sentiment analysis with engagement weighting',
      legal: 'Third-party data sources may have their own terms and restrictions.',
    });

  } catch (error) {
    console.error('Comprehensive sentiment API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch sentiment data', details: String(error) },
      { status: 500 }
    );
  }
}
