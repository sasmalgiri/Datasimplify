import { NextRequest, NextResponse } from 'next/server';
import Groq from 'groq-sdk';

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY || '',
});

// ---------------------------------------------------------------------------
// IP-based rate limiting (in-memory, resets per-IP every hour)
// ---------------------------------------------------------------------------
const RATE_LIMIT_WINDOW = 60 * 60 * 1000; // 1 hour
const MAX_QUERIES_PER_HOUR = 5;
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

function checkRateLimit(ip: string): { allowed: boolean; remaining: number } {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);

  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW });
    return { allowed: true, remaining: MAX_QUERIES_PER_HOUR - 1 };
  }

  if (entry.count >= MAX_QUERIES_PER_HOUR) {
    return { allowed: false, remaining: 0 };
  }

  entry.count++;
  return { allowed: true, remaining: MAX_QUERIES_PER_HOUR - entry.count };
}

// ---------------------------------------------------------------------------
// POST /api/live-dashboard/ai
// ---------------------------------------------------------------------------
export async function POST(request: NextRequest) {
  try {
    const ip =
      request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
      'unknown';

    // --- Rate limit check ---------------------------------------------------
    const { allowed, remaining } = checkRateLimit(ip);
    if (!allowed) {
      return NextResponse.json(
        { error: 'Rate limit exceeded. Maximum 5 queries per hour.' },
        { status: 429 }
      );
    }

    // --- Parse & validate body ----------------------------------------------
    const body = await request.json();
    const { question, dashboardContext } = body as {
      question?: string;
      dashboardContext?: string;
    };

    if (!question || typeof question !== 'string' || question.trim() === '') {
      return NextResponse.json(
        { error: 'Missing or empty "question" field.' },
        { status: 400 }
      );
    }

    const context = dashboardContext || 'No additional context provided.';

    // --- Call Groq -----------------------------------------------------------
    const chatCompletion = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      temperature: 0.3,
      max_tokens: 500,
      messages: [
        {
          role: 'system',
          content: `You are CRK AI, a crypto analytics assistant embedded in CryptoReportKit dashboards. The user is viewing live dashboard data. Current data context: ${context}. Answer concisely in 2-3 sentences. Use numbers and data when available.`,
        },
        {
          role: 'user',
          content: question.trim(),
        },
      ],
    });

    const answer =
      chatCompletion.choices?.[0]?.message?.content ||
      'Sorry, I could not generate a response.';

    return NextResponse.json({ answer, remainingQueries: remaining });
  } catch (error: unknown) {
    console.error('[live-dashboard/ai] Error:', error);
    const message =
      error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
