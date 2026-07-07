import { Transaction }
from '../../../types/transactions';

export type CategorySpending = {
  category: string;

  total: number;

  transactionCount: number;

  averageTransaction: number;

  percentOfTotal: number;
};

export function calculateCategorySpending(
  transactions: Transaction[],
  top?: number
): CategorySpending[] {

  // -----------------------------------
  // EXPENSE TRANSACTIONS ONLY
  // -----------------------------------
  const expenseTransactions =
    transactions.filter(
      (transaction) =>
        transaction.transaction_type ===
        'Expense'
    );

  // -----------------------------------
  // TOTAL EXPENSE SPEND
  // -----------------------------------
  const totalExpenseSpend =
    expenseTransactions.reduce(
      (sum, transaction) =>
        sum +
        Math.abs(transaction.amount),
      0
    );

  // -----------------------------------
  // CATEGORY MAP
  // -----------------------------------
  const categoryMap:
    Record<
      string,
      {
        total: number;
        transactionCount: number;
      }
    > = {};

  expenseTransactions.forEach(
    (transaction) => {

    const category = transaction.category ?? 'Other';

      if (!categoryMap[category]) {
        categoryMap[category] = {
          total: 0,
          transactionCount: 0,
        };
      }

      categoryMap[category].total +=
        Math.abs(transaction.amount);

      categoryMap[
        category
      ].transactionCount += 1;
    }
  );

  // -----------------------------------
  // FINAL ANALYTICS
  // -----------------------------------
  const results = Object.entries(
    categoryMap
  )
    .map(
      ([
        category,
        values,
      ]) => {

        const averageTransaction =
          values.transactionCount > 0
            ? values.total /
              values.transactionCount
            : 0;

        const percentOfTotal =
          totalExpenseSpend > 0
            ? Number(
                (
                  (values.total /
                    totalExpenseSpend) *
                  100
                ).toFixed(1)
              )
            : 0;

        return {
          category,

          total:
            values.total,

          transactionCount:
            values.transactionCount,

          averageTransaction,

          percentOfTotal,
        };
      }
    )

    .sort(
      (a, b) =>
        b.total - a.total
    );

  // -----------------------------------
  // OPTIONAL TOP N
  // -----------------------------------
  if (top) {
    return results.slice(0, top);
  }

  return results;
}
