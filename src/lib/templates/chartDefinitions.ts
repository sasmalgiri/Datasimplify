/**
 * Chart Definitions for Excel Templates
 *
 * Defines pre-built chart configurations that match the website's dark theme.
 * Charts are bound to dynamic data tables with CryptoSheets formulas.
 *
 * Master Template Approach:
 * 1. Charts are pre-styled with dark theme colors
 * 2. Data tables contain CryptoSheets formulas (dynamic)
 * 3. When user refreshes (Ctrl+Alt+F5), data updates
 * 4. Charts automatically re-render with new data
 */

import type { TemplateType } from './templateConfig';

// ============================================
// CHART COLOR PALETTE (matches website)
// ============================================

export const CHART_COLORS = {
  // Primary colors for data series
  series: [
    '10B981', // Emerald (primary)
    '6366F1', // Indigo
    'F59E0B', // Amber
    'EC4899', // Pink
    '8B5CF6', // Purple
    '14B8A6', // Teal
    'F97316', // Orange
    '06B6D4', // Cyan
    'EF4444', // Red
    '84CC16', // Lime
  ],

  // Background colors
  plotArea: '111827', // gray-900
  chartArea: '1F2937', // gray-800

  // Axis and grid colors
  axisLine: '374151', // gray-700
  gridLine: '374151', // gray-700
  axisLabel: '9CA3AF', // gray-400

  // Title and legend
  title: 'FFFFFF', // white
  legend: 'D1D5DB', // gray-300

  // Positive/Negative (for candlesticks, P&L)
  positive: '10B981', // Emerald
  negative: 'EF4444', // Red

  // Special colors
  volume: '6366F1', // Indigo (transparent)
  movingAverage: 'F59E0B', // Amber
  bollingerBand: '8B5CF6', // Purple (transparent)
};

// ============================================
// CHART TYPE DEFINITIONS
// ============================================

export type ChartType =
  | 'line'
  | 'bar'
  | 'column'
  | 'pie'
  | 'doughnut'
  | 'area'
  | 'scatter'
  | 'candlestick'
  | 'combo'
  | 'radar'
  | 'heatmap';

export interface ChartSeriesConfig {
  name: string;
  dataRange: string; // e.g., "Data!B2:B21"
  color: string;
  type?: ChartType; // For combo charts
  yAxis?: 'primary' | 'secondary';
  showDataLabels?: boolean;
  lineWidth?: number;
  markerSize?: number;
  fillOpacity?: number;
}

export interface ChartAxisConfig {
  title?: string;
  min?: number;
  max?: number;
  format?: string;
  reversed?: boolean;
  logarithmic?: boolean;
}

export interface ChartConfig {
  id: string;
  title: string;
  type: ChartType;
  description: string;

  // Data configuration
  categoryRange: string; // X-axis labels (e.g., "Data!A2:A21")
  series: ChartSeriesConfig[];

  // Axis configuration
  xAxis?: ChartAxisConfig;
  yAxis?: ChartAxisConfig;
  y2Axis?: ChartAxisConfig; // Secondary Y-axis

  // Layout
  width: number; // In Excel column units
  height: number; // In Excel row units
  position: { row: number; col: number };

  // Styling
  showLegend: boolean;
  legendPosition?: 'top' | 'bottom' | 'left' | 'right';
  showGridLines?: boolean;
  showDataLabels?: boolean;

  // Special features
  trendline?: boolean;
  annotations?: Array<{
    type: 'line' | 'label';
    value: number | string;
    label?: string;
    color?: string;
  }>;
}

// ============================================
// TEMPLATE CHART CONFIGURATIONS
// ============================================

/**
 * Get chart configurations for a specific template
 */
export function getChartsForTemplate(templateId: TemplateType): ChartConfig[] {
  switch (templateId) {
    case 'screener':
      return getScreenerCharts();
    case 'compare':
      return getCompareCharts();
    case 'portfolio_tracker':
      return getPortfolioCharts();
    case 'ohlcv_history':
      return getOHLCVCharts();
    case 'technical_indicators':
      return getTechnicalCharts();
    case 'risk_dashboard':
      return getRiskCharts();
    case 'correlation_matrix':
      return getCorrelationCharts();
    case 'fear_greed':
      return getFearGreedCharts();
    case 'defi_tvl':
      return getDeFiTVLCharts();
    case 'market_overview':
      return getMarketOverviewCharts();
    case 'gainers_losers':
      return getGainersLosersCharts();
    case 'funding_rates':
      return getFundingRatesCharts();
    case 'open_interest':
      return getOpenInterestCharts();
    case 'liquidations':
      return getLiquidationsCharts();
    case 'watchlist':
      return getWatchlistCharts();
    default:
      return [];
  }
}

// ============================================
// SCREENER TEMPLATE CHARTS
// ============================================

function getScreenerCharts(): ChartConfig[] {
  return [
    {
      id: 'market_cap_bar',
      title: 'Market Cap Distribution',
      type: 'bar',
      description: 'Horizontal bar chart showing market cap by coin',
      categoryRange: 'Data!A2:A21',
      series: [
        {
          name: 'Market Cap',
          dataRange: 'Data!D2:D21',
          color: CHART_COLORS.series[0],
          showDataLabels: false,
        },
      ],
      xAxis: { title: 'Market Cap (USD)' },
      yAxis: { title: 'Coin' },
      width: 12,
      height: 20,
      position: { row: 2, col: 10 },
      showLegend: false,
      showGridLines: true,
    },
    {
      id: 'volume_24h',
      title: '24h Trading Volume',
      type: 'column',
      description: 'Column chart showing 24h trading volume',
      categoryRange: 'Data!A2:A21',
      series: [
        {
          name: '24h Volume',
          dataRange: 'Data!E2:E21',
          color: CHART_COLORS.volume,
          fillOpacity: 0.7,
        },
      ],
      xAxis: { title: 'Coin' },
      yAxis: { title: 'Volume (USD)' },
      width: 12,
      height: 15,
      position: { row: 24, col: 10 },
      showLegend: false,
      showGridLines: true,
    },
    {
      id: 'price_change_24h',
      title: '24h Price Change (%)',
      type: 'bar',
      description: 'Horizontal bar chart showing 24h price changes',
      categoryRange: 'Data!A2:A21',
      series: [
        {
          name: '24h Change',
          dataRange: 'Data!C2:C21',
          color: CHART_COLORS.positive,
        },
      ],
      width: 12,
      height: 20,
      position: { row: 41, col: 10 },
      showLegend: false,
      showGridLines: true,
    },
  ];
}

// ============================================
// COMPARE TEMPLATE CHARTS
// ============================================

function getCompareCharts(): ChartConfig[] {
  return [
    {
      id: 'price_comparison',
      title: 'Price Comparison (Normalized)',
      type: 'line',
      description: 'Line chart comparing normalized prices of selected coins',
      categoryRange: 'Data!A2:A11',
      series: [
        {
          name: 'Coin 1',
          dataRange: 'Data!B2:B11',
          color: CHART_COLORS.series[0],
          lineWidth: 2,
        },
        {
          name: 'Coin 2',
          dataRange: 'Data!C2:C11',
          color: CHART_COLORS.series[1],
          lineWidth: 2,
        },
        {
          name: 'Coin 3',
          dataRange: 'Data!D2:D11',
          color: CHART_COLORS.series[2],
          lineWidth: 2,
        },
      ],
      xAxis: { title: 'Time' },
      yAxis: { title: 'Normalized Price' },
      width: 14,
      height: 18,
      position: { row: 2, col: 8 },
      showLegend: true,
      legendPosition: 'bottom',
      showGridLines: true,
    },
    {
      id: 'market_cap_comparison',
      title: 'Market Cap Comparison',
      type: 'pie',
      description: 'Pie chart showing relative market caps',
      categoryRange: 'Data!A2:A6',
      series: [
        {
          name: 'Market Cap',
          dataRange: 'Data!F2:F6',
          color: CHART_COLORS.series[0],
          showDataLabels: true,
        },
      ],
      width: 10,
      height: 15,
      position: { row: 22, col: 8 },
      showLegend: true,
      legendPosition: 'right',
    },
    {
      id: 'performance_comparison',
      title: 'Performance Comparison',
      type: 'column',
      description: 'Grouped bar chart comparing performance metrics',
      categoryRange: 'Metrics!A2:A6',
      series: [
        {
          name: '24h Change',
          dataRange: 'Metrics!B2:B6',
          color: CHART_COLORS.series[0],
        },
        {
          name: '7d Change',
          dataRange: 'Metrics!C2:C6',
          color: CHART_COLORS.series[1],
        },
        {
          name: '30d Change',
          dataRange: 'Metrics!D2:D6',
          color: CHART_COLORS.series[2],
        },
      ],
      xAxis: { title: 'Coin' },
      yAxis: { title: 'Change (%)' },
      width: 14,
      height: 15,
      position: { row: 22, col: 20 },
      showLegend: true,
      legendPosition: 'bottom',
      showGridLines: true,
    },
  ];
}

// ============================================
// PORTFOLIO TRACKER CHARTS
// ============================================

function getPortfolioCharts(): ChartConfig[] {
  return [
    {
      id: 'allocation_pie',
      title: 'Portfolio Allocation',
      type: 'doughnut',
      description: 'Doughnut chart showing portfolio allocation by coin',
      categoryRange: 'Holdings!A2:A11',
      series: [
        {
          name: 'Value',
          dataRange: 'Holdings!E2:E11',
          color: CHART_COLORS.series[0],
          showDataLabels: true,
        },
      ],
      width: 12,
      height: 18,
      position: { row: 2, col: 10 },
      showLegend: true,
      legendPosition: 'right',
    },
    {
      id: 'pnl_bar',
      title: 'Profit/Loss by Coin',
      type: 'bar',
      description: 'Bar chart showing P&L for each holding',
      categoryRange: 'Holdings!A2:A11',
      series: [
        {
          name: 'P&L',
          dataRange: 'Holdings!G2:G11',
          color: CHART_COLORS.positive,
        },
      ],
      xAxis: { title: 'P&L (USD)' },
      yAxis: { title: 'Coin' },
      width: 12,
      height: 15,
      position: { row: 22, col: 10 },
      showLegend: false,
      showGridLines: true,
    },
    {
      id: 'value_trend',
      title: 'Portfolio Value Trend',
      type: 'area',
      description: 'Area chart showing portfolio value over time',
      categoryRange: 'History!A2:A31',
      series: [
        {
          name: 'Portfolio Value',
          dataRange: 'History!B2:B31',
          color: CHART_COLORS.series[0],
          fillOpacity: 0.3,
        },
      ],
      xAxis: { title: 'Date' },
      yAxis: { title: 'Value (USD)' },
      width: 16,
      height: 12,
      position: { row: 39, col: 10 },
      showLegend: false,
      showGridLines: true,
    },
  ];
}

// ============================================
// OHLCV / CANDLESTICK CHARTS
// ============================================

function getOHLCVCharts(): ChartConfig[] {
  return [
    {
      id: 'candlestick',
      title: 'Price Chart (Candlestick)',
      type: 'candlestick',
      description: 'Candlestick chart with OHLC data',
      categoryRange: 'OHLCV_Data!A2:A101',
      series: [
        {
          name: 'Open',
          dataRange: 'OHLCV_Data!B2:B101',
          color: CHART_COLORS.positive,
        },
        {
          name: 'High',
          dataRange: 'OHLCV_Data!C2:C101',
          color: CHART_COLORS.positive,
        },
        {
          name: 'Low',
          dataRange: 'OHLCV_Data!D2:D101',
          color: CHART_COLORS.negative,
        },
        {
          name: 'Close',
          dataRange: 'OHLCV_Data!E2:E101',
          color: CHART_COLORS.positive,
        },
      ],
      xAxis: { title: 'Date' },
      yAxis: { title: 'Price (USD)' },
      width: 20,
      height: 20,
      position: { row: 2, col: 8 },
      showLegend: false,
      showGridLines: true,
    },
    {
      id: 'volume_bars',
      title: 'Trading Volume',
      type: 'column',
      description: 'Volume bars below price chart',
      categoryRange: 'OHLCV_Data!A2:A101',
      series: [
        {
          name: 'Volume',
          dataRange: 'OHLCV_Data!F2:F101',
          color: CHART_COLORS.volume,
          fillOpacity: 0.5,
        },
      ],
      xAxis: { title: 'Date' },
      yAxis: { title: 'Volume' },
      width: 20,
      height: 8,
      position: { row: 24, col: 8 },
      showLegend: false,
      showGridLines: false,
    },
  ];
}

// ============================================
// TECHNICAL INDICATORS CHARTS
// ============================================

function getTechnicalCharts(): ChartConfig[] {
  return [
    {
      id: 'price_with_ma',
      title: 'Price with Moving Averages',
      type: 'combo',
      description: 'Price line with SMA/EMA overlays',
      categoryRange: 'Indicators!A2:A51',
      series: [
        {
          name: 'Price',
          dataRange: 'Indicators!B2:B51',
          color: CHART_COLORS.series[0],
          type: 'line',
          lineWidth: 2,
        },
        {
          name: 'SMA 20',
          dataRange: 'Indicators!C2:C51',
          color: CHART_COLORS.movingAverage,
          type: 'line',
          lineWidth: 1,
        },
        {
          name: 'SMA 50',
          dataRange: 'Indicators!D2:D51',
          color: CHART_COLORS.series[2],
          type: 'line',
          lineWidth: 1,
        },
      ],
      xAxis: { title: 'Date' },
      yAxis: { title: 'Price (USD)' },
      width: 18,
      height: 15,
      position: { row: 2, col: 10 },
      showLegend: true,
      legendPosition: 'top',
      showGridLines: true,
    },
    {
      id: 'rsi',
      title: 'RSI (14)',
      type: 'line',
      description: 'Relative Strength Index with overbought/oversold zones',
      categoryRange: 'Indicators!A2:A51',
      series: [
        {
          name: 'RSI',
          dataRange: 'Indicators!E2:E51',
          color: CHART_COLORS.series[4],
          lineWidth: 2,
        },
      ],
      xAxis: { title: 'Date' },
      yAxis: { title: 'RSI', min: 0, max: 100 },
      width: 18,
      height: 10,
      position: { row: 19, col: 10 },
      showLegend: false,
      showGridLines: true,
      annotations: [
        { type: 'line', value: 70, label: 'Overbought', color: CHART_COLORS.negative },
        { type: 'line', value: 30, label: 'Oversold', color: CHART_COLORS.positive },
      ],
    },
    {
      id: 'macd',
      title: 'MACD',
      type: 'combo',
      description: 'MACD line, signal line, and histogram',
      categoryRange: 'Indicators!A2:A51',
      series: [
        {
          name: 'MACD',
          dataRange: 'Indicators!F2:F51',
          color: CHART_COLORS.series[1],
          type: 'line',
          lineWidth: 2,
        },
        {
          name: 'Signal',
          dataRange: 'Indicators!G2:G51',
          color: CHART_COLORS.series[3],
          type: 'line',
          lineWidth: 1,
        },
        {
          name: 'Histogram',
          dataRange: 'Indicators!H2:H51',
          color: CHART_COLORS.series[0],
          type: 'column',
          fillOpacity: 0.7,
        },
      ],
      xAxis: { title: 'Date' },
      yAxis: { title: 'MACD' },
      width: 18,
      height: 10,
      position: { row: 31, col: 10 },
      showLegend: true,
      legendPosition: 'top',
      showGridLines: true,
    },
    {
      id: 'bollinger_bands',
      title: 'Bollinger Bands',
      type: 'combo',
      description: 'Price with Bollinger Bands overlay',
      categoryRange: 'Indicators!A2:A51',
      series: [
        {
          name: 'Price',
          dataRange: 'Indicators!B2:B51',
          color: CHART_COLORS.series[0],
          type: 'line',
          lineWidth: 2,
        },
        {
          name: 'Upper Band',
          dataRange: 'Indicators!I2:I51',
          color: CHART_COLORS.bollingerBand,
          type: 'line',
          lineWidth: 1,
        },
        {
          name: 'Middle Band',
          dataRange: 'Indicators!J2:J51',
          color: CHART_COLORS.series[2],
          type: 'line',
          lineWidth: 1,
        },
        {
          name: 'Lower Band',
          dataRange: 'Indicators!K2:K51',
          color: CHART_COLORS.bollingerBand,
          type: 'line',
          lineWidth: 1,
        },
      ],
      xAxis: { title: 'Date' },
      yAxis: { title: 'Price (USD)' },
      width: 18,
      height: 15,
      position: { row: 43, col: 10 },
      showLegend: true,
      legendPosition: 'top',
      showGridLines: true,
    },
  ];
}

// ============================================
// RISK DASHBOARD CHARTS
// ============================================

function getRiskCharts(): ChartConfig[] {
  return [
    {
      id: 'volatility_trend',
      title: 'Volatility Trend',
      type: 'area',
      description: 'Historical volatility over time',
      categoryRange: 'Risk_Data!A2:A31',
      series: [
        {
          name: 'Volatility',
          dataRange: 'Risk_Data!B2:B31',
          color: CHART_COLORS.series[3],
          fillOpacity: 0.3,
        },
      ],
      xAxis: { title: 'Date' },
      yAxis: { title: 'Volatility (%)' },
      width: 14,
      height: 12,
      position: { row: 2, col: 8 },
      showLegend: false,
      showGridLines: true,
    },
    {
      id: 'drawdown_chart',
      title: 'Drawdown from Peak',
      type: 'area',
      description: 'Drawdown percentage from all-time high',
      categoryRange: 'Risk_Data!A2:A31',
      series: [
        {
          name: 'Drawdown',
          dataRange: 'Risk_Data!C2:C31',
          color: CHART_COLORS.negative,
          fillOpacity: 0.4,
        },
      ],
      xAxis: { title: 'Date' },
      yAxis: { title: 'Drawdown (%)', reversed: true },
      width: 14,
      height: 12,
      position: { row: 16, col: 8 },
      showLegend: false,
      showGridLines: true,
    },
    {
      id: 'risk_metrics_radar',
      title: 'Risk Metrics Overview',
      type: 'radar',
      description: 'Radar chart of key risk metrics',
      categoryRange: 'Summary!A2:A7',
      series: [
        {
          name: 'Current',
          dataRange: 'Summary!B2:B7',
          color: CHART_COLORS.series[0],
          fillOpacity: 0.3,
        },
        {
          name: 'Market Average',
          dataRange: 'Summary!C2:C7',
          color: CHART_COLORS.series[1],
          fillOpacity: 0.2,
        },
      ],
      width: 12,
      height: 15,
      position: { row: 2, col: 24 },
      showLegend: true,
      legendPosition: 'bottom',
    },
  ];
}

// ============================================
// CORRELATION MATRIX CHARTS
// ============================================

function getCorrelationCharts(): ChartConfig[] {
  return [
    {
      id: 'correlation_heatmap',
      title: 'Correlation Matrix Heatmap',
      type: 'heatmap',
      description: 'Heatmap showing correlations between coins',
      categoryRange: 'Matrix!A2:A11',
      series: [
        {
          name: 'Correlation',
          dataRange: 'Matrix!B2:K11',
          color: CHART_COLORS.series[0],
        },
      ],
      width: 16,
      height: 16,
      position: { row: 2, col: 14 },
      showLegend: true,
      legendPosition: 'right',
    },
    {
      id: 'correlation_scatter',
      title: 'BTC vs ETH Correlation',
      type: 'scatter',
      description: 'Scatter plot showing BTC-ETH price relationship',
      categoryRange: 'Scatter_Data!A2:A101',
      series: [
        {
          name: 'Price Points',
          dataRange: 'Scatter_Data!B2:C101',
          color: CHART_COLORS.series[0],
          markerSize: 4,
        },
      ],
      xAxis: { title: 'BTC Price' },
      yAxis: { title: 'ETH Price' },
      width: 14,
      height: 14,
      position: { row: 20, col: 14 },
      showLegend: false,
      showGridLines: true,
      trendline: true,
    },
  ];
}

// ============================================
// FEAR & GREED CHARTS
// ============================================

function getFearGreedCharts(): ChartConfig[] {
  return [
    {
      id: 'fear_greed_gauge',
      title: 'Current Fear & Greed Index',
      type: 'doughnut',
      description: 'Gauge-style chart showing current sentiment',
      categoryRange: 'Current!A2:A3',
      series: [
        {
          name: 'Index',
          dataRange: 'Current!B2:B3',
          color: CHART_COLORS.series[0],
          showDataLabels: true,
        },
      ],
      width: 10,
      height: 12,
      position: { row: 2, col: 8 },
      showLegend: false,
    },
    {
      id: 'fear_greed_history',
      title: 'Fear & Greed History',
      type: 'area',
      description: 'Historical Fear & Greed Index values',
      categoryRange: 'History!A2:A31',
      series: [
        {
          name: 'Fear & Greed',
          dataRange: 'History!B2:B31',
          color: CHART_COLORS.series[0],
          fillOpacity: 0.4,
        },
      ],
      xAxis: { title: 'Date' },
      yAxis: { title: 'Index', min: 0, max: 100 },
      width: 16,
      height: 12,
      position: { row: 2, col: 20 },
      showLegend: false,
      showGridLines: true,
      annotations: [
        { type: 'line', value: 75, label: 'Extreme Greed', color: CHART_COLORS.positive },
        { type: 'line', value: 25, label: 'Extreme Fear', color: CHART_COLORS.negative },
      ],
    },
    {
      id: 'sentiment_distribution',
      title: 'Sentiment Distribution',
      type: 'pie',
      description: 'Distribution of sentiment categories',
      categoryRange: 'Summary!A2:A5',
      series: [
        {
          name: 'Days',
          dataRange: 'Summary!B2:B5',
          color: CHART_COLORS.series[0],
          showDataLabels: true,
        },
      ],
      width: 10,
      height: 12,
      position: { row: 16, col: 8 },
      showLegend: true,
      legendPosition: 'bottom',
    },
  ];
}

// ============================================
// DEFI TVL CHARTS
// ============================================

function getDeFiTVLCharts(): ChartConfig[] {
  return [
    {
      id: 'tvl_by_protocol',
      title: 'TVL by Protocol',
      type: 'bar',
      description: 'Horizontal bar chart of top protocols by TVL',
      categoryRange: 'Protocols!A2:A16',
      series: [
        {
          name: 'TVL',
          dataRange: 'Protocols!C2:C16',
          color: CHART_COLORS.series[0],
        },
      ],
      xAxis: { title: 'TVL (USD)' },
      yAxis: { title: 'Protocol' },
      width: 14,
      height: 18,
      position: { row: 2, col: 8 },
      showLegend: false,
      showGridLines: true,
    },
    {
      id: 'tvl_by_chain',
      title: 'TVL by Blockchain',
      type: 'pie',
      description: 'Pie chart showing TVL distribution by chain',
      categoryRange: 'Chains!A2:A11',
      series: [
        {
          name: 'TVL',
          dataRange: 'Chains!B2:B11',
          color: CHART_COLORS.series[0],
          showDataLabels: true,
        },
      ],
      width: 12,
      height: 15,
      position: { row: 2, col: 24 },
      showLegend: true,
      legendPosition: 'right',
    },
    {
      id: 'tvl_trend',
      title: 'Total DeFi TVL Trend',
      type: 'area',
      description: 'Historical total DeFi TVL',
      categoryRange: 'History!A2:A31',
      series: [
        {
          name: 'Total TVL',
          dataRange: 'History!B2:B31',
          color: CHART_COLORS.series[0],
          fillOpacity: 0.3,
        },
      ],
      xAxis: { title: 'Date' },
      yAxis: { title: 'TVL (USD)' },
      width: 20,
      height: 12,
      position: { row: 22, col: 8 },
      showLegend: false,
      showGridLines: true,
    },
  ];
}

// ============================================
// MARKET OVERVIEW CHARTS
// ============================================

function getMarketOverviewCharts(): ChartConfig[] {
  return [
    {
      id: 'total_market_cap',
      title: 'Total Crypto Market Cap',
      type: 'area',
      description: 'Historical total market capitalization',
      categoryRange: 'History!A2:A31',
      series: [
        {
          name: 'Market Cap',
          dataRange: 'History!B2:B31',
          color: CHART_COLORS.series[0],
          fillOpacity: 0.3,
        },
      ],
      xAxis: { title: 'Date' },
      yAxis: { title: 'Market Cap (USD)' },
      width: 16,
      height: 12,
      position: { row: 2, col: 6 },
      showLegend: false,
      showGridLines: true,
    },
    {
      id: 'btc_dominance',
      title: 'BTC Dominance',
      type: 'line',
      description: 'Bitcoin market dominance percentage',
      categoryRange: 'History!A2:A31',
      series: [
        {
          name: 'BTC Dominance',
          dataRange: 'History!C2:C31',
          color: CHART_COLORS.series[2],
          lineWidth: 2,
        },
      ],
      xAxis: { title: 'Date' },
      yAxis: { title: 'Dominance (%)', min: 0, max: 100 },
      width: 12,
      height: 10,
      position: { row: 2, col: 24 },
      showLegend: false,
      showGridLines: true,
    },
    {
      id: 'top_coins_pie',
      title: 'Top Coins by Market Cap',
      type: 'pie',
      description: 'Market cap distribution of top coins',
      categoryRange: 'Global_Stats!A8:A17',
      series: [
        {
          name: 'Market Cap',
          dataRange: 'Global_Stats!B8:B17',
          color: CHART_COLORS.series[0],
          showDataLabels: true,
        },
      ],
      width: 12,
      height: 15,
      position: { row: 16, col: 6 },
      showLegend: true,
      legendPosition: 'right',
    },
  ];
}

// ============================================
// GAINERS & LOSERS CHARTS
// ============================================

function getGainersLosersCharts(): ChartConfig[] {
  return [
    {
      id: 'top_gainers',
      title: 'Top Gainers (24h)',
      type: 'bar',
      description: 'Horizontal bar chart of top gainers',
      categoryRange: 'Gainers!A2:A11',
      series: [
        {
          name: '24h Change',
          dataRange: 'Gainers!C2:C11',
          color: CHART_COLORS.positive,
        },
      ],
      xAxis: { title: 'Change (%)' },
      yAxis: { title: 'Coin' },
      width: 12,
      height: 15,
      position: { row: 2, col: 8 },
      showLegend: false,
      showGridLines: true,
    },
    {
      id: 'top_losers',
      title: 'Top Losers (24h)',
      type: 'bar',
      description: 'Horizontal bar chart of top losers',
      categoryRange: 'Losers!A2:A11',
      series: [
        {
          name: '24h Change',
          dataRange: 'Losers!C2:C11',
          color: CHART_COLORS.negative,
        },
      ],
      xAxis: { title: 'Change (%)' },
      yAxis: { title: 'Coin' },
      width: 12,
      height: 15,
      position: { row: 2, col: 22 },
      showLegend: false,
      showGridLines: true,
    },
  ];
}

// ============================================
// FUNDING RATES CHARTS
// ============================================

function getFundingRatesCharts(): ChartConfig[] {
  return [
    {
      id: 'funding_rates_bar',
      title: 'Current Funding Rates',
      type: 'bar',
      description: 'Bar chart of funding rates by exchange',
      categoryRange: 'Funding_Rates!A2:A11',
      series: [
        {
          name: 'Funding Rate',
          dataRange: 'Funding_Rates!D2:D11',
          color: CHART_COLORS.series[0],
        },
      ],
      xAxis: { title: 'Funding Rate (%)' },
      yAxis: { title: 'Exchange / Coin' },
      width: 14,
      height: 15,
      position: { row: 2, col: 8 },
      showLegend: false,
      showGridLines: true,
    },
    {
      id: 'funding_history',
      title: 'Funding Rate History',
      type: 'line',
      description: 'Historical funding rates',
      categoryRange: 'History!A2:A31',
      series: [
        {
          name: 'BTC Funding',
          dataRange: 'History!B2:B31',
          color: CHART_COLORS.series[0],
          lineWidth: 2,
        },
        {
          name: 'ETH Funding',
          dataRange: 'History!C2:C31',
          color: CHART_COLORS.series[1],
          lineWidth: 2,
        },
      ],
      xAxis: { title: 'Date' },
      yAxis: { title: 'Funding Rate (%)' },
      width: 16,
      height: 12,
      position: { row: 19, col: 8 },
      showLegend: true,
      legendPosition: 'bottom',
      showGridLines: true,
    },
  ];
}

// ============================================
// OPEN INTEREST CHARTS
// ============================================

function getOpenInterestCharts(): ChartConfig[] {
  return [
    {
      id: 'oi_by_exchange',
      title: 'Open Interest by Exchange',
      type: 'bar',
      description: 'Horizontal bar chart of OI by exchange',
      categoryRange: 'Open_Interest!A2:A11',
      series: [
        {
          name: 'Open Interest',
          dataRange: 'Open_Interest!C2:C11',
          color: CHART_COLORS.series[1],
        },
      ],
      xAxis: { title: 'Open Interest (USD)' },
      yAxis: { title: 'Exchange' },
      width: 14,
      height: 15,
      position: { row: 2, col: 8 },
      showLegend: false,
      showGridLines: true,
    },
    {
      id: 'oi_trend',
      title: 'Open Interest Trend',
      type: 'area',
      description: 'Historical open interest',
      categoryRange: 'History!A2:A31',
      series: [
        {
          name: 'Total OI',
          dataRange: 'History!B2:B31',
          color: CHART_COLORS.series[1],
          fillOpacity: 0.3,
        },
      ],
      xAxis: { title: 'Date' },
      yAxis: { title: 'Open Interest (USD)' },
      width: 16,
      height: 12,
      position: { row: 19, col: 8 },
      showLegend: false,
      showGridLines: true,
    },
  ];
}

// ============================================
// LIQUIDATIONS CHARTS
// ============================================

function getLiquidationsCharts(): ChartConfig[] {
  return [
    {
      id: 'liquidations_24h',
      title: '24h Liquidations',
      type: 'column',
      description: 'Column chart of liquidations by coin',
      categoryRange: 'Liquidations_24h!A2:A11',
      series: [
        {
          name: 'Longs',
          dataRange: 'Liquidations_24h!C2:C11',
          color: CHART_COLORS.positive,
        },
        {
          name: 'Shorts',
          dataRange: 'Liquidations_24h!D2:D11',
          color: CHART_COLORS.negative,
        },
      ],
      xAxis: { title: 'Coin' },
      yAxis: { title: 'Liquidations (USD)' },
      width: 16,
      height: 15,
      position: { row: 2, col: 8 },
      showLegend: true,
      legendPosition: 'top',
      showGridLines: true,
    },
    {
      id: 'liquidations_ratio',
      title: 'Long/Short Ratio',
      type: 'pie',
      description: 'Pie chart of long vs short liquidations',
      categoryRange: 'Summary!A2:A3',
      series: [
        {
          name: 'Liquidations',
          dataRange: 'Summary!B2:B3',
          color: CHART_COLORS.series[0],
          showDataLabels: true,
        },
      ],
      width: 10,
      height: 12,
      position: { row: 2, col: 26 },
      showLegend: true,
      legendPosition: 'bottom',
    },
  ];
}

// ============================================
// WATCHLIST CHARTS
// ============================================

function getWatchlistCharts(): ChartConfig[] {
  return [
    {
      id: 'watchlist_performance',
      title: 'Watchlist Performance',
      type: 'column',
      description: 'Bar chart of 24h performance for watched coins',
      categoryRange: 'Data!A2:A21',
      series: [
        {
          name: '24h Change',
          dataRange: 'Data!C2:C21',
          color: CHART_COLORS.series[0],
        },
      ],
      xAxis: { title: 'Coin' },
      yAxis: { title: 'Change (%)' },
      width: 14,
      height: 15,
      position: { row: 2, col: 10 },
      showLegend: false,
      showGridLines: true,
    },
    {
      id: 'watchlist_value',
      title: 'Value Distribution',
      type: 'pie',
      description: 'Pie chart of market cap distribution',
      categoryRange: 'Data!A2:A11',
      series: [
        {
          name: 'Market Cap',
          dataRange: 'Data!D2:D11',
          color: CHART_COLORS.series[0],
          showDataLabels: true,
        },
      ],
      width: 10,
      height: 12,
      position: { row: 19, col: 10 },
      showLegend: true,
      legendPosition: 'right',
    },
  ];
}

// ============================================
// CHART RENDERING HELPERS
// ============================================

/**
 * Generate Excel chart XML configuration
 * This creates the chart definition that Excel will render
 */
export function generateChartXML(chart: ChartConfig): string {
  // This is a simplified representation
  // Full implementation would generate proper Excel chart XML
  return `
    <chart id="${chart.id}">
      <title>${chart.title}</title>
      <type>${chart.type}</type>
      <plotArea>
        <backgroundColor>${CHART_COLORS.plotArea}</backgroundColor>
      </plotArea>
      <series>
        ${chart.series.map((s, i) => `
          <ser>
            <name>${s.name}</name>
            <val>${s.dataRange}</val>
            <color>${s.color || CHART_COLORS.series[i % CHART_COLORS.series.length]}</color>
          </ser>
        `).join('')}
      </series>
      <legend show="${chart.showLegend}" position="${chart.legendPosition || 'bottom'}"/>
    </chart>
  `;
}

/**
 * Get chart description for the Charts sheet
 */
export function getChartDescription(chart: ChartConfig): string {
  return `${chart.title}: ${chart.description} (${chart.type} chart)`;
}
