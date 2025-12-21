import { NextResponse } from 'next/server';
import { ragQuery, getMarketSummary, getCoinAnalysis, getRiskAssessment, UserLevel } from '@/lib/ragWithData';

export const dynamic = 'force-dynamic';

// Validate user level
function parseUserLevel(level: unknown): UserLevel {
  if (level === 'beginner' || level === 'intermediate' || level === 'pro') {
    return level;
  }
  return 'intermediate'; // Default
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      message,
      history,
      action,
      userLevel: rawUserLevel,
      coinSymbol,
      watchlist,
      portfolioHoldings,
      userId
    } = body;

    // Parse user level
    const userLevel = parseUserLevel(rawUserLevel);
    const options = {
      userLevel,
      coinSymbol,
      watchlist: Array.isArray(watchlist) ? watchlist : undefined,
      portfolioHoldings: Array.isArray(portfolioHoldings) ? portfolioHoldings : undefined,
      userId: typeof userId === 'string' ? userId : undefined,
    };

    // Handle quick actions
    if (action) {
      let result;
      switch (action) {
        case 'market-summary':
          result = await getMarketSummary();
          break;
        case 'risk-assessment':
          result = await getRiskAssessment();
          break;
        case 'analyze-btc':
          result = await getCoinAnalysis('Bitcoin');
          break;
        case 'analyze-eth':
          result = await getCoinAnalysis('Ethereum');
          break;
        default:
          return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
      }

      return NextResponse.json({
        success: true,
        data: {
          answer: result.answer,
          dataUsed: result.dataUsed,
          confidence: result.confidence,
          userLevel: result.userLevel,
        },
      });
    }

    // Handle regular chat message
    if (!message || typeof message !== 'string') {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }

    // Convert history to proper format
    const conversationHistory = Array.isArray(history)
      ? history.map((h: { role: string; content: string }) => ({
          role: h.role as 'user' | 'assistant',
          content: h.content,
        }))
      : [];

    const result = await ragQuery(message, conversationHistory, options);

    return NextResponse.json({
      success: true,
      data: {
        answer: result.answer,
        dataUsed: result.dataUsed,
        confidence: result.confidence,
        tokensUsed: result.tokensUsed,
        userLevel: result.userLevel,
        // Enhanced fields
        suggestedQuestions: result.suggestedQuestions,
        sourceQuality: result.sourceQuality,
        marketSession: result.marketSession,
        queryType: result.queryType,
        comparisonData: result.comparisonData,
      },
    });
  } catch (error) {
    console.error('Chat API error:', error);

    const errorMessage = error instanceof Error ? error.message : 'Failed to process chat';

    // Check if it's a configuration error
    if (errorMessage.includes('GROQ_API_KEY')) {
      return NextResponse.json({
        success: false,
        error: 'AI not configured. Add GROQ_API_KEY to environment variables.',
        setupRequired: true,
      }, { status: 503 });
    }

    return NextResponse.json({
      success: false,
      error: errorMessage,
    }, { status: 500 });
  }
}

// Health check for AI availability
export async function GET() {
  const groqConfigured = !!process.env.GROQ_API_KEY;

  return NextResponse.json({
    available: groqConfigured,
    provider: groqConfigured ? 'groq' : null,
    model: process.env.GROQ_MODEL || 'llama-3.1-70b-versatile',
    features: {
      marketData: true,
      fearGreed: true,
      whaleTracking: true,
      derivatives: true,
      macroIndicators: true,
      predictions: true,
      // Enhanced RAG features
      aiSummaries: process.env.ENABLE_AI_SUMMARIES !== 'false',
      sentimentSignals: process.env.ENABLE_SENTIMENT_SIGNALS !== 'false',
      smartMoney: process.env.ENABLE_SMART_MONEY !== 'false',
      userAdaptation: process.env.ENABLE_USER_ADAPTATION !== 'false',
    },
    userLevels: ['beginner', 'intermediate', 'pro'],
  });
}
