import { NextResponse } from 'next/server';
import { ragQuery, getMarketSummary, getCoinAnalysis, getRiskAssessment } from '@/lib/ragWithData';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { message, history, action } = body;

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

    const result = await ragQuery(message, conversationHistory);

    return NextResponse.json({
      success: true,
      data: {
        answer: result.answer,
        dataUsed: result.dataUsed,
        confidence: result.confidence,
        tokensUsed: result.tokensUsed,
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
    },
  });
}
