-- Add-in V2: Workspaces, Snapshots, Action Tokens, Portfolio History
-- Feature-flagged via NEXT_PUBLIC_FEATURE_ADDIN_V2

-- ============================================
-- 1. User workspaces (server-side sync)
-- ============================================
CREATE TABLE IF NOT EXISTS user_workspaces (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL DEFAULT 'My Workspace',
    mode TEXT NOT NULL DEFAULT 'watchlist' CHECK (mode IN ('watchlist', 'holdings')),
    config JSONB NOT NULL DEFAULT '{}'::jsonb,
    -- config stores: { assets: [{symbol, amount?}], currency, days, ... }
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE user_workspaces ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own workspaces" ON user_workspaces
    FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own workspaces" ON user_workspaces
    FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own workspaces" ON user_workspaces
    FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own workspaces" ON user_workspaces
    FOR DELETE USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_workspaces_user ON user_workspaces (user_id, is_active);

-- ============================================
-- 2. KPI snapshots (history + "What Changed")
-- ============================================
CREATE TABLE IF NOT EXISTS workspace_snapshots (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workspace_id UUID NOT NULL REFERENCES user_workspaces(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    kpi_return_7d DECIMAL(12, 4),
    kpi_return_30d DECIMAL(12, 4),
    kpi_value DECIMAL(20, 8),
    asset_count INTEGER DEFAULT 0,
    top_mover_symbol TEXT,
    top_mover_change DECIMAL(12, 4),
    used_cache BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE workspace_snapshots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own snapshots" ON workspace_snapshots
    FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own snapshots" ON workspace_snapshots
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_snapshots_workspace ON workspace_snapshots (workspace_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_snapshots_user ON workspace_snapshots (user_id, created_at DESC);

-- ============================================
-- 3. Action tokens (short-lived auth for gated actions)
-- ============================================
CREATE TABLE IF NOT EXISTS action_tokens (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    action TEXT NOT NULL CHECK (action IN ('refresh', 'export_pdf', 'export_csv', 'export_excel')),
    token TEXT NOT NULL UNIQUE,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    consumed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE action_tokens ENABLE ROW LEVEL SECURITY;

-- Only server (service role) can read/write action tokens
-- No RLS policies for regular users — these are server-managed

CREATE INDEX IF NOT EXISTS idx_action_tokens_lookup ON action_tokens (token, user_id) WHERE consumed = FALSE;

-- Auto-cleanup expired tokens (run via cron or on insert)
CREATE INDEX IF NOT EXISTS idx_action_tokens_expired ON action_tokens (expires_at) WHERE consumed = FALSE;

-- ============================================
-- 4. Portfolio value history (time-series)
-- ============================================
CREATE TABLE IF NOT EXISTS portfolio_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    workspace_id UUID REFERENCES user_workspaces(id) ON DELETE SET NULL,
    total_value DECIMAL(20, 8) NOT NULL,
    return_24h DECIMAL(12, 4),
    return_7d DECIMAL(12, 4),
    return_30d DECIMAL(12, 4),
    asset_count INTEGER DEFAULT 0,
    snapshot_date DATE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, workspace_id, snapshot_date)
);

ALTER TABLE portfolio_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own portfolio history" ON portfolio_history
    FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own portfolio history" ON portfolio_history
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_portfolio_history_user ON portfolio_history (user_id, snapshot_date DESC);
CREATE INDEX IF NOT EXISTS idx_portfolio_history_workspace ON portfolio_history (workspace_id, snapshot_date DESC);
