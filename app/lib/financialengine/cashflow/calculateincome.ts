import { Transaction } from '../../types/transactions';

export function calculateIncome(
  transactions: Transaction[]
) {
  const incomeTransactions =
    transactions.filter(
      (transaction) =>
        transaction.transaction_type ===
        'Income' &&
        !transaction.is_refund
    );

  const totalIncome =
    incomeTransactions.reduce(
      (sum, transaction) =>
        sum + transaction.amount,
      0
    );

  const groupedIncome =
    incomeTransactions.reduce(
      (
        acc: Record<string, number>,
        transaction
      ) => {
        const category =
          transaction.category;

        acc[category] =
          (acc[category] || 0) +
          transaction.amount;

        return acc;
      },
      {}
    );

  return {
    totalIncome,
    groupedIncome,
    incomeTransactions,
  };
}
