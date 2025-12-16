import { NextResponse } from 'next/server';
import {
  getSentimentDashboard,
  getCoinSentiment,
  getCryptoPanicNews,
  getRedditCryptoSentiment,
  getTrendingCoins,
} from '@/lib/socialSentiment';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get('type') || 'dashboard';
  const symbol = searchParams.get('symbol') || 'BTC';
  const filter = searchParams.get('filter') as 'rising' | 'hot' | 'bullish' | 'bearish' | 'important' || 'hot';
  const limit = parseInt(searchParams.get('limit') || '25');

  try {
    let data;

    switch (type) {
      case 'dashboard':
        data = await getSentimentDashboard();
        break;
      
      case 'coin':
        data = await getCoinSentiment(symbol.toUpperCase());
        break;
      
      case 'news':
        data = await getCryptoPanicNews(filter, symbol !== 'ALL' ? symbol : undefined);
        break;
      
      case 'reddit':
        data = await getRedditCryptoSentiment('cryptocurrency', limit);
        break;
      
      case 'trending':
        data = await getTrendingCoins();
        break;
      
      default:
        return NextResponse.json({ error: 'Invalid type' }, { status: 400 });
    }

    return NextResponse.json({
      data,
      type,
      timestamp: new Date().toISOString(),
      source: 'FREE APIs (CryptoPanic, Reddit, CoinGecko)',
      note: 'Sentiment analysis uses keyword matching. For AI-powered sentiment, integrate with Ollama.',
    });

  } catch (error) {
    console.error('Sentiment API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch sentiment data' },
      { status: 500 }
    );
  }
}
