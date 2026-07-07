import { differenceInCalendarDays }
from 'date-fns';

import { Budget }
from '../../types/budget';

import { Transaction }
from '../../types/transactions';

import { FinancialPeriod }
from '../../types/financialperiod';

export function calculateBudgetPerformance(
  budgets: Budget[],
  transactions: Transaction[],
  period: FinancialPeriod
) {

  const daysRemaining =
    period.daysRemaining || 0;

  const totalDays =
    period.totalDays || 30;

  const elapsedDays =
    totalDays - daysRemaining;

  return budgets.map(budget => {

    const categoryTransactions =
      transactions.filter(
        transaction =>
          transaction.transaction_type ===
            'Expense' &&
          transaction.category ===
            budget.category
      );

    const spent =
      categoryTransactions.reduce(
        (sum, transaction) =>
          sum +
          Math.abs(
            transaction.amount
          ),
        0
      );

    const percentUsed =
      budget.limit > 0
        ? (spent / budget.limit) *
          100
        : 0;

    // -----------------------------------
    // VELOCITY PROJECTION
    // -----------------------------------

    const dailyAverage =
      elapsedDays > 0
        ? spent / elapsedDays
        : 0;

    const projectedSpend =
      dailyAverage * totalDays;

    const projectedVariance =
      budget.limit -
      projectedSpend;

    // -----------------------------------
    // REMAINING
    // -----------------------------------

    const remaining =
      budget.limit - spent;

    const dailyBudgetRemaining =
      daysRemaining > 0
        ? remaining /
          daysRemaining
        : remaining;

    // -----------------------------------
    // STATUS
    // -----------------------------------

    let status:
      | 'safe'
      | 'warning'
      | 'over' = 'safe';

    if (percentUsed >= 100) {
      status = 'over';
    } else if (
      percentUsed >= 80
    ) {
      status = 'warning';
    }

    // -----------------------------------
    // VELOCITY SCORE
    // -----------------------------------

    const expectedSpendRate =
      elapsedDays / totalDays;

    const actualSpendRate =
      spent / budget.limit;

    const velocityScore =
      actualSpendRate -
      expectedSpendRate;

    // -----------------------------------
    // TREND
    // -----------------------------------

    let trend:
      | 'improving'
      | 'stable'
      | 'worsening' =
      'stable';

    if (velocityScore > 0.15) {
      trend = 'worsening';
    }

    if (velocityScore < -0.15) {
      trend = 'improving';
    }

    return {

      category:
        budget.category,

      budgeted:
        budget.limit,

      spent,

      remaining,

      percentUsed,

      projectedSpend,

      projectedVariance,

      daysRemaining,

      dailyBudgetRemaining,

      status,

      velocityScore,

      trend,
    };
  });
}
