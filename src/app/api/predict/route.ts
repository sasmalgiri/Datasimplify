import { NextResponse } from 'next/server';
import { isFeatureEnabled } from '@/lib/featureFlags';
import {
  generateCoinPrediction,
  generateQuickPrediction,
  type MarketData,
  type SentimentData,
  type MacroData,
  type DerivativesData
} from '@/lib/predictionEngine';
import { fetchTechnicalDataForPrediction } from '@/lib/predictionTechnical';
import { fetchOnChainDataForPrediction } from '@/lib/predictionOnChain';
import { fetchMacroData } from '@/lib/macroData';
import { fetchDerivativesData } from '@/lib/derivativesData';
import {
  getPredictionFromCache,
  getPredictionFromCacheAnyAge,
  savePredictionToCache,
  getCoinMarketDataFromCache,
  saveCoinMarketDataToCache,
  type CachedPrediction
} from '@/lib/supabaseData';
import { isSupabaseConfigured } from '@/lib/supabase';
import { validationError, internalError } from '@/lib/apiErrors';
import { enforceMinInterval } from '@/lib/serverRateLimit';

export const dynamic = 'force-dynamic';
export const revalidate = 120; // 2 minutes

function getClientIp(req: Request): string {
  const xff = req.headers.get('x-forwarded-for');
  if (xff) return xff.split(',')[0].trim();
  return req.headers.get('x-real-ip') || 'unknown';
}

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

  // Fetch from CoinGecko (only when enabled)
  if (!isFeatureEnabled('coingecko')) {
    return null;
  }

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

    const price = data.market_data?.current_price?.usd;
    const priceChange24h = data.market_data?.price_change_percentage_24h;
    const priceChange7d = data.market_data?.price_change_percentage_7d;
    const priceChange30d = data.market_data?.price_change_percentage_30d;
    const volume24h = data.market_data?.total_volume?.usd;
    const marketCap = data.market_data?.market_cap?.usd;
    const high24h = data.market_data?.high_24h?.usd;
    const low24h = data.market_data?.low_24h?.usd;

    const required = [price, priceChange24h, priceChange7d, priceChange30d, volume24h, marketCap, high24h, low24h];
    if (!required.every((v: unknown) => typeof v === 'number' && Number.isFinite(v))) {
      console.error(`CoinGecko returned incomplete market_data for ${coinId}`);
      return null;
    }

    const marketData: MarketData = {
      price,
      priceChange24h,
      priceChange7d,
      priceChange30d,
      volume24h,
      marketCap,
      high24h,
      low24h
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
async function fetchSentimentData(): Promise<SentimentData | null> {
  try {
    const response = await fetch(
      'https://api.alternative.me/fng/?limit=1',
      { next: { revalidate: 300 } }
    );

    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    const fgData = data.data?.[0];

    const parsed = Number.parseInt(fgData?.value);
    if (!Number.isFinite(parsed)) {
      return null;
    }

    return {
      fearGreedIndex: parsed,
      fearGreedLabel: fgData?.value_classification || 'Unknown'
    };
  } catch (error) {
    console.error('Error fetching sentiment:', error);
    return null;
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
    technical_score: prediction.technicalScore ?? null,
    sentiment_score: prediction.sentimentScore ?? null,
    onchain_score: prediction.onChainScore ?? null,
    macro_score: prediction.macroScore ?? null,
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
    technicalScore: cached.technical_score ?? null,
    sentimentScore: cached.sentiment_score ?? null,
    onChainScore: cached.onchain_score ?? null,
    macroScore: cached.macro_score ?? null,
    overallScore: cached.overall_score,
    timestamp: cached.updated_at,
    signals: [],
    fromCache: true
  };
}

function withStaleMeta(cached: CachedPrediction) {
  const base = fromCachedPrediction(cached);
  const ageMs = cached.updated_at ? Date.now() - new Date(cached.updated_at).getTime() : null;
  return {
    ...base,
    stale: true,
    cacheAgeSeconds: typeof ageMs === 'number' && Number.isFinite(ageMs) ? Math.max(0, Math.round(ageMs / 1000)) : null,
  };
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const coinId = searchParams.get('coin') || 'bitcoin';
    const coinName = searchParams.get('name') || coinId.charAt(0).toUpperCase() + coinId.slice(1);
    const quick = searchParams.get('quick') === 'true';
    const skipCache = searchParams.get('skipCache') === 'true';

    const ip = getClientIp(request);
    const minIntervalMs = skipCache ? 30_000 : 5_000;
    const limitResult = enforceMinInterval({
      key: `predict:${ip}:${coinId}:${quick ? 'quick' : 'full'}:${skipCache ? 'skip' : 'cache'}`,
      minIntervalMs,
    });
    if (!limitResult.ok) {
      return NextResponse.json(
        { success: false, error: 'Too many requests. Please wait and try again.' },
        { status: 429, headers: { 'Retry-After': String(limitResult.retryAfterSeconds) } }
      );
    }

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

    const fallbackStale = async (reason: string, status: number) => {
      if (!isSupabaseConfigured || skipCache) {
        return NextResponse.json({ success: false, error: reason }, { status });
      }

      const cachedAny = await getPredictionFromCacheAnyAge(coinId);
      if (!cachedAny) {
        return NextResponse.json({ success: false, error: reason }, { status });
      }

      return NextResponse.json({
        success: true,
        data: withStaleMeta(cachedAny),
        source: 'stale_cache',
        warning: reason,
      });
    };

    // Fetch all required data in parallel
    const [marketData, sentimentData, macroDataResult, derivativesDataResult, technicalData, onChainData] = await Promise.all([
      fetchCoinMarketData(coinId),
      fetchSentimentData(),
      fetchMacroData(),
      fetchDerivativesData(),
      fetchTechnicalDataForPrediction(coinId),
      fetchOnChainDataForPrediction(coinId)
    ]);

    if (!sentimentData) {
      return fallbackStale('Fear & Greed data unavailable (free API error). Serving last cached prediction (may be stale).', 503);
    }

    if (!marketData) {
      return fallbackStale(
        `Could not fetch market data for "${coinId}". Serving last cached prediction if available (may be stale).`,
        404
      );
    }

    if (
      macroDataResult.fedFundsRate === null ||
      macroDataResult.treasury10Y === null ||
      macroDataResult.vix === null ||
      macroDataResult.dxy === null
    ) {
      return fallbackStale('Macro data unavailable (free API error). Serving last cached prediction (may be stale).', 503);
    }

    const macroRiskEnvironment: MacroData['riskEnvironment'] =
      macroDataResult.riskEnvironment === 'risk-on'
        ? 'risk_on'
        : macroDataResult.riskEnvironment === 'risk-off'
          ? 'risk_off'
          : 'neutral';

    const macroData: MacroData = {
      fedFundsRate: macroDataResult.fedFundsRate,
      treasury10Y: macroDataResult.treasury10Y,
      vix: macroDataResult.vix,
      dxy: macroDataResult.dxy,
      riskEnvironment: macroRiskEnvironment
    };

    const btcOpenInterest = derivativesDataResult.btc?.openInterest ?? null;
    const ethOpenInterest = derivativesDataResult.eth?.openInterest ?? null;
    const btcFundingRate = derivativesDataResult.btc?.fundingRate ?? null;
    const ethFundingRate = derivativesDataResult.eth?.fundingRate ?? null;
    const liquidations24h = derivativesDataResult.totalLiquidations24h ?? null;

    if (
      btcOpenInterest === null ||
      ethOpenInterest === null ||
      btcFundingRate === null ||
      ethFundingRate === null ||
      liquidations24h === null
    ) {
      return fallbackStale('Derivatives data unavailable (free API error). Serving last cached prediction (may be stale).', 503);
    }

    const derivativesData: DerivativesData = {
      btcOpenInterest,
      ethOpenInterest,
      btcFundingRate,
      ethFundingRate,
      liquidations24h,
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
        derivativesData,
        technicalData,
        onChainData
      );
    } else {
      prediction = await generateCoinPrediction(
        coinId,
        coinName,
        marketData,
        sentimentData,
        macroData,
        derivativesData,
        technicalData,
        onChainData
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
    return internalError('Unable to generate prediction. Please try again later.');
  }
}

// Batch prediction endpoint
export async function POST(request: Request) {
  if (!isFeatureEnabled('predictions')) {
    return NextResponse.json({ error: 'Feature disabled' }, { status: 404 });
  }

  try {
    const body = await request.json();
    const { coins, skipCache } = body as { coins: Array<{ id: string; name: string }>; skipCache?: boolean };

    if (!coins || !Array.isArray(coins) || coins.length === 0) {
      return validationError('Please provide an array of coins. Example: { "coins": [{ "id": "bitcoin", "name": "Bitcoin" }] }');
    }

    // Limit to 50 coins per request (reasonable for batch predictions)
    const coinsToProcess = coins.slice(0, 50);

    if (!isFeatureEnabled('macro')) {
      return NextResponse.json(
        { error: 'Predictions are unavailable (macro data disabled).', disabled: true },
        { status: 503 }
      );
    }

    // Check cache for existing predictions
    const predictions: (ReturnType<typeof generateQuickPrediction> | { coinId: string; coinName: string; error: string })[] = [];
    const coinsNeedingFresh: { id: string; name: string; index: number }[] = [];

    const shouldUseCache = isSupabaseConfigured && skipCache !== true;

    if (shouldUseCache) {
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
      const fallbackBatchStale = async (reason: string) => {
        if (!shouldUseCache) {
          return NextResponse.json({ success: false, error: reason }, { status: 503 });
        }

        const cachedAny = await Promise.all(coinsToProcess.map(c => getPredictionFromCacheAnyAge(c.id)));
        const anyHit = cachedAny.some(Boolean);
        if (!anyHit) {
          return NextResponse.json({ success: false, error: reason }, { status: 503 });
        }

        const data = coinsToProcess.map((coin, idx) => {
          const cached = cachedAny[idx];
          if (!cached) return { coinId: coin.id, coinName: coin.name, error: 'No cached prediction available' };
          return withStaleMeta(cached);
        });

        return NextResponse.json({ success: true, data, source: 'stale_cache', warning: reason });
      };

      const [sentimentData, macroDataResult, derivativesDataResult] = await Promise.all([
        fetchSentimentData(),
        fetchMacroData(),
        fetchDerivativesData()
      ]);

      if (!sentimentData) {
        return fallbackBatchStale('Fear & Greed data unavailable (free API error). Serving cached predictions where available (may be stale).');
      }

      if (
        macroDataResult.fedFundsRate === null ||
        macroDataResult.treasury10Y === null ||
        macroDataResult.vix === null ||
        macroDataResult.dxy === null
      ) {
        return fallbackBatchStale('Macro data unavailable (free API error). Serving cached predictions where available (may be stale).');
      }

      const macroRiskEnvironment: MacroData['riskEnvironment'] =
        macroDataResult.riskEnvironment === 'risk-on'
          ? 'risk_on'
          : macroDataResult.riskEnvironment === 'risk-off'
            ? 'risk_off'
            : 'neutral';

      const macroData: MacroData = {
        fedFundsRate: macroDataResult.fedFundsRate,
        treasury10Y: macroDataResult.treasury10Y,
        vix: macroDataResult.vix,
        dxy: macroDataResult.dxy,
        riskEnvironment: macroRiskEnvironment
      };

      const btcOpenInterest = derivativesDataResult.btc?.openInterest ?? null;
      const ethOpenInterest = derivativesDataResult.eth?.openInterest ?? null;
      const btcFundingRate = derivativesDataResult.btc?.fundingRate ?? null;
      const ethFundingRate = derivativesDataResult.eth?.fundingRate ?? null;
      const liquidations24h = derivativesDataResult.totalLiquidations24h ?? null;

      if (
        btcOpenInterest === null ||
        ethOpenInterest === null ||
        btcFundingRate === null ||
        ethFundingRate === null ||
        liquidations24h === null
      ) {
        return fallbackBatchStale('Derivatives data unavailable (free API error). Serving cached predictions where available (may be stale).');
      }

      const derivativesData: DerivativesData = {
        btcOpenInterest,
        ethOpenInterest,
        btcFundingRate,
        ethFundingRate,
        liquidations24h,
        fundingHeatLevel: mapFundingHeatLevel(derivativesDataResult.fundingHeatLevel)
      };

      // Fetch market data for coins not in cache
      const marketDataPromises = coinsNeedingFresh.map(coin => fetchCoinMarketData(coin.id));
      const technicalPromises = coinsNeedingFresh.map(coin => fetchTechnicalDataForPrediction(coin.id));
      const onChainPromises = coinsNeedingFresh.map(coin => fetchOnChainDataForPrediction(coin.id));
      const [marketDataResults, technicalResults] = await Promise.all([
        Promise.all(marketDataPromises),
        Promise.all(technicalPromises)
      ]);
      const onChainResults = await Promise.all(onChainPromises);

      // Generate predictions for each coin
      for (let i = 0; i < coinsNeedingFresh.length; i++) {
        const coin = coinsNeedingFresh[i];
        const marketData = marketDataResults[i];
        const technicalData = technicalResults[i];
        const onChainData = onChainResults[i];

        if (!marketData) {
          if (shouldUseCache) {
            const cachedAny = await getPredictionFromCacheAnyAge(coin.id);
            if (cachedAny) {
              predictions[coin.index] = withStaleMeta(cachedAny);
              continue;
            }
          }

          predictions[coin.index] = { coinId: coin.id, coinName: coin.name, error: 'Could not fetch market data' };
          continue;
        }

        const prediction = generateQuickPrediction(
          coin.id,
          coin.name,
          marketData,
          sentimentData,
          macroData,
          derivativesData,
          technicalData,
          onChainData
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
    return internalError('Unable to generate batch predictions. Please try again later.');
  }
}
