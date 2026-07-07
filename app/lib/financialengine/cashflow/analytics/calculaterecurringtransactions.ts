import { Transaction } from '../../../types/transactions';
import { SUBSCRIPTION_MERCHANTS } from '../../intelligence/merchanttaxonomy';
import { normalizeMerchantName, getMostCommonName } from '../../recurring/normalizemerchant';

/* ─────────────────────────────────────────────────────────────
   TYPES
───────────────────────────────────────────────────────────── */

export type RecurringClassification = {
  merchant:     string;           // display name (most common raw name in group)
  merchantKey:  string;           // normalized key used for grouping/matching
  category:     Transaction['category'];
  transaction_type: 'Income' | 'Expense' | 'Transfer';

  type: 'subscription' | 'bill' | 'income' | 'transfer' | 'one_time';

  confidence:             number;
  confidenceScore:        number;
  amountStabilityScore:   number;
  cadenceStabilityScore:  number;
  variabilityScore:       number;

  frequency: 'weekly' | 'biweekly' | 'monthly' | 'quarterly' | 'annual' | 'irregular';

  expectedAmount:     number;
  averageAmount:      number;
  monthlyEquivalent:  number;
  annualEquivalent:   number;

  amountHistory:  number[];   // chronological — enables price change detection
  firstSeenDate:  string;
  lastSeenDate:   string;
  lifespanMonths: number;

  isActive:          boolean;
  isSubscription:    boolean;
  nextExpectedDate:  string | null;
  transactionCount:  number;
  totalValue:        number;

  // ── Phase 3 enrichment (populated by analyzeRecurringPatterns) ──
  priceChange?: {
    detected:     boolean;
    oldAmount:    number;
    newAmount:    number;
    changePct:    number;       // positive = price went up
    changeDate:   string;       // ISO date of approximate breakpoint
    direction:    'increase' | 'decrease';
  };
  cancellationScore?:  number;  // 0-100: likelihood this was cancelled
  cancellationReason?: string;
  isTrial?:            boolean;
  trialStartDate?:     string;
  estimatedTrialEndDate?: string;
  trialDaysRemaining?: number;

  transactions: Transaction[];
};

/* ─────────────────────────────────────────────────────────────
   PER-FREQUENCY CONSTANTS
───────────────────────────────────────────────────────────── */

// Acceptable day variance per frequency before cadence is considered broken
const CADENCE_TOLERANCE: Record<string, number> = {
  weekly:    3,
  biweekly:  5,
  monthly:   8,
  quarterly: 15,
  annual:    30,
  irregular: 0,
};

// Min transactions to classify (relaxed for known subscriptions)
const MIN_TRANSACTIONS: Record<string, number> = {
  weekly:    3,
  biweekly:  3,
  monthly:   2,
  quarterly: 2,
  annual:    1,
  irregular: 2,
};

/* ─────────────────────────────────────────────────────────────
   HELPERS
───────────────────────────────────────────────────────────── */

function daysBetween(a: Date, b: Date): number {
  return Math.abs((a.getTime() - b.getTime()) / (1000 * 60 * 60 * 24));
}

function monthsBetween(a: Date, b: Date): number {
  return (
    Math.abs(b.getFullYear() - a.getFullYear()) * 12 +
    (b.getMonth() - a.getMonth())
  );
}

function calcStdDev(values: number[]): number {
  if (values.length < 2) return 0;
  const avg = values.reduce((a, b) => a + b, 0) / values.length;
  const variance = values.reduce((s, v) => s + Math.pow(v - avg, 2), 0) / values.length;
  return Math.sqrt(variance);
}

function detectFrequency(avgDays: number): RecurringClassification['frequency'] {
  if (avgDays <=  9) return 'weekly';
  if (avgDays <= 18) return 'biweekly';
  if (avgDays <= 40) return 'monthly';
  if (avgDays <= 110) return 'quarterly';
  if (avgDays <= 420) return 'annual';
  return 'irregular';
}

function parseLocalDate(dateStr: string): Date {
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(y, m - 1, d);
}

/** Month addition without day overflow — Jan 31 + 1 month = Feb 28, not Mar 3 */
function addMonthsSafe(date: Date, months: number): Date {
  const d = new Date(date);
  const targetMonth = d.getMonth() + months;
  d.setMonth(targetMonth);
  const expectedMod = ((targetMonth % 12) + 12) % 12;
  if (d.getMonth() !== expectedMod) d.setDate(0);
  return d;
}

/** Most common day-of-month across dates — anchors monthly/quarterly/annual predictions */
function getPreferredDayOfMonth(dates: Date[]): number {
  const counts: Record<number, number> = {};
  dates.forEach(d => { const day = d.getDate(); counts[day] = (counts[day] || 0) + 1; });
  return parseInt(Object.entries(counts).sort((a, b) => b[1] - a[1])[0][0], 10);
}

/** Most common day-of-week — anchors weekly/biweekly predictions */
function getPreferredDayOfWeek(dates: Date[]): number {
  const counts: Record<number, number> = {};
  dates.forEach(d => { const day = d.getDay(); counts[day] = (counts[day] || 0) + 1; });
  return parseInt(Object.entries(counts).sort((a, b) => b[1] - a[1])[0][0], 10);
}

/**
 * Predicts next occurrence anchored to historical pattern,
 * not just "last date + interval" (avoids drift over time).
 */
function predictNextDate(
  lastDate: Date,
  frequency: RecurringClassification['frequency'],
  allDates: Date[],
  avgInterval: number
): string | null {
  if (frequency === 'irregular') return null;

  const now = new Date();
  const preferredDOM = getPreferredDayOfMonth(allDates);
  let next: Date;

  if (frequency === 'monthly') {
    next = addMonthsSafe(now, 0);
    next.setDate(preferredDOM);
    if (next <= now) {
      next = addMonthsSafe(next, 1);
      next.setDate(preferredDOM);
    }
  } else if (frequency === 'quarterly') {
    next = addMonthsSafe(lastDate, 3);
    const maxDay = new Date(next.getFullYear(), next.getMonth() + 1, 0).getDate();
    next.setDate(Math.min(preferredDOM, maxDay));
  } else if (frequency === 'annual') {
    next = new Date(lastDate);
    next.setFullYear(next.getFullYear() + 1);
    const maxDay = new Date(next.getFullYear(), next.getMonth() + 1, 0).getDate();
    next.setDate(Math.min(preferredDOM, maxDay));
  } else if (frequency === 'weekly') {
    const preferredDOW = getPreferredDayOfWeek(allDates);
    next = new Date(lastDate);
    next.setDate(next.getDate() + 7);
    const diff = (preferredDOW - next.getDay() + 7) % 7;
    next.setDate(next.getDate() + diff);
  } else if (frequency === 'biweekly') {
    next = new Date(lastDate);
    next.setDate(next.getDate() + 14);
  } else {
    next = new Date(lastDate);
    next.setDate(next.getDate() + Math.round(avgInterval));
  }

  const yyyy = next.getFullYear();
  const mm   = String(next.getMonth() + 1).padStart(2, '0');
  const dd   = String(next.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

/**
 * Decays confidence for patterns that haven't fired in longer than 2× their interval.
 * Stale patterns degrade gracefully rather than staying at original score indefinitely.
 */
function applyConfidenceDecay(
  base: number,
  daysSinceLast: number,
  frequency: string
): number {
  const expected: Record<string, number> = {
    weekly: 7, biweekly: 14, monthly: 30,
    quarterly: 91, annual: 365, irregular: 60,
  };
  const interval = expected[frequency] ?? 30;
  const ratio = daysSinceLast / (interval * 2);
  if (ratio <= 1) return base;
  return Math.round(base * Math.max(0.3, 1 - (ratio - 1) * 0.4));
}

/* ─────────────────────────────────────────────────────────────
   CADENCE CLUSTERING
   Detects when a single merchant has multiple interleaved billing
   patterns (e.g. two Netflix subscriptions both billed monthly).
   Returns either the original array (one pattern) or N sub-arrays
   (one per detected pattern).
───────────────────────────────────────────────────────────── */

function clusterByBillingCadence(
  sorted: Transaction[],
  intervals: number[],
): Transaction[][] {
  // Need at least 4 transactions and 2+ months of data
  if (sorted.length < 4) return [sorted];

  // Skip daily/weekly merchants (Starbucks etc.) — only cluster monthly-ish patterns
  const avgInterval = intervals.length
    ? intervals.reduce((a, b) => a + b, 0) / intervals.length
    : 0;
  if (avgInterval < 10) return [sorted];

  // Group transactions by calendar month (YYYY-MM)
  const byMonth = new Map<string, Transaction[]>();
  sorted.forEach(txn => {
    const key = txn.date.slice(0, 7);
    byMonth.set(key, [...(byMonth.get(key) ?? []), txn]);
  });

  const months = Array.from(byMonth.values());
  if (months.length < 2) return [sorted];

  // Find months with 2+ charges — partial months (first/last) may have only 1
  const multiChargeMonths = months.filter(m => m.length >= 2 && m.length <= 4);
  if (multiChargeMonths.length < 2) return [sorted];

  // Use the most common count among multi-charge months
  const countFreq: Record<number, number> = {};
  multiChargeMonths.forEach(m => { countFreq[m.length] = (countFreq[m.length] || 0) + 1; });
  const dominantCount = parseInt(
    Object.entries(countFreq).sort((a, b) => b[1] - a[1] || Number(b[0]) - Number(a[0]))[0][0], 10
  );

  const dominantMonths = multiChargeMonths.filter(m => m.length === dominantCount);
  if (dominantMonths.length < 2) return [sorted];

  // Assign by position within each month (sorted by day-of-month)
  // Position 0 → sub-pattern 0, position 1 → sub-pattern 1, etc.
  const subPatterns: Transaction[][] = Array.from({ length: dominantCount }, () => []);
  dominantMonths.forEach(monthTxns => {
    const inOrder = [...monthTxns].sort(
      (a, b) => parseLocalDate(a.date).getDate() - parseLocalDate(b.date).getDate()
    );
    inOrder.forEach((txn, idx) => subPatterns[idx].push(txn));
  });

  // Each sub-pattern needs 2+ transactions to be valid
  const valid = subPatterns.filter(p => p.length >= 2);
  if (valid.length < 2) return [sorted];

  return valid;
}

/* ─────────────────────────────────────────────────────────────
   MAIN ENGINE
───────────────────────────────────────────────────────────── */

export function calculateRecurringTransactions(
  transactions: Transaction[]
): RecurringClassification[] {

  // ── Step 1: Resolve merchant name (DB rows often have null merchant, raw_merchant fallback) ──
  const resolved = transactions.map(txn => ({
    ...txn,
    merchant: txn.merchant || (txn as any).name || (txn as any).raw_merchant || 'Unknown',
  }));

  // ── Step 2: Pre-aggregate same merchant + same date ──
  // Real payroll often arrives as two deposits on the same day (salary + car allowance etc.).
  // Treating them as separate transactions destroys amount stability. Combine them first.
  const aggMap: Record<string, Transaction> = {};
  const aggNameMap: Record<string, string[]> = {};

  resolved.forEach(txn => {
    const raw = txn.normalizedMerchant || txn.merchant || 'Unknown';
    const merchantKey = normalizeMerchantName(raw);
    const aggKey = `${merchantKey}__${txn.date}__${txn.transaction_type}`;

    if (aggMap[aggKey]) {
      aggMap[aggKey] = {
        ...aggMap[aggKey],
        amount: aggMap[aggKey].amount + Math.abs(txn.amount),
      };
    } else {
      aggMap[aggKey] = { ...txn, amount: Math.abs(txn.amount) };
      aggNameMap[aggKey] = [];
    }
    aggNameMap[aggKey].push(raw);
  });

  const aggregated = Object.values(aggMap);

  // ── Step 3: Group aggregated transactions by normalized merchant key ──
  const merchantMap: Record<string, Transaction[]> = {};
  const rawNameMap:  Record<string, string[]>       = {};

  aggregated.forEach(txn => {
    const raw = txn.normalizedMerchant || txn.merchant || 'Unknown';
    const key = normalizeMerchantName(raw);
    if (!merchantMap[key]) {
      merchantMap[key] = [];
      rawNameMap[key]  = [];
    }
    merchantMap[key].push(txn);
    rawNameMap[key].push(raw);
  });

  const results: RecurringClassification[] = [];

  Object.entries(merchantMap).forEach(([key, txns]) => {

    const displayName = getMostCommonName(rawNameMap[key]);
    const knownSub    = SUBSCRIPTION_MERCHANTS.some(m =>
      key.includes(m.toLowerCase())
    );

    const allSorted = [...txns].sort(
      (a, b) => parseLocalDate(a.date).getTime() - parseLocalDate(b.date).getTime()
    );

    // Pre-calculate intervals for clustering
    const allDates     = allSorted.map(t => parseLocalDate(t.date));
    const allIntervals: number[] = [];
    for (let i = 1; i < allDates.length; i++) {
      allIntervals.push(daysBetween(allDates[i], allDates[i - 1]));
    }

    // Split into sub-patterns if multiple interleaved billing cadences detected
    const subGroups = clusterByBillingCadence(allSorted, allIntervals);

    subGroups.forEach(sorted => {

    const first = sorted[0];
    const last  = sorted[sorted.length - 1];

    const amounts = sorted.map(t => Math.abs(t.amount));
    const dates   = sorted.map(t => parseLocalDate(t.date));

    // Interval analysis
    const intervals: number[] = [];
    for (let i = 1; i < dates.length; i++) {
      intervals.push(daysBetween(dates[i], dates[i - 1]));
    }

    const avgInterval = intervals.length
      ? intervals.reduce((a, b) => a + b, 0) / intervals.length
      : 0;

    const frequency = detectFrequency(avgInterval);

    // Minimum transactions per frequency
    const minTxns = knownSub ? 1 : (MIN_TRANSACTIONS[frequency] ?? 2);
    if (sorted.length < minTxns) return;

    // Cadence stability with per-frequency tolerance
    const tolerance = frequency === 'irregular'
      ? avgInterval * 0.3
      : CADENCE_TOLERANCE[frequency];

    const cadenceStabilityScore = intervals.length < 2
      ? (knownSub ? 70 : 0)
      : (intervals.filter(i => Math.abs(i - avgInterval) <= tolerance).length / intervals.length) * 100;

    // Amount stability
    const avgAmount = amounts.reduce((a, b) => a + b, 0) / amounts.length;
    const amountStd = calcStdDev(amounts);
    const amountStabilityScore = Math.max(
      0,
      100 - (amountStd / Math.max(avgAmount, 1)) * 100
    );

    // Volume score
    const volumeScore = Math.min(sorted.length * 12, 100);

    // Base confidence
    let baseConfidence =
      cadenceStabilityScore * 0.40 +
      amountStabilityScore  * 0.30 +
      volumeScore           * 0.20 +
      10;

    if (knownSub) baseConfidence = Math.max(baseConfidence, 75);

    // Apply staleness decay
    const daysSinceLast = daysBetween(new Date(), parseLocalDate(last.date));
    const confidence    = applyConfidenceDecay(
      Math.min(100, Math.round(baseConfidence)),
      daysSinceLast,
      frequency
    );

    // Categories that are purely discretionary variable spend — exclude from bill detection
    // Note: knownSub always overrides this (a known subscription merchant is always a subscription)
    const DISCRETIONARY_CATEGORIES = new Set([
      'Dining & Restaurants', 'Food & Drink', 'Restaurants', 'Fast Food',
      'Gas & Fuel', 'Fuel', 'Gasoline',
      'Groceries', 'Supermarkets & Groceries',
      'Coffee Shops', 'Bars',
    ]);
    const isDiscretionary = DISCRETIONARY_CATEGORIES.has(last.category as string);

    // Type classification
    let type: RecurringClassification['type'] = 'one_time';
    if (last.transaction_type === 'Transfer') {
      type = 'transfer';
    } else if (last.transaction_type === 'Income' && confidence > 65) {
      type = 'income';
    } else if (knownSub) {
      // Known subscription merchants always classify as subscription regardless of category
      type = 'subscription';
    } else if (confidence > 65 && amountStabilityScore >= 60 && !isDiscretionary) {
      type = 'bill';
    }

    if (type === 'one_time') return;

    // Activity window per frequency
    const activityWindows: Record<string, number> = {
      weekly: 21, biweekly: 35, monthly: 75,
      quarterly: 150, annual: 500, irregular: 120,
    };
    const isActive = daysSinceLast < (activityWindows[frequency] ?? 75);

    const nextExpectedDate = predictNextDate(
      parseLocalDate(last.date),
      frequency,
      dates,
      avgInterval
    );

    // Monthly/annual equivalents
    const monthlyMultiplier: Record<string, number> = {
      weekly: 4.33, biweekly: 2.17, monthly: 1,
      quarterly: 1/3, annual: 1/12, irregular: 1,
    };
    const monthlyEquivalent = avgAmount * (monthlyMultiplier[frequency] ?? 1);
    const annualEquivalent  = monthlyEquivalent * 12;
    const totalValue        = amounts.reduce((a, b) => a + b, 0);

    results.push({
      merchant:    displayName,
      merchantKey: key,
      category:    last.category,
      transaction_type: last.transaction_type,

      type,
      frequency,

      confidence,
      confidenceScore:       confidence,
      amountStabilityScore:  Math.round(amountStabilityScore),
      cadenceStabilityScore: Math.round(cadenceStabilityScore),
      variabilityScore:      Math.round(100 - amountStabilityScore),

      expectedAmount:    avgAmount,
      averageAmount:     avgAmount,
      monthlyEquivalent,
      annualEquivalent,

      amountHistory:  amounts,
      firstSeenDate:  first.date,
      lastSeenDate:   last.date,
      lifespanMonths: Math.max(0, monthsBetween(parseLocalDate(first.date), parseLocalDate(last.date))),

      isActive,
      isSubscription:   knownSub || type === 'subscription',
      nextExpectedDate,

      transactionCount: sorted.length,
      totalValue,

      transactions: sorted,
    });

    }); // end subGroups.forEach
  }); // end merchantMap.forEach

  return results.sort((a, b) => b.confidence - a.confidence);
}
