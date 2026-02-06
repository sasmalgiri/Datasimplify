// ==============================================
// CryptoReportKit - FREE STARTER TEMPLATE
// Power Query for Excel (BYOK)
// ==============================================
//
// ⭐ FREE TIER - 10 Coins, Basic Features
//
// To upgrade: https://cryptoreportkit.com/pricing
//
// DATA SOURCE:
// Data provided by CoinGecko (https://www.coingecko.com/en/api)
// CoinGecko API is used under their free tier with attribution.
//
// ==============================================

// HOW TO USE:
// 1. In Excel: Data → Get Data → From Web
// 2. Paste the URL below
// 3. Click OK → Close & Load
//
// API URL (copy this):
// https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=bitcoin,ethereum,solana,cardano,ripple,dogecoin,polkadot,avalanche-2,chainlink,polygon&order=market_cap_desc

// ---------------------------------------------
// POWER QUERY CODE (Advanced Editor)
// ---------------------------------------------
let
    // FREE: Limited to 10 coins
    // Upgrade to Pro for 100+ coins: https://cryptoreportkit.com/pricing
    
    CoinIds = "bitcoin,ethereum,solana,cardano,ripple,dogecoin,polkadot,avalanche-2,chainlink,polygon",
    
    Source = Json.Document(Web.Contents(
        "https://api.coingecko.com/api/v3/coins/markets",
        [
            Query = [
                vs_currency = "usd",
                ids = CoinIds,
                order = "market_cap_desc",
                sparkline = "false"
            ]
        ]
    )),
    
    ToTable = Table.FromList(Source, Splitter.SplitByNothing(), null, null, ExtraValues.Error),
    
    ExpandedColumns = Table.ExpandRecordColumn(ToTable, "Column1", 
        {"name", "symbol", "current_price", "price_change_percentage_24h", "market_cap"},
        {"Coin", "Symbol", "Price_USD", "Change_24h", "Market_Cap"}),
    
    TypedTable = Table.TransformColumnTypes(ExpandedColumns, {
        {"Price_USD", type number},
        {"Change_24h", type number},
        {"Market_Cap", Int64.Type}
    }),
    
    // Add timestamp
    AddTimestamp = Table.AddColumn(TypedTable, "Last_Updated", each DateTime.LocalNow())
in
    AddTimestamp

// ---------------------------------------------
// WANT MORE FEATURES?
// ---------------------------------------------
// 
// 🚀 PRO TEMPLATE ($29) includes:
//    ✅ Top 100 cryptocurrencies
//    ✅ Auto-refresh every 5 minutes
//    ✅ Portfolio tracker
//    ✅ Interactive charts
//    ✅ DCA calculator
//    ✅ BYOK with CoinGecko Pro API
//
// 🏢 ENTERPRISE TEMPLATE ($99) includes:
//    ✅ All 10,000+ cryptocurrencies
//    ✅ Historical data (5 years)
//    ✅ Risk analytics (Sharpe ratio, etc.)
//    ✅ Correlation matrix
//    ✅ Custom modifications
//
// Upgrade: https://cryptoreportkit.com/pricing
// ---------------------------------------------

// NEED HIGHER API LIMITS?
// Get CoinGecko Pro: https://www.coingecko.com/api/pricing?ref=cryptoreportkit
// (Affiliate link - helps support this project!)
