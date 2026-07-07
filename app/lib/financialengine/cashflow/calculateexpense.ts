import { Transaction } from '../../types/transactions';

export function calculateExpense(
  transactions: Transaction[]
) {
  const expenseTransactions =
    transactions.filter(
      (transaction) =>
        transaction.transaction_type ===
        'Expense'
    );

  const totalExpenses =
    expenseTransactions.reduce(
      (sum, transaction) =>
        sum + Math.abs(transaction.amount),
      0
    );

  const groupedExpenses =
    expenseTransactions.reduce(
      (
        acc: Record<string, number>,
        transaction
      ) => {
        const category =
          transaction.category;

        acc[category] =
          (acc[category] || 0) +
          Math.abs(transaction.amount);

        return acc;
      },
      {}
    );

  return {
    totalExpenses,
    groupedExpenses,
    expenseTransactions,
  };
}
