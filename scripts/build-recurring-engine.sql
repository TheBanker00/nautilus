-- ============================================================
--  WealthLens — Recurring Engine: Complete Build Script
--
--  Builds everything the recurring engine needs in one pass.
--  Run AFTER create-transactions-table.sql (transactions table
--  must already exist — recurring_transaction_links and
--  recurring_anomalies both reference transactions.id).
--
--  Safe to run on a fresh database — uses CREATE IF NOT EXISTS
--  and CREATE OR REPLACE throughout.
--
--  Supabase SQL Editor → paste entire file → Run
-- ============================================================


-- ════════════════════════════════════════════════════════════
--  SECTION 1 — SHARED TRIGGER FUNCTION
--  fn_set_updated_at() may already exist from transactions.
--  CREATE OR REPLACE is safe either way.
-- ════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION fn_set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;


-- ════════════════════════════════════════════════════════════
--  SECTION 2 — ENUM TYPES
--
--  DO block guards against "type already exists" errors so
--  the script is safe to re-run.
-- ════════════════════════════════════════════════════════════

DO $$ BEGIN
  CREATE TYPE recurring_pattern_type AS ENUM (
    'subscription',
    'bill',
    'income',
    'transfer',
    'one_time'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE recurring_freq AS ENUM (
    'weekly',
    'biweekly',
    'monthly',
    'quarterly',
    'annual',
    'irregular'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;


-- ════════════════════════════════════════════════════════════
--  SECTION 3 — RECURRING PATTERNS
--
--  One row per detected recurring merchant/pattern per user.
--  Written by the detection engine after processing transactions.
--  Read directly by forecast, budget, and dashboard logic.
--
--  Includes all Phase 1+2+3 columns — no ALTER steps needed.
-- ════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS recurring_patterns (

  id                       UUID    PRIMARY KEY DEFAULT gen_random_uuid(),

  -- ── IDENTITY ────────────────────────────────────────────
  merchant                 TEXT    NOT NULL,
  merchant_key             TEXT,                  -- normalized key used for grouping/matching
  category                 TEXT,
  subcategory              TEXT,
  transaction_type         TEXT    NOT NULL
    CHECK (transaction_type IN ('Income', 'Expense', 'Transfer')),
  pattern_type             recurring_pattern_type NOT NULL DEFAULT 'bill',

  -- ── CLASSIFICATION FLAGS ────────────────────────────────
  is_subscription          BOOLEAN NOT NULL DEFAULT FALSE,
  is_active                BOOLEAN NOT NULL DEFAULT TRUE,

  -- ── CADENCE ─────────────────────────────────────────────
  frequency                recurring_freq NOT NULL,
  average_interval_days    NUMERIC(6,1),

  -- ── AMOUNTS ─────────────────────────────────────────────
  --  Stored as absolute values; transaction_type gives direction.
  expected_amount          NUMERIC(12,2) NOT NULL,
  average_amount           NUMERIC(12,2) NOT NULL,
  monthly_equivalent       NUMERIC(12,2),
  annual_equivalent        NUMERIC(12,2),

  --  Full chronological amount history — enables DB-side price analysis
  --  and audit without re-running the TypeScript engine.
  amount_history           NUMERIC(12,2)[],

  -- ── CONFIDENCE & STABILITY SCORES (0–100) ───────────────
  confidence               SMALLINT NOT NULL DEFAULT 0
    CHECK (confidence               BETWEEN 0 AND 100),
  amount_stability_score   SMALLINT
    CHECK (amount_stability_score   BETWEEN 0 AND 100),
  cadence_stability_score  SMALLINT
    CHECK (cadence_stability_score  BETWEEN 0 AND 100),
  variability_score        SMALLINT
    CHECK (variability_score        BETWEEN 0 AND 100),

  -- ── HISTORY ─────────────────────────────────────────────
  transaction_count        INTEGER  NOT NULL DEFAULT 0,
  total_value              NUMERIC(14,2),
  lifespan_months          INTEGER,
  first_seen_date          DATE,
  last_seen_date           DATE,

  -- ── FORECAST ────────────────────────────────────────────
  next_expected_date       DATE,

  -- ── PHASE 3: PRICE CHANGE DETECTION ────────────────────
  --  Populated when engine detects a statistically significant
  --  step-change in amount_history (≥5% gap, ≥4 data points).
  price_change_detected    BOOLEAN  DEFAULT FALSE,
  price_change_old         NUMERIC(12,2),      -- avg amount before breakpoint
  price_change_new         NUMERIC(12,2),      -- avg amount after breakpoint
  price_change_pct         NUMERIC(6,2),       -- positive = price increase
  price_change_date        DATE,               -- approximate date of breakpoint
  price_change_direction   TEXT
    CHECK (price_change_direction IN ('increase', 'decrease')),

  -- ── PHASE 3: CANCELLATION SCORING ──────────────────────
  --  0–100. >70 = likely cancelled.
  --  Signals: overdue, confidence decayed, was once established.
  cancellation_score       SMALLINT
    CHECK (cancellation_score BETWEEN 0 AND 100),
  cancellation_reason      TEXT,

  -- ── PHASE 3: TRIAL DETECTION ────────────────────────────
  --  Flags subscriptions that look like free trials:
  --  very new, ≤3 charges, lifespan ≤2 months.
  is_trial                 BOOLEAN  DEFAULT FALSE,
  trial_start_date         DATE,
  trial_end_date           DATE,               -- estimated end of trial window
  trial_days_remaining     SMALLINT,

  -- ── AUDIT ───────────────────────────────────────────────
  detected_at              TIMESTAMPTZ DEFAULT NOW(),
  updated_at               TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE recurring_patterns IS
  'One row per recurring merchant pattern detected by the engine. '
  'Written after detection runs; read by forecast, budget, and dashboard.';

COMMENT ON COLUMN recurring_patterns.merchant_key IS
  'Normalized merchant key (lowercased, stripped of legal suffixes/numbers). '
  'Same normalization used by the TypeScript engine for consistent grouping.';
COMMENT ON COLUMN recurring_patterns.expected_amount IS
  'Absolute value. Use transaction_type to determine direction.';
COMMENT ON COLUMN recurring_patterns.amount_history IS
  'Chronological array of absolute charge amounts. Enables DB-side price trend queries.';
COMMENT ON COLUMN recurring_patterns.confidence IS
  'Composite 0-100: cadence stability (40%) + amount stability (30%) + volume (20%) + base (10%). '
  'Decays when pattern is stale.';
COMMENT ON COLUMN recurring_patterns.price_change_pct IS
  'Positive = price went up, negative = price went down.';
COMMENT ON COLUMN recurring_patterns.cancellation_score IS
  '0-100 probability this pattern was cancelled. >70 = likely cancelled.';
COMMENT ON COLUMN recurring_patterns.is_trial IS
  'True if this subscription looks like a free trial or promotional period.';


-- ════════════════════════════════════════════════════════════
--  SECTION 4 — RECURRING TRANSACTION LINKS
--
--  Join table: which transactions belong to which pattern.
--  Lets you trace "this Netflix charge belongs to pattern X"
--  without storing the full transaction on the pattern row.
-- ════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS recurring_transaction_links (
  pattern_id      UUID NOT NULL REFERENCES recurring_patterns(id) ON DELETE CASCADE,
  transaction_id  TEXT NOT NULL REFERENCES transactions(id)       ON DELETE CASCADE,
  PRIMARY KEY (pattern_id, transaction_id)
);

COMMENT ON TABLE recurring_transaction_links IS
  'Maps individual transactions to their detected recurring pattern.';


-- ════════════════════════════════════════════════════════════
--  SECTION 5 — RECURRING ANOMALIES
--
--  Persists engine-detected anomalies so users can review
--  and dismiss them from the dashboard.
--  Re-running the engine upserts — resolved anomalies are not
--  re-created unless the condition is detected again.
-- ════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS recurring_anomalies (

  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  anomaly_type     TEXT NOT NULL CHECK (anomaly_type IN (
                     'amount_spike',
                     'amount_drop',
                     'duplicate_charge',
                     'charge_after_cancel',
                     'unexpected_charge'
                   )),

  severity         TEXT NOT NULL CHECK (severity IN ('low', 'medium', 'high')),

  merchant         TEXT NOT NULL,
  transaction_id   TEXT REFERENCES transactions(id) ON DELETE SET NULL,

  amount           NUMERIC(12,2),
  expected_amount  NUMERIC(12,2),
  deviation_pct    NUMERIC(6,2),

  description      TEXT NOT NULL,
  anomaly_date     DATE NOT NULL,

  -- User resolution workflow
  is_resolved      BOOLEAN     DEFAULT FALSE,
  resolved_at      TIMESTAMPTZ,
  resolution_note  TEXT,

  -- Audit
  detected_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at       TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE recurring_anomalies IS
  'Flagged transaction anomalies: amount spikes, duplicate charges, '
  'unexpected charges, and charges from apparently cancelled subscriptions.';
COMMENT ON COLUMN recurring_anomalies.is_resolved IS
  'Set to TRUE when user reviews and dismisses the anomaly from the dashboard.';


-- ════════════════════════════════════════════════════════════
--  SECTION 6 — INDEXES
-- ════════════════════════════════════════════════════════════

-- recurring_patterns
CREATE INDEX IF NOT EXISTS idx_rp_transaction_type
  ON recurring_patterns (transaction_type);

CREATE INDEX IF NOT EXISTS idx_rp_pattern_type
  ON recurring_patterns (pattern_type);

CREATE INDEX IF NOT EXISTS idx_rp_is_active
  ON recurring_patterns (is_active)
  WHERE is_active = TRUE;

CREATE INDEX IF NOT EXISTS idx_rp_is_subscription
  ON recurring_patterns (is_subscription)
  WHERE is_subscription = TRUE;

CREATE INDEX IF NOT EXISTS idx_rp_next_expected
  ON recurring_patterns (next_expected_date);

CREATE INDEX IF NOT EXISTS idx_rp_merchant
  ON recurring_patterns (merchant);

CREATE INDEX IF NOT EXISTS idx_rp_merchant_key
  ON recurring_patterns (merchant_key);

-- Phase 3 indexes
CREATE INDEX IF NOT EXISTS idx_rp_price_change
  ON recurring_patterns (price_change_detected)
  WHERE price_change_detected = TRUE;

CREATE INDEX IF NOT EXISTS idx_rp_cancellation
  ON recurring_patterns (cancellation_score)
  WHERE cancellation_score >= 70;

CREATE INDEX IF NOT EXISTS idx_rp_trial
  ON recurring_patterns (is_trial)
  WHERE is_trial = TRUE;

-- recurring_transaction_links
CREATE INDEX IF NOT EXISTS idx_rtl_transaction
  ON recurring_transaction_links (transaction_id);

-- recurring_anomalies
CREATE INDEX IF NOT EXISTS idx_anomaly_severity
  ON recurring_anomalies (severity)
  WHERE is_resolved = FALSE;

CREATE INDEX IF NOT EXISTS idx_anomaly_merchant
  ON recurring_anomalies (merchant);

CREATE INDEX IF NOT EXISTS idx_anomaly_date
  ON recurring_anomalies (anomaly_date DESC);

CREATE INDEX IF NOT EXISTS idx_anomaly_unresolved
  ON recurring_anomalies (is_resolved)
  WHERE is_resolved = FALSE;


-- ════════════════════════════════════════════════════════════
--  SECTION 7 — UNIQUE CONSTRAINTS
-- ════════════════════════════════════════════════════════════

-- Prevents duplicate patterns for the same merchant + type.
-- This is the ON CONFLICT target for the TypeScript upsert.
CREATE UNIQUE INDEX IF NOT EXISTS idx_rp_merchant_type_unique
  ON recurring_patterns (merchant, transaction_type);

-- Prevents duplicate anomaly rows for the same transaction + type.
CREATE UNIQUE INDEX IF NOT EXISTS idx_anomaly_txn_type_unique
  ON recurring_anomalies (transaction_id, anomaly_type)
  WHERE transaction_id IS NOT NULL;


-- ════════════════════════════════════════════════════════════
--  SECTION 8 — UPDATED_AT TRIGGERS
-- ════════════════════════════════════════════════════════════

DROP TRIGGER IF EXISTS trg_recurring_patterns_updated_at ON recurring_patterns;
CREATE TRIGGER trg_recurring_patterns_updated_at
  BEFORE UPDATE ON recurring_patterns
  FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at();

DROP TRIGGER IF EXISTS trg_anomalies_updated_at ON recurring_anomalies;
CREATE TRIGGER trg_anomalies_updated_at
  BEFORE UPDATE ON recurring_anomalies
  FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at();


-- ════════════════════════════════════════════════════════════
--  SECTION 9 — VIEWS
-- ════════════════════════════════════════════════════════════

-- Annual cost rollup — powers the dashboard annual cost card.
-- Reads live from recurring_patterns; no separate table needed.
CREATE OR REPLACE VIEW recurring_annual_rollup AS
SELECT
  transaction_type,
  pattern_type,
  COUNT(*)                         AS pattern_count,
  SUM(annual_equivalent)           AS total_annual,
  SUM(monthly_equivalent)          AS total_monthly,
  ROUND(AVG(confidence)::NUMERIC, 0) AS avg_confidence
FROM recurring_patterns
WHERE is_active      = TRUE
  AND pattern_type  <> 'one_time'
GROUP BY transaction_type, pattern_type
ORDER BY total_annual DESC;

COMMENT ON VIEW recurring_annual_rollup IS
  'Live annual cost summary by type. Used by the annual cost rollup dashboard card.';


-- Subscription overlap — categories with 2+ active subscriptions.
-- Powers the overlap detection card and the TypeScript detectSubscriptionOverlap().
CREATE OR REPLACE VIEW subscription_by_category AS
SELECT
  category,
  COUNT(*)                                              AS subscription_count,
  SUM(monthly_equivalent)                               AS total_monthly,
  SUM(annual_equivalent)                                AS total_annual,
  ARRAY_AGG(merchant ORDER BY monthly_equivalent DESC)  AS merchants
FROM recurring_patterns
WHERE is_active       = TRUE
  AND is_subscription = TRUE
  AND transaction_type = 'Expense'
  AND category IS NOT NULL
GROUP BY category
HAVING COUNT(*) >= 2
ORDER BY total_annual DESC;

COMMENT ON VIEW subscription_by_category IS
  'Categories where the user has 2+ active subscriptions — overlap detection candidates.';


-- Active anomalies feed — ordered for the dashboard alert panel.
CREATE OR REPLACE VIEW active_anomalies AS
SELECT
  id,
  anomaly_type,
  severity,
  merchant,
  transaction_id,
  amount,
  expected_amount,
  deviation_pct,
  description,
  anomaly_date,
  detected_at
FROM recurring_anomalies
WHERE is_resolved = FALSE
ORDER BY
  CASE severity WHEN 'high' THEN 1 WHEN 'medium' THEN 2 ELSE 3 END,
  anomaly_date DESC;

COMMENT ON VIEW active_anomalies IS
  'Unresolved anomalies ordered by severity then date. Used by the dashboard alert feed.';


-- ════════════════════════════════════════════════════════════
--  SECTION 10 — ROW LEVEL SECURITY (disabled until auth wired)
--
--  Uncomment and run after Supabase Auth is connected
--  and user_id columns are added to each table.
-- ════════════════════════════════════════════════════════════

-- ALTER TABLE recurring_patterns         ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE recurring_transaction_links ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE recurring_anomalies        ENABLE ROW LEVEL SECURITY;


-- ════════════════════════════════════════════════════════════
--  SECTION 11 — VERIFICATION QUERIES
--  Uncomment to confirm tables and views were created correctly.
-- ════════════════════════════════════════════════════════════

-- Table row counts
-- SELECT 'recurring_patterns'         AS tbl, COUNT(*) FROM recurring_patterns
-- UNION ALL
-- SELECT 'recurring_transaction_links',       COUNT(*) FROM recurring_transaction_links
-- UNION ALL
-- SELECT 'recurring_anomalies',               COUNT(*) FROM recurring_anomalies;

-- Column list for recurring_patterns
-- SELECT column_name, data_type, is_nullable
-- FROM information_schema.columns
-- WHERE table_name = 'recurring_patterns'
-- ORDER BY ordinal_position;

-- Views
-- SELECT * FROM recurring_annual_rollup;
-- SELECT * FROM subscription_by_category;
-- SELECT * FROM active_anomalies LIMIT 20;
