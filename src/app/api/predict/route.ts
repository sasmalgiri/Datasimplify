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
import {
  getPredictionFromCache,
  savePredictionToCache,
  getCoinMarketDataFromCache,
  saveCoinMarketDataToCache,
  type CachedPrediction
} from '@/lib/supabaseData';
import { isSupabaseConfigured } from '@/lib/supabase';

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

// Fetch coin market data - with Supabase cache fallback
async function fetchCoinMarketData(coinId: string): Promise<MarketData | null> {
  // Try cache first if Supabase is configured
  if (isSupabaseConfigured) {
    try {
      const cached = await getCoinMarketDataFromCache(coinId);
      if (cached) {
        console.log(`[Predict] Using cached market data for ${coinId}`);
        return {
          price: cached.price,
          priceChange24h: cached.price_change_24h,
          priceChange7d: cached.price_change_7d,
          priceChange30d: cached.price_change_30d,
          volume24h: cached.volume_24h,
          marketCap: cached.market_cap,
          high24h: cached.high_24h,
          low24h: cached.low_24h
        };
      }
    } catch (err) {
      console.error('Cache read error:', err);
    }
  }

  // Fetch from CoinGecko
  try {
    const response = await fetch(
      `https://api.coingecko.com/api/v3/coins/${coinId}?localization=false&tickers=false&community_data=false&developer_data=false`,
      { next: { revalidate: 60 } }
    );

    if (!response.ok) {
      console.error(`CoinGecko API error for ${coinId}: ${response.status}`);
      return null;
    }

    const data = await response.json();

    const marketData: MarketData = {
      price: data.market_data?.current_price?.usd || 0,
      priceChange24h: data.market_data?.price_change_percentage_24h || 0,
      priceChange7d: data.market_data?.price_change_percentage_7d || 0,
      priceChange30d: data.market_data?.price_change_percentage_30d || 0,
      volume24h: data.market_data?.total_volume?.usd || 0,
      marketCap: data.market_data?.market_cap?.usd || 0,
      high24h: data.market_data?.high_24h?.usd || 0,
      low24h: data.market_data?.low_24h?.usd || 0
    };

    // Save to cache for next time
    if (isSupabaseConfigured) {
      saveCoinMarketDataToCache(coinId, marketData).catch(err => {
        console.error('Failed to cache market data:', err);
      });
    }

    return marketData;
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

// Convert prediction result to cache format
function toCachedPrediction(prediction: ReturnType<typeof generateQuickPrediction>, coinName: string): CachedPrediction {
  return {
    coin_id: prediction.coinId,
    coin_name: coinName,
    prediction: prediction.prediction,
    confidence: prediction.confidence,
    risk_level: prediction.riskLevel,
    reasons: prediction.reasons,
    technical_score: prediction.technicalScore,
    sentiment_score: prediction.sentimentScore,
    onchain_score: prediction.onChainScore,
    macro_score: prediction.macroScore,
    overall_score: prediction.overallScore,
    updated_at: new Date().toISOString()
  };
}

// Convert cached prediction to API response format
function fromCachedPrediction(cached: CachedPrediction) {
  return {
    coinId: cached.coin_id,
    coinName: cached.coin_name,
    prediction: cached.prediction,
    confidence: cached.confidence,
    riskLevel: cached.risk_level,
    reasons: cached.reasons,
    technicalScore: cached.technical_score,
    sentimentScore: cached.sentiment_score,
    onChainScore: cached.onchain_score,
    macroScore: cached.macro_score,
    overallScore: cached.overall_score,
    timestamp: cached.updated_at,
    signals: [],
    fromCache: true
  };
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const coinId = searchParams.get('coin') || 'bitcoin';
    const coinName = searchParams.get('name') || coinId.charAt(0).toUpperCase() + coinId.slice(1);
    const quick = searchParams.get('quick') === 'true';
    const skipCache = searchParams.get('skipCache') === 'true';

    // Check prediction cache first (if not skipped)
    if (isSupabaseConfigured && !skipCache) {
      try {
        const cachedPrediction = await getPredictionFromCache(coinId);
        if (cachedPrediction) {
          console.log(`[Predict] Returning cached prediction for ${coinId}`);
          return NextResponse.json({
            success: true,
            data: fromCachedPrediction(cachedPrediction),
            source: 'cache'
          });
        }
      } catch (err) {
        console.error('Prediction cache read error:', err);
      }
    }

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

    // Convert derivatives data to expected format
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

    // Save to cache for next time
    if (isSupabaseConfigured) {
      savePredictionToCache(toCachedPrediction(prediction, coinName)).catch(err => {
        console.error('Failed to cache prediction:', err);
      });
    }

    return NextResponse.json({
      success: true,
      data: prediction,
      source: 'fresh'
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

    // Check cache for existing predictions
    const predictions: (ReturnType<typeof generateQuickPrediction> | { coinId: string; coinName: string; error: string })[] = [];
    const coinsNeedingFresh: { id: string; name: string; index: number }[] = [];

    if (isSupabaseConfigured) {
      for (let i = 0; i < coinsToProcess.length; i++) {
        const coin = coinsToProcess[i];
        try {
          const cached = await getPredictionFromCache(coin.id);
          if (cached) {
            predictions[i] = fromCachedPrediction(cached);
          } else {
            coinsNeedingFresh.push({ ...coin, index: i });
          }
        } catch {
          coinsNeedingFresh.push({ ...coin, index: i });
        }
      }
    } else {
      coinsToProcess.forEach((coin, i) => coinsNeedingFresh.push({ ...coin, index: i }));
    }

    // Fetch fresh data only for coins not in cache
    if (coinsNeedingFresh.length > 0) {
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

      // Fetch market data for coins not in cache
      const marketDataPromises = coinsNeedingFresh.map(coin =>
        fetchCoinMarketData(coin.id)
      );
      const marketDataResults = await Promise.all(marketDataPromises);

      // Generate predictions for each coin
      for (let i = 0; i < coinsNeedingFresh.length; i++) {
        const coin = coinsNeedingFresh[i];
        const marketData = marketDataResults[i];

        if (!marketData) {
          predictions[coin.index] = {
            coinId: coin.id,
            coinName: coin.name,
            error: 'Could not fetch market data'
          };
          continue;
        }

        const prediction = generateQuickPrediction(
          coin.id,
          coin.name,
          marketData,
          sentimentData,
          macroData,
          derivativesData
        );

        predictions[coin.index] = prediction;

        // Cache the prediction
        if (isSupabaseConfigured) {
          savePredictionToCache(toCachedPrediction(prediction, coin.name)).catch(() => {});
        }
      }
    }

    return NextResponse.json({
      success: true,
      data: predictions.filter(Boolean),
      count: predictions.filter(Boolean).length
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
