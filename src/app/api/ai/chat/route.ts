import { NextResponse } from 'next/server';
import { 
  ragQuery, 
  searchSimilar, 
  getCoinAnalysis,
  getMarketOverviewAI,
} from '@/lib/ragService';
import { 
  checkOllamaHealth,
  analyzeSentimentAI,
  generateMarketAnalysis,
  ChatMessage,
} from '@/lib/ollamaAI';
import { isSupabaseConfigured } from '@/lib/supabase';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { 
      type = 'chat',
      query,
      message,
      conversationHistory = [],
      categoryPath,
      coinSymbol,
      text, // For sentiment analysis
    } = body;

    // Check Ollama is running
    const health = await checkOllamaHealth();
    if (!health.healthy) {
      return NextResponse.json({
        error: 'AI service unavailable',
        message: 'Ollama is not running. Start it with: ollama serve',
        details: health.error,
      }, { status: 503 });
    }

    let response;

    switch (type) {
      // Main RAG chat
      case 'chat':
        if (!query && !message) {
          return NextResponse.json({ error: 'Query or message required' }, { status: 400 });
        }

        if (!isSupabaseConfigured) {
          // Fallback to direct chat without RAG
          const { chat } = await import('@/lib/ollamaAI');
          const chatResponse = await chat(
            [...(conversationHistory as ChatMessage[]), { role: 'user', content: query || message }],
            { 
              systemPrompt: 'You are DataSimplify\'s AI assistant for cryptocurrency markets. Note: Real-time data is not available - Supabase needs to be configured for RAG.',
            }
          );
          
          response = {
            answer: chatResponse.content,
            sources: [],
            confidence: 0.5,
            tokensUsed: chatResponse.tokensUsed,
            note: 'RAG disabled - configure Supabase for enhanced responses',
          };
        } else {
          // Full RAG query
          response = await ragQuery(query || message, {
            conversationHistory: conversationHistory as ChatMessage[],
            categoryPath,
            coinSymbol,
          });
        }
        break;

      // Semantic search only
      case 'search':
        if (!query) {
          return NextResponse.json({ error: 'Query required' }, { status: 400 });
        }

        if (!isSupabaseConfigured) {
          return NextResponse.json({
            error: 'Search unavailable',
            message: 'Supabase not configured. Set environment variables.',
          }, { status: 503 });
        }

        const searchResults = await searchSimilar(query, {
          limit: 20,
          categoryPath,
          coinSymbol,
        });

        response = {
          results: searchResults,
          count: searchResults.length,
          query,
        };
        break;

      // Coin-specific analysis
      case 'coin-analysis':
        if (!coinSymbol) {
          return NextResponse.json({ error: 'coinSymbol required' }, { status: 400 });
        }

        if (!isSupabaseConfigured) {
          return NextResponse.json({
            error: 'Analysis unavailable',
            message: 'Supabase not configured',
          }, { status: 503 });
        }

        response = await getCoinAnalysis(coinSymbol.toUpperCase());
        break;

      // Market overview
      case 'market-overview':
        if (!isSupabaseConfigured) {
          return NextResponse.json({
            error: 'Overview unavailable',
            message: 'Supabase not configured',
          }, { status: 503 });
        }

        response = await getMarketOverviewAI();
        break;

      // Sentiment analysis (direct, doesn't need Supabase)
      case 'sentiment':
        if (!text) {
          return NextResponse.json({ error: 'Text required' }, { status: 400 });
        }

        response = await analyzeSentimentAI(text);
        break;

      // Health check
      case 'health':
        response = {
          ollama: health,
          supabase: isSupabaseConfigured,
          models: health.models,
        };
        break;

      default:
        return NextResponse.json({ error: 'Invalid type' }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      type,
      data: response,
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error('AI API error:', error);
    return NextResponse.json({
      error: 'AI request failed',
      details: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
}

// GET for simple queries and health check
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get('type') || 'health';
  const query = searchParams.get('query') || searchParams.get('q');
  const coin = searchParams.get('coin');

  if (type === 'health') {
    const health = await checkOllamaHealth();
    return NextResponse.json({
      ollama: health,
      supabase: isSupabaseConfigured,
      ready: health.healthy,
    });
  }

  if (type === 'search' && query) {
    if (!isSupabaseConfigured) {
      return NextResponse.json({
        error: 'Search unavailable - configure Supabase',
      }, { status: 503 });
    }

    const results = await searchSimilar(query, {
      limit: 10,
      coinSymbol: coin?.toUpperCase(),
    });

    return NextResponse.json({
      success: true,
      results,
      count: results.length,
    });
  }

  return NextResponse.json({
    error: 'Use POST for chat, or GET with ?type=health or ?type=search&q=...',
  }, { status: 400 });
}
