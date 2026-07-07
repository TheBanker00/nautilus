import { Transaction }
from '../../types/transactions';

export function getTransactionsByMerchant(
  transactions: Transaction[],
  merchant: string
) {
  return transactions.filter(
    (transaction) =>
      transaction.merchant ===
      merchant
  );
}