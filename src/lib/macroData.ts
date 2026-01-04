/**
 * Macro Economic Data Fetcher
 * Fetches Fed Funds Rate, 10Y Yield, USD Index, VIX from free APIs
 */

import { isFeatureEnabled } from '@/lib/featureFlags';

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
 * Fetch Federal Funds Effective Rate
 * Uses Treasury.gov API as primary source (FREE, no key required)
 */
async function fetchFedFundsRate(): Promise<number | null> {
  try {
    // Try Treasury.gov API first (FREE, no API key needed)
    // This provides daily Treasury rates which correlate with Fed Funds
    const res = await fetch(
      'https://api.fiscaldata.treasury.gov/services/api/fiscal_service/v2/accounting/od/avg_interest_rates?sort=-record_date&page[size]=1',
      { next: { revalidate: 3600 } } // Cache for 1 hour
    );

    if (res.ok) {
      const data = await res.json();
      if (data.data && data.data.length > 0) {
        // Use the average interest rate as a proxy
        const rate = parseFloat(data.data[0].avg_interest_rate_amt);
        if (!isNaN(rate)) {
          apiStatus.fedFunds.lastSuccess = new Date().toISOString();
          apiStatus.fedFunds.consecutiveFailures = 0;
          return rate;
        }
      }
    }

    // Fallback: Try CoinGecko's global data which includes some macro context
    return await fetchFedFundsFromAlternative();
  } catch (error) {
    console.error('Error fetching Fed Funds Rate:', error);
    apiStatus.fedFunds.lastError = String(error);
    apiStatus.fedFunds.consecutiveFailures++;
    return await fetchFedFundsFromAlternative();
  }
}

async function fetchFedFundsFromAlternative(): Promise<number | null> {
  try {
    // World Bank API - FREE, no key needed
    // Provides US interest rate data (slightly delayed but reliable)
    const res = await fetch(
      'https://api.worldbank.org/v2/country/USA/indicator/FR.INR.RINR?format=json&per_page=1&mrv=1',
      { next: { revalidate: 86400 } } // Cache for 24 hours (World Bank data updates less frequently)
    );

    if (res.ok) {
      const data = await res.json();
      if (data[1] && data[1][0] && data[1][0].value !== null) {
        return parseFloat(data[1][0].value);
      }
    }

    // If all APIs fail, return null (will be shown as "unavailable" in UI)
    return null;
  } catch {
    return null;
  }
}

/**
 * Fetch 10-Year Treasury Yield
 * Uses Treasury.gov API (FREE, no key required)
 */
async function fetch10YYield(): Promise<number | null> {
  try {
    // Treasury.gov Direct API - FREE, no key needed
    const res = await fetch(
      'https://api.fiscaldata.treasury.gov/services/api/fiscal_service/v2/accounting/od/avg_interest_rates?filter=security_desc:eq:Treasury%20Notes&sort=-record_date&page[size]=1',
      { next: { revalidate: 3600 } }
    );

    if (res.ok) {
      const data = await res.json();
      if (data.data && data.data.length > 0) {
        const rate = parseFloat(data.data[0].avg_interest_rate_amt);
        if (!isNaN(rate)) {
          apiStatus.treasury10Y.lastSuccess = new Date().toISOString();
          apiStatus.treasury10Y.consecutiveFailures = 0;
          return rate;
        }
      }
    }

    // Fallback: Try Yahoo Finance for TNX (10-Year Treasury Index)
    // (Often more restrictive; keep OFF unless explicitly enabled.)
    if (!isFeatureEnabled('macroYahoo')) return null;
    const yahooRes = await fetch(
      'https://query1.finance.yahoo.com/v8/finance/chart/%5ETNX?interval=1d&range=1d',
      {
        headers: { 'User-Agent': 'Mozilla/5.0' },
        next: { revalidate: 300 }
      }
    );

    if (yahooRes.ok) {
      const yahooData = await yahooRes.json();
      const yield10Y = yahooData.chart?.result?.[0]?.meta?.regularMarketPrice;
      if (yield10Y) return parseFloat(yield10Y);
    }

    return null;
  } catch (error) {
    console.error('Error fetching 10Y Yield:', error);
    apiStatus.treasury10Y.lastError = String(error);
    apiStatus.treasury10Y.consecutiveFailures++;
    return null;
  }
}

/**
 * Fetch USD Index (DXY) - US Dollar Index
 * Uses Yahoo Finance (FREE)
 */
async function fetchDXY(): Promise<number | null> {
  try {
    if (!isFeatureEnabled('macroYahoo')) return null;
    // Yahoo Finance DX-Y.NYB (US Dollar Index)
    const res = await fetch(
      'https://query1.finance.yahoo.com/v8/finance/chart/DX-Y.NYB?interval=1d&range=1d',
      {
        headers: { 'User-Agent': 'Mozilla/5.0' },
        next: { revalidate: 300 } // 5 min cache
      }
    );

    if (res.ok) {
      const data = await res.json();
      const dxy = data.chart?.result?.[0]?.meta?.regularMarketPrice;
      if (dxy) {
        apiStatus.dxy.lastSuccess = new Date().toISOString();
        apiStatus.dxy.consecutiveFailures = 0;
        return parseFloat(dxy);
      }
    }

    // Fallback: Try alternative Yahoo symbol
    const altRes = await fetch(
      'https://query1.finance.yahoo.com/v8/finance/chart/%5EUSDX?interval=1d&range=1d',
      {
        headers: { 'User-Agent': 'Mozilla/5.0' },
        next: { revalidate: 300 }
      }
    );

    if (altRes.ok) {
      const altData = await altRes.json();
      const altDxy = altData.chart?.result?.[0]?.meta?.regularMarketPrice;
      if (altDxy) return parseFloat(altDxy);
    }

    return null;
  } catch (error) {
    console.error('Error fetching DXY:', error);
    apiStatus.dxy.lastError = String(error);
    apiStatus.dxy.consecutiveFailures++;
    return null;
  }
}

/**
 * Fetch VIX (CBOE Volatility Index)
 * Using free Yahoo Finance endpoint
 */
async function fetchVIX(): Promise<number | null> {
  try {
    if (!isFeatureEnabled('macroYahoo')) return null;
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
    if (!isFeatureEnabled('macroYahoo')) return null;
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
    if (!isFeatureEnabled('macroYahoo')) return null;
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
  if (!isFeatureEnabled('macro')) {
    return {
      fedFundsRate: null,
      treasury10Y: null,
      dxy: null,
      vix: null,
      sp500Change: null,
      nasdaqChange: null,
      lastUpdated: new Date().toISOString(),
      riskEnvironment: 'neutral',
      dataQuality: 'stale',
      errors: ['Macro feature is disabled'],
    };
  }

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
