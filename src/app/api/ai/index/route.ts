import { NextResponse } from 'next/server';
import { isSupabaseConfigured } from '@/lib/supabase';
import {
  indexMarketData,
  indexSentimentPosts,
  indexWhaleTransactions,
  generateDailySummary,
} from '@/lib/ragService';
import { fetchMarketOverview } from '@/lib/dataApi';
import { aggregateAllSentiment } from '@/lib/comprehensiveSentiment';
import { getWhaleDashboard } from '@/lib/whaleTracking';
import { checkOllamaHealth } from '@/lib/ollamaAI';

// Secret key to protect endpoint
const INDEX_SECRET = process.env.SYNC_SECRET_KEY || 'dev-secret-change-in-production';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const secret = searchParams.get('secret');
  const type = searchParams.get('type') || 'all';

  // Verify secret
  if (secret !== INDEX_SECRET) {
    return NextResponse.json(
      { error: 'Unauthorized. Provide valid secret key.' },
      { status: 401 }
    );
  }

  // Check dependencies
  if (!isSupabaseConfigured) {
    return NextResponse.json({
      error: 'Supabase not configured',
      message: 'Set NEXT_PUBLIC_SUPABASE_URL and keys in .env.local',
    }, { status: 503 });
  }

  const health = await checkOllamaHealth();
  if (!health.healthy) {
    return NextResponse.json({
      error: 'Ollama not running',
      message: 'Start Ollama with: ollama serve',
      details: health.error,
    }, { status: 503 });
  }

  try {
    const results: Record<string, { indexed?: number; error?: string }> = {};
    const startTime = Date.now();

    // Index market data
    if (type === 'all' || type === 'market') {
      try {
        console.log('📊 Indexing market data...');
        const marketData = await fetchMarketOverview();
        const formattedData = marketData.map(coin => ({
          symbol: coin.symbol,
          name: coin.name,
          price: coin.price,
          priceChange24h: coin.priceChangePercent24h,
          volume24h: coin.quoteVolume24h,
          marketCap: coin.marketCap || 0,
        }));
        
        const result = await indexMarketData(formattedData);
        results.market = result;
        console.log(`✅ Indexed ${result.indexed} market records`);
      } catch (error) {
        results.market = { error: String(error) };
        console.error('❌ Market indexing failed:', error);
      }
    }

    // Index sentiment data
    if (type === 'all' || type === 'sentiment') {
      try {
        console.log('💬 Indexing sentiment data...');
        const sentiment = await aggregateAllSentiment();
        
        const posts = [
          ...sentiment.topBullish,
          ...sentiment.topBearish,
        ].slice(0, 100).map(post => ({
          id: post.id,
          source: post.source,
          platform: post.platform,
          title: post.title,
          content: post.content,
          coins: post.coins,
          timestamp: post.timestamp,
        }));
        
        const result = await indexSentimentPosts(posts);
        results.sentiment = result;
        console.log(`✅ Indexed ${result.indexed} sentiment posts`);
      } catch (error) {
        results.sentiment = { error: String(error) };
        console.error('❌ Sentiment indexing failed:', error);
      }
    }

    // Index whale data
    if (type === 'all' || type === 'whales') {
      try {
        console.log('🐋 Indexing whale data...');
        const whaleDashboard = await getWhaleDashboard();
        
        const transactions = whaleDashboard.recentWhaleTransactions.map(tx => ({
          hash: tx.hash,
          blockchain: tx.blockchain,
          amount: tx.amount,
          amountUsd: tx.amountUsd,
          type: tx.type,
          timestamp: tx.timestamp,
        }));
        
        const result = await indexWhaleTransactions(transactions);
        results.whales = result;
        console.log(`✅ Indexed ${result.indexed} whale transactions`);
      } catch (error) {
        results.whales = { error: String(error) };
        console.error('❌ Whale indexing failed:', error);
      }
    }

    // Generate daily summaries
    if (type === 'all' || type === 'summaries') {
      try {
        console.log('📝 Generating daily summaries...');
        const today = new Date();
        
        // Generate summaries for main categories
        await generateDailySummary(today, 'market');
        await generateDailySummary(today, 'sentiment');
        await generateDailySummary(today, 'onchain');
        
        // Generate for top coins
        const topCoins = ['BTC', 'ETH', 'SOL', 'XRP', 'DOGE'];
        for (const coin of topCoins) {
          await generateDailySummary(today, 'market', coin);
        }
        
        results.summaries = { indexed: 8 };
        console.log('✅ Generated daily summaries');
      } catch (error) {
        results.summaries = { error: String(error) };
        console.error('❌ Summary generation failed:', error);
      }
    }

    const duration = ((Date.now() - startTime) / 1000).toFixed(2);

    return NextResponse.json({
      success: true,
      type,
      results,
      duration: `${duration}s`,
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error('Index API error:', error);
    return NextResponse.json({
      error: 'Indexing failed',
      details: String(error),
    }, { status: 500 });
  }
}

// Also support POST
export async function POST(request: Request) {
  return GET(request);
}
