import { Transaction }
from '../../types/transactions';

export function aggregateMerchantByPeriod(
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

      const merchant =
        transaction.merchant ||
        'Unknown';

      map[merchant] =
        (map[merchant] || 0) +
        Math.abs(
          transaction.amount
        );

    });

  return Object.entries(map)

    .map(
      ([merchant, total]) => ({

        merchant,

        total,
      })
    )

    .sort(
      (a, b) =>
        b.total - a.total
    );
}
