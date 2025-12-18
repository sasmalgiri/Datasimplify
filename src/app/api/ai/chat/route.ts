import { NextResponse } from 'next/server';
import { chat, checkAIHealth, analyzeSentiment, AIMessage } from '@/lib/aiProvider';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { 
      type = 'chat',
      query,
      message,
      conversationHistory = [],
      text,
    } = body;

    // Check AI is available
    const health = await checkAIHealth();
    if (!health.available) {
      return NextResponse.json({
        error: 'AI service unavailable',
        message: health.error || 'No AI provider configured',
        hint: 'Set GROQ_API_KEY (free) or OPENAI_API_KEY in environment variables',
      }, { status: 503 });
    }

    let response;

    switch (type) {
      case 'chat':
        if (!query && !message) {
          return NextResponse.json({ error: 'Query or message required' }, { status: 400 });
        }

        const userMessage = query || message;
        const messages: AIMessage[] = [
          ...conversationHistory.map((m: { role: string; content: string }) => ({
            role: m.role as 'user' | 'assistant',
            content: m.content,
          })),
          { role: 'user' as const, content: userMessage },
        ];

        const chatResponse = await chat(messages);
        
        response = {
          answer: chatResponse.content,
          provider: chatResponse.provider,
          model: chatResponse.model,
          tokensUsed: chatResponse.tokensUsed,
        };
        break;

      case 'sentiment':
        if (!text) {
          return NextResponse.json({ error: 'Text required' }, { status: 400 });
        }
        response = await analyzeSentiment(text);
        break;

      case 'health':
        response = health;
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

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get('type') || 'health';

  if (type === 'health') {
    const health = await checkAIHealth();
    return NextResponse.json({
      ...health,
      hint: !health.available 
        ? 'Get free API key at console.groq.com and set GROQ_API_KEY' 
        : undefined,
    });
  }

  return NextResponse.json({
    error: 'Use POST for chat, or GET with ?type=health',
  }, { status: 400 });
}
