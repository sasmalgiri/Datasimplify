-- Dashboard Credits System
-- Dune-style pay-per-action credits (no subscription required)

-- Credits balance table (one row per user)
CREATE TABLE IF NOT EXISTS dashboard_credits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  balance INTEGER NOT NULL DEFAULT 0,
  total_purchased INTEGER NOT NULL DEFAULT 0,
  total_used INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT dashboard_credits_user_unique UNIQUE (user_id),
  CONSTRAINT dashboard_credits_balance_non_negative CHECK (balance >= 0)
);

-- Credit transaction log (audit trail)
CREATE TABLE IF NOT EXISTS credit_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount INTEGER NOT NULL,                    -- positive = credit, negative = debit
  action VARCHAR(50) NOT NULL,                -- 'purchase', 'export_pdf', 'ai_chat_query', etc.
  description TEXT,
  package_id VARCHAR(50),                     -- which package was purchased (null for usage)
  external_order_id TEXT,                     -- FastSpring order ID for purchases
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_credit_transactions_user ON credit_transactions (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_dashboard_credits_user ON dashboard_credits (user_id);

-- RLS Policies
ALTER TABLE dashboard_credits ENABLE ROW LEVEL SECURITY;
ALTER TABLE credit_transactions ENABLE ROW LEVEL SECURITY;

-- Users can read their own credits
CREATE POLICY "Users read own credits" ON dashboard_credits
  FOR SELECT USING (auth.uid() = user_id);

-- Users can update their own credits (via RPC or API)
CREATE POLICY "Users update own credits" ON dashboard_credits
  FOR UPDATE USING (auth.uid() = user_id);

-- Users can insert their own credits row
CREATE POLICY "Users insert own credits" ON dashboard_credits
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can read their own transactions
CREATE POLICY "Users read own transactions" ON credit_transactions
  FOR SELECT USING (auth.uid() = user_id);

-- Users can insert their own transactions
CREATE POLICY "Users insert own transactions" ON credit_transactions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Service role can do everything (for webhook/API route)
CREATE POLICY "Service role full access credits" ON dashboard_credits
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Service role full access transactions" ON credit_transactions
  FOR ALL USING (true) WITH CHECK (true);

-- Function to atomically deduct credits
CREATE OR REPLACE FUNCTION deduct_credits(
  p_user_id UUID,
  p_amount INTEGER,
  p_action VARCHAR,
  p_description TEXT DEFAULT NULL
) RETURNS TABLE(success BOOLEAN, new_balance INTEGER) AS $$
DECLARE
  v_balance INTEGER;
BEGIN
  -- Lock the row for update
  SELECT balance INTO v_balance
  FROM dashboard_credits
  WHERE user_id = p_user_id
  FOR UPDATE;

  IF v_balance IS NULL OR v_balance < p_amount THEN
    RETURN QUERY SELECT false, COALESCE(v_balance, 0);
    RETURN;
  END IF;

  -- Deduct
  UPDATE dashboard_credits
  SET balance = balance - p_amount,
      total_used = total_used + p_amount,
      updated_at = now()
  WHERE user_id = p_user_id;

  -- Log transaction
  INSERT INTO credit_transactions (user_id, amount, action, description)
  VALUES (p_user_id, -p_amount, p_action, p_description);

  RETURN QUERY SELECT true, v_balance - p_amount;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to add credits (for purchases)
CREATE OR REPLACE FUNCTION add_credits(
  p_user_id UUID,
  p_amount INTEGER,
  p_action VARCHAR,
  p_description TEXT DEFAULT NULL,
  p_package_id VARCHAR DEFAULT NULL,
  p_external_order_id TEXT DEFAULT NULL
) RETURNS INTEGER AS $$
DECLARE
  v_new_balance INTEGER;
BEGIN
  -- Upsert credits row
  INSERT INTO dashboard_credits (user_id, balance, total_purchased, updated_at)
  VALUES (p_user_id, p_amount, p_amount, now())
  ON CONFLICT (user_id)
  DO UPDATE SET
    balance = dashboard_credits.balance + p_amount,
    total_purchased = dashboard_credits.total_purchased + p_amount,
    updated_at = now()
  RETURNING balance INTO v_new_balance;

  -- Log transaction
  INSERT INTO credit_transactions (user_id, amount, action, description, package_id, external_order_id)
  VALUES (p_user_id, p_amount, p_action, p_description, p_package_id, p_external_order_id);

  RETURN v_new_balance;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
