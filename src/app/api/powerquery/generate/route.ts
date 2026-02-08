/**
 * Power Query Excel Template Generator API
 *
 * Generates comprehensive styled Excel files with charts, formatting,
 * and all popular cryptocurrency dashboards.
 *
 * Usage:
 * POST /api/powerquery/generate
 * Body: { dashboard: "complete-suite", apiKey: "...", coins: [...], limit: 100 }
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  generateMasterExcel,
  DashboardType,
  OutputMode,
  RefreshInterval,
  ChartStyle,
} from '@/lib/excel/masterGenerator';

// Valid output modes
const VALID_OUTPUT_MODES: OutputMode[] = ['static', 'live', 'interactive'];
const VALID_REFRESH_INTERVALS: RefreshInterval[] = ['realtime', 'frequent', 'hourly', 'daily', 'manual'];
const VALID_CHART_STYLES: ChartStyle[] = ['minimal', 'professional', 'colorful'];

// All available dashboard types
const VALID_DASHBOARDS: DashboardType[] = [
  'complete-suite',
  'market-overview',
  'portfolio-tracker',
  'technical-analysis',
  'fear-greed',
  'gainers-losers',
  'trending',
  'defi-dashboard',
  'nft-tracker',
  'derivatives',
  'whale-tracker',
  'on-chain',
  'correlation',
  'heatmap',
  'screener',
  'etf-tracker',
  'stablecoins',
  'exchanges',
  'categories',
  'bitcoin-dashboard',
  'ethereum-dashboard',
  'layer1-compare',
  'layer2-compare',
  'meme-coins',
  'ai-gaming',
  'calculator',
  'volatility',
  'rwa',
  'liquidations',
  'funding-rates',
  'altcoin-season',
  'token-unlocks',
  'staking-yields',
  'social-sentiment',
  'dev-activity',
  'exchange-reserves',
  'defi-yields',
  'metaverse',
  'privacy-coins',
  'mining-calc',
  'custom',
];

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      dashboard = 'complete-suite',
      apiKey,
      coins,
      limit = 100,
      days = 30,
      includeCharts = true,
      outputMode = 'live',
      refreshInterval = 'hourly',
      chartStyle = 'professional',
    } = body;

    // Validate dashboard type
    if (!VALID_DASHBOARDS.includes(dashboard)) {
      return NextResponse.json({
        error: `Invalid dashboard type. Valid options: ${VALID_DASHBOARDS.join(', ')}`,
      }, { status: 400 });
    }

    // Validate output mode
    const validatedOutputMode = VALID_OUTPUT_MODES.includes(outputMode) ? outputMode : 'live';
    const validatedRefreshInterval = VALID_REFRESH_INTERVALS.includes(refreshInterval) ? refreshInterval : 'hourly';
    const validatedChartStyle = VALID_CHART_STYLES.includes(chartStyle) ? chartStyle : 'professional';

    // Generate the Excel file
    const buffer = await generateMasterExcel({
      dashboard,
      apiKey,
      coins,
      limit: Math.min(limit, 250), // Cap at 250
      days: Math.min(days, 365),   // Cap at 1 year
      includeCharts,
      outputMode: validatedOutputMode,
      refreshInterval: validatedRefreshInterval,
      chartStyle: validatedChartStyle,
    });

    // Create filename
    const timestamp = new Date().toISOString().split('T')[0];
    const filename = `CryptoReportKit_${dashboard}_${timestamp}.xlsx`;

    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'no-cache',
      },
    });
  } catch (error) {
    console.error('[Generate API] Error:', error);
    return NextResponse.json({
      error: 'Failed to generate Excel template',
      details: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
}

// GET endpoint for info
export async function GET() {
  return NextResponse.json({
    name: 'CryptoReportKit Excel Generator',
    version: '2.0.0',
    dashboards: VALID_DASHBOARDS.map(d => ({
      id: d,
      name: d.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
      description: getDashboardDescription(d),
    })),
    usage: {
      method: 'POST',
      body: {
        dashboard: 'complete-suite | market-overview | portfolio-tracker | ...',
        apiKey: '(optional) Your CoinGecko API key',
        coins: '(optional) ["bitcoin", "ethereum", ...] for custom selections',
        limit: '(optional) Number of coins (default: 100, max: 250)',
        days: '(optional) Days of historical data (default: 30, max: 365)',
        outputMode: '(optional) static | live | interactive (default: live)',
        refreshInterval: '(optional) realtime | frequent | hourly | daily | manual (default: hourly)',
        chartStyle: '(optional) minimal | professional | colorful (default: professional)',
      },
    },
    outputModes: {
      static: 'Beautiful snapshot with embedded charts - for sharing and presentations',
      live: 'Auto-refreshing data with Power Query - for daily analysis',
      interactive: 'Full CRK Add-in experience with real-time charts - for trading',
    },
    refreshIntervals: {
      realtime: '5 minutes',
      frequent: '15 minutes',
      hourly: '60 minutes',
      daily: '24 hours',
      manual: 'Only when you click Refresh',
    },
  });
}

function getDashboardDescription(dashboard: DashboardType): string {
  const descriptions: Record<DashboardType, string> = {
    'complete-suite': 'Everything in one file - all 40 dashboards included',
    'market-overview': 'Global stats, top coins, and market charts',
    'portfolio-tracker': 'Track your holdings with P/L calculations',
    'technical-analysis': 'OHLC data and price indicators',
    'fear-greed': 'Crypto Fear & Greed Index history',
    'gainers-losers': 'Top 25 gainers and losers (24h)',
    'trending': 'Currently trending cryptocurrencies',
    'defi-dashboard': 'DeFi protocols and TVL metrics',
    'nft-tracker': 'NFT collections overview',
    'derivatives': 'Futures and derivatives market data',
    'whale-tracker': 'Large transaction monitoring',
    'on-chain': 'Blockchain analytics and metrics',
    'correlation': 'Asset correlation matrix',
    'heatmap': 'Visual market heatmap by 24h change',
    'screener': 'Full coin screener with filters',
    'etf-tracker': 'Bitcoin and crypto ETF tracking',
    'stablecoins': 'Stablecoin market and peg monitoring',
    'exchanges': 'Exchange volumes and trust scores',
    'categories': 'Crypto sectors and categories',
    'bitcoin-dashboard': 'Complete BTC analysis with halving and dominance',
    'ethereum-dashboard': 'ETH ecosystem with DeFi stats and gas tracker',
    'layer1-compare': 'Compare top L1 blockchains side-by-side',
    'layer2-compare': 'L2 scaling solutions comparison',
    'meme-coins': 'Popular meme token tracker',
    'ai-gaming': 'AI and gaming crypto tokens analysis',
    'calculator': 'DCA, profit, and price target calculators',
    'volatility': 'Price volatility and risk analysis',
    'rwa': 'Real World Assets tokenization tracker',
    'liquidations': 'Liquidation zones and leverage risk tracker',
    'funding-rates': 'Perpetual futures funding rates analysis',
    'altcoin-season': 'Altcoin vs Bitcoin season index',
    'token-unlocks': 'Upcoming token unlock schedules',
    'staking-yields': 'PoS staking yields comparison',
    'social-sentiment': 'Social media sentiment analysis',
    'dev-activity': 'Developer and GitHub activity metrics',
    'exchange-reserves': 'Crypto held on exchanges tracker',
    'defi-yields': 'DeFi yield farming opportunities',
    'metaverse': 'Metaverse and virtual world tokens',
    'privacy-coins': 'Privacy-focused cryptocurrencies',
    'mining-calc': 'Mining profitability calculator',
    'custom': 'Custom watchlist with your selected coins',
  };
  return descriptions[dashboard] || 'Custom dashboard';
}
