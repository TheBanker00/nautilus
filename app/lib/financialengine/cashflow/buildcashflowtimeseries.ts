import { Transaction }
from '../../types/transactions';

import { parseFinancialDate }
from '../time/parsefinancialdate';

import { DEBT_PAYMENT_CATEGORIES }
from './calculatecashflow';

import {
  format,
  subMonths,
  subQuarters,
  subYears,
} from 'date-fns';

type PeriodType =
  | 'month'
  | 'quarter'
  | 'year';

export function buildCashFlowTimeSeries(

  transactions: Transaction[],

  periodType: PeriodType,

  periods = 6,

  anchorDate: Date = new Date()

) {

  const results: {
    period: string;
    income: number;
    expenses: number;
    debtPayments: number;
    net: number;
    incomeVsExpenses: number;
    savingsRate: number;
    isCurrent: boolean;
  }[] = [];


  const now =
    anchorDate;

  /* -----------------------------------
     BUILD PERIOD WINDOWS
  ----------------------------------- */

  for (
    let i = periods - 1;
    i >= 0;
    i--
  ) {

    let periodDate =
      now;

    if (
      periodType === 'month'
    ) {

      periodDate =
        subMonths(
          now,
          i
        );
    }

    if (
      periodType === 'quarter'
    ) {

      periodDate =
        subQuarters(
          now,
          i
        );
    }

    if (
      periodType === 'year'
    ) {

      periodDate =
        subYears(
          now,
          i
        );
    }

    const month =
      periodDate.getMonth();

    const year =
      periodDate.getFullYear();

    /* -----------------------------------
       FILTER TRANSACTIONS
    ----------------------------------- */

    const periodTransactions =
      transactions.filter(
        transaction => {

          const transactionDate =
            parseFinancialDate(transaction.date);

          const transactionMonth =
            transactionDate.getMonth();

          const transactionYear =
            transactionDate.getFullYear();

          /* ---------------------------
             MONTH
          ---------------------------- */

          if (
            periodType === 'month'
          ) {

            return (
              transactionMonth ===
                month &&

              transactionYear ===
                year
            );
          }

          /* ---------------------------
             QUARTER
          ---------------------------- */

          if (
            periodType === 'quarter'
          ) {

            const currentQuarter =
              Math.floor(
                month / 3
              );

            const transactionQuarter =
              Math.floor(
                transactionMonth / 3
              );

            return (
              currentQuarter ===
                transactionQuarter &&

              transactionYear ===
                year
            );
          }

          /* ---------------------------
             YEAR
          ---------------------------- */

          return (
            transactionYear ===
            year
          );
        }
      );

    /* -----------------------------------
       AGGREGATE
    ----------------------------------- */

    const income =
      periodTransactions
        .filter(
          t =>
            t.transaction_type ===
            'Income' &&
            !t.is_refund
        )
        .reduce(
          (sum, t) =>
            sum +
            Math.abs(
              t.amount || 0
            ),
          0
        );

    const expenses =
      periodTransactions
        .filter(
          t =>
            t.transaction_type ===
            'Expense'
        )
        .reduce(
          (sum, t) =>
            sum +
            Math.abs(
              t.amount || 0
            ),
          0
        );

    // Debt payments (credit card / loan payments) are categorized as
    // Transfer by Plaid, but they're real cash leaving the account.
    const debtPayments =
      periodTransactions
        .filter(
          t =>
            t.transaction_type === 'Transfer' &&
            DEBT_PAYMENT_CATEGORIES.includes(t.category)
        )
        .reduce(
          (sum, t) =>
            sum +
            Math.abs(
              t.amount || 0
            ),
          0
        );

    /* -----------------------------------
       LABELS
    ----------------------------------- */

    let label =
      '';

    if (
      periodType === 'month'
    ) {

      label =
        format(
          periodDate,
          'MMM yy'
        );
    }

    if (
      periodType === 'quarter'
    ) {

      const quarter =
        Math.floor(
          month / 3
        ) + 1;

      label =
        `Q${quarter} ${year}`;
    }

    if (
      periodType === 'year'
    ) {

      label =
        String(year);
    }

    const net = income - expenses - debtPayments;
    const incomeVsExpenses = income - expenses;
    const savingsRate = income > 0 ? Math.round((net / income) * 100) : 0;

    // Flag the current in-progress period so the chart can dim it
    let isCurrent = false;
    if (i === 0) {
      if (periodType === 'month') {
        isCurrent = month === now.getMonth() && year === now.getFullYear();
      } else if (periodType === 'quarter') {
        isCurrent = Math.floor(month / 3) === Math.floor(now.getMonth() / 3) && year === now.getFullYear();
      } else {
        isCurrent = year === now.getFullYear();
      }
    }

    results.push({ period: label, income, expenses, debtPayments, net, incomeVsExpenses, savingsRate, isCurrent });
  }

  return results;
}
