import { Transaction } from '../../types/transactions';

export function getExpenseTransactions(
  transactions: Transaction[]
): Transaction[] {
  return transactions.filter(
    (transaction) =>
      transaction.transaction_type ===
      'Expense'
  );
}
