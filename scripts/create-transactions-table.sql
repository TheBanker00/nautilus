-- ============================================================
--  WealthLens — Transactions Table
--  Run this BEFORE category-taxonomy.sql
--  Supabase SQL Editor → paste → Run
-- ============================================================


-- ── 1. ENUM TYPES ────────────────────────────────────────────

CREATE TYPE transaction_source AS ENUM ('manual', 'plaid', 'csv', 'api');


-- ── 2. TABLE ─────────────────────────────────────────────────

CREATE TABLE transactions (

  -- CORE IDENTITY
  id                      TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  date                    DATE        NOT NULL,
  amount                  NUMERIC(12,2) NOT NULL,  -- signed: positive = money in, negative = money out

  -- MERCHANT
  merchant                TEXT,          -- canonical display name
  raw_merchant            TEXT,          -- original value from provider

  -- CLASSIFICATION (written by trigger for Plaid; set directly for manual)
  transaction_type        TEXT NOT NULL CHECK (transaction_type IN ('Income', 'Expense', 'Transfer')),
  category                TEXT,
  subcategory             TEXT,

  -- PROVIDER METADATA (Plaid only — never displayed)
  provider_subcategory    TEXT,          -- Plaid personal_finance_category_detailed
  provider_category       TEXT,          -- Plaid personal_finance_category_primary (optional, for audit)

  -- TRANSFER LINKING
  linked_transaction_id   TEXT REFERENCES transactions(id) ON DELETE SET NULL,

  -- ACCOUNT CONTEXT
  account_id              UUID REFERENCES accounts(id) ON DELETE SET NULL,
  account_name            TEXT,
  institution             TEXT,

  -- SOURCE
  source_type             transaction_source DEFAULT 'manual',
  pending                 BOOLEAN DEFAULT FALSE,

  -- ENRICHMENT FLAGS
  tags                    TEXT[]    DEFAULT '{}',
  is_refund               BOOLEAN   DEFAULT FALSE,
  is_reversal             BOOLEAN   DEFAULT FALSE,

  -- UI ENRICHMENT
  logo                    TEXT,
  notes                   TEXT,

  -- AUDIT
  created_at              TIMESTAMPTZ DEFAULT NOW(),
  updated_at              TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE transactions IS 'All transactions — Plaid imports, CSV uploads, and manual entries.';
COMMENT ON COLUMN transactions.amount           IS 'Always stored as an absolute value. Use transaction_type to determine sign context.';
COMMENT ON COLUMN transactions.provider_subcategory IS 'Raw Plaid personal_finance_category_detailed. Trigger maps this to transaction_type/category/subcategory. Never displayed in UI.';
COMMENT ON COLUMN transactions.transaction_type IS 'WealthLens top-level type: Income | Expense | Transfer';
COMMENT ON COLUMN transactions.linked_transaction_id IS 'For Transfer pairs: references the counterpart transaction in the other account.';


-- ── 3. INDEXES ───────────────────────────────────────────────

CREATE INDEX idx_transactions_date          ON transactions (date DESC);
CREATE INDEX idx_transactions_account       ON transactions (account_id);
CREATE INDEX idx_transactions_type_cat      ON transactions (transaction_type, category);
CREATE INDEX idx_transactions_source        ON transactions (source_type);
CREATE INDEX idx_transactions_recurring     ON transactions (is_recurring) WHERE is_recurring = TRUE;
CREATE INDEX idx_transactions_pending       ON transactions (pending)      WHERE pending      = TRUE;
CREATE INDEX idx_transactions_month         ON transactions (date_trunc('month', date::TIMESTAMP));


-- ── 4. UPDATED_AT TRIGGER ────────────────────────────────────

CREATE OR REPLACE FUNCTION fn_set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_transactions_updated_at
  BEFORE UPDATE ON transactions
  FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at();


-- ── 5. ROW LEVEL SECURITY ────────────────────────────────────
--  Enable once Supabase Auth is wired up.
--  Until then, leave RLS off and rely on anon key scoping.

-- ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
-- CREATE POLICY "Users see own transactions"
--   ON transactions FOR ALL
--   USING (auth.uid()::TEXT = user_id);   -- add user_id column when auth is ready


-- ── 6. VERIFICATION ──────────────────────────────────────────
-- SELECT COUNT(*) FROM transactions;
-- SELECT column_name, data_type FROM information_schema.columns
--   WHERE table_name = 'transactions' ORDER BY ordinal_position;
