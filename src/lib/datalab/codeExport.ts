// DataLab Code Export: Pine Script v5 + Python

import type { OverlayLayer } from './types';

/**
 * Export current layers to TradingView Pine Script v5.
 */
export function exportToPineScript(layers: OverlayLayer[], coin: string): string {
  const lines: string[] = [
    '//@version=5',
    `indicator("DataLab Export — ${coin.toUpperCase()}", overlay=true)`,
    '',
  ];

  const addedIndicators = new Set<string>();

  for (const layer of layers) {
    if (!layer.visible) continue;

    switch (layer.source) {
      case 'sma': {
        const w = layer.params?.window ?? 20;
        const varName = `sma_${w}`;
        if (!addedIndicators.has(varName)) {
          lines.push(`${varName} = ta.sma(close, ${w})`);
          lines.push(`plot(${varName}, title="${layer.label}", color=color.new(${pineColor(layer.color)}, 0), linewidth=2)`);
          addedIndicators.add(varName);
        }
        break;
      }
      case 'ema': {
        const w = layer.params?.window ?? 20;
        const varName = `ema_${w}`;
        if (!addedIndicators.has(varName)) {
          lines.push(`${varName} = ta.ema(close, ${w})`);
          lines.push(`plot(${varName}, title="${layer.label}", color=color.new(${pineColor(layer.color)}, 0), linewidth=2)`);
          addedIndicators.add(varName);
        }
        break;
      }
      case 'rsi': {
        const p = layer.params?.period ?? 14;
        if (!addedIndicators.has('rsi')) {
          lines.push('');
          lines.push(`rsi_val = ta.rsi(close, ${p})`);
          lines.push(`// Note: RSI is an oscillator — in Pine Script, consider using a separate pane`);
          lines.push(`// plot(rsi_val, title="${layer.label}", color=color.purple)`);
          addedIndicators.add('rsi');
        }
        break;
      }
      case 'macd':
      case 'macd_signal':
      case 'macd_histogram': {
        if (!addedIndicators.has('macd')) {
          const fast = layer.params?.fast ?? 12;
          const slow = layer.params?.slow ?? 26;
          const sig = layer.params?.signal ?? 9;
          lines.push('');
          lines.push(`[macdLine, signalLine, histLine] = ta.macd(close, ${fast}, ${slow}, ${sig})`);
          lines.push(`// Note: MACD is typically plotted in a separate pane`);
          lines.push(`// plot(macdLine, title="MACD", color=color.blue)`);
          lines.push(`// plot(signalLine, title="Signal", color=color.orange)`);
          lines.push(`// plot(histLine, title="Histogram", color=color.gray, style=plot.style_histogram)`);
          addedIndicators.add('macd');
        }
        break;
      }
      case 'bollinger_upper':
      case 'bollinger_lower': {
        if (!addedIndicators.has('bb')) {
          const period = layer.params?.window ?? 20;
          const mult = layer.params?.multiplier ?? 2;
          lines.push('');
          lines.push(`[bbMiddle, bbUpper, bbLower] = ta.bb(close, ${period}, ${mult})`);
          lines.push(`plot(bbUpper, title="BB Upper", color=color.new(color.yellow, 30))`);
          lines.push(`plot(bbLower, title="BB Lower", color=color.new(color.yellow, 30))`);
          lines.push(`plot(bbMiddle, title="BB Middle", color=color.new(color.gray, 50))`);
          addedIndicators.add('bb');
        }
        break;
      }
      case 'atr': {
        const p = layer.params?.period ?? 14;
        if (!addedIndicators.has('atr')) {
          lines.push('');
          lines.push(`atr_val = ta.atr(${p})`);
          lines.push(`// plot(atr_val, title="ATR", color=color.lime)`);
          addedIndicators.add('atr');
        }
        break;
      }
      case 'stochastic_k':
      case 'stochastic_d': {
        if (!addedIndicators.has('stoch')) {
          const k = layer.params?.kPeriod ?? 14;
          const d = layer.params?.dPeriod ?? 3;
          const smooth = layer.params?.smooth ?? 3;
          lines.push('');
          lines.push(`stoch_k = ta.sma(ta.stoch(close, high, low, ${k}), ${smooth})`);
          lines.push(`stoch_d = ta.sma(stoch_k, ${d})`);
          lines.push(`// plot(stoch_k, title="%K", color=color.aqua)`);
          lines.push(`// plot(stoch_d, title="%D", color=color.fuchsia)`);
          addedIndicators.add('stoch');
        }
        break;
      }
      case 'volume': {
        if (!addedIndicators.has('volume')) {
          lines.push('');
          lines.push(`// Volume is built-in on TradingView — just enable it in chart settings`);
          addedIndicators.add('volume');
        }
        break;
      }
    }
  }

  lines.push('');
  return lines.join('\n');
}

/**
 * Export current layers to a Python script using pandas + plotly.
 */
export function exportToPython(layers: OverlayLayer[], coin: string, days: number): string {
  const lines: string[] = [
    '# DataLab Export — Python Script',
    '# Requirements: pip install pycoingecko pandas plotly',
    '',
    'from pycoingecko import CoinGeckoAPI',
    'import pandas as pd',
    'import plotly.graph_objects as go',
    'from plotly.subplots import make_subplots',
    '',
    'cg = CoinGeckoAPI()',
    '',
    `# Fetch OHLC data for ${coin}`,
    `ohlc = cg.get_coin_ohlc_by_id(id="${coin}", vs_currency="usd", days=${days})`,
    `df = pd.DataFrame(ohlc, columns=["timestamp", "open", "high", "low", "close"])`,
    `df["timestamp"] = pd.to_datetime(df["timestamp"], unit="ms")`,
    `df.set_index("timestamp", inplace=True)`,
    '',
    `# Fetch market data for volume`,
    `market = cg.get_coin_market_chart_by_id(id="${coin}", vs_currency="usd", days=${days})`,
    `vol_df = pd.DataFrame(market["total_volumes"], columns=["timestamp", "volume"])`,
    `vol_df["timestamp"] = pd.to_datetime(vol_df["timestamp"], unit="ms")`,
    `vol_df.set_index("timestamp", inplace=True)`,
    `df = df.join(vol_df, how="left")`,
    '',
  ];

  const hasSubplot = layers.some((l) => l.visible && l.gridIndex === 1);

  for (const layer of layers) {
    if (!layer.visible) continue;
    switch (layer.source) {
      case 'sma': {
        const w = layer.params?.window ?? 20;
        lines.push(`df["sma_${w}"] = df["close"].rolling(${w}).mean()`);
        break;
      }
      case 'ema': {
        const w = layer.params?.window ?? 20;
        lines.push(`df["ema_${w}"] = df["close"].ewm(span=${w}).mean()`);
        break;
      }
      case 'rsi': {
        const p = layer.params?.period ?? 14;
        lines.push(`delta = df["close"].diff()`);
        lines.push(`gain = delta.clip(lower=0).rolling(${p}).mean()`);
        lines.push(`loss = (-delta.clip(upper=0)).rolling(${p}).mean()`);
        lines.push(`df["rsi"] = 100 - (100 / (1 + gain / loss))`);
        break;
      }
      case 'bollinger_upper':
      case 'bollinger_lower': {
        const period = layer.params?.window ?? 20;
        const mult = layer.params?.multiplier ?? 2;
        lines.push(`df["bb_mid"] = df["close"].rolling(${period}).mean()`);
        lines.push(`df["bb_std"] = df["close"].rolling(${period}).std()`);
        lines.push(`df["bb_upper"] = df["bb_mid"] + ${mult} * df["bb_std"]`);
        lines.push(`df["bb_lower"] = df["bb_mid"] - ${mult} * df["bb_std"]`);
        break;
      }
    }
  }

  lines.push('');
  lines.push('# Create chart');
  lines.push(hasSubplot
    ? `fig = make_subplots(rows=2, cols=1, shared_xaxes=True, vertical_spacing=0.03, row_heights=[0.7, 0.3])`
    : `fig = go.Figure()`);
  lines.push('');

  for (const layer of layers) {
    if (!layer.visible) continue;
    const row = hasSubplot ? (layer.gridIndex === 0 ? 1 : 2) : 1;

    switch (layer.source) {
      case 'ohlc':
        lines.push(`fig.add_trace(go.Candlestick(x=df.index, open=df["open"], high=df["high"], low=df["low"], close=df["close"], name="OHLC"), row=${row}, col=1)`);
        break;
      case 'price':
        lines.push(`fig.add_trace(go.Scatter(x=df.index, y=df["close"], name="${layer.label}", line=dict(color="${layer.color}")), row=${row}, col=1)`);
        break;
      case 'sma': {
        const w = layer.params?.window ?? 20;
        lines.push(`fig.add_trace(go.Scatter(x=df.index, y=df["sma_${w}"], name="${layer.label}", line=dict(color="${layer.color}")), row=${row}, col=1)`);
        break;
      }
      case 'ema': {
        const w = layer.params?.window ?? 20;
        lines.push(`fig.add_trace(go.Scatter(x=df.index, y=df["ema_${w}"], name="${layer.label}", line=dict(color="${layer.color}")), row=${row}, col=1)`);
        break;
      }
      case 'rsi':
        lines.push(`fig.add_trace(go.Scatter(x=df.index, y=df["rsi"], name="${layer.label}", line=dict(color="${layer.color}")), row=${row}, col=1)`);
        break;
      case 'volume':
        lines.push(`fig.add_trace(go.Bar(x=df.index, y=df["volume"], name="${layer.label}", marker_color="${layer.color}"), row=${row}, col=1)`);
        break;
      case 'bollinger_upper':
        lines.push(`fig.add_trace(go.Scatter(x=df.index, y=df["bb_upper"], name="BB Upper", line=dict(color="${layer.color}", dash="dash")), row=${row}, col=1)`);
        break;
      case 'bollinger_lower':
        lines.push(`fig.add_trace(go.Scatter(x=df.index, y=df["bb_lower"], name="BB Lower", line=dict(color="${layer.color}", dash="dash")), row=${row}, col=1)`);
        break;
    }
  }

  lines.push('');
  lines.push(`fig.update_layout(title="${coin.toUpperCase()} — DataLab Export", template="plotly_dark", xaxis_rangeslider_visible=False)`);
  lines.push('fig.show()');

  return lines.join('\n');
}

/** Convert hex color to Pine Script color constant */
function pineColor(hex: string): string {
  const map: Record<string, string> = {
    '#34d399': 'color.green',
    '#f59e0b': 'color.yellow',
    '#60a5fa': 'color.blue',
    '#ef4444': 'color.red',
    '#a78bfa': 'color.purple',
    '#ec4899': 'color.fuchsia',
    '#f97316': 'color.orange',
    '#2dd4bf': 'color.teal',
    '#fb923c': 'color.orange',
  };
  return map[hex.toLowerCase()] ?? 'color.white';
}
