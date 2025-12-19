import { NextResponse } from 'next/server';
import {
  generateCoinPrediction,
  generateQuickPrediction,
  type MarketData,
  type SentimentData,
  type MacroData,
  type DerivativesData
} from '@/lib/predictionEngine';
import { fetchMacroData } from '@/lib/macroData';
import { fetchDerivativesData } from '@/lib/derivativesData';

export const dynamic = 'force-dynamic';
export const revalidate = 120; // 2 minutes

// Map funding heat level from derivativesData format to predictionEngine format
function mapFundingHeatLevel(
  level: 'extreme_long' | 'bullish' | 'neutral' | 'bearish' | 'extreme_short'
): 'extreme_long' | 'high_long' | 'neutral' | 'high_short' | 'extreme_short' {
  switch (level) {
    case 'extreme_long': return 'extreme_long';
    case 'bullish': return 'high_long';
    case 'neutral': return 'neutral';
    case 'bearish': return 'high_short';
    case 'extreme_short': return 'extreme_short';
    default: return 'neutral';
  }
}

// Fetch coin market data from CoinGecko
async function fetchCoinMarketData(coinId: string): Promise<MarketData | null> {
  try {
    const response = await fetch(
      `https://api.coingecko.com/api/v3/coins/${coinId}?localization=false&tickers=false&community_data=false&developer_data=false`,
      { next: { revalidate: 60 } }
    );

    if (!response.ok) return null;

    const data = await response.json();

    return {
      price: data.market_data?.current_price?.usd || 0,
      priceChange24h: data.market_data?.price_change_percentage_24h || 0,
      priceChange7d: data.market_data?.price_change_percentage_7d || 0,
      priceChange30d: data.market_data?.price_change_percentage_30d || 0,
      volume24h: data.market_data?.total_volume?.usd || 0,
      marketCap: data.market_data?.market_cap?.usd || 0,
      high24h: data.market_data?.high_24h?.usd || 0,
      low24h: data.market_data?.low_24h?.usd || 0
    };
  } catch (error) {
    console.error('Error fetching coin market data:', error);
    return null;
  }
}

// Fetch sentiment data
async function fetchSentimentData(): Promise<SentimentData> {
  try {
    const response = await fetch(
      'https://api.alternative.me/fng/?limit=1',
      { next: { revalidate: 300 } }
    );

    if (!response.ok) {
      return { fearGreedIndex: 50, fearGreedLabel: 'Neutral' };
    }

    const data = await response.json();
    const fgData = data.data?.[0];

    return {
      fearGreedIndex: parseInt(fgData?.value || '50'),
      fearGreedLabel: fgData?.value_classification || 'Neutral'
    };
  } catch (error) {
    console.error('Error fetching sentiment:', error);
    return { fearGreedIndex: 50, fearGreedLabel: 'Neutral' };
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const coinId = searchParams.get('coin') || 'bitcoin';
    const coinName = searchParams.get('name') || coinId.charAt(0).toUpperCase() + coinId.slice(1);
    const quick = searchParams.get('quick') === 'true';

    // Fetch all required data in parallel
    const [marketData, sentimentData, macroDataResult, derivativesDataResult] = await Promise.all([
      fetchCoinMarketData(coinId),
      fetchSentimentData(),
      fetchMacroData(),
      fetchDerivativesData()
    ]);

    if (!marketData) {
      return NextResponse.json({
        success: false,
        error: `Could not fetch market data for ${coinId}`,
        data: null
      }, { status: 404 });
    }

    // Convert macro data to expected format (with defaults for null values)
    const macroData: MacroData = {
      fedFundsRate: macroDataResult.fedFundsRate ?? 5.25,
      treasury10Y: macroDataResult.treasury10Y ?? 4.5,
      vix: macroDataResult.vix ?? 20,
      dxy: macroDataResult.dxy ?? 104,
      riskEnvironment: macroDataResult.riskEnvironment as 'risk_on' | 'risk_off' | 'neutral'
    };

    // Convert derivatives data to expected format (map from derivativesData.ts structure to predictionEngine.ts structure)
    const derivativesData: DerivativesData = {
      btcOpenInterest: derivativesDataResult.btc?.openInterest ?? 0,
      ethOpenInterest: derivativesDataResult.eth?.openInterest ?? 0,
      btcFundingRate: derivativesDataResult.btc?.fundingRate ?? 0,
      ethFundingRate: derivativesDataResult.eth?.fundingRate ?? 0,
      liquidations24h: derivativesDataResult.totalLiquidations24h ?? 0,
      fundingHeatLevel: mapFundingHeatLevel(derivativesDataResult.fundingHeatLevel)
    };

    // Generate prediction
    let prediction;
    if (quick) {
      prediction = generateQuickPrediction(
        coinId,
        coinName,
        marketData,
        sentimentData,
        macroData,
        derivativesData
      );
    } else {
      prediction = await generateCoinPrediction(
        coinId,
        coinName,
        marketData,
        sentimentData,
        macroData,
        derivativesData
      );
    }

    return NextResponse.json({
      success: true,
      data: prediction
    });
  } catch (error) {
    console.error('Prediction API error:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to generate prediction',
      data: null
    }, { status: 500 });
  }
}

// Batch prediction endpoint
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { coins } = body; // Array of { id, name }

    if (!coins || !Array.isArray(coins) || coins.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'Please provide an array of coins',
        data: null
      }, { status: 400 });
    }

    // Limit to 10 coins per request
    const coinsToProcess = coins.slice(0, 10);

    // Fetch shared data once
    const [sentimentData, macroDataResult, derivativesDataResult] = await Promise.all([
      fetchSentimentData(),
      fetchMacroData(),
      fetchDerivativesData()
    ]);

    const macroData: MacroData = {
      fedFundsRate: macroDataResult.fedFundsRate ?? 5.25,
      treasury10Y: macroDataResult.treasury10Y ?? 4.5,
      vix: macroDataResult.vix ?? 20,
      dxy: macroDataResult.dxy ?? 104,
      riskEnvironment: macroDataResult.riskEnvironment as 'risk_on' | 'risk_off' | 'neutral'
    };

    const derivativesData: DerivativesData = {
      btcOpenInterest: derivativesDataResult.btc?.openInterest ?? 0,
      ethOpenInterest: derivativesDataResult.eth?.openInterest ?? 0,
      btcFundingRate: derivativesDataResult.btc?.fundingRate ?? 0,
      ethFundingRate: derivativesDataResult.eth?.fundingRate ?? 0,
      liquidations24h: derivativesDataResult.totalLiquidations24h ?? 0,
      fundingHeatLevel: mapFundingHeatLevel(derivativesDataResult.fundingHeatLevel)
    };

    // Fetch market data for all coins in parallel
    const marketDataPromises = coinsToProcess.map(coin =>
      fetchCoinMarketData(coin.id)
    );
    const marketDataResults = await Promise.all(marketDataPromises);

    // Generate predictions for each coin
    const predictions = coinsToProcess.map((coin, index) => {
      const marketData = marketDataResults[index];

      if (!marketData) {
        return {
          coinId: coin.id,
          coinName: coin.name,
          error: 'Could not fetch market data'
        };
      }

      return generateQuickPrediction(
        coin.id,
        coin.name,
        marketData,
        sentimentData,
        macroData,
        derivativesData
      );
    });

    return NextResponse.json({
      success: true,
      data: predictions,
      count: predictions.length
    });
  } catch (error) {
    console.error('Batch prediction API error:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to generate predictions',
      data: null
    }, { status: 500 });
  }
}
