import { Transaction }
from '../../types/transactions';

export function getTransactionsByCategory(
  transactions: Transaction[],
  category: string
) {
  return transactions.filter(
    (transaction) =>
      transaction.category ===
      category
  );
}