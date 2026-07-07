export type CashFlowMetrics = {
  totalIncome: number;
  totalExpenses: number;
  netCashFlow: number;
  savingsRate: number;
};

export type CashFlowKPIs = {
  monthlyIncome: number;
  monthlyExpenses: number;
  netCashFlow: number;
  savingsRate: number;
  rolling30DayAverage: number;
};