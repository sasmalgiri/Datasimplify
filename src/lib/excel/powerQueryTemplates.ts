/**
 * Power Query Templates for BYOK Live Excel Data
 *
 * Generates Power Query M code that connects DIRECTLY to CoinGecko API
 * using the user's own API key from the workbook's named range.
 *
 * BYOK: Your key, your data, direct connection. Server never touches CoinGecko.
 */

// CoinGecko API base URL
const CG_API = 'https://api.coingecko.com/api/v3';

// M code snippet to read API key from Excel named range "CRK_ApiKey"
const API_KEY_M = 'Excel.CurrentWorkbook(){[Name="CRK_ApiKey"]}[Content]{0}[Column1]';

// ============================================
// POWER QUERY CODE TEMPLATES (Direct to CoinGecko)
// ============================================

export const POWER_QUERY_TEMPLATES = {
  // Market data - top coins by market cap
  market: (limit: number = 100) => `let
    ApiKey = ${API_KEY_M},
    Source = Json.Document(Web.Contents("${CG_API}/coins/markets", [
        Query = [vs_currency = "usd", order = "market_cap_desc", per_page = "${limit}", page = "1", sparkline = "false", price_change_percentage = "24h,7d,30d", x_cg_demo_api_key = ApiKey]
    ])),
    #"To Table" = Table.FromList(Source, Splitter.SplitByNothing(), null, null, ExtraValues.Error),
    #"Expanded" = Table.ExpandRecordColumn(#"To Table", "Column1",
        {"market_cap_rank", "name", "symbol", "current_price", "market_cap", "total_volume",
         "price_change_percentage_24h", "price_change_percentage_7d_in_currency", "price_change_percentage_30d_in_currency",
         "ath", "ath_change_percentage", "last_updated"},
        {"Rank", "Name", "Symbol", "Price", "MarketCap", "Volume24h",
         "Change24h", "Change7d", "Change30d", "ATH", "ATHChange", "LastUpdated"})
in
    #"Expanded"`,

  // Global market statistics
  global: () => `let
    ApiKey = ${API_KEY_M},
    Source = Json.Document(Web.Contents("${CG_API}/global", [
        Query = [x_cg_demo_api_key = ApiKey]
    ])),
    Data = Source[data],
    TotalMCap = Record.FieldOrDefault(Data[total_market_cap], "usd", 0),
    TotalVol = Record.FieldOrDefault(Data[total_volume], "usd", 0),
    BtcDom = Record.FieldOrDefault(Data[market_cap_percentage], "btc", 0),
    EthDom = Record.FieldOrDefault(Data[market_cap_percentage], "eth", 0),
    Result = #table(
        {"Metric", "Value"},
        {
            {"Total Market Cap (USD)", TotalMCap},
            {"24h Volume (USD)", TotalVol},
            {"BTC Dominance %", BtcDom},
            {"ETH Dominance %", EthDom},
            {"Active Cryptocurrencies", Data[active_cryptocurrencies]},
            {"Markets", Data[markets]},
            {"Market Cap Change 24h %", Data[market_cap_change_percentage_24h_usd]}
        }
    )
in
    Result`,

  // Fear & Greed Index (alternative.me - no CoinGecko key needed)
  fearGreed: (days: number = 30) => `let
    Source = Json.Document(Web.Contents("https://api.alternative.me/fng/?limit=${days}")),
    Data = Source[data],
    #"To Table" = Table.FromList(Data, Splitter.SplitByNothing(), null, null, ExtraValues.Error),
    #"Expanded" = Table.ExpandRecordColumn(#"To Table", "Column1",
        {"value", "value_classification", "timestamp"},
        {"Value", "Classification", "Timestamp"}),
    #"Added Date" = Table.AddColumn(#"Expanded", "Date",
        each #datetime(1970, 1, 1, 0, 0, 0) + #duration(0, 0, 0, Number.FromText([Timestamp])),
        type datetime),
    #"Changed Types" = Table.TransformColumnTypes(#"Added Date", {{"Value", Int64.Type}})
in
    #"Changed Types"`,

  // OHLC candlestick data
  ohlc: (coin: string = 'bitcoin', days: number = 30) => `let
    ApiKey = ${API_KEY_M},
    Source = Json.Document(Web.Contents("${CG_API}/coins/${coin}/ohlc", [
        Query = [vs_currency = "usd", days = "${days}", x_cg_demo_api_key = ApiKey]
    ])),
    #"To Table" = Table.FromList(Source, Splitter.SplitByNothing(), null, null, ExtraValues.Error),
    #"Extracted" = Table.TransformColumns(#"To Table", {{"Column1", each
        [Timestamp = _{0}, Open = _{1}, High = _{2}, Low = _{3}, Close = _{4}]}}),
    #"To Records" = Table.ExpandRecordColumn(#"Extracted", "Column1",
        {"Timestamp", "Open", "High", "Low", "Close"},
        {"Timestamp", "Open", "High", "Low", "Close"}),
    #"Added Date" = Table.AddColumn(#"To Records", "Date",
        each #datetime(1970, 1, 1, 0, 0, 0) + #duration(0, 0, 0, [Timestamp] / 1000),
        type datetime)
in
    #"Added Date"`,

  // Coin details
  coin: (coinId: string = 'bitcoin') => `let
    ApiKey = ${API_KEY_M},
    Source = Json.Document(Web.Contents("${CG_API}/coins/${coinId}", [
        Query = [localization = "false", tickers = "false", market_data = "true", community_data = "false", developer_data = "false", x_cg_demo_api_key = ApiKey]
    ])),
    MD = Source[market_data],
    Result = #table(
        {"Metric", "Value"},
        {
            {"Name", Source[name]},
            {"Symbol", Text.Upper(Source[symbol])},
            {"Rank", Source[market_cap_rank]},
            {"Price (USD)", Record.FieldOrDefault(MD[current_price], "usd", 0)},
            {"Market Cap", Record.FieldOrDefault(MD[market_cap], "usd", 0)},
            {"24h Volume", Record.FieldOrDefault(MD[total_volume], "usd", 0)},
            {"24h Change %", MD[price_change_percentage_24h]},
            {"7d Change %", MD[price_change_percentage_7d]},
            {"30d Change %", MD[price_change_percentage_30d]},
            {"ATH", Record.FieldOrDefault(MD[ath], "usd", 0)},
            {"ATH Change %", Record.FieldOrDefault(MD[ath_change_percentage], "usd", 0)},
            {"Circulating Supply", MD[circulating_supply]},
            {"Total Supply", MD[total_supply]},
            {"Max Supply", MD[max_supply]}
        }
    )
in
    Result`,

  // Trending coins
  trending: () => `let
    ApiKey = ${API_KEY_M},
    Source = Json.Document(Web.Contents("${CG_API}/search/trending", [
        Query = [x_cg_demo_api_key = ApiKey]
    ])),
    Coins = Source[coins],
    #"To Table" = Table.FromList(Coins, Splitter.SplitByNothing(), null, null, ExtraValues.Error),
    #"Expand Item" = Table.ExpandRecordColumn(#"To Table", "Column1", {"item"}, {"item"}),
    #"Expand Fields" = Table.ExpandRecordColumn(#"Expand Item", "item",
        {"id", "name", "symbol", "market_cap_rank", "score"},
        {"ID", "Name", "Symbol", "MarketCapRank", "Score"})
in
    #"Expand Fields"`,

  // Multiple coins watchlist
  watchlist: (coins: string[]) => `let
    ApiKey = ${API_KEY_M},
    CoinIds = "${coins.join(',')}",
    Source = Json.Document(Web.Contents("${CG_API}/coins/markets", [
        Query = [vs_currency = "usd", ids = CoinIds, order = "market_cap_desc", sparkline = "false", price_change_percentage = "24h,7d,30d", x_cg_demo_api_key = ApiKey]
    ])),
    #"To Table" = Table.FromList(Source, Splitter.SplitByNothing(), null, null, ExtraValues.Error),
    #"Expanded" = Table.ExpandRecordColumn(#"To Table", "Column1",
        {"id", "name", "symbol", "market_cap_rank", "current_price", "market_cap", "total_volume",
         "price_change_percentage_24h", "price_change_percentage_7d_in_currency", "price_change_percentage_30d_in_currency"},
        {"ID", "Name", "Symbol", "Rank", "Price", "MarketCap", "Volume24h", "Change24h", "Change7d", "Change30d"})
in
    #"Expanded"`,

  // Gainers and Losers (top 250 sorted by 24h change)
  gainersLosers: () => `let
    ApiKey = ${API_KEY_M},
    Source = Json.Document(Web.Contents("${CG_API}/coins/markets", [
        Query = [vs_currency = "usd", order = "market_cap_desc", per_page = "250", page = "1", sparkline = "false", price_change_percentage = "24h", x_cg_demo_api_key = ApiKey]
    ])),
    #"To Table" = Table.FromList(Source, Splitter.SplitByNothing(), null, null, ExtraValues.Error),
    #"Expanded" = Table.ExpandRecordColumn(#"To Table", "Column1",
        {"market_cap_rank", "name", "symbol", "current_price", "price_change_percentage_24h"},
        {"Rank", "Name", "Symbol", "Price", "Change24h"}),
    #"Sorted" = Table.Sort(#"Expanded", {{"Change24h", Order.Descending}})
in
    #"Sorted"`,

  // Exchanges
  exchanges: () => `let
    ApiKey = ${API_KEY_M},
    Source = Json.Document(Web.Contents("${CG_API}/exchanges", [
        Query = [per_page = "50", x_cg_demo_api_key = ApiKey]
    ])),
    #"To Table" = Table.FromList(Source, Splitter.SplitByNothing(), null, null, ExtraValues.Error),
    #"Expanded" = Table.ExpandRecordColumn(#"To Table", "Column1",
        {"trust_score_rank", "name", "trust_score", "trade_volume_24h_btc", "year_established", "country"},
        {"Rank", "Name", "TrustScore", "Volume24hBTC", "Year", "Country"})
in
    #"Expanded"`,

  // OHLC technical data (use Excel formulas for SMA/EMA/RSI on top)
  technical: (coin: string = 'bitcoin', days: number = 30) => `let
    ApiKey = ${API_KEY_M},
    Source = Json.Document(Web.Contents("${CG_API}/coins/${coin}/ohlc", [
        Query = [vs_currency = "usd", days = "${days}", x_cg_demo_api_key = ApiKey]
    ])),
    #"To Table" = Table.FromList(Source, Splitter.SplitByNothing(), null, null, ExtraValues.Error),
    #"Extracted" = Table.TransformColumns(#"To Table", {{"Column1", each
        [Timestamp = _{0}, Open = _{1}, High = _{2}, Low = _{3}, Close = _{4}]}}),
    #"To Records" = Table.ExpandRecordColumn(#"Extracted", "Column1",
        {"Timestamp", "Open", "High", "Low", "Close"},
        {"Timestamp", "Open", "High", "Low", "Close"}),
    #"Added Date" = Table.AddColumn(#"To Records", "Date",
        each #datetime(1970, 1, 1, 0, 0, 0) + #duration(0, 0, 0, [Timestamp] / 1000),
        type datetime),
    #"Coin Name" = Table.AddColumn(#"Added Date", "Coin", each "${coin}", type text)
in
    #"Coin Name"`,

  // Top gainers
  gainers: (limit: number = 20) => `let
    ApiKey = ${API_KEY_M},
    Source = Json.Document(Web.Contents("${CG_API}/coins/markets", [
        Query = [vs_currency = "usd", order = "market_cap_desc", per_page = "250", page = "1", sparkline = "false", price_change_percentage = "24h", x_cg_demo_api_key = ApiKey]
    ])),
    #"To Table" = Table.FromList(Source, Splitter.SplitByNothing(), null, null, ExtraValues.Error),
    #"Expanded" = Table.ExpandRecordColumn(#"To Table", "Column1",
        {"market_cap_rank", "id", "name", "symbol", "current_price", "price_change_percentage_24h", "total_volume", "market_cap"},
        {"Rank", "ID", "Name", "Symbol", "Price", "Change24h", "Volume24h", "MarketCap"}),
    #"Sorted" = Table.Sort(#"Expanded", {{"Change24h", Order.Descending}}),
    #"Top" = Table.FirstN(#"Sorted", ${limit})
in
    #"Top"`,

  // Top losers
  losers: (limit: number = 20) => `let
    ApiKey = ${API_KEY_M},
    Source = Json.Document(Web.Contents("${CG_API}/coins/markets", [
        Query = [vs_currency = "usd", order = "market_cap_desc", per_page = "250", page = "1", sparkline = "false", price_change_percentage = "24h", x_cg_demo_api_key = ApiKey]
    ])),
    #"To Table" = Table.FromList(Source, Splitter.SplitByNothing(), null, null, ExtraValues.Error),
    #"Expanded" = Table.ExpandRecordColumn(#"To Table", "Column1",
        {"market_cap_rank", "id", "name", "symbol", "current_price", "price_change_percentage_24h", "total_volume", "market_cap"},
        {"Rank", "ID", "Name", "Symbol", "Price", "Change24h", "Volume24h", "MarketCap"}),
    #"Sorted" = Table.Sort(#"Expanded", {{"Change24h", Order.Ascending}}),
    #"Bottom" = Table.FirstN(#"Sorted", ${limit})
in
    #"Bottom"`,

  // DeFi protocols (CoinGecko DeFi category)
  defi: (limit: number = 20) => `let
    ApiKey = ${API_KEY_M},
    Source = Json.Document(Web.Contents("${CG_API}/coins/markets", [
        Query = [vs_currency = "usd", category = "decentralized-finance-defi", order = "market_cap_desc", per_page = "${limit}", page = "1", sparkline = "false", x_cg_demo_api_key = ApiKey]
    ])),
    #"To Table" = Table.FromList(Source, Splitter.SplitByNothing(), null, null, ExtraValues.Error),
    #"Expanded" = Table.ExpandRecordColumn(#"To Table", "Column1",
        {"market_cap_rank", "name", "symbol", "current_price", "market_cap", "total_volume", "price_change_percentage_24h"},
        {"Rank", "Name", "Symbol", "Price", "MarketCap", "Volume24h", "Change24h"})
in
    #"Expanded"`,

  // Derivatives / futures
  derivatives: (limit: number = 50) => `let
    ApiKey = ${API_KEY_M},
    Source = Json.Document(Web.Contents("${CG_API}/derivatives", [
        Query = [x_cg_demo_api_key = ApiKey]
    ])),
    Limited = List.FirstN(Source, ${limit}),
    #"To Table" = Table.FromList(Limited, Splitter.SplitByNothing(), null, null, ExtraValues.Error),
    #"Expanded" = Table.ExpandRecordColumn(#"To Table", "Column1",
        {"market", "symbol", "price", "price_percentage_change_24h", "funding_rate", "open_interest", "volume_24h"},
        {"Market", "Symbol", "Price", "PriceChange24h", "FundingRate", "OpenInterest", "Volume24h"})
in
    #"Expanded"`,

  // Stablecoins
  stablecoins: (limit: number = 20) => `let
    ApiKey = ${API_KEY_M},
    Source = Json.Document(Web.Contents("${CG_API}/coins/markets", [
        Query = [vs_currency = "usd", category = "stablecoins", order = "market_cap_desc", per_page = "${limit}", page = "1", sparkline = "false", x_cg_demo_api_key = ApiKey]
    ])),
    #"To Table" = Table.FromList(Source, Splitter.SplitByNothing(), null, null, ExtraValues.Error),
    #"Expanded" = Table.ExpandRecordColumn(#"To Table", "Column1",
        {"market_cap_rank", "name", "symbol", "current_price", "market_cap", "total_volume", "circulating_supply"},
        {"Rank", "Name", "Symbol", "Price", "MarketCap", "Volume24h", "CirculatingSupply"}),
    #"Added PegDeviation" = Table.AddColumn(#"Expanded", "PegDeviation", each [Price] - 1, type number)
in
    #"Added PegDeviation"`,

  // Batch prices
  batch: (coins: string = 'bitcoin,ethereum,solana') => `let
    ApiKey = ${API_KEY_M},
    Source = Json.Document(Web.Contents("${CG_API}/simple/price", [
        Query = [ids = "${coins}", vs_currencies = "usd", include_market_cap = "true", include_24hr_vol = "true", include_24hr_change = "true", x_cg_demo_api_key = ApiKey]
    ])),
    Fields = Record.FieldNames(Source),
    #"To Table" = Table.FromList(Fields, Splitter.SplitByNothing(), {"ID"}, null, ExtraValues.Error),
    #"Added Price" = Table.AddColumn(#"To Table", "Price", each Record.FieldOrDefault(Record.Field(Source, [ID]), "usd", 0), type number),
    #"Added MCap" = Table.AddColumn(#"Added Price", "MarketCap", each Record.FieldOrDefault(Record.Field(Source, [ID]), "usd_market_cap", 0), type number),
    #"Added Vol" = Table.AddColumn(#"Added MCap", "Volume24h", each Record.FieldOrDefault(Record.Field(Source, [ID]), "usd_24h_vol", 0), type number),
    #"Added Change" = Table.AddColumn(#"Added Vol", "Change24h", each Record.FieldOrDefault(Record.Field(Source, [ID]), "usd_24h_change", 0), type number)
in
    #"Added Change"`,

  // Search
  search: (query: string = 'bitcoin') => `let
    ApiKey = ${API_KEY_M},
    Source = Json.Document(Web.Contents("${CG_API}/search", [
        Query = [query = "${query}", x_cg_demo_api_key = ApiKey]
    ])),
    Coins = Source[coins],
    #"To Table" = Table.FromList(Coins, Splitter.SplitByNothing(), null, null, ExtraValues.Error),
    #"Expanded" = Table.ExpandRecordColumn(#"To Table", "Column1",
        {"id", "name", "symbol", "market_cap_rank"},
        {"ID", "Name", "Symbol", "MarketCapRank"})
in
    #"Expanded"`,

  // NFT collections
  nfts: (limit: number = 50) => `let
    ApiKey = ${API_KEY_M},
    Source = Json.Document(Web.Contents("${CG_API}/nfts/list", [
        Query = [per_page = "${limit}", x_cg_demo_api_key = ApiKey]
    ])),
    #"To Table" = Table.FromList(Source, Splitter.SplitByNothing(), null, null, ExtraValues.Error),
    #"Expanded" = Table.ExpandRecordColumn(#"To Table", "Column1",
        {"id", "name", "symbol", "contract_address", "asset_platform_id"},
        {"ID", "Name", "Symbol", "ContractAddress", "Platform"})
in
    #"Expanded"`,

  // Categories
  categories: (categoryId?: string, limit: number = 50) => categoryId ?
    `let
    ApiKey = ${API_KEY_M},
    Source = Json.Document(Web.Contents("${CG_API}/coins/markets", [
        Query = [vs_currency = "usd", category = "${categoryId}", order = "market_cap_desc", per_page = "${limit}", page = "1", sparkline = "false", price_change_percentage = "24h", x_cg_demo_api_key = ApiKey]
    ])),
    #"To Table" = Table.FromList(Source, Splitter.SplitByNothing(), null, null, ExtraValues.Error),
    #"Expanded" = Table.ExpandRecordColumn(#"To Table", "Column1",
        {"market_cap_rank", "id", "name", "symbol", "current_price", "market_cap", "total_volume", "price_change_percentage_24h"},
        {"Rank", "ID", "Name", "Symbol", "Price", "MarketCap", "Volume24h", "Change24h"})
in
    #"Expanded"` :
    `let
    ApiKey = ${API_KEY_M},
    Source = Json.Document(Web.Contents("${CG_API}/coins/categories", [
        Query = [x_cg_demo_api_key = ApiKey]
    ])),
    Limited = List.FirstN(Source, ${limit}),
    #"To Table" = Table.FromList(Limited, Splitter.SplitByNothing(), null, null, ExtraValues.Error),
    #"Expanded" = Table.ExpandRecordColumn(#"To Table", "Column1",
        {"id", "name", "market_cap", "market_cap_change_24h", "volume_24h"},
        {"ID", "Name", "MarketCap", "MarketCapChange24h", "Volume24h"}),
    #"Added Rank" = Table.AddIndexColumn(#"Expanded", "Rank", 1, 1, Int64.Type)
in
    #"Added Rank"`,

  // Companies holding crypto
  companies: (coin: string = 'bitcoin') => `let
    ApiKey = ${API_KEY_M},
    Source = Json.Document(Web.Contents("${CG_API}/companies/public_treasury/${coin}", [
        Query = [x_cg_demo_api_key = ApiKey]
    ])),
    Companies = Source[companies],
    #"To Table" = Table.FromList(Companies, Splitter.SplitByNothing(), null, null, ExtraValues.Error),
    #"Expanded" = Table.ExpandRecordColumn(#"To Table", "Column1",
        {"name", "symbol", "country", "total_holdings", "total_entry_value_usd", "total_current_value_usd", "percentage_of_total_supply"},
        {"Name", "Symbol", "Country", "TotalHoldings", "TotalEntryValueUSD", "TotalCurrentValueUSD", "PercentOfTotalSupply"}),
    #"Added Rank" = Table.AddIndexColumn(#"Expanded", "Rank", 1, 1, Int64.Type)
in
    #"Added Rank"`,

  // Wallet balance (Etherscan - needs separate explorer API key)
  wallet: (address: string, chain: string = 'ethereum') => `let
    // Wallet tracking requires a block explorer API key
    // Get a free key at etherscan.io and paste it below
    ExplorerKey = "YOUR_ETHERSCAN_API_KEY",
    ChainUrl = if "${chain}" = "ethereum" then "https://api.etherscan.io/api"
               else if "${chain}" = "bsc" then "https://api.bscscan.com/api"
               else "https://api.polygonscan.com/api",
    Source = Json.Document(Web.Contents(ChainUrl, [
        Query = [module = "account", action = "balance", address = "${address}", tag = "latest", apikey = ExplorerKey]
    ])),
    Balance = Number.FromText(Source[result]) / 1000000000000000000,
    Result = #table(
        {"Chain", "Address", "Balance"},
        {{"${chain}", "${address}", Balance}}
    )
in
    Result`,
};

// ============================================
// REFRESH CONFIGURATIONS
// ============================================

export interface RefreshConfig {
  intervalMinutes: number;
  refreshOnOpen: boolean;
  backgroundRefresh: boolean;
}

export const REFRESH_PRESETS: Record<string, RefreshConfig> = {
  realtime: {
    intervalMinutes: 5,
    refreshOnOpen: true,
    backgroundRefresh: true,
  },
  frequent: {
    intervalMinutes: 15,
    refreshOnOpen: true,
    backgroundRefresh: true,
  },
  hourly: {
    intervalMinutes: 60,
    refreshOnOpen: true,
    backgroundRefresh: true,
  },
  daily: {
    intervalMinutes: 1440,
    refreshOnOpen: true,
    backgroundRefresh: false,
  },
  manual: {
    intervalMinutes: 0,
    refreshOnOpen: false,
    backgroundRefresh: false,
  },
};

// ============================================
// POWER QUERY SHEET GENERATOR
// ============================================

import ExcelJS from 'exceljs';

/**
 * Adds a Power Query setup sheet with instructions.
 * Power Query connections are now embedded directly in the xlsx file
 * via powerQueryInjector.ts, so this sheet just explains how to use them.
 */
export function addPowerQuerySetupSheet(
  workbook: ExcelJS.Workbook,
  queries: { name: string; code: string; description: string }[],
  refreshConfig: RefreshConfig = REFRESH_PRESETS.hourly
): void {
  const sheet = workbook.addWorksheet('Power Query Setup', {
    properties: { tabColor: { argb: 'FF8B5CF6' } },
  });

  // Column widths
  sheet.getColumn('A').width = 3;
  sheet.getColumn('B').width = 40;
  sheet.getColumn('C').width = 60;

  // Header
  sheet.mergeCells('B2:C2');
  const header = sheet.getCell('B2');
  header.value = 'POWER QUERY LIVE DATA — READY TO USE';
  header.font = { bold: true, size: 18, color: { argb: 'FFFFFFFF' } };
  header.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF8B5CF6' } };
  header.alignment = { horizontal: 'center', vertical: 'middle' };
  sheet.getRow(2).height = 45;

  // BYOK notice
  sheet.mergeCells('B3:C3');
  const byokNotice = sheet.getCell('B3');
  byokNotice.value = 'BYOK: Your API key stays in this file. Queries connect directly to CoinGecko. Our server never sees your key or data.';
  byokNotice.font = { bold: true, size: 10, color: { argb: 'FF059669' } };
  byokNotice.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF0FDF4' } };

  // Instructions - much simpler now that queries are embedded
  const instructions = [
    'HOW TO GET LIVE DATA (3 steps):',
    '',
    '1. Go to the Settings sheet → paste your CoinGecko API key in cell B6',
    '2. Go to the Data tab in the Excel ribbon',
    '3. Click "Refresh All" (or press Ctrl+Alt+F5)',
    '',
    'That\'s it! Data will populate automatically.',
    '',
    'FIRST TIME PRIVACY PROMPT:',
    '   Excel may ask about Privacy Levels. Choose "Public" for all sources.',
    '   OR: File > Options > Query Options > Privacy > "Always ignore Privacy Level settings"',
    '',
    'REFRESH SETTINGS:',
    `   Refresh interval: ${refreshConfig.intervalMinutes > 0 ? refreshConfig.intervalMinutes + ' minutes' : 'Manual only'}`,
    `   Refresh on file open: ${refreshConfig.refreshOnOpen ? 'Yes' : 'No'}`,
    '   To change: Right-click any data table > Table > External Data Properties',
    '',
    'GET A FREE API KEY:',
    '   Visit coingecko.com/en/api/pricing',
    '   Free tier: 10,000 calls/month (plenty for personal use)',
  ];

  instructions.forEach((text, i) => {
    const cell = sheet.getCell(`B${5 + i}`);
    cell.value = text;
    if (text.endsWith(':') && !text.startsWith(' ')) {
      cell.font = { bold: true, color: { argb: 'FF8B5CF6' } };
    } else {
      cell.font = { color: { argb: 'FF6B7280' } };
    }
  });

  // List embedded queries
  let currentRow = 5 + instructions.length + 2;
  sheet.getCell(`B${currentRow}`).value = 'EMBEDDED QUERIES (Data > Queries & Connections):';
  sheet.getCell(`B${currentRow}`).font = { bold: true, color: { argb: 'FF8B5CF6' } };
  currentRow += 1;

  queries.forEach((query, index) => {
    const nameCell = sheet.getCell(`B${currentRow}`);
    nameCell.value = `  ${index + 1}. ${query.name}`;
    nameCell.font = { bold: true, size: 11, color: { argb: 'FF059669' } };

    const descCell = sheet.getCell(`C${currentRow}`);
    descCell.value = query.description;
    descCell.font = { italic: true, color: { argb: 'FF9CA3AF' } };

    currentRow += 1;
  });

  // Footer
  currentRow += 1;
  sheet.getCell(`B${currentRow}`).value = 'NEED HELP?';
  sheet.getCell(`B${currentRow}`).font = { bold: true };
  sheet.getCell(`C${currentRow}`).value = 'https://cryptoreportkit.com/learn';
  sheet.getCell(`C${currentRow}`).font = { color: { argb: 'FF3B82F6' }, underline: true };
}

/**
 * Generates all Power Query codes for a dashboard type.
 * All queries use DIRECT CoinGecko API calls with user's own key.
 */
export function generateQueriesForDashboard(
  dashboardType: string,
  coins: string[] = ['bitcoin', 'ethereum', 'solana']
): { name: string; code: string; description: string }[] {
  const queries: { name: string; code: string; description: string }[] = [];

  // Always include market data
  queries.push({
    name: 'CRK_Market',
    code: POWER_QUERY_TEMPLATES.market(100),
    description: 'Top 100 cryptocurrencies with price, market cap, and volume (direct from CoinGecko)',
  });

  // Add based on dashboard type
  switch (dashboardType) {
    case 'market-overview':
      queries.push({
        name: 'CRK_Global',
        code: POWER_QUERY_TEMPLATES.global(),
        description: 'Global crypto market statistics',
      });
      queries.push({
        name: 'CRK_Trending',
        code: POWER_QUERY_TEMPLATES.trending(),
        description: 'Currently trending cryptocurrencies',
      });
      queries.push({
        name: 'CRK_FearGreed',
        code: POWER_QUERY_TEMPLATES.fearGreed(30),
        description: 'Fear & Greed Index (30-day history)',
      });
      break;

    case 'complete-suite':
      queries.push({
        name: 'CRK_Global',
        code: POWER_QUERY_TEMPLATES.global(),
        description: 'Global crypto market statistics',
      });
      queries.push({
        name: 'CRK_Trending',
        code: POWER_QUERY_TEMPLATES.trending(),
        description: 'Currently trending cryptocurrencies',
      });
      queries.push({
        name: 'CRK_FearGreed',
        code: POWER_QUERY_TEMPLATES.fearGreed(30),
        description: 'Fear & Greed Index (30-day history)',
      });
      queries.push({
        name: 'CRK_Gainers',
        code: POWER_QUERY_TEMPLATES.gainers(20),
        description: 'Top 20 gainers by 24h change',
      });
      queries.push({
        name: 'CRK_Losers',
        code: POWER_QUERY_TEMPLATES.losers(20),
        description: 'Top 20 losers by 24h change',
      });
      queries.push({
        name: 'CRK_DeFi',
        code: POWER_QUERY_TEMPLATES.defi(20),
        description: 'Top 20 DeFi protocols by market cap',
      });
      queries.push({
        name: 'CRK_Exchanges',
        code: POWER_QUERY_TEMPLATES.exchanges(),
        description: 'Top cryptocurrency exchanges',
      });
      queries.push({
        name: 'CRK_Stablecoins',
        code: POWER_QUERY_TEMPLATES.stablecoins(10),
        description: 'Top stablecoins with peg deviation',
      });
      break;

    case 'fear-greed':
      queries.push({
        name: 'CRK_FearGreed',
        code: POWER_QUERY_TEMPLATES.fearGreed(90),
        description: 'Fear & Greed Index with 90-day history',
      });
      break;

    case 'technical-analysis':
      queries.push({
        name: 'CRK_BTC_OHLC',
        code: POWER_QUERY_TEMPLATES.ohlc('bitcoin', 30),
        description: 'Bitcoin OHLC candlestick data (30 days)',
      });
      queries.push({
        name: 'CRK_BTC_Technical',
        code: POWER_QUERY_TEMPLATES.technical('bitcoin', 30),
        description: 'Bitcoin OHLC data for technical analysis (add SMA/EMA/RSI with Excel formulas)',
      });
      queries.push({
        name: 'CRK_ETH_Technical',
        code: POWER_QUERY_TEMPLATES.technical('ethereum', 30),
        description: 'Ethereum OHLC data for technical analysis',
      });
      break;

    case 'bitcoin-dashboard':
      queries.push({
        name: 'CRK_BTC_OHLC',
        code: POWER_QUERY_TEMPLATES.ohlc('bitcoin', 30),
        description: 'Bitcoin OHLC candlestick data (30 days)',
      });
      queries.push({
        name: 'CRK_Bitcoin',
        code: POWER_QUERY_TEMPLATES.coin('bitcoin'),
        description: 'Bitcoin detailed information',
      });
      queries.push({
        name: 'CRK_BTC_Technical',
        code: POWER_QUERY_TEMPLATES.technical('bitcoin', 30),
        description: 'Bitcoin OHLC for technical analysis',
      });
      break;

    case 'ethereum-dashboard':
      queries.push({
        name: 'CRK_ETH_OHLC',
        code: POWER_QUERY_TEMPLATES.ohlc('ethereum', 30),
        description: 'Ethereum OHLC candlestick data (30 days)',
      });
      queries.push({
        name: 'CRK_Ethereum',
        code: POWER_QUERY_TEMPLATES.coin('ethereum'),
        description: 'Ethereum detailed information',
      });
      break;

    case 'portfolio-tracker':
    case 'custom':
      queries.push({
        name: 'CRK_Watchlist',
        code: POWER_QUERY_TEMPLATES.watchlist(coins),
        description: `Your custom watchlist: ${coins.join(', ')}`,
      });
      break;

    case 'exchanges':
      queries.push({
        name: 'CRK_Exchanges',
        code: POWER_QUERY_TEMPLATES.exchanges(),
        description: 'Top cryptocurrency exchanges',
      });
      break;

    case 'gainers-losers':
      queries.push({
        name: 'CRK_Gainers',
        code: POWER_QUERY_TEMPLATES.gainers(20),
        description: 'Top 20 gaining cryptocurrencies by 24h change',
      });
      queries.push({
        name: 'CRK_Losers',
        code: POWER_QUERY_TEMPLATES.losers(20),
        description: 'Top 20 losing cryptocurrencies by 24h change',
      });
      break;

    case 'defi-dashboard':
      queries.push({
        name: 'CRK_DeFi',
        code: POWER_QUERY_TEMPLATES.defi(50),
        description: 'Top 50 DeFi protocols by market cap',
      });
      break;

    case 'derivatives':
      queries.push({
        name: 'CRK_Derivatives',
        code: POWER_QUERY_TEMPLATES.derivatives(50),
        description: 'Futures & derivatives with funding rates and open interest',
      });
      break;

    case 'stablecoins':
      queries.push({
        name: 'CRK_Stablecoins',
        code: POWER_QUERY_TEMPLATES.stablecoins(20),
        description: 'Stablecoin market data with peg deviation tracking',
      });
      break;

    case 'nft-tracker':
      queries.push({
        name: 'CRK_NFTs',
        code: POWER_QUERY_TEMPLATES.nfts(50),
        description: 'NFT collections with contract addresses and platforms',
      });
      break;

    case 'categories':
      queries.push({
        name: 'CRK_Categories',
        code: POWER_QUERY_TEMPLATES.categories(undefined, 50),
        description: 'All crypto categories with market cap and volume',
      });
      break;

    case 'trending':
      queries.push({
        name: 'CRK_Trending',
        code: POWER_QUERY_TEMPLATES.trending(),
        description: 'Currently trending cryptocurrencies',
      });
      break;

    case 'heatmap':
    case 'screener':
      // Market query already covers these
      break;

    case 'correlation':
      queries.push({
        name: 'CRK_Watchlist',
        code: POWER_QUERY_TEMPLATES.watchlist(coins.slice(0, 20)),
        description: 'Coins for correlation analysis',
      });
      break;

    case 'wallet-tracker':
      queries.push({
        name: 'CRK_Wallet',
        code: POWER_QUERY_TEMPLATES.wallet('YOUR_WALLET_ADDRESS', 'ethereum'),
        description: 'Wallet balance tracker - replace YOUR_WALLET_ADDRESS with your address',
      });
      break;

    case 'whale-tracker':
      queries.push({
        name: 'CRK_WhaleCoins',
        code: POWER_QUERY_TEMPLATES.market(50),
        description: 'Top 50 coins by market cap (whale-watched assets)',
      });
      queries.push({
        name: 'CRK_Companies',
        code: POWER_QUERY_TEMPLATES.companies('bitcoin'),
        description: 'Public companies holding Bitcoin (whale tracker)',
      });
      break;

    case 'on-chain':
      queries.push({
        name: 'CRK_Bitcoin_OnChain',
        code: POWER_QUERY_TEMPLATES.coin('bitcoin'),
        description: 'Bitcoin on-chain metrics (supply, ATH, market data)',
      });
      queries.push({
        name: 'CRK_Ethereum_OnChain',
        code: POWER_QUERY_TEMPLATES.coin('ethereum'),
        description: 'Ethereum on-chain metrics',
      });
      queries.push({
        name: 'CRK_Global',
        code: POWER_QUERY_TEMPLATES.global(),
        description: 'Global crypto market statistics',
      });
      break;

    case 'etf-tracker':
      queries.push({
        name: 'CRK_BTC_Companies',
        code: POWER_QUERY_TEMPLATES.companies('bitcoin'),
        description: 'Public companies/ETFs holding Bitcoin',
      });
      queries.push({
        name: 'CRK_ETH_Companies',
        code: POWER_QUERY_TEMPLATES.companies('ethereum'),
        description: 'Public companies/ETFs holding Ethereum',
      });
      queries.push({
        name: 'CRK_BTC_Price',
        code: POWER_QUERY_TEMPLATES.coin('bitcoin'),
        description: 'Bitcoin price and market data',
      });
      break;

    case 'layer1-compare':
      queries.push({
        name: 'CRK_L1_Coins',
        code: POWER_QUERY_TEMPLATES.watchlist([
          'bitcoin', 'ethereum', 'solana', 'cardano', 'avalanche-2',
          'polkadot', 'near', 'cosmos', 'aptos', 'sui',
          'the-open-network', 'tron', 'algorand', 'fantom', 'hedera-hashgraph',
        ]),
        description: 'Top Layer 1 blockchains side-by-side comparison',
      });
      break;

    case 'layer2-compare':
      queries.push({
        name: 'CRK_L2_Coins',
        code: POWER_QUERY_TEMPLATES.categories('layer-2', 50),
        description: 'Layer 2 scaling solutions (Arbitrum, Optimism, Polygon, etc.)',
      });
      break;

    case 'meme-coins':
      queries.push({
        name: 'CRK_MemeCoins',
        code: POWER_QUERY_TEMPLATES.categories('meme-token', 50),
        description: 'Top 50 meme coins by market cap',
      });
      queries.push({
        name: 'CRK_Trending',
        code: POWER_QUERY_TEMPLATES.trending(),
        description: 'Currently trending coins (often memes)',
      });
      break;

    case 'ai-gaming':
      queries.push({
        name: 'CRK_AI_Tokens',
        code: POWER_QUERY_TEMPLATES.categories('artificial-intelligence', 30),
        description: 'Top AI tokens by market cap',
      });
      queries.push({
        name: 'CRK_Gaming_Tokens',
        code: POWER_QUERY_TEMPLATES.categories('gaming', 30),
        description: 'Top gaming/GameFi tokens by market cap',
      });
      break;

    case 'calculator':
      queries.push({
        name: 'CRK_BTC_OHLC',
        code: POWER_QUERY_TEMPLATES.ohlc('bitcoin', 365),
        description: 'Bitcoin 1-year OHLC data for DCA/profit calculations',
      });
      queries.push({
        name: 'CRK_TopCoins',
        code: POWER_QUERY_TEMPLATES.batch('bitcoin,ethereum,solana,cardano,polkadot'),
        description: 'Current prices for investment calculators',
      });
      break;

    case 'volatility':
      queries.push({
        name: 'CRK_BTC_OHLC',
        code: POWER_QUERY_TEMPLATES.ohlc('bitcoin', 90),
        description: 'Bitcoin 90-day OHLC for volatility analysis',
      });
      queries.push({
        name: 'CRK_ETH_OHLC',
        code: POWER_QUERY_TEMPLATES.ohlc('ethereum', 90),
        description: 'Ethereum 90-day OHLC for volatility analysis',
      });
      queries.push({
        name: 'CRK_SOL_OHLC',
        code: POWER_QUERY_TEMPLATES.ohlc('solana', 90),
        description: 'Solana 90-day OHLC for volatility analysis',
      });
      break;

    case 'rwa':
      queries.push({
        name: 'CRK_RWA_Tokens',
        code: POWER_QUERY_TEMPLATES.categories('real-world-assets-rwa', 50),
        description: 'Real World Asset tokens by market cap',
      });
      break;

    case 'liquidations':
      queries.push({
        name: 'CRK_Derivatives',
        code: POWER_QUERY_TEMPLATES.derivatives(50),
        description: 'Derivatives data with open interest and funding rates',
      });
      queries.push({
        name: 'CRK_BTC_OHLC',
        code: POWER_QUERY_TEMPLATES.ohlc('bitcoin', 30),
        description: 'Bitcoin 30-day OHLC for liquidation zone analysis',
      });
      break;

    case 'funding-rates':
      queries.push({
        name: 'CRK_Derivatives',
        code: POWER_QUERY_TEMPLATES.derivatives(100),
        description: 'Perpetual futures with funding rates and open interest',
      });
      break;

    case 'altcoin-season':
      queries.push({
        name: 'CRK_AltSeason',
        code: POWER_QUERY_TEMPLATES.market(100),
        description: 'Top 100 coins — compare altcoin vs BTC performance',
      });
      queries.push({
        name: 'CRK_Global',
        code: POWER_QUERY_TEMPLATES.global(),
        description: 'Global stats with BTC dominance for alt season index',
      });
      break;

    case 'token-unlocks':
      queries.push({
        name: 'CRK_UnlockCoins',
        code: POWER_QUERY_TEMPLATES.watchlist([
          'arbitrum', 'optimism', 'aptos', 'sui', 'celestia',
          'sei-network', 'worldcoin-wld', 'starknet', 'layerzero', 'jito-governance-token',
        ]),
        description: 'Tokens with upcoming unlock events',
      });
      queries.push({
        name: 'CRK_Global',
        code: POWER_QUERY_TEMPLATES.global(),
        description: 'Global market context for unlock impact',
      });
      break;

    case 'staking-yields':
      queries.push({
        name: 'CRK_StakingCoins',
        code: POWER_QUERY_TEMPLATES.categories('proof-of-stake', 50),
        description: 'Proof-of-Stake coins for staking yield comparison',
      });
      break;

    case 'social-sentiment':
      queries.push({
        name: 'CRK_Trending',
        code: POWER_QUERY_TEMPLATES.trending(),
        description: 'Currently trending coins (social signal)',
      });
      queries.push({
        name: 'CRK_FearGreed',
        code: POWER_QUERY_TEMPLATES.fearGreed(30),
        description: 'Fear & Greed sentiment index (30-day)',
      });
      queries.push({
        name: 'CRK_TopMovers',
        code: POWER_QUERY_TEMPLATES.gainers(20),
        description: 'Top gainers (social momentum indicator)',
      });
      break;

    case 'dev-activity':
      queries.push({
        name: 'CRK_DevCoins',
        code: POWER_QUERY_TEMPLATES.watchlist([
          'ethereum', 'polkadot', 'cardano', 'solana', 'cosmos',
          'near', 'internet-computer', 'chainlink', 'filecoin', 'aptos',
        ]),
        description: 'Top developer-active projects by market data',
      });
      queries.push({
        name: 'CRK_ETH_Detail',
        code: POWER_QUERY_TEMPLATES.coin('ethereum'),
        description: 'Ethereum detailed info (developer data reference)',
      });
      break;

    case 'exchange-reserves':
      queries.push({
        name: 'CRK_Exchanges',
        code: POWER_QUERY_TEMPLATES.exchanges(),
        description: 'Exchange volumes and trust scores',
      });
      queries.push({
        name: 'CRK_BTC_Detail',
        code: POWER_QUERY_TEMPLATES.coin('bitcoin'),
        description: 'Bitcoin supply data (circulating vs total)',
      });
      break;

    case 'defi-yields':
      queries.push({
        name: 'CRK_DeFi',
        code: POWER_QUERY_TEMPLATES.defi(50),
        description: 'Top 50 DeFi protocols for yield analysis',
      });
      queries.push({
        name: 'CRK_Stablecoins',
        code: POWER_QUERY_TEMPLATES.stablecoins(10),
        description: 'Top stablecoins (yield farming base pairs)',
      });
      break;

    case 'metaverse':
      queries.push({
        name: 'CRK_MetaverseTokens',
        code: POWER_QUERY_TEMPLATES.categories('metaverse', 50),
        description: 'Metaverse and virtual world tokens',
      });
      break;

    case 'privacy-coins':
      queries.push({
        name: 'CRK_PrivacyCoins',
        code: POWER_QUERY_TEMPLATES.categories('privacy-coins', 30),
        description: 'Privacy-focused cryptocurrencies',
      });
      break;

    case 'mining-calc':
      queries.push({
        name: 'CRK_BTC_Detail',
        code: POWER_QUERY_TEMPLATES.coin('bitcoin'),
        description: 'Bitcoin details (hash rate, supply, difficulty reference)',
      });
      queries.push({
        name: 'CRK_BTC_OHLC',
        code: POWER_QUERY_TEMPLATES.ohlc('bitcoin', 90),
        description: 'Bitcoin 90-day OHLC for profitability analysis',
      });
      queries.push({
        name: 'CRK_PoW_Coins',
        code: POWER_QUERY_TEMPLATES.categories('proof-of-work', 20),
        description: 'Proof-of-Work mineable coins',
      });
      break;

    default:
      // Catch-all: add global stats for any unrecognized dashboard type
      queries.push({
        name: 'CRK_Global',
        code: POWER_QUERY_TEMPLATES.global(),
        description: 'Global crypto market statistics',
      });
      break;
  }

  return queries;
}
