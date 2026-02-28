// Natural Language Query Parser for DataLab
// Client-side regex-based parser for common commands

export interface ParsedQuery {
  action: 'add_indicator' | 'set_timerange' | 'set_coin' | 'toggle_feature' | 'compare' | 'filter' | 'unknown';
  params: Record<string, string | number>;
  description: string;
}

const INDICATOR_ALIASES: Record<string, string> = {
  'sma': 'sma', 'simple moving average': 'sma', 'moving average': 'sma',
  'ema': 'ema', 'exponential moving average': 'ema',
  'rsi': 'rsi', 'relative strength': 'rsi',
  'macd': 'macd',
  'bollinger': 'bollinger_upper', 'bb': 'bollinger_upper', 'bollinger bands': 'bollinger_upper',
  'volume': 'volume', 'vol': 'volume',
  'atr': 'atr', 'average true range': 'atr',
  'stochastic': 'stochastic_k', 'stoch': 'stochastic_k',
  'obv': 'obv', 'on balance volume': 'obv',
  'vwap': 'vwap',
  'ichimoku': 'ichimoku_tenkan',
  'adx': 'adx',
  'cci': 'cci',
  'williams': 'williams_r', 'williams r': 'williams_r',
  'fear': 'fear_greed', 'fear and greed': 'fear_greed', 'greed': 'fear_greed',
  'dominance': 'btc_dominance', 'btc dominance': 'btc_dominance',
  'hashrate': 'hashrate', 'hash rate': 'hashrate',
  'difficulty': 'difficulty',
  'tvl': 'defi_tvl', 'defi tvl': 'defi_tvl',
  'drawdown': 'drawdown',
  'volatility': 'rolling_volatility',
  'market cap': 'market_cap', 'mcap': 'market_cap',
};

/**
 * Parse a natural language query into a structured command.
 */
export function parseNaturalLanguageQuery(input: string): ParsedQuery {
  const q = input.trim().toLowerCase();

  // "add X" or "show X"
  const addMatch = q.match(/^(?:add|show|plot|display|overlay)\s+(.+)/);
  if (addMatch) {
    const indicatorText = addMatch[1];

    // Check for indicator with period: "add sma 50" or "add rsi 14"
    const withPeriod = indicatorText.match(/^(\w[\w\s]*?)\s+(\d+)$/);
    if (withPeriod) {
      const alias = withPeriod[1].trim();
      const period = parseInt(withPeriod[2], 10);
      const source = INDICATOR_ALIASES[alias];
      if (source) {
        return {
          action: 'add_indicator',
          params: { source, period },
          description: `Add ${source} with period ${period}`,
        };
      }
    }

    // Check for plain indicator: "add rsi"
    const source = INDICATOR_ALIASES[indicatorText.trim()];
    if (source) {
      return {
        action: 'add_indicator',
        params: { source },
        description: `Add ${source} indicator`,
      };
    }
  }

  // "when X < N" or "when X > N" (filter)
  const whenMatch = q.match(/^when\s+(\w+)\s*([<>]=?)\s*(\d+\.?\d*)/);
  if (whenMatch) {
    const indicator = INDICATOR_ALIASES[whenMatch[1]] ?? whenMatch[1];
    const operator = whenMatch[2];
    const value = parseFloat(whenMatch[3]);
    return {
      action: 'filter',
      params: { indicator, operator, value },
      description: `Highlight when ${indicator} ${operator} ${value}`,
    };
  }

  // Time range: "show 7 days" or "last 90d" or "1 year"
  const timeMatch = q.match(/(?:show|last|set)?\s*(\d+)\s*(d|day|days|w|week|weeks|m|month|months|y|year|years)/);
  if (timeMatch) {
    const num = parseInt(timeMatch[1], 10);
    const unit = timeMatch[2].charAt(0);
    const multiplier: Record<string, number> = { d: 1, w: 7, m: 30, y: 365 };
    const days = num * (multiplier[unit] ?? 1);
    return {
      action: 'set_timerange',
      params: { days },
      description: `Set time range to ${days} days`,
    };
  }

  // Coin: "switch to ETH" or "show ethereum"
  const coinMatch = q.match(/^(?:switch to|change to|set coin|show)\s+(\w+)$/);
  if (coinMatch) {
    const coin = coinMatch[1].toLowerCase();
    const COIN_ALIASES: Record<string, string> = {
      btc: 'bitcoin', bitcoin: 'bitcoin',
      eth: 'ethereum', ethereum: 'ethereum',
      sol: 'solana', solana: 'solana',
      bnb: 'binancecoin',
      xrp: 'ripple', ripple: 'ripple',
      ada: 'cardano', cardano: 'cardano',
      doge: 'dogecoin', dogecoin: 'dogecoin',
      dot: 'polkadot', polkadot: 'polkadot',
      avax: 'avalanche-2', avalanche: 'avalanche-2',
      link: 'chainlink', chainlink: 'chainlink',
    };
    const coinId = COIN_ALIASES[coin] ?? coin;
    return {
      action: 'set_coin',
      params: { coin: coinId },
      description: `Switch to ${coinId}`,
    };
  }

  // Compare: "compare BTC ETH"
  const compareMatch = q.match(/^compare\s+(\w+)\s+(?:and\s+|vs\s+|with\s+)?(\w+)/);
  if (compareMatch) {
    return {
      action: 'compare',
      params: { coin1: compareMatch[1].toLowerCase(), coin2: compareMatch[2].toLowerCase() },
      description: `Compare ${compareMatch[1]} and ${compareMatch[2]}`,
    };
  }

  // Toggle features
  const toggleMatch = q.match(/^(?:toggle|enable|disable|turn on|turn off)\s+(.+)/);
  if (toggleMatch) {
    const featureText = toggleMatch[1].trim();
    const FEATURE_ALIASES: Record<string, string> = {
      'log': 'logScale', 'log scale': 'logScale', 'logarithmic': 'logScale',
      'normalize': 'normalizeMode', 'normalize mode': 'normalizeMode',
      'table': 'showTable', 'data table': 'showTable',
      'regimes': 'showRegimes', 'regime': 'showRegimes',
      'events': 'showEvents', 'event markers': 'showEvents',
      'divergence': 'showDivergences', 'divergences': 'showDivergences',
    };
    const feature = FEATURE_ALIASES[featureText] ?? featureText;
    return {
      action: 'toggle_feature',
      params: { feature },
      description: `Toggle ${feature}`,
    };
  }

  return {
    action: 'unknown',
    params: {},
    description: `Could not parse: "${input}"`,
  };
}
