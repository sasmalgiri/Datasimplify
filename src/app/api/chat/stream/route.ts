import { ragQueryStream, UserLevel } from '@/lib/ragWithData';
import { enforceMinInterval } from '@/lib/serverRateLimit';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

function getClientIp(req: Request): string {
  const xff = req.headers.get('x-forwarded-for');
  if (xff) return xff.split(',')[0].trim();
  return req.headers.get('x-real-ip') || 'unknown';
}

// Validate user level
function parseUserLevel(level: unknown): UserLevel {
  if (level === 'beginner' || level === 'intermediate' || level === 'pro') {
    return level;
  }
  return 'intermediate'; // Default
}

export async function POST(request: Request) {
  try {
    const ip = getClientIp(request);
    const limitResult = enforceMinInterval({ key: `chat_stream:${ip}`, minIntervalMs: 3000 });
    if (!limitResult.ok) {
      return new Response(JSON.stringify({ error: 'Too many requests. Please wait and try again.' }), {
        status: 429,
        headers: {
          'Content-Type': 'application/json',
          'Retry-After': String(limitResult.retryAfterSeconds),
        },
      });
    }

    const body = await request.json();
    const {
      message,
      history,
      userLevel: rawUserLevel,
      coinSymbol,
      watchlist,
      portfolioHoldings,
      userId
    } = body;

    // Validate message
    if (!message || typeof message !== 'string') {
      return new Response(JSON.stringify({ error: 'Message is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (message.length > 4000) {
      return new Response(JSON.stringify({ error: 'Message is too long' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (Array.isArray(history) && history.length > 50) {
      return new Response(JSON.stringify({ error: 'History is too long' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Parse options
    const userLevel = parseUserLevel(rawUserLevel);
    const options = {
      userLevel,
      coinSymbol,
      watchlist: Array.isArray(watchlist) ? watchlist : undefined,
      portfolioHoldings: Array.isArray(portfolioHoldings) ? portfolioHoldings : undefined,
      userId: typeof userId === 'string' ? userId : undefined,
    };

    // Convert history to proper format
    const conversationHistory = Array.isArray(history)
      ? history.map((h: { role: string; content: string }) => ({
          role: h.role as 'user' | 'assistant',
          content: h.content,
        }))
      : [];

    // Create a readable stream
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        try {
          const generator = ragQueryStream(message, conversationHistory, options);

          for await (const item of generator) {
            if (item.type === 'chunk') {
              // Send text chunk as Server-Sent Event
              const data = `data: ${JSON.stringify({ type: 'chunk', content: item.content })}\n\n`;
              controller.enqueue(encoder.encode(data));
            } else if (item.type === 'metadata') {
              // Send metadata at the end
              const data = `data: ${JSON.stringify({ type: 'metadata', ...item.data })}\n\n`;
              controller.enqueue(encoder.encode(data));
            }
          }

          // Send done signal
          controller.enqueue(encoder.encode('data: [DONE]\n\n'));
          controller.close();
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Stream error';
          const data = `data: ${JSON.stringify({ type: 'error', error: errorMessage })}\n\n`;
          controller.enqueue(encoder.encode(data));
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });
  } catch (error) {
    console.error('Stream API error:', error);

    const errorMessage = error instanceof Error ? error.message : 'Failed to start stream';

    // Check if it's a configuration error
    if (errorMessage.includes('GROQ_API_KEY')) {
      return new Response(JSON.stringify({
        error: 'AI not configured. Add GROQ_API_KEY to environment variables.',
        setupRequired: true,
      }), {
        status: 503,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
