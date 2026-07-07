// financialengine/forecast/types/forecast.ts

export type ForecastTransaction = {
  merchant: string;

  amount: number;

  transaction_type:
    | 'Income'
    | 'Expense';

  expectedDate: string;

  confidence: number;

  type:
    | 'income'
    | 'bill'
    | 'subscription';
};

export type CashBalancePoint = {
  date: string;

  balance: number;
};

export type ForecastResult = {
  // 90-day recurring-based totals
  projectedIncome: number;
  projectedExpenses: number;
  projectedNetCashFlow: number;
  endingCash: number;
  savingsRate: number;
  confidence: number;

  // End-of-month projections
  eomProjectedIncome: number;

  // Fixed = paid recurring actuals + remaining recurring forecast this month
  eomFixedExpenses: number;
  // Discretionary = run-rate projection of non-recurring MTD spend
  eomDiscretionaryProjected: number;
  // Total EOM expenses
  eomTotalExpenses: number;

  eomProjectedCashFlow: number;

  // Recurring expense progress counts for display ("N recurring · Y paid")
  recurringExpenseCount: number;
  recurringExpensePaidCount: number;

  forecastTransactions: ForecastTransaction[];
  cashBalanceSeries: CashBalancePoint[];
};
