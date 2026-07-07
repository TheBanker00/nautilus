-- ============================================================
--  WealthLens — Recurring Intelligence Phase 4
--  Anomaly persistence table + annual rollup view
--  Run AFTER create-recurring-tables.sql
--  Supabase SQL Editor → paste → Run
-- ============================================================


-- ── 1. ANOMALIES TABLE ───────────────────────────────────────
--  Persists flagged anomalies so users can review and dismiss them.
--  Re-running the engine will upsert — resolved anomalies are not
--  re-created unless the condition is detected again.

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

  -- User resolution
  is_resolved      BOOLEAN DEFAULT FALSE,
  resolved_at      TIMESTAMPTZ,
  resolution_note  TEXT,

  -- Audit
  detected_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at       TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE recurring_anomalies IS
  'Flagged transaction anomalies: spikes, duplicates, unexpected charges, charges from cancelled subscriptions.';


-- ── 2. INDEXES ───────────────────────────────────────────────

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

-- Unique index: prevent duplicate anomaly rows for the same transaction + type
CREATE UNIQUE INDEX IF NOT EXISTS idx_anomaly_txn_type_unique
  ON recurring_anomalies (transaction_id, anomaly_type)
  WHERE transaction_id IS NOT NULL;


-- ── 3. UPDATED_AT TRIGGER ────────────────────────────────────

CREATE TRIGGER trg_anomalies_updated_at
  BEFORE UPDATE ON recurring_anomalies
  FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at();


-- ── 4. ANNUAL ROLLUP VIEW ────────────────────────────────────
--  Convenience view for the dashboard annual cost card.
--  Reads live from recurring_patterns — no separate table needed.

CREATE OR REPLACE VIEW recurring_annual_rollup AS
SELECT
  transaction_type,
  pattern_type,
  COUNT(*)                    AS pattern_count,
  SUM(annual_equivalent)      AS total_annual,
  SUM(monthly_equivalent)     AS total_monthly,
  ROUND(AVG(confidence), 0)   AS avg_confidence
FROM recurring_patterns
WHERE is_active = TRUE
  AND pattern_type <> 'one_time'
GROUP BY transaction_type, pattern_type
ORDER BY total_annual DESC;

COMMENT ON VIEW recurring_annual_rollup IS
  'Live annual cost summary by pattern type. Used by the annual cost rollup dashboard card.';


-- ── 5. SUBSCRIPTION OVERLAP VIEW ────────────────────────────
--  Groups active subscriptions by category for overlap detection.

CREATE OR REPLACE VIEW subscription_by_category AS
SELECT
  category,
  COUNT(*)                  AS subscription_count,
  SUM(monthly_equivalent)   AS total_monthly,
  SUM(annual_equivalent)    AS total_annual,
  ARRAY_AGG(merchant ORDER BY monthly_equivalent DESC) AS merchants
FROM recurring_patterns
WHERE is_active      = TRUE
  AND is_subscription = TRUE
  AND transaction_type = 'Expense'
  AND category IS NOT NULL
GROUP BY category
HAVING COUNT(*) >= 2
ORDER BY total_annual DESC;

COMMENT ON VIEW subscription_by_category IS
  'Categories where the user has 2+ active subscriptions — potential overlap candidates.';


-- ── 6. RLS (enable once auth is wired) ──────────────────────
-- ALTER TABLE recurring_anomalies ENABLE ROW LEVEL SECURITY;


-- ── 7. VERIFICATION ──────────────────────────────────────────
-- SELECT * FROM recurring_annual_rollup;
-- SELECT * FROM subscription_by_category;
-- SELECT anomaly_type, severity, merchant, description FROM recurring_anomalies
--   WHERE is_resolved = FALSE ORDER BY severity DESC, anomaly_date DESC;
