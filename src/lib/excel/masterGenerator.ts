/**
 * Master Excel Generator
 *
 * Comprehensive Excel generation matching all website features.
 * Creates professional dashboards with styled formatting and charts.
 */

import ExcelJS from 'exceljs';
import {
  addBitcoinDashboard,
  addEthereumDashboard,
  addLayer1Comparison,
  addLayer2Comparison,
  addMemeCoins,
  addAIGamingTokens,
  addInvestmentCalculator,
  addVolatilityAnalysis,
  addLiquidationsDashboard,
  addFundingRatesDashboard,
  addAltcoinSeasonDashboard,
  addTokenUnlocksDashboard,
  addStakingYieldsDashboard,
  addSocialSentimentDashboard,
  addDeveloperActivityDashboard,
  addExchangeReservesDashboard,
  addDeFiYieldsDashboard,
  addMetaverseTokensDashboard,
  addPrivacyCoinsDashboard,
  addMiningCalculatorDashboard,
} from './popularDashboards';
import {
  addPowerQuerySetupSheet,
  generateQueriesForDashboard,
  REFRESH_PRESETS,
} from './powerQueryTemplates';
import { injectPowerQueries } from './powerQueryInjector';
import { addCrkDashboardSheets } from './crkDashboardSheets';
import {
  createAdvancedSparkline,
  createDashboardCard,
  createGaugeMeter,
  CHART_PALETTES,
} from './chartRenderer';

// ============================================
// TYPES & INTERFACES
// ============================================

export type DashboardType =
  | 'complete-suite'        // Everything in one file
  | 'market-overview'       // Global stats + top coins
  | 'portfolio-tracker'     // Holdings with P/L tracking
  | 'technical-analysis'    // OHLC, indicators
  | 'fear-greed'           // Sentiment index
  | 'gainers-losers'       // Top movers
  | 'trending'             // Trending coins
  | 'defi-dashboard'       // DeFi protocols + TVL
  | 'nft-tracker'          // NFT collections
  | 'derivatives'          // Futures & options
  | 'whale-tracker'        // Large transactions
  | 'on-chain'             // Blockchain metrics
  | 'correlation'          // Asset correlations
  | 'heatmap'              // Market heatmap
  | 'screener'             // Coin screener
  | 'etf-tracker'          // Bitcoin/Crypto ETFs
  | 'stablecoins'          // Stablecoin metrics
  | 'exchanges'            // Exchange volumes
  | 'categories'           // Sector breakdown
  | 'bitcoin-dashboard'    // Bitcoin-specific analysis
  | 'ethereum-dashboard'   // Ethereum ecosystem
  | 'layer1-compare'       // L1 blockchain comparison
  | 'layer2-compare'       // L2 solutions comparison
  | 'meme-coins'           // Meme token tracker
  | 'ai-gaming'            // AI & Gaming tokens
  | 'calculator'           // Investment calculators
  | 'volatility'           // Volatility analysis
  | 'rwa'                  // Real World Assets
  | 'liquidations'         // Liquidation zones tracker
  | 'funding-rates'        // Perpetual funding rates
  | 'altcoin-season'       // Altcoin season index
  | 'token-unlocks'        // Token unlock schedules
  | 'staking-yields'       // PoS staking yields
  | 'social-sentiment'     // Social media sentiment
  | 'dev-activity'         // Developer/GitHub activity
  | 'exchange-reserves'    // Exchange reserve tracking
  | 'defi-yields'          // DeFi yield farming
  | 'metaverse'            // Metaverse tokens
  | 'privacy-coins'        // Privacy-focused coins
  | 'mining-calc'          // Mining profitability
  | 'custom';              // User-defined

export type OutputMode = 'static' | 'live' | 'interactive';
export type RefreshInterval = 'realtime' | 'frequent' | 'hourly' | 'daily' | 'manual';
export type ChartStyle = 'minimal' | 'professional' | 'colorful';

export interface GenerateOptions {
  dashboard: DashboardType;
  apiKey?: string;
  coins?: string[];
  limit?: number;
  days?: number;
  includeCharts?: boolean;
  // New options for enhanced output
  outputMode?: OutputMode;
  refreshInterval?: RefreshInterval;
  chartStyle?: ChartStyle;
}

// ============================================
// COLOR PALETTE (Matches Website)
// ============================================

export const COLORS = {
  // Brand colors
  primary: 'FF059669',       // Emerald-600
  primaryLight: 'FF10B981',  // Emerald-500
  primaryDark: 'FF047857',   // Emerald-700

  // Status colors
  success: 'FF22C55E',       // Green-500
  successLight: 'FF86EFAC',  // Green-300
  danger: 'FFEF4444',        // Red-500
  dangerLight: 'FFFCA5A5',   // Red-300
  warning: 'FFF59E0B',       // Amber-500
  warningLight: 'FFFCD34D',  // Amber-300
  info: 'FF3B82F6',          // Blue-500

  // Neutral colors
  dark: 'FF111827',          // Gray-900
  darkAlt: 'FF1F2937',       // Gray-800
  medium: 'FF374151',        // Gray-700
  mediumLight: 'FF4B5563',   // Gray-600
  light: 'FF6B7280',         // Gray-500
  lighter: 'FF9CA3AF',       // Gray-400
  pale: 'FFD1D5DB',          // Gray-300
  paleLight: 'FFE5E7EB',     // Gray-200
  surface: 'FFF3F4F6',       // Gray-100
  white: 'FFFFFFFF',
  black: 'FF000000',

  // Special colors
  bitcoin: 'FFF7931A',       // BTC Orange
  ethereum: 'FF627EEA',      // ETH Blue
  purple: 'FF8B5CF6',        // Purple-500
  pink: 'FFEC4899',          // Pink-500
  cyan: 'FF06B6D4',          // Cyan-500
};

// ============================================
// STYLE PRESETS
// ============================================

const STYLES = {
  header: {
    font: { bold: true, size: 18, color: { argb: COLORS.white } },
    fill: { type: 'pattern' as const, pattern: 'solid' as const, fgColor: { argb: COLORS.primary } },
    alignment: { horizontal: 'center' as const, vertical: 'middle' as const },
  },
  subheader: {
    font: { bold: true, size: 14, color: { argb: COLORS.primary } },
  },
  columnHeader: {
    font: { bold: true, color: { argb: COLORS.white } },
    fill: { type: 'pattern' as const, pattern: 'solid' as const, fgColor: { argb: COLORS.darkAlt } },
    alignment: { horizontal: 'center' as const },
  },
  zebraEven: {
    fill: { type: 'pattern' as const, pattern: 'solid' as const, fgColor: { argb: COLORS.surface } },
  },
  gain: {
    font: { color: { argb: COLORS.success } },
  },
  loss: {
    font: { color: { argb: COLORS.danger } },
  },
  highlight: {
    fill: { type: 'pattern' as const, pattern: 'solid' as const, fgColor: { argb: 'FFFFF3CD' } },
    border: {
      top: { style: 'thin' as const },
      bottom: { style: 'thin' as const },
      left: { style: 'thin' as const },
      right: { style: 'thin' as const },
    },
  },
};

// ============================================
// DASHBOARD CATEGORY THEMES (OtherLevel-Style)
// ============================================

// Each dashboard category has its own visual identity
export type DashboardCategory =
  | 'executive'      // Gold/cream - overview dashboards
  | 'trading'        // Cyan/dark - trading & technical
  | 'analytics'      // Purple/dark - research & analysis
  | 'ecosystem'      // Midnight blue - category trackers
  | 'rankings'       // Sunset orange - comparisons & rankings
  | 'asset'          // Crypto colors - asset-specific
  | 'tools'          // Dark emerald - calculators & tools
  | 'institutional'  // Executive red - exchanges & ETFs
  | 'yield';         // Finance teal - yields & income

// Map each dashboard type to its category
export const DASHBOARD_CATEGORIES: Record<DashboardType, DashboardCategory> = {
  // Executive/Overview - Gold & Cream (Premium look)
  'complete-suite': 'executive',
  'market-overview': 'executive',
  'portfolio-tracker': 'executive',
  'heatmap': 'executive',

  // Trading/Technical - Cyan & Dark Blue (Professional trading)
  'technical-analysis': 'trading',
  'derivatives': 'trading',
  'liquidations': 'trading',
  'funding-rates': 'trading',
  'volatility': 'trading',
  'screener': 'trading',

  // Analytics/Research - Purple & Dark (Deep analysis)
  'fear-greed': 'analytics',
  'correlation': 'analytics',
  'on-chain': 'analytics',
  'social-sentiment': 'analytics',
  'dev-activity': 'analytics',
  'altcoin-season': 'analytics',

  // Ecosystem Trackers - Midnight Blue (Category focus)
  'defi-dashboard': 'ecosystem',
  'nft-tracker': 'ecosystem',
  'stablecoins': 'ecosystem',
  'rwa': 'ecosystem',
  'metaverse': 'ecosystem',
  'privacy-coins': 'ecosystem',
  'categories': 'ecosystem',

  // Rankings/Comparisons - Sunset Orange (Competitive)
  'gainers-losers': 'rankings',
  'trending': 'rankings',
  'layer1-compare': 'rankings',
  'layer2-compare': 'rankings',

  // Asset-Specific - Crypto Brand Colors
  'bitcoin-dashboard': 'asset',
  'ethereum-dashboard': 'asset',
  'meme-coins': 'asset',
  'ai-gaming': 'asset',

  // Tools/Calculators - Dark Emerald (Utility)
  'calculator': 'tools',
  'mining-calc': 'tools',
  'custom': 'tools',

  // Institutional - Executive Red (Professional)
  'exchanges': 'institutional',
  'etf-tracker': 'institutional',
  'exchange-reserves': 'institutional',
  'whale-tracker': 'institutional',

  // Yield/Income - Finance Teal (Money focus)
  'staking-yields': 'yield',
  'defi-yields': 'yield',
  'token-unlocks': 'yield',
};

// Theme colors for each category
export const CATEGORY_THEMES: Record<DashboardCategory, {
  name: string;
  bg: string;
  headerBg: string;
  headerText: string;
  cardBg: string;
  accent: string;
  text: string;
  muted: string;
  border: string;
  success: string;
  danger: string;
  kpiBg: string;
  palette: string[];
}> = {
  executive: {
    name: 'Executive Gold',
    bg: 'FF171717',
    headerBg: 'FFC9A470',
    headerText: 'FF171717',
    cardBg: 'FF1F1F1F',
    accent: 'FFC9A470',
    text: 'FFFFDDDF',
    muted: 'FF8B7355',
    border: 'FF2A2A2A',
    success: 'FF22C55E',
    danger: 'FFEF4444',
    kpiBg: 'FF1F1F1F',
    palette: ['#C9A470', '#FFDDDF', '#8B7355', '#D4B896', '#F5E6D3'],
  },
  trading: {
    name: 'Trading Pro',
    bg: 'FF0A192F',
    headerBg: 'FF64FFDA',
    headerText: 'FF0A192F',
    cardBg: 'FF112240',
    accent: 'FF64FFDA',
    text: 'FFCCD6F6',
    muted: 'FF8892B0',
    border: 'FF233554',
    success: 'FF22C55E',
    danger: 'FFEF4444',
    kpiBg: 'FF112240',
    palette: ['#64FFDA', '#00D395', '#0EA5E9', '#38BDF8', '#7DD3FC'],
  },
  analytics: {
    name: 'Analytics Purple',
    bg: 'FF1A1A2E',
    headerBg: 'FF8B5CF6',
    headerText: 'FFFFFFFF',
    cardBg: 'FF0F3460',
    accent: 'FF8B5CF6',
    text: 'FFEAEAEA',
    muted: 'FF7F8C8D',
    border: 'FF533483',
    success: 'FF22C55E',
    danger: 'FFEF4444',
    kpiBg: 'FF16213E',
    palette: ['#8B5CF6', '#A78BFA', '#C4B5FD', '#6366F1', '#818CF8'],
  },
  ecosystem: {
    name: 'Ecosystem Blue',
    bg: 'FF0F172A',
    headerBg: 'FF3B82F6',
    headerText: 'FFFFFFFF',
    cardBg: 'FF1E293B',
    accent: 'FF3B82F6',
    text: 'FFF1F5F9',
    muted: 'FF94A3B8',
    border: 'FF334155',
    success: 'FF22C55E',
    danger: 'FFEF4444',
    kpiBg: 'FF1E293B',
    palette: ['#3B82F6', '#60A5FA', '#93C5FD', '#2563EB', '#1D4ED8'],
  },
  rankings: {
    name: 'Rankings Sunset',
    bg: 'FF1C1917',
    headerBg: 'FFF97316',
    headerText: 'FF1C1917',
    cardBg: 'FF292524',
    accent: 'FFF97316',
    text: 'FFF5F5F4',
    muted: 'FFA8A29E',
    border: 'FF44403C',
    success: 'FF22C55E',
    danger: 'FFEF4444',
    kpiBg: 'FF292524',
    palette: ['#F97316', '#FB923C', '#FDBA74', '#EA580C', '#C2410C'],
  },
  asset: {
    name: 'Crypto Native',
    bg: 'FF18181B',
    headerBg: 'FFF7931A',
    headerText: 'FF18181B',
    cardBg: 'FF27272A',
    accent: 'FFF7931A',
    text: 'FFFAFAFA',
    muted: 'FFA1A1AA',
    border: 'FF3F3F46',
    success: 'FF22C55E',
    danger: 'FFEF4444',
    kpiBg: 'FF27272A',
    palette: ['#F7931A', '#627EEA', '#00D395', '#E84142', '#8247E5'],
  },
  tools: {
    name: 'Tools Dark',
    bg: 'FF111827',
    headerBg: 'FF059669',
    headerText: 'FFFFFFFF',
    cardBg: 'FF1F2937',
    accent: 'FF059669',
    text: 'FFF9FAFB',
    muted: 'FF9CA3AF',
    border: 'FF374151',
    success: 'FF22C55E',
    danger: 'FFEF4444',
    kpiBg: 'FF1F2937',
    palette: ['#059669', '#10B981', '#34D399', '#047857', '#065F46'],
  },
  institutional: {
    name: 'Institutional',
    bg: 'FF1A1A2E',
    headerBg: 'FFE94560',
    headerText: 'FFFFFFFF',
    cardBg: 'FF16213E',
    accent: 'FFE94560',
    text: 'FFEAEAEA',
    muted: 'FF7F8C8D',
    border: 'FF0F3460',
    success: 'FF22C55E',
    danger: 'FFEF4444',
    kpiBg: 'FF16213E',
    palette: ['#E94560', '#FF6B6B', '#F38181', '#C62828', '#B71C1C'],
  },
  yield: {
    name: 'Yield Finance',
    bg: 'FF042F2E',
    headerBg: 'FF14B8A6',
    headerText: 'FF042F2E',
    cardBg: 'FF134E4A',
    accent: 'FF14B8A6',
    text: 'FFF0FDFA',
    muted: 'FF5EEAD4',
    border: 'FF115E59',
    success: 'FF22C55E',
    danger: 'FFEF4444',
    kpiBg: 'FF134E4A',
    palette: ['#14B8A6', '#2DD4BF', '#5EEAD4', '#0D9488', '#0F766E'],
  },
};

// Get theme for a specific dashboard
export function getDashboardTheme(dashboard: DashboardType, chartStyle?: ChartStyle) {
  // If colorful style requested, always use executive (OtherLevel gold)
  if (chartStyle === 'colorful') {
    return CATEGORY_THEMES.executive;
  }
  // Otherwise use the category-specific theme
  const category = DASHBOARD_CATEGORIES[dashboard] || 'tools';
  return CATEGORY_THEMES[category];
}

// ============================================
// DATA FETCHING
// ============================================

async function fetchWithTimeout(url: string, timeout = 10000): Promise<any> {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);

  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: { 'Accept': 'application/json' }
    });
    clearTimeout(id);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (e) {
    clearTimeout(id);
    return null;
  }
}

export async function fetchAllData(options: GenerateOptions) {
  const { limit = 100, days = 30 } = options;

  // Fetch all data in parallel
  const [
    marketData,
    globalData,
    trendingData,
    fearGreedData,
    defiData,
    derivativesData,
    exchangesData,
    categoriesData,
    nftData,
  ] = await Promise.all([
    fetchWithTimeout(`https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=${limit}&page=1&sparkline=true&price_change_percentage=1h,24h,7d,30d`),
    fetchWithTimeout('https://api.coingecko.com/api/v3/global'),
    fetchWithTimeout('https://api.coingecko.com/api/v3/search/trending'),
    fetchWithTimeout('https://api.alternative.me/fng/?limit=90'),
    fetchWithTimeout('https://api.coingecko.com/api/v3/global/decentralized_finance_defi'),
    fetchWithTimeout('https://api.coingecko.com/api/v3/derivatives'),
    fetchWithTimeout('https://api.coingecko.com/api/v3/exchanges?per_page=50'),
    fetchWithTimeout('https://api.coingecko.com/api/v3/coins/categories'),
    fetchWithTimeout('https://api.coingecko.com/api/v3/nfts/list?per_page=50'),
  ]);

  return {
    market: marketData || [],
    global: globalData?.data || {},
    trending: trendingData?.coins || [],
    fearGreed: fearGreedData?.data || [],
    defi: defiData?.data || {},
    derivatives: derivativesData || [],
    exchanges: exchangesData || [],
    categories: categoriesData || [],
    nfts: nftData || [],
  };
}

// ============================================
// MASTER GENERATOR
// ============================================

export async function generateMasterExcel(options: GenerateOptions): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'CryptoReportKit';
  workbook.created = new Date();
  workbook.modified = new Date();

  // Set workbook properties
  workbook.properties.date1904 = false;

  const data = await fetchAllData(options);

  // Always add Settings sheet first
  addSettingsSheet(workbook, options);

  // Add sheets based on dashboard type
  switch (options.dashboard) {
    case 'complete-suite':
      await addAllSheets(workbook, data, options);
      break;
    case 'market-overview':
      addGlobalStatsSheet(workbook, data.global);
      addTopCoinsSheet(workbook, data.market);
      addMarketChartSheet(workbook, data.market.slice(0, 20));
      break;
    case 'portfolio-tracker':
      addPortfolioSheet(workbook, data.market, options.coins || ['bitcoin', 'ethereum', 'solana']);
      addPortfolioChartSheet(workbook);
      break;
    case 'technical-analysis':
      await addTechnicalSheet(workbook, options.coins?.[0] || 'bitcoin', options.days || 30);
      break;
    case 'fear-greed':
      addFearGreedSheet(workbook, data.fearGreed);
      break;
    case 'gainers-losers':
      addGainersLosersSheet(workbook, data.market);
      break;
    case 'trending':
      addTrendingSheet(workbook, data.trending, data.market);
      break;
    case 'defi-dashboard':
      addDeFiSheet(workbook, data.defi, data.market);
      break;
    case 'derivatives':
      addDerivativesSheet(workbook, data.derivatives);
      break;
    case 'exchanges':
      addExchangesSheet(workbook, data.exchanges);
      break;
    case 'categories':
      addCategoriesSheet(workbook, data.categories);
      break;
    case 'nft-tracker':
      addNFTSheet(workbook, data.nfts);
      break;
    case 'correlation':
      addCorrelationSheet(workbook, data.market.slice(0, 20));
      break;
    case 'heatmap':
      addHeatmapSheet(workbook, data.market);
      break;
    case 'screener':
      addScreenerSheet(workbook, data.market);
      break;
    case 'stablecoins':
      addStablecoinsSheet(workbook, data.market);
      break;
    case 'etf-tracker':
      addETFSheet(workbook);
      break;
    case 'whale-tracker':
      addWhaleSheet(workbook);
      break;
    case 'on-chain':
      addOnChainSheet(workbook);
      break;
    case 'custom':
      addCustomWatchlistSheet(workbook, data.market, options.coins || ['bitcoin', 'ethereum']);
      break;
    case 'bitcoin-dashboard':
      const btcData = data.market.find((c: any) => c.id === 'bitcoin');
      addBitcoinDashboard(workbook, btcData, data.global, data.fearGreed);
      break;
    case 'ethereum-dashboard':
      const ethData = data.market.find((c: any) => c.id === 'ethereum');
      addEthereumDashboard(workbook, ethData, data.defi, data.global);
      break;
    case 'layer1-compare':
      addLayer1Comparison(workbook, data.market);
      break;
    case 'layer2-compare':
      addLayer2Comparison(workbook, data.market);
      break;
    case 'meme-coins':
      addMemeCoins(workbook, data.market);
      break;
    case 'ai-gaming':
      addAIGamingTokens(workbook, data.market);
      break;
    case 'calculator':
      addInvestmentCalculator(workbook, data.market);
      break;
    case 'volatility':
      addVolatilityAnalysis(workbook, data.market);
      break;
    case 'rwa':
      addRWASheet(workbook, data.market);
      break;
    case 'liquidations':
      addLiquidationsDashboard(workbook, data.market);
      break;
    case 'funding-rates':
      addFundingRatesDashboard(workbook, data.market);
      break;
    case 'altcoin-season':
      addAltcoinSeasonDashboard(workbook, data.market, data.global);
      break;
    case 'token-unlocks':
      addTokenUnlocksDashboard(workbook, data.market);
      break;
    case 'staking-yields':
      addStakingYieldsDashboard(workbook, data.market);
      break;
    case 'social-sentiment':
      addSocialSentimentDashboard(workbook, data.market);
      break;
    case 'dev-activity':
      addDeveloperActivityDashboard(workbook, data.market);
      break;
    case 'exchange-reserves':
      addExchangeReservesDashboard(workbook, data.market);
      break;
    case 'defi-yields':
      addDeFiYieldsDashboard(workbook, data.market);
      break;
    case 'metaverse':
      addMetaverseTokensDashboard(workbook, data.market);
      break;
    case 'privacy-coins':
      addPrivacyCoinsDashboard(workbook, data.market);
      break;
    case 'mining-calc':
      addMiningCalculatorDashboard(workbook, data.market);
      break;
  }

  // Add documentation sheet
  addDocumentationSheet(workbook);

  // Add Power Query setup sheet for live data mode
  if (options.outputMode === 'live') {
    const queries = generateQueriesForDashboard(
      options.dashboard,
      options.coins || ['bitcoin', 'ethereum', 'solana']
    );
    const refreshConfig = REFRESH_PRESETS[options.refreshInterval || 'hourly'];
    addPowerQuerySetupSheet(workbook, queries, refreshConfig);
  }

  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(buffer);
}

// ============================================
// BYOK TEMPLATE GENERATOR (No server-side data fetch)
// ============================================

/**
 * Generates a BYOK Excel template with Power Query setup.
 * NO data is fetched by the server - the template contains:
 * - Settings sheet with API key cell + named range
 * - Power Query Setup sheet with M code calling CoinGecko DIRECTLY
 * - Documentation sheet
 *
 * The user pastes their own CoinGecko API key and sets up Power Query.
 * All data flows directly from CoinGecko to Excel. Server never touches data.
 */
export async function generateBYOKExcel(options: GenerateOptions): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'CryptoReportKit';
  workbook.created = new Date();
  workbook.modified = new Date();
  workbook.properties.date1904 = false;

  // Add Settings sheet with API key cell
  addSettingsSheet(workbook, { ...options, outputMode: 'live' });

  // Create named range for API key cell (used by Power Query M code)
  workbook.definedNames.add("'Settings'!$B$6", 'CRK_ApiKey');

  // Generate Power Query definitions
  const queries = generateQueriesForDashboard(
    options.dashboard,
    options.coins || ['bitcoin', 'ethereum', 'solana']
  );

  // Add CRK formula dashboard sheets (dual-mode: works with add-in installed)
  // Without add-in, these show #NAME! but Power Query still populates data
  addCrkDashboardSheets(workbook, options.dashboard, options.coins || ['bitcoin', 'ethereum', 'solana']);

  // Add a lightweight instructions sheet (replaces verbose M code copy-paste sheet)
  const refreshConfig = REFRESH_PRESETS[options.refreshInterval || 'hourly'];
  addPowerQuerySetupSheet(workbook, queries, refreshConfig);

  // Add documentation
  addDocumentationSheet(workbook);

  // Generate base xlsx from ExcelJS
  const baseBuffer = Buffer.from(await workbook.xlsx.writeBuffer());

  // Post-process: inject real Power Query connections into the xlsx ZIP
  // After injection, Excel shows queries in Data > Queries & Connections
  // User just pastes API key in B6 and clicks Refresh All
  const injected = await injectPowerQueries(baseBuffer, queries);

  return Buffer.from(injected);
}

// ============================================
// ADD ALL SHEETS (Complete Suite)
// ============================================

async function addAllSheets(workbook: ExcelJS.Workbook, data: any, options: GenerateOptions) {
  // Dashboard overview - use OtherLevel style if colorful theme selected
  addDashboardSheet(workbook, data, options);

  // Market data
  addGlobalStatsSheet(workbook, data.global);
  addTopCoinsSheet(workbook, data.market);
  addMarketChartSheet(workbook, data.market.slice(0, 20));

  // Movers
  addGainersLosersSheet(workbook, data.market);
  addTrendingSheet(workbook, data.trending, data.market);

  // Sentiment
  addFearGreedSheet(workbook, data.fearGreed);

  // Portfolio
  addPortfolioSheet(workbook, data.market, options.coins || ['bitcoin', 'ethereum', 'solana', 'cardano', 'polkadot']);

  // Bitcoin & Ethereum Specific
  const btcData = data.market.find((c: any) => c.id === 'bitcoin');
  const ethData = data.market.find((c: any) => c.id === 'ethereum');
  addBitcoinDashboard(workbook, btcData, data.global, data.fearGreed);
  addEthereumDashboard(workbook, ethData, data.defi, data.global);

  // Layer Comparisons
  addLayer1Comparison(workbook, data.market);
  addLayer2Comparison(workbook, data.market);

  // Sectors
  addDeFiSheet(workbook, data.defi, data.market);
  addCategoriesSheet(workbook, data.categories);
  addStablecoinsSheet(workbook, data.market);
  addMemeCoins(workbook, data.market);
  addAIGamingTokens(workbook, data.market);
  addRWASheet(workbook, data.market);
  addMetaverseTokensDashboard(workbook, data.market);
  addPrivacyCoinsDashboard(workbook, data.market);

  // Trading
  addDerivativesSheet(workbook, data.derivatives);
  addExchangesSheet(workbook, data.exchanges);
  addLiquidationsDashboard(workbook, data.market);
  addFundingRatesDashboard(workbook, data.market);

  // Analysis
  addCorrelationSheet(workbook, data.market.slice(0, 15));
  addHeatmapSheet(workbook, data.market);
  addScreenerSheet(workbook, data.market);
  addVolatilityAnalysis(workbook, data.market);
  addAltcoinSeasonDashboard(workbook, data.market, data.global);
  addSocialSentimentDashboard(workbook, data.market);
  addDeveloperActivityDashboard(workbook, data.market);
  addExchangeReservesDashboard(workbook, data.market);
  addTokenUnlocksDashboard(workbook, data.market);

  // Yields & Staking
  addStakingYieldsDashboard(workbook, data.market);
  addDeFiYieldsDashboard(workbook, data.market);

  // Calculators
  addInvestmentCalculator(workbook, data.market);
  addMiningCalculatorDashboard(workbook, data.market);

  // Technical
  await addTechnicalSheet(workbook, 'bitcoin', 30);
}

// ============================================
// SETTINGS SHEET
// ============================================

function addSettingsSheet(workbook: ExcelJS.Workbook, options: GenerateOptions) {
  const sheet = workbook.addWorksheet('Settings', {
    properties: { tabColor: { argb: COLORS.primary } }
  });

  // Column widths
  sheet.getColumn('A').width = 3;
  sheet.getColumn('B').width = 35;
  sheet.getColumn('C').width = 50;
  sheet.getColumn('D').width = 35;

  // Logo/Header area
  sheet.mergeCells('B2:D2');
  const logoCell = sheet.getCell('B2');
  logoCell.value = '📊 CRYPTOREPORTKIT';
  logoCell.font = { bold: true, size: 24, color: { argb: COLORS.primary } };
  sheet.getRow(2).height = 40;

  sheet.mergeCells('B3:D3');
  sheet.getCell('B3').value = 'Professional Cryptocurrency Analytics for Excel';
  sheet.getCell('B3').font = { size: 12, color: { argb: COLORS.light } };

  // API Key section
  sheet.getCell('B5').value = '🔑 YOUR COINGECKO API KEY';
  sheet.getCell('B5').font = { bold: true, size: 14, color: { argb: COLORS.primary } };

  const keyCell = sheet.getCell('B6');
  keyCell.value = options.apiKey || 'PASTE_YOUR_API_KEY_HERE';
  keyCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFF3CD' } };
  keyCell.border = {
    top: { style: 'medium', color: { argb: COLORS.primary } },
    bottom: { style: 'medium', color: { argb: COLORS.primary } },
    left: { style: 'medium', color: { argb: COLORS.primary } },
    right: { style: 'medium', color: { argb: COLORS.primary } },
  };
  keyCell.font = { size: 12 };

  sheet.getCell('C6').value = '← Paste your key here';
  sheet.getCell('C6').font = { italic: true, color: { argb: COLORS.light } };

  // Instructions
  sheet.getCell('B8').value = '📋 GET YOUR FREE API KEY (2 minutes)';
  sheet.getCell('B8').font = { bold: true, size: 12, color: { argb: COLORS.primary } };

  const instructions = [
    { step: '1.', text: 'Go to coingecko.com/en/api/pricing', link: 'https://www.coingecko.com/en/api/pricing' },
    { step: '2.', text: 'Click "Get Started" (Demo API is FREE)', link: '' },
    { step: '3.', text: 'Create account (no credit card needed)', link: '' },
    { step: '4.', text: 'Copy your API key from dashboard', link: '' },
    { step: '5.', text: 'Paste it in cell B6 above', link: '' },
    { step: '6.', text: 'Go to Data tab → Refresh All', link: '' },
  ];

  instructions.forEach((inst, i) => {
    const row = 9 + i;
    sheet.getCell(`B${row}`).value = inst.step;
    sheet.getCell(`B${row}`).font = { bold: true, color: { argb: COLORS.primary } };
    sheet.getCell(`C${row}`).value = inst.text;
    sheet.getCell(`C${row}`).font = { color: { argb: COLORS.medium } };
  });

  // API Limits info
  sheet.getCell('B17').value = '📊 API LIMITS';
  sheet.getCell('B17').font = { bold: true, size: 12, color: { argb: COLORS.primary } };

  const limits = [
    ['Demo (Free)', '10,000 calls/month', 'Perfect for personal use'],
    ['Analyst', '500,000 calls/month', 'For power users'],
    ['Pro', '5,000,000 calls/month', 'For businesses'],
  ];

  limits.forEach((limit, i) => {
    const row = 18 + i;
    sheet.getCell(`B${row}`).value = limit[0];
    sheet.getCell(`B${row}`).font = { bold: true };
    sheet.getCell(`C${row}`).value = limit[1];
    sheet.getCell(`C${row}`).font = { color: { argb: COLORS.success } };
    sheet.getCell(`D${row}`).value = limit[2];
    sheet.getCell(`D${row}`).font = { color: { argb: COLORS.light } };
  });

  // Template info
  sheet.getCell('B23').value = '📁 TEMPLATE INFO';
  sheet.getCell('B23').font = { bold: true, size: 12, color: { argb: COLORS.primary } };

  sheet.getCell('B24').value = 'Dashboard:';
  sheet.getCell('C24').value = options.dashboard.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  sheet.getCell('C24').font = { bold: true, color: { argb: COLORS.primary } };

  sheet.getCell('B25').value = 'Generated:';
  sheet.getCell('C25').value = new Date().toLocaleString();

  sheet.getCell('B26').value = 'Coins:';
  sheet.getCell('C26').value = (options.coins || ['All top coins']).join(', ').toUpperCase();

  // Output mode settings
  if (options.outputMode) {
    sheet.getCell('B27').value = 'Output Mode:';
    const modeLabels: Record<string, string> = {
      static: '📊 Static Report',
      live: '⚡ Live Excel (Power Query)',
      interactive: '🚀 Interactive (CRK Add-in)',
    };
    sheet.getCell('C27').value = modeLabels[options.outputMode] || options.outputMode;
    sheet.getCell('C27').font = { bold: true, color: { argb: COLORS.info } };
  }

  if (options.outputMode === 'live' && options.refreshInterval) {
    sheet.getCell('B28').value = 'Refresh Interval:';
    const intervalLabels: Record<string, string> = {
      realtime: 'Real-time (5 min)',
      frequent: 'Frequent (15 min)',
      hourly: 'Hourly',
      daily: 'Daily',
      manual: 'Manual only',
    };
    sheet.getCell('C28').value = intervalLabels[options.refreshInterval] || options.refreshInterval;
    sheet.getCell('C28').font = { color: { argb: COLORS.success } };
  }

  if (options.chartStyle) {
    const chartRow = options.outputMode === 'live' ? 29 : 28;
    sheet.getCell(`B${chartRow}`).value = 'Chart Style:';
    const styleLabels: Record<string, string> = {
      minimal: 'Minimal',
      professional: 'Professional',
      colorful: 'Colorful (OtherLevel)',
    };
    sheet.getCell(`C${chartRow}`).value = styleLabels[options.chartStyle] || options.chartStyle;
  }

  // Important notes - adjust row based on settings displayed
  const notesStartRow = 32;
  sheet.getCell(`B${notesStartRow}`).value = '⚠️ IMPORTANT NOTES';
  sheet.getCell(`B${notesStartRow}`).font = { bold: true, size: 12, color: { argb: COLORS.warning } };

  const notes = [
    '• Your API key stays in this file - we never see it',
    '• Requires Excel Desktop (2016+) with Power Query',
    '• Excel Online does NOT support Power Query refresh',
    '• Data refreshes when you click Refresh All',
    '• Some features require Pro CoinGecko API key',
  ];

  if (options.outputMode === 'live') {
    notes.push('• See "Power Query Setup" sheet for live data instructions');
  }

  notes.forEach((note, i) => {
    sheet.getCell(`B${notesStartRow + 1 + i}`).value = note;
    sheet.getCell(`B${notesStartRow + 1 + i}`).font = { color: { argb: COLORS.medium } };
  });

  // Footer
  const footerRow = notesStartRow + notes.length + 3;
  sheet.getCell(`B${footerRow}`).value = '© 2026 CryptoReportKit • cryptoreportkit.com';
  sheet.getCell(`B${footerRow}`).font = { italic: true, color: { argb: COLORS.lighter } };
}

// ============================================
// DASHBOARD OVERVIEW SHEET
// ============================================

function addDashboardSheet(workbook: ExcelJS.Workbook, data: any, options?: Partial<GenerateOptions>) {
  // Use category-based theming for professional, or OtherLevel gold for colorful
  const dashboardType = options?.dashboard || 'market-overview';
  const isPremiumStyle = options?.chartStyle === 'colorful' || options?.chartStyle === 'professional';
  const isOtherLevel = options?.chartStyle === 'colorful';

  // Get the appropriate theme for this dashboard
  const categoryTheme = getDashboardTheme(dashboardType, options?.chartStyle);
  const themeColors = isPremiumStyle ? {
    bg: categoryTheme.bg,
    headerBg: categoryTheme.headerBg,
    headerText: categoryTheme.headerText,
    cardBg: categoryTheme.cardBg,
    accent: categoryTheme.accent,
    text: categoryTheme.text,
    muted: categoryTheme.muted,
    kpiBg: categoryTheme.kpiBg,
    border: categoryTheme.border,
    success: categoryTheme.success,
    danger: categoryTheme.danger,
  } : {
    bg: 'FF111827',
    headerBg: COLORS.primary,
    headerText: COLORS.white,
    cardBg: 'FF1F2937',
    accent: COLORS.primary,
    text: COLORS.white,
    muted: COLORS.light,
    kpiBg: 'FF1F2937',
    border: COLORS.medium,
    success: COLORS.success,
    danger: COLORS.danger,
  };

  const sheet = workbook.addWorksheet('Dashboard', {
    properties: { tabColor: { argb: themeColors.accent } }
  });

  // Column widths - OtherLevel uses wider columns for KPI cards
  sheet.getColumn('A').width = 2;
  sheet.getColumn('B').width = 18;
  sheet.getColumn('C').width = 18;
  sheet.getColumn('D').width = 2;
  sheet.getColumn('E').width = 18;
  sheet.getColumn('F').width = 18;
  sheet.getColumn('G').width = 2;
  sheet.getColumn('H').width = 18;
  sheet.getColumn('I').width = 18;
  sheet.getColumn('J').width = 2;
  sheet.getColumn('K').width = 18;
  sheet.getColumn('L').width = 18;

  // Set dark background for entire visible area (Premium style)
  if (isPremiumStyle) {
    for (let r = 1; r <= 50; r++) {
      for (let c = 1; c <= 14; c++) {
        sheet.getCell(r, c).fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: themeColors.bg },
        };
      }
    }
  }

  // Header - OtherLevel style with accent bar
  // Get dashboard title based on type
  const dashboardTitles: Partial<Record<DashboardType, string>> = {
    'complete-suite': 'COMPLETE CRYPTO SUITE',
    'market-overview': 'CRYPTO MARKET DASHBOARD',
    'portfolio-tracker': 'PORTFOLIO TRACKER',
    'technical-analysis': 'TECHNICAL ANALYSIS',
    'fear-greed': 'FEAR & GREED ANALYSIS',
    'gainers-losers': 'TOP GAINERS & LOSERS',
    'trending': 'TRENDING COINS',
    'defi-dashboard': 'DEFI DASHBOARD',
    'derivatives': 'DERIVATIVES MARKET',
    'bitcoin-dashboard': 'BITCOIN ANALYSIS',
    'ethereum-dashboard': 'ETHEREUM ECOSYSTEM',
    'screener': 'CRYPTO SCREENER',
    'correlation': 'CORRELATION MATRIX',
    'heatmap': 'MARKET HEATMAP',
    'whale-tracker': 'WHALE TRACKER',
    'on-chain': 'ON-CHAIN ANALYTICS',
    'etf-tracker': 'CRYPTO ETF TRACKER',
    'stablecoins': 'STABLECOIN DASHBOARD',
    'exchanges': 'EXCHANGE ANALYTICS',
    'layer1-compare': 'LAYER 1 COMPARISON',
    'layer2-compare': 'LAYER 2 COMPARISON',
    'meme-coins': 'MEME COINS TRACKER',
    'ai-gaming': 'AI & GAMING TOKENS',
    'calculator': 'INVESTMENT CALCULATOR',
    'volatility': 'VOLATILITY ANALYSIS',
    'rwa': 'REAL WORLD ASSETS',
    'liquidations': 'LIQUIDATION TRACKER',
    'funding-rates': 'FUNDING RATES',
    'altcoin-season': 'ALTCOIN SEASON INDEX',
    'token-unlocks': 'TOKEN UNLOCKS',
    'staking-yields': 'STAKING YIELDS',
    'social-sentiment': 'SOCIAL SENTIMENT',
    'dev-activity': 'DEVELOPER ACTIVITY',
    'exchange-reserves': 'EXCHANGE RESERVES',
    'defi-yields': 'DEFI YIELDS',
    'metaverse': 'METAVERSE TOKENS',
    'privacy-coins': 'PRIVACY COINS',
    'mining-calc': 'MINING CALCULATOR',
    'nft-tracker': 'NFT TRACKER',
    'categories': 'CRYPTO CATEGORIES',
    'custom': 'CUSTOM DASHBOARD',
  };
  const dashboardTitle = dashboardTitles[dashboardType] || 'CRYPTO MARKET DASHBOARD';

  sheet.mergeCells('B2:L2');
  const header = sheet.getCell('B2');
  header.value = isPremiumStyle ? `  ${dashboardTitle}` : `📊 ${dashboardTitle}`;
  header.font = { bold: true, size: 20, color: { argb: themeColors.headerText } };
  header.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: themeColors.headerBg } };
  header.alignment = { horizontal: 'center', vertical: 'middle' };
  sheet.getRow(2).height = 50;

  // Timestamp row
  sheet.mergeCells('B3:L3');
  sheet.getCell('B3').value = `Last Updated: ${new Date().toLocaleString()}`;
  sheet.getCell('B3').font = { italic: true, size: 10, color: { argb: themeColors.muted } };
  sheet.getCell('B3').alignment = { horizontal: 'center' };
  if (isPremiumStyle) {
    sheet.getCell('B3').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: themeColors.bg } };
  }

  // ========================================
  // KPI SUMMARY ROW (Premium Style)
  // ========================================
  if (isPremiumStyle) {
    // Create 4 large KPI cards in a row
    const kpiData = [
      {
        title: 'TOTAL MARKET CAP',
        value: formatCurrency(data.global?.total_market_cap?.usd || 0),
        change: data.global?.market_cap_change_percentage_24h_usd || 0,
        icon: '💰',
      },
      {
        title: '24H VOLUME',
        value: formatCurrency(data.global?.total_volume?.usd || 0),
        change: 0,
        icon: '📊',
      },
      {
        title: 'BTC DOMINANCE',
        value: `${(data.global?.market_cap_percentage?.btc || 0).toFixed(1)}%`,
        change: 0,
        icon: '₿',
      },
      {
        title: 'FEAR & GREED',
        value: data.fearGreed?.[0]?.value || '50',
        subtitle: data.fearGreed?.[0]?.value_classification || 'Neutral',
        icon: '😱',
      },
    ];

    // KPI Card positions
    const kpiPositions = [
      { col: 2 },  // B
      { col: 5 },  // E
      { col: 8 },  // H
      { col: 11 }, // K
    ];

    kpiData.forEach((kpi, idx) => {
      const startCol = kpiPositions[idx].col;
      const startRow = 5;
      const cardWidth = 3;
      const cardHeight = 5;

      // Card background with border
      for (let r = 0; r < cardHeight; r++) {
        for (let c = 0; c < cardWidth; c++) {
          const cell = sheet.getCell(startRow + r, startCol + c);
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: themeColors.kpiBg } };
          // Add subtle border on edges
          cell.border = {
            top: r === 0 ? { style: 'thin', color: { argb: themeColors.accent } } : undefined,
            bottom: r === cardHeight - 1 ? { style: 'thin', color: { argb: themeColors.border } } : undefined,
            left: c === 0 ? { style: 'thin', color: { argb: themeColors.border } } : undefined,
            right: c === cardWidth - 1 ? { style: 'thin', color: { argb: themeColors.border } } : undefined,
          };
        }
      }

      // Icon + Title
      const titleCell = sheet.getCell(startRow + 1, startCol);
      titleCell.value = `${kpi.icon} ${kpi.title}`;
      titleCell.font = { size: 9, color: { argb: themeColors.muted } };

      // Main value - large and bold
      sheet.mergeCells(startRow + 2, startCol, startRow + 2, startCol + cardWidth - 1);
      const valueCell = sheet.getCell(startRow + 2, startCol);
      valueCell.value = kpi.value;
      valueCell.font = { size: 20, bold: true, color: { argb: themeColors.text } };
      valueCell.alignment = { horizontal: 'left' };

      // Subtitle or Change
      if (kpi.subtitle) {
        const subtitleCell = sheet.getCell(startRow + 3, startCol);
        subtitleCell.value = kpi.subtitle;
        subtitleCell.font = { size: 10, color: { argb: themeColors.accent } };
      } else if (kpi.change !== undefined && kpi.change !== 0) {
        const changeCell = sheet.getCell(startRow + 3, startCol);
        const isPositive = kpi.change >= 0;
        changeCell.value = `${isPositive ? '▲' : '▼'} ${Math.abs(kpi.change).toFixed(2)}% 24h`;
        changeCell.font = { size: 10, bold: true, color: { argb: isPositive ? 'FF22C55E' : 'FFEF4444' } };
      }
    });
  }

  // Theme for cards - use category-based theme
  const cardTheme = isPremiumStyle ? 'otherlevel' : 'default';
  const cardAccentColor = themeColors.accent;

  // Card row positions - adjusted for premium KPI row
  const cardsRow1 = isPremiumStyle ? 12 : 5;  // After KPI cards
  const cardsRow2 = isPremiumStyle ? 20 : 13; // Second row of cards

  // === MARKET OVERVIEW CARD ===
  if (!isPremiumStyle) {
    // Only show for non-premium (premium has KPI cards instead)
    addCard(sheet, 'B', cardsRow1, '🌍 MARKET OVERVIEW', [
      ['Total Market Cap', formatCurrency(data.global?.total_market_cap?.usd || 0)],
      ['24h Volume', formatCurrency(data.global?.total_volume?.usd || 0)],
      ['BTC Dominance', `${(data.global?.market_cap_percentage?.btc || 0).toFixed(1)}%`],
      ['Active Coins', (data.global?.active_cryptocurrencies || 0).toLocaleString()],
      ['24h Change', formatPercent(data.global?.market_cap_change_percentage_24h_usd || 0)],
    ], cardAccentColor, cardTheme);
  }

  // === TOP PERFORMERS CARD ===
  const topGainers = [...(data.market || [])].sort((a, b) =>
    (b.price_change_percentage_24h || 0) - (a.price_change_percentage_24h || 0)
  ).slice(0, 5);

  addCard(sheet, isPremiumStyle ? 'B' : 'E', cardsRow1, isPremiumStyle ? 'TOP GAINERS (24h)' : '🚀 TOP GAINERS (24h)',
    topGainers.map(c => [c.symbol?.toUpperCase(), formatPercent(c.price_change_percentage_24h)]),
    themeColors.success, cardTheme
  );

  // === TOP LOSERS CARD ===
  const topLosers = [...(data.market || [])].sort((a, b) =>
    (a.price_change_percentage_24h || 0) - (b.price_change_percentage_24h || 0)
  ).slice(0, 5);

  addCard(sheet, isPremiumStyle ? 'E' : 'H', cardsRow1, isPremiumStyle ? 'TOP LOSERS (24h)' : '📉 TOP LOSERS (24h)',
    topLosers.map(c => [c.symbol?.toUpperCase(), formatPercent(c.price_change_percentage_24h)]),
    themeColors.danger, cardTheme
  );

  // === TRENDING CARD (Premium row 1) ===
  if (isPremiumStyle) {
    addCard(sheet, 'H', cardsRow1, 'TRENDING NOW',
      (data.trending || []).slice(0, 5).map((t: any, i: number) =>
        [`#${i + 1}`, t.item?.name || 'Unknown']
      ),
      'FFF59E0B', cardTheme
    );
  }

  // === FEAR & GREED CARD ===
  const fgValue = parseInt(data.fearGreed?.[0]?.value || '50');
  const fgClass = data.fearGreed?.[0]?.value_classification || 'Neutral';

  addCard(sheet, 'B', cardsRow2, isPremiumStyle ? 'FEAR & GREED INDEX' : '😱 FEAR & GREED INDEX', [
    ['Current Value', `${fgValue}`],
    ['Classification', fgClass],
    ['Trend', fgValue > 50 ? '↑ Greedy' : '↓ Fearful'],
  ], getGaugeColor(fgValue), cardTheme);

  // === TRENDING CARD (non-Premium) ===
  if (!isPremiumStyle) {
    addCard(sheet, 'E', cardsRow2, '🔥 TRENDING NOW',
      (data.trending || []).slice(0, 5).map((t: any, i: number) =>
        [`#${i + 1}`, t.item?.name || 'Unknown']
      ),
      COLORS.warning, cardTheme
    );
  }

  // === DEFI STATS CARD ===
  addCard(sheet, isPremiumStyle ? 'E' : 'H', cardsRow2, isPremiumStyle ? 'DEFI STATS' : '🏦 DEFI STATS', [
    ['DeFi Market Cap', formatCurrency(parseFloat(data.defi?.defi_market_cap || '0'))],
    ['DeFi Dominance', `${parseFloat(data.defi?.defi_dominance || '0').toFixed(2)}%`],
    ['ETH in DeFi', formatCurrency(parseFloat(data.defi?.eth_market_cap || '0'))],
  ], COLORS.purple, cardTheme);

  // === TOP 10 COINS TABLE ===
  const tableStartRow = isPremiumStyle ? 28 : 21;
  sheet.mergeCells(`B${tableStartRow}:I${tableStartRow}`);
  const top10Header = sheet.getCell(`B${tableStartRow}`);
  top10Header.value = isPremiumStyle ? 'TOP 10 CRYPTOCURRENCIES' : '💰 TOP 10 CRYPTOCURRENCIES';
  top10Header.font = { bold: true, size: 18, color: { argb: themeColors.headerText } };
  top10Header.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: themeColors.headerBg } };
  top10Header.alignment = { horizontal: 'center', vertical: 'middle' };
  sheet.getRow(tableStartRow).height = 35;

  // Column headers - Premium style with theme colors
  const tableHeaders = ['#', 'Name', 'Symbol', 'Price', 'Market Cap', '24h %', '7d %', 'Volume'];
  const headerRow = tableStartRow + 1;
  tableHeaders.forEach((h, i) => {
    const cell = sheet.getCell(headerRow, i + 2);
    cell.value = h;
    if (isPremiumStyle) {
      cell.font = { bold: true, color: { argb: themeColors.text } };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: themeColors.border } };
      cell.alignment = { horizontal: 'center' };
    } else {
      Object.assign(cell, STYLES.columnHeader);
    }
  });

  // Data rows
  const dataStartRow = tableStartRow + 2;
  (data.market || []).slice(0, 10).forEach((coin: any, i: number) => {
    const row = dataStartRow + i;
    const change24h = coin.price_change_percentage_24h || 0;
    const change7d = coin.price_change_percentage_7d_in_currency || 0;

    // Row background - alternating with theme colors
    const rowBg = isPremiumStyle
      ? (i % 2 === 0 ? themeColors.cardBg : themeColors.bg)
      : (i % 2 === 0 ? COLORS.surface : undefined);

    if (rowBg) {
      for (let col = 2; col <= 9; col++) {
        sheet.getCell(row, col).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: rowBg } };
      }
    }

    const textColor = isPremiumStyle ? themeColors.text : COLORS.dark;
    const mutedColor = isPremiumStyle ? themeColors.muted : COLORS.medium;

    sheet.getCell(`B${row}`).value = coin.market_cap_rank;
    sheet.getCell(`B${row}`).font = { color: { argb: mutedColor } };
    sheet.getCell(`C${row}`).value = coin.name;
    sheet.getCell(`C${row}`).font = { bold: true, color: { argb: textColor } };
    sheet.getCell(`D${row}`).value = coin.symbol?.toUpperCase();
    sheet.getCell(`D${row}`).font = { color: { argb: themeColors.accent } };
    sheet.getCell(`E${row}`).value = formatPrice(coin.current_price);
    sheet.getCell(`E${row}`).font = { bold: true, color: { argb: textColor } };
    sheet.getCell(`F${row}`).value = formatCompact(coin.market_cap);
    sheet.getCell(`F${row}`).font = { color: { argb: textColor } };

    const cell24h = sheet.getCell(`G${row}`);
    cell24h.value = formatPercent(change24h);
    cell24h.font = { bold: true, color: { argb: change24h >= 0 ? themeColors.success : themeColors.danger } };

    const cell7d = sheet.getCell(`H${row}`);
    cell7d.value = formatPercent(change7d);
    cell7d.font = { bold: true, color: { argb: change7d >= 0 ? themeColors.success : themeColors.danger } };

    sheet.getCell(`I${row}`).value = formatCompact(coin.total_volume);
    sheet.getCell(`I${row}`).font = { color: { argb: mutedColor } };
  });
}

function addCard(
  sheet: ExcelJS.Worksheet,
  startCol: string,
  startRow: number,
  title: string,
  data: [string, string][],
  accentColor: string,
  theme?: 'default' | 'otherlevel'
) {
  const colNum = startCol.charCodeAt(0) - 64;
  const isOtherLevel = theme === 'otherlevel';

  // Theme colors
  const colors = isOtherLevel ? {
    headerBg: accentColor,
    headerText: 'FF171717',
    cardBg: 'FF1F1F1F',
    labelText: 'FF8B7355',
    valueText: 'FFFFDDDF',
    border: 'FF2A2A2A',
  } : {
    headerBg: accentColor,
    headerText: COLORS.white,
    cardBg: 'FF1F2937',
    labelText: COLORS.medium,
    valueText: COLORS.white,
    border: COLORS.mediumLight,
  };

  // Card background for OtherLevel
  if (isOtherLevel) {
    for (let i = 0; i <= data.length; i++) {
      const row = startRow + i;
      sheet.getCell(row, colNum).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: colors.cardBg } };
      sheet.getCell(row, colNum + 1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: colors.cardBg } };
      // Borders for card effect
      sheet.getCell(row, colNum).border = {
        left: { style: 'thin', color: { argb: colors.border } },
        top: i === 0 ? undefined : undefined,
      };
      sheet.getCell(row, colNum + 1).border = {
        right: { style: 'thin', color: { argb: colors.border } },
      };
    }
  }

  // Card header
  sheet.mergeCells(`${startCol}${startRow}:${String.fromCharCode(startCol.charCodeAt(0) + 1)}${startRow}`);
  const headerCell = sheet.getCell(`${startCol}${startRow}`);
  headerCell.value = title;
  headerCell.font = { bold: true, size: 12, color: { argb: colors.headerText } };
  headerCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: colors.headerBg } };
  headerCell.alignment = { horizontal: 'center' };

  // Card data
  data.forEach(([label, value], i) => {
    const row = startRow + 1 + i;
    sheet.getCell(row, colNum).value = label;
    sheet.getCell(row, colNum).font = { color: { argb: colors.labelText } };
    sheet.getCell(row, colNum + 1).value = value;
    sheet.getCell(row, colNum + 1).font = { bold: true, color: { argb: colors.valueText } };
    sheet.getCell(row, colNum + 1).alignment = { horizontal: 'right' };

    // Special formatting for percentage values
    if (value.includes('%')) {
      const numValue = parseFloat(value.replace('%', '').replace('+', ''));
      if (!isNaN(numValue)) {
        sheet.getCell(row, colNum + 1).font = {
          bold: true,
          color: { argb: numValue >= 0 ? 'FF22C55E' : 'FFEF4444' },
        };
      }
    }
  });
}

// ============================================
// GLOBAL STATS SHEET
// ============================================

function addGlobalStatsSheet(workbook: ExcelJS.Workbook, globalData: any) {
  const sheet = workbook.addWorksheet('Global_Stats', {
    properties: { tabColor: { argb: COLORS.info } }
  });

  sheet.getColumn('A').width = 3;
  sheet.getColumn('B').width = 30;
  sheet.getColumn('C').width = 25;
  sheet.getColumn('D').width = 25;
  sheet.getColumn('E').width = 3;

  // Header
  sheet.mergeCells('B2:D2');
  const header = sheet.getCell('B2');
  header.value = '🌍 GLOBAL CRYPTO MARKET';
  Object.assign(header, STYLES.header);
  sheet.getRow(2).height = 40;

  // Stats grid
  const stats = [
    { icon: '💰', label: 'Total Market Cap', value: formatCurrency(globalData?.total_market_cap?.usd || 0) },
    { icon: '📊', label: '24h Trading Volume', value: formatCurrency(globalData?.total_volume?.usd || 0) },
    { icon: '₿', label: 'Bitcoin Dominance', value: `${(globalData?.market_cap_percentage?.btc || 0).toFixed(2)}%` },
    { icon: 'Ξ', label: 'Ethereum Dominance', value: `${(globalData?.market_cap_percentage?.eth || 0).toFixed(2)}%` },
    { icon: '🪙', label: 'Active Cryptocurrencies', value: (globalData?.active_cryptocurrencies || 0).toLocaleString() },
    { icon: '🏛️', label: 'Active Exchanges', value: (globalData?.markets || 0).toLocaleString() },
    { icon: '📈', label: '24h Market Cap Change', value: `${(globalData?.market_cap_change_percentage_24h_usd || 0).toFixed(2)}%` },
    { icon: '🎯', label: 'Ongoing ICOs', value: (globalData?.ongoing_icos || 0).toString() },
  ];

  stats.forEach((stat, i) => {
    const row = 4 + i;
    sheet.getCell(`B${row}`).value = `${stat.icon} ${stat.label}`;
    sheet.getCell(`B${row}`).font = { bold: true, color: { argb: COLORS.dark } };

    sheet.getCell(`C${row}`).value = stat.value;
    sheet.getCell(`C${row}`).font = { bold: true, size: 14, color: { argb: COLORS.primary } };
    sheet.getCell(`C${row}`).alignment = { horizontal: 'right' };

    if (i % 2 === 0) {
      sheet.getCell(`B${row}`).fill = STYLES.zebraEven.fill;
      sheet.getCell(`C${row}`).fill = STYLES.zebraEven.fill;
    }
  });

  // Dominance chart
  sheet.getCell('B14').value = '📊 MARKET DOMINANCE';
  sheet.getCell('B14').font = { bold: true, size: 14, color: { argb: COLORS.primary } };

  const dominanceData = [
    { coin: 'BTC', value: globalData?.market_cap_percentage?.btc || 0, color: COLORS.bitcoin },
    { coin: 'ETH', value: globalData?.market_cap_percentage?.eth || 0, color: COLORS.ethereum },
    { coin: 'BNB', value: globalData?.market_cap_percentage?.bnb || 0, color: COLORS.warning },
    { coin: 'SOL', value: globalData?.market_cap_percentage?.sol || 0, color: COLORS.purple },
    { coin: 'Others', value: 100 - (globalData?.market_cap_percentage?.btc || 0) - (globalData?.market_cap_percentage?.eth || 0) - (globalData?.market_cap_percentage?.bnb || 0) - (globalData?.market_cap_percentage?.sol || 0), color: COLORS.light },
  ];

  dominanceData.forEach((d, i) => {
    const row = 15 + i;
    sheet.getCell(`B${row}`).value = d.coin;
    sheet.getCell(`B${row}`).font = { bold: true };

    const barWidth = Math.round(d.value / 2);
    sheet.getCell(`C${row}`).value = '█'.repeat(Math.max(1, barWidth));
    sheet.getCell(`C${row}`).font = { color: { argb: d.color } };

    sheet.getCell(`D${row}`).value = `${d.value.toFixed(1)}%`;
    sheet.getCell(`D${row}`).alignment = { horizontal: 'right' };
  });
}

// ============================================
// TOP COINS SHEET
// ============================================

function addTopCoinsSheet(workbook: ExcelJS.Workbook, marketData: any[]) {
  const sheet = workbook.addWorksheet('Top_Coins', {
    properties: { tabColor: { argb: COLORS.success } }
  });

  // Column widths
  sheet.getColumn('A').width = 3;
  sheet.getColumn('B').width = 6;   // Rank
  sheet.getColumn('C').width = 18;  // Name
  sheet.getColumn('D').width = 8;   // Symbol
  sheet.getColumn('E').width = 14;  // Price
  sheet.getColumn('F').width = 16;  // Market Cap
  sheet.getColumn('G').width = 14;  // Volume
  sheet.getColumn('H').width = 10;  // 1h %
  sheet.getColumn('I').width = 10;  // 24h %
  sheet.getColumn('J').width = 10;  // 7d %
  sheet.getColumn('K').width = 14;  // ATH
  sheet.getColumn('L').width = 10;  // From ATH

  // Header
  sheet.mergeCells('B2:L2');
  const header = sheet.getCell('B2');
  header.value = '📈 TOP CRYPTOCURRENCIES BY MARKET CAP';
  Object.assign(header, STYLES.header);
  sheet.getRow(2).height = 40;

  // Column headers
  const headers = ['#', 'Name', 'Symbol', 'Price', 'Market Cap', 'Volume 24h', '1h %', '24h %', '7d %', 'ATH', 'From ATH'];
  headers.forEach((h, i) => {
    const cell = sheet.getCell(4, i + 2);
    cell.value = h;
    Object.assign(cell, STYLES.columnHeader);
  });

  // Data rows
  marketData.slice(0, 100).forEach((coin: any, i: number) => {
    const row = 5 + i;
    const change1h = coin.price_change_percentage_1h_in_currency || 0;
    const change24h = coin.price_change_percentage_24h || 0;
    const change7d = coin.price_change_percentage_7d_in_currency || 0;
    const fromAth = ((coin.current_price - coin.ath) / coin.ath) * 100;

    sheet.getCell(`B${row}`).value = coin.market_cap_rank;
    sheet.getCell(`B${row}`).alignment = { horizontal: 'center' };

    sheet.getCell(`C${row}`).value = coin.name;
    sheet.getCell(`C${row}`).font = { bold: true };

    sheet.getCell(`D${row}`).value = coin.symbol?.toUpperCase();
    sheet.getCell(`D${row}`).font = { color: { argb: COLORS.light } };

    sheet.getCell(`E${row}`).value = formatPrice(coin.current_price);
    sheet.getCell(`F${row}`).value = formatCompact(coin.market_cap);
    sheet.getCell(`G${row}`).value = formatCompact(coin.total_volume);

    // Change percentages with colors
    const cell1h = sheet.getCell(`H${row}`);
    cell1h.value = formatPercent(change1h);
    cell1h.font = { color: { argb: change1h >= 0 ? COLORS.success : COLORS.danger } };

    const cell24h = sheet.getCell(`I${row}`);
    cell24h.value = formatPercent(change24h);
    cell24h.font = { bold: true, color: { argb: change24h >= 0 ? COLORS.success : COLORS.danger } };

    const cell7d = sheet.getCell(`J${row}`);
    cell7d.value = formatPercent(change7d);
    cell7d.font = { color: { argb: change7d >= 0 ? COLORS.success : COLORS.danger } };

    sheet.getCell(`K${row}`).value = formatPrice(coin.ath);

    const athCell = sheet.getCell(`L${row}`);
    athCell.value = `${fromAth.toFixed(1)}%`;
    athCell.font = { color: { argb: COLORS.danger } };

    // Zebra striping
    if (i % 2 === 0) {
      for (let col = 2; col <= 12; col++) {
        if (!sheet.getCell(row, col).fill) {
          sheet.getCell(row, col).fill = STYLES.zebraEven.fill;
        }
      }
    }
  });

  // Freeze header row
  sheet.views = [{ state: 'frozen', ySplit: 4 }];
}

// ============================================
// MARKET CHART SHEET
// ============================================

function addMarketChartSheet(workbook: ExcelJS.Workbook, topCoins: any[]) {
  const sheet = workbook.addWorksheet('Charts', {
    properties: { tabColor: { argb: COLORS.cyan } }
  });

  sheet.getColumn('A').width = 3;
  sheet.getColumn('B').width = 12;
  sheet.getColumn('C').width = 40;
  sheet.getColumn('D').width = 15;

  // Header
  sheet.mergeCells('B2:D2');
  const header = sheet.getCell('B2');
  header.value = '📊 MARKET CAP DISTRIBUTION';
  Object.assign(header, STYLES.header);
  sheet.getRow(2).height = 35;

  const maxCap = Math.max(...topCoins.map(c => c.market_cap || 0));

  topCoins.forEach((coin: any, i: number) => {
    const row = 4 + i;
    const barWidth = Math.round((coin.market_cap / maxCap) * 40);
    const change = coin.price_change_percentage_24h || 0;

    sheet.getCell(`B${row}`).value = coin.symbol?.toUpperCase();
    sheet.getCell(`B${row}`).font = { bold: true };

    sheet.getCell(`C${row}`).value = '█'.repeat(Math.max(1, barWidth));
    sheet.getCell(`C${row}`).font = { color: { argb: change >= 0 ? COLORS.success : COLORS.danger } };

    sheet.getCell(`D${row}`).value = formatCompact(coin.market_cap);
    sheet.getCell(`D${row}`).alignment = { horizontal: 'right' };
  });

  // 24h Change comparison
  sheet.getCell('B26').value = '📈 24H PRICE CHANGE COMPARISON';
  sheet.getCell('B26').font = { bold: true, size: 14, color: { argb: COLORS.primary } };

  const sorted = [...topCoins].sort((a, b) =>
    (b.price_change_percentage_24h || 0) - (a.price_change_percentage_24h || 0)
  );

  sorted.forEach((coin: any, i: number) => {
    const row = 28 + i;
    const change = coin.price_change_percentage_24h || 0;
    const barWidth = Math.abs(Math.round(change * 2));

    sheet.getCell(`B${row}`).value = coin.symbol?.toUpperCase();
    sheet.getCell(`B${row}`).font = { bold: true };

    if (change >= 0) {
      sheet.getCell(`C${row}`).value = '▓'.repeat(Math.max(1, barWidth));
      sheet.getCell(`C${row}`).font = { color: { argb: COLORS.success } };
    } else {
      sheet.getCell(`C${row}`).value = '░'.repeat(Math.max(1, barWidth));
      sheet.getCell(`C${row}`).font = { color: { argb: COLORS.danger } };
    }

    sheet.getCell(`D${row}`).value = formatPercent(change);
    sheet.getCell(`D${row}`).font = { bold: true, color: { argb: change >= 0 ? COLORS.success : COLORS.danger } };
  });
}

// ============================================
// PORTFOLIO SHEET
// ============================================

function addPortfolioSheet(workbook: ExcelJS.Workbook, marketData: any[], coins: string[]) {
  const sheet = workbook.addWorksheet('Portfolio', {
    properties: { tabColor: { argb: COLORS.purple } }
  });

  sheet.getColumn('A').width = 3;
  sheet.getColumn('B').width = 18;  // Coin
  sheet.getColumn('C').width = 14;  // Holdings (editable)
  sheet.getColumn('D').width = 14;  // Avg Cost (editable)
  sheet.getColumn('E').width = 14;  // Current Price
  sheet.getColumn('F').width = 16;  // Current Value
  sheet.getColumn('G').width = 14;  // Cost Basis
  sheet.getColumn('H').width = 14;  // P/L $
  sheet.getColumn('I').width = 12;  // P/L %
  sheet.getColumn('J').width = 12;  // 24h %
  sheet.getColumn('K').width = 14;  // 24h P/L

  // Header
  sheet.mergeCells('B2:K2');
  const header = sheet.getCell('B2');
  header.value = '💼 PORTFOLIO TRACKER';
  Object.assign(header, STYLES.header);
  sheet.getRow(2).height = 40;

  // Instructions
  sheet.mergeCells('B3:K3');
  sheet.getCell('B3').value = '💡 Edit the yellow cells (Holdings & Avg Cost) to track your portfolio';
  sheet.getCell('B3').font = { italic: true, color: { argb: COLORS.light } };
  sheet.getCell('B3').alignment = { horizontal: 'center' };

  // Column headers
  const headers = ['Coin', 'Holdings', 'Avg Cost', 'Price', 'Value', 'Cost Basis', 'P/L $', 'P/L %', '24h %', '24h P/L'];
  headers.forEach((h, i) => {
    const cell = sheet.getCell(5, i + 2);
    cell.value = h;
    Object.assign(cell, STYLES.columnHeader);
  });

  // Data rows
  let totalValue = 0;
  let totalCost = 0;
  let totalPL24h = 0;

  coins.forEach((coinId, i) => {
    const coin = marketData.find((c: any) => c.id === coinId);
    if (!coin) return;

    const row = 6 + i;
    const holdings = 1;  // Default
    const avgCost = coin.current_price * 0.9;  // Default: 10% below current
    const value = holdings * coin.current_price;
    const costBasis = holdings * avgCost;
    const pl = value - costBasis;
    const plPercent = (pl / costBasis) * 100;
    const change24h = coin.price_change_percentage_24h || 0;
    const pl24h = value * (change24h / 100);

    totalValue += value;
    totalCost += costBasis;
    totalPL24h += pl24h;

    sheet.getCell(`B${row}`).value = coin.name;
    sheet.getCell(`B${row}`).font = { bold: true };

    // Editable cells (highlighted)
    const holdingsCell = sheet.getCell(`C${row}`);
    holdingsCell.value = holdings;
    holdingsCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFF3CD' } };
    holdingsCell.border = { top: { style: 'thin' }, bottom: { style: 'thin' }, left: { style: 'thin' }, right: { style: 'thin' } };

    const avgCostCell = sheet.getCell(`D${row}`);
    avgCostCell.value = avgCost;
    avgCostCell.numFmt = '$#,##0.00';
    avgCostCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFF3CD' } };
    avgCostCell.border = { top: { style: 'thin' }, bottom: { style: 'thin' }, left: { style: 'thin' }, right: { style: 'thin' } };

    sheet.getCell(`E${row}`).value = coin.current_price;
    sheet.getCell(`E${row}`).numFmt = '$#,##0.00';

    sheet.getCell(`F${row}`).value = value;
    sheet.getCell(`F${row}`).numFmt = '$#,##0.00';
    sheet.getCell(`F${row}`).font = { bold: true };

    sheet.getCell(`G${row}`).value = costBasis;
    sheet.getCell(`G${row}`).numFmt = '$#,##0.00';

    const plCell = sheet.getCell(`H${row}`);
    plCell.value = pl;
    plCell.numFmt = '$#,##0.00';
    plCell.font = { bold: true, color: { argb: pl >= 0 ? COLORS.success : COLORS.danger } };

    const plPctCell = sheet.getCell(`I${row}`);
    plPctCell.value = plPercent / 100;
    plPctCell.numFmt = '0.00%';
    plPctCell.font = { color: { argb: plPercent >= 0 ? COLORS.success : COLORS.danger } };

    const change24hCell = sheet.getCell(`J${row}`);
    change24hCell.value = change24h / 100;
    change24hCell.numFmt = '0.00%';
    change24hCell.font = { color: { argb: change24h >= 0 ? COLORS.success : COLORS.danger } };

    const pl24hCell = sheet.getCell(`K${row}`);
    pl24hCell.value = pl24h;
    pl24hCell.numFmt = '$#,##0.00';
    pl24hCell.font = { color: { argb: pl24h >= 0 ? COLORS.success : COLORS.danger } };
  });

  // Totals row
  const totalRow = 6 + coins.length + 1;
  sheet.getCell(`B${totalRow}`).value = 'TOTAL';
  sheet.getCell(`B${totalRow}`).font = { bold: true, size: 14 };

  sheet.getCell(`F${totalRow}`).value = totalValue;
  sheet.getCell(`F${totalRow}`).numFmt = '$#,##0.00';
  sheet.getCell(`F${totalRow}`).font = { bold: true, size: 14, color: { argb: COLORS.primary } };

  sheet.getCell(`G${totalRow}`).value = totalCost;
  sheet.getCell(`G${totalRow}`).numFmt = '$#,##0.00';
  sheet.getCell(`G${totalRow}`).font = { bold: true };

  const totalPL = totalValue - totalCost;
  sheet.getCell(`H${totalRow}`).value = totalPL;
  sheet.getCell(`H${totalRow}`).numFmt = '$#,##0.00';
  sheet.getCell(`H${totalRow}`).font = { bold: true, size: 14, color: { argb: totalPL >= 0 ? COLORS.success : COLORS.danger } };

  sheet.getCell(`K${totalRow}`).value = totalPL24h;
  sheet.getCell(`K${totalRow}`).numFmt = '$#,##0.00';
  sheet.getCell(`K${totalRow}`).font = { bold: true, color: { argb: totalPL24h >= 0 ? COLORS.success : COLORS.danger } };
}

function addPortfolioChartSheet(workbook: ExcelJS.Workbook) {
  // Placeholder for portfolio allocation chart
  const sheet = workbook.addWorksheet('Portfolio_Chart');
  sheet.getCell('B2').value = '📊 Portfolio Allocation';
  sheet.getCell('B2').font = { bold: true, size: 16, color: { argb: COLORS.primary } };
  sheet.getCell('B4').value = 'Chart will be generated based on your portfolio holdings.';
  sheet.getCell('B5').value = 'Edit the Portfolio sheet to see your allocation.';
}

// ============================================
// FEAR & GREED SHEET
// ============================================

function addFearGreedSheet(workbook: ExcelJS.Workbook, fearGreedData: any[]) {
  const sheet = workbook.addWorksheet('Fear_Greed', {
    properties: { tabColor: { argb: COLORS.warning } }
  });

  sheet.getColumn('A').width = 3;
  sheet.getColumn('B').width = 20;
  sheet.getColumn('C').width = 12;
  sheet.getColumn('D').width = 20;
  sheet.getColumn('E').width = 30;

  // Header
  sheet.mergeCells('B2:E2');
  const header = sheet.getCell('B2');
  header.value = '😱 CRYPTO FEAR & GREED INDEX';
  Object.assign(header, STYLES.header);
  sheet.getRow(2).height = 40;

  // Current value highlight
  if (fearGreedData.length > 0) {
    const current = fearGreedData[0];
    const value = parseInt(current.value);
    const classification = current.value_classification;

    sheet.mergeCells('B4:C4');
    sheet.getCell('B4').value = 'CURRENT:';
    sheet.getCell('B4').font = { bold: true, size: 16 };

    sheet.mergeCells('D4:E4');
    const valueCell = sheet.getCell('D4');
    valueCell.value = `${value} - ${classification.toUpperCase()}`;
    valueCell.font = { bold: true, size: 24, color: { argb: getGaugeColor(value) } };

    // Visual gauge
    sheet.getCell('B6').value = '0 = Extreme Fear';
    sheet.getCell('B6').font = { size: 10, color: { argb: COLORS.danger } };
    sheet.getCell('E6').value = '100 = Extreme Greed';
    sheet.getCell('E6').font = { size: 10, color: { argb: COLORS.success } };
    sheet.getCell('E6').alignment = { horizontal: 'right' };

    // Gauge bar
    sheet.mergeCells('B7:E7');
    const gaugeWidth = 50;
    const position = Math.round((value / 100) * gaugeWidth);
    let gauge = '░'.repeat(position) + '█' + '░'.repeat(gaugeWidth - position - 1);
    sheet.getCell('B7').value = gauge;
    sheet.getCell('B7').font = { size: 12, color: { argb: getGaugeColor(value) } };

    // Interpretation
    sheet.getCell('B9').value = getInterpretation(value);
    sheet.getCell('B9').font = { italic: true, color: { argb: COLORS.medium } };
  }

  // Historical data
  sheet.getCell('B12').value = '📅 HISTORICAL DATA (Last 90 Days)';
  sheet.getCell('B12').font = { bold: true, size: 14, color: { argb: COLORS.primary } };

  const histHeaders = ['Date', 'Value', 'Classification', 'Visual'];
  histHeaders.forEach((h, i) => {
    const cell = sheet.getCell(13, i + 2);
    cell.value = h;
    Object.assign(cell, STYLES.columnHeader);
  });

  fearGreedData.slice(0, 90).forEach((item: any, i: number) => {
    const row = 14 + i;
    const value = parseInt(item.value);
    const date = new Date(parseInt(item.timestamp) * 1000).toLocaleDateString();

    sheet.getCell(`B${row}`).value = date;

    const valueCell = sheet.getCell(`C${row}`);
    valueCell.value = value;
    valueCell.font = { bold: true, color: { argb: getGaugeColor(value) } };
    valueCell.alignment = { horizontal: 'center' };

    sheet.getCell(`D${row}`).value = item.value_classification;

    // Mini bar
    const barLen = Math.round(value / 5);
    sheet.getCell(`E${row}`).value = '█'.repeat(barLen);
    sheet.getCell(`E${row}`).font = { color: { argb: getGaugeColor(value) } };

    if (i % 2 === 0) {
      for (let col = 2; col <= 5; col++) {
        sheet.getCell(row, col).fill = STYLES.zebraEven.fill;
      }
    }
  });
}

function getInterpretation(value: number): string {
  if (value <= 20) return '💡 Extreme fear often signals buying opportunities - "Be greedy when others are fearful"';
  if (value <= 40) return '💡 Market is fearful - Could be a good time to accumulate';
  if (value <= 60) return '💡 Market sentiment is neutral - Wait for clearer signals';
  if (value <= 80) return '💡 Market is getting greedy - Consider taking some profits';
  return '💡 Extreme greed often precedes corrections - "Be fearful when others are greedy"';
}

// ============================================
// GAINERS & LOSERS SHEET
// ============================================

function addGainersLosersSheet(workbook: ExcelJS.Workbook, marketData: any[]) {
  const sorted = [...marketData].sort((a, b) =>
    (b.price_change_percentage_24h || 0) - (a.price_change_percentage_24h || 0)
  );

  const gainers = sorted.slice(0, 25);
  const losers = sorted.slice(-25).reverse();

  // Gainers sheet
  const gSheet = workbook.addWorksheet('Top_Gainers', {
    properties: { tabColor: { argb: COLORS.success } }
  });
  addMoverSheet(gSheet, gainers, '🚀 TOP 25 GAINERS (24h)', COLORS.success);

  // Losers sheet
  const lSheet = workbook.addWorksheet('Top_Losers', {
    properties: { tabColor: { argb: COLORS.danger } }
  });
  addMoverSheet(lSheet, losers, '📉 TOP 25 LOSERS (24h)', COLORS.danger);
}

function addMoverSheet(sheet: ExcelJS.Worksheet, data: any[], title: string, accentColor: string) {
  sheet.getColumn('A').width = 3;
  sheet.getColumn('B').width = 6;
  sheet.getColumn('C').width = 20;
  sheet.getColumn('D').width = 10;
  sheet.getColumn('E').width = 14;
  sheet.getColumn('F').width = 16;
  sheet.getColumn('G').width = 12;
  sheet.getColumn('H').width = 25;

  // Header
  sheet.mergeCells('B2:H2');
  const header = sheet.getCell('B2');
  header.value = title;
  header.font = { bold: true, size: 18, color: { argb: COLORS.white } };
  header.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: accentColor } };
  header.alignment = { horizontal: 'center', vertical: 'middle' };
  sheet.getRow(2).height = 40;

  // Column headers
  const headers = ['#', 'Name', 'Symbol', 'Price', 'Market Cap', '24h %', 'Visual'];
  headers.forEach((h, i) => {
    const cell = sheet.getCell(4, i + 2);
    cell.value = h;
    Object.assign(cell, STYLES.columnHeader);
  });

  // Data
  data.forEach((coin: any, i: number) => {
    const row = 5 + i;
    const change = coin.price_change_percentage_24h || 0;
    const barWidth = Math.min(Math.abs(Math.round(change)), 25);

    sheet.getCell(`B${row}`).value = i + 1;
    sheet.getCell(`B${row}`).alignment = { horizontal: 'center' };

    sheet.getCell(`C${row}`).value = coin.name;
    sheet.getCell(`C${row}`).font = { bold: true };

    sheet.getCell(`D${row}`).value = coin.symbol?.toUpperCase();
    sheet.getCell(`E${row}`).value = formatPrice(coin.current_price);
    sheet.getCell(`F${row}`).value = formatCompact(coin.market_cap);

    const changeCell = sheet.getCell(`G${row}`);
    changeCell.value = formatPercent(change);
    changeCell.font = { bold: true, color: { argb: accentColor } };

    sheet.getCell(`H${row}`).value = '█'.repeat(Math.max(1, barWidth));
    sheet.getCell(`H${row}`).font = { color: { argb: accentColor } };

    if (i % 2 === 0) {
      for (let col = 2; col <= 8; col++) {
        sheet.getCell(row, col).fill = STYLES.zebraEven.fill;
      }
    }
  });
}

// ============================================
// TRENDING SHEET
// ============================================

function addTrendingSheet(workbook: ExcelJS.Workbook, trendingData: any[], marketData: any[]) {
  const sheet = workbook.addWorksheet('Trending', {
    properties: { tabColor: { argb: COLORS.warning } }
  });

  sheet.getColumn('A').width = 3;
  sheet.getColumn('B').width = 8;
  sheet.getColumn('C').width = 25;
  sheet.getColumn('D').width = 10;
  sheet.getColumn('E').width = 12;
  sheet.getColumn('F').width = 16;
  sheet.getColumn('G').width = 14;

  // Header
  sheet.mergeCells('B2:G2');
  const header = sheet.getCell('B2');
  header.value = '🔥 TRENDING CRYPTOCURRENCIES';
  header.font = { bold: true, size: 18, color: { argb: COLORS.white } };
  header.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.warning } };
  header.alignment = { horizontal: 'center', vertical: 'middle' };
  sheet.getRow(2).height = 40;

  sheet.getCell('B3').value = 'Based on search volume and social activity in the last 24 hours';
  sheet.getCell('B3').font = { italic: true, color: { argb: COLORS.light } };

  // Column headers
  const headers = ['Trend', 'Name', 'Symbol', 'Rank', 'Market Cap', 'Score'];
  headers.forEach((h, i) => {
    const cell = sheet.getCell(5, i + 2);
    cell.value = h;
    Object.assign(cell, STYLES.columnHeader);
  });

  // Data
  trendingData.forEach((item: any, i: number) => {
    const coin = item.item;
    const row = 6 + i;

    sheet.getCell(`B${row}`).value = `🔥 #${i + 1}`;
    sheet.getCell(`B${row}`).font = { bold: true };

    sheet.getCell(`C${row}`).value = coin?.name || 'Unknown';
    sheet.getCell(`C${row}`).font = { bold: true };

    sheet.getCell(`D${row}`).value = coin?.symbol?.toUpperCase() || 'N/A';
    sheet.getCell(`E${row}`).value = coin?.market_cap_rank || 'N/A';
    sheet.getCell(`E${row}`).alignment = { horizontal: 'center' };

    // Try to get market cap from market data
    const marketCoin = marketData.find((m: any) => m.id === coin?.id);
    sheet.getCell(`F${row}`).value = marketCoin ? formatCompact(marketCoin.market_cap) : 'N/A';

    sheet.getCell(`G${row}`).value = coin?.score !== undefined ? coin.score : 'N/A';

    if (i % 2 === 0) {
      for (let col = 2; col <= 7; col++) {
        sheet.getCell(row, col).fill = STYLES.zebraEven.fill;
      }
    }
  });
}

// ============================================
// DEFI SHEET
// ============================================

function addDeFiSheet(workbook: ExcelJS.Workbook, defiData: any, marketData: any[]) {
  const sheet = workbook.addWorksheet('DeFi', {
    properties: { tabColor: { argb: COLORS.purple } }
  });

  sheet.getColumn('A').width = 3;
  sheet.getColumn('B').width = 30;
  sheet.getColumn('C').width = 25;
  sheet.getColumn('D').width = 25;

  // Header
  sheet.mergeCells('B2:D2');
  const header = sheet.getCell('B2');
  header.value = '🏦 DEFI DASHBOARD';
  header.font = { bold: true, size: 18, color: { argb: COLORS.white } };
  header.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.purple } };
  header.alignment = { horizontal: 'center', vertical: 'middle' };
  sheet.getRow(2).height = 40;

  // DeFi Stats
  sheet.getCell('B4').value = '📊 DEFI MARKET OVERVIEW';
  sheet.getCell('B4').font = { bold: true, size: 14, color: { argb: COLORS.purple } };

  const stats = [
    ['DeFi Market Cap', formatCurrency(parseFloat(defiData?.defi_market_cap || '0'))],
    ['DeFi to ETH Ratio', `${parseFloat(defiData?.defi_to_eth_ratio || '0').toFixed(4)}`],
    ['DeFi Dominance', `${parseFloat(defiData?.defi_dominance || '0').toFixed(2)}%`],
    ['ETH Market Cap', formatCurrency(parseFloat(defiData?.eth_market_cap || '0'))],
    ['Top DeFi Protocol', defiData?.top_coin_name || 'Unknown'],
  ];

  stats.forEach(([label, value], i) => {
    const row = 5 + i;
    sheet.getCell(`B${row}`).value = label;
    sheet.getCell(`B${row}`).font = { color: { argb: COLORS.medium } };
    sheet.getCell(`C${row}`).value = value;
    sheet.getCell(`C${row}`).font = { bold: true, color: { argb: COLORS.purple } };
  });

  // Top DeFi Protocols
  sheet.getCell('B12').value = '🏛️ TOP DEFI PROTOCOLS';
  sheet.getCell('B12').font = { bold: true, size: 14, color: { argb: COLORS.purple } };

  const defiCoins = marketData.filter((c: any) =>
    ['uniswap', 'aave', 'maker', 'compound', 'curve-dao-token', 'sushi', 'yearn-finance', 'synthetix-network-token', 'pancakeswap-token', '1inch', 'lido-dao', 'chainlink'].includes(c.id)
  );

  const defiHeaders = ['Protocol', 'Price', 'Market Cap', '24h %'];
  defiHeaders.forEach((h, i) => {
    const cell = sheet.getCell(13, i + 2);
    cell.value = h;
    Object.assign(cell, STYLES.columnHeader);
  });

  (defiCoins.length > 0 ? defiCoins : marketData.slice(0, 15)).forEach((coin: any, i: number) => {
    const row = 14 + i;
    const change = coin.price_change_percentage_24h || 0;

    sheet.getCell(`B${row}`).value = coin.name;
    sheet.getCell(`B${row}`).font = { bold: true };
    sheet.getCell(`C${row}`).value = formatPrice(coin.current_price);
    sheet.getCell(`D${row}`).value = formatCompact(coin.market_cap);

    const changeCell = sheet.getCell(`E${row}`);
    changeCell.value = formatPercent(change);
    changeCell.font = { color: { argb: change >= 0 ? COLORS.success : COLORS.danger } };

    if (i % 2 === 0) {
      for (let col = 2; col <= 5; col++) {
        sheet.getCell(row, col).fill = STYLES.zebraEven.fill;
      }
    }
  });
}

// ============================================
// DERIVATIVES SHEET
// ============================================

function addDerivativesSheet(workbook: ExcelJS.Workbook, derivativesData: any[]) {
  const sheet = workbook.addWorksheet('Derivatives', {
    properties: { tabColor: { argb: COLORS.cyan } }
  });

  sheet.getColumn('A').width = 3;
  sheet.getColumn('B').width = 20;
  sheet.getColumn('C').width = 20;
  sheet.getColumn('D').width = 14;
  sheet.getColumn('E').width = 14;
  sheet.getColumn('F').width = 14;
  sheet.getColumn('G').width = 14;

  // Header
  sheet.mergeCells('B2:G2');
  const header = sheet.getCell('B2');
  header.value = '📈 DERIVATIVES MARKET';
  header.font = { bold: true, size: 18, color: { argb: COLORS.white } };
  header.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.cyan } };
  header.alignment = { horizontal: 'center', vertical: 'middle' };
  sheet.getRow(2).height = 40;

  // Column headers
  const headers = ['Exchange', 'Symbol', 'Price', 'Index', 'Basis', '24h Vol'];
  headers.forEach((h, i) => {
    const cell = sheet.getCell(4, i + 2);
    cell.value = h;
    Object.assign(cell, STYLES.columnHeader);
  });

  // Data
  derivativesData.slice(0, 50).forEach((item: any, i: number) => {
    const row = 5 + i;

    sheet.getCell(`B${row}`).value = item.market || 'Unknown';
    sheet.getCell(`C${row}`).value = item.symbol || 'N/A';
    sheet.getCell(`D${row}`).value = item.price ? `$${parseFloat(item.price).toLocaleString()}` : 'N/A';
    sheet.getCell(`E${row}`).value = item.index ? `$${parseFloat(item.index).toLocaleString()}` : 'N/A';
    sheet.getCell(`F${row}`).value = item.basis ? `${parseFloat(item.basis).toFixed(2)}%` : 'N/A';
    sheet.getCell(`G${row}`).value = item.volume_24h ? formatCompact(item.volume_24h) : 'N/A';

    if (i % 2 === 0) {
      for (let col = 2; col <= 7; col++) {
        sheet.getCell(row, col).fill = STYLES.zebraEven.fill;
      }
    }
  });
}

// ============================================
// EXCHANGES SHEET
// ============================================

function addExchangesSheet(workbook: ExcelJS.Workbook, exchangesData: any[]) {
  const sheet = workbook.addWorksheet('Exchanges', {
    properties: { tabColor: { argb: COLORS.info } }
  });

  sheet.getColumn('A').width = 3;
  sheet.getColumn('B').width = 6;
  sheet.getColumn('C').width = 25;
  sheet.getColumn('D').width = 18;
  sheet.getColumn('E').width = 14;
  sheet.getColumn('F').width = 12;
  sheet.getColumn('G').width = 8;

  // Header
  sheet.mergeCells('B2:G2');
  const header = sheet.getCell('B2');
  header.value = '🏛️ TOP CRYPTOCURRENCY EXCHANGES';
  header.font = { bold: true, size: 18, color: { argb: COLORS.white } };
  header.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.info } };
  header.alignment = { horizontal: 'center', vertical: 'middle' };
  sheet.getRow(2).height = 40;

  // Column headers
  const headers = ['#', 'Exchange', '24h Volume (BTC)', 'Trust Score', 'Year Est.', 'Country'];
  headers.forEach((h, i) => {
    const cell = sheet.getCell(4, i + 2);
    cell.value = h;
    Object.assign(cell, STYLES.columnHeader);
  });

  // Data
  exchangesData.slice(0, 50).forEach((exchange: any, i: number) => {
    const row = 5 + i;

    sheet.getCell(`B${row}`).value = i + 1;
    sheet.getCell(`B${row}`).alignment = { horizontal: 'center' };

    sheet.getCell(`C${row}`).value = exchange.name || 'Unknown';
    sheet.getCell(`C${row}`).font = { bold: true };

    sheet.getCell(`D${row}`).value = exchange.trade_volume_24h_btc
      ? `₿ ${Math.round(exchange.trade_volume_24h_btc).toLocaleString()}`
      : 'N/A';

    const trustCell = sheet.getCell(`E${row}`);
    trustCell.value = exchange.trust_score || 'N/A';
    if (exchange.trust_score >= 8) {
      trustCell.font = { bold: true, color: { argb: COLORS.success } };
    } else if (exchange.trust_score >= 5) {
      trustCell.font = { color: { argb: COLORS.warning } };
    } else {
      trustCell.font = { color: { argb: COLORS.danger } };
    }
    trustCell.alignment = { horizontal: 'center' };

    sheet.getCell(`F${row}`).value = exchange.year_established || 'N/A';
    sheet.getCell(`F${row}`).alignment = { horizontal: 'center' };

    sheet.getCell(`G${row}`).value = exchange.country || 'N/A';

    if (i % 2 === 0) {
      for (let col = 2; col <= 7; col++) {
        sheet.getCell(row, col).fill = STYLES.zebraEven.fill;
      }
    }
  });
}

// ============================================
// CATEGORIES SHEET
// ============================================

function addCategoriesSheet(workbook: ExcelJS.Workbook, categoriesData: any[]) {
  const sheet = workbook.addWorksheet('Categories', {
    properties: { tabColor: { argb: COLORS.pink } }
  });

  sheet.getColumn('A').width = 3;
  sheet.getColumn('B').width = 30;
  sheet.getColumn('C').width = 18;
  sheet.getColumn('D').width = 18;
  sheet.getColumn('E').width = 14;
  sheet.getColumn('F').width = 10;

  // Header
  sheet.mergeCells('B2:F2');
  const header = sheet.getCell('B2');
  header.value = '📁 CRYPTO CATEGORIES & SECTORS';
  header.font = { bold: true, size: 18, color: { argb: COLORS.white } };
  header.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.pink } };
  header.alignment = { horizontal: 'center', vertical: 'middle' };
  sheet.getRow(2).height = 40;

  // Column headers
  const headers = ['Category', 'Market Cap', '24h Volume', '24h Change', 'Coins'];
  headers.forEach((h, i) => {
    const cell = sheet.getCell(4, i + 2);
    cell.value = h;
    Object.assign(cell, STYLES.columnHeader);
  });

  // Data
  categoriesData.slice(0, 50).forEach((cat: any, i: number) => {
    const row = 5 + i;
    const change = cat.market_cap_change_24h || 0;

    sheet.getCell(`B${row}`).value = cat.name || 'Unknown';
    sheet.getCell(`B${row}`).font = { bold: true };

    sheet.getCell(`C${row}`).value = cat.market_cap ? formatCompact(cat.market_cap) : 'N/A';
    sheet.getCell(`D${row}`).value = cat.volume_24h ? formatCompact(cat.volume_24h) : 'N/A';

    const changeCell = sheet.getCell(`E${row}`);
    changeCell.value = formatPercent(change);
    changeCell.font = { color: { argb: change >= 0 ? COLORS.success : COLORS.danger } };

    sheet.getCell(`F${row}`).value = cat.coins_count || 'N/A';
    sheet.getCell(`F${row}`).alignment = { horizontal: 'center' };

    if (i % 2 === 0) {
      for (let col = 2; col <= 6; col++) {
        sheet.getCell(row, col).fill = STYLES.zebraEven.fill;
      }
    }
  });
}

// ============================================
// NFT SHEET
// ============================================

function addNFTSheet(workbook: ExcelJS.Workbook, nftData: any[]) {
  const sheet = workbook.addWorksheet('NFTs', {
    properties: { tabColor: { argb: 'FFEC4899' } }
  });

  sheet.getColumn('A').width = 3;
  sheet.getColumn('B').width = 6;
  sheet.getColumn('C').width = 30;
  sheet.getColumn('D').width = 12;
  sheet.getColumn('E').width = 20;

  // Header
  sheet.mergeCells('B2:E2');
  const header = sheet.getCell('B2');
  header.value = '🖼️ NFT COLLECTIONS';
  header.font = { bold: true, size: 18, color: { argb: COLORS.white } };
  header.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFEC4899' } };
  header.alignment = { horizontal: 'center', vertical: 'middle' };
  sheet.getRow(2).height = 40;

  // Column headers
  const headers = ['#', 'Collection', 'Symbol', 'Platform'];
  headers.forEach((h, i) => {
    const cell = sheet.getCell(4, i + 2);
    cell.value = h;
    Object.assign(cell, STYLES.columnHeader);
  });

  // Data
  nftData.slice(0, 50).forEach((nft: any, i: number) => {
    const row = 5 + i;

    sheet.getCell(`B${row}`).value = i + 1;
    sheet.getCell(`B${row}`).alignment = { horizontal: 'center' };

    sheet.getCell(`C${row}`).value = nft.name || 'Unknown';
    sheet.getCell(`C${row}`).font = { bold: true };

    sheet.getCell(`D${row}`).value = nft.symbol || 'N/A';
    sheet.getCell(`E${row}`).value = nft.asset_platform_id || 'ethereum';

    if (i % 2 === 0) {
      for (let col = 2; col <= 5; col++) {
        sheet.getCell(row, col).fill = STYLES.zebraEven.fill;
      }
    }
  });
}

// ============================================
// CORRELATION SHEET
// ============================================

function addCorrelationSheet(workbook: ExcelJS.Workbook, marketData: any[]) {
  const sheet = workbook.addWorksheet('Correlation', {
    properties: { tabColor: { argb: COLORS.primary } }
  });

  const coins = marketData.slice(0, 15);
  const size = coins.length;

  // Set column widths
  sheet.getColumn('A').width = 3;
  sheet.getColumn('B').width = 10;
  for (let i = 0; i < size; i++) {
    sheet.getColumn(3 + i).width = 8;
  }

  // Header
  sheet.mergeCells(2, 2, 2, 2 + size);
  const header = sheet.getCell('B2');
  header.value = '🔗 ASSET CORRELATION MATRIX';
  Object.assign(header, STYLES.header);
  sheet.getRow(2).height = 40;

  sheet.getCell('B3').value = 'Based on 7-day price movements (simulated)';
  sheet.getCell('B3').font = { italic: true, color: { argb: COLORS.light } };

  // Column headers (coin symbols)
  coins.forEach((coin: any, i: number) => {
    const cell = sheet.getCell(5, 3 + i);
    cell.value = coin.symbol?.toUpperCase();
    cell.font = { bold: true, size: 9 };
    cell.alignment = { horizontal: 'center' };
  });

  // Row headers and correlation values
  coins.forEach((rowCoin: any, i: number) => {
    const row = 6 + i;
    sheet.getCell(`B${row}`).value = rowCoin.symbol?.toUpperCase();
    sheet.getCell(`B${row}`).font = { bold: true };

    coins.forEach((colCoin: any, j: number) => {
      const cell = sheet.getCell(row, 3 + j);

      // Simulate correlation based on price changes
      let corr: number;
      if (i === j) {
        corr = 1.0;
      } else {
        // Simplified correlation simulation
        const change1 = rowCoin.price_change_percentage_7d_in_currency || 0;
        const change2 = colCoin.price_change_percentage_7d_in_currency || 0;
        const baseCorr = 0.3 + (Math.min(Math.abs(change1 - change2), 10) / 10) * 0.4;
        corr = change1 * change2 > 0 ? baseCorr + 0.3 : baseCorr - 0.2;
        corr = Math.max(-1, Math.min(1, corr));
      }

      cell.value = corr.toFixed(2);
      cell.alignment = { horizontal: 'center' };

      // Color based on correlation
      if (corr >= 0.7) {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF22C55E' } };
        cell.font = { color: { argb: COLORS.white } };
      } else if (corr >= 0.3) {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF86EFAC' } };
      } else if (corr >= -0.3) {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF3F4F6' } };
      } else if (corr >= -0.7) {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFCA5A5' } };
      } else {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFEF4444' } };
        cell.font = { color: { argb: COLORS.white } };
      }
    });
  });

  // Legend
  const legendRow = 6 + size + 2;
  sheet.getCell(`B${legendRow}`).value = 'Legend:';
  sheet.getCell(`B${legendRow}`).font = { bold: true };

  const legendItems = [
    { label: 'Strong +', color: '22C55E' },
    { label: 'Moderate +', color: '86EFAC' },
    { label: 'Neutral', color: 'F3F4F6' },
    { label: 'Moderate -', color: 'FCA5A5' },
    { label: 'Strong -', color: 'EF4444' },
  ];

  legendItems.forEach((item, i) => {
    const col = 3 + i * 2;
    const cell = sheet.getCell(legendRow, col);
    cell.value = item.label;
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF' + item.color } };
    if (item.color === '22C55E' || item.color === 'EF4444') {
      cell.font = { color: { argb: COLORS.white }, size: 9 };
    } else {
      cell.font = { size: 9 };
    }
    cell.alignment = { horizontal: 'center' };
  });
}

// ============================================
// HEATMAP SHEET
// ============================================

function addHeatmapSheet(workbook: ExcelJS.Workbook, marketData: any[]) {
  const sheet = workbook.addWorksheet('Heatmap', {
    properties: { tabColor: { argb: COLORS.danger } }
  });

  // We'll create a grid heatmap of top coins
  const coins = marketData.slice(0, 50);
  const gridSize = Math.ceil(Math.sqrt(coins.length));

  sheet.getColumn('A').width = 3;
  for (let i = 0; i < gridSize; i++) {
    sheet.getColumn(2 + i).width = 12;
  }

  // Header
  sheet.mergeCells(2, 2, 2, 1 + gridSize);
  const header = sheet.getCell('B2');
  header.value = '🗺️ MARKET HEATMAP (24h Change)';
  Object.assign(header, STYLES.header);
  sheet.getRow(2).height = 40;

  // Create heatmap grid
  coins.forEach((coin: any, i: number) => {
    const row = 4 + Math.floor(i / gridSize);
    const col = 2 + (i % gridSize);
    const change = coin.price_change_percentage_24h || 0;

    const cell = sheet.getCell(row, col);
    cell.value = `${coin.symbol?.toUpperCase()}\n${formatPercent(change)}`;
    cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
    sheet.getRow(row).height = 40;

    // Color based on change
    let bgColor: string;
    if (change >= 10) bgColor = '166534';      // Dark green
    else if (change >= 5) bgColor = '22C55E';  // Green
    else if (change >= 2) bgColor = '86EFAC';  // Light green
    else if (change >= 0) bgColor = 'BBF7D0';  // Very light green
    else if (change >= -2) bgColor = 'FECACA'; // Very light red
    else if (change >= -5) bgColor = 'FCA5A5'; // Light red
    else if (change >= -10) bgColor = 'EF4444';// Red
    else bgColor = 'B91C1C';                    // Dark red

    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF' + bgColor } };

    if (change >= 5 || change <= -5) {
      cell.font = { bold: true, color: { argb: COLORS.white }, size: 9 };
    } else {
      cell.font = { size: 9 };
    }

    cell.border = {
      top: { style: 'thin', color: { argb: COLORS.white } },
      bottom: { style: 'thin', color: { argb: COLORS.white } },
      left: { style: 'thin', color: { argb: COLORS.white } },
      right: { style: 'thin', color: { argb: COLORS.white } },
    };
  });

  // Legend
  const legendRow = 4 + Math.ceil(coins.length / gridSize) + 2;
  sheet.getCell(`B${legendRow}`).value = 'Color Scale: Dark Green (+10%+) → Light Green → Light Red → Dark Red (-10%-)';
  sheet.getCell(`B${legendRow}`).font = { italic: true, color: { argb: COLORS.light } };
}

// ============================================
// SCREENER SHEET
// ============================================

function addScreenerSheet(workbook: ExcelJS.Workbook, marketData: any[]) {
  const sheet = workbook.addWorksheet('Screener', {
    properties: { tabColor: { argb: COLORS.medium } }
  });

  sheet.getColumn('A').width = 3;
  sheet.getColumn('B').width = 6;
  sheet.getColumn('C').width = 20;
  sheet.getColumn('D').width = 8;
  sheet.getColumn('E').width = 14;
  sheet.getColumn('F').width = 16;
  sheet.getColumn('G').width = 14;
  sheet.getColumn('H').width = 10;
  sheet.getColumn('I').width = 10;
  sheet.getColumn('J').width = 10;
  sheet.getColumn('K').width = 10;
  sheet.getColumn('L').width = 12;
  sheet.getColumn('M').width = 10;

  // Header
  sheet.mergeCells('B2:M2');
  const header = sheet.getCell('B2');
  header.value = '🔍 CRYPTO SCREENER';
  Object.assign(header, STYLES.header);
  sheet.getRow(2).height = 40;

  sheet.getCell('B3').value = '💡 Use Excel filters (Data → Filter) to screen for specific criteria';
  sheet.getCell('B3').font = { italic: true, color: { argb: COLORS.light } };

  // Column headers
  const headers = ['#', 'Name', 'Symbol', 'Price', 'Market Cap', 'Volume', '1h%', '24h%', '7d%', '30d%', 'ATH', 'From ATH'];
  headers.forEach((h, i) => {
    const cell = sheet.getCell(5, i + 2);
    cell.value = h;
    Object.assign(cell, STYLES.columnHeader);
  });

  // Data
  marketData.slice(0, 100).forEach((coin: any, i: number) => {
    const row = 6 + i;
    const change1h = coin.price_change_percentage_1h_in_currency || 0;
    const change24h = coin.price_change_percentage_24h || 0;
    const change7d = coin.price_change_percentage_7d_in_currency || 0;
    const change30d = coin.price_change_percentage_30d_in_currency || 0;
    const fromAth = ((coin.current_price - coin.ath) / coin.ath) * 100;

    sheet.getCell(`B${row}`).value = coin.market_cap_rank;
    sheet.getCell(`C${row}`).value = coin.name;
    sheet.getCell(`D${row}`).value = coin.symbol?.toUpperCase();
    sheet.getCell(`E${row}`).value = coin.current_price;
    sheet.getCell(`E${row}`).numFmt = '$#,##0.00';
    sheet.getCell(`F${row}`).value = coin.market_cap;
    sheet.getCell(`F${row}`).numFmt = '$#,##0';
    sheet.getCell(`G${row}`).value = coin.total_volume;
    sheet.getCell(`G${row}`).numFmt = '$#,##0';

    // Change columns with conditional formatting
    [
      { col: 'H', val: change1h },
      { col: 'I', val: change24h },
      { col: 'J', val: change7d },
      { col: 'K', val: change30d },
    ].forEach(({ col, val }) => {
      const cell = sheet.getCell(`${col}${row}`);
      cell.value = val / 100;
      cell.numFmt = '0.00%';
      cell.font = { color: { argb: val >= 0 ? COLORS.success : COLORS.danger } };
    });

    sheet.getCell(`L${row}`).value = coin.ath;
    sheet.getCell(`L${row}`).numFmt = '$#,##0.00';

    const athCell = sheet.getCell(`M${row}`);
    athCell.value = fromAth / 100;
    athCell.numFmt = '0.0%';
    athCell.font = { color: { argb: COLORS.danger } };

    if (i % 2 === 0) {
      for (let col = 2; col <= 13; col++) {
        sheet.getCell(row, col).fill = STYLES.zebraEven.fill;
      }
    }
  });

  // Enable auto-filter
  sheet.autoFilter = {
    from: { row: 5, column: 2 },
    to: { row: 5 + marketData.length, column: 13 },
  };

  // Freeze header
  sheet.views = [{ state: 'frozen', ySplit: 5 }];
}

// ============================================
// STABLECOINS SHEET
// ============================================

function addStablecoinsSheet(workbook: ExcelJS.Workbook, marketData: any[]) {
  const sheet = workbook.addWorksheet('Stablecoins', {
    properties: { tabColor: { argb: COLORS.success } }
  });

  const stablecoins = marketData.filter((c: any) =>
    ['tether', 'usd-coin', 'dai', 'binance-usd', 'trueusd', 'paxos-standard', 'usdd', 'frax', 'first-digital-usd', 'paypal-usd'].includes(c.id)
  );

  sheet.getColumn('A').width = 3;
  sheet.getColumn('B').width = 25;
  sheet.getColumn('C').width = 10;
  sheet.getColumn('D').width = 12;
  sheet.getColumn('E').width = 18;
  sheet.getColumn('F').width = 16;
  sheet.getColumn('G').width = 12;

  // Header
  sheet.mergeCells('B2:G2');
  const header = sheet.getCell('B2');
  header.value = '💵 STABLECOINS';
  Object.assign(header, STYLES.header);
  sheet.getRow(2).height = 40;

  // Total market cap
  const totalCap = stablecoins.reduce((sum, c) => sum + (c.market_cap || 0), 0);
  sheet.getCell('B4').value = 'Total Stablecoin Market Cap:';
  sheet.getCell('B4').font = { bold: true };
  sheet.getCell('D4').value = formatCurrency(totalCap);
  sheet.getCell('D4').font = { bold: true, color: { argb: COLORS.primary } };

  // Column headers
  const headers = ['Stablecoin', 'Symbol', 'Price', 'Market Cap', 'Volume 24h', 'Peg Δ'];
  headers.forEach((h, i) => {
    const cell = sheet.getCell(6, i + 2);
    cell.value = h;
    Object.assign(cell, STYLES.columnHeader);
  });

  // Data
  stablecoins.forEach((coin: any, i: number) => {
    const row = 7 + i;
    const pegDelta = (coin.current_price - 1) * 100;

    sheet.getCell(`B${row}`).value = coin.name;
    sheet.getCell(`B${row}`).font = { bold: true };
    sheet.getCell(`C${row}`).value = coin.symbol?.toUpperCase();
    sheet.getCell(`D${row}`).value = `$${coin.current_price?.toFixed(4)}`;
    sheet.getCell(`E${row}`).value = formatCompact(coin.market_cap);
    sheet.getCell(`F${row}`).value = formatCompact(coin.total_volume);

    const pegCell = sheet.getCell(`G${row}`);
    pegCell.value = `${pegDelta >= 0 ? '+' : ''}${pegDelta.toFixed(3)}%`;
    pegCell.font = { color: { argb: Math.abs(pegDelta) < 0.1 ? COLORS.success : COLORS.warning } };

    if (i % 2 === 0) {
      for (let col = 2; col <= 7; col++) {
        sheet.getCell(row, col).fill = STYLES.zebraEven.fill;
      }
    }
  });
}

// ============================================
// TECHNICAL ANALYSIS SHEET
// ============================================

async function addTechnicalSheet(workbook: ExcelJS.Workbook, coin: string, days: number) {
  const sheet = workbook.addWorksheet('Technical', {
    properties: { tabColor: { argb: COLORS.cyan } }
  });

  // Fetch OHLC data
  let ohlcData: any[] = [];
  try {
    const res = await fetch(`https://api.coingecko.com/api/v3/coins/${coin}/ohlc?vs_currency=usd&days=${days}`);
    ohlcData = await res.json();
  } catch {}

  sheet.getColumn('A').width = 3;
  sheet.getColumn('B').width = 18;
  sheet.getColumn('C').width = 12;
  sheet.getColumn('D').width = 12;
  sheet.getColumn('E').width = 12;
  sheet.getColumn('F').width = 12;
  sheet.getColumn('G').width = 10;
  sheet.getColumn('H').width = 25;

  // Header
  sheet.mergeCells('B2:H2');
  const header = sheet.getCell('B2');
  header.value = `📈 ${coin.toUpperCase()} TECHNICAL ANALYSIS`;
  Object.assign(header, STYLES.header);
  sheet.getRow(2).height = 40;

  // Summary stats
  if (ohlcData.length > 0) {
    const lastClose = ohlcData[ohlcData.length - 1][4];
    const firstClose = ohlcData[0][4];
    const periodChange = ((lastClose - firstClose) / firstClose) * 100;
    const high = Math.max(...ohlcData.map(d => d[2]));
    const low = Math.min(...ohlcData.map(d => d[3]));

    sheet.getCell('B4').value = `Period: ${days} days`;
    sheet.getCell('B4').font = { italic: true, color: { argb: COLORS.light } };

    const stats = [
      ['Current Price', formatPrice(lastClose)],
      ['Period High', formatPrice(high)],
      ['Period Low', formatPrice(low)],
      ['Period Change', formatPercent(periodChange)],
      ['Range', formatPrice(high - low)],
    ];

    stats.forEach(([label, value], i) => {
      sheet.getCell(`B${6 + i}`).value = label;
      sheet.getCell(`B${6 + i}`).font = { color: { argb: COLORS.medium } };
      sheet.getCell(`C${6 + i}`).value = value;
      sheet.getCell(`C${6 + i}`).font = { bold: true };
    });
  }

  // OHLC Data table
  sheet.getCell('B13').value = '📊 OHLC DATA';
  sheet.getCell('B13').font = { bold: true, size: 14, color: { argb: COLORS.primary } };

  const ohlcHeaders = ['DateTime', 'Open', 'High', 'Low', 'Close', 'Change', 'Candle'];
  ohlcHeaders.forEach((h, i) => {
    const cell = sheet.getCell(14, i + 2);
    cell.value = h;
    Object.assign(cell, STYLES.columnHeader);
  });

  ohlcData.slice(-50).forEach((item: number[], i: number) => {
    const row = 15 + i;
    const open = item[1];
    const high = item[2];
    const low = item[3];
    const close = item[4];
    const change = ((close - open) / open) * 100;
    const isGreen = close >= open;

    sheet.getCell(`B${row}`).value = new Date(item[0]).toLocaleDateString();
    sheet.getCell(`C${row}`).value = open;
    sheet.getCell(`C${row}`).numFmt = '$#,##0.00';
    sheet.getCell(`D${row}`).value = high;
    sheet.getCell(`D${row}`).numFmt = '$#,##0.00';
    sheet.getCell(`E${row}`).value = low;
    sheet.getCell(`E${row}`).numFmt = '$#,##0.00';
    sheet.getCell(`F${row}`).value = close;
    sheet.getCell(`F${row}`).numFmt = '$#,##0.00';
    sheet.getCell(`F${row}`).font = { bold: true, color: { argb: isGreen ? COLORS.success : COLORS.danger } };

    const changeCell = sheet.getCell(`G${row}`);
    changeCell.value = formatPercent(change);
    changeCell.font = { color: { argb: isGreen ? COLORS.success : COLORS.danger } };

    // Visual candle
    const candleCell = sheet.getCell(`H${row}`);
    const bodyLen = Math.round(Math.abs(change) * 2);
    candleCell.value = isGreen ? '▲'.repeat(Math.max(1, bodyLen)) : '▼'.repeat(Math.max(1, bodyLen));
    candleCell.font = { color: { argb: isGreen ? COLORS.success : COLORS.danger } };

    if (i % 2 === 0) {
      for (let col = 2; col <= 8; col++) {
        sheet.getCell(row, col).fill = STYLES.zebraEven.fill;
      }
    }
  });
}

// ============================================
// PLACEHOLDER SHEETS
// ============================================

function addETFSheet(workbook: ExcelJS.Workbook) {
  const sheet = workbook.addWorksheet('ETF_Tracker', {
    properties: { tabColor: { argb: COLORS.info } }
  });

  sheet.getColumn('B').width = 40;
  sheet.getColumn('C').width = 25;

  sheet.mergeCells('B2:C2');
  const header = sheet.getCell('B2');
  header.value = '📈 BITCOIN & CRYPTO ETF TRACKER';
  Object.assign(header, STYLES.header);
  sheet.getRow(2).height = 40;

  sheet.getCell('B4').value = 'ETF data requires premium API access.';
  sheet.getCell('B5').value = 'Connect your Pro CoinGecko API key for ETF tracking.';
  sheet.getCell('B7').value = 'Popular Bitcoin ETFs:';
  sheet.getCell('B7').font = { bold: true };

  const etfs = ['IBIT (BlackRock)', 'FBTC (Fidelity)', 'GBTC (Grayscale)', 'BITB (Bitwise)', 'ARKB (ARK)'];
  etfs.forEach((etf, i) => {
    sheet.getCell(`B${8 + i}`).value = `• ${etf}`;
  });
}

function addWhaleSheet(workbook: ExcelJS.Workbook) {
  const sheet = workbook.addWorksheet('Whale_Tracker', {
    properties: { tabColor: { argb: COLORS.warning } }
  });

  sheet.getColumn('B').width = 40;

  sheet.mergeCells('B2:D2');
  const header = sheet.getCell('B2');
  header.value = '🐋 WHALE TRANSACTION TRACKER';
  Object.assign(header, STYLES.header);
  sheet.getRow(2).height = 40;

  sheet.getCell('B4').value = 'Whale tracking requires on-chain data integration.';
  sheet.getCell('B5').value = 'Consider integrating with:';
  sheet.getCell('B7').value = '• Whale Alert API';
  sheet.getCell('B8').value = '• Glassnode';
  sheet.getCell('B9').value = '• Santiment';
}

function addOnChainSheet(workbook: ExcelJS.Workbook) {
  const sheet = workbook.addWorksheet('On_Chain', {
    properties: { tabColor: { argb: COLORS.purple } }
  });

  sheet.getColumn('B').width = 40;

  sheet.mergeCells('B2:D2');
  const header = sheet.getCell('B2');
  header.value = '⛓️ ON-CHAIN ANALYTICS';
  Object.assign(header, STYLES.header);
  sheet.getRow(2).height = 40;

  sheet.getCell('B4').value = 'On-chain metrics require specialized data providers.';
  sheet.getCell('B5').value = 'Popular on-chain metrics:';

  const metrics = [
    'Active Addresses', 'Transaction Count', 'Hash Rate',
    'Mining Difficulty', 'Exchange Inflows/Outflows', 'HODL Waves',
    'MVRV Ratio', 'NVT Ratio', 'Realized Cap'
  ];
  metrics.forEach((m, i) => {
    sheet.getCell(`B${7 + i}`).value = `• ${m}`;
  });
}

function addRWASheet(workbook: ExcelJS.Workbook, marketData: any[]) {
  const sheet = workbook.addWorksheet('RWA_Tokens', {
    properties: { tabColor: { argb: 'FF06B6D4' } } // Cyan
  });

  // RWA (Real World Assets) tokens
  const rwaIds = ['ondo-finance', 'maker', 'centrifuge', 'goldfinch', 'maple', 'clearpool', 'truefi'];
  const rwaCoins = rwaIds.map(id => marketData.find((c: any) => c.id === id)).filter(Boolean);

  sheet.getColumn('A').width = 3;
  sheet.getColumn('B').width = 20;
  sheet.getColumn('C').width = 10;
  sheet.getColumn('D').width = 14;
  sheet.getColumn('E').width = 16;
  sheet.getColumn('F').width = 12;
  sheet.getColumn('G').width = 30;

  // Header
  sheet.mergeCells('B2:G2');
  const header = sheet.getCell('B2');
  header.value = '🏠 REAL WORLD ASSETS (RWA) TOKENS';
  Object.assign(header, STYLES.header);
  header.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF06B6D4' } };
  sheet.getRow(2).height = 40;

  sheet.mergeCells('B3:G3');
  sheet.getCell('B3').value = 'Tokens that tokenize real-world assets like real estate, bonds, commodities';
  sheet.getCell('B3').font = { italic: true, color: { argb: COLORS.light } };

  // Column headers
  const headers = ['Token', 'Symbol', 'Price', 'Market Cap', '24h %', 'Use Case'];
  headers.forEach((h, i) => {
    const cell = sheet.getCell(5, i + 2);
    cell.value = h;
    Object.assign(cell, STYLES.columnHeader);
  });

  const useCases: Record<string, string> = {
    'ondo-finance': 'Tokenized US Treasuries',
    'maker': 'RWA Collateral for DAI',
    'centrifuge': 'Real-world asset financing',
    'goldfinch': 'Crypto loans to businesses',
    'maple': 'Institutional lending',
    'clearpool': 'Unsecured institutional loans',
    'truefi': 'Uncollateralized lending',
  };

  rwaCoins.forEach((coin: any, i: number) => {
    const row = 6 + i;
    const change24h = coin.price_change_percentage_24h || 0;

    sheet.getCell(`B${row}`).value = coin.name;
    sheet.getCell(`B${row}`).font = { bold: true };
    sheet.getCell(`C${row}`).value = coin.symbol?.toUpperCase();
    sheet.getCell(`D${row}`).value = formatPrice(coin.current_price);
    sheet.getCell(`E${row}`).value = formatCompact(coin.market_cap);

    const cell24h = sheet.getCell(`F${row}`);
    cell24h.value = `${change24h >= 0 ? '+' : ''}${change24h.toFixed(2)}%`;
    cell24h.font = { color: { argb: change24h >= 0 ? COLORS.success : COLORS.danger } };

    sheet.getCell(`G${row}`).value = useCases[coin.id] || 'RWA';

    if (i % 2 === 0) {
      for (let col = 2; col <= 7; col++) {
        sheet.getCell(row, col).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.surface } };
      }
    }
  });

  // RWA Info
  const infoRow = 6 + rwaCoins.length + 2;
  sheet.getCell(`B${infoRow}`).value = '📊 WHY RWA MATTERS';
  sheet.getCell(`B${infoRow}`).font = { bold: true, size: 14, color: { argb: 'FF06B6D4' } };

  const info = [
    '• Brings trillions of $ in traditional assets on-chain',
    '• Enables 24/7 trading of traditionally illiquid assets',
    '• Provides yield from real-world revenue streams',
    '• Bridges TradFi and DeFi ecosystems',
    '• Growing institutional interest in tokenization',
  ];

  info.forEach((text, i) => {
    sheet.getCell(`B${infoRow + 1 + i}`).value = text;
    sheet.getCell(`B${infoRow + 1 + i}`).font = { color: { argb: COLORS.medium } };
  });
}

function addCustomWatchlistSheet(workbook: ExcelJS.Workbook, marketData: any[], coins: string[]) {
  const sheet = workbook.addWorksheet('Watchlist', {
    properties: { tabColor: { argb: COLORS.primary } }
  });

  sheet.getColumn('A').width = 3;
  sheet.getColumn('B').width = 20;
  sheet.getColumn('C').width = 14;
  sheet.getColumn('D').width = 16;
  sheet.getColumn('E').width = 14;
  sheet.getColumn('F').width = 12;
  sheet.getColumn('G').width = 12;
  sheet.getColumn('H').width = 14;

  // Header
  sheet.mergeCells('B2:H2');
  const header = sheet.getCell('B2');
  header.value = '⭐ MY WATCHLIST';
  Object.assign(header, STYLES.header);
  sheet.getRow(2).height = 40;

  // Column headers
  const headers = ['Coin', 'Price', 'Market Cap', 'Volume', '24h %', '7d %', 'ATH'];
  headers.forEach((h, i) => {
    const cell = sheet.getCell(4, i + 2);
    cell.value = h;
    Object.assign(cell, STYLES.columnHeader);
  });

  // Data
  coins.forEach((coinId, i) => {
    const coin = marketData.find((c: any) => c.id === coinId);
    if (!coin) return;

    const row = 5 + i;
    const change24h = coin.price_change_percentage_24h || 0;
    const change7d = coin.price_change_percentage_7d_in_currency || 0;

    sheet.getCell(`B${row}`).value = coin.name;
    sheet.getCell(`B${row}`).font = { bold: true };
    sheet.getCell(`C${row}`).value = formatPrice(coin.current_price);
    sheet.getCell(`D${row}`).value = formatCompact(coin.market_cap);
    sheet.getCell(`E${row}`).value = formatCompact(coin.total_volume);

    const cell24h = sheet.getCell(`F${row}`);
    cell24h.value = formatPercent(change24h);
    cell24h.font = { color: { argb: change24h >= 0 ? COLORS.success : COLORS.danger } };

    const cell7d = sheet.getCell(`G${row}`);
    cell7d.value = formatPercent(change7d);
    cell7d.font = { color: { argb: change7d >= 0 ? COLORS.success : COLORS.danger } };

    sheet.getCell(`H${row}`).value = formatPrice(coin.ath);

    if (i % 2 === 0) {
      for (let col = 2; col <= 8; col++) {
        sheet.getCell(row, col).fill = STYLES.zebraEven.fill;
      }
    }
  });
}

// ============================================
// DOCUMENTATION SHEET
// ============================================

function addDocumentationSheet(workbook: ExcelJS.Workbook) {
  const sheet = workbook.addWorksheet('Help', {
    properties: { tabColor: { argb: COLORS.light } }
  });

  sheet.getColumn('A').width = 3;
  sheet.getColumn('B').width = 50;
  sheet.getColumn('C').width = 40;

  sheet.mergeCells('B2:C2');
  const header = sheet.getCell('B2');
  header.value = '📚 DOCUMENTATION & HELP';
  Object.assign(header, STYLES.header);
  sheet.getRow(2).height = 40;

  const sections = [
    { title: '🔄 How to Refresh Data', content: [
      '1. Go to the "Data" tab in Excel',
      '2. Click "Refresh All"',
      '3. Data will update from CoinGecko API',
      '4. Ensure your API key is set in Settings sheet',
    ]},
    { title: '📊 Understanding the Sheets', content: [
      'Dashboard - Overview of all key metrics',
      'Global_Stats - Total market statistics',
      'Top_Coins - Ranked by market cap',
      'Gainers/Losers - 24h price movers',
      'Fear_Greed - Market sentiment index',
      'Portfolio - Track your holdings',
      'Screener - Filter coins by criteria',
    ]},
    { title: '🎨 Color Coding', content: [
      'Green = Positive/Gain',
      'Red = Negative/Loss',
      'Yellow = Editable input cells',
      'Gray = Headers and labels',
    ]},
    { title: '⚡ Tips & Tricks', content: [
      'Use Excel filters on Screener sheet',
      'Edit yellow cells in Portfolio to track holdings',
      'Sort any column by clicking header',
      'Right-click for more options',
    ]},
    { title: '🔗 Resources', content: [
      'CryptoReportKit: cryptoreportkit.com',
      'CoinGecko API: coingecko.com/api',
      'Support: contact@cryptoreportkit.com',
    ]},
  ];

  let currentRow = 4;
  sections.forEach(section => {
    sheet.getCell(`B${currentRow}`).value = section.title;
    sheet.getCell(`B${currentRow}`).font = { bold: true, size: 14, color: { argb: COLORS.primary } };
    currentRow++;

    section.content.forEach(line => {
      sheet.getCell(`B${currentRow}`).value = line;
      sheet.getCell(`B${currentRow}`).font = { color: { argb: COLORS.medium } };
      currentRow++;
    });

    currentRow += 1; // Space between sections
  });

  // Footer
  sheet.getCell(`B${currentRow + 2}`).value = '© 2026 CryptoReportKit - All Rights Reserved';
  sheet.getCell(`B${currentRow + 2}`).font = { italic: true, color: { argb: COLORS.lighter } };
}

// ============================================
// UTILITY FUNCTIONS
// ============================================

function formatCurrency(value: number): string {
  if (!value || isNaN(value)) return '$0';
  if (value >= 1e12) return `$${(value / 1e12).toFixed(2)}T`;
  if (value >= 1e9) return `$${(value / 1e9).toFixed(2)}B`;
  if (value >= 1e6) return `$${(value / 1e6).toFixed(2)}M`;
  return `$${value.toLocaleString('en-US', { maximumFractionDigits: 2 })}`;
}

function formatCompact(value: number): string {
  if (!value || isNaN(value)) return 'N/A';
  if (value >= 1e12) return `$${(value / 1e12).toFixed(2)}T`;
  if (value >= 1e9) return `$${(value / 1e9).toFixed(2)}B`;
  if (value >= 1e6) return `$${(value / 1e6).toFixed(2)}M`;
  if (value >= 1e3) return `$${(value / 1e3).toFixed(2)}K`;
  return `$${value.toFixed(2)}`;
}

function formatPrice(value: number): string {
  if (!value || isNaN(value)) return 'N/A';
  if (value >= 1000) return `$${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  if (value >= 1) return `$${value.toFixed(2)}`;
  if (value >= 0.01) return `$${value.toFixed(4)}`;
  if (value >= 0.0001) return `$${value.toFixed(6)}`;
  return `$${value.toFixed(8)}`;
}

function formatPercent(value: number): string {
  if (value === undefined || value === null || isNaN(value)) return 'N/A';
  return `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`;
}

function getGaugeColor(value: number): string {
  if (value <= 20) return COLORS.danger;
  if (value <= 40) return COLORS.warning;
  if (value <= 60) return COLORS.light;
  if (value <= 80) return 'FF84CC16'; // Lime
  return COLORS.success;
}
