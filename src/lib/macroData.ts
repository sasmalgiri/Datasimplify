/**
 * Macro Economic Data Fetcher
 * Fetches Fed Funds Rate, 10Y Yield, USD Index, VIX from free APIs
 */

// Cache for macro data (5 minute TTL)
let macroCache: { data: MacroData | null; timestamp: number } = { data: null, timestamp: 0 };
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

// Track API failures for debugging
const apiStatus: Record<string, { lastSuccess: string | null; lastError: string | null; consecutiveFailures: number }> = {
  fedFunds: { lastSuccess: null, lastError: null, consecutiveFailures: 0 },
  treasury10Y: { lastSuccess: null, lastError: null, consecutiveFailures: 0 },
  dxy: { lastSuccess: null, lastError: null, consecutiveFailures: 0 },
  vix: { lastSuccess: null, lastError: null, consecutiveFailures: 0 },
  sp500: { lastSuccess: null, lastError: null, consecutiveFailures: 0 },
  nasdaq: { lastSuccess: null, lastError: null, consecutiveFailures: 0 },
};

export interface MacroData {
  fedFundsRate: number | null;
  treasury10Y: number | null;
  dxy: number | null;
  vix: number | null;
  sp500Change: number | null;
  nasdaqChange: number | null;
  lastUpdated: string;
  riskEnvironment: 'risk-on' | 'risk-off' | 'neutral';
  dataQuality: 'good' | 'partial' | 'stale';
  errors?: string[];
}

/**
 * Fetch Federal Funds Effective Rate from FRED
 * Series: DFF (Daily)
 */
async function fetchFedFundsRate(): Promise<number | null> {
  try {
    // FRED API - no key needed for basic JSON access via alternative endpoint
    const res = await fetch(
      'https://api.stlouisfed.org/fred/series/observations?series_id=DFF&sort_order=desc&limit=1&file_type=json&api_key=DEMO_KEY',
      { next: { revalidate: 3600 } } // Cache for 1 hour (rate changes rarely)
    );

    if (!res.ok) {
      // Fallback: try alternative source
      return await fetchFedFundsFromAlternative();
    }

    const data = await res.json();
    if (data.observations && data.observations.length > 0) {
      const value = parseFloat(data.observations[0].value);
      return isNaN(value) ? null : value;
    }
    return null;
  } catch (error) {
    console.error('Error fetching Fed Funds Rate:', error);
    return await fetchFedFundsFromAlternative();
  }
}

async function fetchFedFundsFromAlternative(): Promise<number | null> {
  try {
    // Use a reliable fallback - current Fed target range is public knowledge
    // As of late 2024, the rate is around 4.5-4.75%
    // We'll try to get live data from another source
    const res = await fetch('https://www.alphavantage.co/query?function=FEDERAL_FUNDS_RATE&interval=daily&apikey=demo');
    const data = await res.json();
    if (data.data && data.data.length > 0) {
      return parseFloat(data.data[0].value);
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Fetch 10-Year Treasury Yield from FRED
 * Series: DGS10 (Daily)
 */
async function fetch10YYield(): Promise<number | null> {
  try {
    const res = await fetch(
      'https://api.stlouisfed.org/fred/series/observations?series_id=DGS10&sort_order=desc&limit=1&file_type=json&api_key=DEMO_KEY',
      { next: { revalidate: 3600 } }
    );

    if (!res.ok) return null;

    const data = await res.json();
    if (data.observations && data.observations.length > 0) {
      const value = parseFloat(data.observations[0].value);
      return isNaN(value) ? null : value;
    }
    return null;
  } catch (error) {
    console.error('Error fetching 10Y Yield:', error);
    return null;
  }
}

/**
 * Fetch USD Index (DXY) - Trade Weighted US Dollar Index
 * FRED Series: DTWEXBGS (Broad)
 */
async function fetchDXY(): Promise<number | null> {
  try {
    const res = await fetch(
      'https://api.stlouisfed.org/fred/series/observations?series_id=DTWEXBGS&sort_order=desc&limit=1&file_type=json&api_key=DEMO_KEY',
      { next: { revalidate: 3600 } }
    );

    if (!res.ok) return null;

    const data = await res.json();
    if (data.observations && data.observations.length > 0) {
      const value = parseFloat(data.observations[0].value);
      return isNaN(value) ? null : value;
    }
    return null;
  } catch (error) {
    console.error('Error fetching DXY:', error);
    return null;
  }
}

/**
 * Fetch VIX (CBOE Volatility Index)
 * Using free Yahoo Finance endpoint
 */
async function fetchVIX(): Promise<number | null> {
  try {
    // Yahoo Finance API for VIX
    const res = await fetch(
      'https://query1.finance.yahoo.com/v8/finance/chart/%5EVIX?interval=1d&range=1d',
      {
        headers: { 'User-Agent': 'Mozilla/5.0' },
        next: { revalidate: 300 } // 5 min cache
      }
    );

    if (!res.ok) return null;

    const data = await res.json();
    const quote = data.chart?.result?.[0]?.meta?.regularMarketPrice;
    return quote ? parseFloat(quote) : null;
  } catch (error) {
    console.error('Error fetching VIX:', error);
    return null;
  }
}

/**
 * Fetch S&P 500 daily change
 */
async function fetchSP500Change(): Promise<number | null> {
  try {
    const res = await fetch(
      'https://query1.finance.yahoo.com/v8/finance/chart/%5EGSPC?interval=1d&range=2d',
      {
        headers: { 'User-Agent': 'Mozilla/5.0' },
        next: { revalidate: 300 }
      }
    );

    if (!res.ok) return null;

    const data = await res.json();
    const result = data.chart?.result?.[0];
    if (result?.indicators?.quote?.[0]?.close) {
      const closes = result.indicators.quote[0].close.filter((c: number | null) => c !== null);
      if (closes.length >= 2) {
        const prevClose = closes[closes.length - 2];
        const lastClose = closes[closes.length - 1];
        return ((lastClose - prevClose) / prevClose) * 100;
      }
    }
    return null;
  } catch (error) {
    console.error('Error fetching S&P 500:', error);
    return null;
  }
}

/**
 * Fetch Nasdaq daily change
 */
async function fetchNasdaqChange(): Promise<number | null> {
  try {
    const res = await fetch(
      'https://query1.finance.yahoo.com/v8/finance/chart/%5EIXIC?interval=1d&range=2d',
      {
        headers: { 'User-Agent': 'Mozilla/5.0' },
        next: { revalidate: 300 }
      }
    );

    if (!res.ok) return null;

    const data = await res.json();
    const result = data.chart?.result?.[0];
    if (result?.indicators?.quote?.[0]?.close) {
      const closes = result.indicators.quote[0].close.filter((c: number | null) => c !== null);
      if (closes.length >= 2) {
        const prevClose = closes[closes.length - 2];
        const lastClose = closes[closes.length - 1];
        return ((lastClose - prevClose) / prevClose) * 100;
      }
    }
    return null;
  } catch (error) {
    console.error('Error fetching Nasdaq:', error);
    return null;
  }
}

/**
 * Determine overall risk environment based on macro indicators
 */
function determineRiskEnvironment(data: Partial<MacroData>): 'risk-on' | 'risk-off' | 'neutral' {
  let riskScore = 0;

  // VIX < 15 = risk-on, > 25 = risk-off
  if (data.vix !== null && data.vix !== undefined) {
    if (data.vix < 15) riskScore += 1;
    else if (data.vix > 25) riskScore -= 1;
    else if (data.vix > 30) riskScore -= 2;
  }

  // DXY falling = risk-on (weaker dollar = risk assets up)
  // We can't determine direction from single value, so skip for now

  // Equity indices positive = risk-on
  if (data.sp500Change !== null && data.sp500Change !== undefined) {
    if (data.sp500Change > 0.5) riskScore += 1;
    else if (data.sp500Change < -0.5) riskScore -= 1;
  }

  if (data.nasdaqChange !== null && data.nasdaqChange !== undefined) {
    if (data.nasdaqChange > 0.5) riskScore += 1;
    else if (data.nasdaqChange < -0.5) riskScore -= 1;
  }

  if (riskScore >= 2) return 'risk-on';
  if (riskScore <= -2) return 'risk-off';
  return 'neutral';
}

/**
 * Fetch all macro data with caching
 */
export async function fetchMacroData(): Promise<MacroData> {
  // Check cache
  const now = Date.now();
  if (macroCache.data && (now - macroCache.timestamp) < CACHE_TTL) {
    return macroCache.data;
  }

  // Fetch all in parallel
  const [fedFundsRate, treasury10Y, dxy, vix, sp500Change, nasdaqChange] = await Promise.all([
    fetchFedFundsRate(),
    fetch10YYield(),
    fetchDXY(),
    fetchVIX(),
    fetchSP500Change(),
    fetchNasdaqChange()
  ]);

  // Track errors
  const errors: string[] = [];
  if (fedFundsRate === null) errors.push('Fed Funds Rate unavailable');
  if (treasury10Y === null) errors.push('10Y Treasury unavailable');
  if (dxy === null) errors.push('DXY unavailable');
  if (vix === null) errors.push('VIX unavailable');
  if (sp500Change === null) errors.push('S&P 500 unavailable');
  if (nasdaqChange === null) errors.push('Nasdaq unavailable');

  // Determine data quality
  const availableCount = [fedFundsRate, treasury10Y, dxy, vix, sp500Change, nasdaqChange]
    .filter(v => v !== null).length;
  let dataQuality: 'good' | 'partial' | 'stale' = 'good';
  if (availableCount < 3) {
    dataQuality = 'stale';
  } else if (availableCount < 5) {
    dataQuality = 'partial';
  }

  const data: MacroData = {
    fedFundsRate,
    treasury10Y,
    dxy,
    vix,
    sp500Change,
    nasdaqChange,
    lastUpdated: new Date().toISOString(),
    riskEnvironment: 'neutral',
    dataQuality,
    errors: errors.length > 0 ? errors : undefined
  };

  data.riskEnvironment = determineRiskEnvironment(data);

  // Update cache
  macroCache = { data, timestamp: now };

  // Log data quality for debugging
  if (dataQuality !== 'good') {
    console.warn(`Macro data quality: ${dataQuality}. Missing: ${errors.join(', ')}`);
  }

  return data;
}

/**
 * Get risk interpretation text
 */
export function getRiskInterpretation(data: MacroData): string {
  const parts: string[] = [];

  if (data.vix !== null) {
    if (data.vix < 15) parts.push('Low volatility (VIX < 15) - calm markets');
    else if (data.vix > 30) parts.push('High volatility (VIX > 30) - fear in markets');
    else if (data.vix > 20) parts.push('Elevated volatility (VIX > 20) - caution');
  }

  if (data.treasury10Y !== null) {
    if (data.treasury10Y > 5) parts.push('High yields (10Y > 5%) - tight monetary conditions');
    else if (data.treasury10Y < 3) parts.push('Low yields (10Y < 3%) - accommodative conditions');
  }

  if (data.sp500Change !== null && data.nasdaqChange !== null) {
    const avgChange = (data.sp500Change + data.nasdaqChange) / 2;
    if (avgChange > 1) parts.push('Strong equity rally - risk appetite high');
    else if (avgChange < -1) parts.push('Equity selloff - risk aversion');
  }

  return parts.length > 0 ? parts.join('. ') : 'Mixed signals - no clear direction';
}
