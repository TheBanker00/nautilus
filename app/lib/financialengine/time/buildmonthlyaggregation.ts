import { Transaction }
from '../../types/transactions';

import {
  startOfMonth,
  endOfMonth,
  eachMonthOfInterval,
  format,
} from 'date-fns';

import { parseFinancialDate }
from './parsefinancialdate';

export type MonthlyAggregation = {
  month: string;

  income: number;

  expenses: number;

  netCashFlow: number;

  transactionCount: number;

  categoryBreakdown:
    Record<string, number>;
};

export function buildMonthlyAggregation(
  transactions: Transaction[]
): MonthlyAggregation[] {

  if (!transactions.length)
    return [];

  const dates =
    transactions.map(
      t => parseFinancialDate(t.date)
    );

  const months =
    eachMonthOfInterval({
      start:
        startOfMonth(
          new Date(
            Math.min(
              ...dates.map(
                d => d.getTime()
              )
            )
          )
        ),

      end:
        endOfMonth(
          new Date(
            Math.max(
              ...dates.map(
                d => d.getTime()
              )
            )
          )
        ),
    });

  return months.map(month => {

    const start =
      startOfMonth(month);

    const end =
      endOfMonth(month);

    const monthlyTransactions =
      transactions.filter(t => {

        const date =
          parseFinancialDate(t.date);

        return (
          date >= start &&
          date <= end
        );
      });

    const income =
      monthlyTransactions
        .filter(
          t =>
            t.transaction_type ===
            'Income' &&
            !t.is_refund
        )
        .reduce(
          (sum, t) =>
            sum + t.amount,
          0
        );

    const expenses =
      monthlyTransactions
        .filter(
          t =>
            t.transaction_type ===
            'Expense'
        )
        .reduce(
          (sum, t) =>
            sum + Math.abs(t.amount),
          0
        );

    const categoryBreakdown:
      Record<string, number> =
      {};

    monthlyTransactions.forEach(
      transaction => {

        const category =
          transaction.category ||
          'Other';

        categoryBreakdown[
          category
        ] =
          (
            categoryBreakdown[
              category
            ] || 0
          ) +
          Math.abs(
            transaction.amount
          );
      }
    );

    return {
      month:
        format(month, 'MMM yyyy'),

      income,

      expenses,

      netCashFlow:
        income - expenses,

      transactionCount:
        monthlyTransactions.length,

      categoryBreakdown,
    };
  });
}
