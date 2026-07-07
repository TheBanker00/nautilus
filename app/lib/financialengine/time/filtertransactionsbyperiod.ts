import { isWithinInterval }
from 'date-fns';

import { Transaction }
from '../../types/transactions';

import { FinancialPeriod }
from '../../types/financialperiod';

import { parseFinancialDate }
from './parsefinancialdate';

export function filterTransactionsByPeriod(
  transactions: Transaction[],
  period: FinancialPeriod
) {

  return transactions.filter(
    transaction => {

      const date =
        parseFinancialDate(transaction.date);

      return isWithinInterval(
        date,
        {
          start:
            period.startDate,
          end:
            period.endDate,
        }
      );
    }
  );
}