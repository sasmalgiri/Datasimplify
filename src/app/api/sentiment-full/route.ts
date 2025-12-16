import { NextResponse } from 'next/server';
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

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get('type') || 'aggregated';
  const symbol = searchParams.get('symbol') || 'BTC';
  const source = searchParams.get('source') || 'all';

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
        data = await fetchCoinGeckoTrending();
        break;
      
      case 'github':
        data = await fetchGitHubActivity();
        break;
      
      default:
        return NextResponse.json({ error: 'Invalid type' }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      data,
      type,
      timestamp: new Date().toISOString(),
      sources: [
        'Reddit (r/cryptocurrency, r/bitcoin, r/ethtrader, r/CryptoMarkets, r/altcoin)',
        'CryptoPanic News Aggregator',
        'RSS Feeds (CoinTelegraph, CoinDesk, Decrypt, CryptoSlate)',
        '4chan /biz/',
        'CoinGecko Trending',
        'GitHub Activity',
      ],
      methodology: 'Keyword-based NLP sentiment analysis with engagement weighting',
      legal: 'All data from public APIs and permitted sources',
    });

  } catch (error) {
    console.error('Comprehensive sentiment API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch sentiment data', details: String(error) },
      { status: 500 }
    );
  }
}
