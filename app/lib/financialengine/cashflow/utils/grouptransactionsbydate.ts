import { Transaction } from '../../../types/transactions';

import { parseFinancialDate }
from '../../time/parsefinancialdate';

export function groupTransactionsByDate(
  transactions: Transaction[]
): Record<string, Transaction[]> {
  const grouped: Record<string, Transaction[]> = {};

  transactions.forEach((transaction) => {
    const dateKey = parseFinancialDate(transaction.date).toDateString();

    if (!grouped[dateKey]) {
      grouped[dateKey] = [];
    }

    grouped[dateKey].push(transaction);
  });

  return grouped;
}