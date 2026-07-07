'use client';

import { useMemo } from 'react';
import { useTransactionData } from '../transactioncontext';
import { useFinancialData as useWealthData } from '../financialdatacontext';

import { normalizeTransaction } from '../financialengine/normalization/normalizetransactions';
import { calculateRecurringTransactions } from '../financialengine/cashflow/analytics/calculaterecurringtransactions';
import { applyRecurringTags } from '../financialengine/recurring/applyrecurringtags';

import { calculateCashFlow } from '../financialengine/cashflow/calculatecashflow';
import { calculateExpenseAnalytics } from '../financialengine/cashflow/analytics/calculateexpenseanalytics';
import { calculateIncomeAnalytics } from '../financialengine/cashflow/analytics/calculateincomeanalytics';

import { calculateForecastAnalytics } from '../financialengine/forecast/calculateforecastanalytics';

export function useFinancialData() {
  const { transactions, loading, error, refresh } = useTransactionData();
  const { currentSnapshot } = useWealthData();

  return useMemo(() => {
    const raw = transactions;

    const normalizedTransactions =
      raw.map(normalizeTransaction);

    const recurringTransactions =
      calculateRecurringTransactions(normalizedTransactions);

    const taggedTransactions =
      applyRecurringTags(
        normalizedTransactions,
        recurringTransactions
      );

    const cashflow =
      calculateCashFlow(taggedTransactions);

    const expenseAnalytics =
      calculateExpenseAnalytics(taggedTransactions);

    const incomeAnalytics =
      calculateIncomeAnalytics(taggedTransactions);

    // Actual cash balance from Plaid account balances (sum of bank/checking/savings accounts)
    const sumBal = (arr: any[]) => arr.reduce((t: number, a: any) => t + Number(a.balance || 0), 0);
    const startingCash = currentSnapshot
      ? sumBal(currentSnapshot.bankAccounts)
      : cashflow.totalIncome - cashflow.totalExpenses;

    // MTD totals — current calendar month, computed once here for reuse across pages
    const now = new Date();
    const currentYM = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    let mtdIncome = 0, mtdSpent = 0;
    for (const t of taggedTransactions) {
      if (!t.date?.startsWith(currentYM)) continue;
      if (t.transaction_type === 'Income')  mtdIncome += Math.abs(Number(t.amount || 0));
      if (t.transaction_type === 'Expense') mtdSpent  += Math.abs(Number(t.amount || 0));
    }
    const mtdSaved = mtdIncome - mtdSpent;

    const forecastAnalytics =
      calculateForecastAnalytics(
        taggedTransactions,
        recurringTransactions,
        startingCash
      );

    return {
      rawTransactions: raw,
      normalizedTransactions,
      transactions: taggedTransactions,
      recurringTransactions,
      cashflow,
      expenseAnalytics,
      incomeAnalytics,
      forecastAnalytics,
      startingCash,
      mtdIncome,
      mtdSpent,
      mtdSaved,
      loading,
      error,
      refresh,
    };
  }, [transactions, loading, error, currentSnapshot]);
}