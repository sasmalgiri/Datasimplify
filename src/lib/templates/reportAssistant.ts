/**
 * Template Finder - Semantic Search & Intent Parser
 *
 * Uses semantic matching to understand natural language queries
 * and route users to the right template.
 *
 * NOTE: This is keyword/concept matching, NOT AI-powered.
 * It matches user phrases against a comprehensive dictionary
 * of synonyms and natural language patterns.
 */

import {
  TEMPLATE_CATALOG,
  type TemplateCatalogEntry,
  type ReportType,
} from './reportBuilderCatalog';

// ============ SEMANTIC SEARCH ENGINE ============

/**
 * Semantic concept dictionary - maps natural phrases to report types
 * This allows users to describe what they want in their own words
 */
const SEMANTIC_CONCEPTS: Record<ReportType, {
  synonyms: string[];           // Direct synonyms
  naturalPhrases: string[];     // Common ways people ask
  relatedConcepts: string[];    // Related ideas that imply this intent
  questions: string[];          // Question patterns
}> = {
  market: {
    synonyms: [
      'market', 'overview', 'summary', 'dashboard', 'snapshot', 'heatmap',
      'top coins', 'trending', 'movers', 'gainers', 'losers', 'leaders',
      'biggest', 'best performing', 'worst performing', 'market cap',
    ],
    naturalPhrases: [
      'what is happening', 'whats going on', 'show me the market',
      'market summary', 'crypto today', 'daily recap', 'market update',
      'how is crypto doing', 'crypto market', 'overall market',
      'top performers', 'who is winning', 'who is losing',
      'best coins today', 'worst coins today', 'market leaders',
      'show me everything', 'general overview', 'big picture',
      'market conditions', 'current state', 'market status',
    ],
    relatedConcepts: [
      'all coins', 'everything', 'general', 'broad view', 'total',
      'aggregate', 'combined', 'sector', 'category', 'index',
    ],
    questions: [
      'what is trending', 'whats hot', 'what should i look at',
      'where to start', 'what is moving', 'any big moves',
    ],
  },
  watchlist: {
    synonyms: [
      'watchlist', 'watch list', 'tracking', 'monitor', 'follow',
      'favorites', 'my list', 'custom list', 'personal', 'saved',
    ],
    naturalPhrases: [
      'track these coins', 'monitor these', 'keep an eye on',
      'watch these', 'follow these coins', 'my coins', 'specific coins',
      'just these coins', 'only these', 'selected coins', 'chosen coins',
      'i want to track', 'let me follow', 'add to watchlist',
      'coins i care about', 'coins i own', 'coins im interested in',
    ],
    relatedConcepts: [
      'specific', 'selected', 'chosen', 'particular', 'certain',
      'individual', 'custom', 'personalized', 'tailored',
    ],
    questions: [
      'can i track specific coins', 'how do i monitor',
      'where can i save my coins', 'custom coin list',
    ],
  },
  screener: {
    synonyms: [
      'screener', 'screen', 'filter', 'search', 'find', 'discover',
      'scan', 'scanner', 'lookup', 'criteria', 'conditions',
    ],
    naturalPhrases: [
      'find coins', 'search for coins', 'filter coins', 'coins that',
      'coins with', 'coins having', 'looking for', 'discover new',
      'find opportunities', 'scan the market', 'coins matching',
      'show me coins that', 'which coins have', 'high volume coins',
      'low cap coins', 'new coins', 'coins under', 'coins over',
      'cheap coins', 'expensive coins', 'small cap', 'large cap',
    ],
    relatedConcepts: [
      'criteria', 'conditions', 'requirements', 'parameters',
      'specifications', 'rules', 'filters', 'attributes',
    ],
    questions: [
      'how do i find coins', 'where can i search', 'filter by',
      'sort by', 'rank by', 'order by',
    ],
  },
  portfolio: {
    synonyms: [
      'portfolio', 'holdings', 'investments', 'positions', 'balance',
      'assets', 'wallet', 'bags', 'stash', 'inventory',
    ],
    naturalPhrases: [
      'my portfolio', 'my holdings', 'my investments', 'what i own',
      'my balance', 'track my portfolio', 'portfolio tracker',
      'profit and loss', 'pnl', 'p&l', 'gains', 'losses', 'returns',
      'how am i doing', 'my performance', 'am i up', 'am i down',
      'how much have i made', 'how much have i lost', 'roi',
      'return on investment', 'total value', 'net worth',
      'allocation', 'breakdown', 'distribution', 'weights',
    ],
    relatedConcepts: [
      'value', 'worth', 'amount', 'quantity', 'cost basis',
      'average price', 'entry price', 'current value', 'profit',
    ],
    questions: [
      'how is my portfolio', 'am i making money', 'whats my balance',
      'how much profit', 'total gains', 'portfolio performance',
    ],
  },
  correlation: {
    synonyms: [
      'correlation', 'correlate', 'relationship', 'connection',
      'association', 'link', 'ties', 'dependency', 'matrix',
    ],
    naturalPhrases: [
      'how coins relate', 'move together', 'connected to each other',
      'correlation matrix', 'compare coins', 'coin relationships',
      'do they move together', 'similar movement', 'opposite movement',
      'diversification', 'diversify', 'spread risk', 'hedge',
      'uncorrelated', 'independent', 'different directions',
      'when btc moves', 'follows bitcoin', 'moves with ethereum',
    ],
    relatedConcepts: [
      'similarity', 'difference', 'pattern', 'behavior', 'trend',
      'movement', 'direction', 'together', 'apart', 'inverse',
    ],
    questions: [
      'do these coins move together', 'are they correlated',
      'how to diversify', 'which coins are independent',
      'what moves with bitcoin', 'opposite of bitcoin',
    ],
  },
  risk: {
    synonyms: [
      'risk', 'volatility', 'danger', 'safety', 'stability',
      'drawdown', 'variance', 'deviation', 'exposure', 'var',
    ],
    naturalPhrases: [
      'how risky', 'is it safe', 'risk analysis', 'risk assessment',
      'volatility report', 'price swings', 'how stable', 'how volatile',
      'worst case', 'maximum loss', 'potential downside', 'risk level',
      'drawdown analysis', 'biggest drops', 'crashes', 'dips',
      'risk metrics', 'sharpe ratio', 'risk adjusted', 'var analysis',
      'value at risk', 'stress test', 'scenario analysis',
    ],
    relatedConcepts: [
      'danger', 'safe', 'stable', 'unstable', 'wild', 'calm',
      'crazy', 'steady', 'unpredictable', 'reliable',
    ],
    questions: [
      'how risky is this', 'should i be worried', 'is it stable',
      'how much can i lose', 'worst case scenario', 'maximum drawdown',
    ],
  },
};

/**
 * Fuzzy string matching - handles typos and variations
 * Returns similarity score 0-1
 */
function fuzzyMatch(str1: string, str2: string): number {
  const s1 = str1.toLowerCase();
  const s2 = str2.toLowerCase();

  // Exact match
  if (s1 === s2) return 1;

  // Contains match
  if (s1.includes(s2) || s2.includes(s1)) return 0.8;

  // Calculate similarity for short strings
  if (s1.length < 15 && s2.length < 15) {
    const longer = s1.length > s2.length ? s1 : s2;
    const shorter = s1.length > s2.length ? s2 : s1;

    if (longer.length === 0) return 1;

    // Character overlap ratio
    let matches = 0;
    for (const char of shorter) {
      if (longer.includes(char)) matches++;
    }
    const similarity = matches / longer.length;

    // Bonus for same starting characters
    let prefixMatch = 0;
    for (let i = 0; i < Math.min(s1.length, s2.length, 3); i++) {
      if (s1[i] === s2[i]) prefixMatch++;
    }

    return Math.min(1, similarity + (prefixMatch * 0.1));
  }

  return 0;
}

/**
 * Semantic search scoring - finds best matching report type
 * Uses comprehensive dictionary matching with fuzzy search
 */
function semanticScore(input: string, reportType: ReportType): number {
  const concepts = SEMANTIC_CONCEPTS[reportType];
  const normalizedInput = input.toLowerCase();
  const words = normalizedInput.split(/\s+/);

  let score = 0;

  // Check synonyms (highest weight)
  for (const synonym of concepts.synonyms) {
    if (normalizedInput.includes(synonym)) {
      score += 3;
    } else {
      // Fuzzy match for typos
      for (const word of words) {
        const similarity = fuzzyMatch(word, synonym);
        if (similarity > 0.7) {
          score += 2 * similarity;
        }
      }
    }
  }

  // Check natural phrases (high weight - matches user's natural language)
  for (const phrase of concepts.naturalPhrases) {
    if (normalizedInput.includes(phrase)) {
      score += 4;
    } else {
      // Check if most words in phrase are present
      const phraseWords = phrase.split(/\s+/);
      let matchedWords = 0;
      for (const pw of phraseWords) {
        if (normalizedInput.includes(pw)) matchedWords++;
      }
      if (matchedWords >= phraseWords.length * 0.6) {
        score += 2;
      }
    }
  }

  // Check related concepts (medium weight)
  for (const concept of concepts.relatedConcepts) {
    if (normalizedInput.includes(concept)) {
      score += 1.5;
    }
  }

  // Check question patterns (medium weight)
  for (const question of concepts.questions) {
    const questionWords = question.split(/\s+/).filter(w => w.length > 2);
    let matchedWords = 0;
    for (const qw of questionWords) {
      if (normalizedInput.includes(qw)) matchedWords++;
    }
    if (matchedWords >= questionWords.length * 0.5) {
      score += 2;
    }
  }

  return score;
}

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

  // Detect report type using SEMANTIC SEARCH
  // Combines semantic scoring with regex pattern matching for best results
  let reportType: ReportType | null = null;
  let maxScore = 0;

  // First pass: Semantic scoring (primary method)
  const reportTypes: ReportType[] = ['market', 'watchlist', 'screener', 'portfolio', 'correlation', 'risk'];
  for (const type of reportTypes) {
    const semScore = semanticScore(normalizedInput, type);
    if (semScore > maxScore) {
      maxScore = semScore;
      reportType = type;
    }
  }

  // Second pass: Regex patterns as fallback/boost
  for (const intentDef of INTENT_PATTERNS) {
    let patternScore = 0;

    // Check regex patterns
    for (const pattern of intentDef.patterns) {
      if (pattern.test(normalizedInput)) {
        patternScore += 2;
      }
    }

    // Check keywords
    for (const keyword of intentDef.keywords) {
      if (normalizedInput.includes(keyword.toLowerCase())) {
        patternScore += 1;
      }
    }

    // Combine scores - regex match boosts semantic score
    const combinedScore = semanticScore(normalizedInput, intentDef.type) + patternScore;
    if (combinedScore > maxScore) {
      maxScore = combinedScore;
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

  // Confidence thresholds adjusted for semantic scoring
  // Semantic scores are typically higher (4+ for good matches)
  const confidence: 'high' | 'medium' | 'low' =
    maxScore >= 6 ? 'high' : maxScore >= 2 ? 'medium' : 'low';

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
