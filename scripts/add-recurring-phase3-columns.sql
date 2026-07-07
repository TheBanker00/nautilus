-- ============================================================
--  WealthLens — Recurring Patterns: Phase 3 Columns
--  Run AFTER create-recurring-tables.sql
--  Supabase SQL Editor → paste → Run
-- ============================================================
--
--  Adds price change detection, cancellation scoring, and
--  trial detection fields to recurring_patterns.
-- ============================================================


-- ── 1. PRICE CHANGE DETECTION ────────────────────────────────
--  Set when the engine detects a step-change in amount history.

ALTER TABLE recurring_patterns
  ADD COLUMN IF NOT EXISTS price_change_detected  BOOLEAN        DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS price_change_old        NUMERIC(12,2),  -- avg amount before change
  ADD COLUMN IF NOT EXISTS price_change_new        NUMERIC(12,2),  -- avg amount after change
  ADD COLUMN IF NOT EXISTS price_change_pct        NUMERIC(6,2),   -- % change (positive = increase)
  ADD COLUMN IF NOT EXISTS price_change_date       DATE,           -- approximate date of breakpoint
  ADD COLUMN IF NOT EXISTS price_change_direction  TEXT
    CHECK (price_change_direction IN ('increase', 'decrease'));

COMMENT ON COLUMN recurring_patterns.price_change_detected  IS 'True if a statistically significant price step-change was detected in amountHistory.';
COMMENT ON COLUMN recurring_patterns.price_change_pct       IS 'Positive = price went up, negative = price went down.';


-- ── 2. CANCELLATION SCORING ──────────────────────────────────
--  0-100 score for likelihood the pattern was cancelled.
--  High = long overdue + confidence decayed + was once established.

ALTER TABLE recurring_patterns
  ADD COLUMN IF NOT EXISTS cancellation_score   SMALLINT
    CHECK (cancellation_score BETWEEN 0 AND 100),
  ADD COLUMN IF NOT EXISTS cancellation_reason  TEXT;

COMMENT ON COLUMN recurring_patterns.cancellation_score  IS '0-100: probability this recurring pattern was cancelled. >70 = likely cancelled.';
COMMENT ON COLUMN recurring_patterns.cancellation_reason IS 'Human-readable summary of signals driving the cancellation score.';


-- ── 3. TRIAL DETECTION ───────────────────────────────────────
--  Flags subscriptions that look like free trials or promos:
--  very new, ≤3 charges, lifespan ≤2 months.

ALTER TABLE recurring_patterns
  ADD COLUMN IF NOT EXISTS is_trial              BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS trial_start_date      DATE,
  ADD COLUMN IF NOT EXISTS trial_end_date        DATE,    -- estimated end of trial window
  ADD COLUMN IF NOT EXISTS trial_days_remaining  SMALLINT;

COMMENT ON COLUMN recurring_patterns.is_trial             IS 'True if this subscription looks like a free trial or promotional period.';
COMMENT ON COLUMN recurring_patterns.trial_days_remaining IS 'Estimated days until trial ends. 0 = trial likely over.';


-- ── 4. INDEXES ───────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_rp_price_change
  ON recurring_patterns (price_change_detected)
  WHERE price_change_detected = TRUE;

CREATE INDEX IF NOT EXISTS idx_rp_cancellation
  ON recurring_patterns (cancellation_score)
  WHERE cancellation_score >= 70;

CREATE INDEX IF NOT EXISTS idx_rp_trial
  ON recurring_patterns (is_trial)
  WHERE is_trial = TRUE;


-- ── 5. VERIFICATION ──────────────────────────────────────────
-- SELECT merchant, price_change_pct, price_change_direction
--   FROM recurring_patterns WHERE price_change_detected = TRUE;
-- SELECT merchant, cancellation_score, cancellation_reason
--   FROM recurring_patterns WHERE cancellation_score >= 70 ORDER BY cancellation_score DESC;
-- SELECT merchant, trial_start_date, trial_end_date, trial_days_remaining
--   FROM recurring_patterns WHERE is_trial = TRUE;
