-- ============================================================
--  WealthLens — Recurring Patterns Tables
--  Run AFTER create-transactions-table.sql
--  Supabase SQL Editor → paste → Run
-- ============================================================


-- ── 1. ENUMS ─────────────────────────────────────────────────

CREATE TYPE recurring_pattern_type AS ENUM (
  'subscription',
  'bill',
  'income',
  'transfer',
  'one_time'
);

CREATE TYPE recurring_freq AS ENUM (
  'weekly',
  'biweekly',
  'monthly',
  'quarterly',
  'annual',
  'irregular'
);


-- ── 2. RECURRING PATTERNS ────────────────────────────────────
--  One row per detected recurring merchant/pattern per user.
--  Written by the detection engine after processing transactions.
--  Read directly by forecast and budget logic.

CREATE TABLE recurring_patterns (

  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- IDENTITY
  merchant                TEXT NOT NULL,
  category                TEXT,
  subcategory             TEXT,
  transaction_type        TEXT NOT NULL CHECK (transaction_type IN ('Income', 'Expense', 'Transfer')),
  pattern_type            recurring_pattern_type NOT NULL DEFAULT 'bill',

  -- CLASSIFICATION FLAGS
  is_subscription         BOOLEAN NOT NULL DEFAULT FALSE,
  is_active               BOOLEAN NOT NULL DEFAULT TRUE,

  -- CADENCE
  frequency               recurring_freq NOT NULL,
  average_interval_days   NUMERIC(6,1),

  -- AMOUNTS
  expected_amount         NUMERIC(12,2) NOT NULL,  -- signed: negative = expense, positive = income
  average_amount          NUMERIC(12,2) NOT NULL,
  monthly_equivalent      NUMERIC(12,2),
  annual_equivalent       NUMERIC(12,2),

  -- CONFIDENCE & STABILITY SCORES (0-100)
  confidence              SMALLINT NOT NULL DEFAULT 0 CHECK (confidence BETWEEN 0 AND 100),
  amount_stability_score  SMALLINT CHECK (amount_stability_score BETWEEN 0 AND 100),
  cadence_stability_score SMALLINT CHECK (cadence_stability_score BETWEEN 0 AND 100),
  variability_score       SMALLINT CHECK (variability_score BETWEEN 0 AND 100),

  -- HISTORY
  transaction_count       INTEGER NOT NULL DEFAULT 0,
  total_value             NUMERIC(14,2),
  lifespan_months         INTEGER,
  first_seen_date         DATE,
  last_seen_date          DATE,

  -- FORECAST FIELDS
  next_expected_date      DATE,

  -- AUDIT
  detected_at             TIMESTAMPTZ DEFAULT NOW(),
  updated_at              TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE recurring_patterns IS
  'One row per recurring merchant pattern detected by the engine. Written after detection runs, read by forecast and budget.';
COMMENT ON COLUMN recurring_patterns.expected_amount IS
  'Signed amount matching transaction convention: negative = expense, positive = income.';
COMMENT ON COLUMN recurring_patterns.confidence IS
  'Composite score 0-100: cadence stability (40%) + amount stability (30%) + volume (20%) + base (10%).';


-- ── 3. RECURRING TRANSACTION LINKS ───────────────────────────
--  Join table: which transactions belong to which pattern.
--  Lets you trace "this Netflix charge belongs to pattern X"
--  without storing the full transaction on the pattern row.

CREATE TABLE recurring_transaction_links (
  pattern_id      UUID NOT NULL REFERENCES recurring_patterns(id) ON DELETE CASCADE,
  transaction_id  TEXT NOT NULL REFERENCES transactions(id) ON DELETE CASCADE,
  PRIMARY KEY (pattern_id, transaction_id)
);

COMMENT ON TABLE recurring_transaction_links IS
  'Maps individual transactions to their detected recurring pattern.';


-- ── 4. INDEXES ───────────────────────────────────────────────

CREATE INDEX idx_rp_transaction_type  ON recurring_patterns (transaction_type);
CREATE INDEX idx_rp_pattern_type      ON recurring_patterns (pattern_type);
CREATE INDEX idx_rp_is_active         ON recurring_patterns (is_active) WHERE is_active = TRUE;
CREATE INDEX idx_rp_is_subscription   ON recurring_patterns (is_subscription) WHERE is_subscription = TRUE;
CREATE INDEX idx_rp_next_expected     ON recurring_patterns (next_expected_date);
CREATE INDEX idx_rp_merchant          ON recurring_patterns (merchant);
CREATE INDEX idx_rtl_transaction      ON recurring_transaction_links (transaction_id);


-- ── 5. UNIQUE CONSTRAINT ─────────────────────────────────────
--  Prevents duplicate patterns for the same merchant + type combo.
--  Enables ON CONFLICT upsert from the detection engine.

CREATE UNIQUE INDEX idx_rp_merchant_type_unique
  ON recurring_patterns (merchant, transaction_type);


-- ── 6. UPDATED_AT TRIGGER ────────────────────────────────────

CREATE TRIGGER trg_recurring_patterns_updated_at
  BEFORE UPDATE ON recurring_patterns
  FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at();


-- ── 7. ROW LEVEL SECURITY ────────────────────────────────────
--  Enable once auth is wired.

-- ALTER TABLE recurring_patterns         ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE recurring_transaction_links ENABLE ROW LEVEL SECURITY;


-- ── 8. VERIFICATION ──────────────────────────────────────────
-- SELECT COUNT(*) FROM recurring_patterns;
-- SELECT pattern_type, COUNT(*) FROM recurring_patterns GROUP BY 1;
