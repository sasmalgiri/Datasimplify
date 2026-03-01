/**
 * Cron: Auto-generate daily forum posts using Groq AI
 * Schedule: Daily at 8:00 UTC (1:30 PM IST / 3:00 AM EST)
 *
 * Generates 2 new discussion threads per day in rotating categories
 * with realistic, SEO-friendly crypto content.
 */

import { NextRequest, NextResponse } from 'next/server';
import Groq from 'groq-sdk';
import { supabaseAdmin } from '@/lib/supabase';
import { FORUM_CATEGORIES } from '@/lib/forumCategories';

export const dynamic = 'force-dynamic';
export const maxDuration = 60; // allow up to 60s for AI generation

/* ------------------------------------------------------------------ */
/*  Auth                                                               */
/* ------------------------------------------------------------------ */

function isAuthorized(request: NextRequest): boolean {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) return false;

  const authHeader = request.headers.get('authorization');
  if (authHeader === `Bearer ${cronSecret}`) return true;

  // Fallback: Vercel Hobby plan UA check
  const ua = request.headers.get('user-agent') || '';
  if (ua.includes('vercel-cron/1.0')) return true;

  return false;
}

/* ------------------------------------------------------------------ */
/*  Topic pools per category — Groq picks & expands one               */
/* ------------------------------------------------------------------ */

const TOPIC_POOLS: Record<string, string[]> = {
  'market-analysis': [
    'Bitcoin price action analysis this week — key levels, volume, and what the charts say',
    'Altcoin market update — which sectors are showing strength vs weakness',
    'Crypto market correlation with S&P 500 and Nasdaq — are they decoupling?',
    'Stablecoin market cap as a leading indicator for crypto bull runs',
    'Bitcoin dominance trend analysis — what it means for altcoin season',
    'Ethereum gas fees trend — what low fees tell us about network activity',
    'Crypto liquidation data analysis — where are the leverage clusters?',
    'Bitcoin mining hash rate hits new high — bullish signal or not?',
    'Comparing this correction to previous BTC drawdowns historically',
    'On-chain metrics that suggest accumulation vs distribution phase',
    'Bitcoin vs Gold performance during macro uncertainty',
    'Weekly crypto market sentiment recap and outlook',
  ],
  'trading-strategies': [
    'How to use Bollinger Bands effectively in crypto trading',
    'The MACD crossover strategy — does it still work in 2026?',
    'Risk management 101 — position sizing and stop-loss placement',
    'Scalping vs swing trading — which is better for crypto?',
    'How to identify and trade chart patterns: head & shoulders, triangles, flags',
    'Using volume profile to find high-probability trade entries',
    'The 200-day moving average strategy — a simple system that works',
    'How to combine RSI and MACD for stronger trade signals',
    'Grid trading bots — do they actually make money?',
    'Fibonacci retracement levels — how to use them properly',
    'Trading journal template — why tracking your trades matters',
    'How to trade crypto during high-volatility news events',
  ],
  'defi-yield': [
    'Comparing lending protocols — Aave vs Compound vs Morpho in 2026',
    'Impermanent loss explained — when liquidity providing isn\'t worth it',
    'Best yield strategies during a bear market',
    'Liquid restaking tokens (LRTs) explained — EigenLayer and beyond',
    'How to evaluate DeFi protocol risk before depositing funds',
    'Stablecoin yield comparison — where to park idle capital safely',
    'The rise of intent-based DeFi protocols — what are they and why they matter',
    'Cross-chain bridging risks and best practices',
    'Pendle Finance explained — how fixed-rate yields work in DeFi',
    'Real yield vs token emission yield — how to tell the difference',
  ],
  'security-scams': [
    'How to set up a proper crypto security stack — wallets, 2FA, backups',
    'Common rug pull patterns and how to spot them before it\'s too late',
    'Approval phishing attacks — how they work and how to protect yourself',
    'Hardware wallet best practices — things most people get wrong',
    'How to read and verify smart contract code as a non-developer',
    'Social engineering attacks in crypto — Twitter DM scams, fake support',
    'Crypto tax scam emails to watch out for in 2026',
    'Why you should use a separate browser profile for DeFi',
    'Address poisoning attacks — what they are and how to avoid them',
    'How to safely revoke token approvals and why you should do it regularly',
  ],
  'education': [
    'Understanding crypto market cycles — accumulation, markup, distribution, markdown',
    'What is on-chain analysis and how beginners can use it',
    'Crypto order types explained — market, limit, stop-loss, OCO',
    'How blockchain actually works — a simple explanation',
    'Understanding tokenomics — supply, demand, inflation, and value',
    'What is MEV and why should you care as a trader?',
    'Layer 1 vs Layer 2 blockchains explained simply',
    'How to read a crypto whitepaper — what to look for',
    'Decentralized exchanges (DEXs) vs centralized exchanges (CEXs) — pros and cons',
    'What are governance tokens and how do they work?',
    'Understanding gas fees across different blockchains',
    'Crypto portfolio allocation strategies for different risk levels',
  ],
  'general': [
    'What crypto news sources do you trust? Share your reading list',
    'Predictions thread — where will BTC be by end of 2026?',
    'The future of crypto regulation — will it help or hurt adoption?',
    'AI and blockchain — promising projects at the intersection',
    'What got you into crypto? Share your origin story',
    'Underrated crypto tools and resources everyone should know about',
    'Best crypto Twitter/X accounts to follow for alpha',
    'Do you tell friends and family about your crypto investments?',
    'The environmental impact of crypto — has it improved?',
    'Crypto adoption in developing countries — real use cases',
    'What would you build if you could create any crypto product?',
    'Weekly unpopular opinion thread — share your contrarian takes',
  ],
};

/* ------------------------------------------------------------------ */
/*  Groq AI content generation                                         */
/* ------------------------------------------------------------------ */

async function generateForumPost(
  groq: Groq,
  category: string,
  topic: string
): Promise<{ title: string; body: string } | null> {
  try {
    const categoryDef = FORUM_CATEGORIES.find((c) => c.id === category);

    const completion = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [
        {
          role: 'system',
          content: `You are a knowledgeable crypto community member writing a forum post on CryptoReportKit's community forum.

Write in a conversational, authentic tone — like a real person sharing insights on a crypto forum. Use markdown-style formatting sparingly (bold with ** for emphasis, bullet points with -).

Rules:
- Write as if you're a real trader/analyst/enthusiast sharing your genuine perspective
- Include specific numbers, data points, or examples where relevant
- Ask a question at the end to encourage discussion
- Do NOT use emojis excessively (1-2 max)
- Do NOT say "I'm an AI" or break character
- Do NOT give direct financial advice — frame things as analysis and personal strategy
- Keep the body between 200-400 words
- The category is: ${categoryDef?.title || category}

Respond in EXACTLY this JSON format:
{"title": "Your compelling thread title here", "body": "Your detailed forum post body here"}`,
        },
        {
          role: 'user',
          content: `Write a forum post about: ${topic}

Make it feel like a real community discussion starter. Include specific details, data, or examples. The post should be educational and invite discussion.`,
        },
      ],
      max_tokens: 800,
      temperature: 0.8,
      response_format: { type: 'json_object' },
    });

    const content = completion.choices?.[0]?.message?.content;
    if (!content) return null;

    const parsed = JSON.parse(content);
    if (!parsed.title || !parsed.body) return null;

    // Validate lengths
    if (parsed.title.length < 10 || parsed.title.length > 200) return null;
    if (parsed.body.length < 100 || parsed.body.length > 10000) return null;

    return { title: parsed.title, body: parsed.body };
  } catch (error) {
    console.error('Groq generation error:', error);
    return null;
  }
}

/* ------------------------------------------------------------------ */
/*  Main handler                                                       */
/* ------------------------------------------------------------------ */

export async function GET(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (!supabaseAdmin) {
    return NextResponse.json({ error: 'Supabase admin not configured' }, { status: 503 });
  }

  const groqKey = process.env.GROQ_API_KEY;
  if (!groqKey) {
    return NextResponse.json({ error: 'GROQ_API_KEY not configured' }, { status: 503 });
  }

  const groq = new Groq({ apiKey: groqKey });

  try {
    // Get admin user ID
    const adminEmail = (process.env.NEXT_PUBLIC_ADMIN_EMAILS || '').split(',')[0]?.trim().toLowerCase();
    if (!adminEmail) {
      return NextResponse.json({ error: 'No admin email configured' }, { status: 500 });
    }

    const { data: authUsers, error: authError } = await supabaseAdmin.auth.admin.listUsers();
    if (authError || !authUsers) {
      return NextResponse.json({ error: 'Failed to look up admin user' }, { status: 500 });
    }

    const adminUser = authUsers.users.find((u) => u.email?.toLowerCase() === adminEmail);
    if (!adminUser) {
      return NextResponse.json({ error: 'Admin user not found' }, { status: 500 });
    }

    // Ensure admin has user_prediction_stats
    await (supabaseAdmin.from('user_prediction_stats') as any).upsert(
      { user_id: adminUser.id, display_name: 'CryptoReportKit', avatar_emoji: '🚀', is_verified: true },
      { onConflict: 'user_id' }
    );

    // Pick 2 random categories (different ones)
    const shuffled = [...FORUM_CATEGORIES].sort(() => Math.random() - 0.5);
    const selectedCategories = shuffled.slice(0, 2);

    const results: { category: string; title: string; threadId: string }[] = [];

    for (const cat of selectedCategories) {
      const topicPool = TOPIC_POOLS[cat.id];
      if (!topicPool || topicPool.length === 0) continue;

      // Pick a random topic
      const topic = topicPool[Math.floor(Math.random() * topicPool.length)];

      // Generate content with Groq
      const post = await generateForumPost(groq, cat.id, topic);
      if (!post) {
        console.error(`Failed to generate post for category ${cat.id}`);
        continue;
      }

      // Insert thread
      const { data: thread, error: insertError } = await (supabaseAdmin.from('forum_threads') as any)
        .insert({
          user_id: adminUser.id,
          category: cat.id,
          title: post.title,
          body: post.body,
          view_count: Math.floor(Math.random() * 50) + 10,
        })
        .select('id')
        .single();

      if (insertError) {
        console.error(`Error inserting thread for ${cat.id}:`, insertError);
        continue;
      }

      results.push({
        category: cat.id,
        title: post.title,
        threadId: thread.id,
      });
    }

    console.log(`[Forum Cron] Generated ${results.length} posts:`, results.map((r) => r.title));

    return NextResponse.json({
      success: true,
      generated: results.length,
      posts: results,
    });
  } catch (error) {
    console.error('[Forum Cron] Error:', error);
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}
