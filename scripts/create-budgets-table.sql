-- ============================================================
--  WealthLens — Budgets Table
--  Supabase SQL Editor → paste → Run
-- ============================================================

-- ── 1. TABLE ─────────────────────────────────────────────────

CREATE TABLE budgets (

  -- IDENTITY
  id          TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  user_id     UUID,                       -- populated once auth is wired up
  item_type   TEXT NOT NULL               -- 'spending' | 'goal' | 'debt'
                CHECK (item_type IN ('spending', 'goal', 'debt')),

  -- SHARED
  name        TEXT NOT NULL,
  emoji       TEXT NOT NULL DEFAULT '📦',
  color       TEXT NOT NULL DEFAULT '#0a3fa8',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- SPENDING BUDGET FIELDS
  category    TEXT,
  budget_limit NUMERIC(12,2),
  period      TEXT CHECK (period IN ('weekly', 'monthly')),

  -- SAVINGS GOAL FIELDS
  target_amount NUMERIC(14,2),
  saved_amount  NUMERIC(14,2) DEFAULT 0,
  target_date   DATE,

  -- DEBT PAYDOWN FIELDS
  debt_kind         TEXT CHECK (debt_kind IN ('credit_card','auto','mortgage','student','personal','other')),
  current_balance   NUMERIC(14,2),
  interest_rate     NUMERIC(6,3),
  minimum_payment   NUMERIC(12,2),
  monthly_payment   NUMERIC(12,2)
);

COMMENT ON TABLE budgets IS 'Spending limits, savings goals, and debt paydown plans — unified by item_type discriminator.';


-- ── 2. INDEXES ───────────────────────────────────────────────

CREATE INDEX idx_budgets_user      ON budgets (user_id);
CREATE INDEX idx_budgets_item_type ON budgets (item_type);


-- ── 3. UPDATED_AT TRIGGER ────────────────────────────────────

CREATE OR REPLACE FUNCTION fn_set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_budgets_updated_at
  BEFORE UPDATE ON budgets
  FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at();


-- ── 4. ROW LEVEL SECURITY ────────────────────────────────────
--  Uncomment once Supabase Auth is wired up.

-- ALTER TABLE budgets ENABLE ROW LEVEL SECURITY;
-- CREATE POLICY "Users see own budgets"
--   ON budgets FOR ALL
--   USING (auth.uid() = user_id);


-- ── 5. VERIFICATION ──────────────────────────────────────────
-- SELECT column_name, data_type FROM information_schema.columns
--   WHERE table_name = 'budgets' ORDER BY ordinal_position;
