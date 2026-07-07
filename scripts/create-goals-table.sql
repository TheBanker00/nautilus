-- ============================================================
--  WealthLens — Goals Table
--  Supabase SQL Editor → paste → Run
-- ============================================================

-- ── 1. TABLE ─────────────────────────────────────────────────

CREATE TABLE goals (

  -- IDENTITY
  id                  TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  user_id             UUID,            -- populated once auth is wired up

  -- CORE FIELDS
  category            TEXT NOT NULL,   -- GoalCategoryKey
  name                TEXT NOT NULL,
  emoji               TEXT NOT NULL DEFAULT '⭐',
  color               TEXT NOT NULL DEFAULT '#0a3fa8',
  target_amount       NUMERIC(14,2) NOT NULL DEFAULT 0,
  current_saved       NUMERIC(14,2) NOT NULL DEFAULT 0,
  monthly_contrib     NUMERIC(12,2) NOT NULL DEFAULT 0,
  target_date         DATE,
  notes               TEXT,

  -- HOME-SPECIFIC
  home_price          NUMERIC(14,2),
  down_payment_pct    NUMERIC(5,2),

  -- EDUCATION-SPECIFIC
  child_name          TEXT,
  child_age           SMALLINT,

  -- EMERGENCY-SPECIFIC
  emergency_months    SMALLINT CHECK (emergency_months IN (3, 6, 12)),

  -- AUDIT
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at        TIMESTAMPTZ,
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE goals IS 'User-defined life goals — home purchase, emergency fund, retirement milestone, etc.';


-- ── 2. INDEXES ───────────────────────────────────────────────

CREATE INDEX idx_goals_user     ON goals (user_id);
CREATE INDEX idx_goals_category ON goals (category);
CREATE INDEX idx_goals_date     ON goals (target_date);


-- ── 3. UPDATED_AT TRIGGER ────────────────────────────────────

-- Re-uses fn_set_updated_at() created by create-transactions-table.sql.
-- If running this script standalone, create the function first:

CREATE OR REPLACE FUNCTION fn_set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_goals_updated_at
  BEFORE UPDATE ON goals
  FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at();


-- ── 4. ROW LEVEL SECURITY ────────────────────────────────────
--  Uncomment once Supabase Auth is wired up.

-- ALTER TABLE goals ENABLE ROW LEVEL SECURITY;
-- CREATE POLICY "Users see own goals"
--   ON goals FOR ALL
--   USING (auth.uid() = user_id);


-- ── 5. VERIFICATION ──────────────────────────────────────────
-- SELECT column_name, data_type FROM information_schema.columns
--   WHERE table_name = 'goals' ORDER BY ordinal_position;
