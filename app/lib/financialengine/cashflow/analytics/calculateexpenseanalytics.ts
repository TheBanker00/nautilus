import { Transaction } from '../../../types/transactions';

export type ExpenseAnalytics = {
  totalExpenses: number;

  averageMonthlyExpenses: number;

  largestExpense: number;

  largestExpenseCategory: string;

  expenseTransactionCount: number;

  // NEW STRUCTURAL LAYERS
  recurringExpenses: number;

  oneTimeExpenses: number;

  subscriptionSpend: number;

  fixedSpend: number;

  discretionarySpend: number;
};

export function calculateExpenseAnalytics(
  transactions: Transaction[]
): ExpenseAnalytics {

  const expenseTransactions = transactions.filter(
    t => t.transaction_type === 'Expense'
  );

  const totalExpenses = expenseTransactions.reduce(
    (sum, t) => sum + Math.abs(t.amount),
    0
  );

  // -----------------------------------
  // CORE BUCKETS (TAG DRIVEN)
  // -----------------------------------

  const recurringExpenses = expenseTransactions
    .filter(t => t.tags?.includes('recurring'))
    .reduce((sum, t) => sum + Math.abs(t.amount), 0);

  const subscriptionSpend = expenseTransactions
    .filter(t => t.tags?.includes('subscription'))
    .reduce((sum, t) => sum + Math.abs(t.amount), 0);

  const oneTimeExpenses = expenseTransactions
    .filter(t => !t.tags?.includes('recurring'))
    .reduce((sum, t) => sum + Math.abs(t.amount), 0);

  // -----------------------------------
  // FIXED VS DISCRETIONARY (NEW MODEL)
  // -----------------------------------

  const fixedSpend = expenseTransactions
    .filter(t => t.tags?.includes('recurring'))
    .reduce((sum, t) => sum + Math.abs(t.amount), 0);

  const discretionarySpend = expenseTransactions
    .filter(t => !t.tags?.includes('recurring'))
    .reduce((sum, t) => sum + Math.abs(t.amount), 0);

  // -----------------------------------
  // CATEGORY INSIGHTS (PURELY VISUAL)
  // -----------------------------------

  const categoryTotals: Record<string, number> = {};

  expenseTransactions.forEach(t => {
    const category = t.category || 'other';

    categoryTotals[category] =
      (categoryTotals[category] || 0) + Math.abs(t.amount);
  });

  const largestCategory = Object.entries(categoryTotals)
    .sort((a, b) => b[1] - a[1])[0];

  // -----------------------------------
  // TIME NORMALIZATION
  // -----------------------------------
  const monthsRepresented = Math.max(
    1,
    new Set(
      expenseTransactions.map(t =>
        t.date.slice(0, 7) // YYYY-MM
      )
    ).size
  );

  const averageMonthlyExpenses =
    totalExpenses / monthsRepresented;

  // -----------------------------------
  // RESULT
  // -----------------------------------

  return {
    totalExpenses,

    averageMonthlyExpenses,

    largestExpense: largestCategory?.[1] || 0,

    largestExpenseCategory: largestCategory?.[0] || 'N/A',

    expenseTransactionCount: expenseTransactions.length,

    recurringExpenses,

    oneTimeExpenses,

    subscriptionSpend,

    fixedSpend,

    discretionarySpend,
  };
}
