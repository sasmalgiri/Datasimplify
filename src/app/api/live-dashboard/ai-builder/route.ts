import { NextRequest, NextResponse } from 'next/server';
import Groq from 'groq-sdk';

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY || '',
});

// ---------------------------------------------------------------------------
// IP-based rate limiting (in-memory, resets per-IP every hour)
// ---------------------------------------------------------------------------
const RATE_LIMIT_WINDOW = 60 * 60 * 1000; // 1 hour
const MAX_QUERIES_PER_HOUR = 10;
const rateLimits = new Map<string, { count: number; resetAt: number }>();

function checkRateLimit(ip: string): { allowed: boolean; remaining: number } {
  const now = Date.now();
  const entry = rateLimits.get(ip);

  if (!entry || now > entry.resetAt) {
    rateLimits.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW });
    return { allowed: true, remaining: MAX_QUERIES_PER_HOUR - 1 };
  }

  if (entry.count >= MAX_QUERIES_PER_HOUR) {
    return { allowed: false, remaining: 0 };
  }

  entry.count++;
  return { allowed: true, remaining: MAX_QUERIES_PER_HOUR - entry.count };
}

function getClientIp(req: NextRequest): string {
  return (
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    req.headers.get('x-real-ip') ||
    '127.0.0.1'
  );
}

// ---------------------------------------------------------------------------
// System prompt — describes every widget, endpoint, and layout rules
// ---------------------------------------------------------------------------
const SYSTEM_PROMPT = `You are CRK Dashboard Architect, an AI that converts natural-language descriptions into structured dashboard configurations for CryptoReportKit.

Given a user description, return a JSON object with these fields:
- name (string): short dashboard title
- icon (string): single emoji representing the dashboard
- description (string): 1-2 sentence summary
- widgets (array): widget configuration objects
- requiredEndpoints (string[]): union of all widget dataEndpoints

Each widget object has:
- id (string): unique kebab-case identifier
- component (string): exact component name from the list below
- title (string): human-readable widget title
- gridColumn (string): 'span 2' for half-width, '1 / -1' for full-width
- dataEndpoints (string[]): data sources this widget needs
- props (object, optional): component-specific props
- mobileOrder (number): render order on mobile (1-based sequential)

Available widgets (component -> [endpoints] -> description -> optional props):
- KPICards [markets, global] — Market stats cards (props: mode='bitcoin' for single-coin focus)
- TopCoinsTable [markets] — Sortable table of top coins (props: limit=number)
- TreemapWidget [markets] — Market cap treemap visualization (props: limit=number)
- HeatmapWidget [categories] — Sector performance heatmap
- PieChartWidget [global] — Market dominance pie chart (props: mode='dominance')
- DominanceWidget [global] — BTC/ETH/alt dominance bars
- AreaChartWidget [markets] — Stacked area chart (props: mode='volume'|'marketcap', limit=number)
- WaterfallChartWidget [markets] — 24h change waterfall (props: limit=number)
- GainersLosersWidget [markets] — Top movers
- TrendingWidget [trending] — Currently trending coins
- BubbleChartWidget [markets] — Market cap vs performance bubbles (props: limit=number)
- FearGreedWidget [fear_greed] — Fear & Greed gauge
- RadarChartWidget [markets] — Multi-metric radar (props: coinIds=string[])
- VolumeChartWidget [markets] — Volume bar chart (props: limit=number)
- BoxPlotWidget [markets] — Price distribution box plots (props: limit=number, coinIds=string[])
- ReturnsBarWidget [markets] — Returns by timeframe (props: limit=number)
- SupplyWidget [markets] — Circulating vs max supply (props: limit=number)
- CorrelationWidget [markets] — Correlation matrix
- CoinCompareWidget [markets] — Side-by-side coin comparison (props: coinIds=string[], e.g. ['bitcoin','ethereum'])
- CandlestickChartWidget [ohlc] — OHLC candlestick (props: coinId=string, days=number)
- HistoricalPriceWidget [coin_history] — Historical price line (props: coinId=string, days=number)
- PriceChartWidget [ohlc] — Simple price line (props: coinId=string, days=number)
- MarketCapTimelineWidget [ohlc] — Market cap over time (props: coinId=string, days=number)
- FundingRateWidget [derivatives] — Funding rates
- OpenInterestWidget [derivatives_exchanges] — Open interest
- DefiTVLRankingWidget [defillama_protocols] — DeFi TVL ranking table
- DefiTVLChartWidget [defillama_protocols] — TVL bar chart
- DefiChainTVLWidget [defillama_chains] — Chain TVL comparison
- DefiYieldTableWidget [defillama_yields] — Yield farming table
- StablecoinDominanceWidget [defillama_stablecoins] — Stablecoin market share
- ProtocolInfoWidget [defillama_protocol_tvl] — Protocol details card (props: protocolSlug=string)
- ProtocolTVLHistoryWidget [defillama_protocol_tvl] — Protocol TVL history (props: protocolSlug=string)
- ProtocolChainBreakdownWidget [defillama_protocol_tvl] — TVL by chain pie (props: protocolSlug=string)
- DexVolumeOverviewWidget [defillama_dex_overview] — DEX volume rankings
- ProtocolFeesWidget [defillama_fees_overview] — Protocol fees table
- TopProtocolsCompareWidget [defillama_protocols] — Multi-protocol comparison
- PerformanceHeatmapWidget [markets] — Multi-timeframe performance heatmap (props: limit=number)
- MiniSparklineGrid [markets] — Sparkline grid (props: limit=number)
- AltseasonWidget [markets, global] — Altseason gauge (props: topN=number)
- WatchlistWidget [markets] — Personal watchlist
- CategoryBadgesWidget [categories] — Category badges
- CategoryBarWidget [categories] — Category bar chart (props: limit=number)

Layout rules:
- Use gridColumn 'span 2' for half-width widgets (two per row on desktop)
- Use gridColumn '1 / -1' for full-width widgets (tables, heatmaps, large charts)
- Aim for 6-15 widgets per dashboard — enough to be useful, not overwhelming
- Start with KPICards at full-width as the first widget when market/global data is used
- Place tables (TopCoinsTable, etc.) at full-width near the bottom
- requiredEndpoints MUST be the union of ALL unique dataEndpoints from every widget

IMPORTANT: Return ONLY valid JSON. No markdown fences, no explanation, no extra text.`;

// ---------------------------------------------------------------------------
// POST /api/live-dashboard/ai-builder
// ---------------------------------------------------------------------------
export async function POST(request: NextRequest) {
  try {
    const ip = getClientIp(request);

    // --- Rate limit check ---------------------------------------------------
    const { allowed, remaining } = checkRateLimit(ip);
    if (!allowed) {
      return NextResponse.json(
        { error: 'Rate limit exceeded. Maximum 10 dashboard generations per hour.' },
        { status: 429 }
      );
    }

    // --- Parse & validate body ----------------------------------------------
    const body = await request.json();
    const { description } = body as { description?: string };

    if (!description || typeof description !== 'string' || description.trim() === '') {
      return NextResponse.json(
        { error: 'Missing or empty "description" field.' },
        { status: 400 }
      );
    }

    // --- Call Groq -----------------------------------------------------------
    const chatCompletion = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      temperature: 0.2,
      max_tokens: 2000,
      messages: [
        {
          role: 'system',
          content: SYSTEM_PROMPT,
        },
        {
          role: 'user',
          content: description.trim(),
        },
      ],
    });

    const rawResponse =
      chatCompletion.choices?.[0]?.message?.content || '';

    // --- Parse JSON response ------------------------------------------------
    // Strip potential markdown code fences the model may add
    const cleaned = rawResponse
      .replace(/^```(?:json)?\s*/i, '')
      .replace(/\s*```$/i, '')
      .trim();

    let parsed: {
      name: string;
      icon: string;
      description: string;
      widgets: Array<{
        id: string;
        component: string;
        title: string;
        gridColumn: string;
        dataEndpoints: string[];
        props?: Record<string, any>;
        mobileOrder?: number;
      }>;
      requiredEndpoints: string[];
    };

    try {
      parsed = JSON.parse(cleaned);
    } catch {
      console.error('[ai-builder] Failed to parse AI response:', rawResponse);
      return NextResponse.json(
        { error: 'AI returned invalid JSON. Please try a more specific description.' },
        { status: 500 }
      );
    }

    // --- Validate required fields -------------------------------------------
    if (
      !parsed.name ||
      !parsed.widgets ||
      !Array.isArray(parsed.widgets) ||
      parsed.widgets.length === 0 ||
      !parsed.requiredEndpoints ||
      !Array.isArray(parsed.requiredEndpoints)
    ) {
      console.error('[ai-builder] Incomplete AI response:', parsed);
      return NextResponse.json(
        { error: 'AI returned an incomplete dashboard configuration. Please try again.' },
        { status: 500 }
      );
    }

    // --- Ensure requiredEndpoints is the union of all widget dataEndpoints ---
    const allEndpoints = new Set<string>();
    for (const w of parsed.widgets) {
      if (w.dataEndpoints && Array.isArray(w.dataEndpoints)) {
        w.dataEndpoints.forEach((ep) => allEndpoints.add(ep));
      }
    }
    parsed.requiredEndpoints = Array.from(allEndpoints);

    // --- Ensure mobileOrder is set sequentially if missing -------------------
    parsed.widgets.forEach((w, i) => {
      if (!w.mobileOrder) w.mobileOrder = i + 1;
    });

    return NextResponse.json({
      name: parsed.name,
      icon: parsed.icon || '🤖',
      description: parsed.description || '',
      widgets: parsed.widgets,
      requiredEndpoints: parsed.requiredEndpoints,
      remainingGenerations: remaining,
    });
  } catch (error: unknown) {
    console.error('[ai-builder] Error:', error);
    const message =
      error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
