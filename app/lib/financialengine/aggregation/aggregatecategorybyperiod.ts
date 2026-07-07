import { Transaction }
from '../../types/transactions';

export function aggregateCategoryByPeriod(
  transactions: Transaction[]
) {

  const map:
    Record<string, number> = {};

  transactions
    .filter(
      transaction =>
        transaction.transaction_type ===
        'Expense'
    )
    .forEach(transaction => {

      const category =
        transaction.category ||
        'Other';

      map[category] =
        (map[category] || 0) +
        Math.abs(
          transaction.amount
        );

    });

  return Object.entries(map)

    .map(
      ([category, total]) => ({

        category,

        total,
      })
    )

    .sort(
      (a, b) =>
        b.total - a.total
    );
}
