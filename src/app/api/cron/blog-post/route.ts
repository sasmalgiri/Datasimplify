/**
 * Cron: Auto-generate blog posts using Groq AI
 * Schedule: Every day at 6:00 and 18:00 UTC (2 posts/day)
 *
 * Generates 1 structured blog post per run in a rotating category.
 */

import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import Groq from 'groq-sdk';
import { supabaseAdmin } from '@/lib/supabase';
import { BLOG_CATEGORIES, type BlogCategory } from '@/lib/blog/blogCategories';
import { getAllSlugs } from '@/lib/blog/posts';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

/* ------------------------------------------------------------------ */
/*  Auth (same pattern as forum-post cron)                             */
/* ------------------------------------------------------------------ */

function isAuthorized(request: NextRequest): boolean {
  const ua = request.headers.get('user-agent') || '';
  if (ua.includes('vercel-cron')) return true;

  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) return false;
  const authHeader = request.headers.get('authorization');
  return authHeader === `Bearer ${cronSecret}`;
}

/* ------------------------------------------------------------------ */
/*  Topic pools per category                                           */
/* ------------------------------------------------------------------ */

const TOPIC_POOLS: Record<string, string[]> = {
  'market-analysis': [
    'Bitcoin weekly price action and key support/resistance levels analysis',
    'Ethereum vs Bitcoin performance comparison and what the divergence means',
    'Altcoin season indicators and which sectors are rotating',
    'Crypto market correlation with traditional markets this week',
    'On-chain accumulation signals and whale wallet movements',
    'Bitcoin dominance trend and implications for altcoin portfolios',
    'Stablecoin market cap as a leading indicator for crypto flows',
    'Comparing this market cycle to previous BTC cycles with data',
    'Volume analysis across major exchanges and what it reveals',
    'RSI, MACD, and moving average confluence signals for top coins',
  ],
  'defi-yield': [
    'Comparing top lending protocol yields across Aave, Compound, and Morpho',
    'Stablecoin yield farming strategies and risk assessment for current rates',
    'Liquid staking tokens compared: stETH, rETH, cbETH yields and risks',
    'Impermanent loss deep dive with real pool examples and when to avoid LPing',
    'Real yield vs emission yield: how to identify sustainable DeFi returns',
    'Cross-chain DeFi yield opportunities and bridging risks to consider',
    'Restaking protocols explained and their yield mechanics',
    'DEX liquidity pool analysis: which pools offer best risk-adjusted returns',
    'DeFi insurance protocols and how to protect your yield positions',
    'Treasury yield vs DeFi yield: when does on-chain outperform TradFi?',
  ],
  education: [
    'How to read a crypto candlestick chart for absolute beginners',
    'Understanding market cap, fully diluted valuation, and why it matters',
    'Crypto wallet types explained: hot wallets, cold wallets, and custodial solutions',
    'What is dollar-cost averaging and how to set it up for Bitcoin',
    'Understanding blockchain gas fees across Ethereum, Solana, and L2s',
    'How crypto order types work: market, limit, stop-loss, and OCO orders',
    'Portfolio diversification in crypto: how many coins should you hold?',
    'What is a DEX and how to safely swap tokens on decentralized exchanges',
    'Understanding crypto market cycles: accumulation, markup, distribution, markdown',
    'How to evaluate a crypto project: tokenomics, team, TVL, and red flags',
  ],
  'news-regulation': [
    'Latest crypto regulatory developments in the US and what they mean for traders',
    'EU MiCA regulation implementation progress and impact on crypto exchanges',
    'Institutional crypto adoption trends and major fund allocations this quarter',
    'Crypto ETF landscape update: approvals, flows, and market impact',
    'Stablecoin regulation developments worldwide and issuer compliance',
    'Central Bank Digital Currency (CBDC) progress and implications for crypto',
    'Crypto tax reporting changes and what traders need to prepare for',
    'Major exchange regulatory actions and what they signal for the industry',
    'Cross-border crypto payment regulations and emerging frameworks',
    'Crypto self-custody rights: legislation updates and what is at stake',
  ],
};

/* ------------------------------------------------------------------ */
/*  Slug generation                                                    */
/* ------------------------------------------------------------------ */

function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 80);
}

async function ensureUniqueSlug(baseSlug: string): Promise<string> {
  const staticSlugs = new Set(getAllSlugs());
  let slug = baseSlug;

  for (let attempt = 0; attempt < 20; attempt++) {
    const isStaticDuplicate = staticSlugs.has(slug);
    const { data: existing, error } = await (supabaseAdmin!.from('blog_posts') as any)
      .select('id')
      .eq('slug', slug)
      .maybeSingle();

    if (error) {
      throw error;
    }

    if (!isStaticDuplicate && !existing) {
      return slug;
    }

    slug = `${baseSlug}-${attempt + 1}`.slice(0, 80);
  }

  return `${baseSlug}-${Date.now()}`.slice(0, 80);
}

/* ------------------------------------------------------------------ */
/*  Groq AI content generation                                         */
/* ------------------------------------------------------------------ */

interface GeneratedBlogPost {
  title: string;
  description: string;
  keywords: string[];
  excerpt: string;
  coverEmoji: string;
  readingTimeMinutes: number;
  sections: Array<{
    id: string;
    heading: string;
    body: string[];
    bullets?: string[];
    note?: string;
  }>;
}

async function generateBlogPost(
  groq: Groq,
  category: BlogCategory,
  topic: string,
): Promise<GeneratedBlogPost | null> {
  try {
    const today = new Date().toISOString().split('T')[0];

    const completion = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [
        {
          role: 'system',
          content: `You are a senior crypto analyst writing a long-form blog post for CryptoReportKit, a crypto data and analytics platform.

Write an educational, SEO-optimized blog post. The tone should be professional but accessible.

The category is: ${category.title}
Today's date: ${today}

Rules:
- Generate 3-5 sections. Each section has a heading, 2-3 body paragraphs, optional bullet points (3-6 items), and an optional note.
- The title should be SEO-optimized, specific, and under 80 characters.
- The description should be a compelling meta description (140-160 characters).
- Generate 5-7 SEO keywords as an array.
- The excerpt should be 1-2 sentences summarizing the article (under 200 chars).
- Pick a single relevant emoji for coverEmoji.
- Estimate readingTimeMinutes based on content length (typically 5-8).
- Each section.id should be a kebab-case slug of the heading.
- Include specific data, numbers, and examples where possible.
- Do NOT give direct financial advice.
- Do NOT mention being AI-generated.
- Reference CryptoReportKit tools where natural (DataLab, Live Dashboards, Sentiment, etc.).

Respond in EXACTLY this JSON format:
{
  "title": "...",
  "description": "...",
  "keywords": ["...", "..."],
  "excerpt": "...",
  "coverEmoji": "...",
  "readingTimeMinutes": 6,
  "sections": [
    {
      "id": "section-slug",
      "heading": "Section Title",
      "body": ["paragraph 1", "paragraph 2"],
      "bullets": ["bullet 1", "bullet 2"],
      "note": "Optional note text"
    }
  ]
}`,
        },
        {
          role: 'user',
          content: `Write a blog post about: ${topic}

Make it data-driven, educational, and actionable. Include specific numbers and examples. The post should provide genuine value to someone researching this topic.`,
        },
      ],
      max_tokens: 3000,
      temperature: 0.7,
      response_format: { type: 'json_object' },
    });

    const content = completion.choices?.[0]?.message?.content;
    if (!content) return null;

    const parsed = JSON.parse(content) as GeneratedBlogPost;

    // Validate structure
    if (!parsed.title || parsed.title.length < 10 || parsed.title.length > 120) return null;
    if (!parsed.description || parsed.description.length < 50) return null;
    if (!parsed.sections || parsed.sections.length < 2 || parsed.sections.length > 7) return null;
    if (!parsed.keywords || parsed.keywords.length < 3) return null;
    if (!parsed.excerpt || parsed.excerpt.length < 20) return null;

    return parsed;
  } catch (error) {
    console.error('[Blog Cron] Groq generation error:', error);
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
    // Pick a random category
    const category = BLOG_CATEGORIES[Math.floor(Math.random() * BLOG_CATEGORIES.length)];
    const topicPool = TOPIC_POOLS[category.id];
    if (!topicPool || topicPool.length === 0) {
      return NextResponse.json({ error: `No topics for category ${category.id}` }, { status: 500 });
    }

    // Pick a random topic
    const topic = topicPool[Math.floor(Math.random() * topicPool.length)];

    // Generate content with Groq
    const post = await generateBlogPost(groq, category, topic);
    if (!post) {
      return NextResponse.json({ error: 'Failed to generate blog post' }, { status: 500 });
    }

    // Generate slug and ensure it is unique across static + DB posts
    const slug = await ensureUniqueSlug(generateSlug(post.title));

    // Insert into DB
    const { data: inserted, error: insertError } = await (
      supabaseAdmin.from('blog_posts') as any
    )
      .insert({
        slug,
        title: post.title,
        description: post.description,
        keywords: post.keywords,
        publish_date: new Date().toISOString().split('T')[0],
        author: 'CryptoReportKit Team',
        category: category.title,
        reading_time_minutes: post.readingTimeMinutes || 6,
        cover_emoji: post.coverEmoji || category.coverEmoji,
        excerpt: post.excerpt,
        sections: post.sections,
        related_posts: [],
        cta_href: category.ctaHref,
        cta_label: category.ctaLabel,
        is_published: true,
      })
      .select('id, slug, title')
      .single();

    if (insertError) {
      console.error('[Blog Cron] Insert error:', insertError);

      if (
        typeof insertError.message === 'string' &&
        (insertError.message.includes('relation "blog_posts" does not exist') ||
          insertError.message.includes("Could not find the table 'public.blog_posts'"))
      ) {
        return NextResponse.json(
          {
            error: 'blog_posts table is missing. Run supabase/migrations/20260304_blog_posts.sql in Supabase first.',
          },
          { status: 500 },
        );
      }

      return NextResponse.json({ error: insertError.message }, { status: 500 });
    }

    // Revalidate blog pages so new post appears immediately
    revalidatePath('/blog');
    revalidatePath(`/blog/${slug}`);

    console.log(
      `[Blog Cron] Generated: "${post.title}" (${category.id}) -> /blog/${slug}`,
    );

    return NextResponse.json({
      success: true,
      post: {
        id: inserted.id,
        slug: inserted.slug,
        title: inserted.title,
        category: category.id,
      },
    });
  } catch (error) {
    console.error('[Blog Cron] Error:', error);
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}
