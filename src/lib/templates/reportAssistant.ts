/**
 * Report Assistant - Natural Language Intent Parser & Router
 *
 * Parses user descriptions and routes to the right template.
 * Uses simple, user-friendly language (no heavy terms).
 */

import {
  TEMPLATE_CATALOG,
  type TemplateCatalogEntry,
  type ReportType,
} from './reportBuilderCatalog';

// ============ SIMPLE TERMS TRANSLATION ============

/**
 * Translation layer: heavy terms → user-friendly language
 */
export const TERM_TRANSLATIONS: Record<string, string> = {
  // Data terms
  OHLCV: 'candles (open-high-low-close)',
  ohlcv: 'candles',
  timeframe: 'time range',
  interval: 'time range',
  indicators: 'trend signals',
  correlation: 'how coins move together',
  VaR: 'worst-case loss estimate',
  'Value at Risk': 'worst-case loss estimate',
  volatility: 'price swings',
  drawdown: 'biggest drop from peak',
  liquidity: 'how easy to buy/sell',
  'DEX pools': 'trading pools',
  API: 'data connection',
  quota: 'data limit',
  refresh: 'update',
  VWAP: 'average price',
  RSI: 'momentum signal',
  MACD: 'trend signal',
  EMA: 'smoothed price',
  SMA: 'average price',
};

// ============ INTENT PARSING ============

/**
 * Patterns for detecting report intent
 */
const INTENT_PATTERNS: Array<{
  type: ReportType;
  patterns: RegExp[];
  keywords: string[];
}> = [
  {
    type: 'market',
    patterns: [
      /market\s*(overview|report|dashboard)?/i,
      /top\s*coins?/i,
      /trending/i,
      /gainers?\s*(and|\/|&)?\s*losers?/i,
      /what('s| is)\s*(happening|moving|trending)/i,
    ],
    keywords: ['market', 'overview', 'top', 'trending', 'movers', 'heatmap'],
  },
  {
    type: 'watchlist',
    patterns: [
      /watch\s*list/i,
      /track\s*(these|my|some)\s*coins?/i,
      /monitor/i,
      /follow\s*(these|my)/i,
      /(my|these)\s*coins?/i,
    ],
    keywords: ['watch', 'track', 'monitor', 'follow', 'my coins', 'these coins'],
  },
  {
    type: 'screener',
    patterns: [
      /screen(er)?/i,
      /filter/i,
      /find\s*coins?/i,
      /search\s*for/i,
      /coins?\s*(with|that|having)/i,
      /high\s*(volume|momentum)/i,
    ],
    keywords: ['screener', 'filter', 'find', 'search', 'criteria', 'conditions'],
  },
  {
    type: 'portfolio',
    patterns: [
      /portfolio/i,
      /(my)?\s*holdings?/i,
      /P&?L|profit\s*(and|&)?\s*loss/i,
      /performance/i,
      /allocation/i,
      /how\s*(am i|are my|is my)\s*(doing|performing)/i,
    ],
    keywords: ['portfolio', 'holdings', 'performance', 'PnL', 'allocation', 'balance'],
  },
  {
    type: 'correlation',
    patterns: [
      /correlat(ion|e)/i,
      /move\s*together/i,
      /diversif(y|ication)/i,
      /relationship/i,
      /compared?\s*to/i,
    ],
    keywords: ['correlation', 'together', 'diversify', 'relationship', 'compare'],
  },
  {
    type: 'risk',
    patterns: [
      /risk/i,
      /volatility/i,
      /drawdown/i,
      /worst\s*case/i,
      /how\s*(risky|volatile|dangerous)/i,
      /safe/i,
    ],
    keywords: ['risk', 'volatility', 'drawdown', 'safe', 'dangerous'],
  },
];

/**
 * Trading advice patterns to refuse
 */
const REFUSED_PATTERNS = [
  /what\s*(to|should\s*i)\s*(buy|sell)/i,
  /should\s*i\s*(buy|sell|invest|hold)/i,
  /(buy|sell)\s*signal/i,
  /price\s*(prediction|target|forecast)/i,
  /(entry|exit)\s*point/i,
  /stop\s*loss/i,
  /take\s*profit/i,
  /will\s*(it|price)\s*(go|rise|fall|drop|moon)/i,
  /best\s*coin\s*to\s*(buy|invest)/i,
  /when\s*(to|should\s*i)\s*(buy|sell)/i,
  /is\s*it\s*a\s*good\s*time\s*to/i,
  /financial\s*advice/i,
  /investment\s*advice/i,
];

/**
 * Coin name patterns
 */
const COIN_PATTERNS = [
  /\b(BTC|bitcoin)\b/gi,
  /\b(ETH|ethereum)\b/gi,
  /\b(SOL|solana)\b/gi,
  /\b(BNB)\b/gi,
  /\b(XRP|ripple)\b/gi,
  /\b(ADA|cardano)\b/gi,
  /\b(DOGE|dogecoin)\b/gi,
  /\b(DOT|polkadot)\b/gi,
  /\b(AVAX|avalanche)\b/gi,
  /\b(MATIC|polygon)\b/gi,
  /\b(LINK|chainlink)\b/gi,
  /\b(UNI|uniswap)\b/gi,
  /\b(ATOM|cosmos)\b/gi,
  /\b(LTC|litecoin)\b/gi,
];

/**
 * Timeframe patterns
 */
const TIMEFRAME_PATTERNS: Array<{ pattern: RegExp; value: string; label: string }> = [
  { pattern: /daily|1\s*d(ay)?/i, value: '1d', label: 'daily' },
  { pattern: /hourly|1\s*h(our)?/i, value: '1h', label: 'hourly' },
  { pattern: /weekly|1\s*w(eek)?/i, value: '1w', label: 'weekly' },
  { pattern: /4\s*h(our)?/i, value: '4h', label: '4-hour' },
  { pattern: /5\s*min/i, value: '5m', label: '5-minute' },
];

// ============ INTENT PARSER ============

export interface ParsedIntent {
  reportType: ReportType | null;
  coins: string[];
  timeframe: string | null;
  confidence: 'high' | 'medium' | 'low';
  needsClarification: boolean;
  clarificationQuestions: string[];
  isRefused: boolean;
  refusalReason: string | null;
  originalText: string;
  understood: string; // What the assistant understood in simple terms
}

/**
 * Parse natural language input to extract intent
 */
export function parseUserIntent(input: string): ParsedIntent {
  const normalizedInput = input.toLowerCase().trim();

  // Check for refused patterns first
  for (const pattern of REFUSED_PATTERNS) {
    if (pattern.test(normalizedInput)) {
      return {
        reportType: null,
        coins: [],
        timeframe: null,
        confidence: 'high',
        needsClarification: false,
        clarificationQuestions: [],
        isRefused: true,
        refusalReason:
          "I can't help with trading advice, price predictions, or buy/sell signals. I can help you build reports and dashboards to analyze data. What report would you like?",
        originalText: input,
        understood: '',
      };
    }
  }

  // Detect report type
  let reportType: ReportType | null = null;
  let maxScore = 0;

  for (const intentDef of INTENT_PATTERNS) {
    let score = 0;

    // Check regex patterns
    for (const pattern of intentDef.patterns) {
      if (pattern.test(normalizedInput)) {
        score += 2;
      }
    }

    // Check keywords
    for (const keyword of intentDef.keywords) {
      if (normalizedInput.includes(keyword.toLowerCase())) {
        score += 1;
      }
    }

    if (score > maxScore) {
      maxScore = score;
      reportType = intentDef.type;
    }
  }

  // Extract coins mentioned
  const coins: string[] = [];
  for (const pattern of COIN_PATTERNS) {
    const matches = input.match(pattern);
    if (matches) {
      for (const match of matches) {
        const coin = match.toUpperCase();
        // Map full names to symbols
        const coinMap: Record<string, string> = {
          BITCOIN: 'BTC',
          ETHEREUM: 'ETH',
          SOLANA: 'SOL',
          RIPPLE: 'XRP',
          CARDANO: 'ADA',
          DOGECOIN: 'DOGE',
          POLKADOT: 'DOT',
          AVALANCHE: 'AVAX',
          POLYGON: 'MATIC',
          CHAINLINK: 'LINK',
          UNISWAP: 'UNI',
          COSMOS: 'ATOM',
          LITECOIN: 'LTC',
        };
        const symbol = coinMap[coin] || coin;
        if (!coins.includes(symbol)) {
          coins.push(symbol);
        }
      }
    }
  }

  // Extract timeframe
  let timeframe: string | null = null;
  for (const tf of TIMEFRAME_PATTERNS) {
    if (tf.pattern.test(normalizedInput)) {
      timeframe = tf.value;
      break;
    }
  }

  // Determine confidence and what needs clarification
  const clarificationQuestions: string[] = [];

  if (!reportType) {
    clarificationQuestions.push('What type of report do you need?');
  }

  if (coins.length === 0 && reportType !== 'market' && reportType !== 'screener') {
    clarificationQuestions.push('Which coins do you want to include?');
  }

  const confidence: 'high' | 'medium' | 'low' =
    maxScore >= 3 ? 'high' : maxScore >= 1 ? 'medium' : 'low';

  // Generate "what I understood" summary
  const understood = generateUnderstanding(reportType, coins, timeframe, input);

  return {
    reportType,
    coins,
    timeframe,
    confidence,
    needsClarification: clarificationQuestions.length > 0,
    clarificationQuestions,
    isRefused: false,
    refusalReason: null,
    originalText: input,
    understood,
  };
}

function generateUnderstanding(
  reportType: ReportType | null,
  coins: string[],
  timeframe: string | null,
  originalText: string
): string {
  const parts: string[] = [];

  if (reportType) {
    const typeLabels: Record<ReportType, string> = {
      market: 'a market overview report',
      watchlist: 'a watchlist to track specific coins',
      screener: 'a screener to find coins matching your criteria',
      portfolio: 'a portfolio report to track holdings and performance',
      correlation: 'a correlation report to see how coins move together',
      risk: 'a risk report with price swings and worst-case estimates',
    };
    parts.push(`You want ${typeLabels[reportType]}`);
  }

  if (coins.length > 0) {
    parts.push(`for ${coins.join(', ')}`);
  }

  if (timeframe) {
    const tfLabels: Record<string, string> = {
      '1d': 'daily',
      '1h': 'hourly',
      '4h': '4-hour',
      '1w': 'weekly',
      '5m': '5-minute',
    };
    parts.push(`with ${tfLabels[timeframe] || timeframe} time range`);
  }

  return parts.length > 0 ? parts.join(' ') + '.' : '';
}

// ============ TEMPLATE ROUTING ============

export interface RoutedTemplate {
  primary: TemplateCatalogEntry;
  alternatives: TemplateCatalogEntry[];
  reasoning: string;
  config: {
    coins: string[];
    timeframe: string;
    refreshFrequency: string;
    includeCharts: boolean;
  };
  setupSteps: string[];
}

/**
 * Route parsed intent to the best template
 */
export function routeToTemplate(
  intent: ParsedIntent,
  isFreeUser: boolean = true
): RoutedTemplate | null {
  if (!intent.reportType || intent.isRefused) {
    return null;
  }

  // Get templates for this report type
  const candidates = TEMPLATE_CATALOG.filter((t) => t.report_type === intent.reportType);

  // Prefer free-safe templates for free users
  let primary: TemplateCatalogEntry;
  if (isFreeUser) {
    primary = candidates.find((t) => t.free_safe) || candidates[0];
  } else {
    // For paid users, pick the more advanced one
    primary = candidates.find((t) => !t.free_safe) || candidates[0];
  }

  // Get alternatives
  const alternatives = candidates.filter((t) => t.template_id !== primary.template_id).slice(0, 2);

  // Build config from intent
  const coins =
    intent.coins.length > 0
      ? intent.coins
      : getDefaultCoins(intent.reportType, isFreeUser ? 5 : 10);

  const timeframe = intent.timeframe || '1d'; // Default to daily

  // Generate simple reasoning
  const reasoning = generateSimpleReasoning(primary, intent, isFreeUser);

  // Generate setup steps in simple language
  const setupSteps = [
    'Download the report (click the button below)',
    'Open the file in Excel Desktop (not Excel Online)',
    'If prompted, enable the CryptoSheets add-in',
    'Sign in to your CryptoSheets account',
    'Click "Update" to load fresh data',
    "You're done! Your report is ready.",
  ];

  return {
    primary,
    alternatives,
    reasoning,
    config: {
      coins,
      timeframe,
      refreshFrequency: 'manual',
      includeCharts: true,
    },
    setupSteps,
  };
}

function getDefaultCoins(reportType: ReportType, count: number): string[] {
  const topCoins = ['BTC', 'ETH', 'SOL', 'BNB', 'XRP', 'ADA', 'DOGE', 'AVAX', 'DOT', 'MATIC'];
  return topCoins.slice(0, count);
}

function generateSimpleReasoning(
  template: TemplateCatalogEntry,
  intent: ParsedIntent,
  isFreeUser: boolean
): string {
  const parts: string[] = [];

  // Template name
  parts.push(`I recommend the "${template.name}".`);

  // Why it fits
  parts.push(template.best_for + '.');

  // Free tier note
  if (isFreeUser && template.free_safe) {
    parts.push('Works great with your free account.');
  } else if (isFreeUser && !template.free_safe) {
    parts.push('Note: This might need a paid account for best results.');
  }

  return parts.join(' ');
}

// ============ ERROR TROUBLESHOOTING ============

export interface TroubleshootingStep {
  symptom: string;
  simpleExplanation: string;
  fix: string;
}

export const TROUBLESHOOTING_STEPS: TroubleshootingStep[] = [
  {
    symptom: '#NAME? showing in cells',
    simpleExplanation: "Excel doesn't recognize the formulas",
    fix: 'Install the CryptoSheets add-in from cryptosheets.com',
  },
  {
    symptom: 'Empty cells or #VALUE! errors',
    simpleExplanation: 'The data connection is not working',
    fix: 'Sign in to CryptoSheets (look for CryptoSheets tab in Excel)',
  },
  {
    symptom: 'Data not updating',
    simpleExplanation: 'The report shows old numbers',
    fix: 'Press Ctrl+Alt+F5 (Windows) or Cmd+Alt+F5 (Mac) to update',
  },
  {
    symptom: 'Rate limit or quota error',
    simpleExplanation: "You've used up your daily data limit",
    fix: 'Wait until tomorrow, or reduce the number of coins in your report',
  },
  {
    symptom: 'Nothing happens when I open the file',
    simpleExplanation: 'Excel Online or mobile app cannot run add-ins',
    fix: 'Open the file in Excel Desktop app instead',
  },
];

// ============ QUICK REPLY OPTIONS ============

export interface QuickReply {
  label: string;
  value: string;
  description?: string;
}

export const REPORT_TYPE_QUICK_REPLIES: QuickReply[] = [
  { label: 'Market Overview', value: 'market', description: 'Top coins and movers' },
  { label: 'Watchlist', value: 'watchlist', description: 'Track specific coins' },
  { label: 'Screener', value: 'screener', description: 'Find coins matching criteria' },
  { label: 'Portfolio', value: 'portfolio', description: 'Holdings and performance' },
  { label: 'Correlation', value: 'correlation', description: 'How coins move together' },
  { label: 'Risk Analysis', value: 'risk', description: 'Price swings and risk' },
];

export const TIMEFRAME_QUICK_REPLIES: QuickReply[] = [
  { label: 'Daily', value: '1d', description: 'Most common' },
  { label: 'Hourly', value: '1h', description: 'More detail' },
  { label: 'Weekly', value: '1w', description: 'Longer view' },
];

export const COIN_PRESET_QUICK_REPLIES: QuickReply[] = [
  { label: 'Top 5', value: 'top5', description: 'BTC, ETH, SOL, BNB, XRP' },
  { label: 'Top 10', value: 'top10', description: 'Top 10 by market cap' },
  { label: 'DeFi coins', value: 'defi', description: 'UNI, AAVE, LINK, etc.' },
  { label: 'My own list', value: 'custom', description: 'Choose specific coins' },
];

export const VERIFICATION_QUICK_REPLIES: QuickReply[] = [
  { label: 'It worked!', value: 'success' },
  { label: 'I see an error', value: 'error' },
  { label: 'No data showing', value: 'no_data' },
  { label: 'Need more help', value: 'help' },
];
