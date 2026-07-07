import { Transaction } from './../../types/transactions';

export function getIncomeTransactions(
  transactions: Transaction[]
): Transaction[] {
  return transactions.filter(
    (transaction) =>
      transaction.transaction_type ===
      'Income' &&
      !transaction.is_refund
  );
}
