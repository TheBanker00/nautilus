import { Transaction }
from './transactions';

export type RecurringTransaction = {
  merchant: string;

  category: string;

  averageAmount: number;

  frequency:
    | 'weekly'
    | 'biweekly'
    | 'monthly'
    | 'quarterly'
    | 'annual';

  confidenceScore: number;

  nextExpectedDate: string;

  isActive?: boolean;

  lastSeenDate?: string;

  monthlyEquivalent: number;

  annualEquivalent: number;

  transactionCount: number;

  variabilityScore: number;

  amount?: number;

  isSubscription: boolean;

  transaction_type:
    | 'Income'
    | 'Expense';

  transactions: Transaction[];
};
