import { Transaction }
from '../../types/transactions';

import {
  calculateExpenseAnalytics,
} from '../cashflow/analytics/calculateexpenseanalytics';

import {
  calculateCategorySpending,
} from '../cashflow/analytics/calculatecategoryspending';


export function buildExpenseSnapshot(
  transactions: Transaction[]
) {

  /* -----------------------------------
     CORE ANALYTICS
  ----------------------------------- */

  const analytics =
    calculateExpenseAnalytics(
      transactions
    );

  const categories =
    calculateCategorySpending(
      transactions
    );


  /* -----------------------------------
     ACTUAL RECURRING SPEND
     WITHIN CURRENT FILTERED PERIOD

     IMPORTANT:
     We do NOT want monthlyEquivalent
     here because the expense page
     should reflect ACTUAL spend
     inside the selected period.

     Example:
     - quarterly bill should show
       actual quarterly payment
       when it occurred
     - annual bill should show
       actual annual payment
     - not normalized monthly value
  ----------------------------------- */

const recurringSpend =
  transactions

    .filter(
      transaction =>

        transaction.transaction_type ===
          'Expense' &&

        transaction.isRecurring
    )

    .reduce(
      (sum, transaction) =>

        sum +
        Math.abs(
          transaction.amount || 0
        ),

      0
    );

  /* -----------------------------------
     VARIABLE / DISCRETIONARY
  ----------------------------------- */

  const variableSpend =
    analytics.totalExpenses -
    recurringSpend;

  /* -----------------------------------
     RETURN
  ----------------------------------- */

  return {

    analytics,

    categories,

    recurringSpend,

    variableSpend,

  };

}
