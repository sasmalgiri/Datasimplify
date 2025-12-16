import { NextResponse } from 'next/server';

// Binance API - PRIMARY SOURCE (FREE)
const BINANCE_BASE = 'https://api.binance.com/api/v3';

// Approximate circulating supplies for market cap calculation
const SUPPLIES: Record<string, number> = {
  'BTCUSDT': 19800000,
  'ETHUSDT': 120400000,
  'BNBUSDT': 145000000,
  'SOLUSDT': 477000000,
  'XRPUSDT': 57000000000,
};

export async function GET() {
  try {
    const response = await fetch(`${BINANCE_BASE}/ticker/24hr`, {
      headers: { 'Accept': 'application/json' },
      next: { revalidate: 10 },
    });
    
    if (!response.ok) {
      return NextResponse.json(
        { error: 'Binance API error' },
        { status: 503 }
      );
    }
    
    const tickers = await response.json();
    
    // Get key tickers
    const btc = tickers.find((t: { symbol: string }) => t.symbol === 'BTCUSDT');
    const eth = tickers.find((t: { symbol: string }) => t.symbol === 'ETHUSDT');
    
    // Calculate total volume from all USDT pairs
    let totalVolume = 0;
    let totalMarketCap = 0;
    
    for (const ticker of tickers) {
      if (ticker.symbol.endsWith('USDT')) {
        totalVolume += parseFloat(ticker.quoteVolume);
        
        // Calculate market cap for known coins
        const supply = SUPPLIES[ticker.symbol];
        if (supply) {
          totalMarketCap += parseFloat(ticker.lastPrice) * supply;
        }
      }
    }
    
    // Estimate total market cap (top 5 = ~75% of market)
    const estimatedTotalMarketCap = totalMarketCap / 0.75;
    
    // BTC dominance
    const btcPrice = parseFloat(btc?.lastPrice || '0');
    const btcMarketCap = btcPrice * SUPPLIES['BTCUSDT'];
    const btcDominance = (btcMarketCap / estimatedTotalMarketCap) * 100;
    
    // ETH dominance
    const ethPrice = parseFloat(eth?.lastPrice || '0');
    const ethMarketCap = ethPrice * SUPPLIES['ETHUSDT'];
    const ethDominance = (ethMarketCap / estimatedTotalMarketCap) * 100;
    
    return NextResponse.json({
      total_market_cap: estimatedTotalMarketCap,
      total_volume: totalVolume,
      market_cap_percentage: {
        btc: Math.round(btcDominance * 10) / 10,
        eth: Math.round(ethDominance * 10) / 10,
      },
      market_cap_change_percentage_24h: parseFloat(btc?.priceChangePercent || '0'),
      active_cryptocurrencies: tickers.filter((t: { symbol: string }) => t.symbol.endsWith('USDT')).length,
      source: 'binance',
      updated: new Date().toISOString(),
    });
    
  } catch (error) {
    console.error('Global API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch global data' },
      { status: 500 }
    );
  }
}
