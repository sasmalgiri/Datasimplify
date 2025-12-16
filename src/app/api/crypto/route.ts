import { NextResponse } from 'next/server';
import { CoinMarketData } from '@/types/crypto';

// Binance API - PRIMARY SOURCE (FREE, no key, 6000 req/min)
const BINANCE_BASE = 'https://api.binance.com/api/v3';

// Top 50 coins with metadata (Binance doesn't have images/names)
const COIN_METADATA: Record<string, { name: string; image: string; maxSupply: number | null; circulatingSupply: number }> = {
  'BTCUSDT': { name: 'Bitcoin', image: 'https://assets.coingecko.com/coins/images/1/large/bitcoin.png', maxSupply: 21000000, circulatingSupply: 19800000 },
  'ETHUSDT': { name: 'Ethereum', image: 'https://assets.coingecko.com/coins/images/279/large/ethereum.png', maxSupply: null, circulatingSupply: 120400000 },
  'BNBUSDT': { name: 'BNB', image: 'https://assets.coingecko.com/coins/images/825/large/bnb-icon2_2x.png', maxSupply: 200000000, circulatingSupply: 145000000 },
  'SOLUSDT': { name: 'Solana', image: 'https://assets.coingecko.com/coins/images/4128/large/solana.png', maxSupply: null, circulatingSupply: 477000000 },
  'XRPUSDT': { name: 'XRP', image: 'https://assets.coingecko.com/coins/images/44/large/xrp-symbol-white-128.png', maxSupply: 100000000000, circulatingSupply: 57000000000 },
  'ADAUSDT': { name: 'Cardano', image: 'https://assets.coingecko.com/coins/images/975/large/cardano.png', maxSupply: 45000000000, circulatingSupply: 35000000000 },
  'DOGEUSDT': { name: 'Dogecoin', image: 'https://assets.coingecko.com/coins/images/5/large/dogecoin.png', maxSupply: null, circulatingSupply: 147000000000 },
  'AVAXUSDT': { name: 'Avalanche', image: 'https://assets.coingecko.com/coins/images/12559/large/Avalanche_Circle_RedWhite_Trans.png', maxSupply: 720000000, circulatingSupply: 410000000 },
  'LINKUSDT': { name: 'Chainlink', image: 'https://assets.coingecko.com/coins/images/877/large/chainlink-new-logo.png', maxSupply: 1000000000, circulatingSupply: 630000000 },
  'DOTUSDT': { name: 'Polkadot', image: 'https://assets.coingecko.com/coins/images/12171/large/polkadot.png', maxSupply: null, circulatingSupply: 1500000000 },
  'MATICUSDT': { name: 'Polygon', image: 'https://assets.coingecko.com/coins/images/4713/large/polygon.png', maxSupply: 10000000000, circulatingSupply: 10000000000 },
  'TRXUSDT': { name: 'TRON', image: 'https://assets.coingecko.com/coins/images/1094/large/tron-logo.png', maxSupply: null, circulatingSupply: 86000000000 },
  'LTCUSDT': { name: 'Litecoin', image: 'https://assets.coingecko.com/coins/images/2/large/litecoin.png', maxSupply: 84000000, circulatingSupply: 75000000 },
  'SHIBUSDT': { name: 'Shiba Inu', image: 'https://assets.coingecko.com/coins/images/11939/large/shiba.png', maxSupply: null, circulatingSupply: 589000000000000 },
  'UNIUSDT': { name: 'Uniswap', image: 'https://assets.coingecko.com/coins/images/12504/large/uni.jpg', maxSupply: 1000000000, circulatingSupply: 600000000 },
  'XLMUSDT': { name: 'Stellar', image: 'https://assets.coingecko.com/coins/images/100/large/Stellar_symbol_black_RGB.png', maxSupply: 50000000000, circulatingSupply: 30000000000 },
  'ATOMUSDT': { name: 'Cosmos', image: 'https://assets.coingecko.com/coins/images/1481/large/cosmos_hub.png', maxSupply: null, circulatingSupply: 390000000 },
  'NEARUSDT': { name: 'NEAR Protocol', image: 'https://assets.coingecko.com/coins/images/10365/large/near.jpg', maxSupply: 1000000000, circulatingSupply: 1200000000 },
  'ICPUSDT': { name: 'Internet Computer', image: 'https://assets.coingecko.com/coins/images/14495/large/Internet_Computer_logo.png', maxSupply: null, circulatingSupply: 470000000 },
  'APTUSDT': { name: 'Aptos', image: 'https://assets.coingecko.com/coins/images/26455/large/aptos_round.png', maxSupply: null, circulatingSupply: 500000000 },
  'FILUSDT': { name: 'Filecoin', image: 'https://assets.coingecko.com/coins/images/12817/large/filecoin.png', maxSupply: null, circulatingSupply: 600000000 },
  'ETCUSDT': { name: 'Ethereum Classic', image: 'https://assets.coingecko.com/coins/images/453/large/ethereum-classic-logo.png', maxSupply: 210700000, circulatingSupply: 148000000 },
  'ARBUSDT': { name: 'Arbitrum', image: 'https://assets.coingecko.com/coins/images/16547/large/photo_2023-03-29_21.47.00.jpeg', maxSupply: 10000000000, circulatingSupply: 4000000000 },
  'OPUSDT': { name: 'Optimism', image: 'https://assets.coingecko.com/coins/images/25244/large/Optimism.png', maxSupply: null, circulatingSupply: 1200000000 },
  'SUIUSDT': { name: 'Sui', image: 'https://assets.coingecko.com/coins/images/26375/large/sui_asset.jpeg', maxSupply: 10000000000, circulatingSupply: 2800000000 },
  'INJUSDT': { name: 'Injective', image: 'https://assets.coingecko.com/coins/images/12882/large/Secondary_Symbol.png', maxSupply: 100000000, circulatingSupply: 97000000 },
  'AABORUSDT': { name: 'Aave', image: 'https://assets.coingecko.com/coins/images/12645/large/AAVE.png', maxSupply: 16000000, circulatingSupply: 15000000 },
  'GRTUSDT': { name: 'The Graph', image: 'https://assets.coingecko.com/coins/images/13397/large/Graph_Token.png', maxSupply: null, circulatingSupply: 9500000000 },
  'SANDUSDT': { name: 'The Sandbox', image: 'https://assets.coingecko.com/coins/images/12129/large/sandbox_logo.jpg', maxSupply: 3000000000, circulatingSupply: 2300000000 },
  'MANAUSDT': { name: 'Decentraland', image: 'https://assets.coingecko.com/coins/images/878/large/decentraland-mana.png', maxSupply: null, circulatingSupply: 1900000000 },
};

// Fetch all prices from Binance (single API call)
async function getBinanceData(): Promise<CoinMarketData[]> {
  try {
    const response = await fetch(`${BINANCE_BASE}/ticker/24hr`, {
      headers: { 'Accept': 'application/json' },
      next: { revalidate: 10 }, // Cache for 10 seconds
    });
    
    if (!response.ok) {
      console.error('Binance API error:', response.status);
      return [];
    }
    
    const tickers = await response.json();
    const coins: CoinMarketData[] = [];
    let rank = 1;
    
    // Process only USDT pairs that we have metadata for
    for (const symbol of Object.keys(COIN_METADATA)) {
      const ticker = tickers.find((t: { symbol: string }) => t.symbol === symbol);
      if (!ticker) continue;
      
      const meta = COIN_METADATA[symbol];
      const price = parseFloat(ticker.lastPrice);
      const volume = parseFloat(ticker.quoteVolume);
      const supply = meta.circulatingSupply;
      const marketCap = price * supply;
      
      coins.push({
        id: symbol.replace('USDT', '').toLowerCase(),
        symbol: symbol.replace('USDT', '').toLowerCase(),
        name: meta.name,
        image: meta.image,
        current_price: price,
        market_cap: marketCap,
        market_cap_rank: rank,
        fully_diluted_valuation: meta.maxSupply ? price * meta.maxSupply : null,
        total_volume: volume,
        high_24h: parseFloat(ticker.highPrice),
        low_24h: parseFloat(ticker.lowPrice),
        price_change_24h: parseFloat(ticker.priceChange),
        price_change_percentage_24h: parseFloat(ticker.priceChangePercent),
        price_change_percentage_7d: 0, // Not available from Binance
        price_change_percentage_30d: 0,
        market_cap_change_24h: 0,
        market_cap_change_percentage_24h: parseFloat(ticker.priceChangePercent),
        circulating_supply: supply,
        total_supply: meta.maxSupply,
        max_supply: meta.maxSupply,
        ath: 0,
        ath_change_percentage: 0,
        ath_date: '',
        atl: 0,
        atl_change_percentage: 0,
        atl_date: '',
        last_updated: new Date().toISOString(),
      });
      
      rank++;
    }
    
    // Sort by market cap
    coins.sort((a, b) => b.market_cap - a.market_cap);
    
    // Re-assign ranks after sorting
    coins.forEach((coin, index) => {
      coin.market_cap_rank = index + 1;
    });
    
    return coins;
  } catch (error) {
    console.error('Binance fetch error:', error);
    return [];
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const limit = parseInt(searchParams.get('limit') || '100');

  try {
    // Use Binance as PRIMARY source (FREE, reliable, real-time)
    const coins = await getBinanceData();
    
    if (coins.length > 0) {
      return NextResponse.json({
        coins: coins.slice(0, limit),
        total: coins.length,
        source: 'binance',
        updated: new Date().toISOString(),
      });
    }
    
    // Binance failed (rare)
    return NextResponse.json(
      { error: 'Unable to fetch data', coins: [] },
      { status: 503 }
    );
    
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch data', coins: [] },
      { status: 500 }
    );
  }
}
