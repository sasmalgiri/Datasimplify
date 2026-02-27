import type { DataSource, ParameterDef } from './types';

export function inferLayerParamKey(parameterKey: string): string {
  switch (parameterKey) {
    case 'rsi_period':
    case 'atr_period':
      return 'period';

    case 'bb_period':
    case 'sma_short':
    case 'sma_mid':
    case 'sma_long':
    case 'sma_slow':
    case 'sma_window':
    case 'ema_fast':
    case 'ema_window':
    case 'vol_sma':
    case 'vol_window':
    case 'rsi_sma_window':
      return 'window';

    case 'bb_mult':
      return 'multiplier';

    case 'macd_fast':
      return 'fast';
    case 'macd_slow':
      return 'slow';
    case 'macd_signal_period':
      return 'signal';

    case 'stoch_k':
      return 'kPeriod';
    case 'stoch_d':
      return 'dPeriod';
    case 'stoch_smooth':
      return 'smooth';

    default:
      // Fallback: most indicator params are a window
      return 'window';
  }
}

export function inferTargetSources(parameterDef: ParameterDef): DataSource[] {
  const { key, layerSource } = parameterDef;

  // Some params should update multiple related series in a preset.
  if (key.startsWith('bb_')) {
    return ['bollinger_upper', 'bollinger_lower', 'bb_width'];
  }
  if (key.startsWith('macd_')) {
    return ['macd', 'macd_signal', 'macd_histogram'];
  }
  if (key.startsWith('stoch_')) {
    return ['stochastic_k', 'stochastic_d'];
  }
  if (key === 'vol_sma') {
    return ['volume_sma', 'volume_ratio'];
  }
  if (key === 'rsi_period') {
    return ['rsi', 'rsi_sma'];
  }
  if (key === 'vol_window') {
    return ['rolling_volatility'];
  }
  if (key.startsWith('sma_') || key === 'sma_window') {
    return ['sma'];
  }
  if (key.startsWith('ema_')) {
    return ['ema'];
  }
  if (key === 'atr_period') {
    return ['atr'];
  }

  return [layerSource];
}
