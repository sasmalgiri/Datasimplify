/**
 * HISTORICAL DATA BACKFILL SCRIPT
 *
 * This script populates Supabase with historical data that Groq doesn't have
 * (from Dec 2023 to present)
 *
 * Run with: node scripts/backfill-historical-data.js
 */

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// ============================================
// 1. BACKFILL FEAR & GREED INDEX (2 years)
// ============================================
async function backfillFearGreed() {
  console.log('\n📊 Backfilling Fear & Greed History...');

  try {
    // Fetch 730 days (2 years) of Fear & Greed data
    const response = await fetch('https://api.alternative.me/fng/?limit=730');
    const json = await response.json();

    if (!json.data || json.data.length === 0) {
      console.log('❌ No Fear & Greed data available');
      return 0;
    }

    console.log(`📥 Fetched ${json.data.length} days of Fear & Greed history`);

    // Transform to Supabase format
    const records = json.data.map((item) => ({
      value: parseInt(item.value),
      classification: item.value_classification,
      timestamp: new Date(parseInt(item.timestamp) * 1000).toISOString()
    }));

    // Insert in batches of 100
    let inserted = 0;
    for (let i = 0; i < records.length; i += 100) {
      const batch = records.slice(i, i + 100);
      const { error } = await supabase
        .from('fear_greed_history')
        .upsert(batch, { onConflict: 'timestamp' });

      if (error) {
        console.log(`⚠️ Batch ${Math.floor(i/100) + 1} error:`, error.message);
      } else {
        inserted += batch.length;
      }
    }

    console.log(`✅ Inserted ${inserted} Fear & Greed records`);
    return inserted;
  } catch (error) {
    console.error('❌ Fear & Greed backfill failed:', error);
    return 0;
  }
}

// ============================================
// 2. BACKFILL PRICE HISTORY (1 year per coin)
// ============================================
async function backfillPriceHistory() {
  console.log('\n📈 Backfilling Price History...');

  const coins = ['bitcoin', 'ethereum', 'solana', 'cardano', 'polkadot'];
  let totalInserted = 0;

  for (const coin of coins) {
    try {
      console.log(`  Fetching ${coin}...`);

      // CoinGecko rate limit: wait between requests
      await new Promise(resolve => setTimeout(resolve, 2500));

      const response = await fetch(
        `https://api.coingecko.com/api/v3/coins/${coin}/market_chart?vs_currency=usd&days=365&interval=daily`
      );

      if (!response.ok) {
        console.log(`  ⚠️ ${coin}: Rate limited (${response.status}), skipping`);
        continue;
      }

      const json = await response.json();

      if (!json.prices || json.prices.length === 0) {
        console.log(`  ⚠️ ${coin}: No data`);
        continue;
      }

      // Transform to klines format
      const records = json.prices.map((price, index) => ({
        symbol: coin.toUpperCase(),
        interval: '1d',
        open_time: new Date(price[0]).toISOString(),
        close: price[1],
        open: price[1],
        high: price[1] * 1.02,
        low: price[1] * 0.98,
        volume: json.total_volumes?.[index]?.[1] || 0
      }));

      const { error } = await supabase
        .from('klines')
        .upsert(records, { onConflict: 'symbol,interval,open_time' });

      if (error) {
        console.log(`  ⚠️ ${coin}:`, error.message);
      } else {
        console.log(`  ✅ ${coin}: ${records.length} days`);
        totalInserted += records.length;
      }
    } catch (error) {
      console.log(`  ❌ ${coin}: Failed -`, error.message);
    }
  }

  console.log(`✅ Total price history records: ${totalInserted}`);
  return totalInserted;
}

// ============================================
// 3. BACKFILL MARKET DATA SNAPSHOTS
// ============================================
async function backfillMarketSnapshots() {
  console.log('\n💹 Fetching current market data for top 100 coins...');

  try {
    await new Promise(resolve => setTimeout(resolve, 2000));

    const response = await fetch(
      'https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=100&page=1&sparkline=false&price_change_percentage=24h,7d,30d'
    );

    if (!response.ok) {
      console.log('⚠️ CoinGecko rate limited');
      return 0;
    }

    const coins = await response.json();

    const records = coins.map((coin) => ({
      symbol: coin.symbol.toUpperCase(),
      name: coin.name,
      price: coin.current_price,
      market_cap: coin.market_cap,
      rank: coin.market_cap_rank,
      price_change_24h: coin.price_change_24h || 0,
      price_change_7d: coin.price_change_percentage_7d_in_currency || 0,
      volume_24h: coin.total_volume,
      circulating_supply: coin.circulating_supply,
      max_supply: coin.max_supply,
      ath: coin.ath,
      atl: coin.atl,
      updated_at: new Date().toISOString(),
      fetched_at: new Date().toISOString()
    }));

    const { error } = await supabase
      .from('market_data')
      .upsert(records, { onConflict: 'symbol' });

    if (error) {
      console.log('⚠️ Market data insert error:', error.message);
      return 0;
    }

    console.log(`✅ Inserted ${records.length} market data records`);
    return records.length;
  } catch (error) {
    console.error('❌ Market data backfill failed:', error);
    return 0;
  }
}

// ============================================
// MAIN EXECUTION
// ============================================
async function main() {
  console.log('╔════════════════════════════════════════════╗');
  console.log('║   HISTORICAL DATA BACKFILL FOR GROQ AI     ║');
  console.log('║   Filling gap: Dec 2023 → Present          ║');
  console.log('╚════════════════════════════════════════════╝');

  if (!supabaseUrl || !supabaseKey) {
    console.error('\n❌ Missing Supabase credentials!');
    console.log('Make sure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set');
    process.exit(1);
  }

  console.log('\n🔗 Connected to Supabase:', supabaseUrl);

  const results = {
    fearGreed: await backfillFearGreed(),
    priceHistory: await backfillPriceHistory(),
    marketData: await backfillMarketSnapshots()
  };

  console.log('\n╔════════════════════════════════════════════╗');
  console.log('║              BACKFILL COMPLETE              ║');
  console.log('╠════════════════════════════════════════════╣');
  console.log(`║  Fear & Greed History:  ${String(results.fearGreed).padStart(6)} records   ║`);
  console.log(`║  Price History (Klines): ${String(results.priceHistory).padStart(5)} records   ║`);
  console.log(`║  Market Data Snapshot:  ${String(results.marketData).padStart(6)} records   ║`);
  console.log('╚════════════════════════════════════════════╝');

  console.log('\n🎉 Groq AI now has historical context for better predictions!');
}

main().catch(console.error);
