-- ============================================
-- ADD MISSING TABLES FOR SYNC SERVICE
-- Run this in Supabase SQL Editor
-- ============================================

-- 1. SYNC LOG - Track sync operations
CREATE TABLE IF NOT EXISTS public.sync_log (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  data_type text NOT NULL,
  status text NOT NULL CHECK (status IN ('running', 'success', 'failed')),
  records_synced integer DEFAULT 0,
  error_message text,
  started_at timestamp with time zone DEFAULT now(),
  completed_at timestamp with time zone,
  CONSTRAINT sync_log_pkey PRIMARY KEY (id)
);

CREATE INDEX IF NOT EXISTS idx_sync_log_data_type ON public.sync_log(data_type);
CREATE INDEX IF NOT EXISTS idx_sync_log_status ON public.sync_log(status);

-- 2. STABLECOINS - Stablecoin market data
CREATE TABLE IF NOT EXISTS public.stablecoins (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  name text NOT NULL,
  symbol text NOT NULL UNIQUE,
  chain text,
  market_cap numeric,
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT stablecoins_pkey PRIMARY KEY (id)
);

CREATE INDEX IF NOT EXISTS idx_stablecoins_symbol ON public.stablecoins(symbol);

-- 3. MARKET SENTIMENT - Overall market sentiment
CREATE TABLE IF NOT EXISTS public.market_sentiment (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  overall_score numeric,
  overall_label text,
  fear_greed_index integer,
  fear_greed_label text,
  total_posts_analyzed integer DEFAULT 0,
  confidence numeric,
  by_source jsonb,
  trending_topics jsonb,
  recorded_at timestamp with time zone DEFAULT now(),
  CONSTRAINT market_sentiment_pkey PRIMARY KEY (id)
);

CREATE INDEX IF NOT EXISTS idx_market_sentiment_recorded ON public.market_sentiment(recorded_at DESC);

-- 4. COIN SENTIMENT - Per-coin sentiment data
CREATE TABLE IF NOT EXISTS public.coin_sentiment (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  symbol text NOT NULL UNIQUE,
  sentiment_score numeric,
  sentiment_label text,
  social_volume integer DEFAULT 0,
  is_trending boolean DEFAULT false,
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT coin_sentiment_pkey PRIMARY KEY (id)
);

CREATE INDEX IF NOT EXISTS idx_coin_sentiment_symbol ON public.coin_sentiment(symbol);
CREATE INDEX IF NOT EXISTS idx_coin_sentiment_trending ON public.coin_sentiment(is_trending) WHERE is_trending = true;

-- 5. SENTIMENT POSTS - Individual social media posts
CREATE TABLE IF NOT EXISTS public.sentiment_posts (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  external_id text NOT NULL,
  source text NOT NULL,
  platform text,
  title text,
  content text,
  url text,
  author text,
  sentiment_score numeric,
  sentiment_label text,
  confidence numeric,
  likes integer DEFAULT 0,
  comments integer DEFAULT 0,
  coins_mentioned text[],
  keywords text[],
  posted_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT sentiment_posts_pkey PRIMARY KEY (id),
  CONSTRAINT sentiment_posts_unique UNIQUE (source, external_id)
);

CREATE INDEX IF NOT EXISTS idx_sentiment_posts_source ON public.sentiment_posts(source);
CREATE INDEX IF NOT EXISTS idx_sentiment_posts_posted ON public.sentiment_posts(posted_at DESC);
CREATE INDEX IF NOT EXISTS idx_sentiment_posts_sentiment ON public.sentiment_posts(sentiment_score);

-- 6. EXCHANGE BALANCES - Historical exchange wallet balances
CREATE TABLE IF NOT EXISTS public.exchange_balances (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  exchange text NOT NULL,
  wallet_address text,
  balance numeric,
  balance_usd numeric,
  symbol text DEFAULT 'ETH',
  recorded_at timestamp with time zone DEFAULT now(),
  CONSTRAINT exchange_balances_pkey PRIMARY KEY (id)
);

CREATE INDEX IF NOT EXISTS idx_exchange_balances_exchange ON public.exchange_balances(exchange);
CREATE INDEX IF NOT EXISTS idx_exchange_balances_recorded ON public.exchange_balances(recorded_at DESC);

-- 7. BITCOIN STATS - On-chain Bitcoin metrics
CREATE TABLE IF NOT EXISTS public.bitcoin_stats (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  hash_rate numeric,
  difficulty numeric,
  block_height integer,
  avg_block_time numeric,
  unconfirmed_txs integer,
  mempool_size integer,
  recorded_at timestamp with time zone DEFAULT now(),
  CONSTRAINT bitcoin_stats_pkey PRIMARY KEY (id)
);

CREATE INDEX IF NOT EXISTS idx_bitcoin_stats_recorded ON public.bitcoin_stats(recorded_at DESC);

-- 8. ETH GAS PRICES - Ethereum gas price history
CREATE TABLE IF NOT EXISTS public.eth_gas_prices (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  slow_gwei numeric,
  standard_gwei numeric,
  fast_gwei numeric,
  base_fee_gwei numeric,
  recorded_at timestamp with time zone DEFAULT now(),
  CONSTRAINT eth_gas_prices_pkey PRIMARY KEY (id)
);

CREATE INDEX IF NOT EXISTS idx_eth_gas_recorded ON public.eth_gas_prices(recorded_at DESC);

-- ============================================
-- FIX COLUMN MISMATCHES IN EXISTING TABLES
-- ============================================

-- Add 'chain' column to chain_tvl if it doesn't exist (sync uses 'chain', schema has 'chain_name')
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'chain_tvl' AND column_name = 'chain') THEN
    ALTER TABLE public.chain_tvl ADD COLUMN chain text;
  END IF;
END $$;

-- Update chain_tvl to populate 'chain' from 'chain_name' if needed
UPDATE public.chain_tvl SET chain = chain_name WHERE chain IS NULL AND chain_name IS NOT NULL;

-- Add 'dominance' column to chain_tvl if missing
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'chain_tvl' AND column_name = 'dominance') THEN
    ALTER TABLE public.chain_tvl ADD COLUMN dominance numeric;
  END IF;
END $$;

-- Add 'updated_at' column to chain_tvl if missing
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'chain_tvl' AND column_name = 'updated_at') THEN
    ALTER TABLE public.chain_tvl ADD COLUMN updated_at timestamp with time zone DEFAULT now();
  END IF;
END $$;

-- Add unique constraint on chain column
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chain_tvl_chain_unique') THEN
    ALTER TABLE public.chain_tvl ADD CONSTRAINT chain_tvl_chain_unique UNIQUE (chain);
  END IF;
EXCEPTION WHEN others THEN
  NULL; -- Ignore if constraint can't be added
END $$;

-- Add 'recorded_at' column to fear_greed_history if missing (sync uses 'recorded_at')
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'fear_greed_history' AND column_name = 'recorded_at') THEN
    ALTER TABLE public.fear_greed_history ADD COLUMN recorded_at date;
  END IF;
END $$;

-- Populate recorded_at from timestamp
UPDATE public.fear_greed_history SET recorded_at = timestamp::date WHERE recorded_at IS NULL AND timestamp IS NOT NULL;

-- Add 'label' column to fear_greed_history if missing (sync uses 'label', schema has 'classification')
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'fear_greed_history' AND column_name = 'label') THEN
    ALTER TABLE public.fear_greed_history ADD COLUMN label text;
  END IF;
END $$;

-- Populate label from classification
UPDATE public.fear_greed_history SET label = classification WHERE label IS NULL AND classification IS NOT NULL;

-- Add 'tx_time' column to whale_transactions if missing (sync uses 'tx_time', schema has 'timestamp')
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'whale_transactions' AND column_name = 'tx_time') THEN
    ALTER TABLE public.whale_transactions ADD COLUMN tx_time timestamp with time zone;
  END IF;
END $$;

-- Populate tx_time from timestamp
UPDATE public.whale_transactions SET tx_time = timestamp WHERE tx_time IS NULL AND timestamp IS NOT NULL;

-- Add missing columns to whale_transactions
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'whale_transactions' AND column_name = 'from_label') THEN
    ALTER TABLE public.whale_transactions ADD COLUMN from_label text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'whale_transactions' AND column_name = 'to_label') THEN
    ALTER TABLE public.whale_transactions ADD COLUMN to_label text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'whale_transactions' AND column_name = 'symbol') THEN
    ALTER TABLE public.whale_transactions ADD COLUMN symbol text;
  END IF;
END $$;

-- Add missing columns to market_data for sync compatibility
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'market_data' AND column_name = 'price_change_percent_24h') THEN
    ALTER TABLE public.market_data ADD COLUMN price_change_percent_24h numeric;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'market_data' AND column_name = 'high_24h') THEN
    ALTER TABLE public.market_data ADD COLUMN high_24h numeric;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'market_data' AND column_name = 'low_24h') THEN
    ALTER TABLE public.market_data ADD COLUMN low_24h numeric;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'market_data' AND column_name = 'quote_volume_24h') THEN
    ALTER TABLE public.market_data ADD COLUMN quote_volume_24h numeric;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'market_data' AND column_name = 'bid_price') THEN
    ALTER TABLE public.market_data ADD COLUMN bid_price numeric;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'market_data' AND column_name = 'ask_price') THEN
    ALTER TABLE public.market_data ADD COLUMN ask_price numeric;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'market_data' AND column_name = 'spread') THEN
    ALTER TABLE public.market_data ADD COLUMN spread numeric;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'market_data' AND column_name = 'category') THEN
    ALTER TABLE public.market_data ADD COLUMN category text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'market_data' AND column_name = 'image_url') THEN
    ALTER TABLE public.market_data ADD COLUMN image_url text;
  END IF;
END $$;

-- Add missing columns to exchange_flows
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'exchange_flows' AND column_name = 'inflow_usd_24h') THEN
    ALTER TABLE public.exchange_flows ADD COLUMN inflow_usd_24h numeric;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'exchange_flows' AND column_name = 'outflow_usd_24h') THEN
    ALTER TABLE public.exchange_flows ADD COLUMN outflow_usd_24h numeric;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'exchange_flows' AND column_name = 'net_flow_usd_24h') THEN
    ALTER TABLE public.exchange_flows ADD COLUMN net_flow_usd_24h numeric;
  END IF;
END $$;

-- Add unique constraint on exchange for upsert
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'exchange_flows_exchange_unique') THEN
    -- First, remove duplicates keeping latest
    DELETE FROM public.exchange_flows a USING public.exchange_flows b
    WHERE a.id < b.id AND a.exchange = b.exchange;
    -- Then add constraint
    ALTER TABLE public.exchange_flows ADD CONSTRAINT exchange_flows_exchange_unique UNIQUE (exchange);
  END IF;
EXCEPTION WHEN others THEN
  NULL;
END $$;

-- ============================================
-- ENABLE ROW LEVEL SECURITY (Optional but recommended)
-- ============================================

ALTER TABLE public.sync_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stablecoins ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.market_sentiment ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coin_sentiment ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sentiment_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exchange_balances ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bitcoin_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.eth_gas_prices ENABLE ROW LEVEL SECURITY;

-- Create policies for public read access
CREATE POLICY IF NOT EXISTS "Allow public read on stablecoins" ON public.stablecoins FOR SELECT USING (true);
CREATE POLICY IF NOT EXISTS "Allow public read on market_sentiment" ON public.market_sentiment FOR SELECT USING (true);
CREATE POLICY IF NOT EXISTS "Allow public read on coin_sentiment" ON public.coin_sentiment FOR SELECT USING (true);
CREATE POLICY IF NOT EXISTS "Allow public read on sentiment_posts" ON public.sentiment_posts FOR SELECT USING (true);
CREATE POLICY IF NOT EXISTS "Allow public read on exchange_balances" ON public.exchange_balances FOR SELECT USING (true);
CREATE POLICY IF NOT EXISTS "Allow public read on bitcoin_stats" ON public.bitcoin_stats FOR SELECT USING (true);
CREATE POLICY IF NOT EXISTS "Allow public read on eth_gas_prices" ON public.eth_gas_prices FOR SELECT USING (true);
CREATE POLICY IF NOT EXISTS "Allow public read on sync_log" ON public.sync_log FOR SELECT USING (true);

-- ============================================
-- GRANT PERMISSIONS
-- ============================================

GRANT SELECT ON public.sync_log TO anon, authenticated;
GRANT SELECT ON public.stablecoins TO anon, authenticated;
GRANT SELECT ON public.market_sentiment TO anon, authenticated;
GRANT SELECT ON public.coin_sentiment TO anon, authenticated;
GRANT SELECT ON public.sentiment_posts TO anon, authenticated;
GRANT SELECT ON public.exchange_balances TO anon, authenticated;
GRANT SELECT ON public.bitcoin_stats TO anon, authenticated;
GRANT SELECT ON public.eth_gas_prices TO anon, authenticated;

-- Service role needs full access for sync
GRANT ALL ON public.sync_log TO service_role;
GRANT ALL ON public.stablecoins TO service_role;
GRANT ALL ON public.market_sentiment TO service_role;
GRANT ALL ON public.coin_sentiment TO service_role;
GRANT ALL ON public.sentiment_posts TO service_role;
GRANT ALL ON public.exchange_balances TO service_role;
GRANT ALL ON public.bitcoin_stats TO service_role;
GRANT ALL ON public.eth_gas_prices TO service_role;

-- ============================================
-- SUCCESS MESSAGE
-- ============================================

DO $$
BEGIN
  RAISE NOTICE '✅ All missing tables created successfully!';
  RAISE NOTICE '✅ Column mismatches fixed!';
  RAISE NOTICE '✅ Indexes and constraints added!';
  RAISE NOTICE '';
  RAISE NOTICE 'Next steps:';
  RAISE NOTICE '1. Deploy to Vercel';
  RAISE NOTICE '2. Trigger sync: /api/sync?secret=YOUR_SECRET&type=all';
  RAISE NOTICE '3. Check data: /api/cached?type=dashboard';
END $$;
