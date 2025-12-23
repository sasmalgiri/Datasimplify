/**
 * NEWS DATA BACKFILL SCRIPT
 *
 * This script populates Supabase with historical news data from CryptoPanic
 * for AI prediction context.
 *
 * Run with: node scripts/backfill-news-data.js
 */

const { createClient } = require('@supabase/supabase-js');

// Configuration
const SUPABASE_URL = 'https://gadspittitmuqmysiawu.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdhZHNwaXR0aXRtdXFteXNpYXd1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NTkwMzgzNSwiZXhwIjoyMDgxNDc5ODM1fQ.3SjsCC0Oy9ewfLLfO1lteuERFeU79s7cCnc2HPXCYlM';
const CRYPTOPANIC_API_KEY = 'cceb2ab5bf11ae327110d8e92dbb7893d8f384df';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// Sentiment analysis keywords
const BULLISH_WORDS = [
  'moon', 'pump', 'bull', 'bullish', 'buy', 'rally', 'surge', 'soar',
  'breakout', 'ath', 'profit', 'gain', 'up', 'uptrend', 'adoption',
  'institutional', 'etf', 'approved', 'partnership', 'launch'
];

const BEARISH_WORDS = [
  'dump', 'crash', 'bear', 'bearish', 'sell', 'plunge', 'drop', 'fall',
  'correction', 'loss', 'down', 'downtrend', 'hack', 'scam', 'fraud',
  'ban', 'regulation', 'lawsuit', 'sec', 'investigation'
];

function analyzeSentiment(title) {
  const text = title.toLowerCase();
  let bullishCount = 0;
  let bearishCount = 0;

  BULLISH_WORDS.forEach(word => {
    if (text.includes(word)) bullishCount++;
  });

  BEARISH_WORDS.forEach(word => {
    if (text.includes(word)) bearishCount++;
  });

  const total = bullishCount + bearishCount;
  if (total === 0) return { score: 0, label: 'neutral' };

  const score = (bullishCount - bearishCount) / total;
  let label = 'neutral';
  if (score > 0.3) label = 'bullish';
  if (score < -0.3) label = 'bearish';

  return { score, label };
}

// ============================================
// FETCH NEWS FROM CRYPTOPANIC
// ============================================
async function fetchCryptoPanicNews(filter = 'hot', page = 1) {
  // Developer API endpoint
  const url = `https://cryptopanic.com/api/developer/v1/posts/?auth_token=${CRYPTOPANIC_API_KEY}&filter=${filter}&page=${page}`;

  try {
    const response = await fetch(url);
    if (!response.ok) {
      console.log(`  Rate limited or error: ${response.status}`);
      return { results: [], next: null };
    }
    return await response.json();
  } catch (error) {
    console.error('Fetch error:', error.message);
    return { results: [], next: null };
  }
}

// ============================================
// CREATE NEWS TABLE IF NOT EXISTS
// ============================================
async function ensureNewsTable() {
  console.log('\n📰 Checking news_articles table...');

  // Try to query the table
  const { error } = await supabase
    .from('news_articles')
    .select('id')
    .limit(1);

  if (error && error.code === '42P01') {
    console.log('  Creating news_articles table...');

    // Create table via RPC or raw SQL
    const { error: createError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS news_articles (
          id SERIAL PRIMARY KEY,
          external_id VARCHAR(255) UNIQUE,
          title TEXT NOT NULL,
          url TEXT,
          source VARCHAR(255),
          published_at TIMESTAMPTZ,
          sentiment_score DECIMAL(4,3),
          sentiment_label VARCHAR(50),
          coins TEXT[],
          votes_positive INTEGER DEFAULT 0,
          votes_negative INTEGER DEFAULT 0,
          created_at TIMESTAMPTZ DEFAULT NOW()
        );
        CREATE INDEX IF NOT EXISTS idx_news_published ON news_articles(published_at DESC);
        CREATE INDEX IF NOT EXISTS idx_news_sentiment ON news_articles(sentiment_label);
      `
    });

    if (createError) {
      console.log('  Table may already exist or need manual creation');
    }
  } else {
    console.log('  Table exists');
  }
}

// ============================================
// BACKFILL NEWS DATA
// ============================================
async function backfillNews() {
  console.log('\n📰 Backfilling News Data from CryptoPanic...');

  const filters = ['hot', 'rising', 'bullish', 'bearish', 'important'];
  let totalInserted = 0;
  const allArticles = new Map(); // Use Map to dedupe by external_id

  for (const filter of filters) {
    console.log(`\n  Fetching ${filter} news...`);

    // Fetch multiple pages for each filter
    for (let page = 1; page <= 5; page++) {
      // Rate limit: wait between requests
      await new Promise(resolve => setTimeout(resolve, 1000));

      const data = await fetchCryptoPanicNews(filter, page);

      if (!data.results || data.results.length === 0) {
        console.log(`    Page ${page}: No more results`);
        break;
      }

      console.log(`    Page ${page}: ${data.results.length} articles`);

      // Process articles
      for (const article of data.results) {
        const sentiment = analyzeSentiment(article.title);
        const votes = article.votes || { positive: 0, negative: 0 };

        // Adjust sentiment based on votes
        const voteScore = (votes.positive - votes.negative) / Math.max(1, votes.positive + votes.negative);
        const combinedScore = (sentiment.score + voteScore) / 2;

        allArticles.set(String(article.id), {
          external_id: String(article.id),
          title: article.title,
          url: article.url,
          source: article.source?.title || 'CryptoPanic',
          published_at: article.published_at,
          sentiment_score: combinedScore,
          sentiment_label: combinedScore > 0.2 ? 'bullish' : combinedScore < -0.2 ? 'bearish' : 'neutral',
          coins: (article.currencies || []).map(c => c.code),
          votes_positive: votes.positive || 0,
          votes_negative: votes.negative || 0
        });
      }

      if (!data.next) break;
    }
  }

  // Convert to array and insert
  const articles = Array.from(allArticles.values());
  console.log(`\n  Total unique articles: ${articles.length}`);

  // Insert in batches
  const batchSize = 50;
  for (let i = 0; i < articles.length; i += batchSize) {
    const batch = articles.slice(i, i + batchSize);

    const { error } = await supabase
      .from('news_articles')
      .upsert(batch, {
        onConflict: 'external_id',
        ignoreDuplicates: true
      });

    if (error) {
      console.log(`    Batch ${Math.floor(i/batchSize) + 1} error:`, error.message);
    } else {
      totalInserted += batch.length;
    }
  }

  console.log(`\n  Inserted/Updated ${totalInserted} news articles`);
  return totalInserted;
}

// ============================================
// FETCH NEWS BY COIN (For specific coin context)
// ============================================
async function backfillCoinNews() {
  console.log('\n💰 Fetching news for top coins...');

  const coins = ['BTC', 'ETH', 'SOL', 'XRP', 'ADA', 'DOGE', 'AVAX', 'DOT', 'LINK', 'MATIC'];
  let totalInserted = 0;
  const allArticles = new Map();

  for (const coin of coins) {
    console.log(`  Fetching ${coin} news...`);
    await new Promise(resolve => setTimeout(resolve, 1500));

    const url = `https://cryptopanic.com/api/developer/v1/posts/?auth_token=${CRYPTOPANIC_API_KEY}&currencies=${coin}`;

    try {
      const response = await fetch(url);
      if (!response.ok) {
        console.log(`    ${coin}: Rate limited`);
        continue;
      }

      const data = await response.json();

      if (!data.results) continue;

      console.log(`    ${coin}: ${data.results.length} articles`);

      for (const article of data.results) {
        const sentiment = analyzeSentiment(article.title);
        const votes = article.votes || { positive: 0, negative: 0 };
        const voteScore = (votes.positive - votes.negative) / Math.max(1, votes.positive + votes.negative);
        const combinedScore = (sentiment.score + voteScore) / 2;

        allArticles.set(String(article.id), {
          external_id: String(article.id),
          title: article.title,
          url: article.url,
          source: article.source?.title || 'CryptoPanic',
          published_at: article.published_at,
          sentiment_score: combinedScore,
          sentiment_label: combinedScore > 0.2 ? 'bullish' : combinedScore < -0.2 ? 'bearish' : 'neutral',
          coins: (article.currencies || []).map(c => c.code),
          votes_positive: votes.positive || 0,
          votes_negative: votes.negative || 0
        });
      }
    } catch (error) {
      console.log(`    ${coin}: Error - ${error.message}`);
    }
  }

  // Insert coin-specific articles
  const articles = Array.from(allArticles.values());
  console.log(`\n  Total unique coin articles: ${articles.length}`);

  const batchSize = 50;
  for (let i = 0; i < articles.length; i += batchSize) {
    const batch = articles.slice(i, i + batchSize);

    const { error } = await supabase
      .from('news_articles')
      .upsert(batch, {
        onConflict: 'external_id',
        ignoreDuplicates: true
      });

    if (error) {
      console.log(`    Batch error:`, error.message);
    } else {
      totalInserted += batch.length;
    }
  }

  return totalInserted;
}

// ============================================
// GET NEWS SUMMARY FOR AI CONTEXT
// ============================================
async function getNewsSummary() {
  console.log('\n📊 News Summary:');

  const { data: stats, error } = await supabase
    .from('news_articles')
    .select('sentiment_label')
    .gte('published_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString());

  if (error) {
    console.log('  Could not get summary:', error.message);
    return;
  }

  const bullish = stats.filter(s => s.sentiment_label === 'bullish').length;
  const bearish = stats.filter(s => s.sentiment_label === 'bearish').length;
  const neutral = stats.filter(s => s.sentiment_label === 'neutral').length;

  console.log(`  Last 7 days:`);
  console.log(`    Bullish: ${bullish}`);
  console.log(`    Bearish: ${bearish}`);
  console.log(`    Neutral: ${neutral}`);
  console.log(`    Sentiment ratio: ${((bullish / (bullish + bearish || 1)) * 100).toFixed(1)}% bullish`);
}

// ============================================
// MAIN EXECUTION
// ============================================
async function main() {
  console.log('╔════════════════════════════════════════════╗');
  console.log('║     NEWS DATA BACKFILL FOR AI CONTEXT      ║');
  console.log('║     CryptoPanic → Supabase                 ║');
  console.log('╚════════════════════════════════════════════╝');

  // Ensure table exists
  await ensureNewsTable();

  // Backfill general news
  const generalNews = await backfillNews();

  // Backfill coin-specific news
  const coinNews = await backfillCoinNews();

  // Show summary
  await getNewsSummary();

  console.log('\n╔════════════════════════════════════════════╗');
  console.log('║           NEWS BACKFILL COMPLETE           ║');
  console.log('╠════════════════════════════════════════════╣');
  console.log(`║  General News:     ${String(generalNews).padStart(6)} articles       ║`);
  console.log(`║  Coin-Specific:    ${String(coinNews).padStart(6)} articles       ║`);
  console.log('╚════════════════════════════════════════════╝');

  console.log('\n🎉 AI now has news context for better predictions!');
}

main().catch(console.error);
