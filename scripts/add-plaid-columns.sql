-- ============================================================
--  WealthLens — Plaid Integration Columns
--  Run in Supabase SQL Editor
-- ============================================================

-- ── transactions: add plaid dedup + item reference ───────────
ALTER TABLE transactions
  ADD COLUMN IF NOT EXISTS plaid_transaction_id TEXT UNIQUE,
  ADD COLUMN IF NOT EXISTS item_id              TEXT;

CREATE INDEX IF NOT EXISTS idx_transactions_plaid_id
  ON transactions (plaid_transaction_id)
  WHERE plaid_transaction_id IS NOT NULL;

-- ── accounts: add plaid sync fields ──────────────────────────
ALTER TABLE accounts
  ADD COLUMN IF NOT EXISTS available  NUMERIC(12,2),
  ADD COLUMN IF NOT EXISTS mask       TEXT,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- ── plaid_items: add cursor + sync tracking ───────────────────
ALTER TABLE plaid_items
  ADD COLUMN IF NOT EXISTS cursor      TEXT,
  ADD COLUMN IF NOT EXISTS last_synced TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS error_code  TEXT;

-- ── plaid_items: RLS (service role bypasses, users can read own items) ──
ALTER TABLE plaid_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read own plaid items"   ON plaid_items;
DROP POLICY IF EXISTS "Users can delete own plaid items" ON plaid_items;

CREATE POLICY "Users can read own plaid items"
  ON plaid_items FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own plaid items"
  ON plaid_items FOR DELETE
  USING (auth.uid() = user_id);

-- INSERT/UPDATE handled exclusively by service role (no user policy needed)

-- ── Verification ─────────────────────────────────────────────
-- SELECT column_name FROM information_schema.columns WHERE table_name = 'transactions' ORDER BY ordinal_position;
-- SELECT column_name FROM information_schema.columns WHERE table_name = 'plaid_items'  ORDER BY ordinal_position;
