/**
 * Phase 4 Recurring Intelligence
 *
 * Four portfolio-level analyses that run over the full set of patterns + transactions:
 *
 *   1. buildAnnualCostRollup      — true annual cost by category + month-by-month projection
 *   2. detectSubscriptionOverlap  — redundant subscriptions in the same purpose category
 *   3. analyzeIncomeVariance      — volatility, trend, missed payments, income concentration risk
 *   4. detectAnomalies            — unexpected charges, duplicates, spikes, cancelled-sub charges
 *
 * All functions are pure — they take data in, return results out.
 * Persist anomalies to Supabase with saveAnomalies() below.
 */

import { Transaction } from '../../types/transactions';
import { RecurringClassification } from '../cashflow/analytics/calculaterecurringtransactions';
import { normalizeMerchantName } from './normalizemerchant';

/* ─────────────────────────────────────────────────────────────
   SHARED HELPERS
───────────────────────────────────────────────────────────── */

function mean(values: number[]): number {
  if (!values.length) return 0;
  return values.reduce((a, b) => a + b, 0) / values.length;
}

function stdDev(values: number[]): number {
  if (values.length < 2) return 0;
  const avg = mean(values);
  return Math.sqrt(values.reduce((s, v) => s + Math.pow(v - avg, 2), 0) / values.length);
}

function parseLocalDate(dateStr: string): Date {
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(y, m - 1, d);
}

function monthKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

function addMonthsSafe(date: Date, months: number): Date {
  const d = new Date(date);
  const targetMonth = d.getMonth() + months;
  d.setMonth(targetMonth);
  const expectedMod = ((targetMonth % 12) + 12) % 12;
  if (d.getMonth() !== expectedMod) d.setDate(0);
  return d;
}

/* ─────────────────────────────────────────────────────────────
   1. ANNUAL COST ROLLUP
───────────────────────────────────────────────────────────── */

export type AnnualCostRollup = {
  totalAnnualSubscriptions:     number;
  totalAnnualBills:             number;
  totalAnnualRecurringExpenses: number;
  totalAnnualRecurringIncome:   number;
  netAnnualRecurring:           number;  // income - expenses

  // Per-category breakdown
  byCategory: Array<{
    category:          string;
    annualCost:        number;
    monthlyEquivalent: number;
    patternCount:      number;
    merchants:         string[];
  }>;

  // 12-month forward projection (next 12 calendar months from today)
  monthlyProjection: Array<{
    month:              string;   // "2026-01"
    projectedExpenses:  number;
    projectedIncome:    number;
    netCashFlow:        number;
  }>;
};

export function buildAnnualCostRollup(
  patterns: RecurringClassification[]
): AnnualCostRollup {
  const active = patterns.filter(p => p.isActive && p.type !== 'one_time');

  const expenses = active.filter(p => p.transaction_type === 'Expense');
  const income   = active.filter(p => p.transaction_type === 'Income');

  const totalAnnualSubscriptions = expenses
    .filter(p => p.isSubscription)
    .reduce((s, p) => s + p.annualEquivalent, 0);

  const totalAnnualBills = expenses
    .filter(p => !p.isSubscription && p.type === 'bill')
    .reduce((s, p) => s + p.annualEquivalent, 0);

  const totalAnnualRecurringExpenses = expenses.reduce((s, p) => s + p.annualEquivalent, 0);
  const totalAnnualRecurringIncome   = income.reduce((s, p) => s + p.annualEquivalent, 0);
  const netAnnualRecurring           = totalAnnualRecurringIncome - totalAnnualRecurringExpenses;

  // Per-category aggregation
  const categoryMap = new Map<string, { annual: number; monthly: number; merchants: string[] }>();
  expenses.forEach(p => {
    const cat = p.category ?? 'Uncategorized';
    const existing = categoryMap.get(cat) ?? { annual: 0, monthly: 0, merchants: [] };
    categoryMap.set(cat, {
      annual:    existing.annual    + p.annualEquivalent,
      monthly:   existing.monthly   + p.monthlyEquivalent,
      merchants: [...existing.merchants, p.merchant],
    });
  });

  const byCategory = Array.from(categoryMap.entries())
    .map(([category, data]) => ({
      category,
      annualCost:        Math.round(data.annual * 100) / 100,
      monthlyEquivalent: Math.round(data.monthly * 100) / 100,
      patternCount:      data.merchants.length,
      merchants:         data.merchants,
    }))
    .sort((a, b) => b.annualCost - a.annualCost);

  // 12-month forward projection
  const today = new Date();
  const monthlyProjection = Array.from({ length: 12 }, (_, i) => {
    const projDate = addMonthsSafe(today, i + 1);
    const mk = monthKey(projDate);

    let projectedExpenses = 0;
    let projectedIncome   = 0;

    active.forEach(p => {
      // Check if this pattern is expected to fire in this month
      const fires = patternFiresInMonth(p, projDate);
      if (!fires) return;

      if (p.transaction_type === 'Expense') projectedExpenses += p.expectedAmount;
      if (p.transaction_type === 'Income')  projectedIncome   += p.expectedAmount;
    });

    return {
      month:             mk,
      projectedExpenses: Math.round(projectedExpenses * 100) / 100,
      projectedIncome:   Math.round(projectedIncome   * 100) / 100,
      netCashFlow:       Math.round((projectedIncome - projectedExpenses) * 100) / 100,
    };
  });

  return {
    totalAnnualSubscriptions:     Math.round(totalAnnualSubscriptions * 100) / 100,
    totalAnnualBills:             Math.round(totalAnnualBills * 100) / 100,
    totalAnnualRecurringExpenses: Math.round(totalAnnualRecurringExpenses * 100) / 100,
    totalAnnualRecurringIncome:   Math.round(totalAnnualRecurringIncome * 100) / 100,
    netAnnualRecurring:           Math.round(netAnnualRecurring * 100) / 100,
    byCategory,
    monthlyProjection,
  };
}

/** Returns true if a recurring pattern is expected to produce a charge in the given month */
function patternFiresInMonth(pattern: RecurringClassification, month: Date): boolean {
  switch (pattern.frequency) {
    case 'weekly':
    case 'biweekly':
    case 'monthly':
      return true; // fires every month (or multiple times)
    case 'quarterly':
      if (!pattern.nextExpectedDate) return false;
      return isDateInSameMonth(parseLocalDate(pattern.nextExpectedDate), month)
        || isDateWithinNMonthsOfAnchor(month, parseLocalDate(pattern.firstSeenDate), 3);
    case 'annual':
      if (!pattern.nextExpectedDate) return false;
      return isDateInSameMonth(parseLocalDate(pattern.nextExpectedDate), month);
    default:
      return false;
  }
}

function isDateInSameMonth(date: Date, month: Date): boolean {
  return date.getFullYear() === month.getFullYear() && date.getMonth() === month.getMonth();
}

function isDateWithinNMonthsOfAnchor(target: Date, anchor: Date, n: number): boolean {
  const monthOffset = (target.getFullYear() - anchor.getFullYear()) * 12
    + (target.getMonth() - anchor.getMonth());
  return monthOffset >= 0 && monthOffset % n === 0;
}

/* ─────────────────────────────────────────────────────────────
   2. SUBSCRIPTION OVERLAP DETECTION
───────────────────────────────────────────────────────────── */

export type OverlapGroup = {
  purposeCategory:  string;
  merchants:        string[];
  totalMonthly:     number;
  totalAnnual:      number;
  redundancyScore:  number;       // 0-100
  recommendation:   string;
  isDuplicateMerchant?: boolean;  // true = same merchant charged twice
  periodsDetected?:     number;   // how many billing periods the duplicate was seen
};

export type SubscriptionOverlapReport = {
  overlaps:              OverlapGroup[];
  totalRedundantMonthly: number;
  totalRedundantAnnual:  number;
};

// Canonical purpose categories — maps subcategory → purpose bucket
const PURPOSE_MAP: Record<string, string> = {
  // Video
  'Video Streaming':        'Video Streaming',
  'Streaming':              'Video Streaming',
  'Cable & Satellite TV':   'Video Streaming',
  // Music
  'Music Streaming':        'Music Streaming',
  'Music & Radio':          'Music Streaming',
  // Cloud Storage
  'Cloud Storage':          'Cloud Storage',
  'Software':               'Software',
  // News & Reading
  'News & Magazines':       'News & Reading',
  'Books & Reference':      'News & Reading',
  // Fitness
  'Gym & Fitness':          'Fitness',
  'Fitness Apps':           'Fitness',
  // Gaming
  'Gaming':                 'Gaming',
  'Video Games':            'Gaming',
  // Food Delivery
  'Food Delivery':          'Food Delivery',
  'Grocery Delivery':       'Food Delivery',
};

function sharedBillingPeriods(a: RecurringClassification, b: RecurringClassification): number {
  // Count calendar months where both patterns have a transaction
  const monthsA = new Set(a.transactions.map(t => t.date.slice(0, 7)));
  const monthsB = new Set(b.transactions.map(t => t.date.slice(0, 7)));
  let shared = 0;
  monthsA.forEach(m => { if (monthsB.has(m)) shared++; });
  return shared;
}

export function detectSubscriptionOverlap(
  patterns: RecurringClassification[]
): SubscriptionOverlapReport {
  const activeSubscriptions = patterns.filter(
    p => p.isActive && p.isSubscription && p.transaction_type === 'Expense'
  );

  const overlaps: OverlapGroup[] = [];

  // ── PART 1: Same-merchant duplicate detection ──────────────────
  // Group active subscriptions by normalized merchant key
  const merchantGroups = new Map<string, RecurringClassification[]>();
  activeSubscriptions.forEach(p => {
    const key = p.merchantKey ?? p.merchant.toLowerCase().replace(/[^a-z0-9]/g, '');
    const existing = merchantGroups.get(key) ?? [];
    merchantGroups.set(key, [...existing, p]);
  });

  merchantGroups.forEach((group, _key) => {
    if (group.length < 2) return;

    // Check each pair for shared billing periods
    for (let i = 0; i < group.length; i++) {
      for (let j = i + 1; j < group.length; j++) {
        const shared = sharedBillingPeriods(group[i], group[j]);
        if (shared < 2) continue; // need 2+ shared periods to flag

        const totalMonthly = group[i].monthlyEquivalent + group[j].monthlyEquivalent;
        const totalAnnual  = group[i].annualEquivalent  + group[j].annualEquivalent;
        const cheapest     = group[i].monthlyEquivalent <= group[j].monthlyEquivalent ? group[i] : group[j];
        const annualWaste  = Math.round((totalMonthly - cheapest.monthlyEquivalent) * 12);

        overlaps.push({
          purposeCategory:    `Duplicate: ${group[i].merchant}`,
          merchants:           [group[i].merchant, group[j].merchant],
          totalMonthly:        Math.round(totalMonthly * 100) / 100,
          totalAnnual:         Math.round(totalAnnual  * 100) / 100,
          redundancyScore:     Math.min(100, 60 + shared * 10),
          isDuplicateMerchant: true,
          periodsDetected:     shared,
          recommendation:      `${group[i].merchant} is being charged twice — $${group[i].monthlyEquivalent.toFixed(2)}/mo and $${group[j].monthlyEquivalent.toFixed(2)}/mo — for ${shared} months. You may have two active subscriptions. Cancelling one could save $${annualWaste}/year.`,
        });
      }
    }
  });

  // ── PART 2: Same-purpose overlap (different merchants) ────────
  const purposeGroups = new Map<string, RecurringClassification[]>();
  activeSubscriptions.forEach(p => {
    const subcategory = (p.category as string) ?? '';
    const purpose = PURPOSE_MAP[subcategory] ?? null;
    if (!purpose) return;
    const existing = purposeGroups.get(purpose) ?? [];
    purposeGroups.set(purpose, [...existing, p]);
  });

  purposeGroups.forEach((group, purposeCategory) => {
    if (group.length < 2) return;

    // Skip if already flagged as same-merchant duplicate
    const alreadyFlagged = overlaps.some(
      o => o.isDuplicateMerchant && group.every(p => o.merchants.includes(p.merchant))
    );
    if (alreadyFlagged) return;

    const totalMonthly    = group.reduce((s, p) => s + p.monthlyEquivalent, 0);
    const totalAnnual     = group.reduce((s, p) => s + p.annualEquivalent,  0);
    const redundancyScore = Math.min(100, 50 + (group.length - 2) * 20 + Math.min(totalMonthly / 5, 30));
    const cheapest        = [...group].sort((a, b) => a.monthlyEquivalent - b.monthlyEquivalent)[0];

    overlaps.push({
      purposeCategory,
      merchants:       group.map(p => p.merchant),
      totalMonthly:    Math.round(totalMonthly * 100) / 100,
      totalAnnual:     Math.round(totalAnnual  * 100) / 100,
      redundancyScore: Math.round(redundancyScore),
      recommendation:  `You have ${group.length} ${purposeCategory} subscriptions. Consider keeping ${cheapest.merchant} ($${cheapest.monthlyEquivalent.toFixed(2)}/mo) and cancelling the others to save $${Math.round((totalMonthly - cheapest.monthlyEquivalent) * 12)}/year.`,
    });
  });

  overlaps.sort((a, b) => b.totalAnnual - a.totalAnnual);

  const totalRedundantMonthly = overlaps.reduce((s, o) => s + o.totalMonthly, 0);
  const totalRedundantAnnual  = overlaps.reduce((s, o) => s + o.totalAnnual,  0);

  return {
    overlaps,
    totalRedundantMonthly: Math.round(totalRedundantMonthly * 100) / 100,
    totalRedundantAnnual:  Math.round(totalRedundantAnnual  * 100) / 100,
  };
}

/* ─────────────────────────────────────────────────────────────
   3. INCOME VARIANCE ANALYSIS
───────────────────────────────────────────────────────────── */

export type IncomeSourceVariance = {
  merchant:             string;
  frequency:            string;
  monthlyAmounts:       number[];   // one entry per month seen, chronological
  mean:                 number;
  stdDev:               number;
  coefficientOfVariation: number;   // stdDev/mean * 100 — normalized volatility
  trend:                'stable' | 'growing' | 'declining' | 'volatile';
  missedPayments:       number;     // expected occurrences with no matching transaction
  ytdTotal:             number;
  ytdProjected:         number;     // extrapolated through Dec 31 of current year
  volatilityScore:      number;     // 0-100 (higher = more volatile)
};

export type IncomeVarianceReport = {
  sources:                  IncomeSourceVariance[];
  overallVolatilityScore:   number;
  primaryIncomeSource:      string;   // highest ytdTotal
  concentrationRisk:        number;   // % of total income from primary source (0-100)
  totalYtdIncome:           number;
  totalProjectedAnnual:     number;
};

export function analyzeIncomeVariance(
  transactions: Transaction[],
  recurringPatterns: RecurringClassification[]
): IncomeVarianceReport {
  const now      = new Date();
  const yearStart = new Date(now.getFullYear(), 0, 1);

  const incomeTransactions = transactions.filter(
    t => t.transaction_type === 'Income' && !t.is_reversal
  );

  // Build per-merchant monthly buckets + actual transaction counts
  const merchantMonthMap = new Map<string, Map<string, number>>();
  const merchantTxnCount = new Map<string, number>();

  incomeTransactions.forEach(t => {
    const raw = t.merchant || 'Unknown';
    const key = normalizeMerchantName(raw);
    const mk  = monthKey(parseLocalDate(t.date));

    if (!merchantMonthMap.has(key)) merchantMonthMap.set(key, new Map());
    const monthMap = merchantMonthMap.get(key)!;
    monthMap.set(mk, (monthMap.get(mk) ?? 0) + Math.abs(t.amount));
    merchantTxnCount.set(key, (merchantTxnCount.get(key) ?? 0) + 1);
  });

  // Map recurring income patterns by merchant key for expected frequency
  const patternByKey = new Map<string, RecurringClassification>();
  recurringPatterns
    .filter(p => p.transaction_type === 'Income')
    .forEach(p => patternByKey.set(p.merchantKey ?? normalizeMerchantName(p.merchant), p));

  const sources: IncomeSourceVariance[] = [];

  merchantMonthMap.forEach((monthMap, key) => {
    const merchantDisplay = incomeTransactions.find(
      t => normalizeMerchantName(t.merchant ?? '') === key
    )?.merchant ?? key;

    const sortedMonths = Array.from(monthMap.keys()).sort();
    const monthlyAmounts = sortedMonths.map(m => monthMap.get(m)!);

    const avg    = mean(monthlyAmounts);
    const sd     = stdDev(monthlyAmounts);
    const cv     = avg > 0 ? (sd / avg) * 100 : 0;

    // Trend: compare first half vs second half
    const half      = Math.floor(monthlyAmounts.length / 2);
    const firstHalf = monthlyAmounts.slice(0, Math.max(half, 1));
    const lastHalf  = monthlyAmounts.slice(-Math.max(half, 1));
    const firstAvg  = mean(firstHalf);
    const lastAvg   = mean(lastHalf);
    const trendPct  = firstAvg > 0 ? ((lastAvg - firstAvg) / firstAvg) * 100 : 0;

    let trend: IncomeSourceVariance['trend'] = 'stable';
    if (cv > 40)          trend = 'volatile';
    else if (trendPct > 10) trend = 'growing';
    else if (trendPct < -10) trend = 'declining';

    // Missed payments: compare expected transaction count vs actual transaction count.
    // Must use actual txn count (not unique month count) because bi-weekly pay
    // produces 2-3 transactions per month — comparing expected paychecks (~26/yr)
    // against unique months (~12) would always show ~14 "missed" payments.
    const pattern = patternByKey.get(key);
    let missedPayments = 0;
    if (pattern && sortedMonths.length >= 2) {
      const firstDate = parseLocalDate(`${sortedMonths[0]}-01`);
      const lastDate  = parseLocalDate(`${sortedMonths[sortedMonths.length - 1]}-01`);
      const expectedOccurrences = expectedCountBetween(firstDate, lastDate, pattern.frequency);
      const actualTxnCount = merchantTxnCount.get(key) ?? monthlyAmounts.length;
      missedPayments = Math.max(0, expectedOccurrences - actualTxnCount);
    }

    // YTD calculation
    const ytdTotal = Array.from(monthMap.entries())
      .filter(([mk]) => mk >= monthKey(yearStart))
      .reduce((s, [, v]) => s + v, 0);

    const monthsElapsed  = now.getMonth() + 1;  // 1-12
    const ytdProjected   = monthsElapsed > 0 ? (ytdTotal / monthsElapsed) * 12 : ytdTotal;
    const volatilityScore = Math.min(100, Math.round(cv));

    sources.push({
      merchant: merchantDisplay,
      frequency: pattern?.frequency ?? 'irregular',
      monthlyAmounts,
      mean:                 Math.round(avg * 100) / 100,
      stdDev:               Math.round(sd  * 100) / 100,
      coefficientOfVariation: Math.round(cv * 10) / 10,
      trend,
      missedPayments,
      ytdTotal:       Math.round(ytdTotal    * 100) / 100,
      ytdProjected:   Math.round(ytdProjected * 100) / 100,
      volatilityScore,
    });
  });

  sources.sort((a, b) => b.ytdTotal - a.ytdTotal);

  const totalYtdIncome      = sources.reduce((s, src) => s + src.ytdTotal, 0);
  const totalProjectedAnnual = sources.reduce((s, src) => s + src.ytdProjected, 0);
  const primarySource        = sources[0]?.merchant ?? 'Unknown';
  const concentrationRisk    = totalYtdIncome > 0
    ? Math.round(((sources[0]?.ytdTotal ?? 0) / totalYtdIncome) * 100)
    : 0;
  const overallVolatilityScore = sources.length > 0
    ? Math.round(mean(sources.map(s => s.volatilityScore)))
    : 0;

  return {
    sources,
    overallVolatilityScore,
    primaryIncomeSource:  primarySource,
    concentrationRisk,
    totalYtdIncome:       Math.round(totalYtdIncome       * 100) / 100,
    totalProjectedAnnual: Math.round(totalProjectedAnnual * 100) / 100,
  };
}

/** Approximate count of expected occurrences between two dates for a given frequency */
function expectedCountBetween(
  from: Date,
  to:   Date,
  frequency: string
): number {
  const days = (to.getTime() - from.getTime()) / (1000 * 60 * 60 * 24);
  const intervals: Record<string, number> = {
    weekly: 7, biweekly: 14, monthly: 30, quarterly: 91, annual: 365, irregular: 30,
  };
  const interval = intervals[frequency] ?? 30;
  return Math.round(days / interval) + 1;
}

/* ─────────────────────────────────────────────────────────────
   4. ANOMALY DETECTION
───────────────────────────────────────────────────────────── */

export type AnomalyType =
  | 'amount_spike'         // charge > 3σ above pattern mean
  | 'amount_drop'          // income deposit significantly below expected
  | 'duplicate_charge'     // same merchant + similar amount within 48h
  | 'charge_after_cancel'  // charge from a pattern with high cancellation score
  | 'unexpected_charge';   // charge from a merchant with no established pattern

export type Anomaly = {
  type:            AnomalyType;
  severity:        'low' | 'medium' | 'high';
  merchant:        string;
  transactionId?:  string;
  amount?:         number;
  expectedAmount?: number;
  deviationPct?:   number;
  description:     string;
  date:            string;
};

export type AnomalyReport = {
  anomalies:      Anomaly[];
  highCount:      number;
  mediumCount:    number;
  lowCount:       number;
  totalFlagged:   number;
};

export function detectAnomalies(
  transactions: Transaction[],
  patterns: RecurringClassification[]
): AnomalyReport {
  const anomalies: Anomaly[] = [];

  // Build lookup: normalized merchant key → pattern
  const patternByKey = new Map<string, RecurringClassification>();
  patterns.forEach(p => {
    patternByKey.set(p.merchantKey ?? normalizeMerchantName(p.merchant), p);
  });

  // Only analyse the last 90 days — historical anomalies are noise
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - 30);

  // Sort transactions newest first for duplicate detection
  const sorted = [...transactions]
    .filter(t => parseLocalDate(t.date) >= cutoff)
    .sort((a, b) => parseLocalDate(b.date).getTime() - parseLocalDate(a.date).getTime());

  // Track seen (key, date) pairs for duplicate detection
  const recentCharges: Array<{ key: string; amount: number; date: Date; id: string }> = [];

  sorted.forEach(txn => {
    const raw    = txn.merchant || 'Unknown';
    const key    = normalizeMerchantName(raw);
    const amount = Math.abs(txn.amount);
    const txnDate = parseLocalDate(txn.date);
    const pattern = patternByKey.get(key);

    // ── 1. AMOUNT SPIKE / DROP ───────────────────────────────
    // Only meaningful for fixed-amount patterns — skip variable-spend merchants
    if (pattern && pattern.amountHistory.length >= 4 && (pattern.amountStabilityScore ?? 0) >= 60) {
      const avg = mean(pattern.amountHistory);
      const sd  = stdDev(pattern.amountHistory);
      const threshold = sd > 0 ? sd * 3 : avg * 0.5;

      if (amount > avg + threshold) {
        const deviationPct = Math.round(((amount - avg) / avg) * 100);
        anomalies.push({
          type:            'amount_spike',
          severity:        deviationPct > 100 ? 'high' : 'medium',
          merchant:        txn.merchant,
          transactionId:   txn.id,
          amount,
          expectedAmount:  Math.round(avg * 100) / 100,
          deviationPct,
          description:     `${txn.merchant} charged $${amount.toFixed(2)} — ${deviationPct}% above the usual $${avg.toFixed(2)}.`,
          date:            txn.date,
        });
      }

      if (txn.transaction_type === 'Income' && amount < avg - threshold) {
        const deviationPct = Math.round(((avg - amount) / avg) * 100);
        anomalies.push({
          type:            'amount_drop',
          severity:        deviationPct > 50 ? 'high' : 'medium',
          merchant:        txn.merchant,
          transactionId:   txn.id,
          amount,
          expectedAmount:  Math.round(avg * 100) / 100,
          deviationPct,
          description:     `${txn.merchant} paid $${amount.toFixed(2)} — ${deviationPct}% below the usual $${avg.toFixed(2)}.`,
          date:            txn.date,
        });
      }
    }

    // ── 2. DUPLICATE CHARGE ──────────────────────────────────
    if (txn.transaction_type === 'Expense') {
      const recent = recentCharges.find(r =>
        r.key === key &&
        Math.abs(r.amount - amount) < 0.50 &&   // within 50¢ — same charge
        Math.abs(r.date.getTime() - txnDate.getTime()) < 48 * 60 * 60 * 1000
      );

      if (recent) {
        anomalies.push({
          type:          'duplicate_charge',
          severity:      'high',
          merchant:      txn.merchant,
          transactionId: txn.id,
          amount,
          description:   `Possible duplicate: ${txn.merchant} charged $${amount.toFixed(2)} twice within 48 hours.`,
          date:          txn.date,
        });
      }

      recentCharges.push({ key, amount, date: txnDate, id: txn.id });
    }

    // ── 3. CHARGE AFTER APPARENT CANCELLATION ───────────────
    if (
      pattern &&
      (pattern.cancellationScore ?? 0) >= 70 &&
      txn.transaction_type === 'Expense'
    ) {
      anomalies.push({
        type:          'charge_after_cancel',
        severity:      'high',
        merchant:      txn.merchant,
        transactionId: txn.id,
        amount,
        description:   `${txn.merchant} charged $${amount.toFixed(2)} but this subscription appears to have been cancelled (cancellation score: ${pattern.cancellationScore}).`,
        date:          txn.date,
      });
    }

    // ── 4. UNEXPECTED CHARGE (no pattern, large amount) ─────
    if (
      !pattern &&
      txn.transaction_type === 'Expense' &&
      amount >= 500
    ) {
      anomalies.push({
        type:          'unexpected_charge',
        severity:      amount >= 1000 ? 'high' : 'medium',
        merchant:      txn.merchant,
        transactionId: txn.id,
        amount,
        description:   `$${amount.toFixed(2)} charge from ${txn.merchant} — no recurring pattern on record.`,
        date:          txn.date,
      });
    }
  });

  // Deduplicate: same transactionId should only appear once (pick highest severity)
  const severityRank = { high: 3, medium: 2, low: 1 };
  const deduped = new Map<string, Anomaly>();
  anomalies.forEach(a => {
    const id = a.transactionId ?? `${a.merchant}-${a.date}`;
    const existing = deduped.get(id);
    if (!existing || severityRank[a.severity] > severityRank[existing.severity]) {
      deduped.set(id, a);
    }
  });

  const final = Array.from(deduped.values())
    .sort((a, b) => severityRank[b.severity] - severityRank[a.severity]);

  return {
    anomalies:    final,
    highCount:    final.filter(a => a.severity === 'high').length,
    mediumCount:  final.filter(a => a.severity === 'medium').length,
    lowCount:     final.filter(a => a.severity === 'low').length,
    totalFlagged: final.length,
  };
}
