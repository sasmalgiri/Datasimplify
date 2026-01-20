/**
 * Formula Mapping Utility
 * Maps CryptoSheets formulas to CRK (CryptoReportKit) equivalents
 *
 * CryptoSheets format: =CRYPTOSHEETS("endpoint", "coin", "field")
 * CRK format: =CRK.FUNCTION("coin", params)
 */

export type FormulaMode = 'cryptosheets' | 'crk';

// ============================================
// FORMULA PATTERNS
// ============================================

/**
 * CryptoSheets formula patterns mapped to CRK equivalents
 * $COIN, $CURRENCY, $DAYS, $PERIOD are placeholders for dynamic values
 */
export const FORMULA_MAPPING: Record<string, string> = {
  // ---- Price Formulas ----
  'CRYPTOSHEETS("price","$COIN","current_price")': 'CRK.PRICE("$COIN")',
  'CRYPTOSHEETS("price","$COIN","$CURRENCY")': 'CRK.PRICE("$COIN","$CURRENCY")',
  'CRYPTOSHEETS("price","$COIN","price_change_percentage_24h")': 'CRK.CHANGE24H("$COIN")',
  'CRYPTOSHEETS("price","$COIN","price_change_24h")': 'CRK.CHANGE24H("$COIN")',
  'CRYPTOSHEETS("price","$COIN","market_cap")': 'CRK.MARKETCAP("$COIN")',
  'CRYPTOSHEETS("price","$COIN","market_cap","$CURRENCY")': 'CRK.MARKETCAP("$COIN","$CURRENCY")',
  'CRYPTOSHEETS("price","$COIN","total_volume")': 'CRK.VOLUME("$COIN")',
  'CRYPTOSHEETS("price","$COIN","total_volume","$CURRENCY")': 'CRK.VOLUME("$COIN","$CURRENCY")',

  // ---- Historical/OHLCV Data ----
  'CRYPTOSHEETS("ohlc","$COIN","$DAYS")': 'CRK.OHLCV("$COIN",$DAYS)',
  'CRYPTOSHEETS("ohlc","$COIN")': 'CRK.OHLCV("$COIN")',
  'CRYPTOSHEETS("history","$COIN","$DAYS")': 'CRK.OHLCV("$COIN",$DAYS)',

  // ---- Coin Info/Metadata ----
  'CRYPTOSHEETS("coin","$COIN","name")': 'CRK.INFO("$COIN","name")',
  'CRYPTOSHEETS("coin","$COIN","symbol")': 'CRK.INFO("$COIN","symbol")',
  'CRYPTOSHEETS("coin","$COIN","market_cap_rank")': 'CRK.INFO("$COIN","rank")',
  'CRYPTOSHEETS("coin","$COIN","ath")': 'CRK.INFO("$COIN","ath")',
  'CRYPTOSHEETS("coin","$COIN","ath_date")': 'CRK.INFO("$COIN","ath_date")',
  'CRYPTOSHEETS("coin","$COIN","atl")': 'CRK.INFO("$COIN","atl")',
  'CRYPTOSHEETS("coin","$COIN","atl_date")': 'CRK.INFO("$COIN","atl_date")',
  'CRYPTOSHEETS("coin","$COIN","circulating_supply")': 'CRK.INFO("$COIN","circulating_supply")',
  'CRYPTOSHEETS("coin","$COIN","total_supply")': 'CRK.INFO("$COIN","total_supply")',
  'CRYPTOSHEETS("coin","$COIN","max_supply")': 'CRK.INFO("$COIN","max_supply")',
  'CRYPTOSHEETS("coin","$COIN","fully_diluted_valuation")': 'CRK.INFO("$COIN","fdv")',

  // ---- Technical Indicators ----
  'CRYPTOSHEETS("rsi","$COIN","$PERIOD")': 'CRK.RSI("$COIN",$PERIOD)',
  'CRYPTOSHEETS("rsi","$COIN")': 'CRK.RSI("$COIN")',
  'CRYPTOSHEETS("macd","$COIN")': 'CRK.MACD("$COIN")',
  'CRYPTOSHEETS("sma","$COIN","$PERIOD")': 'CRK.SMA("$COIN",$PERIOD)',
  'CRYPTOSHEETS("ema","$COIN","$PERIOD")': 'CRK.EMA("$COIN",$PERIOD)',
  'CRYPTOSHEETS("bb","$COIN","$PERIOD")': 'CRK.BBANDS("$COIN",$PERIOD)',

  // ---- Global Market Data ----
  'CRYPTOSHEETS("global","total_market_cap")': 'CRK.GLOBAL("total_market_cap")',
  'CRYPTOSHEETS("global","total_volume_24h")': 'CRK.GLOBAL("total_volume")',
  'CRYPTOSHEETS("global","btc_dominance")': 'CRK.GLOBAL("btc_dominance")',
  'CRYPTOSHEETS("global","eth_dominance")': 'CRK.GLOBAL("eth_dominance")',
  'CRYPTOSHEETS("global","active_cryptocurrencies")': 'CRK.GLOBAL("active_coins")',

  // ---- Fear & Greed Index ----
  'CRYPTOSHEETS("fng")': 'CRK.FEARGREED()',
  'CRYPTOSHEETS("fng","value")': 'CRK.FEARGREED()',
  'CRYPTOSHEETS("fng","classification")': 'CRK.FEARGREED("class")',
  'CRYPTOSHEETS("fng","timestamp")': 'CRK.FEARGREED("timestamp")',
};

// ============================================
// FORMULA CONVERSION FUNCTIONS
// ============================================

/**
 * Convert a CryptoSheets formula to CRK format
 *
 * @param formula - The CryptoSheets formula string (with or without leading =)
 * @returns The equivalent CRK formula
 *
 * @example
 * convertToCRK('=CRYPTOSHEETS("price","bitcoin","current_price")')
 * // Returns: '=CRK.PRICE("bitcoin")'
 */
export function convertToCRK(formula: string): string {
  // Handle empty or non-formula strings
  if (!formula || !formula.includes('CRYPTOSHEETS')) {
    return formula;
  }

  let result = formula;
  const hadEquals = formula.startsWith('=');

  // Remove leading = for processing
  if (hadEquals) {
    result = result.substring(1);
  }

  // Try each mapping pattern
  for (const [csPattern, crkPattern] of Object.entries(FORMULA_MAPPING)) {
    // Build regex from pattern
    // Escape special regex chars, then replace placeholders with capture groups
    const regexPattern = csPattern
      .replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
      .replace(/\\\$COIN/g, '([^"]+)')
      .replace(/\\\$CURRENCY/g, '([^"]+)')
      .replace(/\\\$DAYS/g, '(\\d+)')
      .replace(/\\\$PERIOD/g, '(\\d+)');

    const regex = new RegExp(`^${regexPattern}$`, 'i');
    const match = result.match(regex);

    if (match) {
      // Build replacement with captured values
      let replacement = crkPattern;
      let groupIndex = 1;

      // Replace placeholders with captured values
      replacement = replacement.replace(/\$COIN/g, () => match[groupIndex++] || 'bitcoin');
      replacement = replacement.replace(/\$CURRENCY/g, () => match[groupIndex++] || 'usd');
      replacement = replacement.replace(/\$DAYS/g, () => match[groupIndex++] || '30');
      replacement = replacement.replace(/\$PERIOD/g, () => match[groupIndex++] || '14');

      result = replacement;
      break;
    }
  }

  // Re-add leading = if it was present
  return hadEquals ? `=${result}` : result;
}

/**
 * Convert a CRK formula to CryptoSheets format
 *
 * @param formula - The CRK formula string
 * @returns The equivalent CryptoSheets formula
 */
export function convertToCryptoSheets(formula: string): string {
  if (!formula || !formula.includes('CRK.')) {
    return formula;
  }

  let result = formula;
  const hadEquals = formula.startsWith('=');

  if (hadEquals) {
    result = result.substring(1);
  }

  // Reverse mapping (CRK -> CryptoSheets)
  const reverseMapping: Record<string, string> = {};
  for (const [csPattern, crkPattern] of Object.entries(FORMULA_MAPPING)) {
    reverseMapping[crkPattern] = csPattern;
  }

  for (const [crkPattern, csPattern] of Object.entries(reverseMapping)) {
    const regexPattern = crkPattern
      .replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
      .replace(/\\\$COIN/g, '([^"]+)')
      .replace(/\\\$CURRENCY/g, '([^"]+)')
      .replace(/\\\$DAYS/g, '(\\d+)')
      .replace(/\\\$PERIOD/g, '(\\d+)');

    const regex = new RegExp(`^${regexPattern}$`, 'i');
    const match = result.match(regex);

    if (match) {
      let replacement = csPattern;
      let groupIndex = 1;

      replacement = replacement.replace(/\$COIN/g, () => match[groupIndex++] || 'bitcoin');
      replacement = replacement.replace(/\$CURRENCY/g, () => match[groupIndex++] || 'usd');
      replacement = replacement.replace(/\$DAYS/g, () => match[groupIndex++] || '30');
      replacement = replacement.replace(/\$PERIOD/g, () => match[groupIndex++] || '14');

      result = replacement;
      break;
    }
  }

  return hadEquals ? `=${result}` : result;
}

// ============================================
// FORMULA BUILDERS (for generator.ts)
// ============================================

/**
 * Build a price formula in the specified mode
 */
export function buildPriceFormula(
  coin: string,
  currency: string = 'usd',
  mode: FormulaMode = 'cryptosheets'
): string {
  if (mode === 'crk') {
    return currency.toLowerCase() === 'usd'
      ? `=CRK.PRICE("${coin.toLowerCase()}")`
      : `=CRK.PRICE("${coin.toLowerCase()}","${currency.toLowerCase()}")`;
  }
  return `=CRYPTOSHEETS("price","${coin}","${currency}")`;
}

/**
 * Build a 24h change formula in the specified mode
 */
export function buildChange24hFormula(
  coin: string,
  mode: FormulaMode = 'cryptosheets'
): string {
  if (mode === 'crk') {
    return `=CRK.CHANGE24H("${coin.toLowerCase()}")`;
  }
  return `=CRYPTOSHEETS("price","${coin}","price_change_percentage_24h")`;
}

/**
 * Build a market cap formula in the specified mode
 */
export function buildMarketCapFormula(
  coin: string,
  currency: string = 'usd',
  mode: FormulaMode = 'cryptosheets'
): string {
  if (mode === 'crk') {
    return currency.toLowerCase() === 'usd'
      ? `=CRK.MARKETCAP("${coin.toLowerCase()}")`
      : `=CRK.MARKETCAP("${coin.toLowerCase()}","${currency.toLowerCase()}")`;
  }
  return `=CRYPTOSHEETS("price","${coin}","market_cap")`;
}

/**
 * Build a volume formula in the specified mode
 */
export function buildVolumeFormula(
  coin: string,
  currency: string = 'usd',
  mode: FormulaMode = 'cryptosheets'
): string {
  if (mode === 'crk') {
    return currency.toLowerCase() === 'usd'
      ? `=CRK.VOLUME("${coin.toLowerCase()}")`
      : `=CRK.VOLUME("${coin.toLowerCase()}","${currency.toLowerCase()}")`;
  }
  return `=CRYPTOSHEETS("price","${coin}","total_volume")`;
}

/**
 * Build an OHLCV formula in the specified mode
 */
export function buildOHLCVFormula(
  coin: string,
  days: number = 30,
  mode: FormulaMode = 'cryptosheets'
): string {
  if (mode === 'crk') {
    return `=CRK.OHLCV("${coin.toLowerCase()}",${days})`;
  }
  return `=CRYPTOSHEETS("ohlc","${coin}","${days}")`;
}

/**
 * Build a coin info formula in the specified mode
 */
export function buildInfoFormula(
  coin: string,
  field: string,
  mode: FormulaMode = 'cryptosheets'
): string {
  if (mode === 'crk') {
    // Map CryptoSheets field names to CRK field names
    const fieldMapping: Record<string, string> = {
      'market_cap_rank': 'rank',
      'fully_diluted_valuation': 'fdv',
    };
    const crkField = fieldMapping[field] || field;
    return `=CRK.INFO("${coin.toLowerCase()}","${crkField}")`;
  }
  return `=CRYPTOSHEETS("coin","${coin}","${field}")`;
}

/**
 * Build a Fear & Greed formula in the specified mode
 */
export function buildFearGreedFormula(
  field: 'value' | 'class' | 'timestamp' = 'value',
  mode: FormulaMode = 'cryptosheets'
): string {
  if (mode === 'crk') {
    return field === 'value'
      ? `=CRK.FEARGREED()`
      : `=CRK.FEARGREED("${field}")`;
  }
  return field === 'value'
    ? `=CRYPTOSHEETS("fng")`
    : `=CRYPTOSHEETS("fng","${field}")`;
}

/**
 * Build a global market data formula in the specified mode
 */
export function buildGlobalFormula(
  metric: string,
  mode: FormulaMode = 'cryptosheets'
): string {
  if (mode === 'crk') {
    const metricMapping: Record<string, string> = {
      'total_volume_24h': 'total_volume',
      'active_cryptocurrencies': 'active_coins',
    };
    const crkMetric = metricMapping[metric] || metric;
    return `=CRK.GLOBAL("${crkMetric}")`;
  }
  return `=CRYPTOSHEETS("global","${metric}")`;
}

// ============================================
// BATCH CONVERSION
// ============================================

/**
 * Convert all CryptoSheets formulas in a 2D array to CRK format
 * Useful for converting entire worksheet data
 */
export function convertWorksheetToCRK(data: (string | number | null)[][]): (string | number | null)[][] {
  return data.map(row =>
    row.map(cell => {
      if (typeof cell === 'string' && cell.includes('CRYPTOSHEETS')) {
        return convertToCRK(cell);
      }
      return cell;
    })
  );
}

/**
 * Convert all CRK formulas in a 2D array to CryptoSheets format
 */
export function convertWorksheetToCryptoSheets(data: (string | number | null)[][]): (string | number | null)[][] {
  return data.map(row =>
    row.map(cell => {
      if (typeof cell === 'string' && cell.includes('CRK.')) {
        return convertToCryptoSheets(cell);
      }
      return cell;
    })
  );
}

// ============================================
// FORMULA DETECTION
// ============================================

/**
 * Check if a formula is a CryptoSheets formula
 */
export function isCryptoSheetsFormula(formula: string): boolean {
  return typeof formula === 'string' && formula.toUpperCase().includes('CRYPTOSHEETS');
}

/**
 * Check if a formula is a CRK formula
 */
export function isCRKFormula(formula: string): boolean {
  return typeof formula === 'string' && formula.toUpperCase().includes('CRK.');
}

/**
 * Detect the formula mode used in a worksheet
 * Returns 'mixed' if both types are present
 */
export function detectFormulaMode(data: (string | number | null)[][]): FormulaMode | 'mixed' | 'none' {
  let hasCryptoSheets = false;
  let hasCRK = false;

  for (const row of data) {
    for (const cell of row) {
      if (typeof cell === 'string') {
        if (isCryptoSheetsFormula(cell)) hasCryptoSheets = true;
        if (isCRKFormula(cell)) hasCRK = true;
      }
    }
  }

  if (hasCryptoSheets && hasCRK) return 'mixed';
  if (hasCryptoSheets) return 'cryptosheets';
  if (hasCRK) return 'crk';
  return 'none';
}
