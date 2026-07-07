import { Transaction } from '../../types/transactions';

import { parseFinancialDate }
from '../time/parsefinancialdate';

export type Filters = {
  period?: {
    startDate: Date;
    endDate: Date;
    label?: string;
  };

  category?: string;
  merchant?: string;
  keyword?: string;
};

export function buildExpenseQuery(
  transactions: Transaction[],
  filters: Filters
) {

  return transactions.filter((transaction) => {

    if (transaction.transaction_type !== 'Expense') {
      return false;
    }

    const transactionDate = parseFinancialDate(transaction.date);

    /* -----------------------------------
       PERIOD FILTER (SINGLE SOURCE OF TRUTH)
    ----------------------------------- */

    if (filters.period) {

      const { startDate, endDate } = filters.period;

      if (
        transactionDate < startDate ||
        transactionDate > endDate
      ) {
        return false;
      }
    }

    /* -----------------------------------
       CATEGORY FILTER
    ----------------------------------- */

    if (
      filters.category &&
      filters.category !== 'all'
    ) {
      if (transaction.category !== filters.category) {
        return false;
      }
    }

    /* -----------------------------------
       MERCHANT FILTER
    ----------------------------------- */

    if (filters.merchant) {

      const merchant = (transaction.merchant || '')
        .toLowerCase();

      if (
        !merchant.includes(
          filters.merchant.toLowerCase()
        )
      ) {
        return false;
      }
    }

    /* -----------------------------------
       KEYWORD FILTER
    ----------------------------------- */

    if (filters.keyword) {

      const keyword = filters.keyword.toLowerCase();

      const searchBlob = `
        ${transaction.name || ''}
        ${transaction.merchant || ''}
        ${transaction.category || ''}
      `.toLowerCase();

      if (!searchBlob.includes(keyword)) {
        return false;
      }
    }

    return true;
  });
}
