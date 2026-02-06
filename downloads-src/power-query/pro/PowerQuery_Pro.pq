// ==============================================
// CryptoReportKit - PRO TEMPLATE ($29)
// Power Query for Excel (BYOK)
// ==============================================
//
// 🚀 PRO TIER - 100 Coins, Auto-Refresh, Portfolio, Charts
//
// License: Single user, lifetime updates
// Support: support@cryptoreportkit.com
//
// DATA SOURCE:
// Data provided by CoinGecko (https://www.coingecko.com/en/api)
// CoinGecko API is used under their free tier with attribution.
//
// ==============================================

// ---------------------------------------------
// QUERY 1: Top 100 Cryptocurrencies
// ---------------------------------------------
let
    // PRO: Access to 100 coins (vs 10 in free)
    Source = Json.Document(Web.Contents(
        "https://api.coingecko.com/api/v3/coins/markets",
        [
            Query = [
                vs_currency = "usd",
                order = "market_cap_desc",
                per_page = "100",
                page = "1",
                sparkline = "false",
                price_change_percentage = "1h,24h,7d,30d"
            ]
        ]
    )),
    
    ToTable = Table.FromList(Source, Splitter.SplitByNothing(), null, null, ExtraValues.Error),
    
    ExpandedColumns = Table.ExpandRecordColumn(ToTable, "Column1", 
        {"market_cap_rank", "name", "symbol", "current_price", "market_cap", "total_volume",
         "price_change_percentage_1h_in_currency", "price_change_percentage_24h_in_currency",
         "price_change_percentage_7d_in_currency", "price_change_percentage_30d_in_currency",
         "circulating_supply", "total_supply", "ath", "ath_change_percentage", "ath_date"},
        {"Rank", "Coin", "Symbol", "Price", "Market_Cap", "Volume_24h",
         "Change_1h", "Change_24h", "Change_7d", "Change_30d",
         "Circulating_Supply", "Total_Supply", "ATH", "ATH_Change_%", "ATH_Date"}),
    
    TypedTable = Table.TransformColumnTypes(ExpandedColumns, {
        {"Rank", Int64.Type},
        {"Price", type number},
        {"Market_Cap", Int64.Type},
        {"Volume_24h", Int64.Type},
        {"Change_1h", type number},
        {"Change_24h", type number},
        {"Change_7d", type number},
        {"Change_30d", type number},
        {"Circulating_Supply", type number},
        {"Total_Supply", type number},
        {"ATH", type number},
        {"ATH_Change_%", type number}
    }),
    
    // Add signal column
    AddSignal = Table.AddColumn(TypedTable, "Signal", each 
        if [Change_24h] > 5 then "🟢 Strong Buy"
        else if [Change_24h] > 0 then "🟡 Buy"
        else if [Change_24h] > -5 then "🟠 Hold"
        else "🔴 Sell"
    ),
    
    AddTimestamp = Table.AddColumn(AddSignal, "Updated", each DateTime.LocalNow())
in
    AddTimestamp


// ---------------------------------------------
// QUERY 2: Portfolio Tracker
// ---------------------------------------------
// Create a table called "MyPortfolio" with columns:
// | Coin_ID | Amount | Buy_Price |
// Then use this query to calculate current value

/*
let
    // Reference your portfolio table
    Portfolio = Excel.CurrentWorkbook(){[Name="MyPortfolio"]}[Content],
    
    // Get current prices
    CoinIds = Text.Combine(Table.Column(Portfolio, "Coin_ID"), ","),
    
    PriceData = Json.Document(Web.Contents(
        "https://api.coingecko.com/api/v3/simple/price",
        [
            Query = [
                ids = CoinIds,
                vs_currencies = "usd"
            ]
        ]
    )),
    
    // Join with portfolio
    AddCurrentPrice = Table.AddColumn(Portfolio, "Current_Price", each 
        Record.Field(PriceData, [Coin_ID])[usd]
    ),
    
    // Calculate values
    AddCurrentValue = Table.AddColumn(AddCurrentPrice, "Current_Value", each 
        [Amount] * [Current_Price]
    ),
    
    AddCostBasis = Table.AddColumn(AddCurrentValue, "Cost_Basis", each 
        [Amount] * [Buy_Price]
    ),
    
    AddPnL = Table.AddColumn(AddCostBasis, "PnL", each 
        [Current_Value] - [Cost_Basis]
    ),
    
    AddPnLPercent = Table.AddColumn(AddPnL, "PnL_%", each 
        ([Current_Value] - [Cost_Basis]) / [Cost_Basis] * 100
    )
in
    AddPnLPercent
*/


// ---------------------------------------------
// QUERY 3: Historical Data for Charts
// ---------------------------------------------
/*
let
    CoinId = "bitcoin",
    Days = "30",
    
    Source = Json.Document(Web.Contents(
        "https://api.coingecko.com/api/v3/coins/" & CoinId & "/market_chart",
        [
            Query = [
                vs_currency = "usd",
                days = Days
            ]
        ]
    )),
    
    Prices = Source[prices],
    ToTable = Table.FromList(Prices, Splitter.SplitByNothing()),
    
    ExpandedList = Table.TransformColumns(ToTable, {"Column1", each 
        [Timestamp = _{0}, Price = _{1}]
    }),
    
    ExpandedRecords = Table.ExpandRecordColumn(ExpandedList, "Column1", {"Timestamp", "Price"}),
    
    AddDate = Table.AddColumn(ExpandedRecords, "Date", each 
        DateTime.From(#datetime(1970, 1, 1, 0, 0, 0) + #duration(0, 0, 0, [Timestamp]/1000))
    ),
    
    FinalTable = Table.SelectColumns(AddDate, {"Date", "Price"})
in
    FinalTable
*/


// ---------------------------------------------
// QUERY 4: DCA Calculator
// ---------------------------------------------
/*
let
    // Parameters (edit these)
    CoinId = "bitcoin",
    WeeklyAmount = 100,
    StartDate = #date(2024, 1, 1),
    
    // Get historical prices
    Days = Duration.Days(Date.From(DateTime.LocalNow()) - StartDate),
    
    Source = Json.Document(Web.Contents(
        "https://api.coingecko.com/api/v3/coins/" & CoinId & "/market_chart",
        [Query = [vs_currency = "usd", days = Text.From(Days)]]
    )),
    
    // Process weekly buys
    Prices = Source[prices],
    ToTable = Table.FromList(Prices, Splitter.SplitByNothing()),
    
    // ... (calculation logic)
    
    // Result: Total invested, Total coins, Current value, ROI
in
    Result
*/


// ---------------------------------------------
// WITH YOUR COINGECKO PRO API KEY
// ---------------------------------------------
// For higher rate limits (500 calls/min vs 10-30 calls/min)
// Get CoinGecko Pro: https://www.coingecko.com/api/pricing?ref=cryptoreportkit

/*
let
    // Store your API key in a cell named "ApiKey" on Settings sheet
    ApiKey = Excel.CurrentWorkbook(){[Name="ApiKey"]}[Content]{0}[Column1],
    
    Source = Json.Document(Web.Contents(
        "https://pro-api.coingecko.com/api/v3/coins/markets",
        [
            Headers = [#"x-cg-pro-api-key" = ApiKey],
            Query = [
                vs_currency = "usd",
                order = "market_cap_desc",
                per_page = "250",
                sparkline = "true"
            ]
        ]
    ))
in
    Source
*/


// ---------------------------------------------
// AUTO-REFRESH SETUP
// ---------------------------------------------
// 1. Load any query to Excel
// 2. Click on the table
// 3. Go to: Data → Queries & Connections
// 4. Right-click your query → Properties
// 5. Check "Refresh every X minutes"
// 6. Set to 5 minutes (or your preference)
//
// Note: CoinGecko free API allows ~10-30 calls/min
// With Pro API key, you get 500 calls/min
// ---------------------------------------------

// ==============================================
// Thank you for purchasing CryptoReportKit Pro!
// Support: support@cryptoreportkit.com
// ==============================================
