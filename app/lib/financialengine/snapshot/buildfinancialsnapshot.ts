import { Transaction }
from '../../types/transactions';

import { FinancialSnapshot }
from '../../types/financialsnapshot';

import {
  aggregateCategoryByPeriod,
} from '../aggregation/aggregatecategorybyperiod';

import {
  aggregateMerchantByPeriod,
} from '../aggregation/aggregatemerchantbyperiod';

import {
  calculateRecurringTransactions,
} from '../cashflow/analytics/calculaterecurringtransactions';

export function buildFinancialSnapshot(
  transactions: Transaction[],
  periodLabel: string
): FinancialSnapshot {

  const incomeTransactions =
    transactions.filter(
      transaction =>
        transaction.transaction_type ===
        'Income' &&
        !transaction.is_refund
    );

  const expenseTransactions =
    transactions.filter(
      transaction =>
        transaction.transaction_type ===
        'Expense'
    );

  // -----------------------------------
  // TOTALS
  // -----------------------------------

  const income =
    incomeTransactions.reduce(
      (sum, transaction) =>
        sum +
        transaction.amount,
      0
    );

  const expenses =
    expenseTransactions.reduce(
      (sum, transaction) =>
        sum +
        Math.abs(
          transaction.amount
        ),
      0
    );

  const netCashFlow =
    income - expenses;

  // -----------------------------------
  // SAVINGS RATE
  // -----------------------------------

  const savingsRate =
    income > 0
      ? (
          (netCashFlow /
            income) *
          100
        )
      : 0;

  // -----------------------------------
  // CATEGORY
  // -----------------------------------

  const categories =
    aggregateCategoryByPeriod(
      transactions
    );

  const topCategory =
    categories[0];

  // -----------------------------------
  // MERCHANTS
  // -----------------------------------

  const merchants =
    aggregateMerchantByPeriod(
      transactions
    );

  const topMerchant =
    merchants[0];

  // -----------------------------------
  // RECURRING
  // -----------------------------------

  const recurring =
    calculateRecurringTransactions(
      transactions
    );

const recurringSpend =
  recurring.reduce(
    (sum, item) =>
      sum +
      (item.monthlyEquivalent || 0),
    0
  );

  const discretionarySpend =
    expenses -
    recurringSpend;

  // -----------------------------------
  // DAILY SPEND
  // -----------------------------------

  const averageDailySpend =
    expenses / 30;

  // -----------------------------------
  // PROJECTED
  // -----------------------------------

  const projectedMonthlySpend =
    averageDailySpend * 30;

  return {

    periodLabel,

    income,

    expenses,

    netCashFlow,

    savingsRate,

    monthlyRecurringSpend: recurringSpend,

    transactionCount:
      transactions.length,

    recurringSpend,

    discretionarySpend,

    topExpenseCategory:
      topCategory
        ?.category || 'N/A',

    topExpenseCategoryAmount:
      topCategory?.total || 0,

    topMerchant:
      topMerchant
        ?.merchant || 'N/A',

    topMerchantSpend:
      topMerchant?.total || 0,

    averageDailySpend,

    projectedMonthlySpend,

    projectedMonthEndBalance:
      income -
      projectedMonthlySpend,
  };
}
