// financialengine/forecast/calculateForecast.ts

import { Transaction } from '../../types/transactions';
import { RecurringClassification } from '../cashflow/analytics/calculaterecurringtransactions';

import {
  ForecastResult,
  ForecastTransaction,
  CashBalancePoint,
} from '../../types/forecast';

export function calculateForecast(
  transactions: Transaction[],
  recurring: RecurringClassification[],
  startingCash: number
): ForecastResult {

  const today = new Date();
  const horizonDays = 90;

  const currentYM  = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
  const todayStr   = today.toISOString().split('T')[0];
  const dayOfMonth = today.getDate();
  const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();

  // ── Active recurring expense classifications (source of truth for count) ─
  const activeRecurringExpenses = recurring.filter(
    r => r.isActive && r.transaction_type === 'Expense' && r.frequency !== 'irregular'
  );
  // Normalised merchant keys for fast lookup
  const activeRecurringKeys = new Set(activeRecurringExpenses.map(r => r.merchant.toLowerCase()));

  // ── MTD actuals from real transactions ─────────────────────────────────
  let mtdIncome             = 0;
  let mtdRecurringSpent     = 0;
  let mtdDiscretionarySpent = 0;
  const paidRecurringKeys   = new Set<string>();   // merchants from active list paid this month

  for (const t of transactions) {
    if (!t.date?.startsWith(currentYM)) continue;
    const amt = Math.abs(Number(t.amount || 0));
    if (t.transaction_type === 'Income') {
      mtdIncome += amt;
    } else if (t.transaction_type === 'Expense') {
      const key = (t.merchant ?? '').toLowerCase();
      // Classify as recurring if merchant is in active recurring list
      if (activeRecurringKeys.has(key)) {
        mtdRecurringSpent += amt;
        paidRecurringKeys.add(key);
      } else {
        mtdDiscretionarySpent += amt;
      }
    }
  }

  // ── Build forecast transactions (future recurring hits over 90 days) ────
  const forecastTransactions: ForecastTransaction[] = [];

  recurring
    .filter(r => r.isActive && r.frequency !== 'irregular' && r.nextExpectedDate && r.transaction_type !== 'Transfer')
    .forEach(recurringItem => {
      let nextDate = new Date(recurringItem.nextExpectedDate!);

      while (nextDate.getTime() <= today.getTime() + horizonDays * 86400000) {
        forecastTransactions.push({
          merchant:         recurringItem.merchant,
          amount:           recurringItem.expectedAmount,
          transaction_type: recurringItem.transaction_type === 'Income' ? 'Income' : 'Expense',
          expectedDate:     nextDate.toISOString().split('T')[0],
          confidence:       recurringItem.confidence,
          type:
            recurringItem.type === 'income'        ? 'income'
            : recurringItem.type === 'subscription' ? 'subscription'
            : 'bill',
        });

        switch (recurringItem.frequency) {
          case 'weekly':    nextDate.setDate(nextDate.getDate() + 7);       break;
          case 'biweekly':  nextDate.setDate(nextDate.getDate() + 14);      break;
          case 'monthly':   nextDate.setMonth(nextDate.getMonth() + 1);     break;
          case 'quarterly': nextDate.setMonth(nextDate.getMonth() + 3);     break;
          case 'annual':    nextDate.setFullYear(nextDate.getFullYear() + 1); break;
        }
      }
    });

  // ── 90-day totals ───────────────────────────────────────────────────────
  const projectedIncome = forecastTransactions
    .filter(t => t.transaction_type === 'Income')
    .reduce((s, t) => s + t.amount, 0);

  const projectedExpenses = forecastTransactions
    .filter(t => t.transaction_type === 'Expense')
    .reduce((s, t) => s + Math.abs(t.amount), 0);

  const projectedNetCashFlow = projectedIncome - projectedExpenses;
  const endingCash           = startingCash + projectedNetCashFlow;
  const savingsRate          = projectedIncome > 0 ? (projectedNetCashFlow / projectedIncome) * 100 : 0;

  const confidence = forecastTransactions.length > 0
    ? forecastTransactions.reduce((s, t) => s + t.confidence, 0) / forecastTransactions.length
    : 0;

  // ── Cash balance series (day-by-day running balance) ───────────────────
  const cashBalanceSeries: CashBalancePoint[] = [];
  let runningCash = startingCash;

  [...forecastTransactions]
    .sort((a, b) => new Date(a.expectedDate).getTime() - new Date(b.expectedDate).getTime())
    .forEach(t => {
      runningCash += t.amount;
      cashBalanceSeries.push({ date: t.expectedDate, balance: runningCash });
    });

  // ── EOM projections ────────────────────────────────────────────────────
  // Remaining recurring transactions still to hit this month (after today)
  let remainingEomIncome   = 0;
  let remainingEomExpenses = 0;

  for (const t of forecastTransactions) {
    if (!t.expectedDate.startsWith(currentYM) || t.expectedDate <= todayStr) continue;
    if (t.transaction_type === 'Income')  remainingEomIncome   += Math.abs(t.amount);
    if (t.transaction_type === 'Expense') remainingEomExpenses += Math.abs(t.amount);
  }

  // Fixed = what's already been paid as recurring + what's still coming this month
  const eomFixedExpenses = mtdRecurringSpent + remainingEomExpenses;

  // Discretionary run rate: pace today's non-recurring spend over full month
  // Floor at actual so projection never drops below what's already spent
  const dailyDiscretionaryRate = dayOfMonth > 0 ? mtdDiscretionarySpent / dayOfMonth : 0;
  const eomDiscretionaryProjected = Math.max(
    mtdDiscretionarySpent,
    dailyDiscretionaryRate * daysInMonth
  );

  const eomTotalExpenses   = eomFixedExpenses + eomDiscretionaryProjected;
  const eomProjectedIncome = mtdIncome + remainingEomIncome;
  const eomProjectedCashFlow = eomProjectedIncome - eomTotalExpenses;

  // Recurring expense progress: total from authoritative recurring list, paid from MTD actuals
  const recurringExpenseCount     = activeRecurringExpenses.length;
  const recurringExpensePaidCount = paidRecurringKeys.size;

  return {
    projectedIncome,
    projectedExpenses,
    projectedNetCashFlow,
    endingCash,
    savingsRate,
    confidence,
    eomProjectedIncome,
    eomFixedExpenses,
    eomDiscretionaryProjected,
    eomTotalExpenses,
    eomProjectedCashFlow,
    recurringExpenseCount,
    recurringExpensePaidCount,
    forecastTransactions,
    cashBalanceSeries,
  };
}
