import { Transaction } from '../../../types/transactions';

type SortDirection = 'asc' | 'desc';

export function sortTransactions(
  transactions: Transaction[],
  sortOrder: SortDirection = 'desc'
): Transaction[] {
  return [...transactions].sort((a, b) => {
    const dateA = new Date(a.date).getTime();
    const dateB = new Date(b.date).getTime();

    if (sortOrder === 'asc') {
      return dateA - dateB;
    }

    return dateB - dateA;
  });
}
