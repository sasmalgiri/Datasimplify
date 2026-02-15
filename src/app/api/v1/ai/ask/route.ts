/**
 * AI Ask Endpoint
 *
 * POST /api/v1/ai/ask
 * Body: { question: string }
 * Returns: { answer: string }
 *
 * Uses Groq SDK with llama-3.3-70b-versatile for fast AI responses.
 * Rate-limited per tier: free=5/day, pro=100/day.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser, getSupabaseClient } from '@/lib/supabase/api-auth';
import { getUserEntitlement, PLAN_LIMITS } from '@/lib/entitlements';
import Groq from 'groq-sdk';

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY || '',
});

const COINGECKO_FREE = 'https://api.coingecko.com/api/v3';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function getAiQueryCount(supabase: any, userId: string): Promise<number> {
  const today = new Date().toISOString().split('T')[0];
  // Count usage_events with event_type 'ai_ask' for today
  const { count } = await supabase
    .from('usage_events')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('event_type', 'ai_ask')
    .gte('created_at', today + 'T00:00:00Z')
    .lt('created_at', today + 'T23:59:59Z');
  return count || 0;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function incrementAiQueryCount(supabase: any, userId: string): Promise<void> {
  await supabase
    .from('usage_events')
    .insert({
      user_id: userId,
      event_type: 'ai_ask',
      metadata: { source: 'web_dashboard' },
    });
}

async function fetchPriceContext(question: string): Promise<string> {
  const coinPatterns = question.toLowerCase().match(/\b(bitcoin|btc|ethereum|eth|solana|sol|cardano|ada|xrp|dogecoin|doge|bnb|polygon|matic|avalanche|avax)\b/g);
  if (!coinPatterns || coinPatterns.length === 0) return '';

  const coinMap: Record<string, string> = {
    btc: 'bitcoin', eth: 'ethereum', sol: 'solana', ada: 'cardano',
    doge: 'dogecoin', matic: 'polygon', avax: 'avalanche',
  };

  const coinIds = [...new Set(coinPatterns.map(c => coinMap[c] || c))];

  try {
    const res = await fetch(
      `${COINGECKO_FREE}/simple/price?ids=${coinIds.join(',')}&vs_currencies=usd&include_24hr_change=true&include_market_cap=true`
    );
    if (!res.ok) return '';
    const data = await res.json();

    const lines: string[] = [];
    for (const [coin, info] of Object.entries(data)) {
      const d = info as Record<string, number>;
      lines.push(`${coin}: $${d.usd?.toLocaleString()}, 24h change: ${d.usd_24h_change?.toFixed(2)}%, mcap: $${(d.usd_market_cap / 1e9)?.toFixed(2)}B`);
    }
    return lines.length > 0 ? '\n\nReal-time prices:\n' + lines.join('\n') : '';
  } catch {
    return '';
  }
}

export async function POST(request: NextRequest) {
  try {
    const { user, error: authError } = await getAuthUser(request);
    if (!user) {
      return NextResponse.json({ error: authError || 'Unauthorized' }, { status: 401 });
    }

    const supabase = await getSupabaseClient(request);
    if (!supabase) {
      return NextResponse.json({ error: 'Server error' }, { status: 500 });
    }

    const entitlement = await getUserEntitlement(supabase, user.id);
    const tier = entitlement?.tier || 'free';
    const limits = PLAN_LIMITS[tier];
    const dailyLimit = limits.dailyAiQueries;

    const usedToday = await getAiQueryCount(supabase, user.id);
    if (usedToday >= dailyLimit) {
      return NextResponse.json({
        error: `AI query limit reached (${dailyLimit}/day). ${tier === 'free' ? 'Upgrade to Pro for 50/day.' : 'Resets at midnight UTC.'}`,
        code: 'AI_LIMIT_REACHED',
        used: usedToday,
        limit: dailyLimit,
      }, { status: 429 });
    }

    const body = await request.json();
    const question = body.question?.trim();
    if (!question || question.length > 500) {
      return NextResponse.json({ error: 'Question required (max 500 chars)' }, { status: 400 });
    }

    const priceContext = await fetchPriceContext(question);

    const completion = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [
        {
          role: 'system',
          content: `You are CRK AI, a crypto market assistant built into CryptoReportKit. Give concise, data-driven answers about cryptocurrency markets. If real-time price data is provided, use it. Keep answers under 200 words. Don't give financial advice - only factual analysis.${priceContext}`,
        },
        { role: 'user', content: question },
      ],
      max_tokens: 300,
      temperature: 0.3,
    });

    const answer = completion.choices?.[0]?.message?.content || 'No response generated.';

    await incrementAiQueryCount(supabase, user.id);

    return NextResponse.json({
      answer,
      remaining: dailyLimit - usedToday - 1,
    });
  } catch (err) {
    console.error('[AI Ask] Error:', err);
    return NextResponse.json({ error: 'AI service temporarily unavailable' }, { status: 500 });
  }
}
