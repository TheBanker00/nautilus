/**
 * Phase 3 Recurring Intelligence
 *
 * Runs AFTER calculateRecurringTransactions() to enrich each pattern with:
 *   - Price change detection (step-change in amountHistory)
 *   - Cancellation scoring (likelihood the subscription/bill was cancelled)
 *   - Trial detection (very new, few charges, short lifespan)
 *
 * Usage:
 *   const patterns = calculateRecurringTransactions(transactions);
 *   const enriched = analyzeRecurringPatterns(patterns);
 *   await saveRecurringPatterns(enriched);
 */

import { RecurringClassification } from '../cashflow/analytics/calculaterecurringtransactions';

/* ─────────────────────────────────────────────────────────────
   INTERNAL HELPERS
───────────────────────────────────────────────────────────── */

function mean(values: number[]): number {
  if (!values.length) return 0;
  return values.reduce((a, b) => a + b, 0) / values.length;
}

function stdDev(values: number[]): number {
  if (values.length < 2) return 0;
  const avg = mean(values);
  return Math.sqrt(
    values.reduce((s, v) => s + Math.pow(v - avg, 2), 0) / values.length
  );
}

function parseLocalDate(dateStr: string): Date {
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(y, m - 1, d);
}

function toISODate(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function daysBetween(a: Date, b: Date): number {
  return Math.abs((a.getTime() - b.getTime()) / (1000 * 60 * 60 * 24));
}

/* ─────────────────────────────────────────────────────────────
   1. PRICE CHANGE DETECTION
───────────────────────────────────────────────────────────── */

/**
 * Scans amountHistory for a statistically significant step change.
 *
 * Algorithm:
 *   - Need at least 4 data points to make a meaningful comparison
 *   - Slide a window across the series looking for the point where
 *     the mean before vs after diverges most
 *   - Confirm the divergence is real: before-std and after-std must
 *     both be low relative to the gap (ruling out high-variance patterns)
 *   - Report if the gap is ≥5% of the pre-change mean
 */
function detectPriceChange(
  pattern: RecurringClassification
): RecurringClassification['priceChange'] {
  const history = pattern.amountHistory;
  if (history.length < 4) return undefined;

  let bestBreakpoint = -1;
  let bestGap = 0;

  // Slide breakpoint from index 2 to n-2 (need at least 2 on each side)
  for (let i = 2; i < history.length - 1; i++) {
    const before = history.slice(0, i);
    const after  = history.slice(i);

    const gap = Math.abs(mean(after) - mean(before));
    if (gap > bestGap) {
      bestGap = gap;
      bestBreakpoint = i;
    }
  }

  if (bestBreakpoint === -1) return undefined;

  const before = history.slice(0, bestBreakpoint);
  const after  = history.slice(bestBreakpoint);

  const avgBefore = mean(before);
  const avgAfter  = mean(after);
  const changePct = ((avgAfter - avgBefore) / Math.max(avgBefore, 0.01)) * 100;

  // Must be at least 5% change
  if (Math.abs(changePct) < 5) return undefined;

  // Confirm stability on both sides (std < 15% of mean = price is consistent, not just noisy)
  const stdBefore = stdDev(before);
  const stdAfter  = stdDev(after);
  const noisyBefore = stdBefore / Math.max(avgBefore, 0.01) > 0.20;
  const noisyAfter  = stdAfter  / Math.max(avgAfter,  0.01) > 0.20;

  // Allow noisy amounts only if the gap is very obvious (>20% change)
  if ((noisyBefore || noisyAfter) && Math.abs(changePct) < 20) return undefined;

  // Estimate the date of the breakpoint using the pattern's transaction dates
  const txnDates = pattern.transactions.map(t => t.date).sort();
  const changeDate = txnDates[bestBreakpoint] ?? pattern.lastSeenDate;

  return {
    detected:   true,
    oldAmount:  Math.round(avgBefore * 100) / 100,
    newAmount:  Math.round(avgAfter  * 100) / 100,
    changePct:  Math.round(changePct * 10) / 10,
    changeDate,
    direction:  changePct > 0 ? 'increase' : 'decrease',
  };
}

/* ─────────────────────────────────────────────────────────────
   2. CANCELLATION SCORING
───────────────────────────────────────────────────────────── */

/**
 * Scores 0-100 for probability the recurring pattern is cancelled.
 *
 * Signals weighted additively:
 *   - Already marked inactive by the engine           → +40
 *   - Confidence has decayed significantly             → +20
 *   - Days since last charge >> expected interval     → +30
 *   - Only 1-2 lifetime charges (never really started) → -20 (more likely trial)
 *   - Pattern was once high-confidence (now degraded)  → +10 (confirms it stopped)
 *
 * Result is clamped 0-100. Reason string summarizes the dominant signal.
 */
function scoreCancellation(
  pattern: RecurringClassification,
  priceChangeDetected: boolean,
): { score: number; reason: string } {

  // Active patterns with a detected price change are NOT cancelled —
  // they just changed amount (payroll raise, subscription price change, etc.)
  // Cap score at 10 so they never surface as cancelled in the UI.
  if (pattern.isActive && priceChangeDetected) {
    return { score: 10, reason: 'amount changed — still active' };
  }

  // Income patterns are never flagged as cancelled — an inactive income pattern
  // means the amount changed (raise, job change), not that income stopped.
  if (pattern.transaction_type === 'Income') {
    return { score: 0, reason: 'income — not flagged as cancelled' };
  }

  const intervalDays: Record<string, number> = {
    weekly: 7, biweekly: 14, monthly: 30,
    quarterly: 91, annual: 365, irregular: 60,
  };
  const expected = intervalDays[pattern.frequency] ?? 30;
  const daysSinceLast = daysBetween(new Date(), parseLocalDate(pattern.lastSeenDate));

  let score = 0;
  const signals: string[] = [];

  // Not active
  if (!pattern.isActive) {
    score += 40;
    signals.push('no recent charge');
  }

  // Confidence degraded
  if (pattern.confidence < 40) {
    score += 20;
    signals.push('confidence degraded');
  } else if (pattern.confidence < 60) {
    score += 10;
  }

  // Overdue by more than 2× expected interval
  const overdueFactor = daysSinceLast / expected;
  if (overdueFactor > 3) {
    score += 30;
    signals.push(`${Math.round(overdueFactor)}× overdue`);
  } else if (overdueFactor > 2) {
    score += 20;
    signals.push(`${Math.round(overdueFactor)}× overdue`);
  } else if (overdueFactor > 1.5) {
    score += 10;
  }

  // Penalize very short-lived patterns — more likely trial or one-time than cancellation
  if (pattern.transactionCount <= 2) {
    score = Math.max(0, score - 20);
  }

  // Bonus if it was once a high-confidence pattern (suggests real cancellation, not noise)
  if (pattern.transactionCount >= 6 && !pattern.isActive) {
    score += 10;
    signals.push('established pattern stopped');
  }

  score = Math.min(100, Math.max(0, score));
  const reason = signals.length
    ? signals.join(', ')
    : score < 30
    ? 'likely still active'
    : 'may be inactive';

  return { score, reason };
}

/* ─────────────────────────────────────────────────────────────
   3. TRIAL DETECTION
───────────────────────────────────────────────────────────── */

/**
 * Detects whether a recurring pattern looks like a free trial or promotional period.
 *
 * Criteria (all must be met):
 *   - firstSeenDate within the last 90 days (very new)
 *   - transactionCount ≤ 3 (hasn't accumulated many charges)
 *   - lifespanMonths ≤ 2
 *   - type is 'subscription' (trials are subscription-specific)
 *
 * Estimates trial end date as firstSeen + 30 days (most trials are monthly)
 * and days remaining from today.
 */
function detectTrial(
  pattern: RecurringClassification
): {
  isTrial: boolean;
  trialStartDate?: string;
  estimatedTrialEndDate?: string;
  trialDaysRemaining?: number;
} {
  const isSubscription = pattern.type === 'subscription' || pattern.isSubscription;
  if (!isSubscription) return { isTrial: false };

  const firstSeen     = parseLocalDate(pattern.firstSeenDate);
  const now           = new Date();
  const daysSinceFirst = daysBetween(now, firstSeen);

  const isTrial =
    daysSinceFirst <= 90 &&
    pattern.transactionCount <= 3 &&
    pattern.lifespanMonths <= 2;

  if (!isTrial) return { isTrial: false };

  // Estimate trial window: most are 7, 14, or 30 days; default to 30
  const trialWindowDays =
    pattern.frequency === 'weekly'    ? 7  :
    pattern.frequency === 'biweekly'  ? 14 :
    30;

  const trialEnd = new Date(firstSeen);
  trialEnd.setDate(trialEnd.getDate() + trialWindowDays);

  const daysRemaining = Math.max(
    0,
    Math.round((trialEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
  );

  return {
    isTrial:                true,
    trialStartDate:         pattern.firstSeenDate,
    estimatedTrialEndDate:  toISODate(trialEnd),
    trialDaysRemaining:     daysRemaining,
  };
}

/* ─────────────────────────────────────────────────────────────
   PUBLIC ENTRY POINT
───────────────────────────────────────────────────────────── */

/**
 * Enriches detected recurring patterns with Phase 3 intelligence.
 * Call after calculateRecurringTransactions(), before saving to Supabase.
 */
export function analyzeRecurringPatterns(
  patterns: RecurringClassification[]
): RecurringClassification[] {
  return patterns.map(pattern => {
    const priceChange        = detectPriceChange(pattern);
    const { score: cancellationScore, reason: cancellationReason } =
      scoreCancellation(pattern, priceChange?.detected ?? false);
    const { isTrial, trialStartDate, estimatedTrialEndDate, trialDaysRemaining } =
      detectTrial(pattern);

    return {
      ...pattern,
      priceChange,
      cancellationScore,
      cancellationReason,
      isTrial,
      trialStartDate,
      estimatedTrialEndDate,
      trialDaysRemaining,
    };
  });
}
