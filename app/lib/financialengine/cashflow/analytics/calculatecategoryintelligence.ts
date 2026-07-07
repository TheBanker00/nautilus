import { Transaction }
from '../../../types/transactions';

import {
  ExpenseCategory,
} from '../../../types/categories';


import {
  CATEGORY_COLORS,
} from '../../../../components/finance/expensecategorycolors';

export type CategoryIntelligence = {

  category: ExpenseCategory;

  color: string;

  transactionCount: number;

  currentSpend: number;

  priorSpend: number;

  changeAmount: number;

  percentChange: number;

  ytdSpend: number;

};

export function calculateCategoryIntelligence(

  currentTransactions: Transaction[],

  priorTransactions: Transaction[],

  ytdTransactions: Transaction[]

): CategoryIntelligence[] {

  /* -----------------------------------
     CATEGORY MAP
  ----------------------------------- */

  const categoryMap:
    Record<
      string,
      CategoryIntelligence
    > = {};

  /* -----------------------------------
     INITIALIZE ALL CATEGORIES
  ----------------------------------- */

  Object.entries(
    CATEGORY_COLORS
  ).forEach(
    ([category, color]) => {

      categoryMap[category] = {

        category:
          category as ExpenseCategory,

        color,

        transactionCount: 0,

        currentSpend: 0,

        priorSpend: 0,

        changeAmount: 0,

        percentChange: 0,

        ytdSpend: 0,

      };

    }
  );

  /* -----------------------------------
     CURRENT PERIOD
  ----------------------------------- */

  currentTransactions
    .filter(
      t =>
        t.transaction_type ===
        'Expense'
    )
    .forEach(transaction => {

      const category =
        categoryMap[transaction.category] ? transaction.category : 'Miscellaneous';

      const amount =
        Math.abs(
          transaction.amount || 0
        );

      categoryMap[
        category
      ].currentSpend += amount;

      categoryMap[
        category
      ].transactionCount += 1;

    });

  /* -----------------------------------
     PRIOR PERIOD
  ----------------------------------- */

  priorTransactions
    .filter(
      t =>
        t.transaction_type ===
        'Expense'
    )
    .forEach(transaction => {

      const category =
        categoryMap[transaction.category] ? transaction.category : 'Miscellaneous';

      const amount =
        Math.abs(
          transaction.amount || 0
        );

      categoryMap[
        category
      ].priorSpend += amount;

    });

  /* -----------------------------------
     YTD
  ----------------------------------- */

  ytdTransactions
    .filter(
      t =>
        t.transaction_type ===
        'Expense'
    )
    .forEach(transaction => {

      const category =
        categoryMap[transaction.category] ? transaction.category : 'Miscellaneous';

      const amount =
        Math.abs(
          transaction.amount || 0
        );

      categoryMap[
        category
      ].ytdSpend += amount;

    });

  /* -----------------------------------
     FINAL CALCULATIONS
  ----------------------------------- */

  const results =
    Object.values(
      categoryMap
    ).map(category => {

      const changeAmount =
        category.currentSpend -
        category.priorSpend;

      const percentChange =
        category.priorSpend > 0

          ? (
              (
                changeAmount /
                category.priorSpend
              ) * 100
            )

          : 0;

      return {

        ...category,

        changeAmount,

        percentChange,

      };

    });

  /* -----------------------------------
     SORT DESC
  ----------------------------------- */

  return results.sort(
    (a, b) =>

      b.currentSpend -
      a.currentSpend
  );

}
