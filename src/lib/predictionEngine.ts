/**
 * AI Prediction Engine
 * Analyzes multiple conditions to generate price predictions
 * With integrated persistence layer for storing and tracking predictions
 */

import Groq from 'groq-sdk';
import {
  savePredictionSnapshot,
  getHistoricalAccuracy,
  getPredictionHistory,
  getLatestSnapshot,
  saveTrainingData,
  getPredictionStats,
  type PredictionSnapshotInput,
} from './predictionDb';

// Signal types
export type SignalDirection = 'BULLISH' | 'BEARISH' | 'NEUTRAL';
export type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'EXTREME';
export type Confidence = number; // 0-100

export interface Signal {
  source: string;
  condition: string;
  direction: SignalDirection;
  weight: number; // 1-10
  value?: number | string;
}

export interface PredictionResult {
  coinId: string;
  coinName: string;
  prediction: SignalDirection;
  confidence: Confidence;
  riskLevel: RiskLevel;
  reasons: string[];
  signals: Signal[];
  technicalScore: number | null;
  sentimentScore: number | null;
  onChainScore: number | null;
  macroScore: number | null;
  overallScore: number;
  timestamp: string;
  priceTarget?: {
    shortTerm: { min: number; max: number };
    mediumTerm: { min: number; max: number };
  };
  // Extended fields from persistence layer
  snapshotId?: string;
  historicalAccuracy?: {
    totalPredictions: number;
    accuracy: number;
    byDirection: {
      bullish: { total: number; correct: number };
      bearish: { total: number; correct: number };
      neutral: { total: number; correct: number };
    };
  };
  recentPredictions?: {
    direction: SignalDirection;
    timestamp: string;
    wasCorrect?: boolean;
  }[];
  predictionStats?: {
    bullishCount: number;
    bearishCount: number;
    neutralCount: number;
    avgConfidence: number;
    recentTrend: string;
  };
}

export interface PersistenceOptions {
  persist?: boolean;
  includeHistoricalAccuracy?: boolean;
  includeRecentPredictions?: boolean;
  includePredictionStats?: boolean;
  storeTrainingData?: boolean;
}

export interface MarketData {
  price: number;
  priceChange24h: number;
  priceChange7d: number;
  priceChange30d: number;
  volume24h: number;
  marketCap: number;
  high24h: number;
  low24h: number;
}

export interface TechnicalData {
  rsi14?: number;
  macdSignal?: 'bullish_cross' | 'bearish_cross' | 'neutral';
  priceVs200MA?: 'above' | 'below' | 'near';
  priceVs50MA?: 'above' | 'below' | 'near';
  bollingerPosition?: 'upper' | 'middle' | 'lower';
  volumeTrend?: 'increasing' | 'decreasing' | 'stable';
}

export interface SentimentData {
  fearGreedIndex: number;
  fearGreedLabel: string;
  socialMentions?: number;
  socialSentiment?: 'positive' | 'negative' | 'neutral';
}

export interface OnChainData {
  exchangeNetflow?: 'inflow' | 'outflow' | 'neutral';
  whaleActivity?: 'buying' | 'selling' | 'neutral';
  activeAddresses?: 'increasing' | 'decreasing' | 'stable';
  largeTransactions?: number;
}

export interface MacroData {
  fedFundsRate: number;
  treasury10Y: number;
  vix: number;
  dxy: number;
  riskEnvironment: 'risk_on' | 'risk_off' | 'neutral';
}

export interface DerivativesData {
  btcOpenInterest: number;
  ethOpenInterest: number;
  btcFundingRate: number;
  ethFundingRate: number;
  liquidations24h: number;
  fundingHeatLevel: 'extreme_long' | 'high_long' | 'neutral' | 'high_short' | 'extreme_short';
}

// Calculate Technical Signals
export function calculateTechnicalSignals(
  marketData: MarketData,
  technicalData?: TechnicalData | null
): Signal[] {
  const signals: Signal[] = [];

  if (!technicalData) return signals;

  // RSI Signal
  if (technicalData.rsi14 !== undefined) {
    if (technicalData.rsi14 < 30) {
      signals.push({
        source: 'Technical',
        condition: `RSI at ${technicalData.rsi14.toFixed(1)} (Oversold)`,
        direction: 'BULLISH',
        weight: 8,
        value: technicalData.rsi14
      });
    } else if (technicalData.rsi14 > 70) {
      signals.push({
        source: 'Technical',
        condition: `RSI at ${technicalData.rsi14.toFixed(1)} (Overbought)`,
        direction: 'BEARISH',
        weight: 8,
        value: technicalData.rsi14
      });
    } else if (technicalData.rsi14 >= 40 && technicalData.rsi14 <= 60) {
      signals.push({
        source: 'Technical',
        condition: `RSI at ${technicalData.rsi14.toFixed(1)} (Neutral)`,
        direction: 'NEUTRAL',
        weight: 3,
        value: technicalData.rsi14
      });
    }
  }

  // MACD Signal
  if (technicalData.macdSignal === 'bullish_cross') {
    signals.push({
      source: 'Technical',
      condition: 'MACD Bullish Crossover',
      direction: 'BULLISH',
      weight: 7
    });
  } else if (technicalData.macdSignal === 'bearish_cross') {
    signals.push({
      source: 'Technical',
      condition: 'MACD Bearish Crossover',
      direction: 'BEARISH',
      weight: 7
    });
  }

  // Price vs 200 MA
  if (technicalData.priceVs200MA === 'above') {
    signals.push({
      source: 'Technical',
      condition: 'Price above 200-day MA (Uptrend)',
      direction: 'BULLISH',
      weight: 6
    });
  } else if (technicalData.priceVs200MA === 'below') {
    signals.push({
      source: 'Technical',
      condition: 'Price below 200-day MA (Downtrend)',
      direction: 'BEARISH',
      weight: 6
    });
  }

  // Price vs 50 MA
  if (technicalData.priceVs50MA === 'above') {
    signals.push({
      source: 'Technical',
      condition: 'Price above 50-day MA',
      direction: 'BULLISH',
      weight: 5
    });
  } else if (technicalData.priceVs50MA === 'below') {
    signals.push({
      source: 'Technical',
      condition: 'Price below 50-day MA',
      direction: 'BEARISH',
      weight: 5
    });
  }

  // Bollinger Bands
  if (technicalData.bollingerPosition === 'lower') {
    signals.push({
      source: 'Technical',
      condition: 'Price at lower Bollinger Band',
      direction: 'BULLISH',
      weight: 5
    });
  } else if (technicalData.bollingerPosition === 'upper') {
    signals.push({
      source: 'Technical',
      condition: 'Price at upper Bollinger Band',
      direction: 'BEARISH',
      weight: 5
    });
  }

  // Volume Trend
  if (technicalData.volumeTrend === 'increasing' && marketData.priceChange24h > 0) {
    signals.push({
      source: 'Technical',
      condition: 'Increasing volume with price up',
      direction: 'BULLISH',
      weight: 4
    });
  } else if (technicalData.volumeTrend === 'increasing' && marketData.priceChange24h < 0) {
    signals.push({
      source: 'Technical',
      condition: 'Increasing volume with price down',
      direction: 'BEARISH',
      weight: 4
    });
  }

  // Price momentum
  if (marketData.priceChange24h > 5) {
    signals.push({
      source: 'Technical',
      condition: `Strong 24h momentum (+${marketData.priceChange24h.toFixed(1)}%)`,
      direction: 'BULLISH',
      weight: 4,
      value: marketData.priceChange24h
    });
  } else if (marketData.priceChange24h < -5) {
    signals.push({
      source: 'Technical',
      condition: `Weak 24h momentum (${marketData.priceChange24h.toFixed(1)}%)`,
      direction: 'BEARISH',
      weight: 4,
      value: marketData.priceChange24h
    });
  }

  return signals;
}

// Calculate Sentiment Signals
export function calculateSentimentSignals(sentimentData: SentimentData): Signal[] {
  const signals: Signal[] = [];

  // Fear & Greed Index (Contrarian)
  if (sentimentData.fearGreedIndex < 25) {
    signals.push({
      source: 'Sentiment',
      condition: `Extreme Fear (${sentimentData.fearGreedIndex}) - Contrarian Bullish`,
      direction: 'BULLISH',
      weight: 7,
      value: sentimentData.fearGreedIndex
    });
  } else if (sentimentData.fearGreedIndex > 75) {
    signals.push({
      source: 'Sentiment',
      condition: `Extreme Greed (${sentimentData.fearGreedIndex}) - Contrarian Bearish`,
      direction: 'BEARISH',
      weight: 7,
      value: sentimentData.fearGreedIndex
    });
  } else if (sentimentData.fearGreedIndex >= 45 && sentimentData.fearGreedIndex <= 55) {
    signals.push({
      source: 'Sentiment',
      condition: `Neutral Sentiment (${sentimentData.fearGreedIndex})`,
      direction: 'NEUTRAL',
      weight: 3,
      value: sentimentData.fearGreedIndex
    });
  }

  // Social Sentiment
  if (sentimentData.socialSentiment === 'positive') {
    signals.push({
      source: 'Sentiment',
      condition: 'Positive social media sentiment',
      direction: 'BULLISH',
      weight: 4
    });
  } else if (sentimentData.socialSentiment === 'negative') {
    signals.push({
      source: 'Sentiment',
      condition: 'Negative social media sentiment',
      direction: 'BEARISH',
      weight: 4
    });
  }

  return signals;
}

// Calculate On-Chain Signals
export function calculateOnChainSignals(onChainData?: OnChainData | null): Signal[] {
  const signals: Signal[] = [];

  if (!onChainData) return signals;

  // Exchange Net Flow
  if (onChainData.exchangeNetflow === 'outflow') {
    signals.push({
      source: 'On-Chain',
      condition: 'Exchange outflow (Accumulation)',
      direction: 'BULLISH',
      weight: 7
    });
  } else if (onChainData.exchangeNetflow === 'inflow') {
    signals.push({
      source: 'On-Chain',
      condition: 'Exchange inflow (Distribution)',
      direction: 'BEARISH',
      weight: 7
    });
  }

  // Whale Activity
  if (onChainData.whaleActivity === 'buying') {
    signals.push({
      source: 'On-Chain',
      condition: 'Whales accumulating',
      direction: 'BULLISH',
      weight: 8
    });
  } else if (onChainData.whaleActivity === 'selling') {
    signals.push({
      source: 'On-Chain',
      condition: 'Whales distributing',
      direction: 'BEARISH',
      weight: 8
    });
  }

  // Active Addresses
  if (onChainData.activeAddresses === 'increasing') {
    signals.push({
      source: 'On-Chain',
      condition: 'Active addresses increasing',
      direction: 'BULLISH',
      weight: 5
    });
  } else if (onChainData.activeAddresses === 'decreasing') {
    signals.push({
      source: 'On-Chain',
      condition: 'Active addresses decreasing',
      direction: 'BEARISH',
      weight: 5
    });
  }

  return signals;
}

// Calculate Macro Signals
export function calculateMacroSignals(macroData: MacroData): Signal[] {
  const signals: Signal[] = [];

  // VIX (Fear Index)
  if (macroData.vix > 30) {
    signals.push({
      source: 'Macro',
      condition: `High VIX (${macroData.vix.toFixed(1)}) - Risk-off environment`,
      direction: 'BEARISH',
      weight: 6,
      value: macroData.vix
    });
  } else if (macroData.vix < 15) {
    signals.push({
      source: 'Macro',
      condition: `Low VIX (${macroData.vix.toFixed(1)}) - Risk-on environment`,
      direction: 'BULLISH',
      weight: 6,
      value: macroData.vix
    });
  }

  // DXY (Dollar Strength)
  if (macroData.dxy > 105) {
    signals.push({
      source: 'Macro',
      condition: `Strong Dollar (DXY ${macroData.dxy.toFixed(1)}) - Negative for crypto`,
      direction: 'BEARISH',
      weight: 5,
      value: macroData.dxy
    });
  } else if (macroData.dxy < 100) {
    signals.push({
      source: 'Macro',
      condition: `Weak Dollar (DXY ${macroData.dxy.toFixed(1)}) - Positive for crypto`,
      direction: 'BULLISH',
      weight: 5,
      value: macroData.dxy
    });
  }

  // Risk Environment
  if (macroData.riskEnvironment === 'risk_on') {
    signals.push({
      source: 'Macro',
      condition: 'Risk-on macro environment',
      direction: 'BULLISH',
      weight: 5
    });
  } else if (macroData.riskEnvironment === 'risk_off') {
    signals.push({
      source: 'Macro',
      condition: 'Risk-off macro environment',
      direction: 'BEARISH',
      weight: 5
    });
  }

  return signals;
}

// Calculate Derivatives Signals
export function calculateDerivativesSignals(derivativesData: DerivativesData): Signal[] {
  const signals: Signal[] = [];

  // BTC Funding Rate
  if (derivativesData.btcFundingRate < -0.01) {
    signals.push({
      source: 'Derivatives',
      condition: `Negative BTC funding (${(derivativesData.btcFundingRate * 100).toFixed(3)}%) - Shorts paying`,
      direction: 'BULLISH',
      weight: 7,
      value: derivativesData.btcFundingRate
    });
  } else if (derivativesData.btcFundingRate > 0.05) {
    signals.push({
      source: 'Derivatives',
      condition: `High BTC funding (${(derivativesData.btcFundingRate * 100).toFixed(3)}%) - Longs overleveraged`,
      direction: 'BEARISH',
      weight: 7,
      value: derivativesData.btcFundingRate
    });
  }

  // Funding Heat Level
  if (derivativesData.fundingHeatLevel === 'extreme_short') {
    signals.push({
      source: 'Derivatives',
      condition: 'Extreme short positioning - Squeeze potential',
      direction: 'BULLISH',
      weight: 8
    });
  } else if (derivativesData.fundingHeatLevel === 'extreme_long') {
    signals.push({
      source: 'Derivatives',
      condition: 'Extreme long positioning - Correction risk',
      direction: 'BEARISH',
      weight: 8
    });
  }

  // High Liquidations
  if (derivativesData.liquidations24h > 500000000) { // $500M+
    signals.push({
      source: 'Derivatives',
      condition: `High liquidations ($${(derivativesData.liquidations24h / 1e9).toFixed(2)}B) - Volatility`,
      direction: 'NEUTRAL',
      weight: 5,
      value: derivativesData.liquidations24h
    });
  }

  return signals;
}

// Aggregate all signals into a prediction
export function aggregateSignals(signals: Signal[]): {
  prediction: SignalDirection;
  confidence: Confidence;
  riskLevel: RiskLevel;
  technicalScore: number | null;
  sentimentScore: number | null;
  onChainScore: number | null;
  macroScore: number | null;
  overallScore: number;
} {
  // Separate signals by source
  const technicalSignals = signals.filter(s => s.source === 'Technical');
  const sentimentSignals = signals.filter(s => s.source === 'Sentiment');
  const onChainSignals = signals.filter(s => s.source === 'On-Chain');
  const macroSignals = signals.filter(s => s.source === 'Macro');
  const derivativesSignals = signals.filter(s => s.source === 'Derivatives');

  // Calculate weighted scores for each category
  const calculateScore = (categorySignals: Signal[]): number | null => {
    if (categorySignals.length === 0) return null; // Unavailable if no real signals

    let bullishWeight = 0;
    let bearishWeight = 0;
    let totalWeight = 0;

    categorySignals.forEach(signal => {
      totalWeight += signal.weight;
      if (signal.direction === 'BULLISH') {
        bullishWeight += signal.weight;
      } else if (signal.direction === 'BEARISH') {
        bearishWeight += signal.weight;
      }
    });

    if (totalWeight === 0) return null;

    // Score from 0 (very bearish) to 100 (very bullish)
    const score = ((bullishWeight - bearishWeight) / totalWeight) * 50 + 50;
    return Math.max(0, Math.min(100, score));
  };

  const technicalScore = calculateScore(technicalSignals);
  const sentimentScore = calculateScore(sentimentSignals);
  const onChainScore = calculateScore(onChainSignals);
  const macroScore = calculateScore([...macroSignals, ...derivativesSignals]);

  // Weighted overall score using only available categories
  const weights: Array<{ score: number | null; weight: number }> = [
    { score: technicalScore, weight: 0.35 },
    { score: sentimentScore, weight: 0.15 },
    { score: onChainScore, weight: 0.30 },
    { score: macroScore, weight: 0.20 },
  ];
  const available = weights.filter(w => typeof w.score === 'number' && Number.isFinite(w.score));
  const weightSum = available.reduce((sum, w) => sum + w.weight, 0);
  const overallScore = weightSum > 0
    ? available.reduce((sum, w) => sum + (w.score as number) * w.weight, 0) / weightSum
    : 50;

  // Determine prediction
  let prediction: SignalDirection;
  if (overallScore > 60) {
    prediction = 'BULLISH';
  } else if (overallScore < 40) {
    prediction = 'BEARISH';
  } else {
    prediction = 'NEUTRAL';
  }

  // Calculate confidence based on signal agreement
  const bullishSignals = signals.filter(s => s.direction === 'BULLISH').length;
  const bearishSignals = signals.filter(s => s.direction === 'BEARISH').length;
  const totalSignals = signals.length;

  let confidence: Confidence;
  if (totalSignals === 0) {
    confidence = 50;
  } else {
    const agreement = Math.abs(bullishSignals - bearishSignals) / totalSignals;
    const distanceFromNeutral = Math.abs(overallScore - 50) / 50;
    confidence = Math.round((agreement * 0.5 + distanceFromNeutral * 0.5) * 100);
  }

  // Determine risk level
  let riskLevel: RiskLevel;
  if (confidence < 40 || Math.abs(overallScore - 50) < 10) {
    riskLevel = 'HIGH'; // Low confidence = high risk
  } else if (confidence < 60) {
    riskLevel = 'MEDIUM';
  } else if (confidence < 80) {
    riskLevel = 'LOW';
  } else {
    riskLevel = 'LOW';
  }

  // Adjust risk based on volatility indicators
  const hasHighVolatilitySignals = signals.some(s =>
    s.condition.includes('VIX') && s.direction === 'BEARISH' ||
    s.condition.includes('liquidations')
  );
  if (hasHighVolatilitySignals) {
    // Escalate risk level when high volatility signals are present
    if (riskLevel === 'LOW') riskLevel = 'MEDIUM';
    else if (riskLevel === 'MEDIUM') riskLevel = 'HIGH';
    else if (riskLevel === 'HIGH') riskLevel = 'EXTREME';
  }

  return {
    prediction,
    confidence,
    riskLevel,
    technicalScore: typeof technicalScore === 'number' ? Math.round(technicalScore) : null,
    sentimentScore: typeof sentimentScore === 'number' ? Math.round(sentimentScore) : null,
    onChainScore: typeof onChainScore === 'number' ? Math.round(onChainScore) : null,
    macroScore: typeof macroScore === 'number' ? Math.round(macroScore) : null,
    overallScore: Math.round(overallScore)
  };
}

// Get top reasons for prediction
export function getTopReasons(signals: Signal[], prediction: SignalDirection): string[] {
  // Filter signals that support the prediction
  const supportingSignals = signals.filter(s => s.direction === prediction);

  // Sort by weight
  supportingSignals.sort((a, b) => b.weight - a.weight);

  // Take top 3
  return supportingSignals.slice(0, 3).map(s => s.condition);
}

// Generate AI-enhanced prediction using Groq
export async function generateAIPrediction(
  coinId: string,
  coinName: string,
  signals: Signal[],
  aggregatedResult: ReturnType<typeof aggregateSignals>
): Promise<PredictionResult> {
  const groqApiKey = process.env.GROQ_API_KEY;

  let aiReasons = getTopReasons(signals, aggregatedResult.prediction);

  // If we have Groq API key, enhance with AI analysis
  if (groqApiKey) {
    try {
      const groq = new Groq({ apiKey: groqApiKey });

      const signalsSummary = signals.map(s =>
        `- ${s.source}: ${s.condition} (${s.direction}, weight: ${s.weight})`
      ).join('\n');

      const prompt = `You are a crypto market analyst. Based on the following signals for ${coinName}, provide 3 concise key reasons for the ${aggregatedResult.prediction} prediction.

SIGNALS:
${signalsSummary}

SCORES:
- Technical: ${aggregatedResult.technicalScore}/100
- Sentiment: ${aggregatedResult.sentimentScore}/100
- On-Chain: ${aggregatedResult.onChainScore}/100
- Macro: ${aggregatedResult.macroScore}/100
- Overall: ${aggregatedResult.overallScore}/100

PREDICTION: ${aggregatedResult.prediction} (${aggregatedResult.confidence}% confidence)

Provide exactly 3 brief, actionable reasons (max 15 words each). Format as a JSON array of strings.`;

      const completion = await groq.chat.completions.create({
        messages: [{ role: 'user', content: prompt }],
        model: 'llama-3.3-70b-versatile',
        temperature: 0.3,
        max_tokens: 200
      });

      const response = completion.choices[0]?.message?.content || '';

      // Parse JSON array from response
      const jsonMatch = response.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        if (Array.isArray(parsed) && parsed.length >= 3) {
          aiReasons = parsed.slice(0, 3);
        }
      }
    } catch (error) {
      console.error('Groq AI error:', error);
      // Fall back to rule-based reasons
    }
  }

  return {
    coinId,
    coinName,
    prediction: aggregatedResult.prediction,
    confidence: aggregatedResult.confidence,
    riskLevel: aggregatedResult.riskLevel,
    reasons: aiReasons,
    signals,
    technicalScore: aggregatedResult.technicalScore,
    sentimentScore: aggregatedResult.sentimentScore,
    onChainScore: aggregatedResult.onChainScore,
    macroScore: aggregatedResult.macroScore,
    overallScore: aggregatedResult.overallScore,
    timestamp: new Date().toISOString()
  };
}

// Main prediction function for a coin
export async function generateCoinPrediction(
  coinId: string,
  coinName: string,
  marketData: MarketData,
  sentimentData: SentimentData,
  macroData: MacroData,
  derivativesData: DerivativesData,
  technicalData?: TechnicalData | null,
  onChainData?: OnChainData | null
): Promise<PredictionResult> {
  const safeTechnicalData = technicalData ?? null;
  const safeOnChainData = onChainData ?? null;

  // Calculate all signals
  const technicalSignals = calculateTechnicalSignals(marketData, safeTechnicalData);
  const sentimentSignals = calculateSentimentSignals(sentimentData);
  const onChainSignals = calculateOnChainSignals(safeOnChainData);
  const macroSignals = calculateMacroSignals(macroData);
  const derivativesSignals = calculateDerivativesSignals(derivativesData);

  // Combine all signals
  const allSignals = [
    ...technicalSignals,
    ...sentimentSignals,
    ...onChainSignals,
    ...macroSignals,
    ...derivativesSignals
  ];

  // Aggregate signals
  const aggregatedResult = aggregateSignals(allSignals);

  // Generate AI-enhanced prediction
  return generateAIPrediction(coinId, coinName, allSignals, aggregatedResult);
}

// Quick prediction without AI (for batch processing)
export function generateQuickPrediction(
  coinId: string,
  coinName: string,
  marketData: MarketData,
  sentimentData: SentimentData,
  macroData: MacroData,
  derivativesData: DerivativesData,
  technicalData?: TechnicalData | null,
  onChainData?: OnChainData | null
): Omit<PredictionResult, 'timestamp'> & { timestamp: string } {
  const safeTechnicalData = technicalData ?? null;
  const safeOnChainData = onChainData ?? null;

  const technicalSignals = calculateTechnicalSignals(marketData, safeTechnicalData);
  const sentimentSignals = calculateSentimentSignals(sentimentData);
  const onChainSignals = calculateOnChainSignals(safeOnChainData);
  const macroSignals = calculateMacroSignals(macroData);
  const derivativesSignals = calculateDerivativesSignals(derivativesData);

  const allSignals = [
    ...technicalSignals,
    ...sentimentSignals,
    ...onChainSignals,
    ...macroSignals,
    ...derivativesSignals
  ];

  const aggregatedResult = aggregateSignals(allSignals);
  const reasons = getTopReasons(allSignals, aggregatedResult.prediction);

  return {
    coinId,
    coinName,
    prediction: aggregatedResult.prediction,
    confidence: aggregatedResult.confidence,
    riskLevel: aggregatedResult.riskLevel,
    reasons,
    signals: allSignals,
    technicalScore: aggregatedResult.technicalScore,
    sentimentScore: aggregatedResult.sentimentScore,
    onChainScore: aggregatedResult.onChainScore,
    macroScore: aggregatedResult.macroScore,
    overallScore: aggregatedResult.overallScore,
    timestamp: new Date().toISOString()
  };
}

// ============================================
// PERSISTENCE-INTEGRATED FUNCTIONS
// ============================================

/**
 * Convert prediction result to snapshot input format for persistence
 */
function predictionToSnapshotInput(
  prediction: PredictionResult,
  marketData: MarketData,
  technicalData: TechnicalData,
  sentimentData: SentimentData,
  macroData: MacroData,
  derivativesData: DerivativesData
): PredictionSnapshotInput {
  return {
    coinId: prediction.coinId,
    timestamp: new Date(prediction.timestamp),

    // Market Data
    price: marketData.price,
    priceChange24h: marketData.priceChange24h,
    priceChange7d: marketData.priceChange7d,
    priceChange30d: marketData.priceChange30d,
    volume24h: marketData.volume24h,
    marketCap: marketData.marketCap,
    high24h: marketData.high24h,
    low24h: marketData.low24h,

    // Technical Indicators
    rsi14: technicalData.rsi14,
    macdSignal: technicalData.macdSignal,
    ma50Position: technicalData.priceVs50MA,
    ma200Position: technicalData.priceVs200MA,
    bollingerPosition: technicalData.bollingerPosition,
    volumeTrend: technicalData.volumeTrend,

    // Sentiment
    fearGreedIndex: sentimentData.fearGreedIndex,
    fearGreedLabel: sentimentData.fearGreedLabel,

    // Macro
    vix: macroData.vix,
    dxy: macroData.dxy,
    fedFundsRate: macroData.fedFundsRate,
    treasury10y: macroData.treasury10Y,
    riskEnvironment: macroData.riskEnvironment,

    // Derivatives
    btcFundingRate: derivativesData.btcFundingRate,
    ethFundingRate: derivativesData.ethFundingRate,
    btcOpenInterest: derivativesData.btcOpenInterest,
    ethOpenInterest: derivativesData.ethOpenInterest,
    liquidations24h: derivativesData.liquidations24h,
    fundingHeatLevel: derivativesData.fundingHeatLevel,

    // Prediction Output
    prediction: prediction.prediction,
    confidence: prediction.confidence,
    riskLevel: prediction.riskLevel,
    technicalScore: prediction.technicalScore ?? undefined,
    sentimentScore: prediction.sentimentScore ?? undefined,
    onchainScore: prediction.onChainScore ?? undefined,
    macroScore: prediction.macroScore ?? undefined,
    overallScore: prediction.overallScore,
    reasons: prediction.reasons,
    signals: prediction.signals,
  };
}

/**
 * Extract features for training data
 */
function extractTrainingFeatures(
  marketData: MarketData,
  technicalData: TechnicalData,
  sentimentData: SentimentData,
  macroData: MacroData,
  derivativesData: DerivativesData
): Record<string, unknown> {
  return {
    // Market features
    price: marketData.price,
    priceChange24h: marketData.priceChange24h,
    priceChange7d: marketData.priceChange7d,
    priceChange30d: marketData.priceChange30d,
    volume24h: marketData.volume24h,
    marketCap: marketData.marketCap,
    volatility24h: marketData.high24h && marketData.low24h
      ? ((marketData.high24h - marketData.low24h) / marketData.price) * 100
      : null,

    // Technical features
    rsi14: technicalData.rsi14,
    macdSignal: technicalData.macdSignal,
    priceVs50MA: technicalData.priceVs50MA,
    priceVs200MA: technicalData.priceVs200MA,
    bollingerPosition: technicalData.bollingerPosition,
    volumeTrend: technicalData.volumeTrend,

    // Sentiment features
    fearGreedIndex: sentimentData.fearGreedIndex,
    fearGreedLabel: sentimentData.fearGreedLabel,
    socialSentiment: sentimentData.socialSentiment,

    // Macro features
    vix: macroData.vix,
    dxy: macroData.dxy,
    fedFundsRate: macroData.fedFundsRate,
    treasury10Y: macroData.treasury10Y,
    riskEnvironment: macroData.riskEnvironment,

    // Derivatives features
    btcFundingRate: derivativesData.btcFundingRate,
    ethFundingRate: derivativesData.ethFundingRate,
    fundingHeatLevel: derivativesData.fundingHeatLevel,
    liquidations24h: derivativesData.liquidations24h,
  };
}

/**
 * Calculate price targets based on volatility and historical data
 */
function calculatePriceTargets(
  currentPrice: number,
  volatility: number,
  prediction: SignalDirection,
  confidence: number
): { shortTerm: { min: number; max: number }; mediumTerm: { min: number; max: number } } {
  // Base percentage move based on volatility (normalized)
  const baseMove = Math.max(2, Math.min(15, volatility * 0.5));

  // Adjust based on confidence
  const confidenceMultiplier = confidence / 100;

  // Direction multiplier
  const directionMultiplier = prediction === 'BULLISH' ? 1 : prediction === 'BEARISH' ? -1 : 0;

  // Short term (24-48h) targets
  const shortTermMove = baseMove * confidenceMultiplier;
  const shortTermMin = currentPrice * (1 + (directionMultiplier * shortTermMove * 0.5) / 100);
  const shortTermMax = currentPrice * (1 + (directionMultiplier * shortTermMove * 1.5) / 100);

  // Medium term (7d) targets
  const mediumTermMove = baseMove * 2 * confidenceMultiplier;
  const mediumTermMin = currentPrice * (1 + (directionMultiplier * mediumTermMove * 0.5) / 100);
  const mediumTermMax = currentPrice * (1 + (directionMultiplier * mediumTermMove * 1.5) / 100);

  return {
    shortTerm: {
      min: Math.round(Math.min(shortTermMin, shortTermMax) * 100) / 100,
      max: Math.round(Math.max(shortTermMin, shortTermMax) * 100) / 100,
    },
    mediumTerm: {
      min: Math.round(Math.min(mediumTermMin, mediumTermMax) * 100) / 100,
      max: Math.round(Math.max(mediumTermMin, mediumTermMax) * 100) / 100,
    },
  };
}

/**
 * Generate prediction with full persistence support
 * This is the main function for production use with database integration
 */
export async function generatePredictionWithPersistence(
  coinId: string,
  coinName: string,
  marketData: MarketData,
  sentimentData: SentimentData,
  macroData: MacroData,
  derivativesData: DerivativesData,
  options: PersistenceOptions = {},
  technicalData?: TechnicalData | null,
  onChainData?: OnChainData | null
): Promise<PredictionResult> {
  const {
    persist = true,
    includeHistoricalAccuracy = true,
    includeRecentPredictions = false,
    includePredictionStats = false,
    storeTrainingData = true,
  } = options;

  const safeTechnicalData = technicalData ?? null;
  const safeOnChainData = onChainData ?? null;

  // Calculate all signals
  const technicalSignals = calculateTechnicalSignals(marketData, safeTechnicalData);
  const sentimentSignals = calculateSentimentSignals(sentimentData);
  const onChainSignals = calculateOnChainSignals(safeOnChainData);
  const macroSignals = calculateMacroSignals(macroData);
  const derivativesSignals = calculateDerivativesSignals(derivativesData);

  const allSignals = [
    ...technicalSignals,
    ...sentimentSignals,
    ...onChainSignals,
    ...macroSignals,
    ...derivativesSignals,
  ];

  // Aggregate signals
  const aggregatedResult = aggregateSignals(allSignals);

  // Generate base prediction
  const prediction = await generateAIPrediction(coinId, coinName, allSignals, aggregatedResult);

  // Calculate price targets
  const volatility = marketData.high24h && marketData.low24h
    ? ((marketData.high24h - marketData.low24h) / marketData.price) * 100
    : 5;
  prediction.priceTarget = calculatePriceTargets(
    marketData.price,
    volatility,
    prediction.prediction,
    prediction.confidence
  );

  // Fetch historical accuracy if requested
  if (includeHistoricalAccuracy) {
    try {
      const accuracy = await getHistoricalAccuracy({
        coinId,
        rsiRange: safeTechnicalData?.rsi14 ? [safeTechnicalData.rsi14 - 10, safeTechnicalData.rsi14 + 10] : undefined,
        fearGreedRange: [sentimentData.fearGreedIndex - 10, sentimentData.fearGreedIndex + 10],
        days: 90,
      });
      prediction.historicalAccuracy = accuracy;
    } catch (error) {
      console.error('Error fetching historical accuracy:', error);
    }
  }

  // Fetch recent predictions if requested
  if (includeRecentPredictions) {
    try {
      const history = await getPredictionHistory(coinId, { limit: 5 });
      prediction.recentPredictions = history.map(h => ({
        direction: h.prediction as SignalDirection,
        timestamp: h.timestamp.toISOString(),
      }));
    } catch (error) {
      console.error('Error fetching recent predictions:', error);
    }
  }

  // Fetch prediction stats if requested
  if (includePredictionStats) {
    try {
      const stats = await getPredictionStats(coinId, 30);
      prediction.predictionStats = stats;
    } catch (error) {
      console.error('Error fetching prediction stats:', error);
    }
  }

  // Persist prediction snapshot
  if (persist) {
    try {
      const snapshotInput = predictionToSnapshotInput(
        prediction,
        marketData,
        safeTechnicalData || {},
        sentimentData,
        macroData,
        derivativesData
      );
      const result = await savePredictionSnapshot(snapshotInput);
      if (result) {
        prediction.snapshotId = result.id;

        // Store training data if requested
        if (storeTrainingData) {
          const features = extractTrainingFeatures(
            marketData,
            safeTechnicalData || {},
            sentimentData,
            macroData,
            derivativesData
          );
          await saveTrainingData({
            snapshotId: result.id,
            coinId,
            snapshotTimestamp: new Date(prediction.timestamp),
            features,
            technicalFeatures: {
              rsi14: safeTechnicalData?.rsi14,
              macdSignal: safeTechnicalData?.macdSignal,
              priceVs50MA: safeTechnicalData?.priceVs50MA,
              priceVs200MA: safeTechnicalData?.priceVs200MA,
            },
            sentimentFeatures: {
              fearGreedIndex: sentimentData.fearGreedIndex,
              socialSentiment: sentimentData.socialSentiment,
            },
            macroFeatures: {
              vix: macroData.vix,
              dxy: macroData.dxy,
              riskEnvironment: macroData.riskEnvironment,
            },
            derivativesFeatures: {
              btcFundingRate: derivativesData.btcFundingRate,
              fundingHeatLevel: derivativesData.fundingHeatLevel,
            },
            priceAtSnapshot: marketData.price,
            predictedDirection: prediction.prediction,
            predictedConfidence: prediction.confidence,
          });
        }
      }
    } catch (error) {
      console.error('Error persisting prediction:', error);
    }
  }

  return prediction;
}

/**
 * Get the latest persisted prediction for a coin
 */
export async function getLatestPrediction(coinId: string): Promise<PredictionResult | null> {
  try {
    const snapshot = await getLatestSnapshot(coinId);
    if (!snapshot) return null;

    return {
      coinId: snapshot.coinId,
      coinName: coinId, // Name not stored in snapshot
      prediction: (snapshot.prediction as SignalDirection) || 'NEUTRAL',
      confidence: typeof snapshot.confidence === 'number' ? snapshot.confidence : 50,
      riskLevel: (snapshot.riskLevel as RiskLevel) || 'MEDIUM',
      reasons: snapshot.reasons || [],
      signals: (snapshot.signals as Signal[]) || [],
      technicalScore: typeof snapshot.technicalScore === 'number' ? snapshot.technicalScore : null,
      sentimentScore: typeof snapshot.sentimentScore === 'number' ? snapshot.sentimentScore : null,
      onChainScore: typeof snapshot.onchainScore === 'number' ? snapshot.onchainScore : null,
      macroScore: typeof snapshot.macroScore === 'number' ? snapshot.macroScore : null,
      overallScore: typeof snapshot.overallScore === 'number' ? snapshot.overallScore : 50,
      timestamp: snapshot.timestamp.toISOString(),
      snapshotId: snapshot.id,
    };
  } catch (error) {
    console.error('Error fetching latest prediction:', error);
    return null;
  }
}

/**
 * Get prediction history with enriched data
 */
export async function getPredictionHistoryEnriched(
  coinId: string,
  options?: { startDate?: Date; endDate?: Date; limit?: number }
): Promise<PredictionResult[]> {
  try {
    const history = await getPredictionHistory(coinId, options);

    return history.map(snapshot => ({
      coinId: snapshot.coinId,
      coinName: coinId,
      prediction: (snapshot.prediction as SignalDirection) || 'NEUTRAL',
      confidence: snapshot.confidence || 50,
      riskLevel: (snapshot.riskLevel as RiskLevel) || 'MEDIUM',
      reasons: snapshot.reasons || [],
      signals: (snapshot.signals as Signal[]) || [],
      technicalScore: snapshot.technicalScore || 50,
      sentimentScore: snapshot.sentimentScore || 50,
      onChainScore: snapshot.onchainScore || 50,
      macroScore: snapshot.macroScore || 50,
      overallScore: snapshot.overallScore || 50,
      timestamp: snapshot.timestamp.toISOString(),
      snapshotId: snapshot.id,
    }));
  } catch (error) {
    console.error('Error fetching prediction history:', error);
    return [];
  }
}

/**
 * Check if similar market conditions have historically resulted in correct predictions
 */
export async function checkHistoricalConfidence(
  coinId: string,
  technicalData: TechnicalData,
  sentimentData: SentimentData
): Promise<{
  similarConditionsFound: number;
  historicalAccuracy: number;
  recommendation: string;
}> {
  try {
    const accuracy = await getHistoricalAccuracy({
      coinId,
      rsiRange: technicalData.rsi14 ? [technicalData.rsi14 - 5, technicalData.rsi14 + 5] : undefined,
      fearGreedRange: [sentimentData.fearGreedIndex - 5, sentimentData.fearGreedIndex + 5],
      macdSignal: technicalData.macdSignal,
      days: 180,
    });

    let recommendation = 'Insufficient historical data for confidence adjustment';

    if (accuracy.totalPredictions >= 10) {
      if (accuracy.accuracy >= 70) {
        recommendation = 'High historical accuracy in similar conditions - prediction reliability is HIGH';
      } else if (accuracy.accuracy >= 55) {
        recommendation = 'Moderate historical accuracy - proceed with caution';
      } else {
        recommendation = 'Low historical accuracy in similar conditions - consider reducing position size';
      }
    }

    return {
      similarConditionsFound: accuracy.totalPredictions,
      historicalAccuracy: accuracy.accuracy,
      recommendation,
    };
  } catch (error) {
    console.error('Error checking historical confidence:', error);
    return {
      similarConditionsFound: 0,
      historicalAccuracy: 50,
      recommendation: 'Unable to fetch historical data',
    };
  }
}
