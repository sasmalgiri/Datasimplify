// ==============================================
// CryptoReportKit - Power Query for Excel
// ==============================================
// Copy this code into Excel: Data → Get Data → From Other Sources → Blank Query → Advanced Editor

// ---------------------------------------------
// QUERY 1: Get Multiple Crypto Prices
// ---------------------------------------------
let
    // Configuration - Add your coins here
    CoinIds = "bitcoin,ethereum,solana,cardano,ripple",
    Currencies = "usd,eur,gbp",
    
    // API Call
    Source = Json.Document(Web.Contents(
        "https://api.coingecko.com/api/v3/simple/price",
        [
            Query = [
                ids = CoinIds,
                vs_currencies = Currencies,
                include_24hr_change = "true",
                include_market_cap = "true"
            ]
        ]
    )),
    
    // Convert to Table
    ToTable = Record.ToTable(Source),
    
    // Expand the nested records
    ExpandedData = Table.ExpandRecordColumn(ToTable, "Value", {"usd", "eur", "gbp", "usd_24h_change", "usd_market_cap"}, 
        {"Price_USD", "Price_EUR", "Price_GBP", "Change_24h", "Market_Cap"}),
    
    // Rename columns
    RenamedColumns = Table.RenameColumns(ExpandedData, {{"Name", "Coin"}}),
    
    // Format numbers
    FormattedTable = Table.TransformColumnTypes(RenamedColumns, {
        {"Price_USD", type number},
        {"Price_EUR", type number},
        {"Price_GBP", type number},
        {"Change_24h", type number},
        {"Market_Cap", type number}
    })
in
    FormattedTable


// ---------------------------------------------
// QUERY 2: Get Top 100 Coins by Market Cap
// ---------------------------------------------
// Create a new query and paste this:
/*
let
    Source = Json.Document(Web.Contents(
        "https://api.coingecko.com/api/v3/coins/markets",
        [
            Query = [
                vs_currency = "usd",
                order = "market_cap_desc",
                per_page = "100",
                page = "1",
                sparkline = "false"
            ]
        ]
    )),
    
    // Convert to table
    ToTable = Table.FromList(Source, Splitter.SplitByNothing(), null, null, ExtraValues.Error),
    
    // Expand columns
    ExpandedColumns = Table.ExpandRecordColumn(ToTable, "Column1", 
        {"id", "symbol", "name", "current_price", "market_cap", "total_volume", 
         "price_change_percentage_24h", "circulating_supply", "ath", "ath_change_percentage"},
        {"ID", "Symbol", "Name", "Price", "Market_Cap", "Volume_24h", 
         "Change_24h_%", "Circulating_Supply", "ATH", "ATH_Change_%"}),
    
    // Set data types
    TypedTable = Table.TransformColumnTypes(ExpandedColumns, {
        {"Price", type number},
        {"Market_Cap", type number},
        {"Volume_24h", type number},
        {"Change_24h_%", type number},
        {"Circulating_Supply", type number},
        {"ATH", type number},
        {"ATH_Change_%", type number}
    })
in
    TypedTable
*/


// ---------------------------------------------
// QUERY 3: Historical Price Data (30 Days)
// ---------------------------------------------
// Create a new query and paste this:
/*
let
    // Change this to any coin
    CoinId = "bitcoin",
    
    Source = Json.Document(Web.Contents(
        "https://api.coingecko.com/api/v3/coins/" & CoinId & "/market_chart",
        [
            Query = [
                vs_currency = "usd",
                days = "30"
            ]
        ]
    )),
    
    // Get prices array
    Prices = Source[prices],
    
    // Convert to table
    ToTable = Table.FromList(Prices, Splitter.SplitByNothing(), null, null, ExtraValues.Error),
    
    // Expand the list (timestamp, price)
    ExpandedList = Table.TransformColumns(ToTable, {"Column1", each 
        [Timestamp = _{0}, Price = _{1}]
    }),
    
    // Expand to columns
    ExpandedRecords = Table.ExpandRecordColumn(ExpandedList, "Column1", {"Timestamp", "Price"}),
    
    // Convert timestamp to date
    AddDate = Table.AddColumn(ExpandedRecords, "Date", each 
        DateTime.From(#datetime(1970, 1, 1, 0, 0, 0) + #duration(0, 0, 0, [Timestamp]/1000))
    ),
    
    // Remove timestamp, keep date and price
    FinalTable = Table.SelectColumns(AddDate, {"Date", "Price"}),
    
    // Set types
    TypedTable = Table.TransformColumnTypes(FinalTable, {
        {"Date", type datetime},
        {"Price", type number}
    })
in
    TypedTable
*/


// ---------------------------------------------
// QUERY 4: With Your CoinGecko API Key (BYOK)
// ---------------------------------------------
// If you have a CoinGecko Pro API key, use this:
/*
let
    // YOUR API KEY - Replace with your actual key
    ApiKey = "YOUR_COINGECKO_API_KEY_HERE",
    
    Source = Json.Document(Web.Contents(
        "https://pro-api.coingecko.com/api/v3/simple/price",
        [
            Headers = [
                #"x-cg-pro-api-key" = ApiKey
            ],
            Query = [
                ids = "bitcoin,ethereum",
                vs_currencies = "usd"
            ]
        ]
    ))
in
    Source
*/
