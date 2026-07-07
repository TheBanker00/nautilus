export type FinancialSnapshot = {

  periodLabel: string;

  income: number;

  expenses: number;

  netCashFlow: number;

  savingsRate: number;

  transactionCount: number;

  recurringSpend: number;

  discretionarySpend: number;

  topExpenseCategory: string;

  topExpenseCategoryAmount: number;

  topMerchant: string;

  topMerchantSpend: number;

  averageDailySpend: number;

  projectedMonthlySpend: number;

  projectedMonthEndBalance: number;

  totalAssets?: number;

  totalLiabilities?: number;

  netWorth?: number;

  investmentContributions?: number;

  investmentIncome?: number;

  monthlyRecurringSpend: number;
};