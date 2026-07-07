# Recurring Engine Audit

## Files KEPT (active, production)

| File | Role |
|------|------|
| `calculaterecurringtransactions.ts` | Main detection engine — groups by normalized merchant, scores cadence/amount stability, classifies type, predicts next date |
| `normalizemerchant.ts` | Shared fuzzy normalization — used by detection engine and tag application for consistent grouping |
| `applyrecurringtags.ts` | Stamps `isRecurring`, `isSubscription`, `nextExpectedDate`, etc. on individual transactions after detection |
| `saverecurringpatterns.ts` | Persists detected patterns to Supabase `recurring_patterns` table; loads them back for forecast/budget |

## Files DELETED (dead — no live importers)

| File | Why deleted |
|------|-------------|
| `calculaterecurringanalytics.ts` | No importers; analytics now derived from `RecurringClassification` directly |
| `calculaterecurringcategories.ts` | No importers; category logic absorbed into main engine |
| `calculaterecurringforecast.ts` | No importers; forecast reads `recurring_patterns` via `saverecurringpatterns.ts` |
| `buildrecurringsnapshot.ts` | No importers; only imported from `classifyrecurring.ts` (also dead) |
| `classifyrecurring.ts` | No importers outside dead cluster |
| `deterministicrecurringclassifier.ts` | No importers outside dead cluster |
| `detectrecurringcadence.ts` | Only imported by `classifyrecurring.ts` (dead) |
| `detectsubscriptionclusters.ts` | No importers |
| `DeleteFile.ts` | Placeholder stub, no importers |

## Phase 1+2 improvements landed in main engine

- **Fuzzy merchant normalization** — `normalizeMerchantName()` used for grouping; "NETFLIX*", "Netflix.com", "Netflix Inc 12345" all merge into one pattern
- **Per-frequency cadence tolerance** — weekly ±3d, biweekly ±5d, monthly ±8d, quarterly ±15d, annual ±30d (vs flat 8d for all)
- **Minimum transaction thresholds per frequency** — annual needs only 1 occurrence; known subscriptions need only 1
- **Month overflow fix** — `addMonthsSafe()` prevents Jan 31 → Mar 3 drift
- **Day-of-month anchoring** — monthly predictions snap to the preferred day-of-month from history
- **Day-of-week anchoring** — weekly predictions snap to preferred day-of-week
- **Confidence decay** — patterns stale beyond 2× their interval gradually lose confidence (floor 30%)
- **amountHistory field** — full chronological amount array preserved for price change detection (Phase 3)
- **firstSeenDate field** — enables lifespan-based scoring and trial detection (Phase 3)
- **merchantKey field** — normalized key stored alongside display name for consistent downstream matching
- **Monthly equivalent correction** — proper multipliers per frequency (weekly×4.33, biweekly×2.17, quarterly÷3, annual÷12)
- **Activity window per frequency** — annual patterns active up to 500 days; weekly up to 21 days

## Phase 3 — COMPLETE

| File | Role |
|------|------|
| `analyzerecurringpatterns.ts` | Post-detection enrichment: price change detection, cancellation scoring, trial detection |
| `scripts/add-recurring-phase3-columns.sql` | SQL migration — adds 12 new columns to `recurring_patterns` |

**Signals implemented:**

**Price change detection** — scans `amountHistory` for a step-change breakpoint using sliding-window mean comparison. Requires ≥4 data points, ≥5% divergence, stable amounts on both sides. Reports `oldAmount`, `newAmount`, `changePct`, `changeDate`, `direction`.

**Cancellation scoring** (0-100) — weighted additive model:
- Not active → +40
- Confidence < 40 → +20
- Days since last charge > 3× expected interval → +30
- Established pattern (≥6 charges) that stopped → +10
- Only 1-2 charges (never really started) → -20

**Trial detection** — flags subscriptions where `firstSeenDate` is within 90 days, ≤3 charges, lifespan ≤2 months. Estimates trial window (7/14/30 days based on frequency) and remaining days.

**Usage:**
```ts
const patterns  = calculateRecurringTransactions(transactions);
const enriched  = analyzeRecurringPatterns(patterns);  // Phase 3
await saveRecurringPatterns(enriched);
```

## Phase 4 — COMPLETE

| File | Role |
|------|------|
| `phase4insights.ts` | Four portfolio-level analyses: annual rollup, overlap detection, income variance, anomaly detection |
| `scripts/add-recurring-phase4.sql` | `recurring_anomalies` table + `recurring_annual_rollup` view + `subscription_by_category` view |
| `saverecurringpatterns.ts` | Added `saveAnomalies()` and `loadAnomalies()` for anomaly persistence |

### Annual Cost Rollup (`buildAnnualCostRollup`)
Aggregates active patterns into total annual spend (subscriptions vs bills), per-category breakdown, and a 12-month forward projection. Handles quarterly and annual patterns that don't fire every month.

### Subscription Overlap Detection (`detectSubscriptionOverlap`)
Groups active subscriptions into purpose buckets (Video Streaming, Music, Cloud Storage, Fitness, Gaming, Food Delivery, News/Reading). Flags any bucket with ≥2 active subscriptions. Reports redundancy score, total annual waste, and a specific recommendation naming the cheapest service to keep.

### Income Variance Analysis (`analyzeIncomeVariance`)
Per-source analysis: monthly amounts, mean, std dev, coefficient of variation, trend (stable/growing/declining/volatile), missed payments vs expected frequency, YTD total, projected annual total. Portfolio-level: overall volatility score, primary income source, concentration risk (% from single source — high = fragile income).

### Anomaly Detection (`detectAnomalies`)
Four anomaly types:
- **amount_spike** — charge >3σ above pattern mean
- **amount_drop** — income deposit >3σ below expected
- **duplicate_charge** — same merchant + amount within 48h
- **charge_after_cancel** — charge from a pattern with cancellation_score ≥70
- **unexpected_charge** — ≥$50 charge from a merchant with no established pattern

Deduplicates per transaction (highest severity wins). Persisted to `recurring_anomalies` table via `saveAnomalies()`.

### Full engine pipeline
```ts
const detected  = calculateRecurringTransactions(transactions);   // Phase 1+2
const enriched  = analyzeRecurringPatterns(detected);              // Phase 3
await saveRecurringPatterns(enriched);

const rollup    = buildAnnualCostRollup(enriched);
const overlaps  = detectSubscriptionOverlap(enriched);
const income    = analyzeIncomeVariance(transactions, enriched);
const anomalies = detectAnomalies(transactions, enriched);
await saveAnomalies(anomalies.anomalies);
```
