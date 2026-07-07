import { Transaction } from '../../../types/transactions';

type FilterOptions = {
  transaction_type?: 'Income' | 'Expense' | 'Transfer';
  category?: string;
  accountId?: string;
  startDate?: string;
  endDate?: string;
};

export function filterTransactions(
  transactions: Transaction[],
  filters: FilterOptions
): Transaction[] {
  return transactions.filter((t) => {
    if (filters.transaction_type && t.transaction_type !== filters.transaction_type) {
      return false;
    }

    if (filters.category && t.category !== filters.category) {
      return false;
    }

    if (filters.accountId && t.accountId !== filters.accountId) {
      return false;
    }

    if (filters.startDate && t.date < filters.startDate) {
      return false;
    }

    if (filters.endDate && t.date > filters.endDate) {
      return false;
    }

    return true;
  });
}
