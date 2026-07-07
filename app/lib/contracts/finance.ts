export type TransactionDTO = {
  id: string;
  date: string;
  amount: number;

  transaction_type: 'Income' | 'Expense' | 'Transfer';

  merchant?: string;
  category?: string;
  accountName?: string;

  tags?: string[];
};

export type CashFlowDTO = {
  totalIncome: number;
  totalExpenses: number;
  netCashFlow: number;
  savingsRate: number;
};

export type CategoryDTO = {
  category: string;
  amount: number;
};

export type MerchantDTO = {
  merchant: string;
  total: number;
  transactionCount: number;
};

export type RecurringDTO = {
  merchant: string;
  totalValue: number;
  confidence: number;
};
